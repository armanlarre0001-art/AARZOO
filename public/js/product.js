let currentProduct = null;
let selectedSize = null;
let quantity = 1;

// Read query parameter id
function getProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function loadProductDetails() {
  const id = getProductId();
  if (!id) {
    window.location.href = 'shop.html';
    return;
  }

  try {
    currentProduct = await window.API.products.getById(id);
    renderProductDetails();
    loadRecommendations();
  } catch (error) {
    console.error("Error loading product details:", error);
    window.Drip.showToast("Product not found", "error");
    setTimeout(() => {
      window.location.href = 'shop.html';
    }, 2000);
  }
}

function renderProductDetails() {
  const p = currentProduct;
  
  // Set text
  document.getElementById('details-brand').textContent = p.brand;
  document.getElementById('details-name').textContent = p.name;
  document.getElementById('details-price').textContent = `$${p.price}`;
  document.getElementById('details-desc').textContent = p.description;
  document.getElementById('details-reviews-count').textContent = `(${p.numReviews || 0} reviews)`;
  
  // Title update
  document.title = `Drip Kicks | ${p.name}`;

  // Image setup
  const mainImg = document.getElementById('details-main-img');
  mainImg.src = p.images[0];
  mainImg.alt = p.name;

  const thumbnailsRow = document.getElementById('details-thumbnails');
  thumbnailsRow.innerHTML = '';
  p.images.forEach((imgUrl, index) => {
    const box = document.createElement('div');
    box.className = `thumbnail-box ${index === 0 ? 'active' : ''}`;
    box.innerHTML = `<img src="${imgUrl}" alt="${p.name}">`;
    box.addEventListener('click', () => {
      // Toggle active classes
      document.querySelectorAll('.thumbnail-box').forEach(b => b.classList.remove('active'));
      box.classList.add('active');
      mainImg.src = imgUrl;
    });
    thumbnailsRow.appendChild(box);
  });

  // Star Ratings rendering
  const starsContainer = document.getElementById('details-stars');
  starsContainer.innerHTML = Array(5).fill(0).map((_, idx) => 
    `<i class="${idx < Math.round(p.rating) ? 'fas' : 'far'} fa-star"></i>`
  ).join('');

  // Sizing Grid rendering
  const sizesGrid = document.getElementById('details-sizes');
  sizesGrid.innerHTML = '';
  p.sizes.forEach(size => {
    const pill = document.createElement('div');
    pill.className = 'size-pill';
    pill.textContent = size;
    pill.setAttribute('data-size', size);
    
    pill.addEventListener('click', (e) => {
      document.querySelectorAll('#details-sizes .size-pill').forEach(el => el.classList.remove('active'));
      pill.classList.add('active');
      selectedSize = size;
      document.getElementById('selected-size-label').textContent = `US Men's ${size}`;
    });
    
    sizesGrid.appendChild(pill);
  });

  // Stock status styling
  const stockAlert = document.getElementById('stock-status');
  const addBtn = document.getElementById('add-to-cart-action');
  
  if (p.stock === 0) {
    stockAlert.innerHTML = `<span style="color: var(--accent-crimson); font-weight: bold;"><i class="fas fa-times-circle"></i> OUT OF STOCK</span>`;
    stockAlert.style.color = 'var(--accent-crimson)';
    addBtn.disabled = true;
    addBtn.style.opacity = '0.5';
    addBtn.style.cursor = 'not-allowed';
    addBtn.innerHTML = `OUT OF STOCK <i class="fas fa-times-circle"></i>`;
  } else if (p.stock <= 3) {
    stockAlert.innerHTML = `<span style="color: #fbbf24; font-weight: bold;"><i class="fas fa-exclamation-triangle"></i> LOW STOCK: Only ${p.stock} units left!</span>`;
  } else {
    stockAlert.innerHTML = `<span style="color: #10b981; font-weight: bold;"><i class="fas fa-check-circle"></i> IN STOCK (Available: ${p.stock})</span>`;
  }

  // Wishlist Button UI state
  const user = window.API.getUser();
  const wishlistBtn = document.getElementById('wishlist-action');
  if (user && user.wishlist && user.wishlist.includes(p._id)) {
    wishlistBtn.innerHTML = `<i class="fas fa-heart" style="color: var(--accent-crimson);"></i>`;
  }
}

