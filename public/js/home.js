// Hero Shoe rotation assets
const heroShoes = [
  "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80", // Jordan 1
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80", // Adidas Yeezy
  "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80"  // Nike Air Max
];

let currentHeroIndex = 0;

function initHeroRotation() {
  const heroImg = document.getElementById('hero-sneaker-image');
  if (!heroImg) return;

  setInterval(() => {
    currentHeroIndex = (currentHeroIndex + 1) % heroShoes.length;
    // Fade out
    heroImg.style.opacity = '0';
    heroImg.style.transform = 'translateY(15px) rotate(-20deg)';
    
    setTimeout(() => {
      heroImg.src = heroShoes[currentHeroIndex];
      heroImg.style.opacity = '1';
      heroImg.style.transform = 'translateY(0px) rotate(-15deg)';
    }, 450);
  }, 6000);
}

// Fetch and render product grid helper
async function loadHomeProducts() {
  try {
    const featuredContainer = document.getElementById('featured-products-container');
    const newArrivalsContainer = document.getElementById('new-arrivals-container');

    // Fetch featured products
    const featuredProducts = await window.API.products.getAll({ featured: true });
    // Fetch new arrivals
    const newArrivals = await window.API.products.getAll({ isNewArrival: true });

    if (featuredContainer) {
      renderProducts(featuredProducts, featuredContainer);
    }
    if (newArrivalsContainer) {
      renderProducts(newArrivals.slice(0, 3), newArrivalsContainer);
    }
  } catch (error) {
    console.error("Error loading home page products:", error);
    window.Drip.showToast("Failed to load products from server", "error");
  }
}

function renderProducts(products, container) {
  container.innerHTML = '';
  
  if (products.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem 0;">No sneakers found.</div>`;
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
      ${p.isNewArrival ? '<span class="card-badge">NEW</span>' : ''}
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

    // Click card to details page (except buttons)
    productCard.addEventListener('click', (e) => {
      if (e.target.closest('.wishlist-btn') || e.target.closest('.add-to-cart-btn')) {
        return;
      }
      window.location.href = `product.html?id=${p._id}`;
    });

    // Wishlist click handler
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

    // Quick add to cart
    productCard.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      // Since it's quick add, default to first available size
      const defaultSize = p.sizes[0] || 9;
      window.Drip.addToCart(p, defaultSize, 1);
    });

    container.appendChild(productCard);
  });
}

// Bind local events on load
document.addEventListener('DOMContentLoaded', () => {
  initHeroRotation();
  loadHomeProducts();

  const exploreBtn = document.getElementById('hero-explore-btn');
  if (exploreBtn) {
    exploreBtn.addEventListener('click', () => {
      const target = document.getElementById('new-arrivals-section');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
});
