import { SellerService } from './seller.service';
import { OrderStatus } from '@prisma/client';

describe('SellerService', () => {
  let service: SellerService;
  let mockPrisma: any;
  let mockNotifications: any;

  beforeEach(() => {
    mockPrisma = {
      order: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    mockNotifications = {
      notifyItemPicked: jest.fn(),
      notifyPickingCompleted: jest.fn(),
    };

    service = new SellerService(mockPrisma as any, mockNotifications as any);
  });

  describe('getOrders', () => {
    it('should include sellerId in the where clause', async () => {
      await service.getOrders('seller123', 'all');
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sellerId: 'seller123',
          }),
        }),
      );
    });

    it('should translate "pending" filter to CONFIRMED status', async () => {
      await service.getOrders('x', 'pending');
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: [OrderStatus.CONFIRMED] },
          }),
        }),
      );
    });

    it('should translate "picking" filter to PROCESSING status', async () => {
      await service.getOrders('x', 'picking');
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: [OrderStatus.PROCESSING] },
          }),
        }),
      );
    });

    it('should default to both statuses when filter is not recognised', async () => {
      // calling without filter should trigger default path (same as 'all')
      await service.getOrders('x');
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING] },
          }),
        }),
      );
    });

    it('fallbacks to orders if no picking orders exist', async () => {
      // simulate pickingOrders returning empty
      mockPrisma.pickingOrder = { findMany: jest.fn().mockResolvedValue([]) };
      // when fallback occurs we expect a secondary query to the order table
      mockPrisma.order = {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'o1',
            orderNumber: '123',
            fulfillmentType: 'DELIVERY',
            total: 10,
            createdAt: new Date(),
            status: 'CONFIRMED',
            customer: { id: 'c', firstName: 'A', lastName: 'B' },
            items: [{ id: 'i1' }],
          },
        ]),
      };

      const result = await service.getMyPickingOrders('seller123');
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { sellerId: 'seller123' } }),
      );
      // returned object should be mapped into the lightweight shape
      expect(result).toEqual([
        expect.objectContaining({
          id: 'o1',
          orderNumber: '123',
          total: 10,
          itemCount: 1,
        }),
      ]);
    });
  });

  describe('getOrderDetail', () => {
    it('throws if order not found', async () => {
      mockPrisma.order.findUnique = jest.fn().mockResolvedValue(null);
      await expect(service.getOrderDetail('xyz')).rejects.toThrow('Pedido não encontrado');
    });

    it('returns the order when found', async () => {
      const fake = { id: 'o1', customer: { name: 'Foo', phone: '123' }, items: [] };
      mockPrisma.order.findUnique = jest.fn().mockResolvedValue(fake);
      const result = await service.getOrderDetail('o1');
      expect(result).toBe(fake);
    });
  });

  describe('markItemPicked notifications', () => {
    it('calls notificationsService.notifyItemPicked', async () => {
      // prepare a fake item and pickingOrder
      mockPrisma.pickingItem = {
        findUnique: jest.fn().mockResolvedValue({
          id: 'item1',
          quantity: 1,
          product: { name: 'Prod' },
          isPicked: false,
          pickingOrder: { pickedItems: 0, totalItems: 1, orderId: 'order1', sellerId: 'seller1' },
          pickingOrderId: 'po1',
        }),
        update: jest.fn().mockResolvedValue({}),
      };
      mockPrisma.pickingOrder = {
        update: jest.fn().mockResolvedValue({}),
      };

      await service.markItemPicked('item1', 'seller1');
      expect(mockNotifications.notifyItemPicked).toHaveBeenCalledWith({
        orderId: 'order1',
        itemId: 'item1',
        productName: 'Prod',
      });
    });
  });
});
