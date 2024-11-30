const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage cho category
const categoryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'categories', // Thư mục lưu trữ trên Cloudinary
    allowed_formats: ['jpeg', 'png', 'jpg'],
    public_id: (req, file) => {
      return `category_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
  }
});

// Storage cho products
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products', // Thư mục lưu trữ trên Cloudinary
    allowed_formats: ['jpeg', 'png', 'jpg'],
    public_id: (req, file) => {
      return `product_${Date.now()}_${file.originalname.split('.')[0]}`;
    }
  }
});

// Storage cho posters
const posterStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'posters', // Thư mục lưu trữ trên Cloudinary
    allowed_formats: ['jpeg', 'png', 'jpg'],
    public_id: (req, file) => {
      return `poster_${Date.now()}_${file.originalname.split('.')[0]}`;
    }
  }
});

// Tạo upload middleware
const uploadCategory = multer({ 
  storage: categoryStorage,
  limits: {
    fileSize: 1024 * 1024 * 5 // giới hạn 5MB
  }
});

const uploadProduct = multer({ 
  storage: productStorage,
  limits: {
    fileSize: 1024 * 1024 * 5 // giới hạn 5MB
  }
});

const uploadPosters = multer({ 
  storage: posterStorage,
  limits: {
    fileSize: 1024 * 1024 * 5 // giới hạn 5MB
  }
});

module.exports = {
  uploadCategory,
  uploadProduct,
  uploadPosters,
  cloudinary
};