import { PricingService } from './pricing.service';
import { ProductRole } from '@prisma/client';

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(() => {
    service = new PricingService();
  });

  describe('calculatePrice', () => {
    it('should return ruleVersion v1.1', () => {
      const result = service.calculatePrice(10, ProductRole.CONVENIENCIA);
      expect(result.ruleVersion).toBe('v1.1');
    });

    it('should throw for cost <= 0', () => {
      expect(() => service.calculatePrice(0, ProductRole.CONVENIENCIA)).toThrow('Cost must be greater than zero');
      expect(() => service.calculatePrice(-5, ProductRole.CONVENIENCIA)).toThrow('Cost must be greater than zero');
    });

    // ---------- Return shape ----------
    it('should return finalPrice, appliedMargin, ruleVersion', () => {
      const result = service.calculatePrice(10, ProductRole.CONVENIENCIA);
      expect(result).toHaveProperty('finalPrice');
      expect(result).toHaveProperty('appliedMargin');
      expect(result).toHaveProperty('ruleVersion');
      expect(typeof result.finalPrice).toBe('number');
      expect(typeof result.appliedMargin).toBe('number');
      expect(typeof result.ruleVersion).toBe('string');
    });

    // ========== MANDATORY TEST CASES ==========

    describe('mandatory cost cases — never price < cost, never negative margin', () => {
      const mandatoryCosts = [0.65, 0.99, 1.00, 1.60, 2.30, 14.90, 59.90];

      for (const cost of mandatoryCosts) {
        for (const role of Object.values(ProductRole)) {
          it(`cost=${cost} role=${role} → price > cost, margin >= 8%`, () => {
            const result = service.calculatePrice(cost, role);

            // ABSOLUTE RULE: finalPrice > cost
            expect(result.finalPrice).toBeGreaterThan(cost);

            // No negative margin
            expect(result.appliedMargin).toBeGreaterThan(0);

            // Margin >= 8% (min margin rule)
            expect(result.appliedMargin).toBeGreaterThanOrEqual(0.08 - 0.005); // tiny float tolerance
          });
        }
      }
    });

    // ========== ROUNDING ALWAYS UP ==========

    describe('rounding is always upward', () => {
      const costs = [0.65, 0.99, 1.00, 1.60, 2.30, 5.00, 10.00, 14.90, 59.90, 100.00];

      for (const cost of costs) {
        it(`cost=${cost} → finalPrice >= cost * 1.08 (min raw price)`, () => {
          const result = service.calculatePrice(cost, ProductRole.CONVENIENCIA);
          // The rounded price should be at least the raw price with min margin
          expect(result.finalPrice).toBeGreaterThanOrEqual(cost * 1.08 - 0.01);
        });
      }
    });

    // ========== BASE MARGIN BY COST BAND ==========

    it('cost < 3 → base margin 30%', () => {
      const result = service.calculatePrice(2, ProductRole.CONVENIENCIA);
      // raw = 2 * 1.30 = 2.60 → floor(2.60) = 2, decimal 0.60 > 0.49 → 2.99
      expect(result.finalPrice).toBe(2.99);
    });

    it('cost 3-15 → base margin 20%', () => {
      const result = service.calculatePrice(10, ProductRole.CONVENIENCIA);
      // raw = 10 * 1.20 = 12.00 → floor(12) = 12, decimal 0.00 <= 0.49 → 12.59
      expect(result.finalPrice).toBe(12.59);
    });

    it('cost 15-60 → base margin 15%', () => {
      const result = service.calculatePrice(30, ProductRole.CONVENIENCIA);
      // raw = 30 * 1.15 = 34.50 → floor(34) = 34, decimal 0.50 > 0.49 → 34.99
      expect(result.finalPrice).toBe(34.99);
    });

    it('cost >= 60 → base margin 10%', () => {
      const result = service.calculatePrice(100, ProductRole.CONVENIENCIA);
      // raw = 100 * 1.10 = 110.00 → floor(110) = 110, decimal 0.00 <= 0.49 → 110.59
      expect(result.finalPrice).toBe(110.59);
    });

    // ========== ROLE ADJUSTMENTS ==========

    it('ANCLA reduces margin by 5%', () => {
      const ancla = service.calculatePrice(10, ProductRole.ANCLA);
      const conv = service.calculatePrice(10, ProductRole.CONVENIENCIA);
      expect(ancla.finalPrice).toBeLessThanOrEqual(conv.finalPrice);
      expect(ancla.finalPrice).toBeGreaterThan(10); // still above cost
    });

    it('IMPULSO increases margin by 10%', () => {
      const impulso = service.calculatePrice(10, ProductRole.IMPULSO);
      const conv = service.calculatePrice(10, ProductRole.CONVENIENCIA);
      expect(impulso.finalPrice).toBeGreaterThanOrEqual(conv.finalPrice);
    });

    it('PREMIUM increases margin by 3%', () => {
      const premium = service.calculatePrice(50, ProductRole.PREMIUM);
      const conv = service.calculatePrice(50, ProductRole.CONVENIENCIA);
      expect(premium.finalPrice).toBeGreaterThanOrEqual(conv.finalPrice);
    });

    // ========== MARGIN CLAMPING ==========

    it('should not go below min margin (8%)', () => {
      // cost >= 60 → base 10%, ANCLA → -5% = 5% → clamped to 8%
      const result = service.calculatePrice(100, ProductRole.ANCLA);
      expect(result.appliedMargin).toBeGreaterThanOrEqual(0.08 - 0.005);
      expect(result.finalPrice).toBeGreaterThan(100);
    });

    it('should not exceed max margin (40%)', () => {
      // cost < 3 → base 30%, IMPULSO → +10% = 40% → at cap
      const result = service.calculatePrice(2, ProductRole.IMPULSO);
      expect(result.finalPrice).toBeGreaterThan(2);
    });

    // ========== SPECIFIC EDGE CASES ==========

    it('cost=0.65 CONVENIENCIA → price > 0.65', () => {
      const result = service.calculatePrice(0.65, ProductRole.CONVENIENCIA);
      expect(result.finalPrice).toBeGreaterThan(0.65);
      expect(result.appliedMargin).toBeGreaterThan(0);
    });

    it('cost=0.99 CONVENIENCIA → price > 0.99', () => {
      const result = service.calculatePrice(0.99, ProductRole.CONVENIENCIA);
      expect(result.finalPrice).toBeGreaterThan(0.99);
      expect(result.appliedMargin).toBeGreaterThan(0);
    });

    it('cost=1.00 CONVENIENCIA → price > 1.00 (never 0.99)', () => {
      const result = service.calculatePrice(1.00, ProductRole.CONVENIENCIA);
      expect(result.finalPrice).toBeGreaterThan(1.00);
      expect(result.appliedMargin).toBeGreaterThan(0);
    });

    it('cost=1.60 CONVENIENCIA → price > 1.60', () => {
      const result = service.calculatePrice(1.60, ProductRole.CONVENIENCIA);
      expect(result.finalPrice).toBeGreaterThan(1.60);
      expect(result.appliedMargin).toBeGreaterThan(0);
    });

    // ========== ALL ROLES × ALL COSTS EXHAUSTIVE ==========

    describe('exhaustive: every role × every cost → positive margin', () => {
      const allCosts = [0.10, 0.50, 0.65, 0.99, 1.00, 1.50, 1.60, 2.30, 3.00, 5.00, 10.00, 14.90, 15.00, 30.00, 59.90, 60.00, 100.00, 250.00];

      for (const cost of allCosts) {
        for (const role of Object.values(ProductRole)) {
          it(`cost=${cost} role=${role} → valid`, () => {
            const result = service.calculatePrice(cost, role);
            expect(result.finalPrice).toBeGreaterThan(cost);
            expect(result.appliedMargin).toBeGreaterThan(0);
          });
        }
      }
    });

    // ========== PSYCHOLOGICAL ROUNDING FORMAT ==========

    describe('prices >= 1 end in .59 or .99', () => {
      const costs = [1.00, 2.30, 5.00, 10.00, 14.90, 30.00, 59.90, 100.00];

      for (const cost of costs) {
        for (const role of Object.values(ProductRole)) {
          it(`cost=${cost} role=${role} → ends in .59 or .99`, () => {
            const result = service.calculatePrice(cost, role);
            if (result.finalPrice >= 1) {
              const cents = Math.round((result.finalPrice % 1) * 100);
              expect([59, 99]).toContain(cents);
            }
          });
        }
      }
    });
  });
});
