// ============================================================
//  Chempion Burger POS — frontend (Supabase, Express'siz)
//  Vercel'da statik sayt; ma'lumot Supabase'da (cb_ prefiksli jadvallar).
// ============================================================

// --- Supabase ulanish ---
// (eco-sports proyekti qayta ishlatilmoqda; alohida proyekt xohlasangiz shu 2 qatorni almashtiring)
const SUPABASE_URL = "https://ddqoktwkffnufczhdads.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkcW9rdHdrZmZudWZjemhkYWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyOTUyODgsImV4cCI6MjA5NTg3MTI4OH0.IL-C7px7_lcmwQxgXhbNlrmy0NAYN6RmQKmiUQpgq-Q";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const state = {
  categories: [], products: [], activeCategory: 'all', cart: [], orderType: 'dine_in',
};
const fmt = n => Math.round(n || 0).toLocaleString('uz-UZ') + " so'm";
const TYPE_LABEL = { dine_in: 'Zal', takeout: 'Olib ketish', delivery: 'Yetkazib berish' };

function genOrderNumber() {
  const d = new Date(); const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// ---------- Menyuni yuklash ----------
async function loadMenu() {
  const [{ data: categories, error: e1 }, { data: products, error: e2 }] = await Promise.all([
    sb.from('cb_categories').select('*').eq('visible', true).order('sort_order'),
    sb.from('cb_products').select('*').eq('available', true).order('id'),
  ]);
  if (e1 || e2) {
    console.error('Menyu yuklanmadi:', e1 || e2);
    document.getElementById('product-grid').innerHTML =
      `<div style="color:var(--muted);padding:2rem;">Menyu yuklanmadi. Supabase'da <b>cb_</b> jadvallar yaratilganmi? (supabase_setup.sql)<br><small>${(e1 || e2).message}</small></div>`;
    return;
  }
  state.categories = categories || [];
  state.products = products || [];
  renderCategories(); renderProducts();
}

function renderCategories() {
  const box = document.getElementById('cat-tabs');
  let html = `<button class="cat-tab ${state.activeCategory === 'all' ? 'active' : ''}" data-cat="all">Hammasi</button>`;
  state.categories.forEach(c => {
    html += `<button class="cat-tab ${state.activeCategory == c.id ? 'active' : ''}" data-cat="${c.id}">${c.icon || ''} ${c.name}</button>`;
  });
  box.innerHTML = html;
  box.querySelectorAll('.cat-tab').forEach(b => b.onclick = () => {
    state.activeCategory = b.dataset.cat === 'all' ? 'all' : Number(b.dataset.cat);
    renderCategories(); renderProducts();
  });
}

function renderProducts() {
  const grid = document.getElementById('product-grid');
  const list = state.activeCategory === 'all'
    ? state.products
    : state.products.filter(p => p.category_id === state.activeCategory);
  grid.innerHTML = list.map(p => `
    <div class="product-card" data-id="${p.id}">
      <div class="p-name">${p.name}</div>
      <div class="p-desc">${p.description || ''}</div>
      <div class="p-price">${fmt(p.price)}</div>
    </div>`).join('') || `<div style="color:var(--muted);padding:2rem;">Bu bo'limda mahsulot yo'q.</div>`;
  grid.querySelectorAll('.product-card').forEach(card => card.onclick = () => addToCart(Number(card.dataset.id)));
}

// ---------- Savat ----------
function addToCart(productId) {
  const p = state.products.find(x => x.id === productId);
  if (!p) return;
  const ex = state.cart.find(i => i.product_id === productId);
  if (ex) ex.qty++;
  else state.cart.push({ product_id: p.id, name: p.name, price: p.price, qty: 1 });
  renderCart();
}
function changeQty(productId, delta) {
  const it = state.cart.find(i => i.product_id === productId);
  if (!it) return;
  it.qty += delta;
  if (it.qty <= 0) state.cart = state.cart.filter(i => i.product_id !== productId);
  renderCart();
}

function renderCart() {
  const box = document.getElementById('cart-items');
  if (state.cart.length === 0) {
    box.innerHTML = `<div class="cart-empty">Savat bo'sh — taom tanlang</div>`;
  } else {
    box.innerHTML = state.cart.map(i => `
      <div class="cart-item">
        <div class="ci-name">${i.name}<small>${fmt(i.price)}</small></div>
        <div class="ci-qty">
          <button data-id="${i.product_id}" data-d="-1">−</button>
          <span>${i.qty}</span>
          <button data-id="${i.product_id}" data-d="1">+</button>
        </div>
        <div class="ci-sum">${fmt(i.price * i.qty)}</div>
      </div>`).join('');
    box.querySelectorAll('.ci-qty button').forEach(b => b.onclick = () => changeQty(Number(b.dataset.id), Number(b.dataset.d)));
  }
  updateSummary();
}

function calcTotals() {
  const subtotal = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const pct = parseFloat(document.getElementById('service-pct').value) || 0;
  const service = Math.round(subtotal * pct / 100);
  const discount = parseFloat(document.getElementById('discount-input').value) || 0;
  const total = Math.max(0, subtotal + service - discount);
  return { subtotal, service, discount, total };
}
function updateSummary() {
  const t = calcTotals();
  document.getElementById('sum-subtotal').textContent = fmt(t.subtotal);
  document.getElementById('sum-service').textContent = fmt(t.service);
  document.getElementById('sum-discount').textContent = fmt(t.discount);
  document.getElementById('sum-total').textContent = fmt(t.total);
  document.getElementById('btn-confirm').disabled = state.cart.length === 0;
}

// ---------- Buyurtma turi ----------
document.getElementById('order-types').addEventListener('click', e => {
  const b = e.target.closest('.otype'); if (!b) return;
  document.querySelectorAll('.otype').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  state.orderType = b.dataset.type;
  document.getElementById('cart-type-label').textContent = TYPE_LABEL[state.orderType];
  document.getElementById('table-row').style.display = state.orderType === 'dine_in' ? 'flex' : 'none';
});
document.getElementById('service-pct').oninput = updateSummary;
document.getElementById('discount-input').oninput = updateSummary;
document.getElementById('btn-clear').onclick = () => { state.cart = []; renderCart(); };

// ---------- Tasdiqlash (Supabase'ga saqlash) ----------
document.getElementById('btn-confirm').onclick = async () => {
  if (state.cart.length === 0) return;
  const btn = document.getElementById('btn-confirm');
  btn.disabled = true; const orig = btn.textContent; btn.textContent = 'Saqlanmoqda...';
  try {
    const t = calcTotals();
    const orderNumber = genOrderNumber();
    const { data: order, error } = await sb.from('cb_orders').insert({
      order_number: orderNumber,
      type: state.orderType,
      table_number: state.orderType === 'dine_in' ? (document.getElementById('table-number').value || null) : null,
      status: 'paid',
      subtotal: t.subtotal, service_charge: t.service, discount: t.discount, total: t.total,
      cashier: 'Kassir', paid_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;

    const items = state.cart.map(i => ({
      order_id: order.id, product_id: i.product_id, name: i.name, price: i.price, qty: i.qty, subtotal: i.price * i.qty,
    }));
    const { error: e2 } = await sb.from('cb_order_items').insert(items);
    if (e2) throw e2;

    showReceipt(order, t);
  } catch (err) {
    alert('Buyurtma saqlanmadi: ' + (err.message || err));
    console.error(err);
  } finally {
    btn.textContent = orig; btn.disabled = state.cart.length === 0;
  }
};

function showReceipt(order, t) {
  const now = new Date();
  const itemsHtml = state.cart.map(i =>
    `<div class="r-line"><span>${i.name} ×${i.qty}</span><b>${fmt(i.price * i.qty)}</b></div>`).join('');
  document.getElementById('receipt-body').innerHTML = `
    <div class="r-store">
      <h3>🍔 CHEMPION BURGER</h3>
      <small>Chek: #${order.order_number}</small>
    </div>
    <div class="r-line"><span>Sana</span><span>${now.toLocaleString('uz-UZ')}</span></div>
    <div class="r-line"><span>Turi</span><span>${TYPE_LABEL[order.type]}</span></div>
    ${order.table_number ? `<div class="r-line"><span>Stol</span><span>№${order.table_number}</span></div>` : ''}
    <div class="r-items">${itemsHtml}</div>
    <div class="r-line"><span>Oraliq</span><span>${fmt(t.subtotal)}</span></div>
    <div class="r-line"><span>Xizmat haqi</span><span>${fmt(t.service)}</span></div>
    <div class="r-line"><span>Chegirma</span><span>${fmt(t.discount)}</span></div>
    <div class="r-total"><span>JAMI</span><b>${fmt(t.total)}</b></div>`;
  document.getElementById('receipt-modal').classList.add('open');
}
document.getElementById('receipt-print').onclick = () => window.print();
document.getElementById('receipt-close').onclick = () => {
  document.getElementById('receipt-modal').classList.remove('open');
  if (state.viewingHistoricalReceipt) {
    state.viewingHistoricalReceipt = false;
  } else {
    state.cart = [];
    document.getElementById('table-number').value = '';
    document.getElementById('service-pct').value = '0';
    document.getElementById('discount-input').value = '0';
    renderCart();
  }
};

// ---------- Hisobot (Supabase'dan) ----------
const reportDate = document.getElementById('report-date');
document.getElementById('open-reports').onclick = () => {
  reportDate.value = new Date().toISOString().slice(0, 10);
  loadReport();
  document.getElementById('reports-modal').classList.add('open');
};
document.getElementById('reports-close').onclick = () => document.getElementById('reports-modal').classList.remove('open');
reportDate.onchange = loadReport;

async function loadReport() {
  const date = reportDate.value;
  const { data: orders, error } = await sb.from('cb_orders').select('*')
    .eq('status', 'paid')
    .gte('created_at', date + 'T00:00:00')
    .lte('created_at', date + 'T23:59:59.999');
  const body = document.getElementById('report-body');
  if (error) { body.innerHTML = `<div style="color:#e23b2e">Hisobot xatosi: ${error.message}</div>`; return; }

  const list = orders || [];
  const revenue = list.reduce((s, o) => s + Number(o.total || 0), 0);
  const service = list.reduce((s, o) => s + Number(o.service_charge || 0), 0);
  const discount = list.reduce((s, o) => s + Number(o.discount || 0), 0);

  // Turlar bo'yicha
  const byType = {};
  list.forEach(o => { byType[o.type] = byType[o.type] || { count: 0, sum: 0 }; byType[o.type].count++; byType[o.type].sum += Number(o.total || 0); });
  const typesHtml = Object.keys(byType).map(k => `<div class="rrow"><span>${TYPE_LABEL[k] || k}</span><span>${byType[k].count} ta · ${fmt(byType[k].sum)}</span></div>`).join('') || `<div class="rrow"><span>—</span></div>`;

  // Eng ko'p sotilgan (order_items)
  let topHtml = `<div class="rrow"><span>Sotuv yo'q</span></div>`;
  const ids = list.map(o => o.id);
  if (ids.length) {
    const { data: items } = await sb.from('cb_order_items').select('name, qty, subtotal').in('order_id', ids);
    const agg = {};
    (items || []).forEach(it => { agg[it.name] = agg[it.name] || { qty: 0, rev: 0 }; agg[it.name].qty += Number(it.qty || 0); agg[it.name].rev += Number(it.subtotal || 0); });
    const top = Object.entries(agg).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.rev - a.rev).slice(0, 10);
    if (top.length) topHtml = top.map(p => `<div class="rrow"><span>${p.name}</span><span>${p.qty} dona · ${fmt(p.rev)}</span></div>`).join('');
  }

  body.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><small>Buyurtmalar</small><b>${list.length} ta</b></div>
      <div class="kpi"><small>Tushum</small><b>${fmt(revenue)}</b></div>
      <div class="kpi"><small>Xizmat haqi</small><b>${fmt(service)}</b></div>
      <div class="kpi"><small>Chegirma</small><b>${fmt(discount)}</b></div>
    </div>
    <h4>Buyurtma turlari</h4>${typesHtml}
    <h4>Eng ko'p sotilgan</h4>${topHtml}`;
}

// ============================================================
//  Admin Panel & Login logikasi
// ============================================================

// --- Long press logo to open login ---
const logo = document.getElementById('logo-brand');
let pressTimer = null;

const startPress = (e) => {
  if (e.type === 'mousedown' && e.button !== 0) return;
  logo.classList.add('pressing');
  pressTimer = setTimeout(() => {
    logo.classList.remove('pressing');
    document.getElementById('login-modal').classList.add('open');
    document.getElementById('login-username').focus();
  }, 3000);
};

const cancelPress = () => {
  logo.classList.remove('pressing');
  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }
};

logo.addEventListener('mousedown', startPress);
logo.addEventListener('touchstart', startPress, { passive: true });
window.addEventListener('mouseup', cancelPress);
window.addEventListener('touchend', cancelPress);
logo.addEventListener('mouseleave', cancelPress);

// --- Login Handling ---
document.getElementById('login-close').onclick = () => {
  document.getElementById('login-modal').classList.remove('open');
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').textContent = '';
};

document.getElementById('login-form').onsubmit = (e) => {
  e.preventDefault();
  const user = document.getElementById('login-username').value;
  const pass = document.getElementById('login-password').value;
  
  if (user === 'admin' && pass === '123') {
    document.getElementById('login-modal').classList.remove('open');
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').textContent = '';
    openAdminPanel();
  } else {
    document.getElementById('login-error').textContent = 'Xato login yoki parol!';
  }
};

// --- Admin Panel Navigation ---
const adminState = {
  activeTab: 'admin-products',
  orders: []
};

document.querySelectorAll('.admin-nav-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-pane').forEach(p => p.classList.remove('active'));
    
    btn.classList.add('active');
    const tabId = btn.dataset.tab;
    document.getElementById(tabId).classList.add('active');
    adminState.activeTab = tabId;
    renderAdminActiveTab();
  };
});

