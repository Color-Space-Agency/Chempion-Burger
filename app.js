// ============================================================
//  Chempion Burger POS — frontend (Supabase, Express'siz)
//  Vercel'da statik sayt; ma'lumot Supabase'da (cb_ prefiksli jadvallar).
// ============================================================

// --- Supabase ulanish ---
const SUPABASE_URL = "https://ddqoktwkffnufczhdads.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkcW9rdHdrZmZudWZjemhkYWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyOTUyODgsImV4cCI6MjA5NTg3MTI4OH0.IL-C7px7_lcmwQxgXhbNlrmy0NAYN6RmQKmiUQpgq-Q";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const state = {
  categories: [], 
  products: [], 
  activeCategory: 'all', 
  cart: [], 
  orderType: 'dine_in',
  paymentMethod: 'naqd',
  inventory: [],
  recipes: [],
  currentUser: null
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

// ---------- Tasdiqlash (Supabase'ga saqlash va zaxirani kamaytirish) ----------
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
      cashier: state.currentUser ? state.currentUser.label : 'Kassir', paid_at: new Date().toISOString(),
      payment_method: state.paymentMethod,
    }).select().single();
    if (error) throw error;

    const items = state.cart.map(i => ({
      order_id: order.id, product_id: i.product_id, name: i.name, price: i.price, qty: i.qty, subtotal: i.price * i.qty,
    }));
    const { error: e2 } = await sb.from('cb_order_items').insert(items);
    if (e2) throw e2;

    // --- Zaxiralarni kamaytirish (Ombordan avtomatik) ---
    try {
      const deductions = {};
      for (const cartItem of state.cart) {
        const prodRecipes = state.recipes.filter(r => r.product_id === cartItem.product_id);
        for (const r of prodRecipes) {
          deductions[r.ingredient_id] = (deductions[r.ingredient_id] || 0) + (r.quantity * cartItem.qty);
        }
      }
      for (const [ingId, qty] of Object.entries(deductions)) {
        await sb.rpc('cb_deduct_inventory', { p_ingredient_id: Number(ingId), p_qty: Number(qty) });
      }
      await loadInventory();
    } catch (deductErr) {
      console.error('Ombordan kamaytirishda xatolik:', deductErr);
    }

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
  const PM_LABEL = { naqd: '💵 Naqd', karta: '💳 Karta' };
  const itemsHtml = state.cart.map(i =>
    `<div class="r-line"><span>${i.name} ×${i.qty}</span><b>${fmt(i.price * i.qty)}</b></div>`).join('');
  document.getElementById('receipt-body').innerHTML = `
    <div class="r-store">
      <img src="logo.png" alt="Chempion Burger" style="height:48px;margin-bottom:0.4rem;">
      <small>Chek: #${order.order_number}</small>
    </div>
    <div class="r-line"><span>Sana</span><span>${now.toLocaleString('uz-UZ')}</span></div>
    <div class="r-line"><span>Turi</span><span>${TYPE_LABEL[order.type]}</span></div>
    ${order.table_number ? `<div class="r-line"><span>Stol</span><span>№${order.table_number}</span></div>` : ''}
    <div class="r-line"><span>To'lov usuli</span><span>${PM_LABEL[order.payment_method] || order.payment_method}</span></div>
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
  state.cart = [];
  document.getElementById('table-number').value = '';
  document.getElementById('service-pct').value = '0';
  document.getElementById('discount-input').value = '0';
  state.paymentMethod = 'naqd';
  document.querySelectorAll('.pm-btn').forEach(x => x.classList.remove('active'));
  document.querySelector('.pm-btn[data-method="naqd"]').classList.add('active');
  renderCart();
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

// ---------- Avtorizatsiya (Login / Logout) ----------
async function handleLogin() {
  const userField = document.getElementById('login-username').value.trim();
  const passField = document.getElementById('login-password').value;
  const errorDiv = document.getElementById('login-error');
  
  errorDiv.style.display = 'none';
  
  if (userField.toLowerCase() === 'sotuvchi' && passField === '123') {
    state.currentUser = { role: 'cashier', label: 'Sotuvchi' };
  } else if (userField.toLowerCase() === 'admin' && passField === 'admin123') {
    state.currentUser = { role: 'admin', label: 'Admin' };
  } else {
    errorDiv.textContent = "Noto'g'ri login yoki parol!";
    errorDiv.style.display = 'block';
    return;
  }
  
  // Login muvaffaqiyatli
  document.getElementById('login-modal').classList.remove('open');
  document.getElementById('user-badge').style.display = 'flex';
  document.getElementById('user-role-label').textContent = state.currentUser.label;
  
  if (state.currentUser.role === 'admin') {
    document.getElementById('open-reports').style.display = 'block';
    document.getElementById('open-warehouse').style.display = 'block';
  } else {
    document.getElementById('open-reports').style.display = 'none';
    document.getElementById('open-warehouse').style.display = 'none';
  }
  
  // Ma'lumotlarni yuklash
  await loadMenu();
  await loadInventory();
  await loadRecipes();
}

function handleLogout() {
  state.currentUser = null;
  state.cart = [];
  renderCart();
  
  // Login oynasini ko'rsatish
  document.getElementById('login-modal').classList.add('open');
  document.getElementById('user-badge').style.display = 'none';
  document.getElementById('open-reports').style.display = 'none';
  document.getElementById('open-warehouse').style.display = 'none';
  
  // maydonlarni tozalash
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').style.display = 'none';
}

// ---------- Ombor Ma'lumotlarini yuklash ----------
async function loadInventory() {
  const { data, error } = await sb.from('cb_inventory').select('*').order('name');
  if (error) console.error('Ombor yuklanmadi:', error);
  state.inventory = data || [];
  renderWarehouseStock();
  populateRecipeSelectors();
}

async function loadRecipes() {
  const { data, error } = await sb.from('cb_recipes').select('*');
  if (error) console.error('Retseptlar yuklanmadi:', error);
  state.recipes = data || [];
  renderRecipeItems();
}

// ---------- Ombor Tab / UI Boshqaruvi ----------
function openWarehouse() {
  document.getElementById('warehouse-modal').classList.add('open');
  switchWarehouseTab('stock');
}

function switchWarehouseTab(tab) {
  document.querySelectorAll('.w-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.w-content').forEach(c => c.classList.remove('active'));
  
  if (tab === 'stock') {
    document.getElementById('w-tab-stock').classList.add('active');
    document.getElementById('w-content-stock').classList.add('active');
    renderWarehouseStock();
  } else if (tab === 'recipes') {
    document.getElementById('w-tab-recipes').classList.add('active');
    document.getElementById('w-content-recipes').classList.add('active');
    populateRecipeSelectors();
    renderRecipeItems();
  }
}

function renderWarehouseStock() {
  const tbody = document.getElementById('warehouse-stock-body');
  if (!tbody) return;
  
  if (state.inventory.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:1rem;">Omborda masalliqlar yo'q</td></tr>`;
    return;
  }
  
  tbody.innerHTML = state.inventory.map(ing => {
    let badgeClass = 'badge-success';
    if (ing.stock <= 0) {
      badgeClass = 'badge-danger';
    } else if (ing.stock <= ing.min_stock) {
      badgeClass = 'badge-warning';
    }
    
    return `
      <tr>
        <td><b>${ing.name}</b></td>
        <td><span class="badge ${badgeClass}">${ing.stock}</span></td>
        <td>${ing.unit}</td>
        <td>
          <button class="btn-inline-edit" onclick="editIngStock(${ing.id})" title="Miqdorni tahrirlash">✏️</button>
          <button class="btn-inline-del" onclick="deleteIngredient(${ing.id})" title="O'chirish">❌</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function editIngStock(id) {
  const ing = state.inventory.find(x => x.id === id);
  if (!ing) return;
  const newVal = prompt(`"${ing.name}" uchun yangi qoldiq miqdorini kiriting (${ing.unit}):`, ing.stock);
  if (newVal === null) return;
  const num = parseFloat(newVal);
  if (isNaN(num)) {
    alert("Miqdor son bo'lishi kerak!");
    return;
  }
  
  const { error } = await sb.from('cb_inventory').update({ stock: num }).eq('id', id);
  if (error) {
    alert("Xatolik yuz berdi: " + error.message);
  } else {
    await loadInventory();
  }
}

async function deleteIngredient(id) {
  const ing = state.inventory.find(x => x.id === id);
  if (!ing) return;
  if (!confirm(`Haqiqatan ham "${ing.name}" masallig'ini o'chirmoqchisiz? Barcha retseptlar bog'lanishi ham o'chib ketadi.`)) return;
  
  const { error } = await sb.from('cb_inventory').delete().eq('id', id);
  if (error) {
    alert("Xatolik yuz berdi: " + error.message);
  } else {
    await loadInventory();
    await loadRecipes();
  }
}

async function addIngredient() {
  const nameInput = document.getElementById('new-ing-name');
  const stockInput = document.getElementById('new-ing-stock');
  const unitInput = document.getElementById('new-ing-unit');
  
  const name = nameInput.value.trim();
  const stock = parseFloat(stockInput.value) || 0;
  const unit = unitInput.value.trim() || 'dona';
  
  if (!name) {
    alert("Masalliq nomini kiriting!");
    return;
  }
  
  const { error } = await sb.from('cb_inventory').insert({ name, stock, unit });
  if (error) {
    alert("Xatolik yuz berdi: " + error.message);
  } else {
    nameInput.value = '';
    stockInput.value = '';
    unitInput.value = 'dona';
    await loadInventory();
  }
}

// ---------- Taom Retseptlari Boshqaruvi ----------
function populateRecipeSelectors() {
  const prodSelect = document.getElementById('recipe-product-select');
  const ingSelect = document.getElementById('recipe-ing-select');
  
  if (prodSelect) {
    const currentVal = prodSelect.value;
    prodSelect.innerHTML = state.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    if (currentVal && state.products.some(p => p.id == currentVal)) {
      prodSelect.value = currentVal;
    }
  }
  
  if (ingSelect) {
    ingSelect.innerHTML = state.inventory.map(i => `<option value="${i.id}">${i.name} (${i.unit})</option>`).join('');
  }
}

function renderRecipeItems() {
  const prodSelect = document.getElementById('recipe-product-select');
  const tbody = document.getElementById('recipe-items-body');
  if (!prodSelect || !tbody) return;
  
  const productId = Number(prodSelect.value);
  if (!productId) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:1rem;">Mahsulot tanlanmagan</td></tr>`;
    return;
  }
  
  const prodRecipes = state.recipes.filter(r => r.product_id === productId);
  if (prodRecipes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:1rem;">Ushbu taom uchun tarkib kiritilmagan</td></tr>`;
    return;
  }
  
  tbody.innerHTML = prodRecipes.map(r => {
    const ing = state.inventory.find(i => i.id === r.ingredient_id);
    const ingName = ing ? ing.name : 'Noma\'lum';
    const ingUnit = ing ? ing.unit : '';
    
    return `
      <tr>
        <td><b>${ingName}</b></td>
        <td>${r.quantity}</td>
        <td>${ingUnit}</td>
        <td>
          <button class="btn-inline-del" onclick="deleteRecipeItem(${r.id})" title="Tarkibdan o'chirish">❌</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function saveRecipeItem() {
  const prodSelect = document.getElementById('recipe-product-select');
  const ingSelect = document.getElementById('recipe-ing-select');
  const qtyInput = document.getElementById('recipe-ing-qty');
  
  const productId = Number(prodSelect.value);
  const ingredientId = Number(ingSelect.value);
  const qty = parseFloat(qtyInput.value);
  
  if (!productId || !ingredientId || isNaN(qty) || qty <= 0) {
    alert("Iltimos, masalliq va to'g'ri miqdorni kiriting!");
    return;
  }
  
  const { error } = await sb.from('cb_recipes').upsert({
    product_id: productId,
    ingredient_id: ingredientId,
    quantity: qty
  }, { onConflict: 'product_id,ingredient_id' });
  
  if (error) {
    alert("Xatolik yuz berdi: " + error.message);
  } else {
    qtyInput.value = '';
    await loadRecipes();
  }
}

async function deleteRecipeItem(id) {
  if (!confirm("Ushbu masalliqni taom tarkibidan o'chirmoqchisiz?")) return;
  const { error } = await sb.from('cb_recipes').delete().eq('id', id);
  if (error) {
    alert("Xatolik yuz berdi: " + error.message);
  } else {
    await loadRecipes();
  }
}

// Global qilish (HTML onClick uchun)
window.editIngStock = editIngStock;
window.deleteIngredient = deleteIngredient;
window.deleteRecipeItem = deleteRecipeItem;

// --- Hodisa bog'lamalari ---
document.getElementById('btn-login').onclick = handleLogin;
document.getElementById('btn-logout').onclick = handleLogout;

document.getElementById('payment-methods').onclick = e => {
  const b = e.target.closest('.pm-btn'); if (!b) return;
  document.querySelectorAll('.pm-btn').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  state.paymentMethod = b.dataset.method;
};

document.getElementById('open-warehouse').onclick = openWarehouse;
document.getElementById('warehouse-close').onclick = () => document.getElementById('warehouse-modal').classList.remove('open');
document.getElementById('w-tab-stock').onclick = () => switchWarehouseTab('stock');
document.getElementById('w-tab-recipes').onclick = () => switchWarehouseTab('recipes');
document.getElementById('btn-add-ingredient').onclick = addIngredient;
document.getElementById('recipe-product-select').onchange = renderRecipeItems;
document.getElementById('btn-save-recipe-item').onclick = saveRecipeItem;

// ---------- Ishga tushirish ----------
renderCart();
