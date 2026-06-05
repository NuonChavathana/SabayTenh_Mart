import * as path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcrypt";
import { count } from "drizzle-orm";
import {
  db,
  pool,
  usersTable,
  categoriesTable,
  brandsTable,
  productsTable,
  couponsTable,
} from "../src/index.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  process.loadEnvFile(path.resolve(__dirname, "../../.env"));
} catch {
  // ignore
}

const [userCount] = await db.select({ value: count() }).from(usersTable);

if ((userCount?.value ?? 0) > 0) {
  console.log("Database already has data — skipping seed.");
  await pool.end();
  process.exit(0);
}

const passwordHash = await bcrypt.hash("password123", 10);

await db.insert(usersTable).values([
  {
    email: "admin@sabaytenh.com",
    password: passwordHash,
    name: "Admin User",
    phone: "012345678",
    role: "admin",
  },
  {
    email: "staff@sabaytenh.com",
    password: passwordHash,
    name: "Staff User",
    phone: "012345679",
    role: "staff",
  },
  {
    email: "customer@gmail.com",
    password: passwordHash,
    name: "Customer Demo",
    phone: "012345680",
    role: "customer",
  },
]);

const categoryRows = await db
  .insert(categoriesTable)
  .values([
    { name: "Groceries", nameKh: "គ្រឿងទេស", slug: "groceries", sortOrder: 1 },
    { name: "Electronics", nameKh: "អេឡិចត្រូនិច", slug: "electronics", sortOrder: 2 },
    { name: "Clothing", nameKh: "សម្លៀកបំពាក់", slug: "clothing", sortOrder: 3 },
    { name: "Home & Kitchen", nameKh: "ផ្ទះ និងផ្ទះបាយ", slug: "home-kitchen", sortOrder: 4 },
    { name: "Health & Beauty", nameKh: "សុខភាព និងសម្រស់", slug: "health-beauty", sortOrder: 5 },
    { name: "Sports", nameKh: "កីឡា", slug: "sports", sortOrder: 6 },
    { name: "Toys", nameKh: "ប្រដាប់ក្មេង", slug: "toys", sortOrder: 7 },
    { name: "Books", nameKh: "សៀវភៅ", slug: "books", sortOrder: 8 },
    { name: "Automotive", nameKh: "យានយន្ត", slug: "automotive", sortOrder: 9 },
    { name: "Pet Supplies", nameKh: "សត្វចិញ្ចឹម", slug: "pets", sortOrder: 10 },
    { name: "Beverages", nameKh: "ភេសជ្ជៈ", slug: "beverages", sortOrder: 11 },
    { name: "Fresh Produce", nameKh: "បន្លែ", slug: "produce", sortOrder: 12 },
  ])
  .$returningId();

const brandRows = await db
  .insert(brandsTable)
  .values([
    { name: "SabayTenh" },
    { name: "Samsung" },
    { name: "Apple" },
    { name: "Nike" },
    { name: "Unilever" },
    { name: "Nestlé" },
    { name: "Sony" },
    { name: "LG" },
    { name: "Adidas" },
    { name: "P&G" },
    { name: "Canon" },
    { name: "Philips" },
    { name: "Local Fresh" },
    { name: "Khmer Goods" },
    { name: "ValueMart" },
  ])
  .$returningId();

