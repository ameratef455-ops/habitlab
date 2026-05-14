const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
files.push('./index.html');
files.push('./metadata.json');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  content = content.replace(/معمل العادات/g, 'Aura');
  content = content.replace(/المعمل/g, 'Aura');
  content = content.replace(/مختبر العادات/g, 'Aura');
  content = content.replace(/المختبر/g, 'Aura');
  content = content.replace(/معمل/g, 'Aura');
  content = content.replace(/العادات/g, 'المهارات');
  content = content.replace(/عادات/g, 'مهارات');
  content = content.replace(/عاداتك/g, 'مهاراتك');
  content = content.replace(/العادة/g, 'المهارة');
  content = content.replace(/عادة/g, 'مهارة');
  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
