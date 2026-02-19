const { io } = require('socket.io-client');
console.log('1. socket.io-client importado');

let fetch;
(async () => {
  fetch = (await import('node-fetch')).default;
  console.log('2. node-fetch importado');

  async function main() {
    console.log('3. Entrando a main()');
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@supermercado.com', password: 'Thalia2024' }),
    });
    console.log('4. Login hecho');
    const { accessToken } = await res.json();
    console.log('🔑 Token obtenido:', accessToken);

    const socket = io('http://localhost:3000/notifications', {
      auth: { token: accessToken },
    });

    socket.on('connect', () => console.log('✅ Conectado al WebSocket'));
    socket.on('disconnect', () => console.log('❌ Desconectado'));
    socket.on('connect_error', (err) => {
      console.error('❌ Error de conexión:', err.message);
    });
    socket.on('newOrder', (data) => console.log('🔔 NUEVO PEDIDO:', JSON.stringify(data, null, 2)));
    socket.on('orderStatusChanged', (data) => console.log('📦 ESTADO CAMBIÓ:', JSON.stringify(data, null, 2)));
    socket.on('orderReadyForPickup', (data) => console.log('🚚 LISTO PARA RECOGER:', JSON.stringify(data, null, 2)));

    console.log('👂 Escuchando notificaciones... (Ctrl+C para salir)');
  }

  await main();
})().catch((err) => {
  console.error('Error en main:', err);
});