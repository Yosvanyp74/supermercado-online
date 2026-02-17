import { Injectable } from '@nestjs/common';
import { ProductRole } from '@prisma/client';

export interface PricingResult {
  finalPrice: number;
  appliedMargin: number;
  ruleVersion: string;
}

const RULE_VERSION = 'v1.1';

// Margin bands by cost range
const COST_MARGIN_BANDS = [
  { maxCost: 3, margin: 0.30 },
  { maxCost: 15, margin: 0.20 },
  { maxCost: 60, margin: 0.15 },
  { maxCost: Infinity, margin: 0.10 },
];

// Role adjustments
const ROLE_ADJUSTMENTS: Record<ProductRole, number> = {
  [ProductRole.ANCLA]: -0.05,
  [ProductRole.CONVENIENCIA]: 0,
  [ProductRole.IMPULSO]: 0.10,
  [ProductRole.PREMIUM]: 0.03,
};

const MIN_MARGIN = 0.08;
const MAX_MARGIN = 0.40;

@Injectable()
export class PricingService {
  /**
   * Pure pricing function — calculates final price from cost and strategic role.
   * Deterministic: same inputs always produce same output.
   * RULE: finalPrice is ALWAYS > cost. Never generates negative margins.
   */
  calculatePrice(cost: number, role: ProductRole): PricingResult {
    if (cost <= 0) {
      throw new Error('Cost must be greater than zero');
    }

    // 1. Base margin by cost band
    const band = COST_MARGIN_BANDS.find((b) => cost < b.maxCost)!;
    let margin = band.margin;

    // 2. Role adjustment
    margin += ROLE_ADJUSTMENTS[role];

    // 3. Clamp to [MIN_MARGIN, MAX_MARGIN]
    margin = Math.max(MIN_MARGIN, Math.min(MAX_MARGIN, margin));

    // 4. Calculate raw price (pre-rounding)
    const pricePreRound = cost * (1 + margin);

    // 5. Safe psychological rounding (NEVER rounds below cost)
    const finalPrice = this.safeRound(pricePreRound, cost);

    // 6. Recalculate actual applied margin after rounding
    const actualMargin = (finalPrice - cost) / cost;

    // 7. Final safety check — this should never trigger given safeRound, but guarantees correctness
    if (finalPrice <= cost) {
      throw new Error('Pricing calculation invalid: price below cost');
    }

    return {
      finalPrice,
      appliedMargin: Math.round(actualMargin * 10000) / 10000, // 4 decimal places
      ruleVersion: RULE_VERSION,
    };
  }

  /**
   * Safe psychological rounding — always rounds UP to the next
   * psychological price point, never down. Guarantees result > cost.
   *
   * For prices < 1: ceil to next tenth (e.g. 0.85 → 0.90)
   * For prices >= 1: round up to next .59 or .99
   *
   * If the rounded value is <= cost, adds a safety bump above cost.
   */
  private safeRound(pricePreRound: number, cost: number): number {
    let rounded: number;

    if (pricePreRound < 1) {
      // Sub-unit items: ceil to next tenth
      rounded = Math.ceil(pricePreRound * 10) / 10;
    } else {
      const decimal = pricePreRound % 1;
      const intPart = Math.floor(pricePreRound);

      if (decimal <= 0.49) {
        rounded = intPart + 0.59;
      } else {
        rounded = intPart + 0.99;
      }
    }

    // Safety net: if rounding caused price to be <= cost, bump above cost
    if (rounded <= cost) {
      rounded = Number((Math.ceil(cost * 100) / 100 + 0.05).toFixed(2));
    }

    return Number(rounded.toFixed(2));
  }
}
