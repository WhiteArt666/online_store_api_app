const express = require('express');
const router = express.Router();
const Product = require('../model/product');
const multer = require('multer');
// const { uploadProduct } = require('../uploadFile');
const { uploadProduct } = require('../cloudinaryConfig');
const asyncHandler = require('express-async-handler');

// Get all products
router.get('/', asyncHandler(async (req, res) => {
    try {
        const products = await Product.find()
        .populate('proCategoryId', 'id name')
        .populate('proSubCategoryId', 'id name')
        .populate('proBrandId', 'id name')
        .populate('proVariantTypeId', 'id type')
        .populate('proVariantId', 'id name');
        res.json({ success: true, message: "Products retrieved successfully.", data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get a product by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const productID = req.params.id;
        const product = await Product.findById(productID)
            .populate('proCategoryId', 'id name')
            .populate('proSubCategoryId', 'id name')
            .populate('proBrandId', 'id name')
            .populate('proVariantTypeId', 'id name')
            .populate('proVariantId', 'id name');
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }
        res.json({ success: true, message: "Product retrieved successfully.", data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));



// create new product
router.post('/', asyncHandler(async (req, res) => {
    try {
        // Execute the Multer middleware to handle multiple file fields
        uploadProduct.fields([
            { name: 'image1', maxCount: 1 },
            { name: 'image2', maxCount: 1 },
            { name: 'image3', maxCount: 1 },
            { name: 'image4', maxCount: 1 },
            { name: 'image5', maxCount: 1 }
        ])(req, res, async function (err) {
            if (err) {
                console.log(`Add product error: ${err.message}`);
                return res.status(400).json({ success: false, message: err.message });
            }

            // Extract product data from the request body
            const { name, description, quantity, price, offerPrice, proCategoryId, proSubCategoryId, proBrandId, proVariantTypeId, proVariantId } = req.body;

            // Check if any required fields are missing
            if (!name || !quantity || !price || !proCategoryId || !proSubCategoryId) {
                // Remove uploaded files if they exist
                const fields = ['image1', 'image2', 'image3', 'image4', 'image5'];
                for (let field of fields) {
                    if (req.files[field] && req.files[field][0]) {
                        await cloudinary.uploader.destroy(req.files[field][0].filename);
                    }
                }
                return res.status(400).json({ success: false, message: "Required fields are missing." });
            }

            // Initialize an array to store image URLs
            const imageUrls = [];
            const publicIds = [];

            // Iterate over the file fields
            const fields = ['image1', 'image2', 'image3', 'image4', 'image5'];
            for (let i = 0; i < fields.length; i++) {
                const field = fields[i];
                if (req.files[field] && req.files[field].length > 0) {
                    const file = req.files[field][0];
                    imageUrls.push({ 
                        image: i + 1, 
                        url: file.path,
                        publicId: file.filename 
                    });
                }
            }

            // Create a new product object with data
            const newProduct = new Product({ name, description, quantity, price, offerPrice, proCategoryId, proSubCategoryId, proBrandId,proVariantTypeId, proVariantId, images: imageUrls });

            // Save the new product to the database
            await newProduct.save();

            // Send a success response back to the client
            res.json({ success: true, message: "Product created successfully.", data: null });
        });
    } catch (error) {
        // Handle any errors that occur during the process
        console.error("Error creating product:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}));



// Update a product
router.put('/:id', asyncHandler(async (req, res) => {
    const productId = req.params.id;
    try {
        // Execute the Multer middleware to handle file fields
        uploadProduct.fields([
            { name: 'image1', maxCount: 1 },
            { name: 'image2', maxCount: 1 },
            { name: 'image3', maxCount: 1 },
            { name: 'image4', maxCount: 1 },
            { name: 'image5', maxCount: 1 }
        ])(req, res, async function (err) {
            if (err) {
                console.log(`Update product error: ${err.message}`);
                return res.status(500).json({ success: false, message: err.message });
            }

            const { name, description, quantity, price, offerPrice, proCategoryId, proSubCategoryId, proBrandId, proVariantTypeId, proVariantId } = req.body;

            // Find the product by ID
            const productToUpdate = await Product.findById(productId);
            if (!productToUpdate) {
                // Remove any uploaded files
                const fields = ['image1', 'image2', 'image3', 'image4', 'image5'];
                for (let field of fields) {
                    if (req.files[field] && req.files[field][0]) {
                        await cloudinary.uploader.destroy(req.files[field][0].filename);
                    }
                }
                return res.status(404).json({ success: false, message: "Product not found." });
            }

            // Update product properties if provided
            productToUpdate.name = name || productToUpdate.name;
            productToUpdate.description = description || productToUpdate.description;
            productToUpdate.quantity = quantity || productToUpdate.quantity;
            productToUpdate.price = price || productToUpdate.price;
            productToUpdate.offerPrice = offerPrice || productToUpdate.offerPrice;
            productToUpdate.proCategoryId = proCategoryId || productToUpdate.proCategoryId;
            productToUpdate.proSubCategoryId = proSubCategoryId || productToUpdate.proSubCategoryId;
            productToUpdate.proBrandId = proBrandId || productToUpdate.proBrandId;
            productToUpdate.proVariantTypeId = proVariantTypeId || productToUpdate.proVariantTypeId;
            productToUpdate.proVariantId = proVariantId || productToUpdate.proVariantId;

            // Iterate over the file fields to update images
            const fields = ['image1', 'image2', 'image3', 'image4', 'image5'];
            for (let i = 0; i < fields.length; i++) {
                const field = fields[i];
                if (req.files[field] && req.files[field].length > 0) {
                    const file = req.files[field][0];
                    
                    // Find the existing image entry
                    let imageEntry = productToUpdate.images.find(img => img.image === (i + 1));
                    
                    // If an old image exists for this slot, delete it from Cloudinary
                    if (imageEntry && imageEntry.publicId) {
                        await cloudinary.uploader.destroy(imageEntry.publicId);
                    }
                    
                    // Update or add the new image
                    if (imageEntry) {
                        imageEntry.url = file.path;
                        imageEntry.publicId = file.filename;
                    } else {
                        productToUpdate.images.push({ 
                            image: i + 1, 
                            url: file.path,
                            publicId: file.filename 
                        });
                    }
                }
            }

            // Save the updated product
            await productToUpdate.save();
            res.json({ success: true, message: "Product updated successfully." });
        });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Delete a product
router.delete('/:id', asyncHandler(async (req, res) => {
    const productID = req.params.id;
    try {
        const product = await Product.findByIdAndDelete(productID);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }
        res.json({ success: true, message: "Product deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
