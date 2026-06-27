const API_BASE = '/api';

const API = {
  getToken() {
    return localStorage.getItem('drip_kicks_token');
  },
  
  setToken(token) {
    if (token) {
      localStorage.setItem('drip_kicks_token', token);
    } else {
      localStorage.removeItem('drip_kicks_token');
    }
  },

  getUser() {
    const user = localStorage.getItem('drip_kicks_user');
    return user ? JSON.parse(user) : null;
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('drip_kicks_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('drip_kicks_user');
    }
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      return data;
    } catch (error) {
      console.error(`[API Error - ${endpoint}]`, error.message);
      throw error;
    }
  },

  // Auth Operations
  auth: {
    async register(name, email, password) {
      const data = await API.request('/auth/register', {
        method: 'POST',
        body: { name, email, password }
      });
      API.setToken(data.token);
      API.setUser({ _id: data._id, name: data.name, email: data.email, role: data.role, wishlist: data.wishlist });
      return data;
    },

    async login(email, password) {
      const data = await API.request('/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      API.setToken(data.token);
      API.setUser({ _id: data._id, name: data.name, email: data.email, role: data.role, wishlist: data.wishlist });
      return data;
    },

    async getProfile() {
      try {
        const data = await API.request('/auth/profile');
        API.setUser(data);
        return data;
      } catch (e) {
        API.logout();
        throw e;
      }
    },

    async updateProfile(profileData) {
      const data = await API.request('/auth/profile', {
        method: 'PUT',
        body: profileData
      });
      API.setUser(data);
      return data;
    },

    async toggleWishlist(productId, action) {
      // action = 'add' or 'remove'
      const data = await API.request('/auth/profile', {
        method: 'PUT',
        body: { wishlistAction: action, productId }
      });
      API.setUser(data);
      return data;
    },

    async getUsers() {
      return await API.request('/auth/users');
    },

    logout() {
      API.setToken(null);
      API.setUser(null);
    }
  },

  // Products Operations
  products: {
    async getAll(params = {}) {
      const query = new URLSearchParams();
      for (const key in params) {
        if (params[key] !== undefined && params[key] !== '') {
          query.append(key, params[key]);
        }
      }
      const queryString = query.toString() ? `?${query.toString()}` : '';
      return await API.request(`/products${queryString}`);
    },

    async getById(id) {
      return await API.request(`/products/${id}`);
    },

    async create(productData) {
      return await API.request('/products', {
        method: 'POST',
        body: productData
      });
    },

    async update(id, productData) {
      return await API.request(`/products/${id}`, {
        method: 'PUT',
        body: productData
      });
    },

    async delete(id) {
      return await API.request(`/products/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // Orders Operations
  orders: {
    async create(orderData) {
      return await API.request('/orders', {
        method: 'POST',
        body: orderData
      });
    },

    async getMine() {
      return await API.request('/orders/mine');
    },

    async getById(id) {
      return await API.request(`/orders/${id}`);
    },

    async getAll() {
      return await API.request('/orders');
    },

    async updateStatus(id, status) {
      return await API.request(`/orders/${id}/status`, {
        method: 'PUT',
        body: { status }
      });
    }
  }
};

window.API = API;
