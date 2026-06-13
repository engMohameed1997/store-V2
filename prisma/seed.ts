import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ============================================
// DATA ARRAYS
// ============================================

const categories = [
  // المنزلية
  {
    slug: 'living-room',
    name: 'Living Room',
    nameAr: 'غرفة المعيشة',
    description: 'Furniture and decor for living rooms',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
    position: 1,
  },
  {
    slug: 'bedroom',
    name: 'Bedroom',
    nameAr: 'غرفة النوم',
    description: 'Bedroom furniture and accessories',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400',
    position: 2,
  },
  {
    slug: 'kitchen',
    name: 'Kitchen',
    nameAr: 'المطبخ',
    description: 'Kitchen appliances and equipment',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    position: 3,
  },
  {
    slug: 'bathroom',
    name: 'Bathroom',
    nameAr: 'الحمام',
    description: 'Bathroom fixtures and accessories',
    image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400',
    position: 4,
  },
  // الإلكترونيات
  {
    slug: 'smartphones',
    name: 'Smartphones',
    nameAr: 'الهواتف الذكية',
    description: 'Latest smartphones and mobile devices',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
    position: 5,
  },
  {
    slug: 'laptops',
    name: 'Laptops',
    nameAr: 'الحواسيب المحمولة',
    description: 'Laptops and computers',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
    position: 6,
  },
  {
    slug: 'tvs',
    name: 'TVs & Audio',
    nameAr: 'التلفزيونات والصوت',
    description: 'Televisions and audio equipment',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400',
    position: 7,
  },
  {
    slug: 'accessories',
    name: 'Accessories',
    nameAr: 'الإكسسوارات',
    description: 'Electronic accessories and peripherals',
    image: 'https://images.unsplash.com/photo-1544866092-1935c5ef2a8f?w=400',
    position: 8,
  },
];

const brands = [
  { slug: 'samsung', name: 'Samsung', nameAr: 'سامسونج', logo: 'https://logo.clearbit.com/samsung.com' },
  { slug: 'apple', name: 'Apple', nameAr: 'أبل', logo: 'https://logo.clearbit.com/apple.com' },
  { slug: 'lg', name: 'LG', nameAr: 'إل جي', logo: 'https://logo.clearbit.com/lg.com' },
  { slug: 'sony', name: 'Sony', nameAr: 'سوني', logo: 'https://logo.clearbit.com/sony.com' },
  { slug: 'ikea', name: 'IKEA', nameAr: 'إيكيا', logo: 'https://logo.clearbit.com/ikea.com' },
  { slug: 'xiaomi', name: 'Xiaomi', nameAr: 'شاومي', logo: 'https://logo.clearbit.com/xiaomi.com' },
  { slug: 'dell', name: 'Dell', nameAr: 'ديل', logo: 'https://logo.clearbit.com/dell.com' },
  { slug: 'hp', name: 'HP', nameAr: 'إتش بي', logo: 'https://logo.clearbit.com/hp.com' },
];

