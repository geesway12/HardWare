/* db.js – IndexedDB helper module
   ───────────────────────────────
   • Products    → keyPath "id" (autoIncrement)
   • Sales       → keyPath "id" (autoIncrement)  ← NEW  ✔
*/

const DB_NAME    = 'hardwareDB';
const DB_VERSION = 2;                 // bumped to trigger upgrade if v1 exists

let dbReady = openDB();

/* ---------- open / upgrade ---------- */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onerror   = () => reject('Failed to open database');
    req.onsuccess = () => resolve(req.result);

    req.onupgradeneeded = e => {
      const db = e.target.result;

      /* Products */
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
      }

      /* Sales – if an old version with key "time" exists, drop & recreate */
      if (db.objectStoreNames.contains('sales')) {
        db.deleteObjectStore('sales');
      }
      db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
    };
  });
}

/* ---------- CRUD helpers (generic) ---------- */

// get all records
export async function getAll(storeName) {
  const db = await dbReady;
  return new Promise(resolve => {
    const tx = db.transaction(storeName, 'readonly');
    tx.objectStore(storeName).getAll().onsuccess = e => resolve(e.target.result);
  });
}

// get record by id
export async function getById(storeName, id) {
  const db = await dbReady;
  return new Promise(resolve => {
    const tx = db.transaction(storeName, 'readonly');
    tx.objectStore(storeName).get(id).onsuccess = e => resolve(e.target.result);
  });
}

// add record
export async function addItem(storeName, item) {
  const db = await dbReady;
  return new Promise(resolve => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).add(item);
    tx.oncomplete = resolve;
  });
}

// update record (put overwrites if key exists)
export async function updateItem(storeName, item) {
  const db = await dbReady;
  return new Promise(resolve => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(item);
    tx.oncomplete = resolve;
  });
}

// delete record by id
export async function deleteItem(storeName, id) {
  const db = await dbReady;
  return new Promise(resolve => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = resolve;
  });
}
