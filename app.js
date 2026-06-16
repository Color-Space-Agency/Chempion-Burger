// ============================================================
//  Chempion Burger POS — frontend (Supabase + Offline Demo Fallback)
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
  currentUser: null,
  isDemoMode: false,
  customers: [],
  selectedCustomer: null,
  menuLayout: 'grid-top'
};

const fmt = n => Math.round(n || 0).toLocaleString('uz-UZ') + " so'm";
const TYPE_LABEL = { dine_in: 'Zal', takeout: 'Olib ketish', delivery: 'Yetkazib berish' };

function genOrderNumber() {
  const d = new Date(); const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// ---------- Offline Demo rejimini yoqish ----------
function enableDemoMode() {
  state.isDemoMode = true;
  console.warn("Offline Demo rejimi yoqildi (Supabase jadvallari topilmadi).");
  
  // Demo ogohlantirish bannerini qo'shish o'chirildi

  
  // Kategoriyalarni localStorage'ga to'ldirish
  if (!localStorage.getItem('cb_categories')) {
    const defaultCategories = [
      { id: 1, name: "Burgerlar", icon: "🍔", sort_order: 1 },
      { id: 2, name: "Hot-doglar", icon: "🌭", sort_order: 2 },
      { id: 3, name: "Non kaboblar", icon: "🌯", sort_order: 3 },
      { id: 4, name: "Setlar", icon: "🍟", sort_order: 4 },
      { id: 5, name: "Ichimliklar", icon: "🥤", sort_order: 5 },
      { id: 6, name: "Souslar", icon: "🥫", sort_order: 6 }
    ];
    localStorage.setItem('cb_categories', JSON.stringify(defaultCategories));
  }
  
  // Mahsulotlarni localStorage'ga to'ldirish (Flyer va menyu asosida)
  if (!localStorage.getItem('cb_products')) {
    const defaultProducts = [
      { id: 1, category_id: 1, name: 'Ghamburger', price: 33000, description: 'Bulochka, kotlet, svejiy bodring, pamidor, sho\'r bodring, salat barg, firmenniy sous, qizil piyoz' },
      { id: 2, category_id: 1, name: 'Cheeseburger', price: 35000, description: 'Bulochka, kotlet, svejiy bodring, pamidor, sho\'r bodring, salat barg, firmenniy sous, qizil piyoz, sir' },
      { id: 3, category_id: 1, name: 'Bigburger', price: 50000, description: 'Bulochka, kotlet 2ta, svejiy bodring, pamidor, sho\'r bodring, salat barg, firmenniy sous, qizil piyoz' },
      { id: 4, category_id: 1, name: 'Bigburger Sirli', price: 53000, description: 'Bulochka, kotlet 2ta, svejiy bodring, pamidor, sho\'r bodring, salat barg, firmenniy sous, qizil piyoz, sir' },
      { id: 5, category_id: 1, name: 'KFC Burger', price: 25000, description: 'Bulochka, KFC, svejiy bodring, pamidor, sho\'r bodring, salat barg, firmenniy sous' },
      { id: 6, category_id: 3, name: 'Non Kabob', price: 42000, description: 'Qiyma kabob 2ta, non, piyoz, pamidor, firmenniy sous' },
      { id: 7, category_id: 3, name: 'Non Chicken KFC', price: 30000, description: 'Tovuq, non, svejiy bodring, chisnochniy sous' },
      { id: 8, category_id: 3, name: 'Non Donar', price: 42000, description: 'Donar go\'sht, non, svejiy bodring, chisnochniy sous' },
      { id: 9, category_id: 2, name: 'Hot Dog Canadskiy', price: 12000, description: 'Bulochka, sosiska, bodring, pamidor, ketchup, mayonez' },
      { id: 10, category_id: 2, name: 'Hot Dog Canadskiy 2X', price: 16000, description: 'Bulochka, sosiska 2ta, bodring, pamidor, ketchup, mayonez, chips' },
      { id: 11, category_id: 2, name: 'Hot Dog Oddiy', price: 10000, description: 'Bulochka, sosiska, sabzi salat, ketchup, mayonez' },
      { id: 12, category_id: 2, name: 'Hot Dog Oddiy 2X', price: 13000, description: 'Bulochka, sosiska 2ta, sabzi salat, ketchup, mayonez' },
      { id: 13, category_id: 2, name: 'Go\'shtli Hot-Dog', price: 25000, description: 'Bulochka, go\'sht (donar), bodring, pamidor, firmenniy sous, mayonez, chips' },
      { id: 14, category_id: 2, name: 'Big Hot-Dog', price: 42000, description: 'Bulochka katta, kotlet 1.5ta, sosiska 2ta, bodring, pamidor, firmenniy sous, mayonez, indeyka' },
      { id: 15, category_id: 2, name: 'Kabob Hot-Dog', price: 45000, description: 'Bulochka, qiyma, piyoz, firmenniy sous, indeyka' },
      { id: 16, category_id: 2, name: 'Longer', price: 22000, description: 'Bulochka, KFC (grudka), bodring, pamidor, ketchup, mayonez, salat barg' },
      { id: 17, category_id: 4, name: 'Set 1', price: 45000, description: 'Ghamburger, fri, Pepsi 0.5l' },
      { id: 18, category_id: 4, name: 'Set 2', price: 60000, description: 'Non Kabob, fri, Pepsi 0.5l' },
      { id: 19, category_id: 4, name: 'Set 3', price: 42000, description: 'Go\'shtli hot dog, fri, Pepsi 0.5l' },
      { id: 20, category_id: 4, name: 'Set 4', price: 43000, description: 'KFC Burger, fri, Pepsi 0.5l' },
      { id: 21, category_id: 5, name: 'Pepsi 0.5l', price: 8000, description: '' },
      { id: 22, category_id: 5, name: 'Coca-Cola 0.5l', price: 8000, description: '' },
      { id: 23, category_id: 5, name: 'Fanta 0.5l', price: 8000, description: '' },
      { id: 24, category_id: 5, name: 'Suv 0.5l', price: 4000, description: '' },
      { id: 25, category_id: 5, name: 'Fri kartoshka 110g', price: 15000, description: '' },
      { id: 26, category_id: 6, name: 'Ketchup', price: 2000, description: '' },
      { id: 27, category_id: 6, name: 'Mayonez', price: 2000, description: '' }
    ];
    localStorage.setItem('cb_products', JSON.stringify(defaultProducts));
  }
  
  // Ombor masalliqlari
  if (!localStorage.getItem('cb_inventory')) {
    const defaultInventory = [
      { id: 1, name: 'Bulochka (burger)', stock: 100, unit: 'dona', min_stock: 20 },
      { id: 2, name: 'Kotlet (burger)', stock: 150, unit: 'dona', min_stock: 25 },
      { id: 3, name: 'Bulochka (hot-dog)', stock: 100, unit: 'dona', min_stock: 20 },
      { id: 4, name: 'Sosiska', stock: 100, unit: 'dona', min_stock: 20 },
      { id: 5, name: 'Non (kabob)', stock: 80, unit: 'dona', min_stock: 15 },
      { id: 6, name: 'Tovuq (KFC)', stock: 10, unit: 'kg', min_stock: 2 },
      { id: 7, name: 'Go\'sht (donar)', stock: 12, unit: 'kg', min_stock: 3 },
      { id: 8, name: 'Fri (kartoshka)', stock: 15, unit: 'kg', min_stock: 3 },
      { id: 9, name: 'Pepsi 0.5l', stock: 120, unit: 'dona', min_stock: 20 },
      { id: 10, name: 'Ketchup', stock: 3000, unit: 'g', min_stock: 500 },
      { id: 11, name: 'Mayonez', stock: 3000, unit: 'g', min_stock: 500 },
      { id: 12, name: 'Sabzi salat', stock: 5, unit: 'kg', min_stock: 1 },
      { id: 13, name: 'Pishloq (sir)', stock: 100, unit: 'dona', min_stock: 20 }
    ];
    localStorage.setItem('cb_inventory', JSON.stringify(defaultInventory));
  }
  
  // Retseptlar
  if (!localStorage.getItem('cb_recipes')) {
    const defaultRecipes = [
      { id: 1, product_id: 1, ingredient_id: 1, quantity: 1 },
      { id: 2, product_id: 1, ingredient_id: 2, quantity: 1 },
      { id: 3, product_id: 1, ingredient_id: 10, quantity: 10 },
      { id: 4, product_id: 1, ingredient_id: 11, quantity: 10 },
      { id: 5, product_id: 2, ingredient_id: 1, quantity: 1 },
      { id: 6, product_id: 2, ingredient_id: 2, quantity: 1 },
      { id: 7, product_id: 2, ingredient_id: 13, quantity: 1 },
      { id: 8, product_id: 2, ingredient_id: 10, quantity: 10 },
      { id: 9, product_id: 2, ingredient_id: 11, quantity: 10 }
    ];
    localStorage.setItem('cb_recipes', JSON.stringify(defaultRecipes));
  }
  
  if (!localStorage.getItem('cb_orders')) {
    localStorage.setItem('cb_orders', JSON.stringify([]));
  }
  if (!localStorage.getItem('cb_order_items')) {
    localStorage.setItem('cb_order_items', JSON.stringify([]));
  }
  if (!localStorage.getItem('cb_customers')) {
    localStorage.setItem('cb_customers', JSON.stringify([]));
  }
  
  // State-ni to'ldirish
  state.categories = JSON.parse(localStorage.getItem('cb_categories')) || [];
  const localProds = JSON.parse(localStorage.getItem('cb_products')) || [];
  state.products = localProds.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id);
  state.inventory = JSON.parse(localStorage.getItem('cb_inventory')) || [];
  state.recipes = JSON.parse(localStorage.getItem('cb_recipes')) || [];
  state.customers = JSON.parse(localStorage.getItem('cb_customers')) || [];
  
  renderCategories(); renderProducts();
}

