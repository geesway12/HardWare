// IndexedDB setup
let db;
const request = indexedDB.open('hardwareDB', 1);

request.onerror = () => console.error('Failed to open database');
request.onsuccess = (e) => {
  db = e.target.result;
  loadProducts();
};

request.onupgradeneeded = (e) => {
  db = e.target.result;
  if (!db.objectStoreNames.contains('products')) {
    db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
  }
};

// Category > Items Map
const categoryItems = {
  Electrical: ['Bulb', 'Socket', 'Switch', 'Cable', 'Breaker'],
  Electronics: ['Rechargeable Lamp', 'Charger', 'Power Bank', 'Fan'],
  Tools: ['Hammer', 'Screwdriver', 'Tape Measure', 'Spanner'],
  Plumbing: ['Tap', 'Pipe', 'Shower Head', 'Washer'],
  Construction: ['Nails', 'Paint', 'Cement', 'Filler'],
  'Home Essentials': ['Padlock', 'Bucket', 'Broom', 'Door Handle']
};

document.addEventListener('DOMContentLoaded', () => {
  const categorySelect = document.getElementById('productCategory');
  const itemSelect = document.getElementById('productName');
  const customName = document.getElementById('customName');
  const priceInput = document.getElementById('productPrice');
  const unitSelect = document.getElementById('productUnit');
  const form = document.getElementById('productForm');
  const tableBody = document.querySelector('#productTable tbody');

  // Populate item dropdown when category changes
  categorySelect?.addEventListener('change', () => {
    const category = categorySelect.value;
    const items = categoryItems[category] || [];
    itemSelect.innerHTML = '<option value="" disabled selected>Select Item</option>';
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item;
      opt.textContent = item;
      itemSelect.appendChild(opt);
    });
  });

  // Save product
  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = customName.value.trim() || itemSelect.value;
    const category = categorySelect.value;
    const price = parseFloat(priceInput.value);
    const unit = unitSelect.value;

    if (!name || !category || isNaN(price) || !unit) {
      alert('Please fill all fields properly');
      return;
    }

    const newProduct = { category, name, price, unit, stock: 0 };

    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    store.add(newProduct);

    tx.oncomplete = () => {
      form.reset();
      itemSelect.innerHTML = '<option value="" disabled selected>Select Item</option>';
      loadProducts();
    };
  });

  // Load product list into table
  function loadProducts() {
    const tx = db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    const req = store.getAll();

    req.onsuccess = () => {
      if (!tableBody) return;
      tableBody.innerHTML = '';
      req.result.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${product.name}</td>
          <td>₵${product.price.toFixed(2)}</td>
          <td>${product.unit}</td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">Delete</button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    };
  }

  // Delete product by ID
  window.deleteProduct = function (id) {
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    store.delete(id);
    tx.oncomplete = () => loadProducts();
  };

  // Make loadProducts globally accessible
  window.loadProducts = loadProducts;
});