const productTemplates = [
  { name: "Premium Jasmine Rice 5kg", nameKh: "អង្ករ ចំណើយ ៥គីឡូ", price: "12.99", cat: 0, brand: 0, featured: true },
  { name: "Cooking Oil 1L", nameKh: "ប្រេងឆា ១លីត្រ", price: "3.49", cat: 0, brand: 4, featured: false },
  { name: "Samsung Galaxy A15", nameKh: "សាមសុង Galaxy A15", price: "199.00", cat: 1, brand: 1, featured: true },
  { name: "Wireless Earbuds", nameKh: "កាសឥតខ្សែ", price: "29.99", cat: 1, brand: 6, featured: true },
  { name: "Men Cotton T-Shirt", nameKh: "អាវយឺតបុរស", price: "8.99", cat: 2, brand: 3, featured: false },
  { name: "Women Running Shoes", nameKh: "ស្បែកជើងរត់ប្រពន", price: "54.99", cat: 2, brand: 8, featured: true },
  { name: "Non-Stick Pan 28cm", nameKh: "ខ្ទះអន្លាក់ ២៨ស.ម", price: "18.50", cat: 3, brand: 11, featured: false },
  { name: "Blender 600W", nameKh: "ម៉ាស៊ីនក្រឡុក", price: "32.00", cat: 3, brand: 11, featured: false },
  { name: "Shampoo 400ml", nameKh: "សាប៊ូកក់សក់", price: "5.99", cat: 4, brand: 9, featured: false },
  { name: "Face Moisturizer", nameKh: "ឡេលាបមុខ", price: "11.99", cat: 4, brand: 4, featured: false },
  { name: "Football Size 5", nameKh: "បាល់ទាត់ ទំហំ ៥", price: "15.00", cat: 5, brand: 3, featured: false },
  { name: "Yoga Mat", nameKh: "កម្រាលយូហ្គា", price: "12.00", cat: 5, brand: 14, featured: false },
  { name: "Building Blocks Set", nameKh: "ឧបករណ៍ប្រគារប្លុក", price: "22.99", cat: 6, brand: 14, featured: true },
  { name: "Khmer Story Book", nameKh: "សៀវភៅរឿងខ្មែរ", price: "6.50", cat: 7, brand: 13, featured: false },
  { name: "Car Phone Mount", nameKh: "ទ្រនាបទូរស័ព្ទរថយន្ត", price: "7.99", cat: 8, brand: 14, featured: false },
  { name: "Dog Food 2kg", nameKh: "អាហារឆ្កែ ២គីឡូ", price: "9.99", cat: 9, brand: 14, featured: false },
  { name: "Mineral Water 24pk", nameKh: "ទឹករ៉ូភី ២៤កំប៉ុង", price: "4.99", cat: 10, brand: 5, featured: true },
  { name: "Orange Juice 1L", nameKh: "ទឹកក្រូច ១លីត្រ", price: "2.99", cat: 10, brand: 5, featured: false },
  { name: "Fresh Tomatoes 1kg", nameKh: "ប៉េងប៉ោះ ១គីឡូ", price: "1.49", cat: 11, brand: 12, featured: false },
  { name: "Organic Lettuce", nameKh: "សាលាដូអរហ្គានិច", price: "1.99", cat: 11, brand: 12, featured: false },
];

await db.insert(productsTable).values(
  productTemplates.map((p, i) => ({
    name: p.name,
    nameKh: p.nameKh,
    description: `Quality ${p.name} available at SabayTenh Mart.`,
    price: p.price,
    originalPrice: p.featured ? String((Number(p.price) * 1.15).toFixed(2)) : null,
    discountPercent: p.featured ? 10 : null,
    image: `https://picsum.photos/seed/sabaytenh-${i + 1}/400/400`,
    categoryId: categoryRows[p.cat]!.id,
    brandId: brandRows[p.brand]!.id,
    stock: 50 + i * 3,
    lowStockThreshold: 10,
    isFeatured: p.featured,
    tags: "demo,local",
    soldCount: i * 2,
  })),
);

await db.insert(couponsTable).values([
  {
    code: "WELCOME10",
    type: "percent",
    value: "10",
    minOrder: "10",
    maxUses: 100,
    isActive: true,
  },
  {
    code: "FLAT5",
    type: "flat",
    value: "5",
    minOrder: "25",
    maxUses: 50,
    isActive: true,
  },
]);

console.log("Seed complete:");
console.log("  - 3 users: admin, staff, customer");
console.log("  - Password: password123");
console.log("  - 12 categories");
console.log("  - 15 brands");
console.log("  - 20 products");
console.log("  - 2 coupons");

await pool.end();