// Product data templates
const productTemplates: Record<string, ProductTemplate[]> = {
  livingRoom: [
    { name: 'Modern Sofa', nameAr: 'أريكة عصرية', basePrice: 500000, stock: 15, brand: 'ikea' },
    { name: 'Coffee Table', nameAr: 'طاولة قهوة', basePrice: 150000, stock: 25, brand: 'ikea' },
    { name: 'TV Stand', nameAr: 'وحدة تلفزيون', basePrice: 200000, stock: 20, brand: 'ikea' },
    { name: 'Armchair', nameAr: 'كرسي بذراعين', basePrice: 180000, stock: 18, brand: 'ikea' },
    { name: 'Bookshelf', nameAr: 'رف كتب', basePrice: 120000, stock: 30, brand: 'ikea' },
    { name: 'Floor Lamp', nameAr: 'مصباح أرضي', basePrice: 80000, stock: 40, brand: 'ikea' },
    { name: 'Side Table', nameAr: 'طاولة جانبية', basePrice: 60000, stock: 35, brand: 'ikea' },
    { name: 'Console Table', nameAr: 'طاولة مدخل', basePrice: 250000, stock: 12, brand: 'ikea' },
    { name: 'Ottoman', nameAr: 'مقعد قدم', basePrice: 90000, stock: 22, brand: 'ikea' },
    { name: 'Recliner', nameAr: 'كرسي مريح', basePrice: 350000, stock: 10, brand: 'ikea' },
  ],
  bedroom: [
    { name: 'King Size Bed', nameAr: 'سرير ملكي', basePrice: 800000, stock: 8, brand: 'ikea' },
    { name: 'Queen Size Bed', nameAr: 'سرير كوين', basePrice: 600000, stock: 12, brand: 'ikea' },
    { name: 'Wardrobe', nameAr: 'خزانة ملابس', basePrice: 450000, stock: 15, brand: 'ikea' },
    { name: 'Nightstand', nameAr: 'طاولة جانبية للسرير', basePrice: 100000, stock: 30, brand: 'ikea' },
    { name: 'Dresser', nameAr: 'دولاب ملابس', basePrice: 300000, stock: 18, brand: 'ikea' },
    { name: 'Mattress', nameAr: 'مرتبة', basePrice: 250000, stock: 25, brand: 'ikea' },
    { name: 'Bed Frame', nameAr: 'إطار سرير', basePrice: 200000, stock: 20, brand: 'ikea' },
    { name: 'Bedside Lamp', nameAr: 'مصباح سرير', basePrice: 50000, stock: 45, brand: 'ikea' },
    { name: 'Chest of Drawers', nameAr: 'خزانة أدراج', basePrice: 280000, stock: 14, brand: 'ikea' },
    { name: 'Mirror', nameAr: 'مرآة', basePrice: 120000, stock: 28, brand: 'ikea' },
  ],
  kitchen: [
    { name: 'Refrigerator', nameAr: 'ثلاجة', basePrice: 700000, stock: 10, brand: 'samsung' },
    { name: 'Dishwasher', nameAr: 'غسالة أطباق', basePrice: 500000, stock: 12, brand: 'samsung' },
    { name: 'Microwave', nameAr: 'ميكروويف', basePrice: 150000, stock: 30, brand: 'samsung' },
    { name: 'Blender', nameAr: 'خلاط', basePrice: 80000, stock: 40, brand: 'samsung' },
    { name: 'Coffee Maker', nameAr: 'صانعة قهوة', basePrice: 120000, stock: 25, brand: 'samsung' },
    { name: 'Toaster', nameAr: 'محمصة خبز', basePrice: 45000, stock: 50, brand: 'samsung' },
    { name: 'Food Processor', nameAr: 'معالج طعام', basePrice: 180000, stock: 20, brand: 'samsung' },
    { name: 'Electric Kettle', nameAr: 'غلاية كهربائية', basePrice: 35000, stock: 60, brand: 'samsung' },
    { name: 'Rice Cooker', nameAr: 'طنجرة أرز', basePrice: 90000, stock: 35, brand: 'samsung' },
    { name: 'Air Fryer', nameAr: 'قلاية هوائية', basePrice: 130000, stock: 22, brand: 'samsung' },
  ],
  bathroom: [
    { name: 'Vanity Sink', nameAr: 'حوض حمام', basePrice: 250000, stock: 15, brand: 'ikea' },
    { name: 'Shower Cabin', nameAr: 'كابينة دش', basePrice: 400000, stock: 10, brand: 'ikea' },
    { name: 'Toilet', nameAr: 'مرحاض', basePrice: 200000, stock: 20, brand: 'ikea' },
    { name: 'Bathroom Cabinet', nameAr: 'خزانة حمام', basePrice: 150000, stock: 25, brand: 'ikea' },
    { name: 'Mirror Cabinet', nameAr: 'خزانة مرآة', basePrice: 180000, stock: 18, brand: 'ikea' },
    { name: 'Towel Rack', nameAr: 'حامل مناشف', basePrice: 40000, stock: 50, brand: 'ikea' },
    { name: 'Soap Dispenser', nameAr: 'موزع صابون', basePrice: 25000, stock: 60, brand: 'ikea' },
    { name: 'Shower Head', nameAr: 'رأس دش', basePrice: 35000, stock: 45, brand: 'ikea' },
    { name: 'Bath Mat', nameAr: 'سجادة حمام', basePrice: 20000, stock: 70, brand: 'ikea' },
    { name: 'Toilet Brush Holder', nameAr: 'حامل فرشاة مرحاض', basePrice: 15000, stock: 80, brand: 'ikea' },
  ],
  smartphones: [
    { name: 'Galaxy S24 Ultra', nameAr: 'جالاكسي S24 ألترا', basePrice: 1800000, stock: 15, brand: 'samsung' },
    { name: 'iPhone 15 Pro Max', nameAr: 'آيفون 15 برو ماكس', basePrice: 2200000, stock: 12, brand: 'apple' },
    { name: 'Pixel 8 Pro', nameAr: 'بيكسل 8 برو', basePrice: 1500000, stock: 10, brand: 'google' },
    { name: 'Xiaomi 14 Pro', nameAr: 'شاومي 14 برو', basePrice: 1200000, stock: 18, brand: 'xiaomi' },
    { name: 'Galaxy A54', nameAr: 'جالاكسي A54', basePrice: 600000, stock: 25, brand: 'samsung' },
    { name: 'iPhone 14', nameAr: 'آيفون 14', basePrice: 1400000, stock: 20, brand: 'apple' },
    { name: 'Redmi Note 13', nameAr: 'ريد مي نوت 13', basePrice: 450000, stock: 30, brand: 'xiaomi' },
    { name: 'LG Velvet', nameAr: 'إل جي فيلفت', basePrice: 700000, stock: 15, brand: 'lg' },
    { name: 'Sony Xperia', nameAr: 'سوني إكسبيريا', basePrice: 900000, stock: 12, brand: 'sony' },
    { name: 'Galaxy Z Fold 5', nameAr: 'جالاكسي Z فولد 5', basePrice: 2500000, stock: 8, brand: 'samsung' },
  ],
  laptops: [
    { name: 'MacBook Pro 16"', nameAr: 'ماك بوك برو 16 إنش', basePrice: 3500000, stock: 10, brand: 'apple' },
    { name: 'Dell XPS 15', nameAr: 'ديل XPS 15', basePrice: 2800000, stock: 12, brand: 'dell' },
    { name: 'HP Spectre x360', nameAr: 'إتش بي سبيكتير', basePrice: 2400000, stock: 15, brand: 'hp' },
    { name: 'LG Gram 17', nameAr: 'إل جي جرام 17', basePrice: 2000000, stock: 10, brand: 'lg' },
    { name: 'Samsung Galaxy Book', nameAr: 'سامسونج جالاكسي بوك', basePrice: 1800000, stock: 18, brand: 'samsung' },
    { name: 'MacBook Air', nameAr: 'ماك بوك إير', basePrice: 1500000, stock: 20, brand: 'apple' },
    { name: 'Dell Inspiron', nameAr: 'ديل إنسبايرون', basePrice: 1200000, stock: 25, brand: 'dell' },
    { name: 'HP Pavilion', nameAr: 'إتش بي بافيليون', basePrice: 1100000, stock: 22, brand: 'hp' },
    { name: 'Sony Vaio', nameAr: 'سوني فايو', basePrice: 1600000, stock: 8, brand: 'sony' },
    { name: 'Xiaomi Notebook', nameAr: 'شاومي نوت بوك', basePrice: 900000, stock: 15, brand: 'xiaomi' },
  ],
  tvs: [
    { name: 'Samsung 65" QLED', nameAr: 'سامسونج 65 إنش QLED', basePrice: 1800000, stock: 10, brand: 'samsung' },
    { name: 'LG 65" OLED', nameAr: 'إل جي 65 إنش OLED', basePrice: 2200000, stock: 8, brand: 'lg' },
    { name: 'Sony 75" Bravia', nameAr: 'سوني 75 إنش برافيا', basePrice: 2500000, stock: 6, brand: 'sony' },
    { name: 'Samsung 55" Crystal', nameAr: 'سامسونج 55 إنش كريستال', basePrice: 900000, stock: 15, brand: 'samsung' },
    { name: 'LG 55" NanoCell', nameAr: 'إل جي 55 إنش نانو سيل', basePrice: 1000000, stock: 12, brand: 'lg' },
    { name: 'Sony 55" 4K', nameAr: 'سوني 55 إنش 4K', basePrice: 1200000, stock: 10, brand: 'sony' },
    { name: 'Samsung Soundbar', nameAr: 'سامسونج ساوند بار', basePrice: 400000, stock: 20, brand: 'samsung' },
    { name: 'LG Soundbar', nameAr: 'إل جي ساوند بار', basePrice: 450000, stock: 18, brand: 'lg' },
    { name: 'Sony Home Theater', nameAr: 'سوني سينما منزلية', basePrice: 800000, stock: 8, brand: 'sony' },
    { name: 'Samsung Projector', nameAr: 'سامسونج جهاز عرض', basePrice: 1500000, stock: 5, brand: 'samsung' },
  ],
  accessories: [
    { name: 'Wireless Earbuds', nameAr: 'سماعات لاسلكية', basePrice: 150000, stock: 50, brand: 'samsung' },
    { name: 'USB-C Cable', nameAr: 'كابل USB-C', basePrice: 15000, stock: 100, brand: 'samsung' },
    { name: 'Phone Case', nameAr: 'غطاء هاتف', basePrice: 25000, stock: 80, brand: 'samsung' },
    { name: 'Screen Protector', nameAr: 'حاجز شاشة', basePrice: 10000, stock: 120, brand: 'samsung' },
    { name: 'Power Bank', nameAr: 'بنك طاقة', basePrice: 80000, stock: 40, brand: 'xiaomi' },
    { name: 'Wireless Charger', nameAr: 'شاحن لاسلكي', basePrice: 60000, stock: 45, brand: 'samsung' },
    { name: 'Laptop Stand', nameAr: 'حامل لابتوب', basePrice: 70000, stock: 30, brand: 'dell' },
    { name: 'Webcam HD', nameAr: 'كاميرا ويب HD', basePrice: 120000, stock: 25, brand: 'logitech' },
    { name: 'Mechanical Keyboard', nameAr: 'لوحة مفاتيح ميكانيكية', basePrice: 180000, stock: 20, brand: 'logitech' },
    { name: 'Gaming Mouse', nameAr: 'ماوس جيمينج', basePrice: 150000, stock: 35, brand: 'logitech' },
  ],
};

