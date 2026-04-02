require("dotenv").config();

const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

let playwright = null;
try {
  playwright = require("playwright");
} catch {
  playwright = null;
}

const app = express();
const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_SECONDS || 900) * 1000;
const FX_CACHE_TTL_MS = Number(process.env.FX_CACHE_TTL_SECONDS || 3600) * 1000;
const SCRAPE_TIMEOUT_MS = Number(process.env.SCRAPE_TIMEOUT_MS || 30_000);
const SCRAPE_RETRIES = Number(process.env.SCRAPE_RETRIES || 2);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 45);
const CORS_ORIGINS = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const FX_API_URL = process.env.FX_API_URL || "https://open.er-api.com/v6/latest/USD";
const FX_FALLBACK_URL = process.env.FX_FALLBACK_URL || "https://api.exchangerate.host/latest?base=USD&symbols=TND";
const FX_FALLBACK_RATE = Number(process.env.FX_FALLBACK_RATE || 3.8);
const DEFAULT_SHIPPING_USD = Number(process.env.DEFAULT_SHIPPING_USD || 2);

const ALIEXPRESS_API_BASE_URL = process.env.ALIEXPRESS_API_BASE_URL || "";
const ALIEXPRESS_APP_KEY = process.env.ALIEXPRESS_APP_KEY || "";
const ALIEXPRESS_APP_SECRET = String(process.env.ALIEXPRESS_APP_SECRET || "").replace(/^"|"$/g, "");
const ALIEXPRESS_PRODUCT_METHOD = process.env.ALIEXPRESS_PRODUCT_METHOD || "aliexpress.ds.product.get";
const PLAYWRIGHT_EXECUTABLE_PATH = process.env.PLAYWRIGHT_EXECUTABLE_PATH || "";

const productCache = new Map();
const fxCache = new Map();
const rateBuckets = new Map();
let browserPromise = null;
let resolvedBrowserExecutable = "";

app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);
app.use(express.json({ limit: "1mb" }));
app.use("/assets", express.static(path.join(ROOT, "assets"), { maxAge: "7d", etag: true }));

function log(level, message, meta = {}) {
  const payload = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  console[level](`[${new Date().toISOString()}] ${message}${payload}`);
}

function sanitizeText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function normalizeUrl(value = "") {
  const cleaned = sanitizeText(value);
  if (!cleaned) return "";
  if (cleaned.startsWith("//")) return `https:${cleaned}`;
  return cleaned;
}

function parseMoney(value) {
  const normalized = String(value || "")
    .replace(/\s/g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.-]/g, "");
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

