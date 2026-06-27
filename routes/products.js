const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('./auth');

// @route   GET /api/products
// @desc    Get all products (with optional filter, search, sorting)
router.get('/', async (req, res) => {
  try {
    const { category, brand, search, sort, size, minPrice, maxPrice } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }
    if (brand) {
      query.brand = brand;
    }
    if (search) {
      // Create MongoDB style regex query
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let products = await Product.find(query);

    // Apply manual filtering for size, minPrice, maxPrice if returned by adapter or mongoose
    if (size) {
      const sizeNum = parseFloat(size);
      products = products.filter(p => p.sizes.includes(sizeNum));
    }
    if (minPrice) {
      const min = parseFloat(minPrice);
      products = products.filter(p => p.price >= min);
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      products = products.filter(p => p.price <= max);
    }

    // Apply sorting
    if (sort) {
      if (sort === 'price-low') {
        products.sort((a, b) => a.price - b.price);
      } else if (sort === 'price-high') {
        products.sort((a, b) => b.price - a.price);
      } else if (sort === 'rating') {
        products.sort((a, b) => b.rating - a.rating);
      } else if (sort === 'newest') {
        products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/products/:id
// @desc    Get a single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/products
// @desc    Create a product (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  const { name, brand, category, price, sizes, images, description, stock, featured, isNewArrival } = req.body;

  try {
    if (!name || !brand || !category || !price || !sizes || !images || !description) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    const parsedSizes = Array.isArray(sizes) ? sizes.map(Number) : sizes.split(',').map(s => Number(s.trim()));
    const parsedImages = Array.isArray(images) ? images : images.split(',').map(i => i.trim());

    const product = await Product.create({
      name,
      brand,
      category,
      price: Number(price),
      sizes: parsedSizes,
      images: parsedImages,
      description,
      stock: Number(stock || 10),
      featured: Boolean(featured),
      isNewArrival: Boolean(isNewArrival),
      rating: 4.5,
      numReviews: 0
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product (Admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { name, brand, category, price, sizes, images, description, stock, featured, isNewArrival } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (brand !== undefined) updateData.brand = brand;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = Number(price);
    if (description !== undefined) updateData.description = description;
    if (stock !== undefined) updateData.stock = Number(stock);
    if (featured !== undefined) updateData.featured = Boolean(featured);
    if (isNewArrival !== undefined) updateData.isNewArrival = Boolean(isNewArrival);
    
    if (sizes !== undefined) {
      updateData.sizes = Array.isArray(sizes) ? sizes.map(Number) : sizes.split(',').map(s => Number(s.trim()));
    }
    if (images !== undefined) {
      updateData.images = Array.isArray(images) ? images : images.split(',').map(i => i.trim());
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
