import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Borra dependencias directas primero para evitar errores de FK
  // Borra pickingItem primero (FK a orderItem)
  await prisma.pickingItem.deleteMany({});
  await prisma.orderStatusHistory.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.pickingOrder.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.delivery.deleteMany({});
  // Finalmente borra los pedidos
  await prisma.order.deleteMany({});
  console.log('Todos los pedidos y dependencias directas han sido eliminados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
