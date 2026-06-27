// Toast Notification System
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  toast.innerHTML = `
    <div class="toast-msg">${message}</div>
    <div class="toast-close">&times;</div>
  `;

  container.appendChild(toast);

  // Close toast on click
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  });

  // Auto-remove after 4 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }
  }, 4000);
}

// Shopping Cart Core Functions
function getCart() {
  const cart = localStorage.getItem('drip_kicks_cart');
  return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
  localStorage.setItem('drip_kicks_cart', JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, size, qty = 1) {
  if (!size) {
    showToast('Please select a size!', 'error');
    return false;
  }
  const cart = getCart();
  const existingItemIndex = cart.findIndex(item => item.product === product._id && item.size === size);
  
  if (existingItemIndex > -1) {
    if (cart[existingItemIndex].qty + qty > product.stock) {
      showToast(`Cannot add more items. Only ${product.stock} in stock.`, 'error');
      return false;
    }
    cart[existingItemIndex].qty += qty;
  } else {
    if (qty > product.stock) {
      showToast(`Cannot add item. Only ${product.stock} in stock.`, 'error');
      return false;
    }
    cart.push({
      product: product._id,
      name: product.name,
      brand: product.brand,
      image: product.images[0],
      price: product.price,
      qty,
      size,
      stock: product.stock
    });
  }

  saveCart(cart);
  showToast(`${product.name} added to cart!`, 'success');
  return true;
}

function removeFromCart(productId, size) {
  let cart = getCart();
  cart = cart.filter(item => !(item.product === productId && item.size === size));
  saveCart(cart);
  showToast('Item removed from cart', 'success');
}

function clearCart() {
  localStorage.removeItem('drip_kicks_cart');
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (badge) {
    const cart = getCart();
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    badge.textContent = totalCount;
    badge.style.display = totalCount > 0 ? 'flex' : 'none';
  }
}

// Authentication Modal Manager
function injectAuthModal() {
  if (document.getElementById('auth-modal')) return;

  const modalHtml = `
    <div id="auth-modal" class="modal">
      <div class="modal-content">
        <div class="modal-close" id="auth-modal-close">&times;</div>
        
        <!-- Login Form -->
        <div id="login-pane">
          <h2 class="modal-title">Welcome Back</h2>
          <p class="modal-subtitle">Log in to check your drip collection</p>
          <form id="login-form">
            <div class="form-group">
              <label class="form-label" for="login-email">Email Address</label>
              <input type="email" id="login-email" class="form-input" required placeholder="name@domain.com">
            </div>
            <div class="form-group">
              <label class="form-label" for="login-password">Password</label>
              <input type="password" id="login-password" class="form-input" required placeholder="••••••••">
            </div>
            <button type="submit" class="form-btn">LOG IN</button>
          </form>
          <div class="modal-switch">
            Don't have an account? <span id="switch-to-signup">Sign Up</span>
          </div>
        </div>

        <!-- Signup Form -->
        <div id="signup-pane" style="display: none;">
          <h2 class="modal-title">Join The Club</h2>
          <p class="modal-subtitle">Register to shop premium kicks</p>
          <form id="signup-form">
            <div class="form-group">
              <label class="form-label" for="signup-name">Full Name</label>
              <input type="text" id="signup-name" class="form-input" required placeholder="John Doe">
            </div>
            <div class="form-group">
              <label class="form-label" for="signup-email">Email Address</label>
              <input type="email" id="signup-email" class="form-input" required placeholder="name@domain.com">
            </div>
            <div class="form-group">
              <label class="form-label" for="signup-password">Password</label>
              <input type="password" id="signup-password" class="form-input" required placeholder="••••••••">
            </div>
            <button type="submit" class="form-btn">CREATE ACCOUNT</button>
          </form>
          <div class="modal-switch">
            Already have an account? <span id="switch-to-login">Log In</span>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Close bindings
  document.getElementById('auth-modal-close').addEventListener('click', closeAuthModal);
  document.getElementById('auth-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('auth-modal')) closeAuthModal();
  });

  // Toggle panes
  document.getElementById('switch-to-signup').addEventListener('click', () => {
    document.getElementById('login-pane').style.display = 'none';
    document.getElementById('signup-pane').style.display = 'block';
  });

  document.getElementById('switch-to-login').addEventListener('click', () => {
    document.getElementById('signup-pane').style.display = 'none';
    document.getElementById('login-pane').style.display = 'block';
  });

  // Submit bindings
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('signup-form').addEventListener('submit', handleSignup);
}

function openAuthModal() {
  injectAuthModal();
  document.getElementById('auth-modal').classList.add('active');
  document.getElementById('login-pane').style.display = 'block';
  document.getElementById('signup-pane').style.display = 'none';
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('active');
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const data = await window.API.auth.login(email, password);
    showToast(`Welcome back, ${data.name}!`, 'success');
    closeAuthModal();
    // Refresh header or page
    setTimeout(() => window.location.reload(), 1000);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  try {
    const data = await window.API.auth.register(name, email, password);
    showToast(`Account created! Welcome ${data.name}!`, 'success');
    closeAuthModal();
    // Refresh header or page
    setTimeout(() => window.location.reload(), 1000);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Injects standard navigation
function renderNavbar() {
  const header = document.querySelector('header');
  if (!header) return;

  const user = window.API.getUser();
  const isAdmin = user && user.role === 'admin';

  let authLinkHtml = `<div class="auth-nav-link" id="nav-auth-trigger">LOG IN</div>`;
  if (user) {
    authLinkHtml = `
      <a href="profile.html" class="nav-btn" title="View Profile">
        <i class="far fa-user"></i>
      </a>
      ${isAdmin ? '<a href="admin.html" class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;"><i class="fas fa-cog"></i> ADMIN</a>' : ''}
      <button class="nav-btn" id="nav-logout-btn" title="Logout" style="border-color: var(--accent-crimson-glow); color: var(--accent-crimson);">
        <i class="fas fa-sign-out-alt"></i>
      </button>
    `;
  }

  header.innerHTML = `
    <div class="nav-container">
      <a href="index.html" class="logo">
        DRIP<span>KICKS</span>
      </a>
      <nav class="nav-links">
        <a href="index.html">Home</a>
        <a href="shop.html">Shop</a>
        <a href="profile.html">Wishlist</a>
        <a href="profile.html?pane=orders">My Orders</a>
      </nav>
      <div class="nav-actions">
        <a href="cart.html" class="nav-btn" title="Shopping Cart">
          <i class="fas fa-shopping-bag"></i>
          <span class="badge" id="cart-badge">0</span>
        </a>
        ${authLinkHtml}
      </div>
    </div>
  `;

  // Bind auth clicks
  const trigger = document.getElementById('nav-auth-trigger');
  if (trigger) {
    trigger.addEventListener('click', openAuthModal);
  }

  const logoutBtn = document.getElementById('nav-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.API.auth.logout();
      showToast('Logged out successfully', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    });
  }

  updateCartBadge();
}

// Injects standard footer
function renderFooter() {
  const footer = document.querySelector('footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="footer-container">
      <div class="footer-info">
        <a href="index.html" class="logo">
          DRIP<span>KICKS</span>
        </a>
        <p>Premium, high-end sneaker culture direct to your door. The absolute latest releases, guaranteed authentic.</p>
      </div>
      <div class="footer-links-col">
        <h3>COLLECTION</h3>
        <ul>
          <li><a href="shop.html?category=lifestyle">Lifestyle</a></li>
          <li><a href="shop.html?category=basketball">Basketball</a></li>
          <li><a href="shop.html?category=running">Running</a></li>
          <li><a href="shop.html?brand=jordan">J Jordans</a></li>
        </ul>
      </div>
      <div class="footer-links-col">
        <h3>CUSTOMER CARE</h3>
        <ul>
          <li><a href="#">Support Center</a></li>
          <li><a href="#">Shipping Details</a></li>
          <li><a href="#">Return Policy</a></li>
          <li><a href="#">Authenticity Guarantee</a></li>
        </ul>
      </div>
      <div class="footer-newsletter">
        <h3>DROP ALERT</h3>
        <p>Subscribe to receive notifications when rare sneakers drop.</p>
        <form class="newsletter-form" id="newsletter-form">
          <input type="email" required placeholder="name@domain.com">
          <button type="submit">SIGN UP</button>
        </form>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 Drip Kicks Inc. All rights reserved.</p>
      <div style="display: flex; gap: 1.5rem;">
        <a href="#"><i class="fab fa-instagram"></i></a>
        <a href="#"><i class="fab fa-twitter"></i></a>
        <a href="#"><i class="fab fa-facebook"></i></a>
        <a href="#"><i class="fab fa-discord"></i></a>
      </div>
    </div>
  `;

  // Bind newsletter alert
  const form = document.getElementById('newsletter-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Awesome! You will be notified on the next sneaker drop!', 'success');
      form.reset();
    });
  }
}

// Auto load fontawesome dynamically to make icons render properly
function loadFontAwesome() {
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
    document.head.appendChild(link);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  loadFontAwesome();
  
  // Auto-validate current token if user is saved in storage
  if (window.API.getToken()) {
    try {
      await window.API.auth.getProfile();
    } catch (e) {
      console.warn("Session expired or token invalid");
    }
  }
  
  renderNavbar();
  renderFooter();
  injectAuthModal();
});

// Expose common functions
window.Drip = {
  showToast,
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  updateCartBadge,
  openAuthModal,
  closeAuthModal
};
