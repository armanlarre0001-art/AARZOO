function initCheckout() {
  const cart = window.Drip.getCart();
  if (cart.length === 0) {
    window.location.href = 'cart.html';
    return;
  }

  renderReviewItems(cart);
  calculateCheckoutPrices(cart);
  setupCardMockupBinding();
  setupOrderPlacement();
}

function renderReviewItems(cart) {
  const container = document.getElementById('checkout-items-review');
  if (!container) return;

  container.innerHTML = '';
  cart.forEach(item => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';
    row.style.fontSize = '0.9rem';
    row.style.borderBottom = '1px solid var(--border-glass)';
    row.style.paddingBottom = '0.75rem';

    row.innerHTML = `
      <div style="max-width: 70%;">
        <span style="font-weight: 600; font-family: var(--font-display);">${item.name}</span>
        <div style="color: var(--text-muted); font-size: 0.8rem;">Qty: ${item.qty} | Size: ${item.size}</div>
      </div>
      <div style="font-weight: bold; color: var(--text-primary);">$${item.price * item.qty}</div>
    `;
    container.appendChild(row);
  });
}

function calculateCheckoutPrices(cart) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal > 200 ? 0 : 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  document.getElementById('checkout-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('checkout-shipping').textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
  document.getElementById('checkout-tax').textContent = `$${tax.toFixed(2)}`;
  document.getElementById('checkout-total').textContent = `$${total.toFixed(2)}`;
}

function setupCardMockupBinding() {
  const holderInput = document.getElementById('card-holder');
  const numberInput = document.getElementById('card-number-input');
  const expiryInput = document.getElementById('card-expiry-input');

  const mockName = document.getElementById('mock-card-name');
  const mockNumber = document.getElementById('mock-card-number');
  const mockExpiry = document.getElementById('mock-card-expiry');

  if (holderInput) {
    holderInput.addEventListener('input', (e) => {
      mockName.textContent = e.target.value.toUpperCase() || 'YOUR NAME';
    });
  }

  if (numberInput) {
    numberInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      let matches = val.match(/\d{4,16}/g);
      let match = (matches && matches[0]) || '';
      let parts = [];

      for (let i = 0, len = match.length; i < len; i += 4) {
        parts.push(match.substring(i, i + 4));
      }

      if (parts.length > 0) {
        numberInput.value = parts.join(' ');
        mockNumber.textContent = parts.join(' ');
      } else {
        numberInput.value = val;
        mockNumber.textContent = '•••• •••• •••• ••••';
      }
    });
  }

  if (expiryInput) {
    expiryInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      if (val.length >= 2) {
        val = val.substring(0, 2) + '/' + val.substring(2, 4);
      }
      expiryInput.value = val;
      mockExpiry.textContent = val || 'MM/YY';
    });
  }
}

function setupOrderPlacement() {
  const form = document.getElementById('checkout-form');
  const btn = document.getElementById('place-order-btn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Animate loading status
    btn.disabled = true;
    btn.style.opacity = '0.7';
    btn.innerHTML = `PROCESSING ORDER <i class="fas fa-spinner fa-spin"></i>`;

    const cart = window.Drip.getCart();
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const shipping = subtotal > 200 ? 0 : 15;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    const orderData = {
      orderItems: cart,
      shippingAddress: {
        address: document.getElementById('ship-address').value,
        city: document.getElementById('ship-city').value,
        postalCode: document.getElementById('ship-zip').value,
        country: document.getElementById('ship-country').value
      },
      itemsPrice: subtotal,
      shippingPrice: shipping,
      totalPrice: total
    };

    try {
      const order = await window.API.orders.create(orderData);
      window.Drip.showToast('Order placed successfully! Redirecting...', 'success');
      
      // Clear Cart
      window.Drip.clearCart();
      
      // Delayed redirect to order list in profile
      setTimeout(() => {
        window.location.href = 'profile.html?pane=orders';
      }, 1500);
    } catch (err) {
      window.Drip.showToast(err.message, 'error');
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = `PLACE ORDER <i class="fas fa-lock"></i>`;
    }
  });
}

document.addEventListener('DOMContentLoaded', initCheckout);
