export enum Role {
  CUSTOMER = 'CUSTOMER',
  SELLER = 'SELLER',
  DELIVERY = 'DELIVERY',
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.CUSTOMER]: 0,
  [Role.DELIVERY]: 1,
  [Role.SELLER]: 2,
  [Role.EMPLOYEE]: 3,
  [Role.MANAGER]: 4,
  [Role.ADMIN]: 5,
};

export const ROLE_LABELS: Record<Role, string> = {
  [Role.CUSTOMER]: 'Cliente',
  [Role.SELLER]: 'Vendedor',
  [Role.DELIVERY]: 'Entregador',
  [Role.EMPLOYEE]: 'Funcionário',
  [Role.MANAGER]: 'Gerente',
  [Role.ADMIN]: 'Administrador',
};

export const SELLER_PERMISSIONS = {
  CREATE_SALE: 'seller:create_sale',
  VIEW_STOCK: 'seller:view_stock',
  SEARCH_CUSTOMER: 'seller:search_customer',
  CREATE_CUSTOMER: 'seller:create_customer',
  APPLY_DISCOUNT: 'seller:apply_discount',
  APPLY_LARGE_DISCOUNT: 'seller:apply_large_discount',
  PROCESS_REFUND: 'seller:process_refund',
  SUSPEND_SALE: 'seller:suspend_sale',
  VIEW_SALES_HISTORY: 'seller:view_sales_history',
  ACCEPT_ORDER: 'seller:accept_order',
  PICK_ORDER: 'seller:pick_order',
} as const;
