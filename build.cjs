const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');

console.log('Building Kanova Life Wix Site for production...\n');
const startTime = Date.now();

// 1. Clean and create dist directory
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// Helper to copy files recursively
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return [];
  fs.mkdirSync(dest, { recursive: true });
  const copied = [];
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copied.push(...copyDir(srcPath, destPath));
    } else {
      fs.copyFileSync(srcPath, destPath);
      copied.push(destPath);
    }
  }
  return copied;
}

// 2. Identify and copy all site files
const siteFiles = [
  'index.html',
  'courses.html',
  'course-detail.html',
  'book.html',
  'admin.html',
  'locations.html',
  'blog.html',
  'styles.css',
  'wix-client.js',
];

const allBuiltFiles = [];

for (const file of siteFiles) {
  const src = path.join(ROOT_DIR, file);
  if (fs.existsSync(src)) {
    const dest = path.join(DIST_DIR, file);
    fs.copyFileSync(src, dest);
    allBuiltFiles.push(dest);

    // Also support clean URLs by creating <name>/index.html
    if (file.endsWith('.html') && file !== 'index.html') {
      const dirName = file.replace(/\.html$/, '');
      const subDir = path.join(DIST_DIR, dirName);
      if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir, { recursive: true });
      }
      const subDest = path.join(subDir, 'index.html');
      fs.copyFileSync(src, subDest);
      allBuiltFiles.push(subDest);
    }
  }
}

// 3. Copy image and js directories
allBuiltFiles.push(...copyDir(path.join(ROOT_DIR, 'images'), path.join(DIST_DIR, 'images')));
allBuiltFiles.push(...copyDir(path.join(ROOT_DIR, 'js'), path.join(DIST_DIR, 'js')));

// 4. Log summary
let totalBytes = 0;
for (const file of allBuiltFiles) {
  const stat = fs.statSync(file);
  totalBytes += stat.size;
  const relPath = path.relative(ROOT_DIR, file).replace(/\\/g, '/');
  const sizeKb = (stat.size / 1024).toFixed(2);
  console.log(`  ✓ ${relPath.padEnd(35)} ${sizeKb.padStart(8)} kB`);
}

const duration = Date.now() - startTime;
const totalMb = (totalBytes / 1024).toFixed(2);
console.log(`\n✓ Built ${allBuiltFiles.length} files (${totalMb} kB) in ${duration}ms`);
console.log(`✓ Production build output: ${DIST_DIR}\n`);
