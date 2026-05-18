/**
 * AI Content Seeder
 * ──────────────────────────────────────────────────────────────────────────────
 * Đọc các file CSV từ ./scripts/seed-data/ và đẩy vào Strapi REST API
 * theo đúng thứ tự phụ thuộc (dependency order).
 *
 * Cách chạy (đứng tại thư mục /strapi):
 *   node scripts/seed-from-csv.mjs
 *
 * Yêu cầu:
 *   - Strapi đang chạy (mặc định http://localhost:1337)
 *   - File .env có STRAPI_ADMIN_TOKEN (Full-access API Token)
 *   - Cài thư viện: yarn add csv-parse
 *
 * Tạo API Token:
 *   Strapi Admin → Settings → API Tokens → Create new token → Type: Full access
 * ──────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Đọc .env thủ công (không cần dotenv, tương thích mọi Node version)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    if (key && !process.env[key]) {
      process.env[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
    }
  }
}

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_ADMIN_TOKEN;
const SEED_DIR = path.join(__dirname, 'seed-data');
const DEFAULT_LOCALE = 'en';

// ─── UTILS ────────────────────────────────────────────────────────────────────

const log = {
  info: (msg) => console.log(`\n📂 ${msg}`),
  ok: (id, label) => console.log(`  ✅ [ID:${id}] ${label}`),
  skip: (msg) => console.log(`  ⚠️  ${msg}`),
  error: (endpoint, msg) => console.error(`  ❌ [${endpoint}] ${msg}`),
  section: (msg) => console.log(`\n${'─'.repeat(60)}\n🚀 ${msg}`),
};

/**
 * Đọc và parse file CSV từ thư mục seed-data/
 * @param {string} filename
 * @returns {Record<string, string>[]}
 */
const readCsv = (filename) => {
  const filePath = path.join(SEED_DIR, filename);
  if (!fs.existsSync(filePath)) {
    log.skip(`File không tồn tại, bỏ qua: ${filename}`);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
  });
};

/**
 * Gửi POST request tới Strapi REST API
 * @param {string} endpoint  - Ví dụ: 'categories', 'products'
 * @param {object} data      - Payload gửi lên
 * @returns {object|null}    - Strapi entity đã tạo
 */
