let db;
const request = indexedDB.open('hardwareDB', 1);

request.onerror = () => console.error('Failed to open IndexedDB');
request.onsuccess = (e) => {
  db = e.target.result;
  loadDashboard();
};

request.onupgradeneeded = (e) => {
  db = e.target.result;
  if (!db.objectStoreNames.contains('products')) {
    db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
  }
  if (!db.objectStoreNames.contains('sales')) {
    db.createObjectStore('sales', { keyPath: 'time' });
  }
};

function loadDashboard() {
  if (typeof loadShopHeader === 'function') loadShopHeader();

  const today = new Date().toISOString().slice(0, 10);
  let totalSales = 0;
  let totalStock = 0;

  // Load today's sales total
  const salesTx = db.transaction('sales', 'readonly');
  const salesStore = salesTx.objectStore('sales');
  const salesCursor = salesStore.openCursor();

  salesCursor.onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const sale = cursor.value;
      if (sale.time?.startsWith(today)) {
        totalSales += sale.total || 0;
      }
      cursor.continue();
    } else {
      const display = document.getElementById('salesTotal');
      if (display) display.textContent = `₵${totalSales.toFixed(2)}`;
    }
  };

  // Load total stock count
  const productTx = db.transaction('products', 'readonly');
  const productStore = productTx.objectStore('products');
  const productCursor = productStore.openCursor();

  productCursor.onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const product = cursor.value;
      totalStock += product.stock || 0;
      cursor.continue();
    } else {
      const display = document.getElementById('stockTotal');
      if (display) display.textContent = totalStock;
    }
  };
}