document.getElementById('admin-close').onclick = () => {
  document.getElementById('admin-modal').classList.remove('open');
  loadMenu();
};

async function openAdminPanel() {
  document.getElementById('admin-modal').classList.add('open');
  document.getElementById('admin-orders-date').value = new Date().toISOString().slice(0, 10);
  populateCategorySelect();
  renderAdminActiveTab();
}

function renderAdminActiveTab() {
  if (adminState.activeTab === 'admin-products') {
    renderAdminProducts();
  } else if (adminState.activeTab === 'admin-categories') {
    renderAdminCategories();
  } else if (adminState.activeTab === 'admin-orders') {
    loadAdminOrders();
  }
}

function populateCategorySelect() {
  const select = document.getElementById('form-product-category');
  select.innerHTML = state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

// --- Product CRUD ---
function renderAdminProducts() {
  const tbody = document.getElementById('admin-products-list');
  tbody.innerHTML = state.products.map(p => {
    const cat = state.categories.find(c => c.id === p.category_id);
    const catName = cat ? `${cat.icon || ''} ${cat.name}` : 'Kategoriya yo\'q';
    return `
      <tr>
        <td><b>${p.name}</b><br><small style="color:var(--muted)">${p.description || ''}</small></td>
        <td>${catName}</td>
        <td>${fmt(p.price)}</td>
        <td>
          <span class="status-badge ${p.available ? 'available' : 'unavailable'}">
            ${p.available ? 'Sotuvda' : 'Yo\'q'}
          </span>
        </td>
        <td>
          <button class="btn-action edit-btn" data-id="${p.id}">✏️</button>
          <button class="btn-action ${p.available ? 'delete-btn' : ''}" data-id="${p.id}" data-action="toggle-avail">
            ${p.available ? 'Bloklash' : 'Mavjud qilish'}
          </button>
          <button class="btn-action delete-btn" data-id="${p.id}" data-action="delete">❌</button>
        </td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--muted)">Mahsulotlar yo\'q</td></tr>';

  tbody.querySelectorAll('.btn-action').forEach(btn => {
    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;
    if (action === 'toggle-avail') {
      btn.onclick = () => toggleProductAvailability(id);
    } else if (action === 'delete') {
      btn.onclick = () => deleteProduct(id);
    } else {
      btn.onclick = () => openProductForm(id);
    }
  });
}

function openProductForm(productId = null) {
  const modal = document.getElementById('product-form-modal');
  const title = document.getElementById('product-form-title');
  const form = document.getElementById('product-form');
  form.reset();
  populateCategorySelect();
  if (productId) {
    title.textContent = 'Mahsulotni tahrirlash';
    const p = state.products.find(x => x.id === productId);
    if (p) {
      document.getElementById('form-product-id').value = p.id;
      document.getElementById('form-product-name').value = p.name;
      document.getElementById('form-product-category').value = p.category_id;
      document.getElementById('form-product-price').value = p.price;
      document.getElementById('form-product-desc').value = p.description || '';
      document.getElementById('form-product-available').checked = p.available;
    }
  } else {
    title.textContent = 'Yangi mahsulot';
    document.getElementById('form-product-id').value = '';
    document.getElementById('form-product-available').checked = true;
  }
  modal.classList.add('open');
}

document.getElementById('btn-new-product').onclick = () => openProductForm();
document.getElementById('product-form-close').onclick = () => document.getElementById('product-form-modal').classList.remove('open');

document.getElementById('product-form').onsubmit = async (e) => {
  e.preventDefault();
  const id = document.getElementById('form-product-id').value;
  const name = document.getElementById('form-product-name').value;
  const category_id = Number(document.getElementById('form-product-category').value);
  const price = Number(document.getElementById('form-product-price').value);
  const description = document.getElementById('form-product-desc').value;
  const available = document.getElementById('form-product-available').checked;
  
  const payload = { category_id, name, price, description, available };
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    if (id) {
      const { error } = await sb.from('cb_products').update(payload).eq('id', Number(id));
      if (error) throw error;
    } else {
      const { error } = await sb.from('cb_products').insert(payload);
      if (error) throw error;
    }
    document.getElementById('product-form-modal').classList.remove('open');
    await loadMenu();
    renderAdminProducts();
  } catch (err) {
    alert('Saqlashda xatolik yuz berdi: ' + (err.message || err));
  } finally {
    btn.disabled = false;
  }
};

async function toggleProductAvailability(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  try {
    const { error } = await sb.from('cb_products').update({ available: !p.available }).eq('id', id);
    if (error) throw error;
    await loadMenu();
    renderAdminProducts();
  } catch (err) {
    alert('Xatolik: ' + (err.message || err));
  }
}

async function deleteProduct(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`"${p.name}" mahsulotini o'chirishni tasdiqlaysizmi?`)) return;
  try {
    const { error } = await sb.from('cb_products').delete().eq('id', id);
    if (error) throw error;
    await loadMenu();
    renderAdminProducts();
  } catch (err) {
    alert('O\'chirishda xatolik: ' + (err.message || err));
  }
}

// --- Category CRUD ---
function renderAdminCategories() {
  const tbody = document.getElementById('admin-categories-list');
  tbody.innerHTML = state.categories.map(c => {
    return `
      <tr>
        <td style="font-size: 1.2rem; text-align: center;">${c.icon || '🍔'}</td>
        <td><b>${c.name}</b></td>
        <td>${c.sort_order}</td>
        <td>
          <span class="status-badge ${c.visible ? 'available' : 'unavailable'}">
            ${c.visible ? 'Ko\'rinadi' : 'Yashirin'}
          </span>
        </td>
        <td>
          <button class="btn-action edit-btn" data-id="${c.id}">✏️</button>
          <button class="btn-action ${c.visible ? 'delete-btn' : ''}" data-id="${c.id}" data-action="toggle-visible">
            ${c.visible ? 'Yashirish' : 'Ko\'rsatish'}
          </button>
          <button class="btn-action delete-btn" data-id="${c.id}" data-action="delete">❌</button>
        </td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--muted)">Kategoriyalar yo\'q</td></tr>';

  tbody.querySelectorAll('.btn-action').forEach(btn => {
    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;
    if (action === 'toggle-visible') {
      btn.onclick = () => toggleCategoryVisibility(id);
    } else if (action === 'delete') {
      btn.onclick = () => deleteCategory(id);
    } else {
      btn.onclick = () => openCategoryForm(id);
    }
  });
}

function openCategoryForm(categoryId = null) {
  const modal = document.getElementById('category-form-modal');
  const title = document.getElementById('category-form-title');
  const form = document.getElementById('category-form');
  form.reset();
  if (categoryId) {
    title.textContent = 'Kategoriyani tahrirlash';
    const c = state.categories.find(x => x.id === categoryId);
    if (c) {
      document.getElementById('form-category-id').value = c.id;
      document.getElementById('form-category-name').value = c.name;
      document.getElementById('form-category-icon').value = c.icon || '🍔';
      document.getElementById('form-category-sort').value = c.sort_order;
      document.getElementById('form-category-visible').checked = c.visible;
    }
  } else {
    title.textContent = 'Yangi kategoriya';
    document.getElementById('form-category-id').value = '';
    document.getElementById('form-category-icon').value = '🍔';
    document.getElementById('form-category-sort').value = state.categories.length + 1;
    document.getElementById('form-category-visible').checked = true;
  }
  modal.classList.add('open');
}

document.getElementById('btn-new-category').onclick = () => openCategoryForm();
document.getElementById('category-form-close').onclick = () => document.getElementById('category-form-modal').classList.remove('open');

document.getElementById('category-form').onsubmit = async (e) => {
  e.preventDefault();
  const id = document.getElementById('form-category-id').value;
  const name = document.getElementById('form-category-name').value;
  const icon = document.getElementById('form-category-icon').value;
  const sort_order = Number(document.getElementById('form-category-sort').value);
  const visible = document.getElementById('form-category-visible').checked;
  
  const payload = { name, icon, sort_order, visible };
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    if (id) {
      const { error } = await sb.from('cb_categories').update(payload).eq('id', Number(id));
      if (error) throw error;
    } else {
      const { error } = await sb.from('cb_categories').insert(payload);
      if (error) throw error;
    }
    document.getElementById('category-form-modal').classList.remove('open');
    await loadMenu();
    renderAdminCategories();
  } catch (err) {
    alert('Saqlashda xatolik yuz berdi: ' + (err.message || err));
  } finally {
    btn.disabled = false;
  }
};

async function toggleCategoryVisibility(id) {
  const c = state.categories.find(x => x.id === id);
  if (!c) return;
  try {
    const { error } = await sb.from('cb_categories').update({ visible: !c.visible }).eq('id', id);
    if (error) throw error;
    await loadMenu();
    renderAdminCategories();
  } catch (err) {
    alert('Xatolik: ' + (err.message || err));
  }
}

async function deleteCategory(id) {
  const c = state.categories.find(x => x.id === id);
  if (!c) return;
  if (!confirm(`"${c.name}" kategoriyasini o'chirsangiz uning ichidagi barcha mahsulotlar ham o'chib ketadi. Tasdiqlaysizmi?`)) return;
  try {
    const { error } = await sb.from('cb_categories').delete().eq('id', id);
    if (error) throw error;
    await loadMenu();
    renderAdminCategories();
  } catch (err) {
    alert('O\'chirishda xatolik: ' + (err.message || err));
  }
}

// --- Admin Orders List ---
document.getElementById('admin-orders-date').onchange = loadAdminOrders;

async function loadAdminOrders() {
  const date = document.getElementById('admin-orders-date').value;
  const { data: orders, error } = await sb.from('cb_orders')
    .select('*')
    .gte('created_at', date + 'T00:00:00')
    .lte('created_at', date + 'T23:59:59.999')
    .order('created_at', { ascending: false });
    
  const tbody = document.getElementById('admin-orders-list');
  if (error) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--accent);text-align:center;">Xatolik: ${error.message}</td></tr>`;
    return;
  }
  
  adminState.orders = orders || [];
  tbody.innerHTML = adminState.orders.map(o => {
    const time = new Date(o.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    return `
      <tr>
        <td><b>#${o.order_number}</b></td>
        <td>${TYPE_LABEL[o.type] || o.type}</td>
        <td>${o.table_number ? 'Stol №' + o.table_number : '—'}</td>
        <td style="color:var(--primary);font-weight:700;">${fmt(o.total)}</td>
        <td>${time}</td>
        <td>
          <button class="btn-action view-order-btn" data-id="${o.id}">👁️ Chek</button>
        </td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--muted)">Ushbu sanada buyurtmalar yo\'q</td></tr>';

  tbody.querySelectorAll('.view-order-btn').forEach(btn => {
    btn.onclick = () => showAdminOrderReceipt(Number(btn.dataset.id));
  });
}

async function showAdminOrderReceipt(orderId) {
  const order = adminState.orders.find(o => o.id === orderId);
  if (!order) return;
  const { data: items, error } = await sb.from('cb_order_items').select('*').eq('order_id', orderId);
  if (error) {
    alert('Chek tafsilotlarini yuklashda xatolik: ' + error.message);
    return;
  }
  const oldCart = state.cart;
  state.cart = items.map(i => ({
    product_id: i.product_id,
    name: i.name,
    price: i.price,
    qty: i.qty
  }));
  const totals = {
    subtotal: order.subtotal,
    service: order.service_charge,
    discount: order.discount,
    total: order.total
  };
  state.viewingHistoricalReceipt = true;
  showReceipt(order, totals);
  state.cart = oldCart;
}

// ---------- Ishga tushirish ----------
loadMenu();
renderCart();