function pickLowestPositive(values = []) {
  const valid = values.filter((value) => Number.isFinite(value) && value > 0);
  return valid.length ? Math.min(...valid) : 0;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCache(map, key) {
  const hit = map.get(key);
  if (!hit || hit.expiresAt < Date.now()) {
    map.delete(key);
    return null;
  }
  return hit.value;
}

function setCache(map, key, value, ttlMs) {
  map.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function fileExists(targetPath) {
  try {
    return fs.existsSync(targetPath);
  } catch {
    return false;
  }
}

function detectPlaywrightExecutable() {
  if (PLAYWRIGHT_EXECUTABLE_PATH && fileExists(PLAYWRIGHT_EXECUTABLE_PATH)) {
    return PLAYWRIGHT_EXECUTABLE_PATH;
  }

  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
  const playwrightRoot = path.join(localAppData, "ms-playwright");

  let subdirs = [];
  try {
    subdirs = fs.readdirSync(playwrightRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => /^chromium(?:_headless_shell)?-\d+$/i.test(name))
      .sort((left, right) => Number(right.split("-").pop()) - Number(left.split("-").pop()));
  } catch {
    subdirs = [];
  }

  const candidates = [];
  for (const subdir of subdirs) {
    const base = path.join(playwrightRoot, subdir);
    candidates.push(
      path.join(base, "chrome-win64", "chrome.exe"),
      path.join(base, "chrome-win", "chrome.exe"),
      path.join(base, "chrome-headless-shell-win64", "chrome-headless-shell.exe"),
      path.join(base, "chrome-linux", "chrome"),
      path.join(base, "chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium")
    );
  }

  return candidates.find(fileExists) || "";
}

function validateAliExpressUrl(input) {
  try {
    const parsed = new URL(String(input || "").trim());
    const isAliExpress =
      /(^|\.)aliexpress\.(com|us)$/i.test(parsed.hostname) ||
      /(^|\.)a\.aliexpress\.com$/i.test(parsed.hostname);
    if (!isAliExpress) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function extractProductId(input) {
  const source = validateAliExpressUrl(input) || String(input || "");
  const patterns = [
    /\/item\/(\d+)\.html/i,
    /\/i\/(\d+)\.html/i,
    /[?&]productId=(\d+)/i,
    /[?&]id=(\d+)/i
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match) return match[1];
  }

  return "";
}

function getCanonicalProductUrl(input) {
  const productId = extractProductId(input);
  if (productId) return `https://www.aliexpress.com/item/${productId}.html`;
  return validateAliExpressUrl(input);
}

function getClientIp(req) {
  return req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
}

function formatTopTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function signTopRequest(params, secret) {
  const sorted = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join("");

  return crypto.createHash("md5").update(`${secret}${sorted}${secret}`, "utf8").digest("hex").toUpperCase();
}

function walkObject(value, visit, seen = new WeakSet()) {
  if (!value || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  visit(value);
  if (Array.isArray(value)) {
    value.forEach((item) => walkObject(item, visit, seen));
    return;
  }
  Object.values(value).forEach((item) => walkObject(item, visit, seen));
}

function readScalar(value) {
  if (typeof value === "string" || typeof value === "number") return value;
  if (!value || typeof value !== "object") return "";
  for (const key of ["value", "amount", "displayAmount", "price", "salePrice", "formattedPrice"]) {
    if (value[key] != null) {
      const nested = readScalar(value[key]);
      if (nested !== "") return nested;
    }
  }
  return "";
}

function readImage(value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const image = readImage(item);
      if (image) return image;
    }
    return "";
  }
  if (typeof value === "string") {
    const normalized = normalizeUrl(value);
    return /^https?:\/\//i.test(normalized) ? normalized : "";
  }
  if (!value || typeof value !== "object") return "";
  for (const key of ["image", "imageUrl", "mainImage", "mainImageUrl", "src", "url"]) {
    const image = readImage(value[key]);
    if (image) return image;
  }
  return "";
}

function extractUsdValuesFromText(text) {
  const prices = [];
  const patterns = [
    /(?:us\s*)?\$\s*([0-9]+(?:[.,][0-9]{1,2})?)/gi,
    /([0-9]+(?:[.,][0-9]{1,2})?)\s*(?:usd|us\$)/gi
  ];

  for (const pattern of patterns) {
    for (const match of String(text || "").matchAll(pattern)) {
      const value = parseMoney(match[1]);
      if (value > 0) prices.push(value);
    }
  }

  return prices;
}

function hasShippingKeyword(text) {
  return /shipping|delivery|freight|logistics|postage|livraison|شحن|توصيل/i.test(text);
}

function hasFreeShippingKeyword(text) {
  return /free shipping|free delivery|livraison gratuite|شحن مجاني|توصيل مجاني/i.test(text);
}

function parseShippingTexts(texts = []) {
  let sawFree = false;
  const prices = [];

  for (const raw of texts) {
    const text = sanitizeText(raw).toLowerCase();
    if (!text) continue;
    if (hasFreeShippingKeyword(text) && hasShippingKeyword(text)) sawFree = true;
    if (!hasShippingKeyword(text)) continue;
    prices.push(...extractUsdValuesFromText(text));
  }

  const cheapest = pickLowestPositive(prices);
  if (cheapest > 0) return cheapest;
  if (sawFree) return 0;
  return null;
}

function extractPriceFromTextList(texts = []) {
  return pickLowestPositive(texts.flatMap((text) => extractUsdValuesFromText(text)));
}

function extractRatingFromTextList(texts = []) {
  for (const text of texts) {
    const match = String(text || "").match(/([0-5](?:[.,][0-9])?)/);
    if (!match) continue;
    const rating = Number.parseFloat(match[1].replace(",", "."));
    if (Number.isFinite(rating) && rating > 0 && rating <= 5) return rating;
  }
  return 0;
}

function extractJsonObjectsFromHtml(html, $) {
  const objects = [];
  const scripts = $("script").map((_, element) => $(element).html() || "").get();
  for (const rawScript of scripts) {
    const script = rawScript.trim();
    if (!script) continue;
    if (script.startsWith("{") || script.startsWith("[")) {
      try {
        objects.push(JSON.parse(script));
      } catch {
        // ignore non-JSON scripts
      }
    }
  }
  return objects;
}

function extractProductFieldsFromObjectTree(source) {
  const result = { title: "", image: "", price: 0, rating: 0 };

  walkObject(source, (node) => {
    if (Array.isArray(node)) return;
    for (const [key, value] of Object.entries(node)) {
      const lowerKey = key.toLowerCase();

      if (!result.title && typeof value === "string" && /(?:subject|title|producttitle|seotitle|displaytitle|productname)/i.test(lowerKey)) {
        const title = sanitizeText(value);
        if (title && !/^aliexpress$/i.test(title)) result.title = title;
      }

      if (!result.image && /(?:image|img|cover|thumb|pic)/i.test(lowerKey)) {
        const image = readImage(value);
        if (image) result.image = image;
      }

      if (!result.price && /(?:price|amount|saleprice|minprice|maxprice|currentprice|activityprice|displayprice)/i.test(lowerKey)) {
        const price = parseMoney(readScalar(value));
        if (price > 0) result.price = price;
      }

      if (!result.rating && /(?:rating|star|reviewscore|averagestar)/i.test(lowerKey)) {
        const rating = Number.parseFloat(String(readScalar(value) || "").replace(/[^0-9.]/g, ""));
        if (Number.isFinite(rating) && rating > 0 && rating <= 5) result.rating = rating;
      }
    }
  });

  return result;
}

function extractHtmlProduct(html, url, source) {
  const $ = cheerio.load(html);
  const embedded = extractProductFieldsFromObjectTree(extractJsonObjectsFromHtml(html, $));
  const title =
    embedded.title ||
    sanitizeText($("meta[property='og:title']").attr("content")) ||
    sanitizeText($("h1").first().text()) ||
    sanitizeText($("title").text());
  const image =
    embedded.image ||
    normalizeUrl($("meta[property='og:image']").attr("content")) ||
    normalizeUrl($("meta[name='twitter:image']").attr("content")) ||
    normalizeUrl($("img").first().attr("src"));
  const price =
    embedded.price ||
    pickLowestPositive([
      parseMoney($("meta[property='product:price:amount']").attr("content")),
      parseMoney($("meta[name='twitter:data1']").attr("content")),
      parseMoney($("meta[itemprop='price']").attr("content"))
    ]);
  const rating = embedded.rating || extractRatingFromTextList([$("body").text()]);
  const shipping = parseShippingTexts([
    $("body").text(),
    ...$("[class*='shipping'], [class*='delivery'], [class*='freight'], [class*='logistics']").map((_, el) => $(el).text()).get()
  ]);

  return {
    success: true,
    title,
    price,
    shipping,
    image,
    rating: rating || 4.5,
    url,
    source
  };
}

async function withRetries(label, task) {
  let lastError = null;
  for (let attempt = 0; attempt <= SCRAPE_RETRIES; attempt += 1) {
    try {
      return await task(attempt + 1);
    } catch (error) {
      lastError = error;
      log("warn", `${label} failed`, { attempt: attempt + 1, error: error.message });
      if (attempt < SCRAPE_RETRIES) await sleep(700 * (attempt + 1));
    }
  }
  throw lastError;
}

async function fetchAliExpressApiProduct(productId) {
  if (!ALIEXPRESS_API_BASE_URL || !ALIEXPRESS_APP_KEY || !ALIEXPRESS_APP_SECRET || !productId) {
    return null;
  }

  const params = {
    app_key: ALIEXPRESS_APP_KEY,
    method: ALIEXPRESS_PRODUCT_METHOD,
    format: "json",
    sign_method: "md5",
    timestamp: formatTopTimestamp(),
    v: "2.0",
    product_id: productId,
    ship_to_country: "TN",
    target_currency: "USD",
    target_language: "en_US"
  };

  params.sign = signTopRequest(params, ALIEXPRESS_APP_SECRET);

  const response = await axios.get(ALIEXPRESS_API_BASE_URL, {
    params,
    timeout: 20_000
  });

  const extracted = extractProductFieldsFromObjectTree(response.data);
  if (!extracted.title && !extracted.image && !extracted.price) {
    throw new Error("AliExpress API returned no usable product fields");
  }

  return {
    title: extracted.title,
    image: extracted.image,
    price: extracted.price,
    rating: extracted.rating || 4.5,
    source: "aliexpress-api"
  };
}

async function getBrowser() {
  if (!playwright?.chromium) throw new Error("Playwright is not installed");
  if (!browserPromise) {
    resolvedBrowserExecutable = resolvedBrowserExecutable || detectPlaywrightExecutable();
    const launchOptions = {
      headless: process.env.PLAYWRIGHT_HEADLESS !== "false",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    };
    if (resolvedBrowserExecutable) {
      launchOptions.executablePath = resolvedBrowserExecutable;
    }

    browserPromise = playwright.chromium
      .launch(launchOptions)
      .then((browser) => {
        if (resolvedBrowserExecutable) {
          log("log", "Playwright browser ready", { executablePath: resolvedBrowserExecutable });
        }
        return browser;
      })
      .catch((error) => {
        browserPromise = null;
        throw error;
      });
  }
  return browserPromise;
}

async function buildPlaywrightContext(browser) {
  const context = await browser.newContext({
    locale: "en-US",
    timezoneId: "Africa/Tunis",
    viewport: { width: 1366, height: 900 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
  });

  await context.addCookies([
    {
      name: "aep_usuc_f",
      value: "site=glo&c_tp=USD&region=TN&b_locale=en_US",
      domain: ".aliexpress.com",
      path: "/",
      secure: true
    }
  ]).catch(() => {});

  return context;
}

async function scrapeWithPlaywright(url) {
  const browser = await getBrowser();
  const context = await buildPlaywrightContext(browser);
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: SCRAPE_TIMEOUT_MS });
    await page.waitForTimeout(1500);

    const runtime = await page.evaluate(() => {
      const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
      const queryText = (selectors) => {
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          const text = clean(element?.textContent);
          if (text) return text;
        }
        return "";
      };
      const queryAttr = (selectors, attr) => {
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          const value = attr === "currentSrc" ? element?.currentSrc : element?.getAttribute(attr);
          const text = clean(value);
          if (text) return text;
        }
        return "";
      };
      const collectTexts = (selectors) => {
        const values = [];
        selectors.forEach((selector) => {
          document.querySelectorAll(selector).forEach((element) => {
            const text = clean(element.textContent);
            if (text) values.push(text);
          });
        });
        return Array.from(new Set(values));
      };

      return {
        title: queryText(["h1[data-pl='product-title']", "h1[class*='title']", "h1"]),
        image:
          queryAttr(["meta[property='og:image']", "meta[name='twitter:image']"], "content") ||
          queryAttr(["img[src*='alicdn']", "img[class*='main']", "img[src]"], "currentSrc") ||
          queryAttr(["img[src*='alicdn']", "img[class*='main']", "img[src]"], "src"),
        priceTexts: collectTexts(["[class*='price']", "[class*='Price']", "[data-testid*='price']"]),
        ratingTexts: collectTexts(["[class*='rating']", "[class*='Rating']", "[class*='star']", "[class*='Star']"]),
        shippingTexts: collectTexts([
          "[class*='shipping']",
          "[class*='Shipping']",
          "[class*='delivery']",
          "[class*='Delivery']",
          "[class*='freight']",
          "[class*='logistics']",
          "[data-testid*='shipping']"
        ]),
        pageTitle: clean(document.title)
      };
    });

    const html = await page.content();
    const parsed = extractHtmlProduct(html, page.url(), "playwright");

    const merged = {
      ...parsed,
      title: sanitizeText(runtime.title || parsed.title || runtime.pageTitle),
      image: normalizeUrl(runtime.image || parsed.image),
      price: extractPriceFromTextList(runtime.priceTexts) || parsed.price,
      rating: extractRatingFromTextList(runtime.ratingTexts) || parsed.rating,
      shipping: parseShippingTexts(runtime.shippingTexts) ?? parsed.shipping
    };

    if (!merged.title || /^aliexpress$/i.test(merged.title) || !merged.image || merged.price <= 0) {
      log("warn", "Playwright extracted partial product data", {
        url,
        title: merged.title || null,
        image: Boolean(merged.image),
        price: merged.price || 0,
        shipping: merged.shipping,
        rating: merged.rating || 0
      });
      throw new Error("Playwright scrape returned incomplete product data");
    }

    if (merged.shipping == null) merged.shipping = DEFAULT_SHIPPING_USD;
    return merged;
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
}

