-- ============================================================================
--  Chempion Burger POS — Supabase sozlash (BIR MARTALIK)
--  Supabase → SQL Editor → quyidagini yopishtirib "Run" bosing.
--  Jadvallar "cb_" prefiksli (boshqa loyiha ma'lumotiga aralashmaydi).
-- ============================================================================

-- ---------- Jadvallar ----------
create table if not exists cb_categories (
  id          bigint primary key generated always as identity,
  name        text not null,
  icon        text default '🍔',
  sort_order  int default 0,
  visible     boolean default true
);

create table if not exists cb_products (
  id          bigint primary key generated always as identity,
  category_id bigint references cb_categories(id) on delete cascade,
  name        text not null,
  price       numeric default 0,
  description text default '',
  image_url   text default '',
  sort_order  int default 0,
  available   boolean default true
);

create table if not exists cb_customers (
  id             bigint primary key generated always as identity,
  name           text not null,
  phone          text not null unique,
  purchase_count int default 0,
  created_at     timestamptz default now()
);

create table if not exists cb_orders (
  id             bigint primary key generated always as identity,
  order_number   text,
  type           text default 'dine_in',
  table_number   text,
  status         text default 'open',
  subtotal       numeric default 0,
  service_charge numeric default 0,
  discount       numeric default 0,
  total          numeric default 0,
  cashier        text default '',
  payment_method text default 'naqd',
  customer_id    bigint references cb_customers(id) on delete set null,
  note           text default '',
  created_at     timestamptz default now(),
  paid_at        timestamptz
);

create table if not exists cb_order_items (
  id         bigint primary key generated always as identity,
  order_id   bigint references cb_orders(id) on delete cascade,
  product_id bigint,
  name       text,
  price      numeric,
  qty        int,
  subtotal   numeric
);

-- ---------- Inventory & Recipes Tables ----------
create table if not exists cb_inventory (
  id          bigint primary key generated always as identity,
  name        text not null unique,
  stock       numeric default 0,
  unit        text default 'dona',
  min_stock   numeric default 5
);

create table if not exists cb_recipes (
  id            bigint primary key generated always as identity,
  product_id    bigint references cb_products(id) on delete cascade,
  ingredient_id bigint references cb_inventory(id) on delete cascade,
  quantity      numeric not null,
  constraint cb_recipes_uniq unique (product_id, ingredient_id)
);

-- ---------- Mavjud jadvallarni yangilash uchun tezkor buyruqlar ----------
alter table cb_orders add column if not exists payment_method text default 'naqd';
alter table cb_orders add column if not exists customer_id bigint;
alter table cb_products add column if not exists image_url text default '';
alter table cb_products add column if not exists sort_order int default 0;

-- ---------- Constraints Yangilash ----------
alter table cb_orders drop constraint if exists cb_orders_customer_id_fkey;
alter table cb_orders add constraint cb_orders_customer_id_fkey foreign key (customer_id) references cb_customers(id) on delete set null;

-- ---------- RLS (xavfsizlik) ----------
alter table cb_categories  enable row level security;
alter table cb_products    enable row level security;
alter table cb_customers   enable row level security;
alter table cb_orders      enable row level security;
alter table cb_order_items enable row level security;
alter table cb_inventory   enable row level security;
alter table cb_recipes     enable row level security;

-- Menyu & Mijozlar: o'qish va yozish anonim
drop policy if exists cb_cat_read on cb_categories;
create policy cb_cat_read on cb_categories for select to anon, authenticated using (true);
drop policy if exists cb_prod_read on cb_products;
create policy cb_prod_read on cb_products for select to anon, authenticated using (true);

drop policy if exists cb_cust_all on cb_customers;
create policy cb_cust_all on cb_customers for all to anon, authenticated using (true) with check (true);

-- Buyurtmalar: o'qish + yozish + yangilash
drop policy if exists cb_ord_read on cb_orders;
create policy cb_ord_read on cb_orders for select to anon, authenticated using (true);
drop policy if exists cb_ord_insert on cb_orders;
create policy cb_ord_insert on cb_orders for insert to anon, authenticated with check (true);
drop policy if exists cb_ord_update on cb_orders;
create policy cb_ord_update on cb_orders for update to anon, authenticated using (true) with check (true);

drop policy if exists cb_item_read on cb_order_items;
create policy cb_item_read on cb_order_items for select to anon, authenticated using (true);
drop policy if exists cb_item_insert on cb_order_items;
create policy cb_item_insert on cb_order_items for insert to anon, authenticated with check (true);

-- Inventory & Recipes: O'qish va Yozish
drop policy if exists cb_inv_all on cb_inventory;
create policy cb_inv_all on cb_inventory for all to anon, authenticated using (true) with check (true);
drop policy if exists cb_rec_all on cb_recipes;
create policy cb_rec_all on cb_recipes for all to anon, authenticated using (true) with check (true);

-- ---------- Stored function for stock deduction ----------
create or replace function cb_deduct_inventory(p_ingredient_id bigint, p_qty numeric)
returns void language plpgsql as $$
begin
  update cb_inventory
  set stock = stock - p_qty
  where id = p_ingredient_id;
end;
$$;

-- ---------- Real Kategoriyalar Yuklash ----------
insert into cb_categories (name, icon, sort_order)
select * from (values
  ('Burgerlar', '🍔', 1),
  ('Hot-doglar', '🌭', 2),
  ('Non kaboblar', '🌯', 3),
  ('Setlar', '🍟', 4),
  ('Ichimliklar', '🥤', 5),
  ('Souslar', '🥫', 6)
) as v(name, icon, sort_order)
where not exists (select 1 from cb_categories);

-- ---------- Real Mahsulotlar Yuklash (Flyer & Menu asosida) ----------
insert into cb_products (category_id, name, price, description)
select c.id, p.name, p.price, p.description
from (values
  -- Burgerlar
  ('Burgerlar', 'Ghamburger', 33000, 'Bulochka, kotlet, bodring, pamidor, sho''r bodring, salat barg, firmenniy sous, qizil piyoz'),
  ('Burgerlar', 'Cheeseburger', 35000, 'Bulochka, kotlet, bodring, pamidor, sho''r bodring, salat barg, firmenniy sous, qizil piyoz, sir'),
  ('Burgerlar', 'Bigburger', 50000, 'Bulochka, kotlet 2ta, bodring, pamidor, sho''r bodring, salat barg, firmenniy sous, qizil piyoz'),
  ('Burgerlar', 'Bigburger Sirli', 53000, 'Bulochka, kotlet 2ta, bodring, pamidor, sho''r bodring, salat barg, firmenniy sous, qizil piyoz, sir'),
  ('Burgerlar', 'KFC Burger', 25000, 'Bulochka, KFC, bodring, pamidor, sho''r bodring, salat barg, firmenniy sous'),
  
  -- Non Kaboblar
  ('Non kaboblar', 'Non Kabob', 42000, 'Qiyma kabob 2ta, non, piyoz, pamidor, firmenniy sous'),
  ('Non kaboblar', 'Non Chicken KFC', 30000, 'Tovuq, non, svejiy bodring, chisnochniy sous'),
  ('Non kaboblar', 'Non Donar', 42000, 'Donar go''sht, non, svejiy bodring, chisnochniy sous'),
  
  -- Hot-doglar
  ('Hot-doglar', 'Hot Dog Canadskiy', 12000, 'Bulochka, sosiska, bodring, pamidor, ketchup, mayonez'),
  ('Hot-doglar', 'Hot Dog Canadskiy 2X', 16000, 'Bulochka, sosiska 2ta, bodring, pamidor, ketchup, mayonez, chips'),
  ('Hot-doglar', 'Hot Dog Oddiy', 10000, 'Bulochka, sosiska, sabzi salat, ketchup, mayonez'),
  ('Hot-doglar', 'Hot Dog Oddiy 2X', 13000, 'Bulochka, sosiska 2ta, sabzi salat, ketchup, mayonez'),
  ('Hot-doglar', 'Go''shtli Hot-Dog', 25000, 'Bulochka, go''sht (donar), bodring, pamidor, firmenniy sous, mayonez, chips'),
  ('Hot-doglar', 'Big Hot-Dog', 42000, 'Bulochka katta, kotlet 1.5ta, sosiska 2ta, bodring, pamidor, firmenniy sous, mayonez, indeyka'),
  ('Hot-doglar', 'Kabob Hot-Dog', 45000, 'Bulochka, qiyma, piyoz, firmenniy sous, indeyka'),
  ('Hot-doglar', 'Longer', 22000, 'Bulochka, KFC (grudka), bodring, pamidor, ketchup, mayonez, salat barg'),
  
  -- Setlar
  ('Setlar', 'Set 1', 45000, 'Ghamburger, fri, Pepsi 0.5l'),
  ('Setlar', 'Set 2', 60000, 'Non Kabob, fri, Pepsi 0.5l'),
  ('Setlar', 'Set 3', 42000, 'Go''shtli hot dog, fri, Pepsi 0.5l'),
  ('Setlar', 'Set 4', 43000, 'KFC Burger, fri, Pepsi 0.5l'),
  
  -- Ichimliklar & Garnirlar
  ('Ichimliklar', 'Pepsi 0.5l', 8000, ''),
  ('Ichimliklar', 'Coca-Cola 0.5l', 8000, ''),
  ('Ichimliklar', 'Fanta 0.5l', 8000, ''),
  ('Ichimliklar', 'Suv 0.5l', 4000, ''),
  ('Ichimliklar', 'Fri kartoshka 110g', 15000, ''),
  
  -- Souslar
  ('Souslar', 'Ketchup', 2000, ''),
  ('Souslar', 'Mayonez', 2000, '')
) as p(cat, name, price, description)
join cb_categories c on c.name = p.cat
where not exists (select 1 from cb_products);

-- ---------- Real Ombor Masalliqlari Yuklash ----------
insert into cb_inventory (name, stock, unit, min_stock)
select * from (values
  ('Bulochka (burger)', 100, 'dona', 20),
  ('Kotlet (burger)', 150, 'dona', 25),
  ('Bulochka (hot-dog)', 100, 'dona', 20),
  ('Sosiska', 100, 'dona', 20),
  ('Non (kabob)', 80, 'dona', 15),
  ('Tovuq (KFC)', 10, 'kg', 2),
  ('Go''sht (donar)', 12, 'kg', 3),
  ('Fri (kartoshka)', 15, 'kg', 3),
  ('Pepsi 0.5l', 120, 'dona', 20),
  ('Ketchup', 3000, 'g', 500),
  ('Mayonez', 3000, 'g', 500),
  ('Sabzi salat', 5, 'kg', 1),
  ('Pishloq (sir)', 100, 'dona', 20)
) as v(name, stock, unit, min_stock)
where not exists (select 1 from cb_inventory);

-- ---------- Real Taomlar Retseptlari Setup ----------
insert into cb_recipes (product_id, ingredient_id, quantity)
select p.id, i.id, r.qty
from (values
  -- Burgerlar
  ('Ghamburger', 'Bulochka (burger)', 1),
  ('Ghamburger', 'Kotlet (burger)', 1),
  ('Ghamburger', 'Ketchup', 10),
  ('Ghamburger', 'Mayonez', 10),
  ('Cheeseburger', 'Bulochka (burger)', 1),
  ('Cheeseburger', 'Kotlet (burger)', 1),
  ('Cheeseburger', 'Pishloq (sir)', 1),
  ('Cheeseburger', 'Ketchup', 10),
  ('Cheeseburger', 'Mayonez', 10),
  ('Bigburger', 'Bulochka (burger)', 1),
  ('Bigburger', 'Kotlet (burger)', 2),
  ('Bigburger', 'Ketchup', 15),
  ('Bigburger', 'Mayonez', 15),
  ('Bigburger Sirli', 'Bulochka (burger)', 1),
  ('Bigburger Sirli', 'Kotlet (burger)', 2),
  ('Bigburger Sirli', 'Pishloq (sir)', 1),
  ('Bigburger Sirli', 'Ketchup', 15),
  ('Bigburger Sirli', 'Mayonez', 15),
  ('KFC Burger', 'Bulochka (burger)', 1),
  ('KFC Burger', 'Tovuq (KFC)', 0.12),
  ('KFC Burger', 'Mayonez', 15),
  
  -- Hot-doglar
  ('Hot Dog Canadskiy', 'Bulochka (hot-dog)', 1),
  ('Hot Dog Canadskiy', 'Sosiska', 1),
  ('Hot Dog Canadskiy', 'Ketchup', 15),
  ('Hot Dog Canadskiy', 'Mayonez', 15),
  ('Hot Dog Canadskiy 2X', 'Bulochka (hot-dog)', 1),
  ('Hot Dog Canadskiy 2X', 'Sosiska', 2),
  ('Hot Dog Canadskiy 2X', 'Ketchup', 20),
  ('Hot Dog Canadskiy 2X', 'Mayonez', 20),
  ('Hot Dog Oddiy', 'Bulochka (hot-dog)', 1),
  ('Hot Dog Oddiy', 'Sosiska', 1),
  ('Hot Dog Oddiy', 'Sabzi salat', 0.05),
  ('Hot Dog Oddiy', 'Ketchup', 10),
  ('Hot Dog Oddiy', 'Mayonez', 10),
  ('Hot Dog Oddiy 2X', 'Bulochka (hot-dog)', 1),
  ('Hot Dog Oddiy 2X', 'Sosiska', 2),
  ('Hot Dog Oddiy 2X', 'Sabzi salat', 0.06),
  ('Hot Dog Oddiy 2X', 'Ketchup', 15),
  ('Hot Dog Oddiy 2X', 'Mayonez', 15),
  ('Go''shtli Hot-Dog', 'Bulochka (hot-dog)', 1),
  ('Go''shtli Hot-Dog', 'Go''sht (donar)', 0.08),
  ('Go''shtli Hot-Dog', 'Mayonez', 15),
  ('Big Hot-Dog', 'Bulochka (hot-dog)', 1),
  ('Big Hot-Dog', 'Sosiska', 2),
  ('Big Hot-Dog', 'Kotlet (burger)', 1.5),
  ('Big Hot-Dog', 'Mayonez', 20),
  ('Longer', 'Bulochka (hot-dog)', 1),
  ('Longer', 'Tovuq (KFC)', 0.1),
  ('Longer', 'Ketchup', 10),
  ('Longer', 'Mayonez', 10),
  
  -- Non Kaboblar
  ('Non Kabob', 'Non (kabob)', 1),
  ('Non Kabob', 'Kotlet (burger)', 2),
  ('Non Chicken KFC', 'Non (kabob)', 1),
  ('Non Chicken KFC', 'Tovuq (KFC)', 0.12),
  ('Non Donar', 'Non (kabob)', 1),
  ('Non Donar', 'Go''sht (donar)', 0.1),
  
  -- Setlar
  ('Set 1', 'Bulochka (burger)', 1),
  ('Set 1', 'Kotlet (burger)', 1),
  ('Set 1', 'Fri (kartoshka)', 0.11),
  ('Set 1', 'Pepsi 0.5l', 1),
  ('Set 2', 'Non (kabob)', 1),
  ('Set 2', 'Kotlet (burger)', 2),
  ('Set 2', 'Fri (kartoshka)', 0.11),
  ('Set 2', 'Pepsi 0.5l', 1),
  ('Set 3', 'Bulochka (hot-dog)', 1),
  ('Set 3', 'Go''sht (donar)', 0.08),
  ('Set 3', 'Fri (kartoshka)', 0.11),
  ('Set 3', 'Pepsi 0.5l', 1),
  ('Set 4', 'Bulochka (burger)', 1),
  ('Set 4', 'Tovuq (KFC)', 0.12),
  ('Set 4', 'Fri (kartoshka)', 0.11),
  ('Set 4', 'Pepsi 0.5l', 1)
) as r(prod_name, ing_name, qty)
join cb_products p on p.name = r.prod_name
join cb_inventory i on i.name = r.ing_name
where not exists (select 1 from cb_recipes);
