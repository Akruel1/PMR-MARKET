import { PrismaClient, UserRole, AdStatus, AdCondition, Currency } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  console.log('🗑️  Clearing existing data...');
  await prisma.image.deleteMany();
  await prisma.adTag.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.message.deleteMany();
  await prisma.view.deleteMany();
  await prisma.report.deleteMany();
  await prisma.ad.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.city.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Existing data cleared');

  const cityData = [
    { name: 'Тирасполь', slug: 'tiraspol' },
    { name: 'Бендеры', slug: 'bender' },
    { name: 'Рыбница', slug: 'ribnita' },
    { name: 'Дубоссары', slug: 'dubasari' },
    { name: 'Григориополь', slug: 'grigoriopol' },
    { name: 'Каменка', slug: 'camenka' },
    { name: 'Слободзея', slug: 'slobodzeia' },
  ];

  const cityMap = new Map<string, string>();
  for (const city of cityData) {
    const record = await prisma.city.create({ data: city });
    cityMap.set(city.slug, record.id);
  }
  console.log('✅ Cities created');

  const categoryStructure = [
    {
      name: 'Электроника',
      slug: 'electronics',
      children: [
        { name: 'Смартфоны', slug: 'electronics-phones' },
        { name: 'Ноутбуки', slug: 'electronics-laptops' },
        { name: 'Аудио', slug: 'electronics-audio' },
        { name: 'Бытовая техника', slug: 'electronics-appliances' },
      ],
    },
    {
      name: 'Одежда',
      slug: 'fashion',
      children: [
        { name: 'Верхняя одежда', slug: 'fashion-topwear' },
        { name: 'Нижняя одежда', slug: 'fashion-bottomwear' },
        { name: 'Обувь', slug: 'fashion-footwear' },
        { name: 'Аксессуары', slug: 'fashion-accessories' },
      ],
    },
    { name: 'Товары для дома', slug: 'home-goods' },
    { name: 'Местные продукты', slug: 'local-produce' },
    { name: 'Услуги', slug: 'services' },
    { name: 'Авто и транспорт', slug: 'automotive' },
  ];

  const categoryMap = new Map<string, string>();
  for (const category of categoryStructure) {
    const parent = await prisma.category.create({
      data: { name: category.name, slug: category.slug },
    });
    categoryMap.set(category.slug, parent.id);

    if (category.children) {
      for (const child of category.children) {
        const childRecord = await prisma.category.create({
          data: { name: child.name, slug: child.slug, parentId: parent.id },
        });
        categoryMap.set(child.slug, childRecord.id);
      }
    }
  }
  console.log('✅ Categories created');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@pmr-market.dev',
      name: 'Admin User',
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });

  const demoUsers = await prisma.user.createMany({
    data: [
      { email: 'seller@pmr-market.dev', name: 'Мария Селлер', emailVerified: new Date() },
      { email: 'buyer@pmr-market.dev', name: 'Илья Покупатель', emailVerified: new Date() },
    ],
  });

  const users = await prisma.user.findMany({
    where: { email: { in: ['seller@pmr-market.dev', 'buyer@pmr-market.dev'] } },
  });
  const userMap = new Map(users.map((user) => [user.email, user.id]));

  const tagsData = [
    { name: 'Featured', slug: 'featured' },
    { name: 'Organic', slug: 'organic' },
    { name: 'Handmade', slug: 'handmade' },
  ];

  const tagMap = new Map<string, string>();
  for (const tag of tagsData) {
    const created = await prisma.tag.create({ data: tag });
    tagMap.set(tag.slug, created.id);
  }
  console.log('✅ Users & tags created');

  const adsData = [
    {
      title: 'Organic Sourdough Loaf',
      slug: 'organic-sourdough-loaf',
      description: 'Свежевыпеченный хлеб из закваски. Печём утром, доставляем ещё тёплым.',
      price: 9.5,
      currency: Currency.USD,
      condition: AdCondition.NEW,
      status: AdStatus.APPROVED,
      citySlug: 'tiraspol',
      categorySlug: 'local-produce',
      userEmail: 'seller@pmr-market.dev',
      tagSlugs: ['organic', 'featured'],
      images: [
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1486887396153-fa416526c108?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      title: 'Handmade Wool Scarf',
      slug: 'handmade-wool-scarf',
      description: 'Тёплый шарф из мериносовой шерсти. Пошив на заказ, можно выбрать цвет.',
      price: 35,
      currency: Currency.USD,
      condition: AdCondition.NEW,
      status: AdStatus.APPROVED,
      citySlug: 'bender',
      categorySlug: 'fashion-accessories',
      userEmail: 'seller@pmr-market.dev',
      tagSlugs: ['handmade'],
      images: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      title: 'Sony A7C II Camera Kit',
      slug: 'sony-a7c-ii-kit',
      description: 'Комплект камера + объектив 28-60mm. Состояние близко к новому, полный комплект.',
      price: 1850,
      currency: Currency.USD,
      condition: AdCondition.USED,
      status: AdStatus.APPROVED,
      citySlug: 'tiraspol',
      categorySlug: 'electronics',
      userEmail: 'seller@pmr-market.dev',
      tagSlugs: ['featured'],
      images: [
        'https://images.unsplash.com/photo-1519183071298-a2962be90b8e?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      title: 'Street Food Bike Tour',
      slug: 'street-food-bike-tour',
      description: 'Экскурсия по уличной еде Тирасполя на велосипедах. Включены дегустации и гид.',
      price: 42,
      currency: Currency.USD,
      condition: AdCondition.NEW,
      status: AdStatus.PENDING,
      citySlug: 'tiraspol',
      categorySlug: 'services',
      userEmail: 'seller@pmr-market.dev',
      images: [
        'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      title: 'Leather Chelsea Boots',
      slug: 'leather-chelsea-boots',
      description: 'Классические кожаные челси, размер 42. Носились пару раз, без потертостей.',
      price: 120,
      currency: Currency.USD,
      condition: AdCondition.USED,
      status: AdStatus.APPROVED,
      citySlug: 'ribnita',
      categorySlug: 'fashion-footwear',
      userEmail: 'seller@pmr-market.dev',
      images: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      ],
    },
  ];

  const createdAds: string[] = [];
  for (const ad of adsData) {
    const created = await prisma.ad.create({
      data: {
        title: ad.title,
        slug: ad.slug,
        description: ad.description,
        price: ad.price,
        currency: ad.currency,
        condition: ad.condition,
        status: ad.status,
        cityId: cityMap.get(ad.citySlug)!,
        categoryId: categoryMap.get(ad.categorySlug)!,
        userId: userMap.get(ad.userEmail)!,
        images: {
          create: ad.images.map((url, order) => ({ url, order })),
        },
        tags: {
          create: (ad.tagSlugs ?? []).map((slug) => ({
            tagId: tagMap.get(slug)!,
          })),
        },
      },
    });
    createdAds.push(created.id);
  }

  console.log('✅ Ads created');

  const sellerId = userMap.get('seller@pmr-market.dev');
  const buyerId = userMap.get('buyer@pmr-market.dev');

  if (sellerId && buyerId && createdAds.length > 0) {
    await prisma.favorite.create({
      data: {
        userId: buyerId,
        adId: createdAds[0],
      },
    });
    console.log('✅ Favorites created');
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

