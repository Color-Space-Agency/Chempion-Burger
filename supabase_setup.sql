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
  available   boolean default true
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

-- ---------- RLS (xavfsizlik) ----------
alter table cb_categories  enable row level security;
alter table cb_products    enable row level security;
alter table cb_orders      enable row level security;
alter table cb_order_items enable row level security;
alter table cb_inventory   enable row level security;
alter table cb_recipes     enable row level security;

-- Menyu: faqat o'qish
drop policy if exists cb_cat_read on cb_categories;
create policy cb_cat_read on cb_categories for select to anon, authenticated using (true);
drop policy if exists cb_prod_read on cb_products;
create policy cb_prod_read on cb_products for select to anon, authenticated using (true);

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

-- ---------- Namuna menyu (faqat bo'sh bo'lsa) ----------
insert into cb_categories (name, icon, sort_order)
select * from (values
  ('Burgerlar', '🍔', 1),
  ('Hot-doglar', '🌭', 2),
  ('Setlar', '🍟', 3),
  ('Garnirlar', '🍗', 4),
  ('Ichimliklar', '🥤', 5),
  ('Souslar', '🥫', 6),
  ('Shirinliklar', '🍰', 7)
) as v(name, icon, sort_order)
where not exists (select 1 from cb_categories);

-- Mahsulotlar (kategoriya nomi bo'yicha bog'lanadi)
insert into cb_products (category_id, name, price, description)
select c.id, p.name, p.price, p.description
from (values
  ('Burgerlar', 'Chempion Burger', 39000, 'Ikki qavat mol go''shti, chedder, maxsus sous'),
  ('Burgerlar', 'Cheeseburger', 28000, 'Klassik pishloqli burger'),
  ('Burgerlar', 'Double Burger', 45000, 'Ikki qavat go''sht, ikki pishloq'),
  ('Burgerlar', 'Chicken Burger', 32000, 'Tovuq filesi, salat, sous'),
  ('Burgerlar', 'Spicy Burger', 34000, 'Achchiq sous bilan'),
  ('Hot-doglar', 'Klassik Hot-dog', 18000, 'Sosiska, bulochka, ketchup, mayonez'),
  ('Setlar', 'Chempion Set', 55000, 'Burger + fri + ichimlik'),
  ('Setlar', 'Klassik Set', 42000, 'Cheeseburger + fri + cola'),
  ('Garnirlar', 'Fri kartoshka', 15000, 'Yirik bo''lakli'),
  ('Garnirlar', 'Nuggets (6 dona)', 22000, 'Tovuq nuggets'),
  ('Garnirlar', 'Onion rings', 18000, 'Piyoz halqalari'),
  ('Ichimliklar', 'Coca-Cola 0.5', 8000, ''),
  ('Ichimliklar', 'Fanta 0.5', 8000, ''),
  ('Ichimliklar', 'Suv 0.5', 4000, ''),
  ('Ichimliklar', 'Choy', 5000, ''),
  ('Ichimliklar', 'Kofe', 12000, ''),
  ('Souslar', 'Ketchup', 2000, ''),
  ('Souslar', 'Mayonez', 2000, ''),
  ('Souslar', 'Cheese sous', 5000, ''),
  ('Shirinliklar', 'Muzqaymoq', 12000, ''),
  ('Shirinliklar', 'Brauni', 15000, 'Shokoladli')
) as p(cat, name, price, description)
join cb_categories c on c.name = p.cat
where not exists (select 1 from cb_products);

-- ---------- Default Inventory Items ----------
insert into cb_inventory (name, stock, unit, min_stock)
select * from (values
  ('Bulochka (hot-dog)', 50, 'dona', 10),
  ('Sosiska', 50, 'dona', 10),
  ('Bulochka (burger)', 100, 'dona', 20),
  ('Mol go''shti (kotlet)', 100, 'dona', 20),
  ('Chedder pishlog''i', 100, 'dona', 20),
  ('Ketchup', 2000, 'g', 500),
  ('Mayonez', 2000, 'g', 500),
  ('Maxsus sous', 1500, 'g', 300)
) as v(name, stock, unit, min_stock)
where not exists (select 1 from cb_inventory);

-- ---------- Default Recipes Setup ----------
insert into cb_recipes (product_id, ingredient_id, quantity)
select p.id, i.id, r.qty
from (values
  ('Klassik Hot-dog', 'Bulochka (hot-dog)', 1),
  ('Klassik Hot-dog', 'Sosiska', 1),
  ('Klassik Hot-dog', 'Ketchup', 15),
  ('Klassik Hot-dog', 'Mayonez', 15),
  ('Chempion Burger', 'Bulochka (burger)', 1),
  ('Chempion Burger', 'Mol go''shti (kotlet)', 2),
  ('Chempion Burger', 'Chedder pishlog''i', 1),
  ('Chempion Burger', 'Ketchup', 10),
  ('Chempion Burger', 'Mayonez', 10)
) as r(prod_name, ing_name, qty)
join cb_products p on p.name = r.prod_name
join cb_inventory i on i.name = r.ing_name
where not exists (select 1 from cb_recipes);
