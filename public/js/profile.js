async function initProfile() {
  const user = window.API.getUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  // Set Profile Information in Sidebar
  document.getElementById('profile-user-name').textContent = user.name;
  document.getElementById('profile-user-email').textContent = user.email;
  
  const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('user-avatar-initials').textContent = initials;

  // Setup tabs
  setupTabs();
  
  // Pre-fill settings form
  document.getElementById('settings-name').value = user.name;
  document.getElementById('settings-email').value = user.email;

  // Load specific data
  await loadWishlist();
  await loadOrders();

  // Settings form binding
  setupSettingsSubmit();
}

function setupTabs() {
  const menuItems = document.querySelectorAll('.profile-menu-item');
  const panes = document.querySelectorAll('.content-pane');

  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const paneId = item.getAttribute('data-pane');
      
      // Update menu items
      menuItems.forEach(m => m.classList.remove('active'));
      item.classList.add('active');

      // Update panes
      panes.forEach(p => p.classList.remove('active'));
      document.getElementById(paneId).classList.add('active');
    });
  });

  // Check URL query parameters to auto-switch pane
  const params = new URLSearchParams(window.location.search);
  const pane = params.get('pane');
  if (pane === 'orders') {
    const ordersMenu = document.getElementById('menu-orders');
    if (ordersMenu) ordersMenu.click();
  }
}

async function loadWishlist() {
  const user = window.API.getUser();
  const grid = document.getElementById('wishlist-items-grid');
  if (!grid) return;

  grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem 0;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--accent-volt);"></i></div>`;

  try {
    const wishlistIds = user.wishlist || [];
    if (wishlistIds.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 4rem 2rem; border: 1px dashed var(--border-glass); border-radius: 16px;">
          <i class="far fa-heart" style="font-size: 3rem; margin-bottom: 1rem; color: #272730;"></i>
          <p style="font-size: 1.1rem; font-family: var(--font-display);">Your wishlist is empty</p>
          <a href="shop.html" class="btn-primary" style="margin-top: 1rem; padding: 0.6rem 1.2rem; font-size: 0.9rem;">EXPLORE SNEAKERS</a>
        </div>
      `;
      return;
    }

    // Fetch all products and filter for wishlist
    const allProducts = await window.API.products.getAll();
    const wishlistedProducts = allProducts.filter(p => wishlistIds.includes(p._id));

    grid.innerHTML = '';
    wishlistedProducts.forEach(p => {
      const starHtml = Array(5).fill(0).map((_, idx) => 
        `<i class="${idx < Math.round(p.rating) ? 'fas' : 'far'} fa-star"></i>`
      ).join('');

      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <button class="wishlist-btn active" data-product-id="${p._id}">
          <i class="fas fa-heart"></i>
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

      // Quick remove from wishlist
      card.querySelector('.wishlist-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await window.API.auth.toggleWishlist(p._id, 'remove');
          window.Drip.showToast('Removed from wishlist', 'success');
          // Reload wishlist
          await loadWishlist();
        } catch (err) {
          window.Drip.showToast(err.message, 'error');
        }
      });

      card.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const defaultSize = p.sizes[0] || 9;
        window.Drip.addToCart(p, defaultSize, 1);
      });

      grid.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading wishlist products:", error);
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--accent-crimson);">Failed to load wishlist items</div>`;
  }
}

async function loadOrders() {
  const container = document.getElementById('user-orders-list');
  if (!container) return;

  container.innerHTML = `<div style="text-align: center; padding: 2rem 0;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--accent-volt);"></i></div>`;

  try {
    const orders = await window.API.orders.getMine();
    container.innerHTML = '';

    if (orders.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 4rem 2rem; border: 1px dashed var(--border-glass); border-radius: 16px;">
          <i class="fas fa-history" style="font-size: 3rem; margin-bottom: 1rem; color: #272730;"></i>
          <p style="font-size: 1.1rem; font-family: var(--font-display);">No order history found</p>
          <p style="font-size: 0.9rem; margin-top: 0.5rem;">Your purchase transactions will appear here.</p>
        </div>
      `;
      return;
    }

    orders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      
      const badgeClass = `badge-${order.status.toLowerCase()}`;
      
      const orderCard = document.createElement('div');
      orderCard.className = 'order-card';
      
      let itemsHtml = order.orderItems.map(item => `
        <div style="display: flex; gap: 1rem; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
          <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 40px; object-fit: contain; background: rgba(255,255,255,0.02); border-radius: 6px;">
          <div>
            <div style="font-weight: 600; font-size: 0.9rem;">${item.name}</div>
            <div style="color: var(--text-muted); font-size: 0.75rem;">Size: US ${item.size} | Qty: ${item.qty}</div>
          </div>
          <div style="margin-left: auto; font-weight: bold; font-size: 0.9rem;">$${item.price * item.qty}</div>
        </div>
      `).join('');

      orderCard.innerHTML = `
        <div class="order-header">
          <div>
            <span style="font-weight: bold; color: var(--text-primary);">Order #${order._id.substring(0, 8).toUpperCase()}</span>
            <div style="color: var(--text-muted); font-size: 0.75rem; margin-top: 2px;">Placed on ${date}</div>
          </div>
          <div>
            <span class="order-badge ${badgeClass}">${order.status.toUpperCase()}</span>
          </div>
        </div>
        <div style="margin: 1rem 0;">
          ${itemsHtml}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-glass); padding-top: 1rem; font-size: 0.95rem;">
          <div style="color: var(--text-muted); font-size: 0.85rem;">
            Shipping to: ${order.shippingAddress.address}, ${order.shippingAddress.city}
          </div>
          <div style="font-weight: bold;">
            Grand Total: <span style="color: var(--accent-volt); font-size: 1.1rem;">$${order.totalPrice.toFixed(2)}</span>
          </div>
        </div>
      `;

      container.appendChild(orderCard);
    });
  } catch (error) {
    console.error("Error loading customer orders:", error);
    container.innerHTML = `<div style="text-align: center; color: var(--accent-crimson);">Failed to load orders history</div>`;
  }
}

function setupSettingsSubmit() {
  const form = document.getElementById('profile-settings-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('settings-name').value;
    const email = document.getElementById('settings-email').value;
    const password = document.getElementById('settings-password').value;

    const payload = { name, email };
    if (password) payload.password = password;

    try {
      await window.API.auth.updateProfile(payload);
      window.Drip.showToast('Profile updated successfully!', 'success');
      document.getElementById('settings-password').value = '';
      
      // Update sidebar details
      document.getElementById('profile-user-name').textContent = name;
      document.getElementById('profile-user-email').textContent = email;
    } catch (err) {
      window.Drip.showToast(err.message, 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', initProfile);
