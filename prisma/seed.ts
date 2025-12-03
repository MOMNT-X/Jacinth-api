import { PrismaClient } from '@prisma/client';

// Use DIRECT_URL for seeding (migrations and seeding should use direct connection)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Categories
  const categories = [
    {
      id: '1',
      name: 'Fruits & Vegetables',
      slug: 'fruits-vegetables',
    },
    {
      id: '2',
      name: 'Baby & Pregnancy',
      slug: 'baby-pregnancy',
    },
    {
      id: '3',
      name: 'Beverages',
      slug: 'beverages',
    },
    {
      id: '4',
      name: 'Meats & Seafood',
      slug: 'meats-seafood',
    },
    {
      id: '5',
      name: 'Biscuits & Snacks',
      slug: 'biscuits-snacks',
      image: '/05.svg',
    },
    {
      id: '6',
      name: 'Breads & Bakery',
      slug: 'breads-bakery',
    },
    {
      id: '7',
      name: 'Breakfast & Dairy',
      slug: 'breakfast-dairy',
      image: '/07.svg',
    },
    {
      id: '8',
      name: 'Frozen Foods',
      slug: 'frozen-foods',
    },
    {
      id: '9',
      name: 'Grocery & Staples',
      slug: 'grocery-staples',
      image: '/09.svg',
    },
    {
      id: '10',
      name: 'Healthcare',
      slug: 'healthcare',
    },
    {
      id: '11',
      name: 'Household Needs',
      slug: 'household-needs',
    },
  ];

  console.log('📦 Creating categories...');
  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    });
  }
  console.log(`✅ Created ${categories.length} categories`);

  // Create Products with specific UUIDs
  const products = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Amatem Softgel - Artemether 20/120 mg',
      slug: 'amatem-softgel-artemether-20-120-mg',
      price: 550,
      discount: 0,
      images: ['/drug.png'],
      categoryId: '10',
      description: 'Antimalarial medication',
      isFeatured: true,
      stock: 50,
      isActive: true,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'COARTEM 80/480MG 6 TABS',
      slug: 'coartem-80-480mg-6-tabs',
      price: 550,
      discount: 0,
      images: ['/drug.png'],
      categoryId: '10',
      description: 'Antimalarial combination therapy',
      isFeatured: false,
      stock: 30,
      isActive: true,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Amatem Softgel - Artemether 20/120 mg',
      slug: 'amatem-softgel-artemether-20-120-mg-2',
      price: 550,
      discount: 0,
      images: ['/drug.png'],
      categoryId: '5',
      description: 'Antimalarial medication',
      isFeatured: true,
      stock: 50,
      isActive: true,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      name: 'Amatem Softgel - Artemether 20/120 mg',
      slug: 'amatem-softgel-artemether-20-120-mg-3',
      price: 550,
      discount: 0,
      images: ['/drug.png'],
      categoryId: '5',
      description: 'Antimalarial medication',
      isFeatured: true,
      stock: 50,
      isActive: true,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      name: 'Amatem Softgel - Artemether 20/120 mg',
      slug: 'amatem-softgel-artemether-20-120-mg-4',
      price: 550,
      discount: 0,
      images: ['/drug.png'],
      categoryId: '7',
      description: 'Antimalarial medication',
      isFeatured: true,
      stock: 50,
      isActive: true,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440006',
      name: 'Amatem Softgel - Artemether 20/120 mg',
      slug: 'amatem-softgel-artemether-20-120-mg-5',
      price: 550,
      discount: 0,
      images: ['/drug.png'],
      categoryId: '7',
      description: 'Antimalarial medication',
      isFeatured: true,
      stock: 50,
      isActive: true,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440007',
      name: 'Amatem Softgel - Artemether 20/120 mg',
      slug: 'amatem-softgel-artemether-20-120-mg-6',
      price: 550,
      discount: 0,
      images: ['/drug.png'],
      categoryId: '9',
      description: 'Antimalarial medication',
      isFeatured: true,
      stock: 50,
      isActive: true,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440008',
      name: 'Amatem Softgel - Artemether 20/120 mg',
      slug: 'amatem-softgel-artemether-20-120-mg-7',
      price: 550,
      discount: 0,
      images: ['/drug.png'],
      categoryId: '9',
      description: 'Antimalarial medication',
      isFeatured: true,
      stock: 50,
      isActive: true,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440009',
      name: 'Amatem Softgel - Artemether 20/120 mg',
      slug: 'amatem-softgel-artemether-20-120-mg-8',
      price: 550,
      discount: 0,
      images: ['/drug.png'],
      categoryId: '9',
      description: 'Antimalarial medication',
      isFeatured: true,
      stock: 50,
      isActive: true,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      name: 'Amatem Softgel - Artemether 20/120 mg',
      slug: 'amatem-softgel-artemether-20-120-mg-9',
      price: 550,
      discount: 0,
      images: ['/drug.png'],
      categoryId: '10',
      description: 'Antimalarial medication',
      isFeatured: true,
      stock: 50,
      isActive: true,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440011',
      name: 'Amatem Softgel - Artemether 20/120 mg',
      slug: 'amatem-softgel-artemether-20-120-mg-10',
      price: 550,
      discount: 0,
      images: ['/drug.png'],
      categoryId: '10',
      description: 'Antimalarial medication',
      isFeatured: true,
      stock: 50,
      isActive: true,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440012',
      name: 'Amatem Softgel - Artemether 20/120 mg',
      slug: 'amatem-softgel-artemether-20-120-mg-11',
      price: 550,
      discount: 0,
      images: ['/drug.png'],
      categoryId: '10',
      description: 'Antimalarial medication',
      isFeatured: true,
      stock: 50,
      isActive: true,
    },
  ];

  console.log('🛍️ Creating products...');
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }
  console.log(`✅ Created ${products.length} products`);

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
