let productsData = []; // Cache all products from API

const filters = {
  search: '',
  brands: [],
  categories: [],
  size: null,
  minPrice: '',
  maxPrice: '',
  sort: 'newest'
};

// Parse search queries from URL
function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  
  const category = params.get('category');
  if (category) {
    filters.categories.push(capitalizeFirstLetter(category));
    // Check corresponding checkbox
    const checkbox = document.querySelector(`#category-filters input[value="${capitalizeFirstLetter(category)}"]`);
    if (checkbox) checkbox.checked = true;
  }

  const brand = params.get('brand');
  if (brand) {
    filters.brands.push(capitalizeFirstLetter(brand));
    const checkbox = document.querySelector(`#brand-filters input[value="${capitalizeFirstLetter(brand)}"]`);
    if (checkbox) checkbox.checked = true;
  }

  const search = params.get('search');
  if (search) {
    filters.search = search;
    const searchField = document.getElementById('search-input');
    if (searchField) searchField.value = search;
  }
}

function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Fetch products from server matching main search/sort, then apply checkboxes locally for instant UI response
async function fetchProducts() {
  try {
    const container = document.getElementById('shop-products-container');
    if (!container) return;

    // Show skeletons
    container.innerHTML = `
      <div class="product-card skeleton-card">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton skeleton-text" style="width: 40%"></div>
        <div class="skeleton skeleton-text" style="width: 80%"></div>
        <div class="skeleton skeleton-text" style="width: 50%"></div>
      </div>
      <div class="product-card skeleton-card">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton skeleton-text" style="width: 30%"></div>
        <div class="skeleton skeleton-text" style="width: 75%"></div>
        <div class="skeleton skeleton-text" style="width: 60%"></div>
      </div>
    `;

    // Fetch from backend (pass search and sort directly)
    productsData = await window.API.products.getAll({
      search: filters.search,
      sort: filters.sort
    });

    applyFilters();
  } catch (error) {
    console.error("Error fetching shop products:", error);
    window.Drip.showToast("Failed to fetch products", "error");
  }
}

// Apply local filters and render
function applyFilters() {
  let filtered = [...productsData];

  // Filter by Brands
  if (filters.brands.length > 0) {
    filtered = filtered.filter(p => filters.brands.some(b => p.brand.toLowerCase() === b.toLowerCase()));
  }

  // Filter by Categories
  if (filters.categories.length > 0) {
    filtered = filtered.filter(p => filters.categories.some(c => p.category.toLowerCase() === c.toLowerCase()));
  }

  // Filter by Size
  if (filters.size) {
    const sizeNum = parseFloat(filters.size);
    filtered = filtered.filter(p => p.sizes.includes(sizeNum));
  }

  // Filter by Price Range
  if (filters.minPrice) {
    filtered = filtered.filter(p => p.price >= parseFloat(filters.minPrice));
  }
  if (filters.maxPrice) {
    filtered = filtered.filter(p => p.price <= parseFloat(filters.maxPrice));
  }

  renderShopGrid(filtered);
}

