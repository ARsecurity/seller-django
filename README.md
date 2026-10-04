# Seller
Zamfara State online mall. Django 5 (DRF + Channels) + Next.js 14 / React / TypeScript. Neon Postgres + Render Key Value (Redis, for live notifications).
Pay by bank transfer (OPay / Moniepoint / PalmPay) or pay on delivery. Product images by URL only.

## Deploy step by step
1. **Neon**: neon.tech > create project > copy the connection string (`postgresql://...neon.tech/...?sslmode=require`).
2. **GitHub**: create an empty repo, then in this folder run:
   `git init && git add . && git commit -m "Seller" && git branch -M main && git remote add origin <repo-url> && git push -u origin main`
3. **Render**: dashboard > New > Blueprint > connect the repo > Apply. Enter the 4 values it asks for: `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL`. Wait for all 3 services (seller-redis, seller-zamfara-api, seller-zamfara-web) to go Live (first build ~5-10 min).
4. **Check URLs**: open each service's page and read its URL. If the API URL is not `https://seller-zamfara-api.onrender.com` or the web URL is not `https://seller-zamfara-web.onrender.com`, edit `FRONTEND_URL` (api service) and `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` (web service, use `wss://` for the socket), then Manual Deploy > Deploy latest commit on both.
5. **Admin**: open `<api-url>/admin`, log in with your admin username/password.
   - **Payment accounts**: enter your OPay, Moniepoint and PalmPay numbers and names, tick Active, Save.
   - **Vendors > Add**: make a shop for your own admin user (owner), tick Approved. Other sellers apply on the site and you approve them here.
6. **Open the web URL** > Sell > add a product: paste a direct https image URL (ends in .jpg/.png) and it shows on the home page.
7. **Orders**: for transfers, open Payment proofs > select > Confirm payment. Sellers update delivery status at /vendor/orders.

## Later
- Password-reset email: add `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` (optional) on the api service.
- After the first good deploy, run `python manage.py makemigrations market` locally and commit `backend/market/migrations/`.
- Free Render plans sleep when idle; upgrade the api service for always-on live updates.
- Tests: `cd backend && python manage.py test`


## Business model
This version keeps Django and the existing storefront architecture but uses a single-admin marketplace model. Customers cannot become vendors or publish products. Products are published by the site admin through Django Admin. Each product can optionally reference a physical source shop with its name, image URL, address, phone, email, and description. Orders are visible to the admin, who handles sourcing and delivery.

## Render deployment
Use `render.yaml` as a Blueprint. Set the four synced values shown by Render: `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_EMAIL`. The included Django migrations are committed, so Render runs `migrate` rather than generating migrations during deployment.

After deployment, manage the store at `/admin/`. Create Source Shops first, then create Products and select their Source Shop.
