# 🍔 Chempion Burger — Restoran POS

Restoran/kafe kassa (POS) tizimi. **Statik frontend (HTML/CSS/JS) + Supabase.**
Vercel'da deploy qilinadi (serversiz). Ma'lumot Supabase'da (`cb_` prefiksli jadvallar).

## Sozlash (bir martalik)

1. **Supabase** → loyihangiz → **SQL Editor** → `supabase_setup.sql` faylini yopishtirib **Run**.
   (Jadvallar, RLS va namuna menyu yaratiladi.)
2. (Ixtiyoriy) Boshqa Supabase proyekti ishlatmoqchi bo'lsangiz, `app.js` boshidagi
   `SUPABASE_URL` va `SUPABASE_KEY` ni almashtiring.

## Lokal ishga tushirish
Oddiy statik server yetarli:
```bash
npx -y serve -l 3000      # yoki istalgan statik server
```
So'ng: http://localhost:3000

## Vercel'ga deploy
- GitHub repo'ni Vercel'ga ulang (Import) → framework "Other" → Deploy.
- Build kerak emas (statik). Root'dagi `index.html` ishlaydi.

## Tuzilma
```
index.html            POS interfeysi
style.css             uslub
app.js                mantiq (Supabase client)
supabase_setup.sql    baza sxemasi + RLS + namuna menyu (bir marta Run)
```

## Imkoniyatlar
- Menyu (kategoriya + mahsulot), savat, miqdor +/−
- Buyurtma turlari: **Zal / Olib ketish / Yetkazib berish**
- Xizmat haqi (%), chegirma, jami
- Tasdiqlash → Supabase'ga saqlash → chek
- Kunlik hisobot (tushum, turlar, eng ko'p sotilgan)

## Keyingi bosqichlar
Termal printer · rollar (kassir/admin) · stol xaritasi · ombor · Click/Payme to'lov.
