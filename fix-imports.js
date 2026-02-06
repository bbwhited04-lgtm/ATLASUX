const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('dist') && !filePath.includes('.git')) {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      }
    } else if (file.match(/\.(tsx?|jsx?)$/)) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles('./src');
let totalFixed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // Remove @version from ALL imports (more aggressive regex)
  content = content.replace(/from\s+["']([^"']+)@[\d.]+["']/g, 'from "$1"');
  content = content.replace(/import\s+["']([^"']+)@[\d.]+["']/g, 'import "$1"');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✓ Fixed: ${file}`);
    totalFixed++;
  }
});

console.log(`\n✓ Fixed ${totalFixed} file(s)`);
