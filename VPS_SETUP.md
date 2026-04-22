# VPS Operations

This project is ready to run on a Linux VPS with Node.js, Nginx, PM2, and Playwright.

## First run

1. Clone the repo to `/var/www/aliexpress`
2. Copy `.env.example` to `.env`
3. Fill in your production env vars
   For Affiliate API mode, set at least:

```bash
ALIEXPRESS_APP_KEY=your_app_key
ALIEXPRESS_APP_SECRET=your_app_secret
ALIEXPRESS_AFFILIATE_API_BASE_URL=https://eco.taobao.com/router/rest
ALIEXPRESS_AFFILIATE_PRODUCT_METHOD=aliexpress.affiliate.productdetail.get
ALIEXPRESS_TRACKING_ID=your_tracking_id
```

   If the VPS IP is blocked by AliExpress, add an HTTP/HTTPS proxy:

```bash
SCRAPE_PROXY_URL=http://username:password@proxy-host:port
SCRAPE_PROXY_BYPASS=127.0.0.1,localhost
```
4. Install dependencies:

```bash
npm ci
PLAYWRIGHT_BROWSERS_PATH=0 npx playwright install chromium chromium-headless-shell
```

5. Start the app:

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

## Fast update flow

From the project directory on the VPS:

```bash
bash ./scripts/vps-update.sh
```

This will:
- pull the latest `main`
- install dependencies
- reinstall Playwright browsers if needed
- reload PM2
- run a local health check

## Useful commands

```bash
pm2 list
pm2 logs alexpress --lines 100
pm2 restart alexpress
curl http://127.0.0.1:3000/api/health
sudo nginx -t
sudo systemctl restart nginx
```

Health check fields to confirm after reload:

- `affiliateApiConfigured: true`
- `affiliateTrackingIdConfigured: true`
- `scrapeProxyConfigured: true` when proxy is enabled
- `scrapeProxyProtocol: "http"` or `"https"` when proxy is parsed correctly

## Recommended Cloudflare mode

For scraping reliability, keep the DNS records as `DNS only` first.

Recommended records:

- `A @ -> your VPS IPv4`
- `A www -> your VPS IPv4`

Only enable Cloudflare proxy later if you need CDN/WAF features and your fetch flow still behaves correctly.
