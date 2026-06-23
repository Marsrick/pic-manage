const fs = require('fs');
const path = require('path');

const srcFiles = [
  'index.html',
  'style.css',
  'app.js',
  'reader.js',
  'pwa.js',
  'pwa.webmanifest',
  'service-worker.js',
  '使用说明.md',
  'logo.png'
];
const srcDirs = ['assets', 'lib'];
const destDir = path.join(__dirname, 'www');

// Clean and recreate destination directory
if (fs.existsSync(destDir)) {
  console.log('Cleaning existing www/ directory...');
  fs.rmSync(destDir, { recursive: true, force: true });
}
fs.mkdirSync(destDir, { recursive: true });

// Copy files
srcFiles.forEach(file => {
  const srcPath = path.join(__dirname, file);
  const destPath = path.join(destDir, file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied file: ${file}`);
  } else {
    console.warn(`Warning: source file not found: ${file}`);
  }
});

// Copy directories recursively
srcDirs.forEach(dir => {
  const srcPath = path.join(__dirname, dir);
  const destPath = path.join(destDir, dir);
  if (fs.existsSync(srcPath)) {
    copyFolderSync(srcPath, destPath);
    console.log(`Copied directory recursively: ${dir}`);
  } else {
    console.warn(`Warning: source directory not found: ${dir}`);
  }
});

function copyFolderSync(from, to) {
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const fromElement = path.join(from, element);
    const toElement = path.join(to, element);
    if (fs.lstatSync(fromElement).isDirectory()) {
      copyFolderSync(fromElement, toElement);
    } else {
      fs.copyFileSync(fromElement, toElement);
    }
  });
}

console.log('Build completed! Web assets copied to www/ successfully.');