// ---------- Menyuni yuklash ----------
async function loadMenu() {
  try {
    const [{ data: categories, error: e1 }, { data: products, error: e2 }] = await Promise.all([
      sb.from('cb_categories').select('*').eq('visible', true).order('sort_order'),
      sb.from('cb_products').select('*').eq('available', true).order('sort_order').order('id'),
    ]);
    if (e1 || e2) {
      console.warn('Supabase jadvallari topilmadi, Offline Demo rejim ishga tushmoqda...', e1 || e2);
      enableDemoMode();
      return;
    }
    state.categories = categories || [];
    state.products = products || [];
    state.isDemoMode = false;
    
    // Demo bannerni yashirish
    const banner = document.getElementById('demo-banner');
    if (banner) banner.remove();
    
    renderCategories(); renderProducts();
  } catch (err) {
    console.warn('Ulanish xatosi, Offline Demo rejim ishga tushmoqda...', err);
    enableDemoMode();
  }
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
  grid.innerHTML = list.map(p => {
    const imgHtml = p.image_url ? `<div class="p-img"><img src="${p.image_url}" alt="${p.name}"></div>` : '';
    const descHtml = p.description 
      ? p.description.includes(',')
        ? p.description.split(',').map(item => `• ${item.trim()}`).join('<br>')
        : p.description
      : '';
    return `
      <div class="product-card" data-id="${p.id}">
        <div class="drag-handle" title="Tartibni o'zgartirish">☰</div>
        ${imgHtml}
        <div class="p-name">${p.name}</div>
        <div class="p-desc">${descHtml}</div>
        <div class="p-price">${fmt(p.price)}</div>
      </div>`;
  }).join('') || `<div style="color:var(--muted);padding:2rem;">Bu bo'limda mahsulot yo'q.</div>`;
  
  setupDragAndDrop();
  
  grid.querySelectorAll('.product-card').forEach(card => {
    card.onclick = (e) => {
      if (e.target.classList.contains('drag-handle')) {
        return;
      }
      addToCart(Number(card.dataset.id));
    };
  });
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
  
  let bonusDiscount = 0;
  if (state.selectedCustomer) {
    const isBonusOrder = (state.selectedCustomer.purchase_count + 1) % 5 === 0;
    if (isBonusOrder && state.cart.length > 0) {
      // Find the cheapest item in the cart (applies to 1 qty of it)
      let cheapest = state.cart[0];
      for (const item of state.cart) {
        if (item.price < cheapest.price) {
          cheapest = item;
        }
      }
      bonusDiscount = cheapest.price;
    }
  }
  
  const pct = parseFloat(document.getElementById('service-pct').value) || 0;
  const service = Math.round((subtotal - bonusDiscount) * pct / 100);
  const discountInput = parseFloat(document.getElementById('discount-input').value) || 0;
  const discount = discountInput + bonusDiscount;
  const total = Math.max(0, subtotal + service - discount);
  return { subtotal, service, discount, total, bonusDiscount };
}
function updateSummary() {
  const t = calcTotals();
  document.getElementById('sum-subtotal').textContent = fmt(t.subtotal);
  document.getElementById('sum-service').textContent = fmt(t.service);
  if (t.bonusDiscount > 0) {
    document.getElementById('sum-discount').textContent = `${fmt(t.discount - t.bonusDiscount)} + ${fmt(t.bonusDiscount)} (Bonus)`;
  } else {
    document.getElementById('sum-discount').textContent = fmt(t.discount);
  }
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

// ---------- Tasdiqlash (Zaxirani kamaytirish va saqlash) ----------
document.getElementById('btn-confirm').onclick = async () => {
  if (state.cart.length === 0) return;
  const btn = document.getElementById('btn-confirm');
  btn.disabled = true; const orig = btn.textContent; btn.textContent = 'Saqlanmoqda...';
  
  // --- OFFLINE DEMO REJIMIDA CHECKOUT ---
  if (state.isDemoMode) {
    try {
      const t = calcTotals();
      const orderNumber = genOrderNumber();
      
      const orders = JSON.parse(localStorage.getItem('cb_orders')) || [];
      const newOrder = {
        id: Date.now(),
        order_number: orderNumber,
        type: state.orderType,
        table_number: state.orderType === 'dine_in' ? (document.getElementById('table-number').value || null) : null,
        status: 'paid',
        subtotal: t.subtotal, service_charge: t.service, discount: t.discount, total: t.total,
        cashier: state.currentUser ? state.currentUser.label : 'Kassir',
        payment_method: state.paymentMethod,
        customer_id: state.selectedCustomer ? state.selectedCustomer.id : null,
        created_at: new Date().toISOString(),
        paid_at: new Date().toISOString()
      };
      orders.push(newOrder);
      localStorage.setItem('cb_orders', JSON.stringify(orders));
      
      const orderItems = JSON.parse(localStorage.getItem('cb_order_items')) || [];
      state.cart.forEach(i => {
        orderItems.push({
          id: Date.now() + Math.random(),
          order_id: newOrder.id,
          product_id: i.product_id,
          name: i.name,
          price: i.price,
          qty: i.qty,
          subtotal: i.price * i.qty
        });
      });
      localStorage.setItem('cb_order_items', JSON.stringify(orderItems));
      
      // localstorage zaxirasini kamaytirish
      const inv = JSON.parse(localStorage.getItem('cb_inventory')) || [];
      state.cart.forEach(cartItem => {
        const prodRecipes = state.recipes.filter(r => r.product_id === cartItem.product_id);
        prodRecipes.forEach(r => {
          const ing = inv.find(x => x.id === r.ingredient_id);
          if (ing) {
            ing.stock = Math.max(0, parseFloat((ing.stock - (r.quantity * cartItem.qty)).toFixed(2)));
          }
        });
      });
      localStorage.setItem('cb_inventory', JSON.stringify(inv));
      state.inventory = inv;
      renderWarehouseStock();
      
      // localstorage mijoz xaridlarini yangilash
      if (state.selectedCustomer) {
        const custs = JSON.parse(localStorage.getItem('cb_customers')) || [];
        const c = custs.find(x => x.id === state.selectedCustomer.id);
        if (c) {
          c.purchase_count++;
          localStorage.setItem('cb_customers', JSON.stringify(custs));
        }
        state.selectedCustomer.purchase_count++;
        await loadCustomers();
      }
      
      showReceipt(newOrder, t);
    } catch (e) {
      alert("Xatolik: " + e.message);
    } finally {
      btn.textContent = orig; btn.disabled = state.cart.length === 0;
    }
    return;
  }
  
  // --- NORMAL SUPABASE REJIMIDA CHECKOUT ---
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
      customer_id: state.selectedCustomer ? state.selectedCustomer.id : null
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

    // Mijoz xaridlarini yangilash
    if (state.selectedCustomer) {
      const { error: custErr } = await sb.from('cb_customers').update({
        purchase_count: state.selectedCustomer.purchase_count + 1
      }).eq('id', state.selectedCustomer.id);
      if (custErr) console.error('Mijoz xaridlarini yangilashda xato:', custErr);
      await loadCustomers();
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
  let customerHtml = '';
  if (state.selectedCustomer) {
    customerHtml = `<div class="r-line"><span>Mijoz</span><span>${state.selectedCustomer.name}</span></div>`;
  }
  document.getElementById('receipt-body').innerHTML = `
    <div class="r-store">
      <img src="logo.png" alt="Chempion Burger" style="height:48px;margin-bottom:0.4rem;">
      <small>Chek: #${order.order_number}</small>
    </div>
    <div class="r-line"><span>Sana</span><span>${now.toLocaleString('uz-UZ')}</span></div>
    <div class="r-line"><span>Turi</span><span>${TYPE_LABEL[order.type]}</span></div>
    ${order.table_number ? `<div class="r-line"><span>Stol</span><span>№${order.table_number}</span></div>` : ''}
    ${customerHtml}
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
  state.selectedCustomer = null;
  updateSelectedCustomerUI();
  renderCart();
};

// ---------- Modallarni Yopish Helper ----------
function closeAllModals() {
  const modals = ['dashboard-modal', 'reports-modal', 'warehouse-modal', 'customers-modal', 'menu-edit-modal', 'receipt-modal'];
  modals.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  });
}

// ---------- Hisobot ----------
const reportDate = document.getElementById('report-date');
document.getElementById('open-reports').onclick = () => {
  closeAllModals();
  reportDate.value = new Date().toISOString().slice(0, 10);
  loadReport();
  document.getElementById('reports-modal').classList.add('open');
};
document.getElementById('reports-close').onclick = () => document.getElementById('reports-modal').classList.remove('open');
reportDate.onchange = loadReport;

async function loadReport() {
  const date = reportDate.value;
  const body = document.getElementById('report-body');
  let list = [];
  
  if (state.isDemoMode) {
    const orders = JSON.parse(localStorage.getItem('cb_orders')) || [];
    list = orders.filter(o => o.status === 'paid' && o.created_at && o.created_at.slice(0, 10) === date);
  } else {
    const { data: orders, error } = await sb.from('cb_orders').select('*')
      .eq('status', 'paid')
      .gte('created_at', date + 'T00:00:00+05:00')
      .lte('created_at', date + 'T23:59:59.999+05:00');
    if (error) { body.innerHTML = `<div style="color:#e23b2e">Hisobot xatosi: ${error.message}</div>`; return; }
    list = orders || [];
  }

  const revenue = list.reduce((s, o) => s + Number(o.total || 0), 0);
  const service = list.reduce((s, o) => s + Number(o.service_charge || 0), 0);
  const discount = list.reduce((s, o) => s + Number(o.discount || 0), 0);

  // Turlar bo'yicha
  const byType = {};
  list.forEach(o => { byType[o.type] = byType[o.type] || { count: 0, sum: 0 }; byType[o.type].count++; byType[o.type].sum += Number(o.total || 0); });
  const typesHtml = Object.keys(byType).map(k => `<div class="rrow"><span>${TYPE_LABEL[k] || k}</span><span>${byType[k].count} ta · ${fmt(byType[k].sum)}</span></div>`).join('') || `<div class="rrow"><span>—</span></div>`;

  // Eng ko'p sotilgan
  let topHtml = `<div class="rrow"><span>Sotuv yo'q</span></div>`;
  const ids = list.map(o => o.id);
  if (ids.length) {
    let items = [];
    if (state.isDemoMode) {
      const allItems = JSON.parse(localStorage.getItem('cb_order_items')) || [];
      items = allItems.filter(it => ids.includes(it.order_id));
    } else {
      const { data } = await sb.from('cb_order_items').select('name, qty, subtotal').in('order_id', ids);
      items = data || [];
    }
    
    const agg = {};
    items.forEach(it => { agg[it.name] = agg[it.name] || { qty: 0, rev: 0 }; agg[it.name].qty += Number(it.qty || 0); agg[it.name].rev += Number(it.subtotal || 0); });
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
  
  document.getElementById('open-customers').style.display = 'block';
  if (state.currentUser.role === 'admin') {
    document.getElementById('open-dashboard').style.display = 'block';
    document.getElementById('open-reports').style.display = 'block';
    document.getElementById('open-warehouse').style.display = 'block';
    document.getElementById('open-menu-edit').style.display = 'block';
  } else {
    document.getElementById('open-dashboard').style.display = 'none';
    document.getElementById('open-reports').style.display = 'none';
    document.getElementById('open-warehouse').style.display = 'none';
    document.getElementById('open-menu-edit').style.display = 'none';
  }
  
  // Ma'lumotlarni yuklash
  await loadMenu();
  await loadInventory();
  await loadRecipes();
  await loadCustomers();
}

function handleLogout() {
  closeAllModals();
  state.currentUser = null;
  state.cart = [];
  renderCart();
  
  // Login oynasini ko'rsatish
  document.getElementById('login-modal').classList.add('open');
  document.getElementById('user-badge').style.display = 'none';
  document.getElementById('open-dashboard').style.display = 'none';
  document.getElementById('open-reports').style.display = 'none';
  document.getElementById('open-warehouse').style.display = 'none';
  document.getElementById('open-customers').style.display = 'none';
  document.getElementById('open-menu-edit').style.display = 'none';
  state.selectedCustomer = null;
  updateSelectedCustomerUI();
  
  // maydonlarni tozalash
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').style.display = 'none';
}

// ---------- Ombor Ma'lumotlarini yuklash ----------
async function loadInventory() {
  if (state.isDemoMode) {
    state.inventory = JSON.parse(localStorage.getItem('cb_inventory')) || [];
    renderWarehouseStock();
    populateRecipeSelectors();
    return;
  }
  const { data, error } = await sb.from('cb_inventory').select('*').order('name');
  if (error) console.error('Ombor yuklanmadi:', error);
  state.inventory = data || [];
  renderWarehouseStock();
  populateRecipeSelectors();
}

async function loadRecipes() {
  if (state.isDemoMode) {
    state.recipes = JSON.parse(localStorage.getItem('cb_recipes')) || [];
    renderRecipeItems();
    return;
  }
  const { data, error } = await sb.from('cb_recipes').select('*');
  if (error) console.error('Retseptlar yuklanmadi:', error);
  state.recipes = data || [];
  renderRecipeItems();
}

// ---------- Ombor Tab / UI Boshqaruvi ----------
function openWarehouse() {
  closeAllModals();
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
  
  if (state.isDemoMode) {
    const inv = JSON.parse(localStorage.getItem('cb_inventory')) || [];
    const item = inv.find(x => x.id === id);
    if (item) {
      item.stock = num;
      localStorage.setItem('cb_inventory', JSON.stringify(inv));
    }
    await loadInventory();
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
  
  if (state.isDemoMode) {
    let inv = JSON.parse(localStorage.getItem('cb_inventory')) || [];
    inv = inv.filter(x => x.id !== id);
    localStorage.setItem('cb_inventory', JSON.stringify(inv));
    
    let rec = JSON.parse(localStorage.getItem('cb_recipes')) || [];
    rec = rec.filter(x => x.ingredient_id !== id);
    localStorage.setItem('cb_recipes', JSON.stringify(rec));
    
    await loadInventory();
    await loadRecipes();
    return;
  }
  
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
  
  if (state.isDemoMode) {
    const inv = JSON.parse(localStorage.getItem('cb_inventory')) || [];
    inv.push({ id: Date.now(), name, stock, unit, min_stock: 5 });
    localStorage.setItem('cb_inventory', JSON.stringify(inv));
    
    nameInput.value = '';
    stockInput.value = '';
    unitInput.value = 'dona';
    await loadInventory();
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
  
  if (state.isDemoMode) {
    const rec = JSON.parse(localStorage.getItem('cb_recipes')) || [];
    const existing = rec.find(r => r.product_id === productId && r.ingredient_id === ingredientId);
    if (existing) {
      existing.quantity = qty;
    } else {
      rec.push({ id: Date.now(), product_id: productId, ingredient_id: ingredientId, quantity: qty });
    }
    localStorage.setItem('cb_recipes', JSON.stringify(rec));
    qtyInput.value = '';
    await loadRecipes();
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
  
  if (state.isDemoMode) {
    let rec = JSON.parse(localStorage.getItem('cb_recipes')) || [];
    rec = rec.filter(x => x.id !== id);
    localStorage.setItem('cb_recipes', JSON.stringify(rec));
    await loadRecipes();
    return;
  }
  
  const { error } = await sb.from('cb_recipes').delete().eq('id', id);
  if (error) {
    alert("Xatolik yuz berdi: " + error.message);
  } else {
    await loadRecipes();
  }
}

// ---------- Mijozlar Baza Kodlari ----------
async function loadCustomers() {
  if (state.isDemoMode) {
    state.customers = JSON.parse(localStorage.getItem('cb_customers')) || [];
    renderCustomersList();
    return;
  }
  try {
    const { data, error } = await sb.from('cb_customers').select('*').order('name');
    if (error) throw error;
    state.customers = data || [];
    renderCustomersList();
  } catch (err) {
    console.error('Mijozlar yuklanmadi:', err);
    state.customers = JSON.parse(localStorage.getItem('cb_customers') || '[]');
    renderCustomersList();
  }
}

function renderCustomersList() {
  const tbody = document.getElementById('customers-list-body');
  if (!tbody) return;
  
  const searchVal = document.getElementById('search-cust-input').value.trim().toLowerCase();
  
  let list = state.customers;
  if (searchVal) {
    list = list.filter(c => c.name.toLowerCase().includes(searchVal) || c.phone.includes(searchVal));
  }
  
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:1rem;">Mijozlar topilmadi</td></tr>`;
    return;
  }
  
  tbody.innerHTML = list.map(c => `
    <tr>
      <td><b>${c.name}</b></td>
      <td>${c.phone}</td>
      <td><span class="badge badge-success">${c.purchase_count} ta xarid</span></td>
      <td>
        <button class="btn-inline-edit" onclick="selectCustForOrder(${c.id})" style="color:var(--green)">✅ Tanlash</button>
        <button class="btn-inline-del" onclick="deleteCustomer(${c.id})">❌</button>
      </td>
    </tr>
  `).join('');
}

function selectCustForOrder(id) {
  const c = state.customers.find(x => x.id === id);
  if (c) {
    state.selectedCustomer = c;
    updateSelectedCustomerUI();
    document.getElementById('customers-modal').classList.remove('open');
  }
}

async function addCustomer() {
  const nameInput = document.getElementById('new-cust-name');
  const phoneInput = document.getElementById('new-cust-phone');
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  
  if (!name || !phone) {
    alert("Iltimos, ismi va telefon raqamini to'liq kiriting!");
    return;
  }
  
  if (state.isDemoMode) {
    const custs = JSON.parse(localStorage.getItem('cb_customers')) || [];
    const exists = custs.some(c => c.phone === phone);
    if (exists) {
      alert("Ushbu telefon raqamli mijoz allaqachon mavjud!");
      return;
    }
    const newCust = { id: Date.now(), name, phone, purchase_count: 0, created_at: new Date().toISOString() };
    custs.push(newCust);
    localStorage.setItem('cb_customers', JSON.stringify(custs));
    
    nameInput.value = '';
    phoneInput.value = '';
    await loadCustomers();
    return;
  }
  
  try {
    const { error } = await sb.from('cb_customers').insert({ name, phone });
    if (error) {
      if (error.code === '23505') {
        alert("Ushbu telefon raqamli mijoz allaqachon mavjud!");
      } else {
        throw error;
      }
    } else {
      nameInput.value = '';
      phoneInput.value = '';
      await loadCustomers();
    }
  } catch (err) {
    alert("Xatolik yuz berdi: " + err.message);
  }
}

async function deleteCustomer(id) {
  if (!confirm("Haqiqatan ham ushbu mijozni o'chirmoqchisiz?")) return;
  
  if (state.isDemoMode) {
    let custs = JSON.parse(localStorage.getItem('cb_customers')) || [];
    custs = custs.filter(x => x.id !== id);
    localStorage.setItem('cb_customers', JSON.stringify(custs));
    
    if (state.selectedCustomer && state.selectedCustomer.id === id) {
      state.selectedCustomer = null;
      updateSelectedCustomerUI();
    }
    await loadCustomers();
    return;
  }
  
  try {
    const { error } = await sb.from('cb_customers').delete().eq('id', id);
    if (error) throw error;
    
    if (state.selectedCustomer && state.selectedCustomer.id === id) {
      state.selectedCustomer = null;
      updateSelectedCustomerUI();
    }
    await loadCustomers();
  } catch (err) {
    alert("O'chirishda xatolik: " + err.message);
  }
}

function updateSelectedCustomerUI() {
  const badge = document.getElementById('selected-customer-badge');
  const nameSpan = document.getElementById('selected-customer-name');
  const searchInput = document.getElementById('cart-customer-search');
  const bonusAlert = document.getElementById('loyalty-bonus-alert');

  if (state.selectedCustomer) {
    badge.style.display = 'flex';
    nameSpan.textContent = `${state.selectedCustomer.name} (${state.selectedCustomer.phone}) [Xaridlar: ${state.selectedCustomer.purchase_count}]`;
    searchInput.style.display = 'none';
    
    const isBonusOrder = (state.selectedCustomer.purchase_count + 1) % 5 === 0;
    if (isBonusOrder && state.cart.length > 0) {
      bonusAlert.style.display = 'block';
    } else {
      bonusAlert.style.display = 'none';
    }
  } else {
    badge.style.display = 'none';
    searchInput.style.display = 'block';
    searchInput.value = '';
    bonusAlert.style.display = 'none';
  }
  updateSummary();
}

// ---------- Menyu Tahrirlash Kodlari ----------
function switchMenuEditTab(tab) {
  document.querySelectorAll('#menu-edit-modal .w-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#menu-edit-modal .w-content').forEach(c => c.classList.remove('active'));
  
  if (tab === 'products') {
    document.getElementById('me-tab-products').classList.add('active');
    document.getElementById('me-content-products').classList.add('active');
    renderMenuProductsTable();
  } else if (tab === 'categories') {
    document.getElementById('me-tab-categories').classList.add('active');
    document.getElementById('me-content-categories').classList.add('active');
    renderMenuCategoriesTable();
  }
}

function populateMenuEditCategories() {
  const catSelect = document.getElementById('new-prod-cat');
  if (catSelect) {
    catSelect.innerHTML = state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
}

function renderMenuProductsTable() {
  const tbody = document.getElementById('menu-products-body');
  if (!tbody) return;
  
  if (state.products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:1rem;">Mahsulotlar yo'q</td></tr>`;
    return;
  }
  
  tbody.innerHTML = state.products.map(p => {
    const cat = state.categories.find(c => c.id === p.category_id);
    const catName = cat ? cat.name : '—';
    const imgHtml = p.image_url ? `<img src="${p.image_url}" class="img-in-table">` : `<div style="text-align:center; font-size:1.2rem;">🍔</div>`;
    
    return `
      <tr>
        <td>${imgHtml}</td>
        <td><b>${p.name}</b></td>
        <td>${catName}</td>
        <td>${fmt(p.price)}</td>
        <td>
          <button class="btn-inline-edit" onclick="editProduct(${p.id})">✏️</button>
          <button class="btn-inline-del" onclick="deleteProduct(${p.id})">❌</button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderMenuCategoriesTable() {
  const tbody = document.getElementById('menu-categories-body');
  if (!tbody) return;
  
  if (state.categories.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:1rem;">Kategoriyalar yo'q</td></tr>`;
    return;
  }
  
  tbody.innerHTML = state.categories.map(c => `
    <tr>
      <td style="font-size:1.3rem; text-align:center;">${c.icon || ''}</td>
      <td><b>${c.name}</b></td>
      <td>${c.sort_order}</td>
      <td>
        <button class="btn-inline-del" onclick="deleteCategory(${c.id})">❌</button>
      </td>
    </tr>
  `).join('');
}

let currentBase64Image = "";

function setupImageHandlers() {
  const imgFileInput = document.getElementById('new-prod-imgfile');
  const imgUrlInput = document.getElementById('new-prod-imgurl');
  const imgPreviewBox = document.getElementById('new-prod-img-preview');
  const previewImg = document.getElementById('prod-preview-img');
  const removePreviewBtn = document.getElementById('btn-remove-preview-img');

  if (!imgFileInput) return;

  imgFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        currentBase64Image = canvas.toDataURL('image/jpeg', 0.75);
        previewImg.src = currentBase64Image;
        imgPreviewBox.style.display = 'block';
        imgUrlInput.value = '';
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  imgUrlInput.addEventListener('input', () => {
    const val = imgUrlInput.value.trim();
    if (val) {
      currentBase64Image = val;
      previewImg.src = val;
      imgPreviewBox.style.display = 'block';
      imgFileInput.value = '';
    } else {
      currentBase64Image = '';
      imgPreviewBox.style.display = 'none';
    }
  });

  removePreviewBtn.onclick = () => {
    currentBase64Image = "";
    previewImg.src = "";
    imgPreviewBox.style.display = 'none';
    imgFileInput.value = '';
    imgUrlInput.value = '';
  };
}

async function saveProduct() {
  const editIdField = document.getElementById('edit-prod-id');
  const catSelect = document.getElementById('new-prod-cat');
  const nameInput = document.getElementById('new-prod-name');
  const priceInput = document.getElementById('new-prod-price');
  const descInput = document.getElementById('new-prod-desc');
  
  const categoryId = Number(catSelect.value);
  const name = nameInput.value.trim();
  const price = parseFloat(priceInput.value) || 0;
  const description = descInput.value.trim();
  const editId = editIdField.value ? Number(editIdField.value) : null;
  const imageUrl = currentBase64Image;
  const sortInput = document.getElementById('new-prod-sort');
  const sortOrder = parseInt(sortInput.value) || 0;
  
  if (!name || isNaN(price) || price <= 0) {
    alert("Iltimos, mahsulot nomi va to'g'ri narxini kiriting!");
    return;
  }
  
  const productData = {
    category_id: categoryId,
    name,
    price,
    description,
    image_url: imageUrl,
    sort_order: sortOrder,
    available: true
  };
  
  if (state.isDemoMode) {
    const prods = JSON.parse(localStorage.getItem('cb_products')) || [];
    if (editId) {
      const idx = prods.findIndex(x => x.id === editId);
      if (idx !== -1) {
        prods[idx] = { ...prods[idx], ...productData };
      }
    } else {
      prods.push({ id: Date.now(), ...productData });
    }
    localStorage.setItem('cb_products', JSON.stringify(prods));
    resetProductForm();
    await loadMenu();
    renderMenuProductsTable();
    return;
  }
  
  try {
    let error;
    if (editId) {
      const { error: err } = await sb.from('cb_products').update(productData).eq('id', editId);
      error = err;
    } else {
      const { error: err } = await sb.from('cb_products').insert(productData);
      error = err;
    }
    
    if (error) throw error;
    resetProductForm();
    await loadMenu();
    renderMenuProductsTable();
  } catch (err) {
    alert("Saqlashda xatolik: " + err.message);
  }
}

function resetProductForm() {
  document.getElementById('edit-prod-id').value = '';
  document.getElementById('new-prod-name').value = '';
  document.getElementById('new-prod-price').value = '';
  document.getElementById('new-prod-desc').value = '';
  document.getElementById('new-prod-sort').value = '0';
  document.getElementById('new-prod-imgurl').value = '';
  document.getElementById('new-prod-imgfile').value = '';
  currentBase64Image = '';
  document.getElementById('prod-preview-img').src = '';
  document.getElementById('new-prod-img-preview').style.display = 'none';
  document.getElementById('btn-cancel-edit-product').style.display = 'none';
  document.getElementById('product-form-title').textContent = 'Yangi mahsulot qo\'shish';
}

function editProduct(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  
  document.getElementById('edit-prod-id').value = p.id;
  document.getElementById('new-prod-cat').value = p.category_id;
  document.getElementById('new-prod-name').value = p.name;
  document.getElementById('new-prod-price').value = p.price;
  document.getElementById('new-prod-desc').value = p.description || '';
  document.getElementById('new-prod-sort').value = p.sort_order || 0;
  
  if (p.image_url) {
    currentBase64Image = p.image_url;
    document.getElementById('prod-preview-img').src = p.image_url;
    document.getElementById('new-prod-img-preview').style.display = 'block';
  } else {
    currentBase64Image = '';
    document.getElementById('prod-preview-img').src = '';
    document.getElementById('new-prod-img-preview').style.display = 'none';
  }
  
  document.getElementById('btn-cancel-edit-product').style.display = 'inline-block';
  document.getElementById('product-form-title').textContent = 'Mahsulotni tahrirlash';
  document.querySelector('#menu-edit-modal .modal-card').scrollTop = 0;
}

async function deleteProduct(id) {
  if (!confirm("Ushbu mahsulotni ro'yxatdan o'chirmoqchisiz?")) return;
  
  if (state.isDemoMode) {
    let prods = JSON.parse(localStorage.getItem('cb_products')) || [];
    prods = prods.filter(x => x.id !== id);
    localStorage.setItem('cb_products', JSON.stringify(prods));
    
    let recs = JSON.parse(localStorage.getItem('cb_recipes')) || [];
    recs = recs.filter(x => x.product_id !== id);
    localStorage.setItem('cb_recipes', JSON.stringify(recs));
    
    await loadMenu();
    await loadRecipes();
    renderMenuProductsTable();
    return;
  }
  
  try {
    const { error } = await sb.from('cb_products').delete().eq('id', id);
    if (error) throw error;
    await loadMenu();
    await loadRecipes();
    renderMenuProductsTable();
  } catch (err) {
    alert("O'chirishda xatolik: " + err.message);
  }
}

async function addCategory() {
  const nameInput = document.getElementById('new-cat-name');
  const iconInput = document.getElementById('new-cat-icon');
  const sortInput = document.getElementById('new-cat-sort');
  
  const name = nameInput.value.trim();
  const icon = iconInput.value.trim() || '🍔';
  const sortOrder = parseInt(sortInput.value) || 1;
  
  if (!name) {
    alert("Kategoriya nomini kiriting!");
    return;
  }
  
  const categoryData = { name, icon, sort_order: sortOrder, visible: true };
  
  if (state.isDemoMode) {
    const cats = JSON.parse(localStorage.getItem('cb_categories')) || [];
    cats.push({ id: Date.now(), ...categoryData });
    localStorage.setItem('cb_categories', JSON.stringify(cats));
    
    nameInput.value = '';
    iconInput.value = '';
    sortInput.value = '1';
    await loadMenu();
    renderMenuCategoriesTable();
    populateMenuEditCategories();
    return;
  }
  
  try {
    const { error } = await sb.from('cb_categories').insert(categoryData);
    if (error) throw error;
    
    nameInput.value = '';
    iconInput.value = '';
    sortInput.value = '1';
    await loadMenu();
    renderMenuCategoriesTable();
    populateMenuEditCategories();
  } catch (err) {
    alert("Kategoriya saqlashda xatolik: " + err.message);
  }
}

async function deleteCategory(id) {
  if (!confirm("Diqqat! Kategoriyani o'chirsangiz uning ichidagi barcha mahsulotlar ham o'chib ketishi mumkin. Rozimisiz?")) return;
  
  if (state.isDemoMode) {
    let cats = JSON.parse(localStorage.getItem('cb_categories')) || [];
    cats = cats.filter(x => x.id !== id);
    localStorage.setItem('cb_categories', JSON.stringify(cats));
    
    let prods = JSON.parse(localStorage.getItem('cb_products')) || [];
    prods = prods.filter(x => x.category_id !== id);
    localStorage.setItem('cb_products', JSON.stringify(prods));
    
    await loadMenu();
    renderMenuCategoriesTable();
    populateMenuEditCategories();
    return;
  }
  
  try {
    const { error } = await sb.from('cb_categories').delete().eq('id', id);
    if (error) throw error;
    await loadMenu();
    renderMenuCategoriesTable();
    populateMenuEditCategories();
  } catch (err) {
    alert("Kategoriyani o'chirishda xatolik: " + err.message);
  }
}

function setupCustomerAutocomplete() {
  const custSearchInput = document.getElementById('cart-customer-search');
  const custDropdown = document.getElementById('cart-customer-dropdown');
  if (!custSearchInput) return;

  custSearchInput.addEventListener('input', () => {
    const val = custSearchInput.value.trim().toLowerCase();
    if (!val) {
      custDropdown.style.display = 'none';
      return;
    }
    
    const matches = state.customers.filter(c => 
      c.name.toLowerCase().includes(val) || c.phone.includes(val)
    );
    
    if (matches.length === 0) {
      custDropdown.innerHTML = `<div class="customer-dropdown-item" style="color:var(--muted);cursor:default;">Mijoz topilmadi</div>`;
    } else {
      custDropdown.innerHTML = matches.map(c => `
        <div class="customer-dropdown-item" data-id="${c.id}">
          ${c.name} (${c.phone}) [Xarid: ${c.purchase_count}]
        </div>
      `).join('');
      
      custDropdown.querySelectorAll('.customer-dropdown-item').forEach(item => {
        item.onclick = () => {
          const id = Number(item.dataset.id);
          const match = state.customers.find(x => x.id === id);
          if (match) {
            state.selectedCustomer = match;
            updateSelectedCustomerUI();
            custDropdown.style.display = 'none';
          }
        };
      });
    }
    custDropdown.style.display = 'block';
  });

  document.addEventListener('click', (e) => {
    if (!custSearchInput.contains(e.target) && !custDropdown.contains(e.target)) {
      custDropdown.style.display = 'none';
    }
  });

  document.getElementById('btn-remove-customer').onclick = () => {
    state.selectedCustomer = null;
    updateSelectedCustomerUI();
  };
}

// Global qilish (HTML onClick va boshqalar uchun)
window.editIngStock = editIngStock;
window.deleteIngredient = deleteIngredient;
window.deleteRecipeItem = deleteRecipeItem;
window.selectCustForOrder = selectCustForOrder;
window.deleteCustomer = deleteCustomer;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.deleteCategory = deleteCategory;

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

// Yangi Modallar Hodisalari
document.getElementById('open-customers').onclick = () => {
  closeAllModals();
  document.getElementById('customers-modal').classList.add('open');
  loadCustomers();
};
document.getElementById('customers-close').onclick = () => {
  document.getElementById('customers-modal').classList.remove('open');
};

document.getElementById('open-menu-edit').onclick = () => {
  closeAllModals();
  document.getElementById('menu-edit-modal').classList.add('open');
  switchMenuEditTab('products');
  populateMenuEditCategories();
};
document.getElementById('menu-edit-close').onclick = () => {
  document.getElementById('menu-edit-modal').classList.remove('open');
  resetProductForm();
};

document.getElementById('me-tab-products').onclick = () => switchMenuEditTab('products');
document.getElementById('me-tab-categories').onclick = () => switchMenuEditTab('categories');
document.getElementById('btn-add-category').onclick = addCategory;
document.getElementById('btn-save-product').onclick = saveProduct;
document.getElementById('btn-cancel-edit-product').onclick = resetProductForm;

// Autocomplete va rasmlar sozlamalari
setupCustomerAutocomplete();
setupImageHandlers();

// Enter tugmasi orqali login qilish
document.getElementById('login-username').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleLogin();
});
document.getElementById('login-password').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleLogin();
});

// Drag and Drop Boshqaruvi
let draggedCard = null;

function setupDragAndDrop() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  
  const cards = grid.querySelectorAll('.product-card');
  cards.forEach(card => {
    card.setAttribute('draggable', 'true');
    
    card.addEventListener('dragstart', (e) => {
      draggedCard = card;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    
    card.addEventListener('dragend', async () => {
      card.classList.remove('dragging');
      draggedCard = null;
      await saveNewProductOrder();
    });
    
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!draggedCard || draggedCard === card) return;
      
      const rect = card.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      const midY = rect.top + rect.height / 2;
      
      const insertAfter = e.clientX > midX || e.clientY > midY;
      grid.insertBefore(draggedCard, insertAfter ? card.nextSibling : card);
    });
  });
}

async function saveNewProductOrder() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  
  const cards = grid.querySelectorAll('.product-card');
  const newOrderIds = Array.from(cards).map(card => Number(card.dataset.id));
  
  newOrderIds.forEach((id, index) => {
    const p = state.products.find(x => x.id === id);
    if (p) p.sort_order = index + 1;
  });
  
  // State tartibini yangilash
  state.products.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id);
  
  if (state.isDemoMode) {
    const prods = JSON.parse(localStorage.getItem('cb_products')) || [];
    newOrderIds.forEach((id, index) => {
      const p = prods.find(x => x.id === id);
      if (p) p.sort_order = index + 1;
    });
    localStorage.setItem('cb_products', JSON.stringify(prods));
    return;
  }
  
  try {
    const promises = newOrderIds.map((id, index) => 
      sb.from('cb_products').update({ sort_order: index + 1 }).eq('id', id)
    );
    await Promise.all(promises);
  } catch (err) {
    console.error("Tartibni saqlashda xatolik:", err);
  }
}