const specsTemplates = {
  electronics: [
    { key: 'Brand', keyAr: 'العلامة التجارية' },
    { key: 'Model', keyAr: 'الموديل' },
    { key: 'Warranty', keyAr: 'الضمان' },
    { key: 'Color', keyAr: 'اللون' },
    { key: 'Weight', keyAr: 'الوزن' },
  ],
  furniture: [
    { key: 'Material', keyAr: 'المادة' },
    { key: 'Dimensions', keyAr: 'الأبعاد' },
    { key: 'Color', keyAr: 'اللون' },
    { key: 'Assembly', keyAr: 'التجميع' },
    { key: 'Weight Capacity', keyAr: 'سعة الوزن' },
  ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateSKU(category: string, index: number): string {
  const prefix = category.substring(0, 3).toUpperCase();
  const number = String(index).padStart(6, '0');
  return `${prefix}-${number}`;
}

function generateSlug(name: string, index: number): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug}-${index}`;
}

function generateImages(category: string, index: number): string[] {
  const baseUrl = 'https://images.unsplash.com/photo-';
  const imageIds = {
    livingRoom: ['1555041469-a586c61ea9bc', '1618221195710-dd6b41faaea6', '1586023492125-27b2c045efd7'],
    bedroom: ['1616594039964-ae9021a400a0', '1505693416380-ac5ce068fe85', '1617104572548-4d4e4e5c5c5c'],
    kitchen: ['1556909114-f6e7ad7d3136', '1556910103-1c02745aae4d', '1584700385573-3c3c3c3c3c3c'],
    bathroom: ['1552321554-5fefe8c9ef14', '1584622650111-993a426fbf0a', '1552321554-5fefe8c9ef15'],
    smartphones: ['1511707171634-5f897ff02aa9', '1592750475162-4b4b4b4b4b4b', '1510557880182-3d4d4d4d4d4d'],
    laptops: ['1496181133206-80ce9b88a853', '1525547719571-a2d4ac8945e2', '1531297424002-6b4b4b4b4b4b'],
    tvs: ['1593359677879-a4bb92f829d1', '1593784781096-9b4b4b4b4b4b', '1587897929322-4b4b4b4b4b4b'],
    accessories: ['1544866092-1935c5ef2a8f', '1523275335684-37898b68b6d1', '1581222942949-4b4b4b4b4b4b'],
  };
  const ids = imageIds[category as keyof typeof imageIds] || imageIds.livingRoom;
  const id = ids[index % ids.length];
  return [
    `${baseUrl}${id}?w=800&q=80`,
    `${baseUrl}${id}?w=800&q=80&fit=crop`,
    `${baseUrl}${id}?w=800&q=80&fit=crop&crop=center`,
  ];
}

interface ProductTemplate {
  name: string;
  nameAr: string;
  basePrice: number;
  stock: number;
  brand?: string;
}

function generateSpecs(category: string, product: ProductTemplate, brand?: string) {
  const template = category === 'smartphones' || category === 'laptops' || category === 'tvs' || category === 'accessories' 
    ? specsTemplates.electronics 
    : specsTemplates.furniture;
  
  const specs: { key: string; value: string; position: number }[] = [];
  
  const colors = ['Black', 'White', 'Silver', 'Gray', 'Blue'];
  const materials = ['Wood', 'Metal', 'Glass', 'Plastic'];

  template.forEach((spec, index) => {
    let value = '';
    
    switch (spec.key) {
      case 'Brand':
        value = brand || 'Generic';
        break;
      case 'Model':
        value = product.name;
        break;
      case 'Warranty':
        value = '1 Year';
        break;
      case 'Color': {
        const colorIndex = index % colors.length;
        value = colors[colorIndex];
        break;
      }
      case 'Weight':
        value = category === 'smartphones' ? '200g' : category === 'laptops' ? '2.5kg' : '15kg';
        break;
      case 'Material': {
        const matIndex = index % materials.length;
        value = materials[matIndex];
        break;
      }
      case 'Dimensions':
        value = '100x50x80 cm';
        break;
      case 'Assembly':
        value = 'Required';
        break;
      case 'Weight Capacity':
        value = '100 kg';
        break;
      default:
        value = 'N/A';
    }
    
    specs.push({
      key: spec.key,
      value,
      position: index,
    });
  });
  
  return specs;
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productSpec.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  console.log('✅ Data cleaned');

  // Create categories
  console.log('📁 Creating categories...');
  const createdCategories = await Promise.all(
    categories.map((cat) =>
      prisma.category.create({
        data: cat,
      })
    )
  );
  console.log(`✅ Created ${createdCategories.length} categories`);

  // Create brands
  console.log('🏷️  Creating brands...');
  const createdBrands = await Promise.all(
    brands.map((brand) =>
      prisma.brand.create({
        data: brand,
      })
    )
  );
  console.log(`✅ Created ${createdBrands.length} brands`);

  // Create products
  console.log('📦 Creating products...');
  let productCount = 0;
  const categoryMap = {
    livingRoom: createdCategories[0].id,
    bedroom: createdCategories[1].id,
    kitchen: createdCategories[2].id,
    bathroom: createdCategories[3].id,
    smartphones: createdCategories[4].id,
    laptops: createdCategories[5].id,
    tvs: createdCategories[6].id,
    accessories: createdCategories[7].id,
  };

  const brandMap: Record<string, string> = Object.fromEntries(
    createdBrands.map((b) => [b.slug, b.id])
  );

  for (const [categoryKey, templates] of Object.entries(productTemplates)) {
    const categoryId = categoryMap[categoryKey as keyof typeof categoryMap];
    
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      const sku = generateSKU(categoryKey, productCount + 1);
      const slug = generateSlug(template.name, productCount + 1);
      const brandId = template.brand ? brandMap[template.brand] : null;
      
      // Random price variation
      const priceVariation = Math.random() * 0.2 - 0.1; // ±10%
      const price = Math.round(template.basePrice * (1 + priceVariation));
      
      const product = await prisma.product.create({
        data: {
          sku,
          slug,
          name: template.name,
          nameAr: template.nameAr,
          description: `High-quality ${template.name.toLowerCase()} for your ${categoryKey.replace(/([A-Z])/g, ' $1').toLowerCase()}.`,
          descriptionAr: `${template.nameAr} عالي الجودة لـ ${categoryKey}.`,
          price: price,
          compareAtPrice: Math.round(price * 1.1),
          costPrice: Math.round(price * 0.6),
          stock: template.stock,
          lowStockThreshold: Math.max(5, Math.floor(template.stock * 0.2)),
          weight: categoryKey === 'smartphones' ? 0.2 : categoryKey === 'laptops' ? 2.5 : 15,
          isActive: true,
          isFeatured: Math.random() > 0.7,
          categoryId,
          brandId,
          warrantyDuration: 12,
          warrantyUnit: 'months',
          warrantyCoverage: 'Manufacturer warranty',
        },
      });

      // Create images
      const images = generateImages(categoryKey, i);
      await Promise.all(
        images.map((url, index) =>
          prisma.productImage.create({
            data: {
              productId: product.id,
              url,
              alt: `${template.name} - Image ${index + 1}`,
              position: index,
              isPrimary: index === 0,
            },
          })
        )
      );

      // Create specs
      const specs = generateSpecs(categoryKey, template, template.brand);
      await Promise.all(
        specs.map((spec) =>
          prisma.productSpec.create({
            data: {
              productId: product.id,
              ...spec,
            },
          })
        )
      );

      productCount++;
      
      if (productCount % 50 === 0) {
        console.log(`   Created ${productCount} products...`);
      }
    }
  }

  // Generate additional products to reach 2000+
  console.log('📦 Generating additional products...');
  const additionalProductsNeeded = 2000 - productCount;
  const categoryKeys = Object.keys(categoryMap);
  
  for (let i = 0; i < additionalProductsNeeded; i++) {
    const categoryKey = categoryKeys[i % categoryKeys.length];
    const categoryId = categoryMap[categoryKey as keyof typeof categoryMap];
    const templates = productTemplates[categoryKey as keyof typeof productTemplates];
    const template = templates[i % templates.length];
    
    const sku = generateSKU(categoryKey, productCount + 1);
    const slug = generateSlug(template.name, productCount + 1);
    const brandId = template.brand ? brandMap[template.brand] : null;
    
    const priceVariation = Math.random() * 0.3 - 0.15; // ±15%
    const price = Math.round(template.basePrice * (1 + priceVariation));
    
    const product = await prisma.product.create({
      data: {
        sku,
        slug,
        name: `${template.name} (Variant ${i + 1})`,
        nameAr: `${template.nameAr} (متغير ${i + 1})`,
        description: `High-quality ${template.name.toLowerCase()} variant ${i + 1}.`,
        descriptionAr: `${template.nameAr} متغير ${i + 1}.`,
        price: price,
        compareAtPrice: Math.round(price * 1.1),
        costPrice: Math.round(price * 0.6),
        stock: Math.floor(Math.random() * 50) + 5,
        lowStockThreshold: 5,
        weight: categoryKey === 'smartphones' ? 0.2 : categoryKey === 'laptops' ? 2.5 : 15,
        isActive: true,
        isFeatured: Math.random() > 0.8,
        categoryId,
        brandId,
        warrantyDuration: 12,
        warrantyUnit: 'months',
        warrantyCoverage: 'Manufacturer warranty',
      },
    });

    const images = generateImages(categoryKey, i);
    await Promise.all(
      images.map((url, index) =>
        prisma.productImage.create({
          data: {
            productId: product.id,
            url,
            alt: `${template.name} - Image ${index + 1}`,
            position: index,
            isPrimary: index === 0,
          },
        })
      )
    );

    const specs = generateSpecs(categoryKey, template, template.brand);
    await Promise.all(
      specs.map((spec) =>
        prisma.productSpec.create({
          data: {
            productId: product.id,
            ...spec,
          },
        })
      )
    );

    productCount++;
    
    if (productCount % 100 === 0) {
      console.log(`   Created ${productCount} products...`);
    }
  }

  console.log(`✅ Created ${productCount} products total`);
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
