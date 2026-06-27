async function initAdmin() {
  const user = window.API.getUser();
  if (!user || user.role !== 'admin') {
    window.location.href = 'index.html';
    return;
  }

  setupAdminTabs();
  setupProductModal();

  // Load all components initial state
  await loadProductsTable();
  await loadOrdersTable();
  await loadUsersTable();
}

function setupAdminTabs() {
  const tabs = document.querySelectorAll('.admin-tab');
  const panes = document.querySelectorAll('.content-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const paneId = tab.getAttribute('data-pane');
      
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      panes.forEach(p => p.classList.remove('active'));
      document.getElementById(paneId).classList.add('active');
    });
  });
}

function setupProductModal() {
  const modal = document.getElementById('product-form-modal');
  const openBtn = document.getElementById('add-product-btn-trigger');
  const closeBtn = document.getElementById('product-form-modal-close');
  const form = document.getElementById('product-upsert-form');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      // Clear and set to "Add Mode"
      form.reset();
      document.getElementById('edit-product-id').value = '';
      document.getElementById('product-modal-title').textContent = 'Add Sneaker';
      modal.classList.add('active');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  // Handle Upsert Form Submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('edit-product-id').value;
      const name = document.getElementById('prod-name').value;
      const brand = document.getElementById('prod-brand').value;
      const category = document.getElementById('prod-category').value;
      const price = parseFloat(document.getElementById('prod-price').value);
      const stock = parseInt(document.getElementById('prod-stock').value);
      const sizes = document.getElementById('prod-sizes').value;
      const images = document.getElementById('prod-images').value;
      const description = document.getElementById('prod-desc').value;
      const featured = document.getElementById('prod-featured').checked;
      const isNewArrival = document.getElementById('prod-newarrival').checked;

      const productPayload = {
        name, brand, category, price, stock, sizes, images, description, featured, isNewArrival
      };

      try {
        if (id) {
          // Edit
          await window.API.products.update(id, productPayload);
          window.Drip.showToast('Product updated successfully!', 'success');
        } else {
          // Create
          await window.API.products.create(productPayload);
          window.Drip.showToast('Product added successfully!', 'success');
        }
        
        modal.classList.remove('active');
        form.reset();
        await loadProductsTable();
      } catch (err) {
        window.Drip.showToast(err.message, 'error');
      }
    });
  }
}

// 1. PRODUCTS TABLE LOAD
async function loadProductsTable() {
  const tbody = document.getElementById('admin-products-table-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading products...</td></tr>`;

  try {
    const products = await window.API.products.getAll();
    tbody.innerHTML = '';

    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No products found in the database.</td></tr>`;
      return;
    }

    products.forEach(p => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><img src="${p.images[0]}" alt="${p.name}" style="width: 50px; height: 35px; object-fit: contain; background: rgba(255,255,255,0.01); border-radius: 4px;"></td>
        <td style="font-weight: 600;">${p.name}</td>
        <td>${p.brand}</td>
        <td>${p.category}</td>
        <td style="font-weight: bold;">$${p.price}</td>
        <td style="color: ${p.stock === 0 ? 'var(--accent-crimson)' : 'var(--text-primary)'};">${p.stock} units</td>
        <td>
          <button class="admin-action-btn btn-edit edit-trigger-btn" data-id="${p._id}">EDIT</button>
          <button class="admin-action-btn btn-delete delete-trigger-btn" data-id="${p._id}">DELETE</button>
        </td>
      `;

      // Bind Edit product click
      row.querySelector('.edit-trigger-btn').addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        try {
          const product = await window.API.products.getById(id);
          
          document.getElementById('edit-product-id').value = product._id;
          document.getElementById('prod-name').value = product.name;
          document.getElementById('prod-brand').value = product.brand;
          document.getElementById('prod-category').value = product.category;
          document.getElementById('prod-price').value = product.price;
          document.getElementById('prod-stock').value = product.stock;
          document.getElementById('prod-sizes').value = product.sizes.join(', ');
          document.getElementById('prod-images').value = product.images.join(', ');
          document.getElementById('prod-desc').value = product.description;
          document.getElementById('prod-featured').checked = product.featured;
          document.getElementById('prod-newarrival').checked = product.isNewArrival;

          document.getElementById('product-modal-title').textContent = 'Edit Sneaker';
          document.getElementById('product-form-modal').classList.add('active');
        } catch (err) {
          window.Drip.showToast(err.message, 'error');
        }
      });

      // Bind Delete product click
      row.querySelector('.delete-trigger-btn').addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm(`Are you sure you want to delete this product?`)) {
          try {
            await window.API.products.delete(id);
            window.Drip.showToast('Product deleted!', 'success');
            await loadProductsTable();
          } catch (err) {
            window.Drip.showToast(err.message, 'error');
          }
        }
      });

      tbody.appendChild(row);
    });
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--accent-crimson);">Failed to load products table</td></tr>`;
  }
}

// 2. ORDERS TABLE LOAD
async function loadOrdersTable() {
  const tbody = document.getElementById('admin-orders-table-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading orders...</td></tr>`;

  try {
    const orders = await window.API.orders.getAll();
    tbody.innerHTML = '';

    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No orders placed yet.</td></tr>`;
      return;
    }

    orders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="font-weight: bold; font-family: var(--font-display);">#${order._id.substring(0, 8).toUpperCase()}</td>
        <td>${date}</td>
        <td style="font-size: 0.95rem; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${order.shippingAddress.address}, ${order.shippingAddress.city}
        </td>
        <td style="font-weight: bold; color: var(--accent-volt); font-size: 1.05rem;">$${order.totalPrice.toFixed(2)}</td>
        <td>
          <select class="admin-status-dropdown" data-id="${order._id}" style="background: var(--bg-primary); border: 1px solid var(--border-glass); padding: 0.4rem; border-radius: 6px; color: var(--text-primary);">
            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Paid" ${order.status === 'Paid' ? 'selected' : ''}>Paid</option>
            <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <button class="admin-action-btn btn-edit update-status-trigger" data-id="${order._id}">UPDATE</button>
        </td>
      `;

      // Status update event
      row.querySelector('.update-status-trigger').addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const select = row.querySelector('.admin-status-dropdown');
        const newStatus = select.value;
        try {
          await window.API.orders.updateStatus(id, newStatus);
          window.Drip.showToast(`Order status updated to ${newStatus}`, 'success');
          await loadOrdersTable();
        } catch (err) {
          window.Drip.showToast(err.message, 'error');
        }
      });

      tbody.appendChild(row);
    });
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--accent-crimson);">Failed to load orders table</td></tr>`;
  }
}

// 3. USERS TABLE LOAD
async function loadUsersTable() {
  const tbody = document.getElementById('admin-users-table-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading users...</td></tr>`;

  try {
    const users = await window.API.auth.getUsers();
    tbody.innerHTML = '';

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No users registered in database.</td></tr>`;
      return;
    }

    users.forEach(u => {
      const date = new Date(u.createdAt).toLocaleDateString();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="font-family: var(--font-display); font-size: 0.85rem;">#${u._id}</td>
        <td style="font-weight: 600;">${u.name}</td>
        <td>${u.email}</td>
        <td>
          <span style="padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: bold; background: ${u.role === 'admin' ? 'var(--accent-volt)' : 'rgba(255,255,255,0.05)'}; color: ${u.role === 'admin' ? 'var(--bg-primary)' : 'var(--text-primary)'};">
            ${u.role.toUpperCase()}
          </span>
        </td>
        <td>${date}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--accent-crimson);">Failed to load users table</td></tr>`;
  }
}

document.addEventListener('DOMContentLoaded', initAdmin);
