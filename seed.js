require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB, getIsConnected } = require('./db');
const User = require('./models/User');
const Product = require('./models/Product');

const defaultProducts = [
  {
    name: "Air Jordan 1 Retro High OG",
    brand: "Jordan",
    category: "Basketball",
    price: 180,
    sizes: [8, 9, 10, 11, 12],
    images: [
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80"
    ],
    description: "The Air Jordan 1 Retro High OG is a reissue of the classic sneaker that started it all, featuring high-quality leather construction and iconic color blocking.",
    rating: 4.9,
    numReviews: 24,
    stock: 8,
    featured: true,
    isNewArrival: false
  },
  {
    name: "Yeezy Boost 350 V2 'Carbon'",
    brand: "Adidas",
    category: "Lifestyle",
    price: 220,
    sizes: [7, 8, 9, 10, 11],
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600&q=80"
    ],
    description: "Designed by Kanye West, the Yeezy Boost 350 V2 features a Primeknit upper and full-length Boost cushioning for ultimate street-style comfort.",
    rating: 4.8,
    numReviews: 19,
    stock: 5,
    featured: true,
    isNewArrival: true
  },
  {
    name: "Nike Air Max Plus 'Volt'",
    brand: "Nike",
    category: "Running",
    price: 170,
    sizes: [8, 8.5, 9, 9.5, 10, 11],
    images: [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80"
    ],
    description: "Let your attitude have the edge in the Nike Air Max Plus, a Tuned Air experience that offers premium stability and unbelievable cushioning.",
    rating: 4.7,
    numReviews: 12,
    stock: 12,
    featured: false,
    isNewArrival: true
  },
  {
    name: "Puma RS-X³ Cyber",
    brand: "Puma",
    category: "Lifestyle",
    price: 110,
    sizes: [8, 9, 10, 11],
    images: [
      "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1512374382149-43371b14309c?auto=format&fit=crop&w=600&q=80"
    ],
    description: "The RS-X family is expanded with the RS-X³. We take the signature RS design and dial it up to the third power with cyber-punk colorways and materials.",
    rating: 4.5,
    numReviews: 8,
    stock: 15,
    featured: false,
    isNewArrival: false
  },
  {
    name: "Nike Dunk Low 'Panda'",
    brand: "Nike",
    category: "Lifestyle",
    price: 115,
    sizes: [7, 8, 9, 10, 11, 12],
    images: [
      "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?auto=format&fit=crop&w=600&q=80"
    ],
    description: "Created for the hardwood but taken to the streets, the Nike Dunk Low Retro returns with crisp overlays and original team colors.",
    rating: 4.9,
    numReviews: 31,
    stock: 10,
    featured: true,
    isNewArrival: false
  },
  {
    name: "New Balance 550 'White Grey'",
    brand: "New Balance",
    category: "Lifestyle",
    price: 120,
    sizes: [8, 9, 10, 11],
    images: [
      "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=600&q=80"
    ],
    description: "The return of a legend. Originally worn by pros, the new 550 pays tribute to the 1989 original with classic basketball shoe detailing.",
    rating: 4.6,
    numReviews: 15,
    stock: 7,
    featured: false,
    isNewArrival: true
  }
];

async function seedData() {
  await connectDB();
  
  if (!getIsConnected()) {
    console.error("MongoDB not connected! Seeding can only run on active MongoDB connection.");
    console.log("For JSON database, initial data is seeded automatically on startup.");
    process.exit(1);
  }

  try {
    // Clear existing data
    await User.MongooseUser.deleteMany({});
    await Product.MongooseProduct.deleteMany({});
    
    console.log("Clearing existing data...");
    
    // Seed Admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      name: "Drip Admin",
      email: "admin@dripkicks.com",
      password: hashedPassword,
      role: "admin",
      wishlist: []
    });
    console.log("Admin seeded (Email: admin@dripkicks.com, PW: admin123)");
    
    // Seed Products
    for (const prod of defaultProducts) {
      await Product.create(prod);
    }
    console.log("Sneaker products seeded successfully!");
    
    console.log("Database Seeded Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed: ", error);
    process.exit(1);
  }
}

seedData();
