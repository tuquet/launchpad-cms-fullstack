/**
 * AI Content Seeder v2
 * ──────────────────────────────────────────────────────────────────────────────
 * Đọc CSV + JSON từ ./scripts/seed-data/ và đẩy vào Strapi REST API
 * theo đúng thứ tự phụ thuộc (dependency order).
 *
 * Hỗ trợ:
 *   - Collection Types (CSV): Categories, Products, Plans, FAQs, Testimonials, Articles
 *   - Single Types (JSON): Global, Blog-page, Product-page
 *   - Pages + Dynamic Zones (JSON): Homepage
 *   - Article Blocks content (JSON)
 *   - Image upload từ URL
 *   - Idempotency (check-and-skip by slug/name)
 *   - Cleanup mode (--clean)
 *   - Auto-publish cho draft-enabled types
 *
 * Cách chạy (đứng tại thư mục /strapi):
 *   node scripts/seed-from-csv.mjs
 *   node scripts/seed-from-csv.mjs --clean     # Xóa data cũ trước khi seed
 *   node scripts/seed-from-csv.mjs --dry-run   # Preview, không gửi API
 *
 * Yêu cầu:
 *   - Strapi đang chạy (mặc định http://localhost:1337)
 *   - File strapi/.env có STRAPI_ADMIN_TOKEN (Full-access API Token)
 *   - Cài thư viện: yarn add csv-parse
 * ──────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const FLAG_CLEAN = args.includes('--clean');
const FLAG_DRY_RUN = args.includes('--dry-run');

// Đọc .env thủ công
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
  dry: (endpoint, label) => console.log(`  🔍 [DRY-RUN] ${endpoint}: ${label}`),
  clean: (endpoint, count) => console.log(`  🗑️  [${endpoint}] Xóa ${count} bản ghi`),
};

/** Đọc file CSV */
const readCsv = (filename) => {
  const filePath = path.join(SEED_DIR, filename);
  if (!fs.existsSync(filePath)) {
    log.skip(`File không tồn tại, bỏ qua: ${filename}`);
    return [];
  }
  return parse(fs.readFileSync(filePath, 'utf-8'), {
    columns: true, skip_empty_lines: true, trim: true, relax_quotes: true,
  });
};

/** Đọc file JSON */
const readJson = (relativePath) => {
  const filePath = path.join(SEED_DIR, relativePath);
  if (!fs.existsSync(filePath)) {
    log.skip(`File không tồn tại, bỏ qua: ${relativePath}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

/** POST request tới Strapi */
const post = async (endpoint, data) => {
  if (FLAG_DRY_RUN) {
    log.dry(endpoint, JSON.stringify(data).slice(0, 100));
    return { id: 0, documentId: 'dry-run' };
  }
  const url = `${STRAPI_URL}/api/${endpoint}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_TOKEN}` },
      body: JSON.stringify({ data }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      let errMsg = errBody;
      try { errMsg = JSON.parse(errBody)?.error?.message || errBody; } catch { /* */ }
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

/** PUT request tới Strapi (cho Single Types) */
const put = async (endpoint, data) => {
  if (FLAG_DRY_RUN) {
    log.dry(`PUT ${endpoint}`, JSON.stringify(data).slice(0, 100));
    return { id: 0 };
  }
  const url = `${STRAPI_URL}/api/${endpoint}`;
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_TOKEN}` },
      body: JSON.stringify({ data }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      let errMsg = errBody;
      try { errMsg = JSON.parse(errBody)?.error?.message || errBody; } catch { /* */ }
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

/** GET request — lấy danh sách entities */
const getAll = async (endpoint, params = '') => {
  const url = `${STRAPI_URL}/api/${endpoint}?pagination[pageSize]=100${params ? '&' + params : ''}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch { return []; }
};

/** DELETE request */
const del = async (endpoint, documentId) => {
  if (FLAG_DRY_RUN) return;
  const url = `${STRAPI_URL}/api/${endpoint}/${documentId}`;
  try {
    await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${API_TOKEN}` } });
  } catch { /* silent */ }
};

/** Xóa toàn bộ data của một endpoint */
const cleanEndpoint = async (endpoint) => {
  const items = await getAll(endpoint);
  if (items.length === 0) return;
  for (const item of items) {
    await del(endpoint, item.documentId);
  }
  log.clean(endpoint, items.length);
};