function renderShopGrid(products) {
  const container = document.getElementById('shop-products-container');
  const countSpan = document.getElementById('results-count');
  
  if (countSpan) countSpan.textContent = products.length;
  if (!container) return;

  container.innerHTML = '';

  if (products.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 5rem 0;">
      <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1.5rem; color: #272730;"></i>
      <p style="font-size: 1.2rem; font-family: var(--font-display);">No sneakers match your filters</p>
      <p style="font-size: 0.95rem; margin-top: 0.5rem; color: #6b7280;">Try broadening your terms or clearing selectors.</p>
    </div>`;
    return;
  }

  const user = window.API.getUser();
  const wishlist = user ? (user.wishlist || []) : [];

  products.forEach(p => {
    const isWishlisted = wishlist.includes(p._id);
    const starHtml = Array(5).fill(0).map((_, idx) => 
      `<i class="${idx < Math.round(p.rating) ? 'fas' : 'far'} fa-star"></i>`
    ).join('');

    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.setAttribute('data-id', p._id);
    
    productCard.innerHTML = `
      ${p.stock === 0 ? '<span class="card-badge" style="background: var(--accent-crimson); color: white;">OUT OF STOCK</span>' : p.isNewArrival ? '<span class="card-badge">NEW</span>' : ''}
      <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" data-product-id="${p._id}">
        <i class="fa-heart ${isWishlisted ? 'fas' : 'far'}"></i>
      </button>
      <div class="product-img-wrapper">
        <img src="${p.images[0]}" alt="${p.name}">
      </div>
      <div class="product-info">
        <span class="product-brand">${p.brand}</span>
        <h3 class="product-name">${p.name}</h3>
        <div class="rating-row">
          <div class="stars">${starHtml}</div>
          <span class="rating-text">(${p.numReviews || 0})</span>
        </div>
        <div class="card-footer">
          <span class="product-price">$${p.price}</span>
          <button class="add-to-cart-btn" data-product-id="${p._id}" ${p.stock === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
            <i class="fas fa-shopping-cart"></i>
          </button>
        </div>
      </div>
    `;

    // Click card details
    productCard.addEventListener('click', (e) => {
      if (e.target.closest('.wishlist-btn') || e.target.closest('.add-to-cart-btn')) {
        return;
      }
      window.location.href = `product.html?id=${p._id}`;
    });

    // Wishlist toggle
    productCard.querySelector('.wishlist-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!user) {
        window.Drip.showToast("Please log in to add to wishlist", "error");
        window.Drip.openAuthModal();
        return;
      }
      
      const btn = e.currentTarget;
      const isCurrentlyActive = btn.classList.contains('active');
      const action = isCurrentlyActive ? 'remove' : 'add';
      
      try {
        await window.API.auth.toggleWishlist(p._id, action);
        btn.classList.toggle('active');
        const icon = btn.querySelector('i');
        icon.classList.toggle('fas');
        icon.classList.toggle('far');
        window.Drip.showToast(
          action === 'add' ? 'Added to wishlist!' : 'Removed from wishlist', 
          'success'
        );
      } catch (err) {
        window.Drip.showToast(err.message, 'error');
      }
    });

    // Cart add
    productCard.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (p.stock === 0) return;
      const defaultSize = p.sizes[0] || 9;
      window.Drip.addToCart(p, defaultSize, 1);
    });

    container.appendChild(productCard);
  });
}

// Search debounce
let searchDebounceTimer;
function handleSearchInput(e) {
  clearTimeout(searchDebounceTimer);
  filters.search = e.target.value;
  searchDebounceTimer = setTimeout(() => {
    fetchProducts();
  }, 350);
}

// Set up UI Event listeners
function bindEvents() {
  // Brand checkboxes
  document.querySelectorAll('#brand-filters input').forEach(input => {
    input.addEventListener('change', (e) => {
      if (e.target.checked) {
        filters.brands.push(e.target.value);
      } else {
        filters.brands = filters.brands.filter(b => b !== e.target.value);
      }
      applyFilters();
    });
  });

  // Category checkboxes
  document.querySelectorAll('#category-filters input').forEach(input => {
    input.addEventListener('change', (e) => {
      if (e.target.checked) {
        filters.categories.push(e.target.value);
      } else {
        filters.categories = filters.categories.filter(c => c !== e.target.value);
      }
      applyFilters();
    });
  });

  // Size pills
  document.querySelectorAll('#size-filters .size-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      const selectedPill = e.currentTarget;
      const wasActive = selectedPill.classList.contains('active');
      
      // Deactivate all pills
      document.querySelectorAll('#size-filters .size-pill').forEach(p => p.classList.remove('active'));
      
      if (wasActive) {
        filters.size = null;
      } else {
        selectedPill.classList.add('active');
        filters.size = selectedPill.getAttribute('data-size');
      }
      applyFilters();
    });
  });

  // Price range min/max
  const minField = document.getElementById('price-min');
  const maxField = document.getElementById('price-max');
  
  if (minField) {
    minField.addEventListener('input', (e) => {
      filters.minPrice = e.target.value;
      applyFilters();
    });
  }
  if (maxField) {
    maxField.addEventListener('input', (e) => {
      filters.maxPrice = e.target.value;
      applyFilters();
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      filters.sort = e.target.value;
      fetchProducts();
    });
  }

  // Search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearchInput);
  }

  // Clear filters
  const clearBtn = document.getElementById('clear-filters-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      // Clear inputs
      document.querySelectorAll('#brand-filters input').forEach(i => i.checked = false);
      document.querySelectorAll('#category-filters input').forEach(i => i.checked = false);
      document.querySelectorAll('#size-filters .size-pill').forEach(p => p.classList.remove('active'));
      if (minField) minField.value = '';
      if (maxField) maxField.value = '';
      if (searchInput) searchInput.value = '';
      if (sortSelect) sortSelect.value = 'newest';

      // Reset state
      filters.brands = [];
      filters.categories = [];
      filters.size = null;
      filters.minPrice = '';
      filters.maxPrice = '';
      filters.search = '';
      filters.sort = 'newest';

      fetchProducts();
    });
  }
}

// Initialise
document.addEventListener('DOMContentLoaded', () => {
  parseUrlParams();
  bindEvents();
  fetchProducts();
});
