/**
 * Generate a slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate a random order number
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${timestamp}${random}`;
}

/**
 * Calculate time ago from date
 */
export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return 'Agora mesmo';
  if (seconds < 3600) return `Há ${Math.floor(seconds / 60)} minutos`;
  if (seconds < 86400) return `Há ${Math.floor(seconds / 3600)} horas`;
  if (seconds < 604800) return `Há ${Math.floor(seconds / 86400)} dias`;
  return new Intl.DateTimeFormat('pt-BR').format(d);
}

/**
 * Delay execution
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if a value is empty
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercentage(originalPrice: number, discountedPrice: number): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

/**
 * Calculate order totals
 */
export function calculateOrderTotals(items: { unitPrice: number; quantity: number; discount?: number }[]) {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.unitPrice * item.quantity - (item.discount || 0));
  }, 0);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
