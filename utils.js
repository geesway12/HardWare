// Load shop name into navbar or header element
function loadShopHeader(targetSelector = '.navbar-brand') {
  const settings = JSON.parse(localStorage.getItem('shopSettings')) || {};
  const target = document.querySelector(targetSelector);
  if (target && settings.name) {
    target.textContent = settings.name;
  }
}

// Retrieve full shop settings object
function getShopSettings() {
  return JSON.parse(localStorage.getItem('shopSettings')) || {};
}

// Export any table to CSV
function exportTableToCSV(tableId, filename = 'data.csv') {
  const rows = Array.from(document.querySelectorAll(`#${tableId} tr`));
  const csv = rows.map(row => {
    const cells = Array.from(row.querySelectorAll('th, td')).map(cell => `"${cell.innerText.trim()}"`);
    return cells.join(',');
  }).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
