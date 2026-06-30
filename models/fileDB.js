const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');

const memoryDb = {};

// Helper to ensure files and directory exist
function initFileStore(filename, defaultData = []) {
  const filePath = path.join(DATA_DIR, filename);
  memoryDb[filePath] = defaultData;

  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.warn(`[WARNING] Failed to create data directory ${DATA_DIR}: ${e.message}`);
    }
  }

  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
    } else {
      const content = fs.readFileSync(filePath, 'utf-8');
      memoryDb[filePath] = JSON.parse(content);
    }
  } catch (e) {
    console.warn(`[WARNING] Failed to initialize file store at ${filePath}: ${e.message}. Using in-memory fallback.`);
  }

  return filePath;
}

// Generate MongoDB-like 24-character hexadecimal IDs
function generateObjectId() {
  const chars = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 24; i++) {
    id += chars[Math.floor(Math.random() * 16)];
  }
  return id;
}

// Default Products (Seed Data)
const defaultProducts = [
  {
    _id: "60c72b2f9b1d8a23a4f6d111",
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
    isNewArrival: false,
    createdAt: new Date().toISOString()
  },
  {
    _id: "60c72b2f9b1d8a23a4f6d222",
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
    isNewArrival: true,
    createdAt: new Date().toISOString()
  },
  {
    _id: "60c72b2f9b1d8a23a4f6d333",
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
    isNewArrival: true,
    createdAt: new Date().toISOString()
  },
  {
    _id: "60c72b2f9b1d8a23a4f6d444",
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
    isNewArrival: false,
    createdAt: new Date().toISOString()
  },
  {
    _id: "60c72b2f9b1d8a23a4f6d555",
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
    isNewArrival: false,
    createdAt: new Date().toISOString()
  },
  {
    _id: "60c72b2f9b1d8a23a4f6d666",
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
    isNewArrival: true,
    createdAt: new Date().toISOString()
  }
];

// Helper to read and write files synchronously to avoid race conditions during mock db updates
function readJSON(filePath) {
  if (memoryDb[filePath] !== undefined) {
    return memoryDb[filePath];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    memoryDb[filePath] = data;
    return data;
  } catch (e) {
    return [];
  }
}

// Attempt to write to file, fallback to memory cache on failure
function writeJSON(filePath, data) {
  memoryDb[filePath] = data;
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn(`[WARNING] Failed to write to file ${filePath}: ${e.message}. Using in-memory fallback.`);
  }
}

const usersFile = initFileStore('users.json', []);
const productsFile = initFileStore('products.json', defaultProducts);
const ordersFile = initFileStore('orders.json', []);

// Create default admin user if none exists
const existingUsers = readJSON(usersFile);
if (existingUsers.length === 0) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  existingUsers.push({
    _id: "60c72b2f9b1d8a23a4f6d000",
    name: "Drip Admin",
    email: "admin@dripkicks.com",
    password: hashedPassword,
    role: "admin",
    wishlist: [],
    createdAt: new Date().toISOString()
  });
  writeJSON(usersFile, existingUsers);
}

// Custom mock implementations matching Mongoose API
const User = {
  async findOne(query) {
    const list = readJSON(usersFile);
    return list.find(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  },
  async findById(id) {
    const list = readJSON(usersFile);
    return list.find(item => item._id === id);
  },
  async find() {
    return readJSON(usersFile);
  },
  async create(data) {
    const list = readJSON(usersFile);
    const newRecord = {
      _id: generateObjectId(),
      wishlist: [],
      createdAt: new Date().toISOString(),
      ...data
    };
    list.push(newRecord);
    writeJSON(usersFile, list);
    return newRecord;
  },
  async findByIdAndUpdate(id, updateData, options = {}) {
    const list = readJSON(usersFile);
    const index = list.findIndex(item => item._id === id);
    if (index === -1) return null;
    
    // If update contains a nested object like $push or $pull
    if (updateData.$push && updateData.$push.wishlist) {
      if (!list[index].wishlist) list[index].wishlist = [];
      if (!list[index].wishlist.includes(updateData.$push.wishlist)) {
        list[index].wishlist.push(updateData.$push.wishlist);
      }
    } else if (updateData.$pull && updateData.$pull.wishlist) {
      if (list[index].wishlist) {
        list[index].wishlist = list[index].wishlist.filter(wId => wId !== updateData.$pull.wishlist);
      }
    } else {
      list[index] = { ...list[index], ...updateData };
    }
    
    writeJSON(usersFile, list);
    return list[index];
  }
};

const Product = {
  async find(query = {}) {
    let list = readJSON(productsFile);
    
    // Simple filter matching
    if (query.brand) {
      list = list.filter(p => p.brand.toLowerCase() === query.brand.toLowerCase());
    }
    if (query.category) {
      list = list.filter(p => p.category.toLowerCase() === query.category.toLowerCase());
    }
    if (query.featured !== undefined) {
      list = list.filter(p => p.featured === query.featured);
    }
    if (query.isNewArrival !== undefined) {
      list = list.filter(p => p.isNewArrival === query.isNewArrival);
    }
    
    // Support regex search for search query keyword (mimics regex queries)
    if (query.$or) {
      const searchTerms = query.$or.map(cond => cond.name ? cond.name.$regex : '');
      const searchTerm = searchTerms.find(t => t) || '';
      if (searchTerm) {
        const regex = new RegExp(searchTerm, 'i');
        list = list.filter(p => regex.test(p.name) || regex.test(p.brand) || regex.test(p.description));
      }
    }
    
    return list;
  },
  async findById(id) {
    const list = readJSON(productsFile);
    return list.find(item => item._id === id);
  },
  async create(data) {
    const list = readJSON(productsFile);
    const newRecord = {
      _id: generateObjectId(),
      rating: 4.5,
      numReviews: 0,
      createdAt: new Date().toISOString(),
      ...data
    };
    list.push(newRecord);
    writeJSON(productsFile, list);
    return newRecord;
  },
  async findByIdAndUpdate(id, updateData, options = {}) {
    const list = readJSON(productsFile);
    const index = list.findIndex(item => item._id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updateData };
    writeJSON(productsFile, list);
    return list[index];
  },
  async findByIdAndDelete(id) {
    const list = readJSON(productsFile);
    const record = list.find(item => item._id === id);
    if (!record) return null;
    const filtered = list.filter(item => item._id !== id);
    writeJSON(productsFile, filtered);
    return record;
  }
};

const Order = {
  async find(query = {}) {
    let list = readJSON(ordersFile);
    if (query.user) {
      list = list.filter(item => item.user === query.user);
    }
    return list;
  },
  async findById(id) {
    const list = readJSON(ordersFile);
    return list.find(item => item._id === id);
  },
  async create(data) {
    const list = readJSON(ordersFile);
    const newRecord = {
      _id: generateObjectId(),
      status: 'Pending',
      isPaid: false,
      isDelivered: false,
      createdAt: new Date().toISOString(),
      ...data
    };
    list.push(newRecord);
    writeJSON(ordersFile, list);
    return newRecord;
  },
  async findByIdAndUpdate(id, updateData, options = {}) {
    const list = readJSON(ordersFile);
    const index = list.findIndex(item => item._id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updateData };
    writeJSON(ordersFile, list);
    return list[index];
  }
};

module.exports = { User, Product, Order };
