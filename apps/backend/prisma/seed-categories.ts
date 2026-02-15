import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Estrutura completa de categorias do supermercado.
 * Baseada em: prisma/categorias.md
 */
const categoryTree: { name: string; description: string; children: string[] }[] = [
  {
    name: 'Hortifruti',
    description: 'Frutas, verduras, legumes e orgânicos',
    children: ['Frutas', 'Verduras', 'Legumes', 'Orgânicos'],
  },
  {
    name: 'Carnes e Peixaria',
    description: 'Carnes bovinas, suínas, aves, peixes e frutos do mar',
    children: ['Carne Bovino', 'Carne Suíno', 'Frango', 'Peixes', 'Frutos do Mar'],
  },
  {
    name: 'Padaria e Confeitaria',
    description: 'Pães, bolos, doces e massas frescas',
    children: ['Pães', 'Bolos', 'Doces', 'Massas Frescas'],
  },
  {
    name: 'Frios e Laticínios',
    description: 'Queijos, embutidos, leite, iogurtes e derivados',
    children: ['Queijos', 'Presunto e Embutidos', 'Leite', 'Iogurtes', 'Manteiga e Requeijão'],
  },
  {
    name: 'Mercearia',
    description: 'Arroz, feijão, massas, óleos, enlatados e temperos',
    children: [
      'Arroz e Feijão',
      'Massas',
      'Óleos e Azeites',
      'Farinhas',
      'Enlatados e Conservas',
      'Molhos',
      'Temperos e Especiarias',
      'Açúcar e Sal',
      'Grãos e Cereais',
    ],
  },
  {
    name: 'Café da Manhã',
    description: 'Café, chás, cereais matinais e acompanhamentos',
    children: ['Café', 'Chás', 'Cereais Matinais', 'Achocolatados', 'Mel e Geleias'],
  },
  {
    name: 'Snacks e Doces',
    description: 'Biscoitos, salgadinhos, chocolates e guloseimas',
    children: ['Biscoitos', 'Salgadinhos', 'Chocolates', 'Balas e Gomas', 'Barras de Cereal'],
  },
  {
    name: 'Congelados',
    description: 'Vegetais congelados, pratos prontos, pizzas e sorvetes',
    children: [
      'Vegetais Congelados',
      'Pratos Prontos',
      'Pizzas',
      'Hambúrgueres',
      'Massas Congeladas',
      'Sorvetes',
    ],
  },
  {
    name: 'Bebidas Não Alcoólicas',
    description: 'Água, refrigerantes, sucos e energéticos',
    children: ['Água', 'Refrigerantes', 'Sucos', 'Energéticos', 'Chás Gelados', 'Isotônicos'],
  },
  {
    name: 'Bebidas Alcoólicas',
    description: 'Cervejas, vinhos, espumantes e destilados',
    children: ['Cervejas', 'Vinhos', 'Espumantes', 'Destilados'],
  },
  {
    name: 'Higiene e Beleza',
    description: 'Cuidados com cabelo, corpo, bucal e cosméticos',
    children: [
      'Cabelo',
      'Corpo',
      'Higiene Bucal',
      'Desodorantes',
      'Higiene Feminina',
      'Barbear',
      'Cosméticos',
    ],
  },
  {
    name: 'Limpeza',
    description: 'Produtos de limpeza para casa',
    children: [
      'Lavanderia',
      'Cozinha',
      'Banheiro',
      'Multiuso',
      'Utensílios de Limpeza',
      'Sacos de Lixo',
    ],
  },
  {
    name: 'Bebê',
    description: 'Fraldas, alimentação e higiene do bebê',
    children: [
      'Fraldas',
      'Lenços Umedecidos',
      'Alimentação Infantil',
      'Higiene do Bebê',
      'Acessórios',
    ],
  },
  {
    name: 'Pet Shop',
    description: 'Ração, petiscos e acessórios para animais',
    children: [
      'Ração para Cães',
      'Ração para Gatos',
      'Petiscos',
      'Higiene Animal',
      'Acessórios Pet',
    ],
  },
  {
    name: 'Saúde e Bem-Estar',
    description: 'Vitaminas, suplementos e produtos naturais',
    children: [
      'Vitaminas',
      'Suplementos',
      'Produtos Naturais',
      'Medicamentos Isentos de Prescrição',
    ],
  },
  {
    name: 'Utilidades Domésticas',
    description: 'Papelaria, descartáveis, utensílios e pilhas',
    children: [
      'Papelaria Básica',
      'Descartáveis',
      'Utensílios de Cozinha',
      'Pilhas e Baterias',
    ],
  },
];

async function main() {
  console.log('🗂️  Seeding categorias...\n');

  // Apagar produtos de exemplo e todas as dependências (orden correto)
  console.log('🗑️  Removendo produtos de exemplo e dependências...');
  await prisma.pickingItem.deleteMany({});
  await prisma.pickingOrder.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.deliveryLocationHistory.deleteMany({});
  await prisma.delivery.deleteMany({});
  await prisma.orderStatusHistory.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.inventoryMovement.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  console.log('   Produtos removidos.\n');

  // Apagar categorias antigas
  await prisma.category.deleteMany({});

  let parentCount = 0;
  let childCount = 0;

  for (let i = 0; i < categoryTree.length; i++) {
    const { name, description, children } = categoryTree[i];
    const parentSlug = slugify(name);

    // Upsert categoria pai
    const parent = await prisma.category.upsert({
      where: { slug: parentSlug },
      update: {
        name,
        description,
        position: i,
        isActive: true,
      },
      create: {
        name,
        slug: parentSlug,
        description,
        position: i,
        isActive: true,
      },
    });

    parentCount++;
    console.log(`✅ [${i + 1}] ${name}  (${children.length} sub)`);

    // Upsert subcategorias
    for (let j = 0; j < children.length; j++) {
      const childName = children[j];
      const childSlug = slugify(childName);

      await prisma.category.upsert({
        where: { slug: childSlug },
        update: {
          name: childName,
          parentId: parent.id,
          position: j,
          isActive: true,
        },
        create: {
          name: childName,
          slug: childSlug,
          parentId: parent.id,
          position: j,
          isActive: true,
        },
      });

      childCount++;
    }
  }

  console.log('');
  console.log(`🎉 Pronto! ${parentCount} categorias pais + ${childCount} subcategorias criadas.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed de categorias falhou:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