async function scrapeWithHttp(url) {
  const response = await axios.get(url, {
    timeout: Math.min(SCRAPE_TIMEOUT_MS, 20_000),
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      "accept-language": "en-US,en;q=0.9"
    }
  });

  const parsed = extractHtmlProduct(response.data, url, "http-fallback");
  if (!parsed.title || /^aliexpress$/i.test(parsed.title) || !parsed.image || parsed.price <= 0) {
    throw new Error("HTTP fallback returned incomplete product data");
  }
  if (parsed.shipping == null) parsed.shipping = DEFAULT_SHIPPING_USD;
  return parsed;
}

async function fetchProduct(url) {
  const canonicalUrl = getCanonicalProductUrl(url);
  if (!canonicalUrl) {
    const error = new Error("Invalid AliExpress URL");
    error.status = 400;
    throw error;
  }

  const productId = extractProductId(canonicalUrl) || crypto.createHash("md5").update(canonicalUrl).digest("hex");
  const cacheKey = `product:${productId}`;
  const cached = getCache(productCache, cacheKey);
  if (cached) return { ...cached, cached: true };

  let apiData = null;
  try {
    apiData = await fetchAliExpressApiProduct(productId);
  } catch (error) {
    log("warn", "AliExpress API product fetch failed", { productId, error: error.message });
  }

  let pageData = null;
  try {
    pageData = await withRetries("playwright-scrape", () => scrapeWithPlaywright(canonicalUrl));
  } catch (error) {
    log("warn", "Playwright scrape exhausted, switching to HTTP fallback", { error: error.message });
  }

  if (!pageData) {
    try {
      pageData = await withRetries("http-scrape", () => scrapeWithHttp(canonicalUrl));
    } catch (error) {
      if (!apiData) {
        error.status = 502;
        error.message = "Unable to fetch product details from AliExpress right now";
        throw error;
      }
    }
  }

  const product = {
    success: true,
    title: apiData?.title || pageData?.title || "AliExpress Product",
    price: Number(apiData?.price || pageData?.price || 0),
    shipping: Number(pageData?.shipping ?? DEFAULT_SHIPPING_USD),
    image: apiData?.image || pageData?.image || "",
    rating: Number(apiData?.rating || pageData?.rating || 4.5),
    url: canonicalUrl,
    source: apiData ? "api+scrape" : (pageData?.source || "scrape"),
    cached: false,
    fetchedAt: new Date().toISOString()
  };

  if (!product.image || product.price <= 0 || /^aliexpress$/i.test(product.title)) {
    const error = new Error("Unable to fetch product details from AliExpress right now");
    error.status = 502;
    throw error;
  }

  setCache(productCache, cacheKey, product, CACHE_TTL_MS);
  return product;
}