const post = async (endpoint, data) => {
  const url = `${STRAPI_URL}/api/${endpoint}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({ data }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      let errMsg = errBody;
      try {
        const parsed = JSON.parse(errBody);
        errMsg = parsed?.error?.message || errBody;
      } catch { /* không phải JSON */ }
      log.error(endpoint, `HTTP ${res.status} — ${errMsg}`);
      return null;
    }

    const json = await res.json();
    return json.data ?? null;
  } catch (err) {
    log.error(endpoint, `Network error — ${err.message}`);
    return null;
  }
};

/**
 * Parse chuỗi pipe-separated thành mảng các object { text }
 * Dùng cho trường "perks" trong Product và Plan
 * @param {string} raw  - Ví dụ: "Tính năng A|Tính năng B"
 * @returns {{ text: string }[]}
 */
const parsePerks = (raw) =>
  (raw || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((text) => ({ text }));

// ─── SEEDERS ──────────────────────────────────────────────────────────────────

/**
 * Seed Categories
 * Schema: { name, locale }
 * @returns {Record<string, number>} Map từ name → Strapi ID
 */
const seedCategories = async () => {
  log.info('Seeding Categories...');
  const rows = readCsv('01_categories.csv');
  const map = {};

  for (const row of rows) {
    if (!row.name) { log.skip('Bỏ qua dòng không có name'); continue; }

    const created = await post('categories', {
      name: row.name,
      locale: row.locale || DEFAULT_LOCALE,
    });

    if (created) {
      map[row.name] = created.id;
      log.ok(created.id, row.name);
    }
  }
  return map;
};

/**
 * Seed Products
 * Schema: { name, slug, description, price, featured, category_name, perks, locale }
 * @param {Record<string, number>} categoryMap
 * @returns {Record<string, number>} Map từ name → Strapi ID
 */
const seedProducts = async (categoryMap) => {
  log.info('Seeding Products...');
  const rows = readCsv('02_products.csv');
  const map = {};

  for (const row of rows) {
    if (!row.name) { log.skip('Bỏ qua dòng không có name'); continue; }

    const categoryId = categoryMap[row.category_name];
    if (row.category_name && !categoryId) {
      log.skip(`Category "${row.category_name}" không tìm thấy — tiếp tục không có relation`);
    }

    const created = await post('products', {
      name: row.name,
      description: row.description || '',
      price: parseInt(row.price, 10) || 0,
      featured: row.featured === 'true',
      locale: row.locale || DEFAULT_LOCALE,
      perks: parsePerks(row.perks),
      // Strapi v5: quan hệ dùng mảng ID
      categories: categoryId ? [categoryId] : [],
    });

    if (created) {
      map[row.name] = created.id;
      log.ok(created.id, row.name);
    }
  }
  return map;
};

/**
 * Seed Plans
 * Schema: { name, price, sub_text, featured, cta_label, cta_url, cta_variant,
 *           product_name, perks, additional_perks, locale }
 * @param {Record<string, number>} productMap
 */
const seedPlans = async (productMap) => {
  log.info('Seeding Plans...');
  const rows = readCsv('03_plans.csv');

  for (const row of rows) {
    if (!row.name) { log.skip('Bỏ qua dòng không có name'); continue; }

    const productId = productMap[row.product_name];
    if (row.product_name && !productId) {
      log.skip(`Product "${row.product_name}" không tìm thấy — tiếp tục không có relation`);
    }

    const created = await post('plans', {
      name: row.name,
      price: parseInt(row.price, 10) || 0,
      sub_text: row.sub_text || '',
      featured: row.featured === 'true',
      locale: row.locale || DEFAULT_LOCALE,
      // shared.button: { text, URL, variant }
      CTA: {
        text: row.cta_label || '',
        URL: row.cta_url || '/',
        variant: row.cta_variant || 'primary',
      },
      perks: parsePerks(row.perks),
      additional_perks: parsePerks(row.additional_perks),
      product: productId ?? null,
    });

    if (created) log.ok(created.id, `${row.name} (plan của: ${row.product_name})`);
  }
};

/**
 * Seed FAQs
 * Schema: { question, answer, locale }
 */
const seedFaqs = async () => {
  log.info('Seeding FAQs...');
  const rows = readCsv('04_faqs.csv');

  for (const row of rows) {
    if (!row.question) { log.skip('Bỏ qua dòng không có question'); continue; }

    const created = await post('faqs', {
      question: row.question,
      answer: row.answer || '',
      locale: row.locale || DEFAULT_LOCALE,
    });

    if (created) log.ok(created.id, row.question.slice(0, 60));
  }
};

/**
 * Seed Testimonials
 * Schema: { text, user_name, user_title, locale }
 * Note: shared.user dùng { firstname, lastname, job } — ta split user_name
 */
const seedTestimonials = async () => {
  log.info('Seeding Testimonials...');
  const rows = readCsv('05_testimonials.csv');

  for (const row of rows) {
    if (!row.text) { log.skip('Bỏ qua dòng không có text'); continue; }

    // Tách "Nguyễn Văn A" → firstname: "Nguyễn Văn", lastname: "A"
    const nameParts = (row.user_name || '').trim().split(' ');
    const lastname = nameParts.pop() || '';
    const firstname = nameParts.join(' ') || lastname;

    const created = await post('testimonials', {
      text: row.text,
      locale: row.locale || DEFAULT_LOCALE,
      user: {
        firstname,
        lastname,
        job: row.user_title || '',
        // image cần upload riêng — bỏ qua ở bước này
      },
    });

    if (created) log.ok(created.id, row.user_name || '(no name)');
  }
};

/**
 * Seed Articles
 * Schema: { title, slug, description, category_name, locale, published }
 * Note: Trường `content` (Blocks) cần convert riêng — seed title/description trước
 * @param {Record<string, number>} categoryMap
 */
const seedArticles = async (categoryMap) => {
  log.info('Seeding Articles...');
  const rows = readCsv('06_articles.csv');

  for (const row of rows) {
    if (!row.title) { log.skip('Bỏ qua dòng không có title'); continue; }

    const categoryIds = (row.category_name || '')
      .split('|')
      .map((n) => categoryMap[n.trim()])
      .filter(Boolean);

    const payload = {
      title: row.title,
      description: row.description || '',
      locale: row.locale || DEFAULT_LOCALE,
      categories: categoryIds,
      // publishedAt: null → Draft; chuỗi ISO → Published
      publishedAt: row.published === 'true' ? new Date().toISOString() : null,
    };

    const created = await post('articles', payload);
    if (created) log.ok(created.id, row.title);
  }
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────

(async () => {
  log.section('AI Content Seeder — Bắt đầu');
  console.log(`📡 Strapi URL : ${STRAPI_URL}`);
  console.log(`📁 Seed Dir  : ${SEED_DIR}`);

  // Kiểm tra điều kiện bắt buộc
  if (!API_TOKEN) {
    console.error('\n❌ STRAPI_ADMIN_TOKEN chưa được cấu hình!');
    console.error('   → Vào Strapi Admin > Settings > API Tokens > Create new token (Full access)');
    console.error('   → Thêm vào strapi/.env: STRAPI_ADMIN_TOKEN=your_token_here\n');
    process.exit(1);
  }

  // Kiểm tra Strapi có đang chạy không
  try {
    const healthCheck = await fetch(`${STRAPI_URL}/_health`);
    if (!healthCheck.ok) throw new Error(`Status ${healthCheck.status}`);
    console.log('✅ Strapi đang chạy và phản hồi bình thường.\n');
  } catch (err) {
    console.error(`\n❌ Không thể kết nối đến Strapi tại ${STRAPI_URL}`);
    console.error(`   → Lỗi: ${err.message}`);
    console.error('   → Hãy chắc chắn Strapi đang chạy trước khi seed.\n');
    process.exit(1);
  }

  // Chạy seed theo thứ tự phụ thuộc
  const categoryMap = await seedCategories();
  const productMap  = await seedProducts(categoryMap);
  await seedPlans(productMap);
  await seedFaqs();
  await seedTestimonials();
  await seedArticles(categoryMap);

  console.log('\n' + '═'.repeat(60));
  console.log('🎉 Seeding hoàn tất!');
  console.log(`   Kiểm tra dữ liệu tại: ${STRAPI_URL}/admin`);
  console.log('═'.repeat(60) + '\n');
})();
