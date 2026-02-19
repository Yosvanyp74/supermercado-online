/**
 * Configuración de entorno de la app.
 *
 * ⚠️  Cambia DEV_MACHINE_IP a la IP de tu Mac cuando cambies de red:
 *   - Casa:        192.168.0.3
 *   - Stok Center: 10.43.101.154
 *   - iPhone:      172.20.10.3
 */
export const DEV_MACHINE_IP = '10.43.101.154';

export const DEV_API_URL = `http://${DEV_MACHINE_IP}:3000/api`;
export const DEV_SERVER_URL = `http://${DEV_MACHINE_IP}:3000`;

export const API_BASE_URL = __DEV__
  ? DEV_API_URL
  : 'https://api.supermercado.com/api';

export const SERVER_URL = __DEV__
  ? DEV_SERVER_URL
  : 'https://api.supermercado.com';

/**
 * Construye la URL completa para una imagen del servidor.
 * Si la URL ya es absoluta (http/https), la devuelve tal cual.
 */
export function getImageUrl(path: string | undefined | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${SERVER_URL}${path}`;
}
