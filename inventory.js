/* inventory.js – bulk restock implementation */
let db;
const request = indexedDB.open('hardwareDB', 1);

request.onerror = () => console.error('Failed to open database');
request.onsuccess = e => {
  db = e.target.result;
  loadInventoryTable();
};

request.onupgradeneeded = e => {
  db = e.target.result;
  if (!db.objectStoreNames.contains('products')) {
    db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
  }
};

/* ------------- UI ------------- */

/** Render every product row with an inline restock input */
function loadInventoryTable() {
  const tbody = document.querySelector('#inventoryTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const tx = db.transaction('products', 'readonly');
  const store = tx.objectStore('products');
  store.getAll().onsuccess = e => {
    const products = e.target.result;
    products.forEach(p => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${p.name}</td>
        <td>${p.unit}</td>
        <td>${p.stock ?? 0}</td>
        <td>
          <input type="number"
                 class="form-control form-control-sm restock-input"
                 data-id="${p.id}"
                 min="0"
                 placeholder="0">
        </td>`;
      tbody.appendChild(row);
    });
  };
}

/* ------------- Bulk restock handler ------------- */
document.getElementById('bulkRestockForm')?.addEventListener('submit', e => {
  e.preventDefault();

  // Collect non‑zero inputs
  const updates = Array.from(document.querySelectorAll('.restock-input'))
    .map(inp => ({ id: +inp.dataset.id, qty: +inp.value }))
    .filter(u => u.qty > 0);

  if (updates.length === 0) {
    alert('Enter a quantity for at least one product.');
    return;
  }

  const tx = db.transaction('products', 'readwrite');
  const store = tx.objectStore('products');

  updates.forEach(({ id, qty }) => {
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const product = getReq.result;
      if (product) {
        product.stock = (product.stock ?? 0) + qty;
        store.put(product);
      }
    };
  });

  tx.oncomplete = () => {
    // Clear inputs, refresh table, notify user
    document.querySelectorAll('.restock-input').forEach(i => (i.value = ''));
    loadInventoryTable();
    alert('Bulk restock completed!');
  };
});