// Fetch recommended products
async function loadRecommendations() {
  try {
    const container = document.getElementById('recommended-products-container');
    if (!container) return;

    // Load items by category or brand
    const recommended = await window.API.products.getAll({ category: currentProduct.category });
    // Filter out active product
    const list = recommended.filter(p => p._id !== currentProduct._id).slice(0, 3);
    
    container.innerHTML = '';
    
    if (list.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem 0;">More kicks coming soon!</div>`;
      return;
    }

    const user = window.API.getUser();
    const wishlist = user ? (user.wishlist || []) : [];

    list.forEach(p => {
      const isWishlisted = wishlist.includes(p._id);
      const starHtml = Array(5).fill(0).map((_, idx) => 
        `<i class="${idx < Math.round(p.rating) ? 'fas' : 'far'} fa-star"></i>`
      ).join('');

      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
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
            <button class="add-to-cart-btn" data-product-id="${p._id}">
              <i class="fas fa-shopping-cart"></i>
            </button>
          </div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.wishlist-btn') || e.target.closest('.add-to-cart-btn')) return;
        window.location.href = `product.html?id=${p._id}`;
      });

      // Bind buttons inside recommended card
      card.querySelector('.wishlist-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!user) {
          window.Drip.showToast("Please log in to add to wishlist", "error");
          window.Drip.openAuthModal();
          return;
        }
        const btn = e.currentTarget;
        const active = btn.classList.contains('active');
        const action = active ? 'remove' : 'add';
        try {
          await window.API.auth.toggleWishlist(p._id, action);
          btn.classList.toggle('active');
          const icon = btn.querySelector('i');
          icon.classList.toggle('fas');
          icon.classList.toggle('far');
          window.Drip.showToast(action === 'add' ? 'Added to wishlist!' : 'Removed from wishlist', 'success');
        } catch (err) {
          window.Drip.showToast(err.message, 'error');
        }
      });

      card.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const defaultSize = p.sizes[0] || 9;
        window.Drip.addToCart(p, defaultSize, 1);
      });

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading recommendations:", error);
  }
}

// Bind events on load
document.addEventListener('DOMContentLoaded', () => {
  loadProductDetails();

  const qtyCount = document.getElementById('qty-count');
  const btnMinus = document.getElementById('qty-minus');
  const btnPlus = document.getElementById('qty-plus');

  if (btnMinus) {
    btnMinus.addEventListener('click', () => {
      if (quantity > 1) {
        quantity--;
        qtyCount.textContent = quantity;
      }
    });
  }

  if (btnPlus) {
    btnPlus.addEventListener('click', () => {
      if (currentProduct && quantity < currentProduct.stock) {
        quantity++;
        qtyCount.textContent = quantity;
      } else {
        window.Drip.showToast("Cannot select more than available stock limit", "error");
      }
    });
  }

  // Add to cart click
  const addToCartBtn = document.getElementById('add-to-cart-action');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      if (!selectedSize) {
        window.Drip.showToast('Please select a sneaker size first!', 'error');
        return;
      }
      if (currentProduct) {
        window.Drip.addToCart(currentProduct, selectedSize, quantity);
      }
    });
  }

  // Wishlist main details click
  const wishlistBtn = document.getElementById('wishlist-action');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', async () => {
      const user = window.API.getUser();
      if (!user) {
        window.Drip.showToast('Please login to add this sneaker to your wishlist', 'error');
        window.Drip.openAuthModal();
        return;
      }

      const active = user.wishlist && user.wishlist.includes(currentProduct._id);
      const action = active ? 'remove' : 'add';
      
      try {
        await window.API.auth.toggleWishlist(currentProduct._id, action);
        if (action === 'add') {
          wishlistBtn.innerHTML = `<i class="fas fa-heart" style="color: var(--accent-crimson);"></i>`;
          window.Drip.showToast('Added to wishlist!', 'success');
        } else {
          wishlistBtn.innerHTML = `<i class="far fa-heart"></i>`;
          window.Drip.showToast('Removed from wishlist', 'success');
        }
      } catch (err) {
        window.Drip.showToast(err.message, 'error');
      }
    });
  }
});
