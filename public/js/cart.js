function renderCart() {
  const container = document.getElementById('cart-items-container');
  if (!container) return;

  const cart = window.Drip.getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 4rem 2rem; border: 1px dashed var(--border-glass); border-radius: 20px; background: var(--bg-card);">
        <i class="fas fa-shopping-bag" style="font-size: 3.5rem; color: #272730; margin-bottom: 1.5rem;"></i>
        <h3 style="font-family: var(--font-display); color: var(--text-primary); margin-bottom: 0.5rem;">Your bag is empty</h3>
        <p style="font-size: 0.95rem; margin-bottom: 1.5rem;">You haven't added any Drip Kicks to your cart yet.</p>
        <a href="shop.html" class="btn-primary">START SHOPPING</a>
      </div>
    `;
    updateSummary(0);
    return;
  }

  container.innerHTML = '';
  let subtotal = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;

    const cartCard = document.createElement('div');
    cartCard.className = 'cart-item';
    cartCard.innerHTML = `
      <div class="cart-item-img">
        <img src="${item.image}" alt="${item.name}">
      </div>
      <div class="cart-item-info">
        <span class="product-brand">${item.brand}</span>
        <h3 class="cart-item-name">${item.name}</h3>
        <span class="cart-item-meta">Size: US Men's ${item.size}</span>
      </div>
      <div class="qty-selector">
        <button class="qty-btn btn-minus" data-idx="${index}"><i class="fas fa-minus"></i></button>
        <span class="qty-val">${item.qty}</span>
        <button class="qty-btn btn-plus" data-idx="${index}"><i class="fas fa-plus"></i></button>
      </div>
      <div class="cart-item-price">$${itemTotal}</div>
      <button class="remove-item-btn" data-product="${item.product}" data-size="${item.size}">
        <i class="fas fa-trash-alt"></i>
      </button>
    `;

    // Quantity modifiers
    cartCard.querySelector('.btn-minus').addEventListener('click', () => {
      if (item.qty > 1) {
        updateItemQty(index, item.qty - 1);
      }
    });

    cartCard.querySelector('.btn-plus').addEventListener('click', () => {
      if (item.qty < item.stock) {
        updateItemQty(index, item.qty + 1);
      } else {
        window.Drip.showToast(`Only ${item.stock} items left in stock`, 'error');
      }
    });

    // Remove handler
    cartCard.querySelector('.remove-item-btn').addEventListener('click', (e) => {
      const pId = e.currentTarget.getAttribute('data-product');
      const size = parseFloat(e.currentTarget.getAttribute('data-size'));
      window.Drip.removeFromCart(pId, size);
      renderCart();
    });

    container.appendChild(cartCard);
  });

  updateSummary(subtotal);
}

function updateItemQty(index, newQty) {
  const cart = window.Drip.getCart();
  cart[index].qty = newQty;
  localStorage.setItem('drip_kicks_cart', JSON.stringify(cart));
  window.Drip.updateCartBadge();
  renderCart();
}

function updateSummary(subtotal) {
  const subtotalEl = document.getElementById('summary-subtotal');
  const shippingEl = document.getElementById('summary-shipping');
  const taxEl = document.getElementById('summary-tax');
  const totalEl = document.getElementById('summary-total');

  if (!subtotalEl) return;

  // Shipping logic: free shipping over $200, otherwise $15
  const shipping = subtotal > 200 || subtotal === 0 ? 0 : 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  shippingEl.textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
  taxEl.textContent = `$${tax.toFixed(2)}`;
  totalEl.textContent = `$${total.toFixed(2)}`;
}

document.addEventListener('DOMContentLoaded', () => {
  renderCart();

  const checkoutBtn = document.getElementById('cart-checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      const cart = window.Drip.getCart();
      if (cart.length === 0) {
        window.Drip.showToast('Your bag is empty! Add sneakers to checkout.', 'error');
        return;
      }

      const user = window.API.getUser();
      if (!user) {
        window.Drip.showToast('Please log in to complete checkout', 'error');
        window.Drip.openAuthModal();
        return;
      }

      window.location.href = 'checkout.html';
    });
  }
});