/** Upload image từ URL lên Strapi Media Library */
const uploadImageFromUrl = async (imageUrl, filename) => {
  if (FLAG_DRY_RUN) return 0;
  if (!imageUrl) return null;
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) { log.skip(`Không tải được ảnh: ${imageUrl}`); return null; }
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
    const safeName = (filename || 'image').replace(/[^a-zA-Z0-9-_]/g, '_') + ext;

    const boundary = '----FormBoundary' + Date.now();
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${safeName}"\r\nContent-Type: image/jpeg\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([Buffer.from(header), buffer, Buffer.from(footer)]);

    const res = await fetch(`${STRAPI_URL}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body,
    });
    if (!res.ok) { log.skip(`Upload ảnh thất bại: ${safeName}`); return null; }
    const json = await res.json();
    return json[0]?.id ?? null;
  } catch (err) {
    log.skip(`Lỗi upload ảnh: ${err.message}`);
    return null;
  }
};

/** Parse pipe-separated thành mảng { text } */
const parsePerks = (raw) =>
  (raw || '').split('|').map((s) => s.trim()).filter(Boolean).map((text) => ({ text }));

/** Check entity đã tồn tại chưa (by field) */
const findExisting = async (endpoint, field, value) => {
  const items = await getAll(endpoint, `filters[${field}][$eq]=${encodeURIComponent(value)}`);
  return items.length > 0 ? items[0] : null;
};

// ─── SEEDERS ──────────────────────────────────────────────────────────────────

const seedCategories = async () => {
  log.info('Seeding Categories...');
  const rows = readCsv('01_categories.csv');
  const map = {};
  for (const row of rows) {
    if (!row.name) { log.skip('Bỏ qua dòng không có name'); continue; }
    const existing = await findExisting('categories', 'name', row.name);
    if (existing) { map[row.name] = existing.id; log.skip(`Đã tồn tại: ${row.name} (ID:${existing.id})`); continue; }
    const created = await post('categories', {
      name: row.name,
      locale: row.locale || DEFAULT_LOCALE,
    });
    if (created) { map[row.name] = created.id; log.ok(created.id, row.name); }
  }
  return map;
};

const seedProducts = async (categoryMap) => {
  log.info('Seeding Products...');
  const rows = readCsv('02_products.csv');
  const map = {};
  for (const row of rows) {
    if (!row.name) { log.skip('Bỏ qua dòng không có name'); continue; }
    const existing = await findExisting('products', 'name', row.name);
    if (existing) { map[row.name] = existing.id; log.skip(`Đã tồn tại: ${row.name} (ID:${existing.id})`); continue; }

    const categoryId = categoryMap[row.category_name];
    if (row.category_name && !categoryId) {
      log.skip(`Category "${row.category_name}" không tìm thấy`);
    }

    const payload = {
      name: row.name,
      slug: row.slug || row.name.toLowerCase().replace(/\s+/g, '-'),
      description: row.description || '',
      price: parseInt(row.price, 10) || 0,
      featured: row.featured === 'true',
      locale: row.locale || DEFAULT_LOCALE,
      perks: parsePerks(row.perks),
      categories: categoryId ? [categoryId] : [],
      publishedAt: new Date().toISOString(),
    };

    const created = await post('products', payload);
    if (created) { map[row.name] = created.id; log.ok(created.id, row.name); }
  }
  return map;
};

const seedPlans = async (productMap) => {
  log.info('Seeding Plans...');
  const rows = readCsv('03_plans.csv');
  const map = {};
  for (const row of rows) {
    if (!row.name) { log.skip('Bỏ qua dòng không có name'); continue; }
    const existing = await findExisting('plans', 'name', row.name);
    if (existing) { map[row.name] = existing.id; log.skip(`Đã tồn tại: ${row.name} (ID:${existing.id})`); continue; }

    const productId = productMap[row.product_name];
    if (row.product_name && !productId) {
      log.skip(`Product "${row.product_name}" không tìm thấy`);
    }
    const created = await post('plans', {
      name: row.name,
      price: parseInt(row.price, 10) || 0,
      sub_text: row.sub_text || '',
      featured: row.featured === 'true',
      locale: row.locale || DEFAULT_LOCALE,
      CTA: { text: row.cta_label || '', URL: row.cta_url || '/', variant: row.cta_variant || 'primary' },
      perks: parsePerks(row.perks),
      additional_perks: parsePerks(row.additional_perks),
      product: productId ?? null,
      publishedAt: new Date().toISOString(),
    });
    if (created) { map[row.name] = created.id; log.ok(created.id, `${row.name} (plan of: ${row.product_name})`); }
  }
  return map;
};

const seedFaqs = async () => {
  log.info('Seeding FAQs...');
  const rows = readCsv('04_faqs.csv');
  const map = {};
  for (const row of rows) {
    if (!row.question) { log.skip('Bỏ qua dòng không có question'); continue; }
    const existing = await findExisting('faqs', 'question', row.question);
    if (existing) { map[row.question] = existing.id; log.skip(`Đã tồn tại: ${row.question.slice(0, 40)}...`); continue; }
    const created = await post('faqs', {
      question: row.question,
      answer: row.answer || '',
      locale: row.locale || DEFAULT_LOCALE,
    });
    if (created) { map[row.question] = created.id; log.ok(created.id, row.question.slice(0, 60)); }
  }
  return map;
};

const seedTestimonials = async () => {
  log.info('Seeding Testimonials...');
  const rows = readCsv('05_testimonials.csv');
  const map = {};
  for (const row of rows) {
    if (!row.text) { log.skip('Bỏ qua dòng không có text'); continue; }
    const existing = await findExisting('testimonials', 'text', row.text);
    if (existing) { map[row.user_name] = existing.id; log.skip(`Đã tồn tại: ${row.user_name}`); continue; }

    const nameParts = (row.user_name || '').trim().split(' ');
    const lastname = nameParts.pop() || '';
    const firstname = nameParts.join(' ') || lastname;

    const created = await post('testimonials', {
      text: row.text,
      locale: row.locale || DEFAULT_LOCALE,
      user: { firstname, lastname, job: row.user_title || '' },
      publishedAt: new Date().toISOString(),
    });
    if (created) { map[row.user_name] = created.id; log.ok(created.id, row.user_name || '(no name)'); }
  }
  return map;
};

const seedArticles = async (categoryMap) => {
  log.info('Seeding Articles...');
  const rows = readCsv('06_articles.csv');
  const blocksData = readJson('blocks/articles.json') || [];
  const map = {};

  for (const row of rows) {
    if (!row.title) { log.skip('Bỏ qua dòng không có title'); continue; }
    const slug = row.slug || row.title.toLowerCase().replace(/\s+/g, '-');
    const existing = await findExisting('articles', 'slug', slug);
    if (existing) { map[row.title] = existing.id; log.skip(`Đã tồn tại: ${row.title}`); continue; }

    const categoryIds = (row.category_name || '')
      .split('|').map((n) => categoryMap[n.trim()]).filter(Boolean);

    // Tìm blocks content matching slug
    const articleBlocks = blocksData.find((b) => b.slug === slug);

    const payload = {
      title: row.title,
      slug,
      description: row.description || '',
      locale: row.locale || DEFAULT_LOCALE,
      categories: categoryIds,
      publishedAt: row.published === 'true' ? new Date().toISOString() : null,
      seo: {
        metaTitle: row.title.slice(0, 60),
        metaDescription: (row.description || row.title).slice(0, 160),
      },
    };

    // Gắn blocks content nếu có
    if (articleBlocks?.content) {
      payload.content = articleBlocks.content;
    }

    const created = await post('articles', payload);
    if (created) { map[row.title] = created.id; log.ok(created.id, row.title); }
  }
  return map;
};

// ─── SINGLE TYPE SEEDERS ──────────────────────────────────────────────────────

const seedGlobal = async () => {
  log.info('Seeding Global (Navbar + Footer)...');
  const data = readJson('single-types/global.json');
  if (!data) return;
  const result = await put('global', data);
  if (result) log.ok(result.id || 'OK', 'Global config updated');
};

const seedBlogPage = async () => {
  log.info('Seeding Blog Page...');
  const data = readJson('single-types/blog-page.json');
  if (!data) return;
  const result = await put('blog-page', data);
  if (result) log.ok(result.id || 'OK', 'Blog page updated');
};

const seedProductPage = async () => {
  log.info('Seeding Product Page...');
  const data = readJson('single-types/product-page.json');
  if (!data) return;
  const result = await put('product-page', data);
  if (result) log.ok(result.id || 'OK', 'Product page updated');
};

// ─── PAGE + DYNAMIC ZONE SEEDER ──────────────────────────────────────────────

const seedPages = async (planMap, testimonialMap, faqMap) => {
  log.info('Seeding Pages (with Dynamic Zones)...');

  const pagesDir = path.join(SEED_DIR, 'pages');
  if (!fs.existsSync(pagesDir)) { log.skip('Thư mục pages/ không tồn tại'); return; }

  const files = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const pageData = JSON.parse(fs.readFileSync(path.join(pagesDir, file), 'utf-8'));
    const slug = pageData.slug;
    if (!slug) { log.skip(`File ${file} không có slug`); continue; }

    const existing = await findExisting('pages', 'slug', slug);
    if (existing) { log.skip(`Page "${slug}" đã tồn tại (ID:${existing.id})`); continue; }

    // Inject relation IDs vào dynamic_zone
    if (pageData.dynamic_zone) {
      for (const zone of pageData.dynamic_zone) {
        if (zone._plans_ref === 'INJECT_PLAN_IDS') {
          zone.plans = Object.values(planMap);
          delete zone._plans_ref;
        }
        if (zone._testimonials_ref === 'INJECT_TESTIMONIAL_IDS') {
          zone.testimonials = Object.values(testimonialMap);
          delete zone._testimonials_ref;
        }
        if (zone._faqs_ref === 'INJECT_FAQ_IDS') {
          zone.faqs = Object.values(faqMap);
          delete zone._faqs_ref;
        }
      }
    }

    // Remove comment fields
    delete pageData._comment;

    const created = await post('pages', {
      ...pageData,
      publishedAt: new Date().toISOString(),
    });
    if (created) log.ok(created.id, `Page: ${slug}`);
  }
};

// ─── CLEANUP ──────────────────────────────────────────────────────────────────

const cleanAllData = async () => {
  log.section('🗑️  Cleanup Mode — Xóa toàn bộ data cũ...');
  // Xóa theo thứ tự ngược phụ thuộc
  const endpoints = ['pages', 'articles', 'plans', 'products', 'testimonials', 'faqs', 'categories'];
  for (const ep of endpoints) {
    await cleanEndpoint(ep);
  }
  console.log('  ✅ Cleanup hoàn tất.\n');
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────

(async () => {
  log.section('AI Content Seeder v2 — Bắt đầu');
  console.log(`📡 Strapi URL : ${STRAPI_URL}`);
  console.log(`📁 Seed Dir   : ${SEED_DIR}`);
  if (FLAG_DRY_RUN) console.log('🔍 Mode       : DRY-RUN (không gửi API)');
  if (FLAG_CLEAN) console.log('🗑️  Mode       : CLEAN (xóa data cũ trước)');

  if (!API_TOKEN) {
    console.error('\n❌ STRAPI_ADMIN_TOKEN chưa được cấu hình!');
    console.error('   → Vào Strapi Admin > Settings > API Tokens > Create new token (Full access)');
    console.error('   → Thêm vào strapi/.env: STRAPI_ADMIN_TOKEN=your_token_here\n');
    process.exit(1);
  }

  if (!FLAG_DRY_RUN) {
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
  }

  // Cleanup nếu có flag
  if (FLAG_CLEAN) await cleanAllData();

  // ── Phase 1: Collection Types (CSV) ──────────────────────────────────────
  log.section('Phase 1: Seed Collection Types (CSV)');
  const categoryMap = await seedCategories();
  const productMap = await seedProducts(categoryMap);
  const planMap = await seedPlans(productMap);
  const faqMap = await seedFaqs();
  const testimonialMap = await seedTestimonials();
  const articleMap = await seedArticles(categoryMap);

  // ── Phase 2: Single Types (JSON) ─────────────────────────────────────────
  log.section('Phase 2: Seed Single Types (JSON)');
  await seedGlobal();
  await seedBlogPage();
  await seedProductPage();

  // ── Phase 3: Pages + Dynamic Zones (JSON) ────────────────────────────────
  log.section('Phase 3: Seed Pages + Dynamic Zones');
  await seedPages(planMap, testimonialMap, faqMap);

  console.log('\n' + '═'.repeat(60));
  console.log('🎉 Seeding hoàn tất!');
  console.log(`   Kiểm tra dữ liệu tại: ${STRAPI_URL}/admin`);
  console.log('═'.repeat(60) + '\n');
})();
