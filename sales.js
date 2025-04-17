/* ---------------- IndexedDB ---------------- */
let db, cart = [];
const req = indexedDB.open('hardwareDB', 1);

req.onerror = () => console.error('DB failed to open');
req.onsuccess = e => {
  db = e.target.result;
  loadProductsForSale();
  loadTodaysSales();
};
req.onupgradeneeded = e => {
  db = e.target.result;
  if (!db.objectStoreNames.contains('products'))
    db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
  if (!db.objectStoreNames.contains('sales'))
    db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
};

/* ---------------- Product dropdown ---------------- */
function loadProductsForSale() {
  const sel = document.getElementById('saleProduct');
  sel.innerHTML = '<option disabled selected>Select Product</option>';

  db.transaction('products').objectStore('products').getAll().onsuccess = e => {
    e.target.result.forEach(p => {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = `${p.name} (₵${p.price} per ${p.unit})`;
      Object.assign(o.dataset, { name:p.name, price:p.price, unit:p.unit, stock:p.stock ?? 0 });
      sel.appendChild(o);
    });
  };
}

/* ---------------- Cart helpers ---------------- */
function addToCart() {
  const id  = +document.getElementById('saleProduct').value;
  const qty = +document.getElementById('saleQty').value;
  if (!id || qty <= 0) return alert('Choose a product and quantity > 0');

  const opt   = document.querySelector(`#saleProduct option[value='${id}']`);
  const stock = +opt.dataset.stock;
  if (qty > stock) return alert(`Only ${stock} in stock`);

  const price = +opt.dataset.price;
  const unit  = opt.dataset.unit;
  const name  = opt.dataset.name;

  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty   += qty;
    existing.total += price * qty;
  } else {
    cart.push({ id, name, qty, unit, price, total: price * qty });
  }

  renderCart();
  document.getElementById('saleForm').reset();
}

function removeFromCart(i) {
  cart.splice(i, 1);
  renderCart();
}

function renderCart() {
  const tbody = document.querySelector('#cartTable tbody');
  tbody.innerHTML = cart.map((it,i)=>`
    <tr>
      <td>${it.name}</td>
      <td>${it.qty}</td>
      <td>${it.unit}</td>
      <td>₵${it.total.toFixed(2)}</td>
      <td><button class="btn btn-sm btn-danger" onclick="removeFromCart(${i})">×</button></td>
    </tr>`).join('');
  document.getElementById('confirmSaleBtn').disabled = cart.length === 0;
}

/* ---------------- Confirm sale ---------------- */
function confirmSale() {
  if (!cart.length) return;

  const stamp = new Date().toISOString();                       // full ISO datetime
  const tx = db.transaction(['products','sales'], 'readwrite');
  const pStore = tx.objectStore('products');
  const sStore = tx.objectStore('sales');

  cart.forEach(it => {
    /* 1. Reduce stock */
    pStore.get(it.id).onsuccess = ev => {
      const prod = ev.target.result;
      if (prod) { prod.stock = (prod.stock ?? 0) - it.qty; pStore.put(prod); }
    };
    /* 2. Record sale line with same timestamp */
    sStore.add({ ...it, time: stamp });
  });

  tx.oncomplete = () => {
    cart = [];
    renderCart();
    loadProductsForSale();
    loadTodaysSales();
    alert('Sale recorded successfully!');
  };
}

/* ---------------- Today’s sales ---------------- */
function loadTodaysSales() {
  const tbody = document.querySelector('#salesTable tbody');
  tbody.innerHTML = '';
  const today = new Date().toISOString().slice(0, 10);          // YYYY‑MM‑DD

  db.transaction('sales').objectStore('sales').openCursor().onsuccess = e => {
    const cur = e.target.result;
    if (cur) {
      const s = cur.value;
      if (s.time.startsWith(today)) {
        const when = new Date(s.time).toLocaleString(undefined, {
          year:'numeric', month:'2-digit', day:'2-digit',
          hour:'2-digit', minute:'2-digit', second:'2-digit'
        });
        tbody.innerHTML += `
          <tr>
            <td>${s.name}</td>
            <td>${s.qty} ${s.unit}</td>
            <td>₵${s.total.toFixed(2)}</td>
            <td>${when}</td>
          </tr>`;
      }
      cur.continue();
    }
  };
}

/* ---------------- Print helpers ---------------- */
function printReceipt()         { printDoc('receipt'); }
function printProformaInvoice() { printDoc('invoice'); }
function printDoc(type='receipt') {
  if (!cart.length) return alert('Cart is empty');
  const settings = getShopSettings?.() || {};
  const title = type === 'invoice' ? 'PROFORMA INVOICE' : 'RECEIPT';
  const now   = new Date().toLocaleString();
  const grand = cart.reduce((t,i)=>t+i.total,0);

  const rows = cart.map(i=>`
    <tr><td>${i.name}</td><td>${i.qty}</td><td>${i.unit}</td>
    <td>₵${i.price.toFixed(2)}</td><td>₵${i.total.toFixed(2)}</td></tr>`).join('');

  const html = `
    <html><head><title>${title}</title><style>
      body{font-family:Arial;padding:20px;}
      table{width:100%;border-collapse:collapse;margin-top:10px;}
      th,td{border:1px solid #000;padding:5px;}
    </style></head><body>
      ${settings.logo ? `<img src="${settings.logo}" style="height:60px"><br>` : ''}
      <h2>${settings.name || 'HardWare Ventures'}</h2>
      <h3>${title}</h3>
      <p>${settings.phone || ''}<br>Date: ${now}</p>
      <table>
        <tr><th>Item</th><th>Qty</th><th>Unit</th><th>Price</th><th>Total</th></tr>
        ${rows}
      </table>
      <h4 style="text-align:right">Grand Total: ₵${grand.toFixed(2)}</h4>
      <script>window.onload=()=>window.print();</script>
    </body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html); w.document.close();
}

/* ---------- Export confirmed sales to CSV (Excel‑friendly) ---------- */
function exportSalesToExcel() {
  const tx = db.transaction('sales', 'readonly');
  const store = tx.objectStore('sales');
  store.getAll().onsuccess = e => {
    const sales = e.target.result;
    if (!sales.length) return alert('No sales found.');

    // Build CSV header + rows
    let csv = 'Item,Qty,Unit,Price,Total,Date/Time\n';
    sales.forEach(s => {
      csv += [
        `"${s.name}"`,
        s.qty,
        s.unit,
        s.price.toFixed(2),
        s.total.toFixed(2),
        new Date(s.time).toLocaleString()
      ].join(',') + '\n';
    });

    // Download as .csv (Excel opens)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
}

/* ---------- expose helpers ---------- */
window.addToCart         = addToCart;
window.removeFromCart    = removeFromCart;
window.exportSalesToExcel = exportSalesToExcel;   // ← NEW

/* ---------------- Wire up ---------------- */
document.getElementById('confirmSaleBtn').addEventListener('click', confirmSale);
window.addToCart      = addToCart;
window.removeFromCart = removeFromCart;
