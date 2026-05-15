import fs from 'fs';
import path from 'path';

const action = process.argv[2]; // 'enable' or 'disable'
const isEnable = action === 'enable';
const targetValue = isEnable ? 'SEED_DATA=true' : 'SEED_DATA=false';
const replaceValue = isEnable ? 'SEED_DATA=false' : 'SEED_DATA=true';

if (action !== 'enable' && action !== 'disable') {
  console.error('❌ Lỗi: Vui lòng truyền tham số "enable" hoặc "disable". VD: npx tsx toggle-seed.mts enable');
  process.exit(1);
}

const envPaths = ['.env', 'next/.env', 'strapi/.env'];

envPaths.forEach((envPath) => {
  const fullPath = path.resolve(process.cwd(), envPath);

  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');

    if (content.includes(replaceValue)) {
      content = content.replace(new RegExp(replaceValue, 'g'), targetValue);
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Đã chuyển đổi thành ${targetValue} tại ${envPath}`);
    } else if (content.includes(targetValue)) {
      console.log(`ℹ️ File ${envPath} đã được thiết lập là ${targetValue} từ trước.`);
    } else {
      console.log(`ℹ️ Không tìm thấy biến SEED_DATA tại ${envPath}`);
    }
  } else {
    console.log(`⚠️ Không tìm thấy file ${envPath}`);
  }
});
