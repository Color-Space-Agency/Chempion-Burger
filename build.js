const fs = require('fs');
const path = require('path');

// Ensure dist folder exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Files to copy
const filesToCopy = ['index.html', 'app.js', 'style.css', 'logo.png'];

filesToCopy.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join('dist', file));
    console.log(`Successfully copied ${file} to dist/`);
  } else {
    console.warn(`Warning: File ${file} not found!`);
  }
});
console.log('Build complete!');
