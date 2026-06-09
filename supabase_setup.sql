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

-- ---------- RLS (xavfsizlik) ----------
alter table cb_categories  enable row level security;
alter table cb_products    enable row level security;
alter table cb_orders      enable row level security;
alter table cb_order_items enable row level security;

-- Menyu: to'liq huquqlar (Admin panel ishlashi uchun)
drop policy if exists cb_cat_read on cb_categories;
drop policy if exists cb_cat_all on cb_categories;
create policy cb_cat_all on cb_categories for all to anon, authenticated using (true) with check (true);

drop policy if exists cb_prod_read on cb_products;
drop policy if exists cb_prod_all on cb_products;
create policy cb_prod_all on cb_products for all to anon, authenticated using (true) with check (true);

-- Buyurtmalar: o'qish + yozish + yangilash (DELETE yo'q — xavfsizlik)
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

-- ---------- Namuna menyu (faqat bo'sh bo'lsa) ----------
insert into cb_categories (name, icon, sort_order)
select * from (values
  ('Burgerlar', '🍔', 1),
  ('Setlar', '🍟', 2),
  ('Garnirlar', '🍗', 3),
  ('Ichimliklar', '🥤', 4),
  ('Souslar', '🥫', 5),
  ('Shirinliklar', '🍰', 6)
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
