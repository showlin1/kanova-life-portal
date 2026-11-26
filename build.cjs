const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const WIX_SITE_DIR = path.join(ROOT_DIR, 'wix-site');

console.log('Building Kanova Life React SPA for production...\n');
const startTime = Date.now();

// 1. Clean dist
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}

// 2. Run vite build
execSync('npx vite build', { stdio: 'inherit' });

// 3. Copy images to dist/images if exists
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
copyDir(path.join(ROOT_DIR, 'images'), path.join(DIST_DIR, 'images'));

// 4. Clean wix-site/ and sync dist/ to wix-site/
if (fs.existsSync(WIX_SITE_DIR)) {
  fs.rmSync(WIX_SITE_DIR, { recursive: true, force: true });
}
copyDir(DIST_DIR, WIX_SITE_DIR);

const duration = Date.now() - startTime;
console.log(`\n✓ Pure React SPA successfully built and synced to wix-site/ in ${duration}ms\n`);