async function fetchExchangeRate() {
  const cached = getCache(fxCache, "usd-tnd");
  if (cached) return cached;

  const providers = [
    async () => {
      const response = await axios.get(FX_API_URL, { timeout: 12_000 });
      const rate = Number(response.data?.rates?.TND);
      if (!Number.isFinite(rate) || rate <= 0) throw new Error("Primary FX provider missing TND rate");
      return { success: true, base: "USD", quote: "TND", rate, source: "primary", fetchedAt: new Date().toISOString() };
    },
    async () => {
      const response = await axios.get(FX_FALLBACK_URL, { timeout: 12_000 });
      const rate = Number(response.data?.rates?.TND || response.data?.result);
      if (!Number.isFinite(rate) || rate <= 0) throw new Error("Fallback FX provider missing TND rate");
      return { success: true, base: "USD", quote: "TND", rate, source: "fallback", fetchedAt: new Date().toISOString() };
    }
  ];

  for (const provider of providers) {
    try {
      const result = await provider();
      setCache(fxCache, "usd-tnd", result, FX_CACHE_TTL_MS);
      return result;
    } catch (error) {
      log("warn", "FX provider failed", { error: error.message });
    }
  }

  const fallback = { success: true, base: "USD", quote: "TND", rate: FX_FALLBACK_RATE, source: "env-fallback", fetchedAt: new Date().toISOString() };
  setCache(fxCache, "usd-tnd", fallback, FX_CACHE_TTL_MS);
  return fallback;
}