// ==========================================================================
//  BOSHQARUV PANELI (ANAlITIKA DASHBOARD) MANTIQI
// ==========================================================================

async function openDashboard() {
  closeAllModals();
  document.getElementById('dashboard-modal').classList.add('open');
  const datePicker = document.getElementById('db-date-picker');
  
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const localISOTime = `${yyyy}-${mm}-${dd}`;
  
  datePicker.value = localISOTime;
  await loadDashboardData();
}

async function loadDashboardData() {
  const dateStr = document.getElementById('db-date-picker').value;
  if (!dateStr) return;

  let orders = [];
  let orderItems = [];
  let newCustomersCount = 0;

  // 1. Load Orders & Items
  if (state.isDemoMode) {
    const allOrders = JSON.parse(localStorage.getItem('cb_orders')) || [];
    orders = allOrders.filter(o => o.status === 'paid' && o.created_at && o.created_at.slice(0, 10) === dateStr);

    const orderIds = orders.map(o => o.id);
    if (orderIds.length > 0) {
      const allItems = JSON.parse(localStorage.getItem('cb_order_items')) || [];
      orderItems = allItems.filter(it => orderIds.includes(it.order_id));
    }

    const allCusts = JSON.parse(localStorage.getItem('cb_customers')) || [];
    newCustomersCount = allCusts.filter(c => c.created_at && c.created_at.slice(0, 10) === dateStr).length;
  } else {
    try {
      // Fetch today's orders
      const { data: oData, error: oErr } = await sb.from('cb_orders')
        .select('*')
        .eq('status', 'paid')
        .gte('created_at', dateStr + 'T00:00:00+05:00')
        .lte('created_at', dateStr + 'T23:59:59.999+05:00');
      
      if (oErr) throw oErr;
      orders = oData || [];

      // Fetch today's order items
      const orderIds = orders.map(o => o.id);
      if (orderIds.length > 0) {
        const { data: itData, error: itErr } = await sb.from('cb_order_items')
          .select('*')
          .in('order_id', orderIds);
        if (itErr) throw itErr;
        orderItems = itData || [];
      }

      // Fetch new customers created today
      const { data: cData, error: cErr } = await sb.from('cb_customers')
        .select('*')
        .gte('created_at', dateStr + 'T00:00:00+05:00')
        .lte('created_at', dateStr + 'T23:59:59.999+05:00');
      if (cErr) throw cErr;
      newCustomersCount = (cData || []).length;

    } catch (err) {
      console.error("Dashboard yuklashda xatolik:", err);
      return;
    }
  }

  // 2. Calculate KPI Metrics
  const revenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  const ordersCount = orders.length;
  const avgCheck = ordersCount > 0 ? Math.round(revenue / ordersCount) : 0;

  // Update KPI UI
  document.getElementById('db-kpi-revenue').textContent = fmt(revenue);
  document.getElementById('db-kpi-orders').textContent = `${ordersCount} ta`;
  document.getElementById('db-kpi-avg').textContent = fmt(avgCheck);
  document.getElementById('db-kpi-customers').textContent = `${newCustomersCount} ta`;

  // 3. Render Top Products
  const prodAgg = {};
  orderItems.forEach(it => {
    prodAgg[it.name] = prodAgg[it.name] || { name: it.name, qty: 0, rev: 0 };
    prodAgg[it.name].qty += Number(it.qty || 0);
    prodAgg[it.name].rev += Number(it.subtotal || 0);
  });
  const topProducts = Object.values(prodAgg).sort((a, b) => b.rev - a.rev).slice(0, 5);

  const topListContainer = document.getElementById('db-top-products-list');
  if (topProducts.length === 0) {
    topListContainer.innerHTML = `<div style="color:var(--muted);padding:1rem;font-size:0.8rem;">Bugun sotuvlar bo'lmagan</div>`;
  } else {
    topListContainer.innerHTML = topProducts.map((p, idx) => {
      // Find matching product in state to get image
      const match = state.products.find(x => x.name === p.name);
      const imgUrl = match && match.image_url ? match.image_url : '';
      const imgHtml = imgUrl ? `<img src="${imgUrl}" class="li-img">` : `<div class="li-img" style="display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.05);font-size:1rem;">🍔</div>`;
      
      return `
        <div class="db-list-item">
          <div class="li-rank-img-name">
            <span class="li-rank">${idx + 1}</span>
            ${imgHtml}
            <div class="li-name-qty">
              <span class="li-name">${p.name}</span>
              <span class="li-qty">${p.qty} dona sotildi</span>
            </div>
          </div>
          <span class="li-val">${fmt(p.rev)}</span>
        </div>
      `;
    }).join('');
  }

  // 4. Render Recent Orders (All time, last 5)
  let recentOrders = [];
  if (state.isDemoMode) {
    const allOrders = JSON.parse(localStorage.getItem('cb_orders')) || [];
    recentOrders = allOrders.filter(o => o.created_at).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  } else {
    try {
      const { data, error } = await sb.from('cb_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (!error) recentOrders = data || [];
    } catch (err) {
      console.error(err);
    }
  }

  const recentListContainer = document.getElementById('db-recent-orders-list');
  if (recentOrders.length === 0) {
    recentListContainer.innerHTML = `<div style="color:var(--muted);padding:1rem;font-size:0.8rem;">Buyurtmalar topilmadi</div>`;
  } else {
    recentListContainer.innerHTML = recentOrders.map(o => {
      const timeStr = new Date(o.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="db-list-item">
          <div class="li-order-meta">
            <span class="li-order-num">#${o.order_number.slice(-6)}</span>
            <span class="li-order-time">${timeStr}</span>
          </div>
          <span class="li-badge ${o.type}">${TYPE_LABEL[o.type] || o.type}</span>
          <span class="li-val">${fmt(o.total)}</span>
        </div>
      `;
    }).join('');
  }

  // 5. Draw Charts
  drawDashboardLineChart(orders);
  drawDashboardBarChart(orders);
  drawDashboardDonutChart(orders);

  // 6. Notifications
  renderDashboardNotifications();
}

function drawDashboardLineChart(orders) {
  const container = document.getElementById('db-line-chart-container');
  if (!container) return;

  // Group by 4-hour intervals: 08-12, 12-16, 16-20, 20-24
  const intervals = [
    { label: "08:00 - 12:00", min: 8, max: 12, sum: 0 },
    { label: "12:00 - 16:00", min: 12, max: 16, sum: 0 },
    { label: "16:00 - 20:00", min: 16, max: 20, sum: 0 },
    { label: "20:00 - 24:00", min: 20, max: 24, sum: 0 }
  ];

  orders.forEach(o => {
    const hour = new Date(o.created_at).getHours();
    intervals.forEach(i => {
      if (hour >= i.min && hour < i.max) {
        i.sum += Number(o.total || 0);
      }
    });
  });

  const values = intervals.map(i => i.sum);
  const maxVal = Math.max(...values, 100000); // at least 100k scale

  // SVG Coordinates math
  const width = 500;
  const height = 150;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;
  const baselineY = height - paddingBottom;

  const points = intervals.map((i, idx) => {
    const x = paddingLeft + (chartW / (intervals.length - 1)) * idx;
    const yFraction = i.sum / maxVal;
    const y = baselineY - chartH * yFraction;
    return { x, y, val: i.sum, label: i.label };
  });

  // Build svg path
  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;

  // Draw grid lines (3 levels)
  let gridLines = '';
  for (let lvl = 0; lvl <= 3; lvl++) {
    const y = baselineY - (chartH / 3) * lvl;
    const valLvl = Math.round((maxVal / 3) * lvl);
    gridLines += `
      <line class="grid" x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" />
      <text class="axis" x="${paddingLeft - 10}" y="${y + 4}" text-anchor="end">${fmt(valLvl).replace(" so'm", "")}</text>
    `;
  }

  // Draw dots and text
  const dotsHtml = points.map(p => `
    <circle class="point" cx="${p.x}" cy="${p.y}" r="5" />
    <g class="chart-tooltip">
      <rect x="${p.x - 40}" y="${p.y - 25}" width="80" height="18" rx="4" fill="#000" opacity="0.8" />
      <text x="${p.x}" y="${p.y - 13}" fill="#fff" font-size="9" text-anchor="middle" font-weight="700">${fmt(p.val).replace(" so'm", "")}</text>
    </g>
  `).join('');

  const labelsHtml = points.map(p => `
    <text class="axis" x="${p.x}" y="${height - 6}" text-anchor="middle">${p.label.split(' - ')[0]}</text>
  `).join('');

  container.innerHTML = `
    <svg class="line-chart-svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="line-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      ${gridLines}
      <path class="area" d="${areaPath}" />
      <path class="line" d="${linePath}" />
      ${dotsHtml}
      ${labelsHtml}
    </svg>
  `;
}

function drawDashboardBarChart(orders) {
  const container = document.getElementById('db-bar-chart-container');
  if (!container) return;

  // Group by hour: 8:00 to 23:00 (16 bars)
  const hours = Array.from({ length: 16 }, (_, i) => i + 8);
  const hourlyData = hours.map(h => ({ hour: h, sum: 0 }));

  orders.forEach(o => {
    const h = new Date(o.created_at).getHours();
    const match = hourlyData.find(x => x.hour === h);
    if (match) match.sum += Number(o.total || 0);
  });

  const maxVal = Math.max(...hourlyData.map(d => d.sum), 10000); // scale max

  container.innerHTML = hourlyData.map(d => {
    const heightPct = Math.max(5, (d.sum / maxVal) * 100);
    return `
      <div class="bar-item">
        <div class="bar-fill" style="height: ${heightPct}%;">
          <div class="bar-value-tooltip">${fmt(d.sum)}</div>
        </div>
        <div class="bar-label">${String(d.hour).padStart(2, '0')}</div>
      </div>
    `;
  }).join('');
}

function drawDashboardDonutChart(orders) {
  const container = document.getElementById('db-donut-chart-container');
  if (!container) return;

  let naqd = 0, karta = 0, online = 0;
  orders.forEach(o => {
    if (o.payment_method === 'naqd') naqd += Number(o.total || 0);
    else if (o.payment_method === 'karta') karta += Number(o.total || 0);
    else online += Number(o.total || 0);
  });

  const total = naqd + karta + online;
  const nPct = total > 0 ? (naqd / total) * 100 : 0;
  const kPct = total > 0 ? (karta / total) * 100 : 0;
  const oPct = total > 0 ? (online / total) * 100 : 0;

  // Donut SVG parameters
  const r = 45;
  const C = 2 * Math.PI * r;

  // Segment stroke dashes
  const nDash = C * (nPct / 100);
  const kDash = C * (kPct / 100);
  const oDash = C * (oPct / 100);

  const nOffset = 0;
  const kOffset = -nDash;
  const oOffset = -(nDash + kDash);

  container.innerHTML = `
    <svg class="donut-chart-svg" viewBox="0 0 130 130">
      <circle class="donut-circle-bg" cx="65" cy="65" r="${r}" />
      
      ${total > 0 && nPct > 0 ? `
        <circle class="donut-circle-segment" cx="65" cy="65" r="${r}"
                stroke="#4cd137" stroke-dasharray="${nDash} ${C - nDash}" stroke-dashoffset="${nOffset}" transform="rotate(-90 65 65)" />
      ` : ''}
      
      ${total > 0 && kPct > 0 ? `
        <circle class="donut-circle-segment" cx="65" cy="65" r="${r}"
                stroke="#00c2ff" stroke-dasharray="${kDash} ${C - kDash}" stroke-dashoffset="${kOffset}" transform="rotate(-90 65 65)" />
      ` : ''}

      ${total > 0 && oPct > 0 ? `
        <circle class="donut-circle-segment" cx="65" cy="65" r="${r}"
                stroke="#9c88ff" stroke-dasharray="${oDash} ${C - oDash}" stroke-dashoffset="${oOffset}" transform="rotate(-90 65 65)" />
      ` : ''}
      
      <text class="donut-text-val" x="65" y="65">${fmt(total).replace(" so'm", "")}</text>
      <text class="donut-text-lbl" x="65" y="77">Jami (Sum)</text>
    </svg>
    
    <div class="donut-legends">
      <div class="donut-legend-item">
        <div class="legend-left">
          <span class="legend-color" style="background:#4cd137;"></span>
          <span>Naqd pul</span>
        </div>
        <span class="legend-right">${Math.round(nPct)}% · ${fmt(naqd)}</span>
      </div>
      <div class="donut-legend-item">
        <div class="legend-left">
          <span class="legend-color" style="background:#00c2ff;"></span>
          <span>Plastik karta</span>
        </div>
        <span class="legend-right">${Math.round(kPct)}% · ${fmt(karta)}</span>
      </div>
      ${online > 0 ? `
      <div class="donut-legend-item">
        <div class="legend-left">
          <span class="legend-color" style="background:#9c88ff;"></span>
          <span>Onlayn to'lov</span>
        </div>
        <span class="legend-right">${Math.round(oPct)}% · ${fmt(online)}</span>
      </div>
      ` : ''}
    </div>
  `;
}

function renderDashboardNotifications() {
  const container = document.getElementById('db-notifications-list');
  if (!container) return;

  const alerts = [];

  // Check low stock ingredients
  state.inventory.forEach(ing => {
    if (ing.stock <= ing.min_stock) {
      alerts.push({
        type: 'warning',
        icon: '⚠️',
        text: `Omborda masalliq kam qoldi: "${ing.name}"`,
        subText: `Qoldiq: ${ing.stock} ${ing.unit} (Min: ${ing.min_stock} ${ing.unit})`
      });
    }
  });

  // Default success notification if no warning
  if (alerts.length === 0) {
    alerts.push({
      type: 'success',
      icon: '✨',
      text: 'Tizim ishga tayyor',
      subText: 'Hech qanday kamchilik aniqlanmadi.'
    });
  }

  // Render alerts list
  container.innerHTML = alerts.map(a => `
    <div class="db-notif-item ${a.type}">
      <span class="notif-icon">${a.icon}</span>
      <div class="notif-body">
        <span class="notif-text">${a.text}</span>
        <span class="notif-time">${a.subText}</span>
      </div>
    </div>
  `).join('');
}

// --- Dashboard Hodisa bog'lamalari ---
document.getElementById('open-dashboard').onclick = openDashboard;
document.getElementById('dashboard-close').onclick = () => document.getElementById('dashboard-modal').classList.remove('open');
document.getElementById('db-date-picker').onchange = () => loadDashboardData();

document.getElementById('db-link-to-menu').onclick = (e) => {
  e.preventDefault();
  document.getElementById('dashboard-modal').classList.remove('open');
  document.getElementById('open-menu-edit').click();
};
document.getElementById('db-link-to-orders').onclick = (e) => {
  e.preventDefault();
  document.getElementById('dashboard-modal').classList.remove('open');
  document.getElementById('open-reports').click();
};

// ---------- Ishga tushirish ----------
renderCart();

