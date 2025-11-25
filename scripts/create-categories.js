const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCategories() {
  console.log('🌱 Создаем категории...');

  // Удаляем существующие категории
  await prisma.category.deleteMany();
  console.log('🗑️ Старые категории удалены');

  // Создаем родительские категории
  const electronics = await prisma.category.create({
    data: {
      name: 'Электроника',
      slug: 'electronics',
      description: 'Телефоны, компьютеры, бытовая техника',
    },
  });

  const clothing = await prisma.category.create({
    data: {
      name: 'Одежда и обувь',
      slug: 'clothing',
      description: 'Мужская, женская и детская одежда',
    },
  });

  const home = await prisma.category.create({
    data: {
      name: 'Дом и сад',
      slug: 'home-garden',
      description: 'Мебель, декор, садовые принадлежности',
    },
  });

  const transport = await prisma.category.create({
    data: {
      name: 'Транспорт',
      slug: 'transport',
      description: 'Автомобили, мотоциклы, запчасти',
    },
  });

  const realestate = await prisma.category.create({
    data: {
      name: 'Недвижимость',
      slug: 'real-estate',
      description: 'Квартиры, дома, коммерческая недвижимость',
    },
  });

  const services = await prisma.category.create({
    data: {
      name: 'Работа и услуги',
      slug: 'services',
      description: 'Вакансии, резюме, различные услуги',
    },
  });

  const hobbies = await prisma.category.create({
    data: {
      name: 'Хобби и отдых',
      slug: 'hobbies',
      description: 'Спорт, музыка, книги, игры',
    },
  });

  // Создаем категорию "Отдых и события" с подкатегориями
  const entertainment = await prisma.category.create({
    data: {
      name: 'Отдых и события',
      slug: 'entertainment-events',
      description: 'Места отдыха, кафе, мероприятия для развлечения. Объявления в этой категории размещаются на 48 часов с ограничением 1 объявление в день. Для размещения большего количества объявлений используйте VIP услуги. Поддержка: @pmrmarketsupport или pmrmarket@proton.me',
    },
  });

  // Подкатегории для "Отдых и события"
  await prisma.category.create({
    data: {
      name: 'Кафе и подобные',
      slug: 'entertainment-cafe',
      description: 'Кафе, рестораны, бары и другие заведения общественного питания',
      parentId: entertainment.id,
    },
  });

  await prisma.category.create({
    data: {
      name: 'Культурное мероприятие',
      slug: 'entertainment-cultural',
      description: 'Концерты, выставки, театральные постановки и другие культурные события',
      parentId: entertainment.id,
    },
  });

  console.log('✅ Категории созданы успешно!');
  console.log('📋 Создано категорий:');
  
  const allCategories = await prisma.category.findMany({
    include: {
      children: true,
    },
  });
  
  allCategories.forEach(cat => {
    if (!cat.parentId) {
      console.log(`- ${cat.name} (${cat.slug})`);
      if (cat.children.length > 0) {
        cat.children.forEach(child => {
          console.log(`  └─ ${child.name} (${child.slug})`);
        });
      }
    }
  });
}

createCategories()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
