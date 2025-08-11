const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(process.cwd(), 'uploads');
const imagesDir = path.join(uploadsDir, 'images');

// Buat direktori uploads jika belum ada
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Created uploads directory');
}

// Buat direktori images jika belum ada
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
  console.log('Created uploads/images directory');
}

console.log('Upload directories are ready!');