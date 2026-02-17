import { PrismaClient, Role, ProductStatus, CouponType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@supermercado.com' },
    update: {},
    create: {
      email: 'admin@supermercado.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'Sistema',
      role: Role.ADMIN,
      isEmailVerified: true,
      phone: '51999990000',
    },
  });

  // Create manager
  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'gerente@supermercado.com' },
    update: {},
    create: {
      email: 'gerente@supermercado.com',
      password: managerPassword,
      firstName: 'Carlos',
      lastName: 'Souza',
      role: Role.MANAGER,
      isEmailVerified: true,
      phone: '51999991111',
    },
  });

  // Create seller
  const sellerPassword = await bcrypt.hash('seller123', 10);
  const seller = await prisma.user.upsert({
    where: { email: 'vendedor@supermercado.com' },
    update: {},
    create: {
      email: 'vendedor@supermercado.com',
      password: sellerPassword,
      firstName: 'João',
      lastName: 'Silva',
      role: Role.SELLER,
      isEmailVerified: true,
      phone: '51999992222',
    },
  });

  // Create delivery person
  const deliveryPassword = await bcrypt.hash('delivery123', 10);
  const deliveryPerson = await prisma.user.upsert({
    where: { email: 'entregador@supermercado.com' },
    update: {},
    create: {
      email: 'entregador@supermercado.com',
      password: deliveryPassword,
      firstName: 'Pedro',
      lastName: 'Santos',
      role: Role.DELIVERY,
      isEmailVerified: true,
      phone: '51999993333',
    },
  });

  // Create customer
  const customerPassword = await bcrypt.hash('customer123', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'cliente@email.com' },
    update: {},
    create: {
      email: 'cliente@email.com',
      password: customerPassword,
      firstName: 'Maria',
      lastName: 'Oliveira',
      role: Role.CUSTOMER,
      isEmailVerified: true,
      phone: '51999994444',
      cpf: '12345678901',
    },
  });

  // Create loyalty accounts
  for (const user of [admin, manager, seller, deliveryPerson, customer]) {
    await prisma.loyaltyAccount.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
  }

  // Create customer address
  await prisma.address.upsert({
    where: { id: 'seed-address-1' },
    update: {},
    create: {
      id: 'seed-address-1',
      userId: customer.id,
      label: 'Casa',
      street: 'Rua General Flores da Cunha',
      number: '1234',
      neighborhood: 'Centro',
      city: 'Venâncio Aires',
      state: 'RS',
      zipCode: '95800000',
      latitude: -29.6064,
      longitude: -52.1919,
      isDefault: true,
    },
  });

  // Create categories
  const categories = [
    { name: 'Padaria', description: 'Pães, bolos e doces' },
    { name: 'Laticínios', description: 'Leites, queijos e iogurtes' },
    { name: 'Carnes', description: 'Carnes bovinas, suínas e aves' },
    { name: 'Frutas e Verduras', description: 'Frutas, verduras e legumes frescos' },
    { name: 'Bebidas', description: 'Refrigerantes, sucos e águas' },
    { name: 'Mercearia', description: 'Arroz, feijão, massas e cereais' },
    { name: 'Limpeza', description: 'Produtos de limpeza para casa' },
    { name: 'Higiene Pessoal', description: 'Produtos de higiene e beleza' },
    { name: 'Congelados', description: 'Alimentos congelados' },
    { name: 'Frios e Embutidos', description: 'Presuntos, salames e frios' },
  ];

  const createdCategories: any[] = [];
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: slugify(cat.name) },
      update: {},
      create: {
        name: cat.name,
        slug: slugify(cat.name),
        description: cat.description,
        isActive: true,
      },
    });
    createdCategories.push(created);
  }

  // Create brands
  const brands = [
    'Tio João', 'Camil', 'Sadia', 'Perdigão', 'Nestlé',
    'Coca-Cola', 'Omo', 'Brilhante', 'Colgate', 'Dove',
  ];

  const createdBrands: any[] = [];
  for (const brandName of brands) {
    const brand = await prisma.brand.upsert({
      where: { slug: slugify(brandName) },
      update: {},
      create: {
        name: brandName,
        slug: slugify(brandName),
        isActive: true,
      },
    });
    createdBrands.push(brand);
  }

  // Create products
  const products = [
    { name: 'Pão Francês', sku: 'PAD001', barcode: '7891000100011', price: 0.75, costPrice: 0.40, stock: 200, minStock: 50, unit: 'un', categoryIdx: 0, brandIdx: null, aisleLocation: 'Padaria A1', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1549931319-a545753467c8?w=400&h=400&fit=crop' },
    { name: 'Pão Integral', sku: 'PAD002', barcode: '7891000100012', price: 8.50, costPrice: 5.00, stock: 50, minStock: 10, unit: 'un', categoryIdx: 0, brandIdx: null, aisleLocation: 'Padaria A2', isOrganic: true, imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop' },
    { name: 'Leite Integral 1L', sku: 'LAT001', barcode: '7891000200011', price: 5.49, costPrice: 3.50, stock: 100, minStock: 20, unit: 'un', categoryIdx: 1, brandIdx: 4, aisleLocation: 'Laticínios B1', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop' },
    { name: 'Queijo Minas Frescal', sku: 'LAT002', barcode: '7891000200012', price: 14.90, costPrice: 9.00, stock: 30, minStock: 5, unit: 'kg', categoryIdx: 1, brandIdx: null, aisleLocation: 'Laticínios B3', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=400&fit=crop' },
    { name: 'Iogurte Natural', sku: 'LAT003', barcode: '7891000200013', price: 4.99, costPrice: 2.80, stock: 60, minStock: 15, unit: 'un', categoryIdx: 1, brandIdx: 4, aisleLocation: 'Laticínios B2', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop' },
    { name: 'Peito de Frango', sku: 'CAR001', barcode: '7891000300011', price: 16.90, costPrice: 11.00, stock: 50, minStock: 10, unit: 'kg', categoryIdx: 2, brandIdx: 2, aisleLocation: 'Carnes C1', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82571?w=400&h=400&fit=crop' },
    { name: 'Carne Moída', sku: 'CAR002', barcode: '7891000300012', price: 24.90, costPrice: 18.00, stock: 40, minStock: 8, unit: 'kg', categoryIdx: 2, brandIdx: null, aisleLocation: 'Carnes C2', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=400&h=400&fit=crop' },
    { name: 'Linguiça Toscana', sku: 'CAR003', barcode: '7891000300013', price: 19.90, costPrice: 13.00, stock: 35, minStock: 5, unit: 'kg', categoryIdx: 2, brandIdx: 3, aisleLocation: 'Carnes C3', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=400&fit=crop' },
    { name: 'Banana Prata', sku: 'FRU001', barcode: '7891000400011', price: 5.99, costPrice: 3.00, stock: 80, minStock: 20, unit: 'kg', categoryIdx: 3, brandIdx: null, aisleLocation: 'Hortifruti D1', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop' },
    { name: 'Maçã Fuji', sku: 'FRU002', barcode: '7891000400012', price: 8.99, costPrice: 5.50, stock: 60, minStock: 15, unit: 'kg', categoryIdx: 3, brandIdx: null, aisleLocation: 'Hortifruti D2', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop' },
    { name: 'Tomate Italiano', sku: 'FRU003', barcode: '7891000400013', price: 7.49, costPrice: 4.00, stock: 50, minStock: 10, unit: 'kg', categoryIdx: 3, brandIdx: null, aisleLocation: 'Hortifruti D3', isOrganic: true, imageUrl: 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400&h=400&fit=crop' },
    { name: 'Coca-Cola 2L', sku: 'BEB001', barcode: '7891000500011', price: 8.99, costPrice: 6.00, stock: 120, minStock: 30, unit: 'un', categoryIdx: 4, brandIdx: 5, aisleLocation: 'Bebidas E1', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=400&fit=crop' },
    { name: 'Suco de Laranja 1L', sku: 'BEB002', barcode: '7891000500012', price: 6.49, costPrice: 3.50, stock: 80, minStock: 20, unit: 'un', categoryIdx: 4, brandIdx: null, aisleLocation: 'Bebidas E2', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop' },
    { name: 'Água Mineral 500ml', sku: 'BEB003', barcode: '7891000500013', price: 2.49, costPrice: 1.00, stock: 200, minStock: 50, unit: 'un', categoryIdx: 4, brandIdx: null, aisleLocation: 'Bebidas E3', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop' },
    { name: 'Arroz Branco 5kg', sku: 'MER001', barcode: '7891000600011', price: 22.90, costPrice: 16.00, stock: 70, minStock: 15, unit: 'un', categoryIdx: 5, brandIdx: 0, aisleLocation: 'Mercearia F1', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop' },
    { name: 'Arroz Integral 1kg', sku: 'MER002', barcode: '7891000600012', price: 8.49, costPrice: 5.50, stock: 40, minStock: 10, unit: 'un', categoryIdx: 5, brandIdx: 0, aisleLocation: 'Mercearia F1', isOrganic: true, imageUrl: 'https://images.unsplash.com/photo-1536304993881-460346cb2453?w=400&h=400&fit=crop' },
    { name: 'Feijão Preto 1kg', sku: 'MER003', barcode: '7891000600013', price: 7.99, costPrice: 5.00, stock: 60, minStock: 15, unit: 'un', categoryIdx: 5, brandIdx: 1, aisleLocation: 'Mercearia F2', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&h=400&fit=crop' },
    { name: 'Macarrão Espaguete 500g', sku: 'MER004', barcode: '7891000600014', price: 4.29, costPrice: 2.50, stock: 90, minStock: 20, unit: 'un', categoryIdx: 5, brandIdx: null, aisleLocation: 'Mercearia F3', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1551462147-37885acc36f1?w=400&h=400&fit=crop' },
    { name: 'Detergente Líquido', sku: 'LIM001', barcode: '7891000700011', price: 2.99, costPrice: 1.50, stock: 100, minStock: 25, unit: 'un', categoryIdx: 6, brandIdx: 6, aisleLocation: 'Limpeza G1', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop' },
    { name: 'Sabão em Pó 1kg', sku: 'LIM002', barcode: '7891000700012', price: 12.90, costPrice: 8.00, stock: 50, minStock: 10, unit: 'un', categoryIdx: 6, brandIdx: 7, aisleLocation: 'Limpeza G2', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop' },
    { name: 'Pasta de Dentes', sku: 'HIG001', barcode: '7891000800011', price: 6.99, costPrice: 4.00, stock: 70, minStock: 15, unit: 'un', categoryIdx: 7, brandIdx: 8, aisleLocation: 'Higiene H1', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1559667110-438b7360b667?w=400&h=400&fit=crop' },
    { name: 'Sabonete', sku: 'HIG002', barcode: '7891000800012', price: 3.49, costPrice: 1.80, stock: 100, minStock: 20, unit: 'un', categoryIdx: 7, brandIdx: 9, aisleLocation: 'Higiene H2', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400&h=400&fit=crop' },
    { name: 'Pizza Congelada', sku: 'CON001', barcode: '7891000900011', price: 15.90, costPrice: 9.00, stock: 30, minStock: 8, unit: 'un', categoryIdx: 8, brandIdx: 2, aisleLocation: 'Congelados I1', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop' },
    { name: 'Lasanha Congelada', sku: 'CON002', barcode: '7891000900012', price: 18.90, costPrice: 12.00, stock: 25, minStock: 5, unit: 'un', categoryIdx: 8, brandIdx: 3, aisleLocation: 'Congelados I2', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&h=400&fit=crop' },
    { name: 'Presunto Cozido', sku: 'FRI001', barcode: '7891001000011', price: 29.90, costPrice: 20.00, stock: 20, minStock: 5, unit: 'kg', categoryIdx: 9, brandIdx: 2, aisleLocation: 'Frios J1', isOrganic: false, imageUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=400&fit=crop' },
  ];

  for (const prod of products) {
    await prisma.product.upsert({
      where: { sku: prod.sku },
      update: {},
      create: {
        sku: prod.sku,
        barcode: prod.barcode,
        name: prod.name,
        slug: slugify(prod.name),
        price: prod.price,
        costPrice: prod.costPrice,
        stock: prod.stock,
        minStock: prod.minStock,
        unit: prod.unit,
        categoryId: createdCategories[prod.categoryIdx].id,
        brandId: prod.brandIdx !== null ? createdBrands[prod.brandIdx].id : null,
        status: ProductStatus.ACTIVE,
        isFeatured: [0, 2, 5, 11, 14].includes(products.indexOf(prod)),
        isOrganic: prod.isOrganic,
        aisleLocation: prod.aisleLocation,
        taxRate: 0,
        mainImageUrl: prod.imageUrl,
      },
    });
  }

  // Create a sample coupon
  await prisma.coupon.upsert({
    where: { code: 'BEMVINDO10' },
    update: {},
    create: {
      code: 'BEMVINDO10',
      description: '10% de desconto na primeira compra',
      type: CouponType.PERCENTAGE,
      value: 10,
      minOrderValue: 50,
      maxDiscountValue: 30,
      maxUses: 1000,
      maxUsesPerUser: 1,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'FRETEGRATIS' },
    update: {},
    create: {
      code: 'FRETEGRATIS',
      description: 'Frete grátis em compras acima de R$ 80',
      type: CouponType.FREE_SHIPPING,
      value: 0,
      minOrderValue: 80,
      isActive: true,
    },
  });

  // Create loyalty rewards
  await prisma.loyaltyReward.upsert({
    where: { id: 'reward-1' },
    update: {},
    create: {
      id: 'reward-1',
      name: 'Desconto de R$ 5',
      description: 'Ganhe R$ 5 de desconto na próxima compra',
      pointsCost: 100,
      type: 'DISCOUNT',
      value: 5,
      isActive: true,
    },
  });

  await prisma.loyaltyReward.upsert({
    where: { id: 'reward-2' },
    update: {},
    create: {
      id: 'reward-2',
      name: 'Frete Grátis',
      description: 'Frete grátis na próxima entrega',
      pointsCost: 50,
      type: 'FREE_SHIPPING',
      value: 0,
      isActive: true,
    },
  });

  // Create a supplier
  await prisma.supplier.upsert({
    where: { cnpj: '12345678000190' },
    update: {},
    create: {
      name: 'Distribuidora RS',
      contactName: 'Fernando Costa',
      email: 'contato@distribuidorars.com',
      phone: '51988887777',
      cnpj: '12345678000190',
      address: 'Rua das Indústrias, 500 - Porto Alegre, RS',
      isActive: true,
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📋 Test accounts:');
  console.log('  Admin:      admin@supermercado.com / admin123');
  console.log('  Gerente:    gerente@supermercado.com / manager123');
  console.log('  Vendedor:   vendedor@supermercado.com / seller123');
  console.log('  Entregador: entregador@supermercado.com / delivery123');
  console.log('  Cliente:    cliente@email.com / customer123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
