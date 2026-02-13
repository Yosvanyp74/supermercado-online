export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PROCESSING: 'Em preparação',
  READY_FOR_PICKUP: 'Pronto para retirada',
  OUT_FOR_DELIVERY: 'Saiu para entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão de crédito',
  DEBIT_CARD: 'Cartão de débito',
  PIX: 'PIX',
  TRANSFER: 'Transferência',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  APPROVED: 'Aprovado',
  DECLINED: 'Recusado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  ASSIGNED: 'Atribuído',
  PICKED_UP: 'Coletado',
  IN_TRANSIT: 'Em trânsito',
  DELIVERED: 'Entregue',
  FAILED: 'Falhou',
  RETURNED: 'Devolvido',
};

export const PICKING_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  ASSIGNED: 'Atribuído',
  PICKING: 'Coletando',
  PICKED: 'Coletado',
  READY: 'Pronto',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  OUT_OF_STOCK: 'Sem estoque',
  DISCONTINUED: 'Descontinuado',
};
