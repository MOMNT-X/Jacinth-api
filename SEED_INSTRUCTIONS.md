# Database Seeding Instructions

## Overview
This seed script will populate your database with demo products and categories that match the frontend mock data.

## Prerequisites
1. Make sure your `.env` file has the correct database connection strings:
   ```env
   DATABASE_URL="postgresql://postgres:PASSWORD@HOST.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgresql://postgres:PASSWORD@HOST.pooler.supabase.com:5432/postgres"
   ```

2. Make sure migrations are up to date:
   ```bash
   npx prisma migrate deploy
   # or
   npx prisma db push
   ```

## Running the Seed Script

### Option 1: Using npm script
```bash
cd jacinth-backend
npm run prisma:seed
```

### Option 2: Using Prisma CLI directly
```bash
cd jacinth-backend
npx prisma db seed
```

### Option 3: Using ts-node directly
```bash
cd jacinth-backend
npx ts-node prisma/seed.ts
```

## What Gets Seeded

### Categories (11 categories)
- Fruits & Vegetables
- Baby & Pregnancy
- Beverages
- Meats & Seafood
- Biscuits & Snacks (with image: /05.svg)
- Breads & Bakery
- Breakfast & Dairy (with image: /07.svg)
- Frozen Foods
- Grocery & Staples (with image: /09.svg)
- Healthcare
- Household Needs

### Products (12 products with specific UUIDs)
All products use the `/drug.png` image and are distributed across categories:
- Healthcare: 4 products
- Biscuits & Snacks: 2 products
- Breakfast & Dairy: 2 products
- Grocery & Staples: 3 products

**Product UUIDs:**
- `550e8400-e29b-41d4-a716-446655440001` through `550e8400-e29b-41d4-a716-446655440012`

## Troubleshooting

### Connection Pool Timeout
If you get a connection pool timeout error:
1. Make sure `DIRECT_URL` is set in your `.env` file
2. The seed script will try to use `DIRECT_URL` first, then fall back to `DATABASE_URL`
3. For Supabase, make sure `DIRECT_URL` uses the direct connection (no pgbouncer)

### Products Already Exist
The seed script uses `upsert`, so it will update existing products/categories if they have the same ID. This means you can run the seed multiple times safely.

### Reset Database (Optional)
If you want to start fresh:
```bash
npx prisma migrate reset
# This will drop the database, recreate it, run migrations, and run the seed
```

## Notes
- The seed script uses the exact UUIDs from the frontend mock data
- All products are set to `isActive: true` and `isFeatured: true` (except product 2)
- Stock is set to 50 for most products, 30 for product 2
- Prices are set to ₦550 for all products

