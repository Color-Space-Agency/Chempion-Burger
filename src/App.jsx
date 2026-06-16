import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// --- Supabase Client ---
const SUPABASE_URL = "https://ddqoktwkffnufczhdads.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkcW9rdHdrZmZudWZjemhkYWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyOTUyODgsImV4cCI6MjA5NTg3MTI4OH0.IL-C7px7_lcmwQxgXhbNlrmy0NAYN6RmQKmiUQpgq-Q";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const TYPE_LABEL = { dine_in: 'Zal', takeout: 'Olib ketish', delivery: 'Yetkazib berish' };
const PM_LABEL = { naqd: '💵 Naqd', karta: '💳 Karta' };

const fmt = n => Math.round(n || 0).toLocaleString('uz-UZ') + " so'm";

function genOrderNumber() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export default function App() {
  // --- Auth States ---
  const [user, setUser] = useState(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // --- Core POS States ---
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState("dine_in");
  const [paymentMethod, setPaymentMethod] = useState("naqd");
  const [tableNumber, setTableNumber] = useState("");
  const [servicePct, setServicePct] = useState(0);
  const [discountInput, setDiscountInput] = useState(0);

  // --- Modal Open States ---
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showCustomersModal, setShowCustomersModal] = useState(false);
  const [showMenuEditModal, setShowMenuEditModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // --- Sub-States (Warehouse, Customers, Menu) ---
  const [inventory, setInventory] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchCustomerVal, setSearchCustomerVal] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // --- Modal Sub-States ---
  const [activeWarehouseTab, setActiveWarehouseTab] = useState("stock");
  const [activeMenuEditTab, setActiveMenuEditTab] = useState("products");
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportData, setReportData] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [receiptTotals, setReceiptTotals] = useState(null);

  // --- Input Refs & States for Forms ---
  // 1. Warehouse Stock Form
  const [newIngName, setNewIngName] = useState("");
  const [newIngStock, setNewIngStock] = useState("");
  const [newIngUnit, setNewIngUnit] = useState("dona");

  // 2. Recipes Form
  const [recipeProductSelect, setRecipeProductSelect] = useState("");
  const [recipeIngSelect, setRecipeIngSelect] = useState("");
  const [recipeIngQty, setRecipeIngQty] = useState("");

  // 3. Customers Form
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [searchCustInput, setSearchCustInput] = useState("");

  // 4. Menu Management Form
  const [editProdId, setEditProdId] = useState("");
  const [newProdCat, setNewProdCat] = useState("");
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdSort, setNewProdSort] = useState("0");
  const [newProdImgUrl, setNewProdImgUrl] = useState("");
  const [currentBase64Image, setCurrentBase64Image] = useState("");
  
  // Emojis for categories form
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🍔");
  const [newCatSort, setNewCatSort] = useState("1");

  const fileInputRef = useRef(null);

  // --- Drag and Drop State ---
  const [draggingIndex, setDraggingIndex] = useState(null);

  // ---------- Offline Demo Mode LocalStorage Defaults Setup ----------
  const setupDefaultLocalStorage = () => {
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
    
    if (!localStorage.getItem('cb_products')) {
      const defaultProducts = [
        { id: 1, category_id: 1, name: 'Ghamburger', price: 33000, description: 'Bulochka, kotlet, svejiy bodring, pamidor, sho\'r bodring, salat barg, firmenniy sous, qizil piyoz', sort_order: 1, available: true },
        { id: 2, category_id: 1, name: 'Cheeseburger', price: 35000, description: 'Bulochka, kotlet, svejiy bodring, pamidor, sho\'r bodring, salat barg, firmenniy sous, qizil piyoz, sir', sort_order: 2, available: true },
        { id: 3, category_id: 1, name: 'Bigburger', price: 50000, description: 'Bulochka, kotlet 2ta, svejiy bodring, pamidor, sho\'r bodring, salat barg, firmenniy sous, qizil piyoz', sort_order: 3, available: true },
        { id: 4, category_id: 1, name: 'Bigburger Sirli', price: 53000, description: 'Bulochka, kotlet 2ta, svejiy bodring, pamidor, sho\'r bodring, salat barg, firmenniy sous, qizil piyoz, sir', sort_order: 4, available: true },
        { id: 5, category_id: 1, name: 'KFC Burger', price: 25000, description: 'Bulochka, KFC, svejiy bodring, pamidor, sho\'r bodring, salat barg, firmenniy sous', sort_order: 5, available: true },
        { id: 6, category_id: 3, name: 'Non Kabob', price: 42000, description: 'Qiyma kabob 2ta, non, piyoz, pamidor, firmenniy sous', sort_order: 6, available: true },
        { id: 7, category_id: 3, name: 'Non Chicken KFC', price: 30000, description: 'Tovuq, non, svejiy bodring, chisnochniy sous', sort_order: 7, available: true },
        { id: 8, category_id: 3, name: 'Non Donar', price: 42000, description: 'Donar go\'sht, non, svejiy bodring, chisnochniy sous', sort_order: 8, available: true },
        { id: 9, category_id: 2, name: 'Hot Dog Canadskiy', price: 12000, description: 'Bulochka, sosiska, bodring, pamidor, ketchup, mayonez', sort_order: 9, available: true },
        { id: 10, category_id: 2, name: 'Hot Dog Canadskiy 2X', price: 16000, description: 'Bulochka, sosiska 2ta, bodring, pamidor, ketchup, mayonez, chips', sort_order: 10, available: true },
        { id: 11, category_id: 2, name: 'Hot Dog Oddiy', price: 10000, description: 'Bulochka, sosiska, sabzi salat, ketchup, mayonez', sort_order: 11, available: true },
        { id: 12, category_id: 2, name: 'Hot Dog Oddiy 2X', price: 13000, description: 'Bulochka, sosiska 2ta, sabzi salat, ketchup, mayonez', sort_order: 12, available: true },
        { id: 13, category_id: 2, name: 'Go\'shtli Hot-Dog', price: 25000, description: 'Bulochka, go\'sht (donar), bodring, pamidor, firmenniy sous, mayonez, chips', sort_order: 13, available: true },
        { id: 14, category_id: 2, name: 'Big Hot-Dog', price: 42000, description: 'Bulochka katta, kotlet 1.5ta, sosiska 2ta, bodring, pamidor, firmenniy sous, mayonez, indeyka', sort_order: 14, available: true },
        { id: 15, category_id: 2, name: 'Kabob Hot-Dog', price: 45000, description: 'Bulochka, qiyma, piyoz, firmenniy sous, indeyka', sort_order: 15, available: true },
        { id: 16, category_id: 2, name: 'Longer', price: 22000, description: 'Bulochka, KFC (grudka), bodring, pamidor, ketchup, mayonez, salat barg', sort_order: 16, available: true },
        { id: 17, category_id: 4, name: 'Set 1', price: 45000, description: 'Ghamburger, fri, Pepsi 0.5l', sort_order: 17, available: true },
        { id: 18, category_id: 4, name: 'Set 2', price: 60000, description: 'Non Kabob, fri, Pepsi 0.5l', sort_order: 18, available: true },
        { id: 19, category_id: 4, name: 'Set 3', price: 42000, description: 'Go\'shtli hot dog, fri, Pepsi 0.5l', sort_order: 19, available: true },
        { id: 20, category_id: 4, name: 'Set 4', price: 43000, description: 'KFC Burger, fri, Pepsi 0.5l', sort_order: 20, available: true },
        { id: 21, category_id: 5, name: 'Pepsi 0.5l', price: 8000, description: '', sort_order: 21, available: true },
        { id: 22, category_id: 5, name: 'Coca-Cola 0.5l', price: 8000, description: '', sort_order: 22, available: true },
        { id: 23, category_id: 5, name: 'Fanta 0.5l', price: 8000, description: '', sort_order: 23, available: true },
        { id: 24, category_id: 5, name: 'Suv 0.5l', price: 4000, description: '', sort_order: 24, available: true },
        { id: 25, category_id: 5, name: 'Fri kartoshka 110g', price: 15000, description: '', sort_order: 25, available: true },
        { id: 26, category_id: 6, name: 'Ketchup', price: 2000, description: '', sort_order: 26, available: true },
        { id: 27, category_id: 6, name: 'Mayonez', price: 2000, description: '', sort_order: 27, available: true }
      ];
      localStorage.setItem('cb_products', JSON.stringify(defaultProducts));
    }
    
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
    
    if (!localStorage.getItem('cb_orders')) localStorage.setItem('cb_orders', JSON.stringify([]));
    if (!localStorage.getItem('cb_order_items')) localStorage.setItem('cb_order_items', JSON.stringify([]));
    if (!localStorage.getItem('cb_customers')) localStorage.setItem('cb_customers', JSON.stringify([]));
  };

  // ---------- Data Loaders ----------
  const loadMenuData = async (demo = isDemoMode) => {
    if (demo) {
      const cats = JSON.parse(localStorage.getItem('cb_categories')) || [];
      const prods = JSON.parse(localStorage.getItem('cb_products')) || [];
      setCategories(cats);
      setProducts(prods.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id));
      if (cats.length > 0 && !newProdCat) setNewProdCat(cats[0].id.toString());
      return;
    }
    try {
      const [{ data: cats, error: e1 }, { data: prods, error: e2 }] = await Promise.all([
        sb.from('cb_categories').select('*').eq('visible', true).order('sort_order'),
        sb.from('cb_products').select('*').eq('available', true).order('sort_order').order('id')
      ]);
      if (e1 || e2) throw new Error("Supabase tables not found");
      setCategories(cats || []);
      setProducts(prods || []);
      if (cats && cats.length > 0 && !newProdCat) setNewProdCat(cats[0].id.toString());
    } catch (err) {
      console.warn("Supabase ulanmadi. Offline Demo rejim ishga tushmoqda...", err);
      setIsDemoMode(true);
      setupDefaultLocalStorage();
      loadMenuData(true);
    }
  };

  const loadInventoryData = async (demo = isDemoMode) => {
    if (demo) {
      const inv = JSON.parse(localStorage.getItem('cb_inventory')) || [];
      setInventory(inv);
      if (inv.length > 0 && !recipeIngSelect) setRecipeIngSelect(inv[0].id.toString());
      return;
    }
    try {
      const { data, error } = await sb.from('cb_inventory').select('*').order('name');
      if (error) throw error;
      setInventory(data || []);
      if (data && data.length > 0 && !recipeIngSelect) setRecipeIngSelect(data[0].id.toString());
    } catch (err) {
      console.error("Ombor yuklanmadi:", err);
    }
  };

  const loadRecipesData = async (demo = isDemoMode) => {
    if (demo) {
      const rec = JSON.parse(localStorage.getItem('cb_recipes')) || [];
      setRecipes(rec);
      return;
    }
    try {
      const { data, error } = await sb.from('cb_recipes').select('*');
      if (error) throw error;
      setRecipes(data || []);
    } catch (err) {
      console.error("Retseptlar yuklanmadi:", err);
    }
  };

  const loadCustomersData = async (demo = isDemoMode) => {
    if (demo) {
      const custs = JSON.parse(localStorage.getItem('cb_customers')) || [];
      setCustomers(custs);
      return;
    }
    try {
      const { data, error } = await sb.from('cb_customers').select('*').order('name');
      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error("Mijozlar yuklanmadi:", err);
    }
  };

  // --- Sync database selection product list to recipe form product select ---
  useEffect(() => {
    if (products.length > 0 && !recipeProductSelect) {
      setRecipeProductSelect(products[0].id.toString());
    }
  }, [products]);

  // ---------- Login handler with Enter Key bug fix ----------
  const handleLogin = () => {
    setLoginError("");
    const userField = loginUsername.trim().toLowerCase();
    const passField = loginPassword;
    
    if (userField === 'sotuvchi' && passField === '123') {
      setUser({ role: 'cashier', label: 'Sotuvchi' });
    } else if (userField === 'admin' && passField === 'admin123') {
      setUser({ role: 'admin', label: 'Admin' });
    } else {
      setLoginError("Noto'g'ri login yoki parol!");
    }
  };

  // Key handler for Enter key press on Login inputs (Tuzatish - Bug 1)
  const handleLoginKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    setLoginUsername("");
    setLoginPassword("");
    setLoginError("");
    setSelectedCustomer(null);
  };

  // Load POS data when user logs in
  useEffect(() => {
    if (user) {
      loadMenuData();
      loadInventoryData();
      loadRecipesData();
      loadCustomersData();
    }
  }, [user, isDemoMode]);

  // ---------- Cart Actions ----------
  const addToCart = (productId) => {
    const p = products.find(x => x.id === productId);
    if (!p) return;
    const existing = cart.find(item => item.product_id === productId);
    if (existing) {
      setCart(cart.map(item => item.product_id === productId ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { product_id: p.id, name: p.name, price: p.price, qty: 1 }]);
    }
  };

  const changeQty = (productId, delta) => {
    const item = cart.find(i => i.product_id === productId);
    if (!item) return;
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      setCart(cart.filter(i => i.product_id !== productId));
    } else {
      setCart(cart.map(i => i.product_id === productId ? { ...i, qty: newQty } : i));
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  // ---------- loyalty discount and summary calculation ----------
  const calcTotals = () => {
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    let bonusDiscount = 0;
    let isBonusOrder = false;

    if (selectedCustomer) {
      isBonusOrder = (selectedCustomer.purchase_count + 1) % 5 === 0;
      if (isBonusOrder && cart.length > 0) {
        // Find the cheapest item in the cart (for 1 unit)
        let cheapest = cart[0];
        for (const item of cart) {
          if (item.price < cheapest.price) {
            cheapest = item;
          }
        }
        bonusDiscount = cheapest.price;
      }
    }

    const pct = parseFloat(servicePct) || 0;
    const service = Math.round((subtotal - bonusDiscount) * pct / 100);
    const disc = (parseFloat(discountInput) || 0) + bonusDiscount;
    const total = Math.max(0, subtotal + service - disc);

    return { subtotal, service, discount: disc, total, bonusDiscount, isBonusOrder };
  };

  const totals = calcTotals();

  // ---------- Complete order & Save ----------
  const handleConfirmOrder = async () => {
    if (cart.length === 0) return;
    const orderNumber = genOrderNumber();
    const t = calcTotals();

    if (isDemoMode) {
      try {
        const localOrders = JSON.parse(localStorage.getItem('cb_orders')) || [];
        const newOrder = {
          id: Date.now(),
          order_number: orderNumber,
          type: orderType,
          table_number: orderType === 'dine_in' ? (tableNumber || null) : null,
          status: 'paid',
          subtotal: t.subtotal,
          service_charge: t.service,
          discount: t.discount,
          total: t.total,
          cashier: user ? user.label : 'Kassir',
          payment_method: paymentMethod,
          customer_id: selectedCustomer ? selectedCustomer.id : null,
          created_at: new Date().toISOString(),
          paid_at: new Date().toISOString()
        };
        localOrders.push(newOrder);
        localStorage.setItem('cb_orders', JSON.stringify(localOrders));

        const localOrderItems = JSON.parse(localStorage.getItem('cb_order_items')) || [];
        cart.forEach(i => {
          localOrderItems.push({
            id: Date.now() + Math.random(),
            order_id: newOrder.id,
            product_id: i.product_id,
            name: i.name,
            price: i.price,
            qty: i.qty,
            subtotal: i.price * i.qty
          });
        });
        localStorage.setItem('cb_order_items', JSON.stringify(localOrderItems));

        // Deduct inventory stock locally
        const localInv = JSON.parse(localStorage.getItem('cb_inventory')) || [];
        cart.forEach(cartItem => {
          const prodRecipes = recipes.filter(r => r.product_id === cartItem.product_id);
          prodRecipes.forEach(r => {
            const ing = localInv.find(x => x.id === r.ingredient_id);
            if (ing) {
              ing.stock = Math.max(0, parseFloat((ing.stock - (r.quantity * cartItem.qty)).toFixed(2)));
            }
          });
        });
        localStorage.setItem('cb_inventory', JSON.stringify(localInv));
        setInventory(localInv);

        // Update customer purchase count locally
        if (selectedCustomer) {
          const localCusts = JSON.parse(localStorage.getItem('cb_customers')) || [];
          const c = localCusts.find(x => x.id === selectedCustomer.id);
          if (c) {
            c.purchase_count++;
            localStorage.setItem('cb_customers', JSON.stringify(localCusts));
          }
          selectedCustomer.purchase_count++;
          await loadCustomersData(true);
        }

        setReceiptOrder(newOrder);
        setReceiptTotals(t);
        setShowReceiptModal(true);
      } catch (e) {
        alert("Xatolik: " + e.message);
      }
      return;
    }

    // Normal Supabase Checkout
    try {
      const { data: order, error } = await sb.from('cb_orders').insert({
        order_number: orderNumber,
        type: orderType,
        table_number: orderType === 'dine_in' ? (tableNumber || null) : null,
        status: 'paid',
        subtotal: t.subtotal,
        service_charge: t.service,
        discount: t.discount,
        total: t.total,
        cashier: user ? user.label : 'Kassir',
        paid_at: new Date().toISOString(),
        payment_method: paymentMethod,
        customer_id: selectedCustomer ? selectedCustomer.id : null
      }).select().single();
      if (error) throw error;

      const items = cart.map(i => ({
        order_id: order.id,
        product_id: i.product_id,
        name: i.name,
        price: i.price,
        qty: i.qty,
        subtotal: i.price * i.qty
      }));
      const { error: e2 } = await sb.from('cb_order_items').insert(items);
      if (e2) throw e2;

      // Deduct stock on Supabase via RPC
      try {
        const deductions = {};
        for (const cartItem of cart) {
          const prodRecipes = recipes.filter(r => r.product_id === cartItem.product_id);
          for (const r of prodRecipes) {
            deductions[r.ingredient_id] = (deductions[r.ingredient_id] || 0) + (r.quantity * cartItem.qty);
          }
        }
        for (const [ingId, qty] of Object.entries(deductions)) {
          await sb.rpc('cb_deduct_inventory', { p_ingredient_id: Number(ingId), p_qty: Number(qty) });
        }
        await loadInventoryData();
      } catch (deductErr) {
        console.error('Ombordan kamaytirishda xatolik:', deductErr);
      }

      // Update customer purchase count on Supabase
      if (selectedCustomer) {
        const { error: custErr } = await sb.from('cb_customers').update({
          purchase_count: selectedCustomer.purchase_count + 1
        }).eq('id', selectedCustomer.id);
        if (custErr) console.error('Mijoz xaridlarini yangilashda xato:', custErr);
        await loadCustomersData();
      }

      setReceiptOrder(order);
      setReceiptTotals(t);
      setShowReceiptModal(true);
    } catch (err) {
      alert('Buyurtma saqlanmadi: ' + (err.message || err));
      console.error(err);
    }
  };

  const handleReceiptClose = () => {
    setShowReceiptModal(false);
    setCart([]);
    setTableNumber('');
    setServicePct(0);
    setDiscountInput(0);
    setPaymentMethod('naqd');
    setSelectedCustomer(null);
    setSearchCustomerVal('');
  };

  // ---------- Autocomplete Customer Input ----------
  const handleCustomerSearchChange = (e) => {
    const val = e.target.value;
    setSearchCustomerVal(val);
    setShowCustomerDropdown(val.trim() !== "");
  };

  const selectCustomer = (c) => {
    setSelectedCustomer(c);
    setShowCustomerDropdown(false);
    setSearchCustomerVal("");
  };

  const removeCustomer = () => {
    setSelectedCustomer(null);
    setSearchCustomerVal("");
  };

  const filteredCustomerAutocomplete = customers.filter(c => 
    c.name.toLowerCase().includes(searchCustomerVal.toLowerCase()) || 
    c.phone.includes(searchCustomerVal)
  );

  // ---------- Warehouse Panel Handlers ----------
  const handleAddIngredient = async () => {
    const name = newIngName.trim();
    const stock = parseFloat(newIngStock) || 0;
    const unit = newIngUnit.trim() || 'dona';

    if (!name) {
      alert("Masalliq nomini kiriting!");
      return;
    }

    if (isDemoMode) {
      const inv = JSON.parse(localStorage.getItem('cb_inventory')) || [];
      inv.push({ id: Date.now(), name, stock, unit, min_stock: 5 });
      localStorage.setItem('cb_inventory', JSON.stringify(inv));
      
      setNewIngName("");
      setNewIngStock("");
      setNewIngUnit("dona");
      await loadInventoryData(true);
      return;
    }

    const { error } = await sb.from('cb_inventory').insert({ name, stock, unit });
    if (error) {
      alert("Xatolik yuz berdi: " + error.message);
    } else {
      setNewIngName("");
      setNewIngStock("");
      setNewIngUnit("dona");
      await loadInventoryData();
    }
  };

  const editIngStock = async (id, currentStock, name, unit) => {
    const newVal = prompt(`"${name}" uchun yangi qoldiq miqdorini kiriting (${unit}):`, currentStock);
    if (newVal === null) return;
    const num = parseFloat(newVal);
    if (isNaN(num)) {
      alert("Miqdor son bo'lishi kerak!");
      return;
    }

    if (isDemoMode) {
      const inv = JSON.parse(localStorage.getItem('cb_inventory')) || [];
      const item = inv.find(x => x.id === id);
      if (item) {
        item.stock = num;
        localStorage.setItem('cb_inventory', JSON.stringify(inv));
      }
      await loadInventoryData(true);
      return;
    }

    const { error } = await sb.from('cb_inventory').update({ stock: num }).eq('id', id);
    if (error) {
      alert("Xatolik yuz berdi: " + error.message);
    } else {
      await loadInventoryData();
    }
  };

  const deleteIngredient = async (id, name) => {
    if (!confirm(`Haqiqatan ham "${name}" masallig'ini o'chirmoqchisiz? Barcha retseptlar bog'lanishi ham o'chib ketadi.`)) return;

    if (isDemoMode) {
      let inv = JSON.parse(localStorage.getItem('cb_inventory')) || [];
      inv = inv.filter(x => x.id !== id);
      localStorage.setItem('cb_inventory', JSON.stringify(inv));

      let rec = JSON.parse(localStorage.getItem('cb_recipes')) || [];
      rec = rec.filter(x => x.ingredient_id !== id);
      localStorage.setItem('cb_recipes', JSON.stringify(rec));

      await loadInventoryData(true);
      await loadRecipesData(true);
      return;
    }

    const { error } = await sb.from('cb_inventory').delete().eq('id', id);
    if (error) {
      alert("Xatolik yuz berdi: " + error.message);
    } else {
      await loadInventoryData();
      await loadRecipesData();
    }
  };

  // ---------- Recipe Handlers ----------
  const handleSaveRecipeItem = async () => {
    const productId = Number(recipeProductSelect);
    const ingredientId = Number(recipeIngSelect);
    const qty = parseFloat(recipeIngQty);

    if (!productId || !ingredientId || isNaN(qty) || qty <= 0) {
      alert("Iltimos, masalliq va to'g'ri miqdorni kiriting!");
      return;
    }

    if (isDemoMode) {
      const rec = JSON.parse(localStorage.getItem('cb_recipes')) || [];
      const existing = rec.find(r => r.product_id === productId && r.ingredient_id === ingredientId);
      if (existing) {
        existing.quantity = qty;
      } else {
        rec.push({ id: Date.now(), product_id: productId, ingredient_id: ingredientId, quantity: qty });
      }
      localStorage.setItem('cb_recipes', JSON.stringify(rec));
      setRecipeIngQty("");
      await loadRecipesData(true);
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
      setRecipeIngQty("");
      await loadRecipesData();
    }
  };

  const deleteRecipeItem = async (id) => {
    if (!confirm("Ushbu masalliqni taom tarkibidan o'chirmoqchisiz?")) return;

    if (isDemoMode) {
      let rec = JSON.parse(localStorage.getItem('cb_recipes')) || [];
      rec = rec.filter(x => x.id !== id);
      localStorage.setItem('cb_recipes', JSON.stringify(rec));
      await loadRecipesData(true);
      return;
    }

    const { error } = await sb.from('cb_recipes').delete().eq('id', id);
    if (error) {
      alert("Xatolik yuz berdi: " + error.message);
    } else {
      await loadRecipesData();
    }
  };

  // ---------- Customers Panel Handlers ----------
  const handleAddCustomer = async () => {
    const name = newCustName.trim();
    const phone = newCustPhone.trim();

    if (!name || !phone) {
      alert("Iltimos, ismi va telefon raqamini to'liq kiriting!");
      return;
    }

    if (isDemoMode) {
      const custs = JSON.parse(localStorage.getItem('cb_customers')) || [];
      const exists = custs.some(c => c.phone === phone);
      if (exists) {
        alert("Ushbu telefon raqamli mijoz allaqachon mavjud!");
        return;
      }
      const newCust = { id: Date.now(), name, phone, purchase_count: 0, created_at: new Date().toISOString() };
      custs.push(newCust);
      localStorage.setItem('cb_customers', JSON.stringify(custs));
      
      setNewCustName("");
      setNewCustPhone("");
      await loadCustomersData(true);
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
        setNewCustName("");
        setNewCustPhone("");
        await loadCustomersData();
      }
    } catch (err) {
      alert("Xatolik yuz berdi: " + err.message);
    }
  };

  const deleteCustomer = async (id) => {
    if (!confirm("Haqiqatan ham ushbu mijozni o'chirmoqchisiz?")) return;

    if (isDemoMode) {
      let custs = JSON.parse(localStorage.getItem('cb_customers')) || [];
      custs = custs.filter(x => x.id !== id);
      localStorage.setItem('cb_customers', JSON.stringify(custs));

      if (selectedCustomer && selectedCustomer.id === id) {
        setSelectedCustomer(null);
      }
      await loadCustomersData(true);
      return;
    }

    try {
      const { error } = await sb.from('cb_customers').delete().eq('id', id);
      if (error) throw error;

      if (selectedCustomer && selectedCustomer.id === id) {
        setSelectedCustomer(null);
      }
      await loadCustomersData();
    } catch (err) {
      alert("O'chirishda xatolik: " + err.message);
    }
  };

  const selectCustForOrder = (c) => {
    setSelectedCustomer(c);
    setShowCustomersModal(false);
  };

  const filteredCustomersList = customers.filter(c => {
    const val = searchCustInput.trim().toLowerCase();
    if (!val) return true;
    return c.name.toLowerCase().includes(val) || c.phone.includes(val);
  });

  // ---------- Menu Management Panel Handlers ----------
  // Reset product form clears input files correctly (Tuzatish - Bug 2)
  const resetProductForm = () => {
    setEditProdId("");
    setNewProdName("");
    setNewProdPrice("");
    setNewProdDesc("");
    setNewProdSort("0");
    setNewProdImgUrl("");
    setCurrentBase64Image("");
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clears the actual DOM input
    }
  };

  const handleFileChange = (e) => {
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
            width = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/jpeg', 0.75);
        setCurrentBase64Image(base64);
        setNewProdImgUrl(""); // Clear URL input when a file is selected
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async () => {
    const catId = Number(newProdCat);
    const name = newProdName.trim();
    const price = parseFloat(newProdPrice) || 0;
    const description = newProdDesc.trim();
    const sortOrder = parseInt(newProdSort) || 0;
    const imageUrl = currentBase64Image || newProdImgUrl.trim();

    if (!name || isNaN(price) || price <= 0) {
      alert("Iltimos, mahsulot nomi va to'g'ri narxini kiriting!");
      return;
    }

    const productData = {
      category_id: catId,
      name,
      price,
      description,
      image_url: imageUrl,
      sort_order: sortOrder,
      available: true
    };

    if (isDemoMode) {
      const prods = JSON.parse(localStorage.getItem('cb_products')) || [];
      if (editProdId) {
        const idx = prods.findIndex(x => x.id === editProdId);
        if (idx !== -1) {
          prods[idx] = { ...prods[idx], ...productData };
        }
      } else {
        prods.push({ id: Date.now(), ...productData });
      }
      localStorage.setItem('cb_products', JSON.stringify(prods));
      resetProductForm();
      await loadMenuData(true);
      return;
    }

    try {
      let error;
      if (editProdId) {
        const { error: err } = await sb.from('cb_products').update(productData).eq('id', editProdId);
        error = err;
      } else {
        const { error: err } = await sb.from('cb_products').insert(productData);
        error = err;
      }
      if (error) throw error;
      resetProductForm();
      await loadMenuData();
    } catch (err) {
      alert("Saqlashda xatolik: " + err.message);
    }
  };

  const editProduct = (p) => {
    setEditProdId(p.id);
    setNewProdCat(p.category_id.toString());
    setNewProdName(p.name);
    setNewProdPrice(p.price.toString());
    setNewProdDesc(p.description || "");
    setNewProdSort((p.sort_order || 0).toString());
    if (p.image_url) {
      if (p.image_url.startsWith("data:image/")) {
        setCurrentBase64Image(p.image_url);
        setNewProdImgUrl("");
      } else {
        setNewProdImgUrl(p.image_url);
        setCurrentBase64Image("");
      }
    } else {
      setCurrentBase64Image("");
      setNewProdImgUrl("");
    }
    // Scroll modal form area to top if possible
    const formCard = document.querySelector('.menu-edit-card');
    if (formCard) formCard.scrollTop = 0;
  };

  const deleteProduct = async (id, name) => {
    if (!confirm(`Haqiqatan ham "${name}" mahsulotini ro'yxatdan o'chirmoqchisiz?`)) return;

    if (isDemoMode) {
      let prods = JSON.parse(localStorage.getItem('cb_products')) || [];
      prods = prods.filter(x => x.id !== id);
      localStorage.setItem('cb_products', JSON.stringify(prods));

      let recs = JSON.parse(localStorage.getItem('cb_recipes')) || [];
      recs = recs.filter(x => x.product_id !== id);
      localStorage.setItem('cb_recipes', JSON.stringify(recs));

      await loadMenuData(true);
      await loadRecipesData(true);
      return;
    }

    try {
      const { error } = await sb.from('cb_products').delete().eq('id', id);
      if (error) throw error;
      await loadMenuData();
      await loadRecipesData();
    } catch (err) {
      alert("O'chirishda xatolik: " + err.message);
    }
  };

  const handleAddCategory = async () => {
    const name = newCatName.trim();
    const icon = newCatIcon.trim() || '🍔';
    const sort = parseInt(newCatSort) || 1;

    if (!name) {
      alert("Kategoriya nomini kiriting!");
      return;
    }

    const categoryData = { name, icon, sort_order: sort, visible: true };

    if (isDemoMode) {
      const cats = JSON.parse(localStorage.getItem('cb_categories')) || [];
      cats.push({ id: Date.now(), ...categoryData });
      localStorage.setItem('cb_categories', JSON.stringify(cats));
      
      setNewCatName("");
      setNewCatIcon("🍔");
      setNewCatSort("1");
      await loadMenuData(true);
      return;
    }

    try {
      const { error } = await sb.from('cb_categories').insert(categoryData);
      if (error) throw error;
      setNewCatName("");
      setNewCatIcon("🍔");
      setNewCatSort("1");
      await loadMenuData();
    } catch (err) {
      alert("Kategoriya saqlashda xatolik: " + err.message);
    }
  };

  const deleteCategory = async (id, name) => {
    if (!confirm(`Diqqat! "${name}" kategoriyasini o'chirsangiz uning ichidagi barcha mahsulotlar ham o'chib ketishi mumkin. Rozimisiz?`)) return;

    if (isDemoMode) {
      let cats = JSON.parse(localStorage.getItem('cb_categories')) || [];
      cats = cats.filter(x => x.id !== id);
      localStorage.setItem('cb_categories', JSON.stringify(cats));

      let prods = JSON.parse(localStorage.getItem('cb_products')) || [];
      prods = prods.filter(x => x.category_id !== id);
      localStorage.setItem('cb_products', JSON.stringify(prods));

      await loadMenuData(true);
      return;
    }

    try {
      const { error } = await sb.from('cb_categories').delete().eq('id', id);
      if (error) throw error;
      await loadMenuData();
    } catch (err) {
      alert("Kategoriyani o'chirishda xatolik: " + err.message);
    }
  };

  // ---------- Report Handlers ----------
  const handleOpenReports = async () => {
    setShowReportsModal(true);
    await loadReportData(reportDate);
  };

  const loadReportData = async (date) => {
    let list = [];
    if (isDemoMode) {
      const localOrders = JSON.parse(localStorage.getItem('cb_orders')) || [];
      list = localOrders.filter(o => o.status === 'paid' && o.created_at.slice(0, 10) === date);
    } else {
      try {
        const { data: orders, error } = await sb.from('cb_orders').select('*')
          .eq('status', 'paid')
          .gte('created_at', date + 'T00:00:00')
          .lte('created_at', date + 'T23:59:59.999');
        if (error) throw error;
        list = orders || [];
      } catch (err) {
        console.error("Hisobot yuklanmadi:", err);
        return;
      }
    }

    const revenue = list.reduce((s, o) => s + Number(o.total || 0), 0);
    const service = list.reduce((s, o) => s + Number(o.service_charge || 0), 0);
    const discount = list.reduce((s, o) => s + Number(o.discount || 0), 0);

    const byType = {};
    list.forEach(o => {
      byType[o.type] = byType[o.type] || { count: 0, sum: 0 };
      byType[o.type].count++;
      byType[o.type].sum += Number(o.total || 0);
    });

    let topItems = [];
    const ids = list.map(o => o.id);
    if (ids.length > 0) {
      let items = [];
      if (isDemoMode) {
        const allItems = JSON.parse(localStorage.getItem('cb_order_items')) || [];
        items = allItems.filter(it => ids.includes(it.order_id));
      } else {
        try {
          const { data, error } = await sb.from('cb_order_items').select('name, qty, subtotal').in('order_id', ids);
          if (error) throw error;
          items = data || [];
        } catch (err) {
          console.error("Hisobot elementlari yuklanmadi:", err);
        }
      }

      const agg = {};
      items.forEach(it => {
        agg[it.name] = agg[it.name] || { qty: 0, rev: 0 };
        agg[it.name].qty += Number(it.qty || 0);
        agg[it.name].rev += Number(it.subtotal || 0);
      });
      topItems = Object.entries(agg)
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.rev - a.rev)
        .slice(0, 10);
    }

    setReportData({
      ordersCount: list.length,
      revenue,
      service,
      discount,
      byType,
      topItems
    });
  };

  const handleReportDateChange = (e) => {
    const val = e.target.value;
    setReportDate(val);
    loadReportData(val);
  };

  // ---------- Drag and Drop Reordering Handlers (Admin Only) ----------
  const handleDragStart = (e, index) => {
    if (user?.role !== 'admin') {
      e.preventDefault();
      return;
    }
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDrop = async (e, index) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === index) {
      setDraggingIndex(null);
      return;
    }

    const categoryId = activeCategory;
    
    // Sort logic within the active category
    let sortedProductsList = [...products];
    const categoryProds = activeCategory === 'all'
      ? sortedProductsList
      : sortedProductsList.filter(p => p.category_id === categoryId);

    const draggedItem = categoryProds[draggingIndex];
    const targetItem = categoryProds[index];

    // Rearrange within global products list
    const draggedGlobalIdx = products.findIndex(p => p.id === draggedItem.id);
    const targetGlobalIdx = products.findIndex(p => p.id === targetItem.id);

    const reordered = [...products];
    const [removed] = reordered.splice(draggedGlobalIdx, 1);
    reordered.splice(targetGlobalIdx, 0, removed);

    // Update sort order values
    reordered.forEach((p, idx) => {
      p.sort_order = idx + 1;
    });

    setProducts(reordered);
    setDraggingIndex(null);

    // Save order
    if (isDemoMode) {
      localStorage.setItem('cb_products', JSON.stringify(reordered));
      return;
    }

    try {
      const promises = reordered.map((p, idx) => 
        sb.from('cb_products').update({ sort_order: idx + 1 }).eq('id', p.id)
      );
      await Promise.all(promises);
    } catch (err) {
      console.error("Tartibni saqlashda xatolik:", err);
    }
  };

  // ---------- Rendering Lists Helper ----------
  const visibleProductsList = activeCategory === 'all'
    ? products
    : products.filter(p => p.category_id === activeCategory);

  // ---------- Login Screen Rendering ----------
  if (!user) {
    return (
      <div className="modal open" id="login-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="modal-card login-card">
          <div className="login-header">
            <img src="/logo.png" alt="Chempion Burger Logo" className="login-logo-img" style={{ height: '70px', marginBottom: '1rem' }} />
            <p>Tizimga kirish uchun login va parolni kiriting</p>
          </div>
          <div className="login-form">
            <div className="form-group">
              <label>Profil nomi</label>
              <input 
                type="text" 
                placeholder="Sotuvchi yoki Admin" 
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                onKeyDown={handleLoginKeyDown}
                required 
              />
            </div>
            <div className="form-group">
              <label>Parol</label>
              <input 
                type="password" 
                placeholder="••••" 
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                onKeyDown={handleLoginKeyDown}
                required 
              />
            </div>
            {loginError && <div className="login-error" style={{ display: 'block' }}>{loginError}</div>}
            <button className="btn-confirm btn-block" onClick={handleLogin}>Tizimga Kirish</button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Main App Rendering ----------
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* Topbar Header */}
      <header className="topbar">
        <div className="brand">
          <img src="/logo.png" alt="Chempion Burger Logo" className="brand-logo" />
          <small>POS</small>
        </div>
        
        <div className="order-types">
          <button 
            className={`otype ${orderType === 'dine_in' ? 'active' : ''}`} 
            onClick={() => setOrderType('dine_in')}
          >
            🍽️ Zal
          </button>
          <button 
            className={`otype ${orderType === 'takeout' ? 'active' : ''}`} 
            onClick={() => setOrderType('takeout')}
          >
            🥡 Olib ketish
          </button>
          <button 
            className={`otype ${orderType === 'delivery' ? 'active' : ''}`} 
            onClick={() => setOrderType('delivery')}
          >
            🏍️ Yetkazib berish
          </button>
        </div>
        
        <div className="topbar-actions">
          {user.role === 'admin' && (
            <>
              <button className="btn-report" onClick={handleOpenReports}>📊 Hisobot</button>
              <button className="btn-report" onClick={() => { setShowWarehouseModal(true); setActiveWarehouseTab('stock'); }}>📦 Ombor</button>
              <button className="btn-report" onClick={() => { setShowMenuEditModal(true); setActiveMenuEditTab('products'); }}>⚙️ Menyu</button>
            </>
          )}
          <button className="btn-report" onClick={() => setShowCustomersModal(true)}>👥 Mijozlar</button>
          
          <div className="user-badge" style={{ display: 'flex' }}>
            <span className="user-icon">👤</span>
            <span className="user-name">{user.label}</span>
            <button className="btn-logout" onClick={handleLogout} title="Chiqish">🚪</button>
          </div>
        </div>
      </header>

      {/* Main Layout Workspace */}
      <main className="layout" style={{ flex: 1, display: "flex" }}>
        
        {/* Left Side: Product Menu */}
        <section className="menu-panel" style={{ flex: 1 }}>
          <div className="menu-panel-header">
            <div className="cat-tabs">
              <button 
                className={`cat-tab ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                Hammasi
              </button>
              {categories.map(c => (
                <button 
                  key={c.id}
                  className={`cat-tab ${activeCategory === c.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(c.id)}
                >
                  {c.icon || ''} {c.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="product-grid">
            {visibleProductsList.map((p, index) => {
              // Format descriptions to put list items on new lines if commas exist
              const descHtml = p.description 
                ? p.description.includes(',')
                  ? p.description.split(',').map((item, idx) => <React.Fragment key={idx}>• {item.trim()}<br/></React.Fragment>)
                  : p.description
                : '';
              
              return (
                <div 
                  className="product-card" 
                  key={p.id}
                  data-id={p.id}
                  draggable={user.role === 'admin'}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={(e) => {
                    if (e.target.classList.contains('drag-handle')) return;
                    addToCart(p.id);
                  }}
                >
                  {user.role === 'admin' && (
                    <div className="drag-handle" title="Tartibni o'zgartirish">☰</div>
                  )}
                  {p.image_url && (
                    <div className="p-img">
                      <img src={p.image_url} alt={p.name} />
                    </div>
                  )}
                  <div className="p-name">{p.name}</div>
                  <div className="p-desc">{descHtml}</div>
                  <div className="p-price">{fmt(p.price)}</div>
                </div>
              );
            })}
            {visibleProductsList.length === 0 && (
              <div style={{ color: "var(--muted)", padding: "2rem", width: "100%", textAlign: "center" }}>
                Bu bo'limda mahsulot yo'q.
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Cart / Checkout Panel */}
        <aside className="cart-panel" style={{ width: "380px" }}>
          <div className="cart-head">
            <h2>Buyurtma</h2>
            <span className="cart-type">{TYPE_LABEL[orderType]}</span>
          </div>

          {orderType === 'dine_in' && (
            <div className="table-row">
              <label>Stol №</label>
              <input 
                type="text" 
                placeholder="masalan: 5" 
                value={tableNumber}
                onChange={e => setTableNumber(e.target.value)}
              />
            </div>
          )}

          <div className="payment-row">
            <label>To'lov usuli</label>
            <div className="payment-methods">
              <button 
                className={`pm-btn ${paymentMethod === 'naqd' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('naqd')}
              >
                💵 Naqd
              </button>
              <button 
                className={`pm-btn ${paymentMethod === 'karta' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('karta')}
              >
                💳 Karta
              </button>
            </div>
          </div>

          <div className="customer-row">
            <label>Mijoz (Bonus: 5-xarid bepul)</label>
            <div className="customer-selector-container">
              {!selectedCustomer ? (
                <>
                  <input 
                    type="text" 
                    placeholder="Qidirish: ism yoki tel..." 
                    value={searchCustomerVal}
                    onChange={handleCustomerSearchChange}
                    autoComplete="off"
                  />
                  {showCustomerDropdown && (
                    <div className="customer-dropdown" style={{ display: 'block' }}>
                      {filteredCustomerAutocomplete.map(c => (
                        <div 
                          key={c.id}
                          className="customer-dropdown-item"
                          onClick={() => selectCustomer(c)}
                        >
                          {c.name} ({c.phone}) [Xarid: {c.purchase_count}]
                        </div>
                      ))}
                      {filteredCustomerAutocomplete.length === 0 && (
                        <div className="customer-dropdown-item" style={{ color: 'var(--muted)', cursor: 'default' }}>
                          Mijoz topilmadi
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="selected-customer-badge" style={{ display: 'flex' }}>
                  <span>{selectedCustomer.name} ({selectedCustomer.phone}) [Xaridlar: {selectedCustomer.purchase_count}]</span>
                  <button onClick={removeCustomer} type="button">✕</button>
                </div>
              )}
            </div>
            {totals.isBonusOrder && cart.length > 0 && (
              <div className="loyalty-bonus-alert" style={{ display: 'block' }}>
                🎁 <b>Bonus Xarid!</b> Eng arzon mahsulot tekin bo'ladi.
              </div>
            )}
          </div>

          <div className="cart-items">
            {cart.map((item, idx) => (
              <div className="cart-item" key={idx}>
                <div className="ci-name">{item.name}<small>{fmt(item.price)}</small></div>
                <div className="ci-qty">
                  <button onClick={() => changeQty(item.product_id, -1)}>−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => changeQty(item.product_id, 1)}>+</button>
                </div>
                <div className="ci-sum">{fmt(item.price * item.qty)}</div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="cart-empty">Savat bo'sh — taom tanlang</div>
            )}
          </div>

          <div className="cart-summary">
            <div className="sum-row"><span>Oraliq</span><b>{fmt(totals.subtotal)}</b></div>
            <div className="sum-row">
              <span>Xizmat haqi
                <input 
                  type="number" 
                  value={servicePct} 
                  onChange={e => setServicePct(e.target.value)}
                  min="0" 
                  max="100" 
                  className="pct-input" 
                /> %
              </span>
              <b>{fmt(totals.service)}</b>
            </div>
            <div className="sum-row">
              <span>Chegirma 
                <input 
                  type="number" 
                  value={discountInput}
                  onChange={e => setDiscountInput(e.target.value)}
                  min="0" 
                  className="disc-input" 
                /> so'm
              </span>
              <b>
                {totals.bonusDiscount > 0 ? (
                  `${fmt(totals.discount - totals.bonusDiscount)} + ${fmt(totals.bonusDiscount)} (Bonus)`
                ) : (
                  fmt(totals.discount)
                )}
              </b>
            </div>
            <div className="sum-row total"><span>JAMI</span><b>{fmt(totals.total)}</b></div>
          </div>

          <div className="cart-actions">
            <button className="btn-clear" onClick={clearCart}>Tozalash</button>
            <button 
              className="btn-confirm" 
              onClick={handleConfirmOrder} 
              disabled={cart.length === 0}
            >
              ✔ Tasdiqlash
            </button>
          </div>
        </aside>
      </main>

      {/* ================= MODALS ================= */}

      {/* 1. Warehouse Modal */}
      {showWarehouseModal && (
        <div className="modal open" id="warehouse-modal">
          <div className="modal-card warehouse-card">
            <div className="modal-head">
              <h2>📦 Ombor va Masalliqlar</h2>
              <button className="modal-x" onClick={() => setShowWarehouseModal(false)}>✕</button>
            </div>
            
            <div className="warehouse-tabs">
              <button 
                className={`w-tab ${activeWarehouseTab === 'stock' ? 'active' : ''}`}
                onClick={() => setActiveWarehouseTab('stock')}
              >
                Masalliqlar Qoldig'i
              </button>
              <button 
                className={`w-tab ${activeWarehouseTab === 'recipes' ? 'active' : ''}`}
                onClick={() => setActiveWarehouseTab('recipes')}
              >
                Retseptlar
              </button>
            </div>

            {/* Tab: Stock */}
            {activeWarehouseTab === 'stock' && (
              <div className="w-content active" id="w-content-stock">
                <div className="add-ingredient-form">
                  <h4>Yangi masalliq qo'shish</h4>
                  <div className="form-row">
                    <input 
                      type="text" 
                      placeholder="Masalliq nomi" 
                      value={newIngName}
                      onChange={e => setNewIngName(e.target.value)}
                    />
                    <input 
                      type="number" 
                      placeholder="Qoldiq" 
                      step="any"
                      value={newIngStock}
                      onChange={e => setNewIngStock(e.target.value)}
                    />
                    <input 
                      type="text" 
                      placeholder="Birlik" 
                      value={newIngUnit}
                      onChange={e => setNewIngUnit(e.target.value)}
                    />
                    <button className="btn-confirm" onClick={handleAddIngredient}>Qo'shish</button>
                  </div>
                </div>
                
                <div className="table-container">
                  <table className="w-table">
                    <thead>
                      <tr>
                        <th>Masalliq</th>
                        <th>Qoldiq</th>
                        <th>Birlik</th>
                        <th>Harakat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map(ing => {
                        let badgeClass = 'badge-success';
                        if (ing.stock <= 0) badgeClass = 'badge-danger';
                        else if (ing.stock <= (ing.min_stock || 5)) badgeClass = 'badge-warning';

                        return (
                          <tr key={ing.id}>
                            <td><b>{ing.name}</b></td>
                            <td><span className={`badge ${badgeClass}`}>{ing.stock}</span></td>
                            <td>{ing.unit}</td>
                            <td>
                              <button 
                                className="btn-inline-edit" 
                                onClick={() => editIngStock(ing.id, ing.stock, ing.name, ing.unit)}
                                title="Miqdorni tahrirlash"
                              >
                                ✏️
                              </button>
                              <button 
                                className="btn-inline-del" 
                                onClick={() => deleteIngredient(ing.id, ing.name)}
                                title="O'chirish"
                              >
                                ❌
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {inventory.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: "center", color: "var(--muted)", padding: "1rem" }}>
                            Omborda masalliqlar yo'q
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Recipes */}
            {activeWarehouseTab === 'recipes' && (
              <div className="w-content active" id="w-content-recipes">
                <div className="recipe-editor-container">
                  
                  <div className="recipe-select-product">
                    <label>Mahsulotni tanlang:</label>
                    <select 
                      value={recipeProductSelect}
                      onChange={e => setRecipeProductSelect(e.target.value)}
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="recipe-ingredients-list">
                    <h4>Mahsulot tarkibi:</h4>
                    <div className="table-container">
                      <table className="w-table">
                        <thead>
                          <tr>
                            <th>Masalliq</th>
                            <th>Miqdori</th>
                            <th>Birlik</th>
                            <th>O'chirish</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recipes.filter(r => r.product_id === Number(recipeProductSelect)).map(r => {
                            const ing = inventory.find(i => i.id === r.ingredient_id);
                            return (
                              <tr key={r.id}>
                                <td><b>{ing ? ing.name : "Noma'lum"}</b></td>
                                <td>{r.quantity}</td>
                                <td>{ing ? ing.unit : ""}</td>
                                <td>
                                  <button className="btn-inline-del" onClick={() => deleteRecipeItem(r.id)}>❌</button>
                                </td>
                              </tr>
                            );
                          })}
                          {recipes.filter(r => r.product_id === Number(recipeProductSelect)).length === 0 && (
                            <tr>
                              <td colSpan="4" style={{ textAlign: "center", color: "var(--muted)", padding: "1rem" }}>
                                Ushbu taom uchun tarkib kiritilmagan
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="add-recipe-item-form">
                    <h5>Masalliq qo'shish yoki miqdorini o'zgartirish</h5>
                    <div className="form-row">
                      <select 
                        value={recipeIngSelect}
                        onChange={e => setRecipeIngSelect(e.target.value)}
                      >
                        {inventory.map(i => (
                          <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                        ))}
                      </select>
                      <input 
                        type="number" 
                        placeholder="Miqdori" 
                        step="any"
                        value={recipeIngQty}
                        onChange={e => setRecipeIngQty(e.target.value)}
                      />
                      <button className="btn-confirm" onClick={handleSaveRecipeItem}>Saqlash</button>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Customers Modal */}
      {showCustomersModal && (
        <div className="modal open" id="customers-modal">
          <div className="modal-card customer-card-modal">
            <div className="modal-head">
              <h2>👥 Mijozlar Bazasi</h2>
              <button className="modal-x" onClick={() => setShowCustomersModal(false)}>✕</button>
            </div>
            
            <div className="add-customer-form">
              <h4>Yangi mijoz qo'shish</h4>
              <div className="form-row">
                <input 
                  type="text" 
                  placeholder="F.I.O." 
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="Telefon (masalan: +998901234567)" 
                  value={newCustPhone}
                  onChange={e => setNewCustPhone(e.target.value)}
                />
                <button className="btn-confirm" onClick={handleAddCustomer}>Qo'shish</button>
              </div>
            </div>

            <div className="search-cust-row">
              <input 
                type="text" 
                placeholder="Mijozni qidirish (ism yoki tel)..." 
                value={searchCustInput}
                onChange={e => setSearchCustInput(e.target.value)}
              />
            </div>

            <div className="table-container">
              <table className="w-table">
                <thead>
                  <tr>
                    <th>F.I.O.</th>
                    <th>Telefon</th>
                    <th>Xaridlar soni</th>
                    <th>Harakat</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomersList.map(c => (
                    <tr key={c.id}>
                      <td><b>{c.name}</b></td>
                      <td>{c.phone}</td>
                      <td><span className="badge badge-success">{c.purchase_count} ta xarid</span></td>
                      <td>
                        <button 
                          className="btn-inline-edit" 
                          onClick={() => selectCustForOrder(c)} 
                          style={{ color: "var(--green)" }}
                        >
                          ✅ Tanlash
                        </button>
                        <button className="btn-inline-del" onClick={() => deleteCustomer(c.id)}>❌</button>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomersList.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", color: "var(--muted)", padding: "1rem" }}>
                        Mijozlar topilmadi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Menu Management Modal */}
      {showMenuEditModal && (
        <div className="modal open" id="menu-edit-modal">
          <div className="modal-card menu-edit-card">
            <div className="modal-head">
              <h2>⚙️ Menyu Boshqaruvi</h2>
              <button className="modal-x" onClick={() => { setShowMenuEditModal(false); resetProductForm(); }}>✕</button>
            </div>

            <div className="warehouse-tabs">
              <button 
                className={`w-tab ${activeMenuEditTab === 'products' ? 'active' : ''}`}
                onClick={() => { setActiveMenuEditTab('products'); resetProductForm(); }}
              >
                Mahsulotlar
              </button>
              <button 
                className={`w-tab ${activeMenuEditTab === 'categories' ? 'active' : ''}`}
                onClick={() => setActiveMenuEditTab('categories')}
              >
                Kategoriyalar
              </button>
            </div>

            {/* Tab: Products */}
            {activeMenuEditTab === 'products' && (
              <div className="w-content active" id="me-content-products">
                <div className="add-product-form">
                  <h4 id="product-form-title">{editProdId ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Kategoriya</label>
                      <select 
                        value={newProdCat}
                        onChange={e => setNewProdCat(e.target.value)}
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Nomi</label>
                      <input 
                        type="text" 
                        placeholder="Masalan: Hamburger Special" 
                        value={newProdName}
                        onChange={e => setNewProdName(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Narxi (so'm)</label>
                      <input 
                        type="number" 
                        placeholder="Narxi" 
                        value={newProdPrice}
                        onChange={e => setNewProdPrice(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Tavsifi</label>
                      <input 
                        type="text" 
                        placeholder="Tarkibi va ta'rifi" 
                        value={newProdDesc}
                        onChange={e => setNewProdDesc(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Tartib raqami</label>
                      <input 
                        type="number" 
                        placeholder="Tartib (masalan: 1, 2...)" 
                        value={newProdSort}
                        onChange={e => setNewProdSort(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: "span 2" }}>
                      <label>Mahsulot rasmi</label>
                      <div className="image-upload-wrapper">
                        <input 
                          type="text" 
                          placeholder="Rasm URL havolasi (ixtiyoriy)" 
                          value={newProdImgUrl}
                          onChange={e => {
                            setNewProdImgUrl(e.target.value);
                            setCurrentBase64Image("");
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                        />
                        <span style={{ color: "var(--muted)", fontSize: "0.8rem", textAlign: "center" }}>yoki</span>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          accept="image/*" 
                          className="file-input-btn" 
                          onChange={handleFileChange}
                        />
                      </div>
                      
                      {/* Base64 preview (tuzatish) */}
                      {(currentBase64Image || newProdImgUrl) && (
                        <div className="img-preview-box" style={{ display: "block" }}>
                          <img src={currentBase64Image || newProdImgUrl} alt="Preview" />
                          <button 
                            type="button" 
                            onClick={() => {
                              setCurrentBase64Image("");
                              setNewProdImgUrl("");
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-actions-row">
                    <button className="btn-confirm" onClick={handleSaveProduct}>Saqlash</button>
                    {editProdId && (
                      <button className="btn-secondary" onClick={resetProductForm}>Bekor qilish</button>
                    )}
                  </div>
                </div>

                <div className="table-container">
                  <table className="w-table">
                    <thead>
                      <tr>
                        <th>Rasm</th>
                        <th>Mahsulot nomi</th>
                        <th>Kategoriya</th>
                        <th>Narxi</th>
                        <th>Harakat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => {
                        const cat = categories.find(c => c.id === p.category_id);
                        return (
                          <tr key={p.id}>
                            <td>
                              {p.image_url ? (
                                <img src={p.image_url} className="img-in-table" alt="" />
                              ) : (
                                <div style={{ textAlign: "center", fontSize: "1.2rem" }}>🍔</div>
                              )}
                            </td>
                            <td><b>{p.name}</b></td>
                            <td>{cat ? cat.name : "—"}</td>
                            <td>{fmt(p.price)}</td>
                            <td>
                              <button className="btn-inline-edit" onClick={() => editProduct(p)}>✏️</button>
                              <button className="btn-inline-del" onClick={() => deleteProduct(p.id, p.name)}>❌</button>
                            </td>
                          </tr>
                        );
                      })}
                      {products.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: "center", color: "var(--muted)", padding: "1rem" }}>
                            Mahsulotlar yo'q
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Categories */}
            {activeMenuEditTab === 'categories' && (
              <div className="w-content active" id="me-content-categories">
                <div className="add-category-form">
                  <h4>Yangi kategoriya qo'shish</h4>
                  <div className="form-row">
                    <input 
                      type="text" 
                      placeholder="Kategoriya nomi" 
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                    />
                    <input 
                      type="text" 
                      placeholder="Emoji (masalan: 🍕)" 
                      value={newCatIcon}
                      onChange={e => setNewCatIcon(e.target.value)}
                    />
                    <input 
                      type="number" 
                      placeholder="Tartib raqami" 
                      value={newCatSort}
                      onChange={e => setNewCatSort(e.target.value)}
                    />
                    <button className="btn-confirm" onClick={handleAddCategory}>Qo'shish</button>
                  </div>
                </div>

                <div className="table-container">
                  <table className="w-table">
                    <thead>
                      <tr>
                        <th>Emoji</th>
                        <th>Kategoriya nomi</th>
                        <th>Tartibi</th>
                        <th>Harakat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(c => (
                        <tr key={c.id}>
                          <td style={{ fontSize: "1.3rem", textAlign: "center" }}>{c.icon || ''}</td>
                          <td><b>{c.name}</b></td>
                          <td>{c.sort_order}</td>
                          <td>
                            <button className="btn-inline-del" onClick={() => deleteCategory(c.id, c.name)}>❌</button>
                          </td>
                        </tr>
                      ))}
                      {categories.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: "center", color: "var(--muted)", padding: "1rem" }}>
                            Kategoriyalar yo'q
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Daily Reports Modal */}
      {showReportsModal && (
        <div className="modal open" id="reports-modal">
          <div className="modal-card">
            <div className="modal-head">
              <h2>📊 Kunlik Hisobot</h2>
              <button className="modal-x" onClick={() => setShowReportsModal(false)}>✕</button>
            </div>
            <input 
              type="date" 
              className="report-date"
              value={reportDate}
              onChange={handleReportDateChange}
            />
            
            {reportData ? (
              <div className="report-body" style={{ display: "block" }}>
                <div className="kpi-grid">
                  <div className="kpi"><small>Buyurtmalar</small><b>{reportData.ordersCount} ta</b></div>
                  <div className="kpi"><small>Tushum</small><b>{fmt(reportData.revenue)}</b></div>
                  <div className="kpi"><small>Xizmat haqi</small><b>{fmt(reportData.service)}</b></div>
                  <div className="kpi"><small>Chegirma</small><b>{fmt(reportData.discount)}</b></div>
                </div>
                
                <h4>Buyurtma turlari</h4>
                {Object.keys(reportData.byType).map(k => (
                  <div className="rrow" key={k}>
                    <span>{TYPE_LABEL[k] || k}</span>
                    <span>{reportData.byType[k].count} ta · {fmt(reportData.byType[k].sum)}</span>
                  </div>
                ))}
                {Object.keys(reportData.byType).length === 0 && (
                  <div className="rrow"><span>—</span></div>
                )}
                
                <h4>Eng ko'p sotilgan mahsulotlar</h4>
                {reportData.topItems.map((p, idx) => (
                  <div className="rrow" key={idx}>
                    <span>{p.name}</span>
                    <span>{p.qty} dona · {fmt(p.rev)}</span>
                  </div>
                ))}
                {reportData.topItems.length === 0 && (
                  <div className="rrow"><span>Sotuv yo'q</span></div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "2rem" }}>Yuklanmoqda...</div>
            )}
          </div>
        </div>
      )}

      {/* 5. Checkout Receipt Modal */}
      {showReceiptModal && receiptOrder && receiptTotals && (
        <div className="modal open" id="receipt-modal">
          <div className="modal-card receipt">
            <div id="receipt-body">
              <div className="r-store">
                <img src="/logo.png" alt="Chempion Burger" style={{ height: "48px", marginBottom: "0.4rem" }} />
                <small>Chek: #{receiptOrder.order_number}</small>
              </div>
              <div className="r-line"><span>Sana</span><span>{new Date(receiptOrder.created_at).toLocaleString('uz-UZ')}</span></div>
              <div className="r-line"><span>Turi</span><span>{TYPE_LABEL[receiptOrder.type]}</span></div>
              {receiptOrder.table_number && <div className="r-line"><span>Stol</span><span>№{receiptOrder.table_number}</span></div>}
              {selectedCustomer && <div className="r-line"><span>Mijoz</span><span>{selectedCustomer.name}</span></div>}
              <div className="r-line"><span>To'lov usuli</span><span>{PM_LABEL[receiptOrder.payment_method] || receiptOrder.payment_method}</span></div>
              
              <div className="r-items">
                {cart.map((i, idx) => (
                  <div className="r-line" key={idx}>
                    <span>{i.name} ×{i.qty}</span>
                    <b>{fmt(i.price * i.qty)}</b>
                  </div>
                ))}
              </div>
              
              <div className="r-line"><span>Oraliq</span><span>{fmt(receiptTotals.subtotal)}</span></div>
              <div className="r-line"><span>Xizmat haqi</span><span>{fmt(receiptTotals.service)}</span></div>
              <div className="r-line"><span>Chegirma</span><span>{fmt(receiptTotals.discount)}</span></div>
              <div className="r-total"><span>JAMI</span><b>{fmt(receiptTotals.total)}</b></div>
            </div>
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => window.print()}>🖨 Chop etish</button>
              <button className="btn-confirm" onClick={handleReceiptClose}>Yangi buyurtma</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