function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  if (!origin) {
    res.header("Vary", "Origin");
  } else if (CORS_ORIGINS.length === 0 || CORS_ORIGINS.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
}

function rateLimitMiddleware(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  const bucket = rateBuckets.get(ip) || { count: 0, expiresAt: now + RATE_LIMIT_WINDOW_MS };
  if (bucket.expiresAt < now) {
    bucket.count = 0;
    bucket.expiresAt = now + RATE_LIMIT_WINDOW_MS;
  }
  bucket.count += 1;
  rateBuckets.set(ip, bucket);
  if (bucket.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ success: false, error: "Too many requests. Please try again shortly." });
  }
  next();
}

app.use(corsMiddleware);
app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  const start = Date.now();
  res.locals.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  res.on("finish", () => {
    log("log", "request", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - start
    });
  });
  next();
});

app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT, "index.html"));
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    now: new Date().toISOString(),
    playwright: Boolean(playwright?.chromium),
    aliexpressApiConfigured: Boolean(ALIEXPRESS_API_BASE_URL && ALIEXPRESS_APP_KEY && ALIEXPRESS_APP_SECRET)
  });
});

app.get("/api/exchange-rate", rateLimitMiddleware, async (req, res, next) => {
  try {
    const result = await fetchExchangeRate();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/api/product", rateLimitMiddleware, async (req, res, next) => {
  try {
    if (!req.query.url) {
      return res.status(400).json({ success: false, error: "Missing url query parameter" });
    }
    const product = await fetchProduct(req.query.url);
    res.json(product);
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: "Not found" });
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  log("error", "request-failed", {
    requestId: res.locals.requestId,
    status,
    error: error.message
  });
  res.status(status).json({
    success: false,
    error: status === 500 ? "Internal server error" : error.message,
    requestId: res.locals.requestId
  });
});

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of productCache.entries()) {
    if (entry.expiresAt < now) productCache.delete(key);
  }
  for (const [key, entry] of fxCache.entries()) {
    if (entry.expiresAt < now) fxCache.delete(key);
  }
  for (const [key, entry] of rateBuckets.entries()) {
    if (entry.expiresAt < now) rateBuckets.delete(key);
  }
}, 60_000).unref();

const server = app.listen(PORT, () => {
  log("log", `AliExpress Tunisia server listening on port ${PORT}`);
});

async function closeServer() {
  await new Promise((resolve) => server.close(resolve));
  if (browserPromise) {
    try {
      const browser = await browserPromise;
      await browser.close();
    } catch {
      // ignore browser close errors
    }
  }
  log("log", "HTTP server closed");
}

process.on("SIGINT", () => closeServer().finally(() => process.exit(0)));
process.on("SIGTERM", () => closeServer().finally(() => process.exit(0)));
