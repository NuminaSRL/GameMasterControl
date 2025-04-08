const fs = require('fs');
const path = require('path');

// Trova tutti i file TypeScript nel progetto
function findTypeScriptFiles(directory) {
  let files = [];
  
  const items = fs.readdirSync(directory);
  for (const item of items) {
    const itemPath = path.join(directory, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      files = files.concat(findTypeScriptFiles(itemPath));
    } else if (item.endsWith('.ts')) {
      files.push(itemPath);
    }
  }
  
  return files;
}

// Modifica tutti gli import da @shared/schema
function transformImports() {
  const files = findTypeScriptFiles('.');
  
  let totalChanges = 0;
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    
    // Replace the imports
    content = content.replace(
      /from ["']@shared\/schema["']/g,
      'from "./shared/schema"'
    );
    
    // Update the file only if it's changed
    if (content !== originalContent) {
      fs.writeFileSync(file, content);
      totalChanges++;
      console.log(`Modified imports in: ${file}`);
    }
  }
  
  console.log(`Total files modified: ${totalChanges}`);
}

transformImports();