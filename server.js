require("dotenv").config();

const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const { URL } = require("url");
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
const ENV_FILE_PATH = path.join(ROOT, ".env");
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_BASE_URL = String(process.env.PUBLIC_BASE_URL || "").trim().replace(/\/+$/g, "");
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_SECONDS || 21600) * 1000;
const FX_CACHE_TTL_MS = Number(process.env.FX_CACHE_TTL_SECONDS || 3600) * 1000;
const SCRAPE_TIMEOUT_MS = Number(process.env.SCRAPE_TIMEOUT_MS || 30_000);
const SCRAPE_RETRIES = Number(process.env.SCRAPE_RETRIES || 1);
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
const RESTRICTED_RULES = [
  { type: "banned", category: "drone", pattern: /\bdrone\b|quadcop|fpv|طيارة بدون طيار|طائرة بدون طيار/i, message: "المنتج هذا ينجم يكون ممنوع في الديوانة التونسية." },
  { type: "banned", category: "vape", pattern: /\bvape\b|e-?cig|electronic cigarette|سيجارة إلكترونية/i, message: "السيجارة الإلكترونية ومشتقاتها فيها خطر حجز كبير." },
  { type: "banned", category: "spy-camera", pattern: /spy camera|hidden camera|mini camera|كاميرا تجسس/i, message: "الكاميرات المخفية والتجسس غالبا ممنوعة." },
  { type: "banned", category: "gps-tracker", pattern: /\bgps\b.*tracker|tracker.*\bgps\b|جهاز تتبع/i, message: "أجهزة التتبع فيها خطر قانوني مرتفع." },
  { type: "restricted", category: "phone", pattern: /\bsmartphone\b|\bmobile phone\b|\bcell phone\b|هاتف|telephone portable/i, message: "الهواتف تنجم تتطلب إجراءات أو تصريح قبل الإدخال." },
  { type: "restricted", category: "radio", pattern: /walkie|two-way radio|radio transceiver|لاسلكي|transceiver/i, message: "الأجهزة اللاسلكية تنجم تتطلب ترخيص." },
  { type: "restricted", category: "tv-box", pattern: /tv box|receiver|set[- ]?top|box tv|رسيفر/i, message: "أجهزة الاستقبال تنجم تتطلب تصريح أو تتعرض للحجز." },
  { type: "restricted", category: "supplements", pattern: /supplement|vitamin|capsule|medicine|medication|دواء|مكمل غذائي/i, message: "الأدوية والمكملات الغذائية يلزمهم تثبت إضافي قبل الطلب." },
  { type: "restricted", category: "knife", pattern: /knife|dagger|sword|hunting|سكين|خنجر|سيف/i, message: "الأدوات الحادة أو الصيد فيها خطر رفض أو حجز." }
];

const ALIEXPRESS_API_BASE_URL = process.env.ALIEXPRESS_API_BASE_URL || "";
const ALIEXPRESS_APP_KEY = process.env.ALIEXPRESS_APP_KEY || "";
const ALIEXPRESS_APP_SECRET = String(process.env.ALIEXPRESS_APP_SECRET || "").replace(/^"|"$/g, "");
const ALIEXPRESS_PRODUCT_METHOD = process.env.ALIEXPRESS_PRODUCT_METHOD || "aliexpress.ds.product.get";
const ALIEXPRESS_ENABLE_AFFILIATE_API = process.env.ALIEXPRESS_ENABLE_AFFILIATE_API === "true";
const ALIEXPRESS_OAUTH_AUTHORIZE_URL = process.env.ALIEXPRESS_OAUTH_AUTHORIZE_URL || "https://api-sg.aliexpress.com/oauth/authorize";
const ALIEXPRESS_OAUTH_TOKEN_URL = process.env.ALIEXPRESS_OAUTH_TOKEN_URL || "https://api-sg.aliexpress.com/rest/auth/token/create";
const ALIEXPRESS_AFFILIATE_API_BASE_URL = process.env.ALIEXPRESS_AFFILIATE_API_BASE_URL || "https://eco.taobao.com/router/rest";
const ALIEXPRESS_AFFILIATE_PRODUCT_METHOD = process.env.ALIEXPRESS_AFFILIATE_PRODUCT_METHOD || "aliexpress.affiliate.productdetail.get";
const ALIEXPRESS_TRACKING_ID = String(process.env.ALIEXPRESS_TRACKING_ID || "").trim();
const PLAYWRIGHT_EXECUTABLE_PATH = process.env.PLAYWRIGHT_EXECUTABLE_PATH || "";
const SCRAPE_PROXY_URL = String(process.env.SCRAPE_PROXY_URL || "").trim();
const SCRAPE_PROXY_SERVER = String(process.env.SCRAPE_PROXY_SERVER || "").trim();
const SCRAPE_PROXY_USERNAME = String(process.env.SCRAPE_PROXY_USERNAME || "").trim();
const SCRAPE_PROXY_PASSWORD = String(process.env.SCRAPE_PROXY_PASSWORD || "").trim();
const SCRAPE_PROXY_BYPASS = String(process.env.SCRAPE_PROXY_BYPASS || "").trim();
const SCRAPINGDOG_API_URL = process.env.SCRAPINGDOG_API_URL || "https://api.scrapingdog.com/scrape";
const SCRAPINGDOG_API_KEY = (process.env.SCRAPINGDOG_API_KEY || "").trim();
const SCRAPINGDOG_DYNAMIC = String(process.env.SCRAPINGDOG_DYNAMIC || "false").trim().toLowerCase() === "true";
const SCRAPINGDOG_RETRY_COUNT = Math.max(0, Number(process.env.SCRAPINGDOG_RETRY_COUNT || 1));
const SCRAPINGDOG_COUNTRY = String(process.env.SCRAPINGDOG_COUNTRY || "tn").trim().toLowerCase();
const SCRAPINGDOG_ACCEPT_LANGUAGE = String(process.env.SCRAPINGDOG_ACCEPT_LANGUAGE || "en-US,en;q=0.9,fr;q=0.8,ar;q=0.7").trim();
const ADMIN_PIN = String(process.env.ADMIN_PIN || "1920").trim();
const ADMIN_SESSION_SECRET = String(process.env.ADMIN_SESSION_SECRET || "alex-admin-secret").trim();
const ADMIN_TOKEN_TTL_MS = Number(process.env.ADMIN_TOKEN_TTL_HOURS || 168) * 60 * 60 * 1000;
const DATA_DIR = path.join(ROOT, "data");
const ADMIN_STORE_PATH = path.join(DATA_DIR, "admin-store.json");

const productCache = new Map();
const fxCache = new Map();
const rateBuckets = new Map();
let browserPromise = null;
let resolvedBrowserExecutable = "";
let adminStoreCache = null;

app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);
app.use(express.json({ limit: "1mb" }));
app.use("/assets", express.static(path.join(ROOT, "assets"), { maxAge: "7d", etag: true }));

function log(level, message, meta = {}) {
  const payload = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  console[level](`[${new Date().toISOString()}] ${message}${payload}`);
}

function clearBrowserReference(reason, meta = {}) {
  if (browserPromise) {
    log("warn", "Clearing Playwright browser reference", { reason, ...meta });
  }
  browserPromise = null;
}

function isRecoverablePlaywrightError(error) {
  const message = String(error?.message || error || "");
  return /Target page, context or browser has been closed|Target closed|Browser has been closed|Connection closed|browser has disconnected|Execution context was destroyed|net::ERR_|browserType\.launch/i.test(message);
}

function sanitizeText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function parseProxyUrl(rawValue = "") {
  const input = String(rawValue || "").trim();
  if (!input) return null;
  try {
    const parsed = new URL(input);
    if (!/^https?:$/i.test(parsed.protocol) && !/^socks5?:$/i.test(parsed.protocol)) return null;
    const server = `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}`;
    return {
      server,
      username: parsed.username ? decodeURIComponent(parsed.username) : "",
      password: parsed.password ? decodeURIComponent(parsed.password) : "",
      protocol: parsed.protocol.replace(":", "").toLowerCase()
    };
  } catch {
    return null;
  }
}

function getScrapeProxyConfig() {
  const directConfig = parseProxyUrl(SCRAPE_PROXY_URL);
  if (directConfig) return directConfig;

  if (!SCRAPE_PROXY_SERVER) return null;

  const normalizedServer = /^[a-z]+:\/\//i.test(SCRAPE_PROXY_SERVER)
    ? SCRAPE_PROXY_SERVER
    : `http://${SCRAPE_PROXY_SERVER}`;
  const serverConfig = parseProxyUrl(normalizedServer);
  if (!serverConfig) return null;

  return {
    ...serverConfig,
    username: serverConfig.username || SCRAPE_PROXY_USERNAME,
    password: serverConfig.password || SCRAPE_PROXY_PASSWORD
  };
}

function getAxiosProxyOptions() {
  const proxyConfig = getScrapeProxyConfig();
  if (!proxyConfig) {
    console.log("❌ No proxy for Axios");
    return { proxy: false };
  }

  const proxyUrl = new URL(proxyConfig.server);

  console.log("✅ Axios using proxy:", proxyUrl.href);

  return {
    proxy: {
      protocol: proxyUrl.protocol.replace(":", ""),
      host: proxyUrl.hostname,
      port: Number(proxyUrl.port || 80),
      auth: proxyConfig.username || proxyConfig.password
        ? {
            username: proxyConfig.username,
            password: proxyConfig.password
          }
        : undefined
    }
  };
}

function normalizeUrl(value = "") {
  const cleaned = sanitizeText(value);
  if (!cleaned) return "";
  if (isAliExpressPlaceholderText(cleaned)) return "";
  if (/^data:image\//i.test(cleaned)) return "";
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

function pickFirstPositive(values = []) {
  for (const value of values) {
    if (Number.isFinite(value) && value > 0) return value;
  }
  return 0;
}

function normalizeRating(value) {
  const rating = Number.parseFloat(String(value ?? "").replace(",", "."));
  return Number.isFinite(rating) && rating > 0 && rating <= 5 ? rating : 0;
}

function mergeVariantGroups(current = [], incoming = []) {
  const map = new Map();
  [...(Array.isArray(current) ? current : []), ...(Array.isArray(incoming) ? incoming : [])].forEach((group) => {
    if (!group || typeof group !== "object") return;
    const name = sanitizeText(group.name || "Option");
    const values = uniqueShortText(Array.isArray(group.values) ? group.values : []);
    if (!values.length) return;
    const existing = map.get(name) || [];
    map.set(name, uniqueShortText(existing.concat(values)).slice(0, 8));
  });
  return Array.from(map.entries())
    .map(([name, values]) => ({ name, values }))
    .filter((group) => group.values.length >= 2);
}

function isVariantLikeKey(key = "") {
  return /variant|sku|prop|property|option|attribute|color|colour|size|bundle|storage|capacity|style|material|model/.test(String(key || "").toLowerCase());
}

function normalizeVariantValue(value = "") {
  return sanitizeText(value)
    .replace(/^[|:;,\-]+|[|:;,\-]+$/g, "")
    .trim();
}

function buildVariantOfferKey(attributes = {}) {
  return Object.entries(attributes || {})
    .map(([name, value]) => [sanitizeText(name).toLowerCase(), normalizeVariantValue(value).toLowerCase()])
    .filter(([, value]) => value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}:${value}`)
    .join("|");
}

function mergeVariantOffers(current = [], incoming = []) {
  const offers = new Map();
  [...(Array.isArray(current) ? current : []), ...(Array.isArray(incoming) ? incoming : [])].forEach((offer) => {
    if (!offer || typeof offer !== "object" || !offer.attributes || typeof offer.attributes !== "object") return;
    const key = offer.key || buildVariantOfferKey(offer.attributes);
    if (!key) return;

    const previous = offers.get(key) || { attributes: {} };
    offers.set(key, {
      key,
      attributes: { ...previous.attributes, ...offer.attributes },
      price: pickLowestPositive([Number(offer.price || 0), Number(previous.price || 0)]),
      shipping: offer.shipping != null ? Number(offer.shipping) : (previous.shipping != null ? Number(previous.shipping) : null),
      image: normalizeUrl(offer.image || previous.image || ""),
      deliveryEstimate: sanitizeText(offer.deliveryEstimate || previous.deliveryEstimate || ""),
      source: sanitizeText(offer.source || previous.source || "")
    });
  });

  return Array.from(offers.values())
    .map((offer) => ({
      ...offer,
      key: offer.key || buildVariantOfferKey(offer.attributes)
    }))
    .filter((offer) => offer.key && Object.keys(offer.attributes || {}).length);
}

function extractVariantGroupsFromOffers(offers = []) {
  const groups = new Map();
  (Array.isArray(offers) ? offers : []).forEach((offer) => {
    Object.entries(offer?.attributes || {}).forEach(([name, value]) => {
      const label = sanitizeText(name || "Option");
      const normalizedValue = normalizeVariantValue(value);
      if (!label || !normalizedValue) return;
      const existing = groups.get(label) || [];
      groups.set(label, uniqueShortText(existing.concat(normalizedValue)));
    });
  });

  return Array.from(groups.entries())
    .map(([name, values]) => ({ name, values: values.slice(0, 12) }))
    .filter((group) => group.values.length >= 2);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasUsableImage(value) {
  return Boolean(normalizeUrl(value));
}

function hasMeaningfulVariantGroups(groups = []) {
  return (Array.isArray(groups) ? groups : []).some((group) => {
    const name = sanitizeText(group?.name || "");
    const values = Array.isArray(group?.values) ? group.values.map((value) => sanitizeText(value || "")) : [];
    return (
      name &&
      !isLowValueProductTitle(name) &&
      !isAliExpressNavigationJunk(name) &&
      values.filter((value) => value && !isLowValueProductDescription(value) && !isAliExpressNavigationJunk(value)).length >= 2
    );
  });
}

function hasUsefulPartialProductData(partial = {}) {
  const title = sanitizeText(partial.title);
  const description = sanitizeText(partial.description);
  const shipping = partial.shipping != null ? Number(partial.shipping) : null;
  const hasMeaningfulText =
    (title && !isLowValueProductTitle(title) && !isAliExpressPlaceholderLike(title)) ||
    (description && !isLowValueProductDescription(description) && !isAliExpressPlaceholderLike(description));
  const hasMeaningfulCommerceData =
    Number(partial.price || 0) > 0 ||
    (shipping != null && Number.isFinite(shipping) && shipping > 0);
  const hasSupportingSignals =
    Number(partial.reviewCount || 0) > 0 ||
    Number(partial.soldCount || 0) > 0 ||
    Boolean(sanitizeText(partial.deliveryEstimate)) ||
    hasMeaningfulVariantGroups(partial.variants);

  return Boolean(
    hasMeaningfulText ||
    hasMeaningfulCommerceData ||
    (hasUsableImage(partial.image) && (hasMeaningfulText || hasMeaningfulCommerceData || hasSupportingSignals))
  );
}

function mergePartialProductData(current = null, incoming = null, fallbackUrl = "") {
  const base = current && typeof current === "object" ? current : {};
  const next = incoming && typeof incoming === "object" ? incoming : {};
  return {
    title: sanitizeText(next.title || base.title || ""),
    description: sanitizeText(next.description || base.description || ""),
    image: normalizeUrl(next.image || base.image || ""),
    price: pickLowestPositive([Number(next.price || 0), Number(base.price || 0)]),
    shipping: next.shipping != null ? Number(next.shipping) : (base.shipping != null ? Number(base.shipping) : null),
    rating: normalizeRating(next.rating) || normalizeRating(base.rating),
    reviewCount: Math.max(0, Number(next.reviewCount || 0), Number(base.reviewCount || 0)),
    soldCount: Math.max(0, Number(next.soldCount || 0), Number(base.soldCount || 0)),
    deliveryEstimate: sanitizeText(next.deliveryEstimate || base.deliveryEstimate || ""),
    variants: mergeVariantGroups(base.variants, next.variants),
    url: next.url || base.url || fallbackUrl
  };
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

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function toFiniteNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getDefaultAdminSettings() {
  return {
    calculator: {
      thresholds: {
        low: 10,
        mid: 50,
        high: 150
      },
      rates: {
        low: 4.5,
        mid: 4.3,
        high: 4.1,
        base: 3.8
      },
      serviceFeeTnd: 0
    },
    storefront: {
      whatsappNumber: "21627498276",
      messengerHandle: "alexpresstunisie",
      instagramHandle: "alexpress.tunisie"
    },
    admin: {
      autoRefreshSeconds: 0
    }
  };
}

function normalizeAdminSettings(settings = {}) {
  const defaults = getDefaultAdminSettings();
  const source = settings && typeof settings === "object" ? settings : {};
  const calculator = source.calculator && typeof source.calculator === "object" ? source.calculator : {};
  const thresholds = calculator.thresholds && typeof calculator.thresholds === "object" ? calculator.thresholds : {};
  const rates = calculator.rates && typeof calculator.rates === "object" ? calculator.rates : {};
  const storefront = source.storefront && typeof source.storefront === "object" ? source.storefront : {};
  const admin = source.admin && typeof source.admin === "object" ? source.admin : {};

  const lowThreshold = Math.max(0, toFiniteNumber(thresholds.low, defaults.calculator.thresholds.low));
  const midThreshold = Math.max(lowThreshold + 1, toFiniteNumber(thresholds.mid, defaults.calculator.thresholds.mid));
  const highThreshold = Math.max(midThreshold + 1, toFiniteNumber(thresholds.high, defaults.calculator.thresholds.high));

  return {
    calculator: {
      thresholds: {
        low: lowThreshold,
        mid: midThreshold,
        high: highThreshold
      },
      rates: {
        low: Math.max(0.001, toFiniteNumber(rates.low, defaults.calculator.rates.low)),
        mid: Math.max(0.001, toFiniteNumber(rates.mid, defaults.calculator.rates.mid)),
        high: Math.max(0.001, toFiniteNumber(rates.high, defaults.calculator.rates.high)),
        base: Math.max(0.001, toFiniteNumber(rates.base, defaults.calculator.rates.base))
      },
      serviceFeeTnd: Math.max(0, toFiniteNumber(calculator.serviceFeeTnd, defaults.calculator.serviceFeeTnd))
    },
    storefront: {
      whatsappNumber: sanitizeText(storefront.whatsappNumber || defaults.storefront.whatsappNumber),
      messengerHandle: sanitizeText(storefront.messengerHandle || defaults.storefront.messengerHandle),
      instagramHandle: sanitizeText(storefront.instagramHandle || defaults.storefront.instagramHandle)
    },
    admin: {
      autoRefreshSeconds: Math.max(0, Math.round(toFiniteNumber(admin.autoRefreshSeconds, defaults.admin.autoRefreshSeconds)))
    }
  };
}

function getDefaultAdminStore() {
  return {
    promos: [],
    orders: [],
    settings: getDefaultAdminSettings(),
    updatedAt: new Date().toISOString()
  };
}

function normalizePromoRecord(promo = {}) {
  const code = sanitizeText(String(promo.code || "")).toUpperCase();
  if (!code) return null;

  return {
    code,
    type: promo.type === "fixed" ? "fixed" : "percent",
    value: Number(promo.value || 0),
    limit: Math.max(0, Number(promo.limit || 0)),
    used: Math.max(0, Number(promo.used || 0)),
    expiresAt: sanitizeText(promo.expiresAt || ""),
    updatedAt: promo.updatedAt || new Date().toISOString()
  };
}

function normalizeOrderRecord(order = {}) {
  const orderRef = sanitizeText(order.orderRef || order.id || "");
  if (!orderRef) return null;

  return {
    id: order.id || Date.now(),
    orderRef,
    date: sanitizeText(order.date || new Date().toISOString()),
    total: Number(order.total || 0),
    itemsCount: Math.max(0, Number(order.itemsCount || (Array.isArray(order.items) ? order.items.length : 0))),
    items: Array.isArray(order.items) ? order.items : [],
    status: sanitizeText(order.status || "pending") || "pending",
    paymentMethod: sanitizeText(order.paymentMethod || ""),
    trackingHint: sanitizeText(order.trackingHint || ""),
    adminTracking: sanitizeText(order.adminTracking || ""),
    promoCode: sanitizeText(order.promoCode || "").toUpperCase(),
    customer: order.customer && typeof order.customer === "object" ? order.customer : {},
    voiceNote: order.voiceNote && typeof order.voiceNote === "object" ? order.voiceNote : null,
    referralCode: sanitizeText(order.referralCode || "").toUpperCase(),
    loyaltyCredit: Math.max(0, Number(order.loyaltyCredit || 0)),
    updatedAt: order.updatedAt || new Date().toISOString()
  };
}

function sortOrdersNewestFirst(orders = []) {
  return orders.slice().sort((left, right) => {
    const leftTime = new Date(left.updatedAt || left.date || 0).getTime();
    const rightTime = new Date(right.updatedAt || right.date || 0).getTime();
    return rightTime - leftTime;
  });
}

function loadAdminStore() {
  if (adminStoreCache) return adminStoreCache;

  ensureDataDir();
  if (!fileExists(ADMIN_STORE_PATH)) {
    adminStoreCache = getDefaultAdminStore();
    fs.writeFileSync(ADMIN_STORE_PATH, JSON.stringify(adminStoreCache, null, 2), "utf8");
    return adminStoreCache;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(ADMIN_STORE_PATH, "utf8"));
    adminStoreCache = {
      promos: Array.isArray(parsed.promos) ? parsed.promos.map(normalizePromoRecord).filter(Boolean) : [],
      orders: Array.isArray(parsed.orders) ? sortOrdersNewestFirst(parsed.orders.map(normalizeOrderRecord).filter(Boolean)) : [],
      settings: normalizeAdminSettings(parsed.settings || {}),
      updatedAt: parsed.updatedAt || new Date().toISOString()
    };
  } catch {
    adminStoreCache = getDefaultAdminStore();
  }

  return adminStoreCache;
}

function saveAdminStore(store) {
  ensureDataDir();
  const normalized = {
    promos: Array.isArray(store.promos) ? store.promos.map(normalizePromoRecord).filter(Boolean) : [],
    orders: sortOrdersNewestFirst(Array.isArray(store.orders) ? store.orders.map(normalizeOrderRecord).filter(Boolean) : []),
    settings: normalizeAdminSettings(store.settings || {}),
    updatedAt: new Date().toISOString()
  };
  const tempPath = `${ADMIN_STORE_PATH}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(normalized, null, 2), "utf8");
  fs.renameSync(tempPath, ADMIN_STORE_PATH);
  adminStoreCache = normalized;
  return normalized;
}

function getPublicPromoState(store = loadAdminStore()) {
  const now = Date.now();
  return store.promos.filter((promo) => {
    if (!promo) return false;
    if (promo.value <= 0) return false;
    if (promo.expiresAt && new Date(promo.expiresAt).getTime() < now) return false;
    if (promo.limit > 0 && promo.used >= promo.limit) return false;
    return true;
  });
}

function getPublicSettings(store = loadAdminStore()) {
  const settings = normalizeAdminSettings(store.settings || {});
  return {
    calculator: settings.calculator,
    storefront: settings.storefront
  };
}

function buildAdminAnalytics(store = loadAdminStore()) {
  const orders = Array.isArray(store.orders) ? store.orders : [];
  const productCounts = new Map();
  const customerCounts = new Map();
  let riskOrders = 0;

  orders.forEach((order) => {
    const customerId = sanitizeText(order.customer?.phone || order.customer?.city || order.orderRef || "");
    if (customerId) customerCounts.set(customerId, (customerCounts.get(customerId) || 0) + 1);

    let hasRisk = false;
    (Array.isArray(order.items) ? order.items : []).forEach((item) => {
      const name = sanitizeText(item?.name || "Unnamed");
      productCounts.set(name, (productCounts.get(name) || 0) + Number(item?.qty || 1));
      if (item?.restrictions?.banned || item?.restrictions?.restricted) hasRisk = true;
    });
    if (hasRisk) riskOrders += 1;
  });

  return {
    totalRevenue: orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    totalOrders: orders.length,
    pendingOrders: orders.filter((order) => ["pending", "processing", "shipped"].includes(String(order.status || ""))).length,
    deliveredOrders: orders.filter((order) => String(order.status || "") === "delivered").length,
    riskyOrders: riskOrders,
    topProducts: Array.from(productCounts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count })),
    repeatCustomers: Array.from(customerCounts.entries())
      .filter(([, count]) => count > 1)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([id, ordersCount]) => ({ id, ordersCount })),
    topPromos: (Array.isArray(store.promos) ? store.promos : [])
      .slice()
      .sort((left, right) => Number(right.used || 0) - Number(left.used || 0))
      .slice(0, 5)
      .map((promo) => ({ code: promo.code, used: Number(promo.used || 0) }))
  };
}

function getOrderByRef(orderRef, store = loadAdminStore()) {
  const target = sanitizeText(orderRef).toLowerCase();
  return store.orders.find((order) => String(order.orderRef || "").toLowerCase() === target) || null;
}

function upsertOrderRecord(nextOrder) {
  const store = loadAdminStore();
  const normalized = normalizeOrderRecord(nextOrder);
  if (!normalized) return null;

  const index = store.orders.findIndex((order) => order.orderRef === normalized.orderRef);
  if (index >= 0) {
    store.orders[index] = {
      ...store.orders[index],
      ...normalized,
      items: normalized.items.length ? normalized.items : store.orders[index].items,
      itemsCount: normalized.itemsCount || store.orders[index].itemsCount,
      updatedAt: new Date().toISOString()
    };
  } else {
    store.orders.unshift({ ...normalized, updatedAt: new Date().toISOString() });
  }

  saveAdminStore(store);
  return getOrderByRef(normalized.orderRef, store);
}

function signAdminTokenPayload(payload) {
  return crypto.createHmac("sha256", ADMIN_SESSION_SECRET).update(payload).digest("base64url");
}

function createAdminToken() {
  const payload = Buffer.from(JSON.stringify({
    role: "admin",
    exp: Date.now() + ADMIN_TOKEN_TTL_MS
  })).toString("base64url");
  return `${payload}.${signAdminTokenPayload(payload)}`;
}

function verifyAdminToken(token) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return null;
  if (signAdminTokenPayload(payload) !== signature) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!decoded || decoded.role !== "admin") return null;
    if (!decoded.exp || Number(decoded.exp) < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

function getBearerToken(req) {
  const header = String(req.headers.authorization || "");
  if (!header.toLowerCase().startsWith("bearer ")) return "";
  return header.slice(7).trim();
}

function requireAdminAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!verifyAdminToken(token)) {
    return res.status(401).json({ success: false, error: "جلسة الإدارة غير صالحة" });
  }
  next();
}

function fileExists(targetPath) {
  try {
    return fs.existsSync(targetPath);
  } catch {
    return false;
  }
}

function getPublicBaseUrl(req) {
  if (PUBLIC_BASE_URL) return PUBLIC_BASE_URL;
  const protocol = sanitizeText(req.headers["x-forwarded-proto"] || req.protocol || "https") || "https";
  const host = sanitizeText(req.headers["x-forwarded-host"] || req.get("host") || "");
  return host ? `${protocol}://${host}` : "";
}

function getAliExpressOAuthCallbackUrl(req) {
  const baseUrl = getPublicBaseUrl(req);
  return baseUrl ? `${baseUrl}/aliexpress/oauth-callback` : "";
}

function escapeEnvValue(value = "") {
  const text = String(value ?? "");
  if (!text) return "";
  return /[\s#"'`]/.test(text) ? JSON.stringify(text) : text;
}

function upsertEnvEntries(filePath, updates = {}) {
  const source = fileExists(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const newline = source.includes("\r\n") ? "\r\n" : "\n";
  let contents = source.replace(/\r\n/g, "\n");

  Object.entries(updates).forEach(([key, rawValue]) => {
    const value = escapeEnvValue(rawValue);
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, "m");
    if (pattern.test(contents)) {
      contents = contents.replace(pattern, line);
    } else {
      contents = `${contents.replace(/\n*$/g, "")}\n${line}\n`;
    }
  });

  fs.writeFileSync(filePath, contents.replace(/\n/g, newline), "utf8");
}

function getFutureIsoFromSeconds(seconds) {
  const amount = Number(seconds || 0);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return new Date(Date.now() + amount * 1000).toISOString();
}

function shouldUseAliExpressAffiliateApi() {
  return false; // 🚫 عطّلنا affiliate نهائياً
}

function hasAliExpressDsAccessToken() {
  return Boolean(sanitizeText(process.env.ALIEXPRESS_ACCESS_TOKEN || ""));
}

function getAliExpressApiMode() {
  if (hasAliExpressDsAccessToken()) return "ds";
  if (shouldUseAliExpressAffiliateApi()) return "affiliate";
  return "scrape-only";
}

function buildAliExpressSortedParams(params = {}) {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join("");
}

function signAliExpressRestRequest(apiPath, params, secret, strategy = "hmac-sha256-path") {
  const normalizedPath = String(apiPath || "").trim() || "/";
  const sorted = buildAliExpressSortedParams(params);

  switch (strategy) {
    case "sha256-secret-wrap-path":
      return crypto.createHash("sha256").update(`${secret}${normalizedPath}${sorted}${secret}`, "utf8").digest("hex").toUpperCase();
    case "sha256-secret-wrap":
      return crypto.createHash("sha256").update(`${secret}${sorted}${secret}`, "utf8").digest("hex").toUpperCase();
    case "md5-secret-wrap":
      return crypto.createHash("md5").update(`${secret}${sorted}${secret}`, "utf8").digest("hex").toUpperCase();
    case "hmac-sha256":
      return crypto.createHmac("sha256", secret).update(sorted, "utf8").digest("hex").toUpperCase();
    case "hmac-sha256-path":
    default:
      return crypto.createHmac("sha256", secret).update(`${normalizedPath}${sorted}`, "utf8").digest("hex").toUpperCase();
  }
}

function signAliExpressSystemParams(params = {}, secret, algorithm = "md5") {
  const normalized = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join("");

  const payload = `${secret}${normalized}${secret}`;
  const algo = String(algorithm || "md5").toLowerCase() === "sha256" ? "sha256" : "md5";
  return crypto.createHash(algo).update(payload, "utf8").digest("hex").toUpperCase();
}

async function createAliExpressAccessToken(code) {
  const trimmedCode = sanitizeText(code);
  if (!trimmedCode) {
    const error = new Error("Missing OAuth code");
    error.status = 400;
    throw error;
  }
  if (!ALIEXPRESS_APP_KEY || !ALIEXPRESS_APP_SECRET) {
    const error = new Error("AliExpress app credentials are missing");
    error.status = 500;
    throw error;
  }

  const tokenUrl = new URL(ALIEXPRESS_OAUTH_TOKEN_URL);
  const tokenPath = tokenUrl.pathname || "/auth/token/create";
  const systemTokenUrl = `${tokenUrl.origin}/sync`;
  const callbackUrl = getAliExpressOAuthCallbackUrl({ headers: {}, query: {}, protocol: "" }) || String(process.env.PUBLIC_BASE_URL || "").trim().replace(/\/$/, "") + "/aliexpress/oauth-callback";
  const timestampValues = [String(Date.now()), String(Math.floor(Date.now() / 1000))];
  const unsignedPayloadVariants = [];

  for (const timestamp of timestampValues) {
    unsignedPayloadVariants.push(
      { app_key: ALIEXPRESS_APP_KEY, timestamp, sign_method: "sha256", code: trimmedCode, grant_type: "authorization_code" },
      { app_key: ALIEXPRESS_APP_KEY, timestamp, sign_method: "sha256", code: trimmedCode, grantType: "authorization_code" },
      { app_key: ALIEXPRESS_APP_KEY, timestamp, sign_method: "sha256", code: trimmedCode, grant_type: "authorization_code", redirect_uri: callbackUrl },
      { app_key: ALIEXPRESS_APP_KEY, timestamp, sign_method: "md5", code: trimmedCode, grant_type: "authorization_code" },
      { app_key: ALIEXPRESS_APP_KEY, timestamp, sign_method: "md5", code: trimmedCode, grant_type: "authorization_code", redirect_uri: callbackUrl }
    );
  }

  const requestVariants = [];
  const seenVariants = new Set();
  const addVariant = (variant) => {
    const key = JSON.stringify(variant);
    if (!seenVariants.has(key)) {
      seenVariants.add(key);
      requestVariants.push(variant);
    }
  };

  for (const params of unsignedPayloadVariants) {
    const restSignStrategies = [
      "hmac-sha256-path",
      "hmac-sha256",
      "sha256-secret-wrap-path",
      "sha256-secret-wrap",
      "md5-secret-wrap"
    ];

    for (const strategy of restSignStrategies) {
      const signMethod = strategy === "md5-secret-wrap" ? "md5" : params.sign_method;
      const signedParams = { ...params, sign_method: signMethod };
      addVariant({
        label: `rest:${strategy}:${signMethod}`,
        type: "rest",
        url: ALIEXPRESS_OAUTH_TOKEN_URL,
        params: {
          ...signedParams,
          sign: signAliExpressRestRequest(tokenPath, signedParams, ALIEXPRESS_APP_SECRET, strategy)
        }
      });
    }

    for (const signMethod of ["md5", "sha256"]) {
      const systemParams = {
        ...params,
        sign_method: signMethod,
        method: tokenPath,
        format: "json"
      };
      addVariant({
        label: `system-post:${signMethod}`,
        type: "system-post",
        url: systemTokenUrl,
        params: {
          ...systemParams,
          sign: signAliExpressSystemParams(systemParams, ALIEXPRESS_APP_SECRET, signMethod)
        }
      });
      addVariant({
        label: `system-get:${signMethod}`,
        type: "system-get",
        url: systemTokenUrl,
        params: {
          ...systemParams,
          sign: signAliExpressSystemParams(systemParams, ALIEXPRESS_APP_SECRET, signMethod)
        }
      });
    }
  }
  let lastError = null;

  for (const variant of requestVariants) {
    try {
      let response;
      if (variant.type === "system-get") {
        response = await axios.get(variant.url, {
          timeout: 20_000,
          proxy: false,
          params: variant.params,
          headers: { accept: "application/json" }
        });
      } else if (variant.type === "system-post") {
        response = await axios.post(variant.url, new URLSearchParams(variant.params).toString(), {
          timeout: 20_000,
          proxy: false,
          headers: {
            "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
            accept: "application/json"
          }
        });
      } else {
        const attempts = [
          () => axios.post(variant.url, null, {
            timeout: 20_000,
            proxy: false,
            params: variant.params,
            headers: { accept: "application/json" }
          }),
          () => axios.post(variant.url, new URLSearchParams(variant.params).toString(), {
            timeout: 20_000,
            proxy: false,
            headers: {
              "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
              accept: "application/json"
            }
          })
        ];

        let localResponse = null;
        for (const attempt of attempts) {
          localResponse = await attempt();
          const data = localResponse.data && typeof localResponse.data === "object" ? localResponse.data : {};
          if (String(data.code ?? "0") === "0" || data.access_token) {
            response = localResponse;
            break;
          }
        }
        if (!response && localResponse) response = localResponse;
      }

      const data = response?.data && typeof response.data === "object" ? response.data : {};
      if (String(data.code ?? "0") !== "0" && !data.access_token) {
        const message = data.message || data.msg || data.error_message || data.error || "AliExpress OAuth token exchange failed";
        const error = new Error(message);
        error.status = 502;
        error.meta = {
          code: data.code ?? null,
          requestId: data.request_id || data.requestId || null,
          label: variant.label
        };
        throw error;
      }
      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("AliExpress OAuth token exchange failed");
}

function detectPlaywrightExecutable() {
  if (PLAYWRIGHT_EXECUTABLE_PATH && fileExists(PLAYWRIGHT_EXECUTABLE_PATH)) {
    return PLAYWRIGHT_EXECUTABLE_PATH;
  }

  const roots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    path.join(ROOT, "node_modules", "playwright-core", ".local-browsers"),
    path.join(ROOT, "node_modules", "playwright", ".local-browsers"),
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "ms-playwright") : "",
    path.join(os.homedir(), ".cache", "ms-playwright"),
    path.join(os.homedir(), "AppData", "Local", "ms-playwright"),
    "/opt/render/.cache/ms-playwright"
  ].filter(Boolean);

  const candidates = [];

  for (const playwrightRoot of roots) {
    let subdirs = [];
    try {
      subdirs = fs.readdirSync(playwrightRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .filter((name) => /^(chromium|chromium_headless_shell)-\d+$/i.test(name))
        .sort((left, right) => Number(right.split("-").pop()) - Number(left.split("-").pop()));
    } catch {
      subdirs = [];
    }

    for (const subdir of subdirs) {
      const base = path.join(playwrightRoot, subdir);
      candidates.push(
        path.join(base, "chrome-win64", "chrome.exe"),
        path.join(base, "chrome-win", "chrome.exe"),
        path.join(base, "chrome-headless-shell-win64", "chrome-headless-shell.exe"),
        path.join(base, "chrome-linux", "chrome"),
        path.join(base, "chrome-headless-shell-linux64", "chrome-headless-shell"),
        path.join(base, "chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium")
      );
    }
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

function getProductUrlCandidates(input) {
  const validInput = validateAliExpressUrl(input);
  const productId = extractProductId(input);
  const candidates = [];

  if (productId) {
    candidates.push(
      `https://www.aliexpress.com/item/${productId}.html`,
      `https://ar.aliexpress.com/item/${productId}.html`,
      `https://www.aliexpress.us/item/${productId}.html`,
      `https://m.aliexpress.com/i/${productId}.html`
    );
  }

  if (validInput) candidates.push(validInput);

  return Array.from(new Set(candidates.filter(Boolean)));
}

function isAliExpressBlockedTitle(title) {
  return /封禁|blocked|access denied|forbidden|ip ban|verification required|sorry, the page you requested can not be found|smarter shopping, better living/i.test(String(title || ""));
}

function isGenericAliExpressTitle(title) {
  return /^(aliexpress|ali express|aliexpress\.com)$/i.test(sanitizeText(title || ""));
}

function isAliExpressPlaceholderText(value) {
  return /smarter shopping,\s*better living(?:!|\.)?(?:\s*aliexpress\.com)?/i.test(sanitizeText(value || ""));
}

function isAliExpressNavigationJunk(value) {
  const cleaned = sanitizeText(value || "");
  if (!cleaned) return false;
  const keywordMatches = [
    /download the aliexpress app/i,
    /you can click this button to search/i,
    /help center/i,
    /return(?:&| and )refund policy/i,
    /report ipr infringement/i,
    /transparency center/i,
    /submit report/i,
    /welcome\s*sign in/i,
    /sign in\s*\/\s*register/i,
    /welcome\s*sign in\s*\/\s*register/i,
    /search by image/i,
    /all categories/i,
    /\b0\s+cart\b/i,
    /\ben\s*\/\s*usd\b/i
  ].filter((pattern) => pattern.test(cleaned)).length;

  return keywordMatches >= 2;
}

function isAliExpressAntiBotSignal(value) {
  const cleaned = sanitizeText(value || "");
  if (!cleaned) return false;
  return Boolean(
    /bxpunish/i.test(cleaned) ||
    /x5secdata/i.test(cleaned) ||
    /secdata/i.test(cleaned) ||
    /captcha/i.test(cleaned) ||
    /verify (?:you'?re|you are) human/i.test(cleaned) ||
    /浙公网安备|增值电信业务经营许可证/.test(cleaned)
  );
}

function isAliExpressPlaceholderLike(value) {
  const cleaned = sanitizeText(value || "");
  if (!cleaned) return false;
  return Boolean(
    isAliExpressBlockedTitle(cleaned) ||
    isAliExpressPlaceholderText(cleaned) ||
    isAliExpressNavigationJunk(cleaned) ||
    /download the aliexpress app/i.test(cleaned) ||
    /\bdownload the app\b/i.test(cleaned) ||
    /\bwelcome\b/i.test(cleaned) ||
    /help center/i.test(cleaned) ||
    /return(?:&| and )refund policy/i.test(cleaned) ||
    /report ipr infringement/i.test(cleaned) ||
    /search by image/i.test(cleaned) ||
    /all categories/i.test(cleaned) ||
    /\b0\s+cart\b/i.test(cleaned) ||
    /\ben[^\p{L}\p{N}]{0,8}usd\b/iu.test(cleaned) ||
    isAliExpressAntiBotSignal(cleaned)
  );
}

function isLowValueProductTitle(title) {
  const cleaned = sanitizeText(title || "");
  if (!cleaned) return true;
  return Boolean(
    isGenericAliExpressTitle(cleaned) ||
    /^منتج\s+aliexpress\s*#\d+$/i.test(cleaned) ||
    /^aliexpress\s+product\s*#\d+$/i.test(cleaned) ||
    /^itemdetail(?:resp|result|response)?$/i.test(cleaned) ||
    /^(resp|response|result|data|dto)$/i.test(cleaned) ||
    /^smarter shopping, better living!?$/i.test(cleaned) ||
    isAliExpressNavigationJunk(cleaned) ||
    isAliExpressPlaceholderText(cleaned) ||
    isAliExpressPlaceholderLike(cleaned)
  );
}

function isLowValueProductDescription(text) {
  const cleaned = sanitizeText(text || "");
  if (!cleaned) return true;
  return Boolean(
    isAliExpressBlockedTitle(cleaned) ||
    isAliExpressPlaceholderText(cleaned) ||
    isAliExpressNavigationJunk(cleaned) ||
    isAliExpressPlaceholderLike(cleaned) ||
    /^<?\s*click to feedback\s*>?$/i.test(cleaned) ||
    /window\._config_/i.test(cleaned) ||
    /captcharecaptcha/i.test(cleaned) ||
    /recaptcha/i.test(cleaned) ||
    /nctokenstr/i.test(cleaned) ||
    /secdata/i.test(cleaned) ||
    /slidetoget/i.test(cleaned) ||
    /^with\s*\(document\)\s*with\s*\(body\)/i.test(cleaned) ||
    /createelement\(["']script["']\)/i.test(cleaned) ||
    /aplus_v2\.js/i.test(cleaned) ||
    /tb-beacon-aplus/i.test(cleaned)
  );
}

function isBadCachedProduct(product = {}) {
  return Boolean(
    product?.source === "partial-fallback" ||
    product?.priceUnavailable ||
    isLowValueProductTitle(product?.title) ||
    isLowValueProductDescription(product?.description) ||
    isAliExpressPlaceholderText(product?.title) ||
    isAliExpressPlaceholderText(product?.description) ||
    isAliExpressBlockedTitle(product?.title) ||
    isAliExpressBlockedTitle(product?.description)
  );
}

function getClientIp(req) {
  return req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
}

function formatTopTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  const utcMs = date.getTime() + (date.getTimezoneOffset() * 60 * 1000);
  const gmt8 = new Date(utcMs + (8 * 60 * 60 * 1000));
  return `${gmt8.getUTCFullYear()}-${pad(gmt8.getUTCMonth() + 1)}-${pad(gmt8.getUTCDate())} ${pad(gmt8.getUTCHours())}:${pad(gmt8.getUTCMinutes())}:${pad(gmt8.getUTCSeconds())}`;
}

function signTopRequest(params, secret, signMethod = "md5") {
  const sorted = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join("");

  if (String(signMethod || "").toLowerCase() === "hmac") {
    return crypto.createHmac("md5", secret).update(sorted, "utf8").digest("hex").toUpperCase();
  }

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
    const text = sanitizeText(raw);
    if (!text) continue;
    const lowerText = text.toLowerCase();
    if (text.length > 220) continue;
    if (hasFreeShippingKeyword(lowerText) && hasShippingKeyword(lowerText)) sawFree = true;
    if (!hasShippingKeyword(lowerText)) continue;
    prices.push(...extractUsdValuesFromText(lowerText));
  }

  const cheapest = pickLowestPositive(prices);
  if (cheapest > 0) return cheapest;
  if (sawFree) return 0;
  return null;
}

function extractDeliveryEstimateFromTexts(texts = []) {
  const patterns = [
    /\b(\d{1,2})\s*(?:-|to|~)\s*(\d{1,2})\s*(?:business\s*)?(?:days?|jours?)\b/i,
    /(\d{1,2})\s*(?:حتى|الى|إلى)\s*(\d{1,2})\s*(?:يوم|أيام)/i,
    /\b(\d{1,2})\s*(?:business\s*)?(days?|jours?)\b/i,
    /(\d{1,2})\s*(?:يوم|أيام)/i
  ];

  for (const raw of texts) {
    const text = sanitizeText(raw);
    if (!text || text.length > 180) continue;
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return text;
    }
  }
  return "";
}

function inferDeliveryEstimate(shippingValue) {
  const shipping = Number(shippingValue);
  if (!Number.isFinite(shipping) || shipping < 0) return "غير متوفر";
  if (shipping === 0) return "من 12 حتى 25 يوم";
  if (shipping <= 3) return "من 10 حتى 20 يوم";
  if (shipping <= 8) return "من 8 حتى 16 يوم";
  return "من 7 حتى 14 يوم";
}

function parseCompactCount(value) {
  const text = sanitizeText(value).toLowerCase();
  if (!text) return 0;
  const match = text.match(/([0-9]{1,3}(?:[.,\s][0-9]{3})+|[0-9]+(?:[.,][0-9]+)?)\s*([km])?/i);
  if (!match) return 0;
  const rawNumber = match[1];
  const hasGroupedThousands = /[.,\s][0-9]{3}(?:[.,\s][0-9]{3})*$/.test(rawNumber) && !match[2];
  const normalizedNumber = hasGroupedThousands
    ? rawNumber.replace(/[.,\s]/g, "")
    : rawNumber.replace(/\s/g, "").replace(",", ".");
  const base = Number.parseFloat(normalizedNumber);
  if (!Number.isFinite(base) || base < 0) return 0;
  const multiplier = match[2] === "k" ? 1_000 : (match[2] === "m" ? 1_000_000 : 1);
  return Math.round(base * multiplier);
}

function extractCountFromTextList(texts = [], keywordPattern) {
  const patternSource = keywordPattern.source;
  const nearKeywordPatterns = [
    new RegExp(`([0-9]{1,3}(?:[.,\\s][0-9]{3})+|[0-9]+(?:[.,][0-9]+)?\\s*[km]?)\\+?\\s*(?:${patternSource})`, "i"),
    new RegExp(`(?:${patternSource})[^0-9]{0,12}([0-9]{1,3}(?:[.,\\s][0-9]{3})+|[0-9]+(?:[.,][0-9]+)?\\s*[km]?)`, "i")
  ];
  let best = 0;
  for (const raw of texts) {
    const text = sanitizeText(raw);
    if (!text || !keywordPattern.test(text) || isLowValueProductDescription(text)) continue;
    for (const pattern of nearKeywordPatterns) {
      const match = text.match(pattern);
      const count = parseCompactCount(match?.[1] || "");
      if (count > best) best = count;
    }
    const fallbackCount = parseCompactCount(text);
    if (fallbackCount > best) best = fallbackCount;
  }
  return best;
}

function classifyProductRestrictions({ title = "", url = "" }) {
  const haystack = `${title} ${url}`.trim();
  const matches = RESTRICTED_RULES.filter((rule) => rule.pattern.test(haystack));

  return {
    banned: matches.some((match) => match.type === "banned"),
    restricted: matches.some((match) => match.type === "restricted"),
    category: matches[0]?.category || "",
    reasons: matches.map((match) => match.message)
  };
}

function buildProductAlerts(product) {
  const alerts = [];

  if (product.restrictions?.banned) {
    alerts.push({ level: "danger", text: "هذا المنتج عندو خطر حجز كبير في تونس. كلمنا قبل ما تأكد الطلب." });
  } else if (product.restrictions?.restricted) {
    alerts.push({ level: "warning", text: "المنتج هذا ينجم يحتاج تثبت أو تصريح قبل الطلب." });
  }

  if (product.shipping != null && Number(product.shipping) === 0) {
    alerts.push({ level: "info", text: "الشحن مجاني في العرض الحالي." });
  } else if (product.shipping != null && Number(product.shipping) >= 8) {
    alerts.push({ level: "info", text: "الشحن مرتفع شوية، إذا تحب نعملولك تسعيرة يدوية أفضل." });
  }

  return alerts;
}

function guessVariantLabel(key = "", values = []) {
  const haystack = `${key} ${values.join(" ")}`.toLowerCase();
  if (/color|colour|couleur|black|white|blue|red|green|pink|silver|gold/.test(haystack)) return "Color";
  if (/size|taille|xl|xxl|\bxs\b|\bs\b|\bm\b|\bl\b|cm|inch/.test(haystack)) return "Size";
  if (/storage|ram|rom|gb|tb/.test(haystack)) return "Storage";
  if (/bundle|pack|set|piece|pcs/.test(haystack)) return "Bundle";
  return sanitizeText(key) || "Option";
}

function uniqueShortText(values = []) {
  return Array.from(new Set(values
    .map((value) => sanitizeText(value))
    .filter((value) => (
      value &&
      value.length <= 40 &&
      !/^[0-9.]+$/.test(value) &&
      !isAliExpressPlaceholderLike(value) &&
      !isAliExpressAntiBotSignal(value)
    ))
  ));
}

function getVariantObjectValue(source, keys = []) {
  if (!source || typeof source !== "object") return "";
  for (const key of keys) {
    if (source[key] == null) continue;
    const raw = source[key];
    const value = typeof raw === "string" || typeof raw === "number"
      ? sanitizeText(raw)
      : sanitizeText(readScalar(raw));
    if (value) return value;
  }
  return "";
}

function collectVariantIdCandidates(value) {
  const ids = new Set();
  const visit = (entry, depth = 0) => {
    if (depth > 2 || entry == null) return;
    if (typeof entry === "string" || typeof entry === "number") {
      const text = sanitizeText(entry);
      if (!text) return;
      for (const match of text.matchAll(/\b(\d{2,})\s*:\s*(\d{2,})\b/g)) {
        ids.add(`${match[1]}:${match[2]}`);
        ids.add(match[2]);
      }
      if (/^\d{2,}$/.test(text)) ids.add(text);
      return;
    }
    if (Array.isArray(entry)) {
      entry.forEach((item) => visit(item, depth + 1));
      return;
    }
    if (typeof entry === "object") {
      Object.entries(entry).forEach(([key, nested]) => {
        if (/id|attr|prop|sku/i.test(key)) visit(nested, depth + 1);
      });
    }
  };
  visit(value);
  return Array.from(ids);
}

function buildVariantPropertyLookup(source) {
  const groups = new Map();
  const valuesById = new Map();

  const addGroupValue = (groupName, valueName, image = "", ids = []) => {
    const label = sanitizeText(groupName || "Option");
    const normalizedValue = normalizeVariantValue(valueName);
    if (!label || !normalizedValue) return;

    const existing = groups.get(label) || [];
    groups.set(label, uniqueShortText(existing.concat(normalizedValue)));

    const record = { group: label, value: normalizedValue, image: normalizeUrl(image) };
    ids.map((id) => sanitizeText(id)).filter(Boolean).forEach((id) => valuesById.set(id, record));
  };

  walkObject(source, (node) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;

    const groupName = getVariantObjectValue(node, [
      "skuPropertyName",
      "propertyName",
      "salePropName",
      "attributeName",
      "specName",
      "name"
    ]);
    const propertyId = getVariantObjectValue(node, ["skuPropertyId", "propertyId", "salePropId", "attrId", "propId", "id"]);
    const valueLists = [
      node.skuPropertyValues,
      node.propertyValues,
      node.salePropValues,
      node.values,
      node.options,
      node.variantValues
    ].filter((value) => Array.isArray(value));

    if (!groupName || !valueLists.length) return;

    valueLists.flat().forEach((item) => {
      if (typeof item === "string" || typeof item === "number") {
        addGroupValue(groupName, String(item), "", propertyId ? [propertyId] : []);
        return;
      }
      if (!item || typeof item !== "object") return;

      const valueName = getVariantObjectValue(item, [
        "propertyValueDisplayName",
        "propertyValueDefinitionName",
        "propertyValueName",
        "skuPropertyTips",
        "skuPropertyValue",
        "valueName",
        "displayName",
        "name",
        "title",
        "value"
      ]);
      const image = getVariantObjectValue(item, [
        "skuPropertyImagePath",
        "image",
        "imageUrl",
        "imagePath",
        "iconUrl"
      ]);
      const valueId = getVariantObjectValue(item, [
        "propertyValueIdLong",
        "propertyValueId",
        "skuPropertyValueId",
        "valueId",
        "id"
      ]);

      const ids = [];
      if (valueId) ids.push(valueId);
      if (propertyId && valueId) ids.push(`${propertyId}:${valueId}`);
      addGroupValue(groupName, valueName, image, ids);
    });
  });

  return {
    groups: Array.from(groups.entries())
      .map(([name, values]) => ({ name, values: values.slice(0, 12) }))
      .filter((group) => group.values.length >= 2),
    valuesById
  };
}

function extractVariantPairsFromValue(value, fallbackKey = "", lookup = null, depth = 0) {
  if (depth > 2 || value == null) return [];

  if (typeof value === "string" || typeof value === "number") {
    const text = sanitizeText(value);
    if (!text || text.length > 120 || /^https?:\/\//i.test(text)) return [];

    const resolvedByIds = [];
    collectVariantIdCandidates(text).forEach((id) => {
      const match = lookup?.valuesById?.get(id);
      if (match) resolvedByIds.push({ name: match.group, value: match.value, image: match.image || "" });
    });
    if (resolvedByIds.length) return resolvedByIds;

    const pairMatches = text.split(/[|;]+/).map((entry) => sanitizeText(entry)).filter(Boolean).flatMap((entry) => {
      const match = entry.match(/^([^:=]{2,30})\s*[:=]\s*(.{1,60})$/);
      if (!match) return [];
      return [{ name: guessVariantLabel(match[1], [match[2]]), value: match[2] }];
    });
    if (pairMatches.length) return pairMatches;

    if (isVariantLikeKey(fallbackKey)) {
      const normalizedValue = normalizeVariantValue(text);
      if (!normalizedValue || /price|shipping|delivery|review|rating/i.test(normalizedValue)) return [];
      return [{ name: guessVariantLabel(fallbackKey, [normalizedValue]), value: normalizedValue }];
    }

    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => extractVariantPairsFromValue(entry, fallbackKey, lookup, depth + 1));
  }

  if (typeof value !== "object") return [];

  const directGroupName = getVariantObjectValue(value, [
    "skuPropertyName",
    "propertyName",
    "salePropName",
    "attributeName",
    "specName",
    "groupName"
  ]);
  const directValue = getVariantObjectValue(value, [
    "propertyValueDisplayName",
    "propertyValueDefinitionName",
    "propertyValueName",
    "skuPropertyTips",
    "skuPropertyValue",
    "valueName",
    "displayName",
    "name",
    "title",
    "value"
  ]);

  if (directGroupName && directValue) {
    return [{ name: guessVariantLabel(directGroupName, [directValue]), value: directValue }];
  }

  return Object.entries(value).flatMap(([key, nested]) => extractVariantPairsFromValue(nested, key, lookup, depth + 1));
}

function normalizeVariantAttributes(pairs = []) {
  const attributes = {};
  const images = [];

  (Array.isArray(pairs) ? pairs : []).forEach((pair) => {
    const name = sanitizeText(pair?.name || "");
    const value = normalizeVariantValue(pair?.value || "");
    if (!name || !value || value.length > 60) return;
    if (!attributes[name]) attributes[name] = value;
    if (pair?.image) images.push(normalizeUrl(pair.image));
  });

  return { attributes, images: images.filter(Boolean) };
}

function extractVariantOffersFromObjectTree(source) {
  const lookup = buildVariantPropertyLookup(source);
  const offers = [];

  walkObject(source, (node) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;

    let price = 0;
    let shipping = null;
    let image = "";
    let deliveryEstimate = "";

    for (const [key, value] of Object.entries(node)) {
      const lowerKey = key.toLowerCase();
      if (!price && /price|amount|saleprice|offerprice|activityprice|currentprice|displayprice/.test(lowerKey)) {
        const scalar = readScalar(value);
        price = pickFirstPositive([parseMoney(scalar), ...extractUsdValuesFromText(String(scalar || ""))]);
      }
      if (shipping == null && /shipping|freight|delivery|logistics|postage/.test(lowerKey)) {
        shipping = parseShippingTexts([String(readScalar(value) || "")]);
      }
      if (!image && /image|img|pic|thumb/.test(lowerKey)) {
        image = readImage(value);
      }
      if (!deliveryEstimate && /delivery|ship|eta|arrival|transit/.test(lowerKey)) {
        deliveryEstimate = extractDeliveryEstimateFromTexts([String(readScalar(value) || "")]);
      }
    }

    if (price <= 0 && shipping == null && !image) return;

    const { attributes, images } = normalizeVariantAttributes(
      Object.entries(node).flatMap(([key, value]) => extractVariantPairsFromValue(value, key, lookup))
    );
    if (!Object.keys(attributes).length) return;

    offers.push({
      key: buildVariantOfferKey(attributes),
      attributes,
      price,
      shipping,
      image: normalizeUrl(image || images[0] || ""),
      deliveryEstimate,
      source: "object-tree"
    });
  });

  return {
    groups: mergeVariantGroups(lookup.groups, extractVariantGroupsFromOffers(offers)),
    offers: mergeVariantOffers([], offers)
  };
}

function extractVariantGroupsFromObjectTree(source) {
  const groups = new Map();

  walkObject(source, (node) => {
    if (!node || typeof node !== "object") return;

    for (const [key, value] of Object.entries(node)) {
      const lowerKey = key.toLowerCase();
      const isVariantKey = /variant|sku|prop|property|option|attribute|color|colour|size|bundle|storage|capacity/.test(lowerKey);
      if (!isVariantKey) continue;

      const values = uniqueShortText(
        Array.isArray(value)
          ? value.flatMap((entry) => {
              if (typeof entry === "string" || typeof entry === "number") return [String(entry)];
              if (!entry || typeof entry !== "object") return [];
              return Object.values(entry).flatMap((nested) => typeof nested === "string" || typeof nested === "number" ? [String(nested)] : []);
            })
          : (typeof value === "string" ? value.split(/[|,/]/) : [])
      ).filter((entry) => !/price|image|shipping|rating|review/i.test(entry));

      if (values.length < 2 || values.length > 12) continue;
      const label = guessVariantLabel(key, values);
      const existing = groups.get(label) || [];
      groups.set(label, uniqueShortText(existing.concat(values)));
    }
  });

  return Array.from(groups.entries())
    .map(([name, values]) => ({ name, values: values.slice(0, 8) }))
    .filter((group) => group.values.length >= 2);
}

function extractVariantGroupsFromHtml($) {
  const groups = new Map();
  const addGroup = (name, values = []) => {
    const label = sanitizeText(name || "Option");
    const cleanedValues = uniqueShortText(values).filter((value) => !/^select|choose|view more/i.test(value));
    if (cleanedValues.length < 2) return;
    const existing = groups.get(label) || [];
    groups.set(label, uniqueShortText(existing.concat(cleanedValues)).slice(0, 12));
  };

  const readNodeTexts = (element) => {
    const $element = $(element);
    return [
      sanitizeText($element.text()),
      sanitizeText($element.attr("title")),
      sanitizeText($element.attr("aria-label")),
      sanitizeText($element.attr("data-title")),
      sanitizeText($element.attr("data-name")),
      sanitizeText($element.attr("data-value")),
      sanitizeText($element.attr("data-sku-title")),
      sanitizeText($element.attr("alt"))
    ].filter(Boolean);
  };

  const candidateSelectors = [
    "[class*='sku'] button",
    "[class*='Sku'] button",
    "[class*='variant'] button",
    "[class*='Variant'] button",
    "[class*='property'] li",
    "[class*='Property'] li",
    "[role='button'][title]",
    "[role='button'][aria-label]",
    "label[title]",
    "label[aria-label]",
    "select option",
    "img[alt]"
  ];

  const flatValues = candidateSelectors.flatMap((selector) =>
    $(selector).map((_, element) => readNodeTexts(element)).get().flat()
  );
  addGroup(guessVariantLabel("", flatValues), flatValues);

  const groupTitlePattern = /(nom de la couleur|color|colour|couleur|size|taille|bundle|pack|set|style|model|storage|capacity|version)/i;
  $("div, section, form, li").each((_, element) => {
    const $element = $(element);
    const blockText = sanitizeText($element.text());
    if (!groupTitlePattern.test(blockText) || blockText.length > 240) return;

    const titleText = sanitizeText(
      $element.find("h1,h2,h3,h4,label,dt,strong,[class*='title'],[class*='Title']").first().text() ||
      blockText.split(/\n|:/)[0]
    );
    const values = $element.find("button,li,label,[role='button'],img,[title],[aria-label],[data-title],[data-sku-title],[data-value]")
      .map((__, child) => readNodeTexts(child)).get().flat();
    addGroup(guessVariantLabel(titleText, values), values);
  });

  return Array.from(groups.entries())
    .map(([name, values]) => ({ name, values }))
    .filter((group) => group.values.length >= 2);
}

function extractVariantGroupsFromTextList(texts = []) {
  const values = uniqueShortText(texts).filter((value) => !/^select|choose/i.test(value));
  if (values.length < 2) return [];
  return [{ name: guessVariantLabel("", values), values: values.slice(0, 8) }];
}

function buildSellerTrustScore(product) {
  let score = 50;
  const rating = Number(product.rating || 0);
  const reviewCount = Number(product.reviewCount || 0);
  const soldCount = Number(product.soldCount || 0);

  if (rating >= 4.8) score += 22;
  else if (rating >= 4.5) score += 15;
  else if (rating >= 4.0) score += 7;
  else if (rating > 0) score -= 10;

  if (reviewCount >= 5000) score += 12;
  else if (reviewCount >= 500) score += 8;
  else if (reviewCount >= 50) score += 4;

  if (soldCount >= 1000) score += 8;
  else if (soldCount >= 100) score += 4;

  if (product.shipping != null && Number(product.shipping) === 0) score += 4;
  else if (product.shipping != null && Number(product.shipping) >= 10) score -= 4;

  if (product.restrictions?.restricted) score -= 10;
  if (product.restrictions?.banned) score -= 25;
  if (product.priceUnavailable) score -= 5;

  const finalScore = Math.max(15, Math.min(98, Math.round(score)));
  let label = "متوسط";
  if (finalScore >= 85) label = "ممتاز";
  else if (finalScore >= 72) label = "قوي";
  else if (finalScore >= 58) label = "مليح";

  return { score: finalScore, label };
}

function buildCustomsAdvisor(product) {
  const category = product.restrictions?.category || "general";
  const riskLevel = product.restrictions?.banned ? "high" : (product.restrictions?.restricted ? "medium" : "low");
  const docsMap = {
    phone: ["إثبات IMEI أو المطابقة", "فاتورة البائع"],
    radio: ["ترخيص توريد", "فاتورة البائع"],
    "tv-box": ["مرجع تقني للمنتج", "فاتورة البائع"],
    supplements: ["قائمة المكونات", "فاتورة البائع"],
    knife: ["مراجعة يدوية قبل الطلب"],
    general: ["فاتورة البائع"]
  };
  const saferAlternativeMap = {
    phone: "الأفضل تختار إكسسوارات أو قطع غيار بدل هاتف كامل.",
    radio: "الأفضل تختار إكسسوارات Bluetooth من غير تجهيزات إرسال راديو.",
    "tv-box": "الأفضل تختار إكسسوارات ستريمنغ بمواصفات وشهادات واضحة.",
    supplements: "الأفضل تختار إكسسوارات عناية أو رفاهة غير قابلة للاستهلاك.",
    knife: "الأفضل تختار أدوات مطبخ أقل حساسية في الديوانة.",
    general: "اختار منتجات بمواصفات واضحة وشحن عادي."
  };

  return {
    level: riskLevel,
    category,
    docs: docsMap[category] || docsMap.general,
    note: product.restrictions?.reasons?.[0] || "ما ثماش مانع ديوانة واضح حاليا.",
    saferAlternative: saferAlternativeMap[category] || saferAlternativeMap.general
  };
}

function buildEstimatedTimeline(product) {
  const estimate = inferDeliveryEstimate(product.shipping);
  return [
    { step: "تأكيد الطلب", status: "current", note: "كي يتأكد الدفع، نثبتو الطلب مع البائع." },
    { step: "تجهيز البائع", status: "upcoming", note: "عادة بين نهار و4 أيام قبل الإرسال." },
    { step: "الشحن الدولي", status: "upcoming", note: estimate },
    { step: "الديوانة التونسية", status: product.restrictions?.restricted || product.restrictions?.banned ? "attention" : "upcoming", note: product.restrictions?.reasons?.[0] || "مراجعة ديوانية عادية." },
    { step: "التسليم المحلي", status: "upcoming", note: "التسليم الأخير عبر الموزع المحلي أو البريد." }
  ];
}

function isAffiliateAppKeyInvalidError(error) {
  return Boolean(
    error?.apiError?.subCode === "isv.appkey-not-exists" ||
    error?.apiError?.code === 29 ||
    /invalid app key/i.test(String(error?.message || ""))
  );
}

function buildUnavailableProductResponse({ canonicalUrl, productId, source = "manual-quote-required", alertText = "" }) {
  const normalizedAlertText = sanitizeText(alertText);
  const product = {
    success: true,
    title: "منتج AliExpress",
    description: "",
    price: 0,
    shipping: null,
    image: "https://placehold.co/600x600/0f172a/f8fafc?text=AliExpress",
    rating: 0,
    reviewCount: 0,
    soldCount: 0,
    variants: [],
    url: canonicalUrl,
    source,
    cached: false,
    fetchedAt: new Date().toISOString(),
    deliveryEstimate: "من 12 حتى 25 يوم",
    manualQuoteRecommended: true,
    priceUnavailable: true,
    errorHint: normalizedAlertText
  };

  product.shippingLabel = "غير متوفر";
  product.restrictions = classifyProductRestrictions(product);
  product.alerts = buildProductAlerts(product);
  if (normalizedAlertText) {
    product.alerts.unshift({ level: "warning", text: normalizedAlertText });
  }
  product.trustScore = buildSellerTrustScore(product);
  product.customsAdvisor = buildCustomsAdvisor(product);
  product.deliveryTimeline = buildEstimatedTimeline(product);

  return product;
}

function buildVariantOfferProduct(baseProduct, offer) {
  const price = Number(offer?.price || 0) > 0 ? Number(offer.price) : Number(baseProduct?.price || 0);
  const shipping = offer?.shipping != null
    ? Number(offer.shipping)
    : (baseProduct?.shipping != null ? Number(baseProduct.shipping) : null);
  const image = normalizeUrl(offer?.image || baseProduct?.image || "");
  const deliveryEstimate = sanitizeText(offer?.deliveryEstimate || baseProduct?.deliveryEstimate || inferDeliveryEstimate(shipping));
  const attributes = { ...(offer?.attributes || {}) };
  const selectionLabel = Object.values(attributes).filter(Boolean).join(" / ");

  const variantProduct = {
    title: baseProduct?.title || "منتج AliExpress",
    description: baseProduct?.description || "",
    price,
    shipping,
    image,
    rating: Number(baseProduct?.rating || 0),
    reviewCount: Number(baseProduct?.reviewCount || 0),
    soldCount: Number(baseProduct?.soldCount || 0),
    url: baseProduct?.url || "",
    source: baseProduct?.source || "scrape",
    deliveryEstimate,
    priceUnavailable: price <= 0 && Boolean(baseProduct?.priceUnavailable),
    variantSelectionLabel: selectionLabel
  };

  variantProduct.shippingLabel = variantProduct.shipping == null
    ? "غير متوفر"
    : (variantProduct.shipping === 0 ? "شحن مجاني" : `${variantProduct.shipping.toFixed(2)} USD`);
  variantProduct.restrictions = classifyProductRestrictions(variantProduct);
  variantProduct.alerts = buildProductAlerts(variantProduct);
  variantProduct.trustScore = buildSellerTrustScore(variantProduct);
  variantProduct.customsAdvisor = buildCustomsAdvisor(variantProduct);
  variantProduct.deliveryTimeline = buildEstimatedTimeline(variantProduct);
  variantProduct.manualQuoteRecommended = Boolean(
    variantProduct.restrictions?.banned ||
    variantProduct.restrictions?.restricted ||
    (Number.isFinite(Number(variantProduct.shipping)) && Number(variantProduct.shipping) >= 8)
  );

  return {
    key: offer?.key || buildVariantOfferKey(attributes),
    attributes,
    price: variantProduct.price,
    shipping: variantProduct.shipping,
    image: variantProduct.image,
    deliveryEstimate: variantProduct.deliveryEstimate,
    shippingLabel: variantProduct.shippingLabel,
    priceUnavailable: variantProduct.priceUnavailable,
    alerts: variantProduct.alerts,
    restrictions: variantProduct.restrictions,
    trustScore: variantProduct.trustScore,
    customsAdvisor: variantProduct.customsAdvisor,
    deliveryTimeline: variantProduct.deliveryTimeline,
    manualQuoteRecommended: variantProduct.manualQuoteRecommended,
    variantSelectionLabel: selectionLabel
  };
}

function cleanupProductTitle(title) {
  return sanitizeText(title)
    .replace(/\s{2,}/g, " ")
    .replace(/^[\-\|\s]+|[\-\|\s]+$/g, "")
    .trim();
}

function cleanupProductDescription(text, fallbackTitle = "") {
  const cleaned = sanitizeText(text)
    .replace(/\s{2,}/g, " ")
    .replace(/^[\-\|\s]+|[\-\|\s]+$/g, "")
    .trim();

  if (!cleaned) return "";
  if (isLowValueProductDescription(cleaned)) return "";
  if (/^ae.+ip.+模板/i.test(cleaned)) return "";
  if (isAliExpressPlaceholderText(cleaned)) return "";
  if (fallbackTitle && cleaned.toLowerCase() === String(fallbackTitle).trim().toLowerCase()) return "";
  return cleaned.length > 320 ? `${cleaned.slice(0, 317).trim()}...` : cleaned;
}

function pickBestProductTitle(...candidates) {
  for (const candidate of candidates) {
    const cleaned = cleanupProductTitle(candidate || "");
    if (!cleaned) continue;
    if (isLowValueProductTitle(cleaned)) continue;
    if (isAliExpressPlaceholderLike(cleaned)) continue;
    return cleaned;
  }
  return "";
}

function pickBestProductDescription(candidates = [], fallbackTitle = "") {
  for (const candidate of candidates) {
    const cleaned = cleanupProductDescription(candidate || "", fallbackTitle);
    if (!cleaned) continue;
    if (isLowValueProductDescription(cleaned)) continue;
    if (isAliExpressPlaceholderLike(cleaned)) continue;
    return cleaned;
  }
  return "";
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

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseMaybeJson(value, maxDepth = 3) {
  let current = value;
  let depth = 0;

  while (typeof current === "string" && depth < maxDepth) {
    const trimmed = current.trim();
    if (!trimmed || !/^[\[{]/.test(trimmed)) break;
    const parsed = safeJsonParse(trimmed);
    if (!parsed) break;
    current = parsed;
    depth += 1;
  }

  return current;
}

function summarizeValueKeys(value, limit = 12) {
  if (!value || typeof value !== "object") return [];
  return Object.keys(value).slice(0, limit);
}

function previewValue(value, limit = 280) {
  const text = sanitizeText(
    typeof value === "string"
      ? value
      : JSON.stringify(value)
  );
  return text.length > limit ? `${text.slice(0, limit - 3)}...` : text;
}

function buildAffiliateResponseDebugSummary(responseData) {
  const errorResponse = responseData?.error_response || null;
  const methodResponse =
    responseData?.aliexpress_affiliate_productdetail_get_response ||
    responseData?.aliexpress_affiliate_product_detail_get_response ||
    responseData?.aliexpress_affiliate_productdetails_get_response ||
    responseData;
  const rawRespResult = methodResponse?.resp_result ?? methodResponse?.respResult ?? null;
  const payload = parseMaybeJson(rawRespResult);
  const resultNode = parseMaybeJson(payload?.result ?? methodResponse?.result ?? null);
  const productsNode = parseMaybeJson(
    resultNode?.products ??
    payload?.products ??
    resultNode?.result ??
    null
  );
  const productNode = parseMaybeJson(
    productsNode?.product ??
    resultNode?.product ??
    payload?.product ??
    null
  );
  const firstProduct = Array.isArray(productNode) ? productNode[0] : productNode;

  return {
    dataType: Array.isArray(responseData) ? "array" : typeof responseData,
    topKeys: summarizeValueKeys(responseData),
    errorResponseKeys: summarizeValueKeys(errorResponse),
    errorCode: errorResponse?.code ?? null,
    errorMsg: errorResponse?.msg ?? null,
    errorSubCode: errorResponse?.sub_code ?? null,
    errorSubMsg: errorResponse?.sub_msg ?? null,
    errorPreview: errorResponse ? previewValue(errorResponse) : "",
    methodResponseKeys: summarizeValueKeys(methodResponse),
    respResultType: Array.isArray(rawRespResult) ? "array" : typeof rawRespResult,
    respResultPreview: rawRespResult == null ? "" : previewValue(rawRespResult),
    payloadKeys: summarizeValueKeys(payload),
    resultKeys: summarizeValueKeys(resultNode),
    productsKeys: summarizeValueKeys(productsNode),
    firstProductKeys: summarizeValueKeys(firstProduct),
    firstProductPreview: firstProduct == null ? "" : previewValue(firstProduct)
  };
}

function extractBalancedJson(source, startIndex) {
  const opening = source[startIndex];
  const closing = opening === "{" ? "}" : "]";
  let depth = 0;
  let quote = "";
  let escaped = false;

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }

    if (char === "'" || char === "\"" || char === "`") {
      quote = char;
      continue;
    }

    if (char === opening) depth += 1;
    if (char === closing) {
      depth -= 1;
      if (depth === 0) return source.slice(startIndex, index + 1);
    }
  }

  return "";
}

function extractJsonObjectsFromHtml(html, $) {
  const objects = [];
  const scripts = $("script").map((_, element) => $(element).html() || "").get();
  for (const rawScript of scripts) {
    const script = rawScript.trim();
    if (!script) continue;

    if (script.startsWith("{") || script.startsWith("[")) {
      const parsed = safeJsonParse(script);
      if (parsed) objects.push(parsed);
      continue;
    }

    const assignmentPattern = /(?:window\.[\w$]+|[\w$]+)\s*=\s*[\[{]/g;
    let match = null;
    while ((match = assignmentPattern.exec(script)) !== null) {
      const relativeStart = script.slice(match.index).search(/[\[{]/);
      const start = relativeStart >= 0 ? match.index + relativeStart : -1;
      if (start < 0) continue;
      const jsonChunk = extractBalancedJson(script, start);
      if (!jsonChunk) continue;

      const parsed = safeJsonParse(jsonChunk);
      if (parsed) objects.push(parsed);
    }

    const jsonParsePattern = /JSON\.parse\(\s*(['"`])([\s\S]*?)\1\s*\)/g;
    while ((match = jsonParsePattern.exec(script)) !== null) {
      const rawValue = match[2]
        .replace(/\\"/g, "\"")
        .replace(/\\'/g, "'")
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\\\/g, "\\");
      const parsed = safeJsonParse(rawValue);
      if (parsed) objects.push(parsed);
    }

    const objectMarkerPattern = /[\[{]/g;
    while ((match = objectMarkerPattern.exec(script)) !== null) {
      const jsonChunk = extractBalancedJson(script, match.index);
      if (!jsonChunk || jsonChunk.length < 20) continue;
      const parsed = safeJsonParse(jsonChunk);
      if (parsed) objects.push(parsed);
      if (jsonChunk) {
        objectMarkerPattern.lastIndex = match.index + jsonChunk.length;
      }
    }
  }
  return objects;
}

function decodeAliExpressEscapes(value = "") {
  return String(value || "")
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/\\\//g, "/")
    .replace(/&quot;/g, "\"")
    .replace(/&#34;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function pickFirstRegexValue(source, patterns = []) {
  for (const pattern of patterns) {
    const match = String(source || "").match(pattern);
    if (!match?.[1]) continue;
    const value = sanitizeText(decodeAliExpressEscapes(match[1]));
    if (value) return value;
  }
  return "";
}

function extractProductFieldsFromRawHtml(html) {
  const source = String(html || "");
  const title = pickFirstRegexValue(source, [
    /"subject"\s*:\s*"([^"]{6,500})"/i,
    /"productTitle"\s*:\s*"([^"]{6,500})"/i,
    /"seoTitle"\s*:\s*"([^"]{6,500})"/i,
    /"title"\s*:\s*"([^"]{6,500}?)"\s*,\s*"tradeCount"/i,
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
  ]);
  const image = normalizeUrl(pickFirstRegexValue(source, [
    /"imagePathList"\s*:\s*\[\s*"([^"]+)"/i,
    /"productMainImageUrl"\s*:\s*"([^"]+)"/i,
    /"mainImageUrl"\s*:\s*"([^"]+)"/i,
    /"imageUrl"\s*:\s*"([^"]+)"/i,
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
  ]));
  const priceText = pickFirstRegexValue(source, [
    /"formatedActivityPrice"\s*:\s*"([^"]+)"/i,
    /"formatedPrice"\s*:\s*"([^"]+)"/i,
    /"skuCalPrice"\s*:\s*"([^"]+)"/i,
    /"salePrice"\s*:\s*"([^"]+)"/i,
    /"minPrice"\s*:\s*"([^"]+)"/i,
    /"minActivityAmount"\s*:\s*"([^"]+)"/i,
    /"price"\s*:\s*"((?:US\s*)?\$?\s*[0-9][^"]{0,24})"/i
  ]);
  const ratingText = pickFirstRegexValue(source, [
    /"averageStar"\s*:\s*"([^"]+)"/i,
    /"starRating"\s*:\s*"([^"]+)"/i,
    /"rating"\s*:\s*"([0-5](?:[.,][0-9])?)"/i
  ]);
  const reviewText = pickFirstRegexValue(source, [
    /"reviewerNum"\s*:\s*"([^"]+)"/i,
    /"reviewCount"\s*:\s*"([^"]+)"/i,
    /"feedbackRating"\s*:\s*"([^"]+)"/i
  ]);
  const soldText = pickFirstRegexValue(source, [
    /"tradeCount"\s*:\s*"([^"]+)"/i,
    /"formatTradeCount"\s*:\s*"([^"]+)"/i,
    /"orders"\s*:\s*"([^"]+)"/i
  ]);

  return {
    title,
    image,
    price: pickFirstPositive([parseMoney(priceText), ...extractUsdValuesFromText(priceText)]),
    rating: normalizeRating(ratingText),
    reviewCount: parseCompactCount(reviewText),
    soldCount: parseCompactCount(soldText)
  };
}

function extractProductFieldsFromObjectTree(source) {
  const result = { title: "", description: "", image: "", price: 0, shipping: null, deliveryEstimate: "", rating: 0, reviewCount: 0, soldCount: 0, variants: [] };

  walkObject(source, (node) => {
    if (Array.isArray(node)) return;
    for (const [key, value] of Object.entries(node)) {
      const lowerKey = key.toLowerCase();

        if (!result.title && typeof value === "string" && /(?:subject|title|producttitle|seotitle|displaytitle|productname|itemname|tradename|name)/i.test(lowerKey)) {
          const title = sanitizeText(value);
          if (title && !isLowValueProductTitle(title)) result.title = title;
        }

        if (!result.description && typeof value === "string" && /(?:description|summary|subtitle|sellingpoint|feature|overview|seoDescription)/i.test(lowerKey)) {
          const description = cleanupProductDescription(value, result.title);
          if (description) result.description = description;
        }

      if (!result.image && /(?:image|img|cover|thumb|pic)/i.test(lowerKey)) {
        const image = readImage(value);
        if (image) result.image = image;
      }

      if (!result.price && /(?:price|amount|saleprice|minprice|maxprice|currentprice|activityprice|displayprice)/i.test(lowerKey)) {
        const scalar = readScalar(value);
        const price = pickLowestPositive([parseMoney(scalar), ...extractUsdValuesFromText(String(scalar || ""))]);
        if (price > 0) result.price = price;
      }

      if (result.shipping == null && /(?:shipping|freight|delivery|logistics|postage)/i.test(lowerKey)) {
        const shippingValue = parseShippingTexts([String(readScalar(value) || "")]);
        if (shippingValue != null) result.shipping = shippingValue;
      }

      if (!result.deliveryEstimate && /(?:delivery|ship|eta|arrival|transit)/i.test(lowerKey)) {
        const estimate = extractDeliveryEstimateFromTexts([String(readScalar(value) || "")]);
        if (estimate) result.deliveryEstimate = estimate;
      }

      if (!result.rating && /(?:rating|star|reviewscore|averagestar)/i.test(lowerKey)) {
        const rating = normalizeRating(readScalar(value));
        if (rating > 0) result.rating = rating;
      }

      if (!result.reviewCount && /(?:reviewcount|reviews|reviewnum|commentcount|feedback)/i.test(lowerKey)) {
        const count = parseCompactCount(String(readScalar(value) || ""));
        if (count > 0) result.reviewCount = count;
      }

      if (!result.soldCount && /(?:sold|orders|trade|salecount|wishcount)/i.test(lowerKey)) {
        const count = parseCompactCount(String(readScalar(value) || ""));
        if (count > 0) result.soldCount = count;
      }
    }
  });

  result.variants = extractVariantGroupsFromObjectTree(source);

  return result;
}

function extractHtmlProduct(html, url, source) {
  const $ = cheerio.load(html);
  const rawExtracted = extractProductFieldsFromRawHtml(html);
  const antiBotPage = isAliExpressAntiBotSignal([
    $("title").text(),
    $("body").text().slice(0, 5000),
    html.slice(0, 12000)
  ].join(" "));
  const jsonLdObjects = $("script[type='application/ld+json']").map((_, element) => safeJsonParse($(element).html() || "")).get().filter(Boolean);
  const embedded = extractProductFieldsFromObjectTree([
    ...extractJsonObjectsFromHtml(html, $),
    ...jsonLdObjects
  ]);
  const safeEmbeddedTitle = !isLowValueProductTitle(embedded.title) && !isAliExpressBlockedTitle(embedded.title)
    ? embedded.title
    : "";
  const title =
    rawExtracted.title ||
    safeEmbeddedTitle ||
    sanitizeText($("meta[property='og:title']").attr("content")) ||
    sanitizeText($("meta[name='twitter:title']").attr("content")) ||
    sanitizeText($("meta[name='title']").attr("content")) ||
    sanitizeText($("[data-pl='product-title']").first().text()) ||
      sanitizeText($("h1").first().text()) ||
      sanitizeText($("title").text());
  const description = cleanupProductDescription(
    embedded.description ||
    sanitizeText($("meta[property='og:description']").attr("content")) ||
    sanitizeText($("meta[name='description']").attr("content")) ||
    sanitizeText($("meta[name='twitter:description']").attr("content")) ||
    sanitizeText($("[class*='description']").first().text()) ||
    sanitizeText($("[class*='Description']").first().text()) ||
    sanitizeText($("body").text().slice(0, 600)),
    title
  );
  const image =
    rawExtracted.image ||
    embedded.image ||
    normalizeUrl($("meta[property='og:image']").attr("content")) ||
    normalizeUrl($("meta[name='twitter:image']").attr("content")) ||
    normalizeUrl($("img").first().attr("src"));
  const selectorPrice = extractPriceFromTextList([
    $("[class*='price']").first().text(),
    $("[class*='Price']").first().text(),
    $("[data-testid*='price']").first().text()
  ]);
  const bodyPrice = extractPriceFromTextList([
    $("meta[property='og:description']").attr("content"),
    $("body").text().slice(0, 4000)
  ]);
  const price = pickFirstPositive([
    parseMoney($("meta[property='product:price:amount']").attr("content")),
    parseMoney($("meta[name='twitter:data1']").attr("content")),
    parseMoney($("meta[itemprop='price']").attr("content")),
    rawExtracted.price,
    selectorPrice,
    embedded.price,
    bodyPrice
  ]);
  const rating = rawExtracted.rating || embedded.rating || extractRatingFromTextList([
    ...$("[class*='rating'], [class*='Rating'], [class*='star'], [class*='Star']").map((_, el) => $(el).text()).get(),
    ...$("[class*='review'], [class*='Review'], [class*='feedback']").map((_, el) => $(el).text()).get()
  ]);
  const reviewCount = rawExtracted.reviewCount || embedded.reviewCount || extractCountFromTextList([
    $("body").text(),
    ...$("[class*='review'], [class*='Review'], [class*='feedback']").map((_, el) => $(el).text()).get()
  ], /review|feedback|ratings?|avis/i);
  const soldCount = rawExtracted.soldCount || embedded.soldCount || extractCountFromTextList([
    $("body").text(),
    ...$("[class*='sold'], [class*='order'], [class*='trade']").map((_, el) => $(el).text()).get()
  ], /sold|orders?|commandes|ventes/i);
  const shipping = parseShippingTexts([
    ...$("[class*='shipping'], [class*='delivery'], [class*='freight'], [class*='logistics']").map((_, el) => $(el).text()).get()
  ]);
  const deliveryEstimate = embedded.deliveryEstimate || extractDeliveryEstimateFromTexts([
    ...$("[class*='delivery'], [class*='Delivery'], [class*='arrival'], [class*='transit'], [class*='logistics']").map((_, el) => $(el).text()).get()
  ]);
  const variants = antiBotPage
    ? []
    : (embedded.variants?.length ? embedded.variants : extractVariantGroupsFromHtml($));

    return {
      success: true,
      title: antiBotPage || isAliExpressBlockedTitle(title) || isAliExpressPlaceholderText(title) ? "" : title,
      description: antiBotPage ? "" : description,
      price: antiBotPage ? 0 : price,
      shipping,
      deliveryEstimate,
      image: antiBotPage ? "" : image,
    rating: antiBotPage ? 0 : (rating || 0),
    reviewCount: antiBotPage ? 0 : reviewCount,
    soldCount: antiBotPage ? 0 : soldCount,
    variants,
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
      if (error?.nonRetryable || hasUsefulPartialProductData(error?.partialData)) break;
      if (attempt < SCRAPE_RETRIES) await sleep(700 * (attempt + 1));
    }
  }
  throw lastError;
}

async function fetchAliExpressApiProduct(productId, url) {
  return null;
}

function buildAffiliateLink(url) {
  return url;
}

function shouldRetryScrapingDogRequest(error) {
  const status = Number(error?.response?.status || 0);
  if (error?.code === "ECONNABORTED") return true;
  if (!status) return true;
  return status >= 500 || status === 429;
}

function normalizeScrapedProductData(product = {}, url, source) {
  return {
    success: true,
    title: pickBestProductTitle(product.title, product.description) || "",
    description: pickBestProductDescription([product.description], product.title || ""),
    price: Number(product.price || 0),
    shipping: product.shipping != null ? Number(product.shipping) : null,
    deliveryEstimate: sanitizeText(product.deliveryEstimate || ""),
    image: normalizeUrl(product.image || ""),
    rating: normalizeRating(product.rating),
    reviewCount: Number(product.reviewCount || 0),
    soldCount: Number(product.soldCount || 0),
    variants: Array.isArray(product.variants) ? product.variants : [],
    url,
    affiliateUrl: buildAffiliateLink(url),
    source
  };
}

function buildScrapePartialData(product = {}, url, source) {
  const normalized = normalizeScrapedProductData(product, url, source);
  return {
    title: normalized.title,
    description: normalized.description,
    image: normalized.image,
    price: normalized.price,
    shipping: normalized.shipping,
    deliveryEstimate: normalized.deliveryEstimate,
    rating: normalized.rating,
    reviewCount: normalized.reviewCount,
    soldCount: normalized.soldCount,
    variants: normalized.variants,
    url: normalized.url
  };
}

async function fetchScrapingDogHtml(url, options = {}) {
  if (!SCRAPINGDOG_API_KEY) {
    const error = new Error("ScrapingDog API key is missing");
    error.status = 500;
    throw error;
  }

  const useDynamic = options.dynamic === true;
  let lastError = null;

  for (let attempt = 0; attempt <= SCRAPINGDOG_RETRY_COUNT; attempt += 1) {
    try {
      const response = await axios.get(SCRAPINGDOG_API_URL, {
        params: {
          api_key: SCRAPINGDOG_API_KEY,
          url,
          dynamic: String(useDynamic ? true : SCRAPINGDOG_DYNAMIC),
          country: SCRAPINGDOG_COUNTRY || undefined
        },
        timeout: SCRAPE_TIMEOUT_MS,
        responseType: "text",
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": SCRAPINGDOG_ACCEPT_LANGUAGE,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
        },
        proxy: false
      });

      const html = typeof response.data === "string" ? response.data : String(response.data || "");
      if (!html.trim()) {
        const error = new Error("ScrapingDog returned an empty HTML response");
        error.status = 502;
        error.nonRetryable = true;
        throw error;
      }

      return html;
    } catch (error) {
      lastError = error;
      if (attempt >= SCRAPINGDOG_RETRY_COUNT || !shouldRetryScrapingDogRequest(error)) {
        break;
      }
      await sleep(500 * (attempt + 1));
    }
  }

  if (lastError?.response?.status) {
    const status = Number(lastError.response.status);
    const error = new Error(`ScrapingDog request failed with status ${status}`);
    error.status = status >= 500 ? 502 : status;
    error.nonRetryable = status < 500 && status !== 429;
    throw error;
  }

  throw lastError || new Error("ScrapingDog request failed");
}

function isIncompleteScrapedProduct(product = {}) {
  return Boolean(
    !product.title ||
    !product.image ||
    (!product.price && !product.description) ||
    isAliExpressBlockedTitle(product.title) ||
    isAliExpressBlockedTitle(product.description) ||
    isAliExpressPlaceholderLike(product.title) ||
    isAliExpressPlaceholderLike(product.description)
  );
}

async function scrapeAliExpressWithScrapingDog(url, source = "playwright") {
  let browser;

  try {
    if (!playwright) {
      throw new Error("Playwright not available");
    }

    const proxyConfig = getScrapeProxyConfig();

    browser = await playwright.chromium.launch({
      headless: true,
      args: ["--no-sandbox"],
      proxy: proxyConfig
        ? {
            server: proxyConfig.server,
            username: proxyConfig.username || undefined,
            password: proxyConfig.password || undefined
          }
        : undefined
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      locale: "en-US"
    });

    const page = await context.newPage();

await page.goto(url, {
  waitUntil: "domcontentloaded",
  timeout: 20000
}).catch(() => {});

await page.waitForLoadState("domcontentloaded").catch(() => {});
await page.waitForTimeout(3000).catch(() => {});

    const html = await page.content();

    // 🚨 BLOCK DETECTION
    if (
      html.includes("sk-container") ||
      html.includes("captcha") ||
      html.includes("verify")
    ) {
      throw new Error("Blocked by AliExpress");
    }

    const data = await page.evaluate(() => {
      const clean = (el) => el?.innerText?.trim();

      const title =
        clean(document.querySelector("h1")) ||
        clean(document.querySelector("[data-pl='product-title']"));

      const price =
        clean(document.querySelector("[class*='price']")) ||
        document.body.innerText.match(/\$\d+(\.\d+)?/)?.[0];

      const image =
        document.querySelector("img[src*='alicdn']")?.src ||
        document.querySelector("img")?.src;

      return { title, price, image };
    });

    if (!data.title || !data.price) {
      throw new Error("Invalid scraping result");
    }

    // ✅ IMPORTANT → keep your system format
    return normalizeScrapedProductData(
      {
        title: data.title,
        price: data.price,
        image: data.image,
        source: "playwright"
      },
      url,
      "playwright"
    );

  } catch (error) {
    const partial = {
      title: "",
      price: 0,
      image: "",
      source: "playwright-failed"
    };

    error.partialData = partial;
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}
async function legacyScrapeWithPlaywright(url) {
  return scrapeAliExpressWithScrapingDog(url, "scrapingdog");
}

async function scrapeWithHttp(url) {
  return scrapeAliExpressWithScrapingDog(url, "scrapingdog-http");
}

async function fetchAliExpressApiProductLegacy(productId) {
  if (!ALIEXPRESS_API_BASE_URL || !ALIEXPRESS_APP_KEY || !ALIEXPRESS_APP_SECRET || !productId || !hasAliExpressDsAccessToken()) {
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
    access_token: String(process.env.ALIEXPRESS_ACCESS_TOKEN || "").trim(),
    ship_to_country: "TN",
    target_currency: "USD",
    target_language: "en_US"
  };

  params.sign = signTopRequest(params, ALIEXPRESS_APP_SECRET);

  const response = await axios.get(ALIEXPRESS_API_BASE_URL, {
    params,
    timeout: 20_000,
    ...getAxiosProxyOptions()
  });

  const extracted = extractProductFieldsFromObjectTree(response.data);
  if (!extracted.title && !extracted.image && !extracted.description && !extracted.price) {
    throw new Error("AliExpress API returned no usable product fields");
  }

  return {
    title: extracted.title,
    description: extracted.description,
    image: extracted.image,
    price: extracted.price,
    shipping: extracted.shipping,
    deliveryEstimate: extracted.deliveryEstimate || "",
    rating: extracted.rating || 0,
    reviewCount: extracted.reviewCount || 0,
    soldCount: extracted.soldCount || 0,
    variants: extracted.variants || [],
    source: "aliexpress-api"
  };
}


async function fetchAliExpressAffiliateProduct(productId) {
  if (!ALIEXPRESS_AFFILIATE_API_BASE_URL || !ALIEXPRESS_APP_KEY || !ALIEXPRESS_APP_SECRET || !productId) {
    return null;
  }

  const attemptCountries = ["TN", "", "US"];
  let lastError = null;

  for (const country of attemptCountries) {
    try {
      const params = {
        app_key: ALIEXPRESS_APP_KEY,
        method: ALIEXPRESS_AFFILIATE_PRODUCT_METHOD,
        format: "json",
        sign_method: "hmac",
        timestamp: formatTopTimestamp(),
        v: "2.0",
        partner_id: "apidoc",
        simplify: "true",
        fields: "product_title,product_detail_url,product_main_image_url,product_small_image_urls,target_sale_price,target_sale_price_currency,target_app_sale_price,target_app_sale_price_currency,app_sale_price,app_sale_price_currency,sale_price,sale_price_currency,evaluate_rate,lastest_volume,shop_id,seller_name",
        product_ids: String(productId),
        target_currency: "USD",
        target_language: "EN"
      };

      if (country) {
        params.country = country;
      }
      if (ALIEXPRESS_TRACKING_ID) {
        params.tracking_id = ALIEXPRESS_TRACKING_ID;
      }

      params.sign = signTopRequest(params, ALIEXPRESS_APP_SECRET, params.sign_method);

      const body = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          body.append(key, String(value));
        }
      });

      const response = await axios.post(ALIEXPRESS_AFFILIATE_API_BASE_URL, body.toString(), {
        timeout: 20_000,
        headers: {
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        ...getAxiosProxyOptions()
      });

      if (response.data?.error_response) {
        const apiError = response.data.error_response;
        const message = apiError?.sub_msg || apiError?.msg || "AliExpress Affiliate API returned error_response";
        const error = new Error(message);
        error.nonRetryable = true;
        error.apiError = {
          code: apiError?.code ?? null,
          msg: apiError?.msg ?? null,
          subCode: apiError?.sub_code ?? null,
          subMsg: apiError?.sub_msg ?? null
        };
        throw error;
      }

      const methodResponse =
        response.data?.aliexpress_affiliate_productdetail_get_response ||
        response.data?.aliexpress_affiliate_product_detail_get_response ||
        response.data?.aliexpress_affiliate_productdetails_get_response ||
        response.data;
      const rawRespResult = methodResponse?.resp_result ?? methodResponse?.respResult ?? null;
      const payload = parseMaybeJson(rawRespResult);
      const resultNode = parseMaybeJson(payload?.result ?? methodResponse?.result ?? null);
      const productsNode = parseMaybeJson(
        resultNode?.products ??
        payload?.products ??
        resultNode?.result ??
        null
      );
      const rawProducts = parseMaybeJson(
        productsNode?.product ??
        resultNode?.product ??
        payload?.product ??
        null
      );
      const firstProduct = Array.isArray(rawProducts) ? rawProducts[0] : rawProducts;
      const extracted = extractProductFieldsFromObjectTree([
        response.data,
        methodResponse,
        payload,
        resultNode,
        productsNode,
        firstProduct
      ]);
      const title = pickBestProductTitle(
        firstProduct?.product_title,
        firstProduct?.title,
        firstProduct?.productName,
        firstProduct?.item_title,
        extracted.title
      );
      const image = normalizeUrl(
        firstProduct?.product_main_image_url ||
        firstProduct?.image_url ||
        firstProduct?.main_image ||
        firstProduct?.product_small_image_urls?.split?.(",")?.[0] ||
        extracted.image
      );
      const price = pickFirstPositive([
        parseMoney(firstProduct?.target_sale_price),
        parseMoney(firstProduct?.target_app_sale_price),
        parseMoney(firstProduct?.app_sale_price),
        parseMoney(firstProduct?.sale_price),
        parseMoney(firstProduct?.targetOriginalPrice),
        parseMoney(firstProduct?.targetSalePrice),
        parseMoney(firstProduct?.promotion_price),
        extracted.price
      ]);
      const soldCount = Math.max(
        parseCompactCount(firstProduct?.lastest_volume),
        parseCompactCount(firstProduct?.orders),
        Number(extracted.soldCount || 0)
      );

      if (title || image || price) {
        return {
          title,
          description: "",
          image,
          price,
          shipping: null,
          deliveryEstimate: "",
          rating: normalizeRating(extracted.rating) || 0,
          reviewCount: Number(extracted.reviewCount || 0),
          soldCount,
          variants: [],
          source: "aliexpress-affiliate-api"
        };
      }

      const debugSummary = buildAffiliateResponseDebugSummary(response.data);
      lastError = new Error(`AliExpress Affiliate API returned no usable product fields (country=${country || "none"}, resp_code=${payload?.resp_code || methodResponse?.resp_code || "unknown"})`);
      log("warn", "AliExpress Affiliate API returned empty product", {
        productId,
        country: country || "none",
        respCode: payload?.resp_code || methodResponse?.resp_code || null,
        respMsg: payload?.resp_msg || methodResponse?.resp_msg || null,
        debug: debugSummary
      });
    } catch (error) {
      lastError = error;
      log("warn", "AliExpress Affiliate API request failed", {
        productId,
        country: country || "none",
        error: error.message,
        apiError: error?.apiError || null,
        responseStatus: error?.response?.status || null,
        responseDataPreview: error?.response?.data ? previewValue(error.response.data) : ""
      });
      if (error?.nonRetryable) break;
    }
  }

  throw lastError || new Error("AliExpress Affiliate API returned no usable product fields");
}

async function getBrowser() {
  if (!playwright?.chromium) {
    throw new Error("Playwright is not installed");
  }

  // reuse browser if alive
  if (browserPromise) {
    try {
      const existingBrowser = await browserPromise;
      if (typeof existingBrowser?.isConnected !== "function" || existingBrowser.isConnected()) {
        return existingBrowser;
      }
      clearBrowserReference("browser-disconnected-before-reuse");
    } catch (error) {
      clearBrowserReference("browser-promise-rejected", { error: error.message });
    }
  }

  if (!browserPromise) {
    resolvedBrowserExecutable = resolvedBrowserExecutable || detectPlaywrightExecutable();
    const proxyConfig = getScrapeProxyConfig();

    const launchOptions = {
      headless: process.env.PLAYWRIGHT_HEADLESS !== "false",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    };

    if (proxyConfig) {
      launchOptions.proxy = {
        server: proxyConfig.server,
        username: proxyConfig.username || undefined,
        password: proxyConfig.password || undefined
      };
    }

    console.log("Browser launch proxy", proxyConfig ? { proxyServer: proxyConfig.server } : { proxyServer: "" });
    // optional custom chromium path
    if (resolvedBrowserExecutable) {
      launchOptions.executablePath = resolvedBrowserExecutable;
    }

    browserPromise = playwright.chromium
      .launch(launchOptions)
      .then((browser) => {
        browser.on("disconnected", () => {
          clearBrowserReference("browser-disconnected-event");
        });

        console.log("🚀 Browser launched");
        return browser;
      })
      .catch((error) => {
        clearBrowserReference("browser-launch-failed", { error: error.message });
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
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    colorScheme: "light"
  });

  await context.setExtraHTTPHeaders({
    "accept-language": "en-US,en;q=0.9",
    "upgrade-insecure-requests": "1",
    "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\""
  }).catch(() => {});

  await context.addInitScript(() => {
    const override = (target, key, value) => {
      try {
        Object.defineProperty(target, key, {
          get: () => value,
          configurable: true
        });
      } catch {}
    };

    override(Navigator.prototype, "webdriver", false);
    override(Navigator.prototype, "platform", "Win32");
    override(Navigator.prototype, "language", "en-US");
    override(Navigator.prototype, "languages", ["en-US", "en"]);
    override(Navigator.prototype, "hardwareConcurrency", 8);
    override(Navigator.prototype, "maxTouchPoints", 0);
    override(Navigator.prototype, "plugins", [1, 2, 3, 4, 5]);

    if (!window.chrome) {
      Object.defineProperty(window, "chrome", {
        value: { runtime: {}, app: {} },
        configurable: true
      });
    }

    const originalQuery = window.navigator.permissions?.query;
    if (originalQuery) {
      window.navigator.permissions.query = (parameters) => (
        parameters?.name === "notifications"
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters)
      );
    }
  }).catch(() => {});

  await context.route("**/*", async (route) => {
    const type = route.request().resourceType();
    if (type === "font" || type === "media") {
      await route.abort();
      return;
    }
    await route.continue();
  }).catch(() => {});

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

async function legacyScrapeWithCapturedResponses(url) {
  const browser = await getBrowser();
  const context = await buildPlaywrightContext(browser);
  const page = await context.newPage();
  const responsePayloads = [];
  const responsePayloadTasks = [];

  const captureResponsePayload = async (response) => {
    try {
      const responseUrl = String(response.url() || "");
      if (!/aliexpress\./i.test(responseUrl)) return;
      if (response.status() >= 400) return;

      const headers = response.headers();
      const contentType = String(headers["content-type"] || "");
      const looksStructured =
        /json|javascript/i.test(contentType) ||
        /graphql|api|mtop|detail|product|sku|price|recommend|component|render/i.test(responseUrl);
      if (!looksStructured) return;

      const body = await response.text();
      if (!body || body.length > 1_500_000) return;

      const parsed = parseMaybeJson(body, 4);
      if (!parsed || typeof parsed !== "object") return;

      responsePayloads.push(parsed);
      if (responsePayloads.length > 24) responsePayloads.shift();
    } catch {}
  };

  page.on("response", (response) => {
    const task = captureResponsePayload(response);
    responsePayloadTasks.push(task);
    task.finally(() => {
      const index = responsePayloadTasks.indexOf(task);
      if (index >= 0) responsePayloadTasks.splice(index, 1);
    }).catch(() => {});
  });

try {
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: SCRAPE_TIMEOUT_MS || 20000
  }).catch(() => {});

  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(2000).catch(() => {});

  if (responsePayloadTasks.length) {
    await Promise.allSettled(responsePayloadTasks);
  }

    const runtime = await page.evaluate(() => {
      const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
      const toSerializable = (value, depth = 0, seen = new WeakSet()) => {
        if (value == null) return value;
        if (typeof value === "string") return value.length > 4_000 ? value.slice(0, 4_000) : value;
        if (typeof value === "number" || typeof value === "boolean") return value;
        if (depth >= 5) return undefined;
        if (Array.isArray(value)) {
          return value
            .slice(0, 24)
            .map((entry) => toSerializable(entry, depth + 1, seen))
            .filter((entry) => entry !== undefined);
        }
        if (typeof value !== "object") return undefined;
        if (seen.has(value)) return undefined;
        seen.add(value);

        const result = {};
        Object.entries(value)
          .slice(0, 80)
          .forEach(([key, entry]) => {
            const normalized = toSerializable(entry, depth + 1, seen);
            if (normalized !== undefined) result[key] = normalized;
          });
        return Object.keys(result).length ? result : undefined;
      };
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

      const globalSnapshots = [];
      const candidateGlobalEntries = [
        window.runParams,
        window.__INITIAL_STATE__,
        window.__data__,
        window.__AER_DATA__,
        window.__NEXT_DATA__,
        window.detailData,
        window.pageData
      ];
      Object.keys(window)
        .filter((key) => /(?:^__|data|state|detail|product|sku|price|offer|render|page)/i.test(key))
        .slice(0, 20)
        .forEach((key) => {
          try {
            candidateGlobalEntries.push(window[key]);
          } catch {}
        });
      candidateGlobalEntries.forEach((entry) => {
        if (entry && typeof entry === "object") {
          const normalized = toSerializable(entry);
          if (normalized) globalSnapshots.push(normalized);
        }
      });

      return {
        title: queryText([
          "h1[data-pl='product-title']",
          "h1[data-testid*='title']",
          "h1[class*='title']",
          "h1"
        ]),
        description:
          queryText(["meta[property='og:description']", "meta[name='description']", "[class*='description']", "[class*='Description']"]) ||
          "",
        image:
          queryAttr(["meta[property='og:image']", "meta[name='twitter:image']"], "content") ||
          queryAttr(["img[src*='alicdn']", "img[src*='ae01']", "img[class*='main']", "img[src]"], "currentSrc") ||
          queryAttr(["img[src*='alicdn']", "img[src*='ae01']", "img[class*='main']", "img[src]"], "src"),
        priceTexts: collectTexts([
          "[class*='price']",
          "[class*='Price']",
          "[data-testid*='price']",
          "[data-pl*='price']",
          "[class*='snow-price']",
          "[class*='product-price']"
        ]),
        ratingTexts: collectTexts(["[class*='rating']", "[class*='Rating']", "[class*='star']", "[class*='Star']"]),
        reviewTexts: collectTexts(["[class*='review']", "[class*='Review']", "[class*='feedback']", "[class*='comment']"]),
        soldTexts: collectTexts(["[class*='sold']", "[class*='Sold']", "[class*='order']", "[class*='Order']", "[class*='trade']"]),
        shippingTexts: collectTexts([
          "[class*='shipping']",
          "[class*='Shipping']",
          "[class*='delivery']",
          "[class*='Delivery']",
          "[class*='freight']",
          "[class*='logistics']",
          "[data-testid*='shipping']"
        ]),
        variantTexts: collectTexts([
          "[class*='sku'] button",
          "[class*='Sku'] button",
          "[class*='variant'] button",
          "[class*='property'] li",
          "select option"
        ]),
        pageTitle: clean(document.title),
        bodyText: clean(document.body?.innerText || ""),
        globalSnapshots
      };
    });

    const html = await page.content();
    const parsed = extractHtmlProduct(html, page.url(), "playwright");
    const fromGlobals = extractProductFieldsFromObjectTree(runtime.globalSnapshots || []);
    const fromResponses = extractProductFieldsFromObjectTree(responsePayloads);
    const responseVariants = extractVariantOffersFromObjectTree(responsePayloads);

    const merged = {
      ...parsed,
      title: sanitizeText(runtime.title || fromResponses.title || fromGlobals.title || parsed.title || runtime.pageTitle),
      description: cleanupProductDescription(
        runtime.description || fromResponses.description || fromGlobals.description || parsed.description || runtime.bodyText,
        runtime.title || fromResponses.title || fromGlobals.title || parsed.title || runtime.pageTitle
      ),
      image: normalizeUrl(runtime.image || fromResponses.image || fromGlobals.image || parsed.image),
      price: pickFirstPositive([
        extractPriceFromTextList(runtime.priceTexts),
        fromResponses.price,
        fromGlobals.price,
        parsed.price,
        extractPriceFromTextList([runtime.bodyText])
      ]),
      rating:
        normalizeRating(extractRatingFromTextList(runtime.ratingTexts)) ||
        normalizeRating(fromResponses.rating) ||
        normalizeRating(fromGlobals.rating) ||
        normalizeRating(parsed.rating),
      reviewCount: Math.max(
        extractCountFromTextList(runtime.reviewTexts, /review|feedback|ratings?|avis/i),
        Number(fromResponses.reviewCount || 0),
        Number(fromGlobals.reviewCount || 0),
        Number(parsed.reviewCount || 0)
      ),
      soldCount: Math.max(
        extractCountFromTextList(runtime.soldTexts, /sold|orders?|commandes|ventes/i),
        Number(fromResponses.soldCount || 0),
        Number(fromGlobals.soldCount || 0),
        Number(parsed.soldCount || 0)
      ),
      shipping: parseShippingTexts(runtime.shippingTexts) ?? fromResponses.shipping ?? fromGlobals.shipping ?? parsed.shipping,
      deliveryEstimate:
        extractDeliveryEstimateFromTexts(runtime.shippingTexts) ||
        fromResponses.deliveryEstimate ||
        fromGlobals.deliveryEstimate ||
        parsed.deliveryEstimate ||
        "",
      variants: mergeVariantGroups(
        mergeVariantGroups(
          mergeVariantGroups(responseVariants.groups, fromGlobals.variants),
          parsed.variants
        ),
        extractVariantGroupsFromTextList(runtime.variantTexts)
      )
    };

    if (isAliExpressBlockedTitle(merged.title || runtime.pageTitle) || isAliExpressPlaceholderText(merged.title || runtime.pageTitle)) {
      const error = new Error("AliExpress blocked this host for the current URL");
      error.partialData = {
        title: "",
        description: merged.description,
        image: merged.image,
        price: merged.price,
        shipping: merged.shipping,
        deliveryEstimate: merged.deliveryEstimate,
        rating: merged.rating,
        reviewCount: merged.reviewCount,
        soldCount: merged.soldCount,
        variants: merged.variants
      };
      error.nonRetryable = true;
      throw error;
    }

    if (
      !hasUsefulPartialProductData(merged) ||
      /^aliexpress$/i.test(merged.title) ||
      isAliExpressBlockedTitle(merged.title) ||
      isAliExpressBlockedTitle(merged.description) ||
      isAliExpressPlaceholderText(merged.title) ||
      isAliExpressPlaceholderText(merged.description)
    ) {
      log("warn", "Playwright extracted partial product data", {
        url,
        title: merged.title || null,
        description: merged.description ? true : false,
        image: Boolean(merged.image),
        price: merged.price || 0,
        shipping: merged.shipping,
        rating: merged.rating || 0
      });
      const error = new Error("Playwright scrape returned incomplete product data");
      error.partialData = {
        title: merged.title,
        description: merged.description,
        image: merged.image,
        price: merged.price,
        shipping: merged.shipping,
        deliveryEstimate: merged.deliveryEstimate,
        rating: merged.rating,
        reviewCount: merged.reviewCount,
        soldCount: merged.soldCount,
        variants: merged.variants
      };
      if (hasUsefulPartialProductData(merged)) {
        error.nonRetryable = true;
      }
      throw error;
    }
    return merged;
  } catch (error) {
    if (isRecoverablePlaywrightError(error)) {
      clearBrowserReference("recoverable-playwright-error", { error: error.message, url });
    }
    throw error;
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
}

async function legacyMinimalPlaywrightScrape(url) {
  const { chromium } = require("playwright");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"]
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
  });

  const page = await context.newPage();

  try {

await page.goto(url, {
  waitUntil: "domcontentloaded",
  timeout: 20000
}).catch(() => {});

await page.waitForTimeout(3000).catch(() => {});

    const html = await page.content();

    // 🚨 detect block
    if (html.includes("captcha") || html.includes("punish")) {
      throw new Error("BLOCKED BY ALIEXPRESS");
    }

const data = await page.evaluate(() => {
  const scripts = Array.from(document.querySelectorAll("script"));

  let jsonData = null;

  for (const s of scripts) {
    if (s.innerText.includes("runParams")) {
      try {
        const match = s.innerText.match(/runParams\s*=\s*(\{.*\})/);
        if (match) {
          jsonData = JSON.parse(match[1]);
          break;
        }
      } catch {}
    }
  }

  if (!jsonData) return null;

  const product = jsonData?.data || {};

  return {
    title:
      product.titleModule?.subject ||
      product.title ||
      "",

    price:
      product.priceModule?.formatedPrice ||
      product.priceModule?.minActivityAmount?.value ||
      "",

    image:
      product.imageModule?.imagePathList?.[0] || ""
  };
});

if (!data) {
  throw new Error("JSON extraction failed");
}

    return data;
  } catch (err) {
    throw err;
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
}
}

async function scrapeWithPlaywright(url) {
  return scrapeAliExpressWithScrapingDog(url, "scrapingdog");
}


async function fetchViaScrapingDog(url) {
  if (!process.env.SCRAPINGDOG_API_KEY) {
    throw new Error("ScrapingDog API key missing");
  }

  const params = new URLSearchParams({
    api_key: process.env.SCRAPINGDOG_API_KEY,
    url,
    dynamic: "true",           // render JS
    country: process.env.SCRAPINGDOG_COUNTRY || "us"
  });

  const endpoint = `${process.env.SCRAPINGDOG_API_URL}?${params.toString()}`;

  const res = await axios.get(endpoint, { timeout: 30000 });
  const html = res.data || "";

  if (!html || html.length < 1000) {
    throw new Error("Empty HTML from ScrapingDog");
  }

  return html;
}


function extractFromHtml(html) {
  const $ = cheerio.load(html);

  // try JSON first
  let data = null;

  $("script").each((_, el) => {
    const txt = $(el).html() || "";
    if (txt.includes("runParams")) {
      try {
        const match = txt.match(/runParams\s*=\s*(\{.*\})/);
        if (match) {
          const json = JSON.parse(match[1]);
          data = json?.data || null;
        }
      } catch {}
    }
  });

  if (data) {
    return {
      title: data.titleModule?.subject || "",
      price:
        data.priceModule?.formatedPrice ||
        data.priceModule?.minActivityAmount?.value ||
        "",
      image: data.imageModule?.imagePathList?.[0] || ""
    };
  }

  // fallback (meta tags)
  return {
    title: $("meta[property='og:title']").attr("content") || "",
    image: $("meta[property='og:image']").attr("content") || "",
    price: ""
  };
}
  
async function fetchProduct(url) {
  const urlCandidates = getProductUrlCandidates(url);
  const canonicalUrl = urlCandidates[0] || getCanonicalProductUrl(url);

  if (!canonicalUrl) {
    const error = new Error("???? AliExpress ??? ????");
    error.status = 400;
    throw error;
  }

  const productId =
    extractProductId(canonicalUrl) ||
    crypto.createHash("md5").update(canonicalUrl).digest("hex");

  const cacheKey = `product:${productId}`;
  const cached = getCache(productCache, cacheKey);
  if (cached && !isBadCachedProduct(cached)) {
    return { ...cached, cached: true };
  }

  const mobileUrl = canonicalUrl
    .replace("www.aliexpress.com", "m.aliexpress.com")
    .replace("aliexpress.com", "m.aliexpress.com");

  console.log("Mobile scraping:", mobileUrl);

  let pageData = null;

  try {
    const browser = await getBrowser();

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
      viewport: { width: 390, height: 844 },
      locale: "en-US"
    });

    const page = await context.newPage();

    await page.setExtraHTTPHeaders({
      "accept-language": "en-US,en;q=0.9"
    });

    await page.goto(mobileUrl, {
      waitUntil: "domcontentloaded",
      timeout: 20000
    });

    await page.waitForTimeout(3000);

    const html = await page.content();
    if (html.includes("captcha") || html.includes("punish")) {
      throw new Error("Blocked by AliExpress");
    }

    pageData = await page.evaluate(() => {
      const text = (sel) =>
        document.querySelector(sel)?.innerText?.trim() || "";

      return {
        title:
          text("h1") ||
          text(".pdp-title") ||
          text("[class*='title']"),
        price:
          text(".product-price-current") ||
          text("[class*='price']") ||
          text(".price--currentPrice"),
        image:
          document.querySelector("img")?.src || "",
        description:
          text(".product-description") ||
          text("[class*='description']") ||
          ""
      };
    });

    await page.close();
    await context.close();
  } catch (error) {
    console.error("Mobile scrape failed:", error.message);
  }

  if (!pageData?.title || !pageData?.image) {
    try {
      const html = await fetchScrapingDogHtml(canonicalUrl, { dynamic: false });
      const fallbackProduct = normalizeScrapedProductData(
        extractHtmlProduct(html, canonicalUrl, "scrapingdog-html"),
        canonicalUrl,
        "scrapingdog-html"
      );

      if (!isBadCachedProduct(fallbackProduct)) {
        const product = {
          ...fallbackProduct,
          cached: false,
          fetchedAt: new Date().toISOString()
        };
        setCache(productCache, cacheKey, product, CACHE_TTL_MS);
        return product;
      }
    } catch (fallbackError) {
      console.error("ScrapingDog fallback failed:", fallbackError.message);
    }
  }

  if (!pageData) {
    return buildUnavailableProductResponse({
      canonicalUrl,
      productId,
      source: "manual-quote-required",
      alertText: "تعذر جلب بيانات المنتج آليًا حاليا. نجموا نكملوه يدويًا أو نعاودوا المحاولة بعد شوية."
    });
  }

  const product = {
    success: true,
    title: pageData.title || "???? AliExpress",
    description: pageData.description || "",
    price: Number((pageData.price || "").replace(/[^\d.]/g, "")) || 0,
    shipping: null,
    image: pageData.image || "",
    rating: 0,
    reviewCount: 0,
    soldCount: 0,
    variants: [],
    url: canonicalUrl,
    source: "mobile-scrape",
    cached: false,
    fetchedAt: new Date().toISOString()
  };

  product.shippingLabel = "??? ?????";
  product.deliveryEstimate = "?? 12 ??? 25 ???";
  product.priceUnavailable = product.price <= 0;

  if (!isBadCachedProduct(product)) {
    setCache(productCache, cacheKey, product, CACHE_TTL_MS);
  }

  return product;
}

async function fetchExchangeRate() {
  const cached = getCache(fxCache, "usd-tnd");
  if (cached) return cached;

  const providers = [
    async () => {
      const response = await axios.get(FX_API_URL, { timeout: 12_000, proxy: false });
      const rate = Number(response.data?.rates?.TND);
      if (!Number.isFinite(rate) || rate <= 0) throw new Error("Primary FX provider missing TND rate");
      return { success: true, base: "USD", quote: "TND", rate, source: "primary", fetchedAt: new Date().toISOString() };
    },
    async () => {
      const response = await axios.get(FX_FALLBACK_URL, { timeout: 12_000, proxy: false });
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
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
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
    return res.status(429).json({ success: false, error: "برشا طلبات، عاود بعد شوية." });
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

app.get(["/admin", "/admin.html"], (req, res) => {
  res.sendFile(path.join(ROOT, "admin.html"));
});

app.get("/aliexpress/oauth/start", (req, res) => {
  if (!ALIEXPRESS_APP_KEY) {
    return res.status(500).json({ success: false, error: "AliExpress App Key غير مضبوط" });
  }

  const callbackUrl = getAliExpressOAuthCallbackUrl(req);
  if (!callbackUrl) {
    return res.status(500).json({ success: false, error: "رابط callback غير مضبوط" });
  }

  const authorizeUrl = new URL(ALIEXPRESS_OAUTH_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("force_auth", "true");
  authorizeUrl.searchParams.set("client_id", ALIEXPRESS_APP_KEY);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl);
  if (req.query.state) {
    authorizeUrl.searchParams.set("state", sanitizeText(req.query.state));
  }

  res.redirect(authorizeUrl.toString());
});

app.get("/aliexpress/oauth-callback", async (req, res, next) => {
  try {
    if (req.query.error) {
      return res.status(400).send(`<!doctype html>
<html lang="en"><meta charset="utf-8"><title>AliExpress OAuth Failed</title>
<body style="font-family:Arial,sans-serif;padding:24px">
<h1>AliExpress authorization failed</h1>
<p>${sanitizeText(req.query.error_description || req.query.error)}</p>
</body></html>`);
    }

    const code = sanitizeText(req.query.code || "");
    if (!code) {
      return res.status(400).json({ success: false, error: "كود التفويض غير موجود" });
    }

    const tokenData = await createAliExpressAccessToken(code);
    const accessToken = sanitizeText(tokenData.access_token || tokenData.accessToken || "");
    const refreshToken = sanitizeText(tokenData.refresh_token || tokenData.refreshToken || "");
    if (!accessToken) {
      throw new Error("AliExpress OAuth did not return an access token");
    }

    upsertEnvEntries(ENV_FILE_PATH, {
      ALIEXPRESS_ACCESS_TOKEN: accessToken,
      ALIEXPRESS_REFRESH_TOKEN: refreshToken,
      ALIEXPRESS_ACCESS_TOKEN_EXPIRES_AT: getFutureIsoFromSeconds(tokenData.expires_in || tokenData.expiresIn),
      ALIEXPRESS_REFRESH_TOKEN_EXPIRES_AT: getFutureIsoFromSeconds(tokenData.refresh_expires_in || tokenData.refreshExpiresIn)
    });
    process.env.ALIEXPRESS_ACCESS_TOKEN = accessToken;
    process.env.ALIEXPRESS_REFRESH_TOKEN = refreshToken;
    process.env.ALIEXPRESS_ACCESS_TOKEN_EXPIRES_AT = getFutureIsoFromSeconds(tokenData.expires_in || tokenData.expiresIn);
    process.env.ALIEXPRESS_REFRESH_TOKEN_EXPIRES_AT = getFutureIsoFromSeconds(tokenData.refresh_expires_in || tokenData.refreshExpiresIn);

    log("log", "AliExpress OAuth token stored", {
      account: sanitizeText(tokenData.account || ""),
      expiresIn: Number(tokenData.expires_in || tokenData.expiresIn || 0),
      refreshExpiresIn: Number(tokenData.refresh_expires_in || tokenData.refreshExpiresIn || 0)
    });

    res.send(`<!doctype html>
<html lang="en"><meta charset="utf-8"><title>AliExpress Connected</title>
<body style="font-family:Arial,sans-serif;padding:24px">
<h1>AliExpress connected</h1>
<p>Access token saved successfully.</p>
<p>You can now retry product fetching from your site.</p>
</body></html>`);
  } catch (error) {
    const response = {
      success: false,
      error: error.message,
      requestId: error?.meta?.requestId || error?.requestId || undefined
    };
    if (error?.meta?.label) response.variant = error.meta.label;
    if (error?.meta?.code != null) response.code = error.meta.code;
    res.status(error?.status || 502).json(response);
  }
});

app.get("/api/health", (req, res) => {
  const scrapeProxy = getScrapeProxyConfig();
  const apiMode = getAliExpressApiMode();
  res.json({
    success: true,
    status: "ok",
    now: new Date().toISOString(),
    playwright: Boolean(playwright?.chromium),
    scrapingDogConfigured: Boolean(SCRAPINGDOG_API_KEY),
    aliexpressApiConfigured: Boolean(ALIEXPRESS_API_BASE_URL && ALIEXPRESS_APP_KEY && ALIEXPRESS_APP_SECRET),
    aliexpressApiTokenConfigured: hasAliExpressDsAccessToken(),
    aliexpressApiMode: apiMode,
    affiliateApiConfigured: Boolean(ALIEXPRESS_AFFILIATE_API_BASE_URL && ALIEXPRESS_APP_KEY && ALIEXPRESS_APP_SECRET),
    affiliateApiEnabled: ALIEXPRESS_ENABLE_AFFILIATE_API,
    affiliateTrackingIdConfigured: Boolean(ALIEXPRESS_TRACKING_ID),
    scrapeProxyConfigured: Boolean(scrapeProxy),
    scrapeProxyProtocol: scrapeProxy?.protocol || "",
    scrapeProxyBypassConfigured: Boolean(SCRAPE_PROXY_BYPASS)
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

app.get("/api/promos", rateLimitMiddleware, (req, res) => {
  res.json({
    success: true,
    promos: getPublicPromoState()
  });
});

app.get("/api/product", rateLimitMiddleware, async (req, res) => {
  const url = String(req.query.url || "");

  if (!url) {
    return res.status(400).json({
      success: false,
      error: "لازم تبعث رابط المنتج"
    });
  }

  // headers
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  console.log("API HIT:", url);

  let finished = false;

  // 🔥 FORCE TIMEOUT (important)
const timeout = setTimeout(() => {
  if (!finished) {
    finished = true;
    console.log("FORCED TIMEOUT");
    return res.status(504).json({
      success: false,
      error: "Scraper stuck (timeout)"
    });
  }
}, 45000);

  try {
    const product = await fetchProduct(url);

    if (!finished) {
      finished = true;
      clearTimeout(timeout);

      if (!product) {
        return res.status(500).json({
          success: false,
          error: "Scraper failed or blocked"
        });
      }

      console.log("SCRAPE DONE");
      return res.json(product);
    }

  } catch (error) {
    if (!finished) {
      finished = true;
      clearTimeout(timeout);

      console.error("ERROR:", error.message);

      return res.status(500).json({
        success: false,
        error: error.message || "Internal error"
      });
    }
  }
});

app.post("/api/orders/register", rateLimitMiddleware, (req, res, next) => {
  try {
    const payload = req.body || {};
    const previousOrder = payload.orderRef ? getOrderByRef(payload.orderRef) : null;
    const order = upsertOrderRecord(payload);
    if (!order) {
      return res.status(400).json({ success: false, error: "لازم تبعث orderRef" });
    }

    const promoCode = sanitizeText(payload.promoCode || "").toUpperCase();
    if (promoCode && previousOrder?.promoCode !== promoCode) {
      const store = loadAdminStore();
      const promo = store.promos.find((entry) => entry.code === promoCode);
      if (promo) {
        promo.used = Number(promo.used || 0) + 1;
        promo.updatedAt = new Date().toISOString();
        saveAdminStore(store);
      }
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
});

app.get("/api/orders/:orderRef", rateLimitMiddleware, (req, res) => {
  const order = getOrderByRef(req.params.orderRef);
  if (!order) {
    return res.status(404).json({ success: false, error: "الطلب غير موجود" });
  }

  res.json({ success: true, order });
});

app.post("/api/admin/login", rateLimitMiddleware, (req, res) => {
  const pin = sanitizeText(req.body?.pin || "");
  if (!pin || pin !== ADMIN_PIN) {
    return res.status(401).json({ success: false, error: "PIN الإدارة غير صحيح" });
  }

  const store = loadAdminStore();
  res.json({
    success: true,
    token: createAdminToken(),
    state: {
      promos: store.promos,
      orders: sortOrdersNewestFirst(store.orders),
      analytics: buildAdminAnalytics(store),
      settings: normalizeAdminSettings(store.settings || {})
    }
  });
});

app.get("/api/admin/state", rateLimitMiddleware, requireAdminAuth, (req, res) => {
  const store = loadAdminStore();
  res.json({
    success: true,
    promos: store.promos,
    orders: sortOrdersNewestFirst(store.orders),
    analytics: buildAdminAnalytics(store),
    settings: normalizeAdminSettings(store.settings || {})
  });
});

app.put("/api/admin/settings", rateLimitMiddleware, requireAdminAuth, (req, res) => {
  const store = loadAdminStore();
  const incoming = req.body && typeof req.body === "object" ? req.body : {};
  const current = normalizeAdminSettings(store.settings || {});

  store.settings = normalizeAdminSettings({
    ...current,
    ...incoming,
    calculator: {
      ...current.calculator,
      ...(incoming.calculator || {}),
      thresholds: {
        ...current.calculator.thresholds,
        ...((incoming.calculator && incoming.calculator.thresholds) || {})
      },
      rates: {
        ...current.calculator.rates,
        ...((incoming.calculator && incoming.calculator.rates) || {})
      }
    },
    storefront: {
      ...current.storefront,
      ...(incoming.storefront || {})
    },
    admin: {
      ...current.admin,
      ...(incoming.admin || {})
    }
  });

  saveAdminStore(store);
  res.json({ success: true, settings: store.settings });
});

app.post("/api/admin/promos", rateLimitMiddleware, requireAdminAuth, (req, res) => {
  const store = loadAdminStore();
  const promo = normalizePromoRecord(req.body || {});
  if (!promo || promo.value <= 0) {
    return res.status(400).json({ success: false, error: "بيانات البرومو غير صالحة" });
  }

  const index = store.promos.findIndex((entry) => entry.code === promo.code);
  if (index >= 0) {
    store.promos[index] = {
      ...store.promos[index],
      ...promo,
      used: Number(req.body?.used ?? store.promos[index].used ?? 0),
      updatedAt: new Date().toISOString()
    };
  } else {
    store.promos.unshift({ ...promo, used: Number(req.body?.used || 0), updatedAt: new Date().toISOString() });
  }

  saveAdminStore(store);
  res.json({ success: true, promos: store.promos });
});

app.delete("/api/admin/promos/:code", rateLimitMiddleware, requireAdminAuth, (req, res) => {
  const code = sanitizeText(req.params.code || "").toUpperCase();
  const store = loadAdminStore();
  store.promos = store.promos.filter((promo) => promo.code !== code);
  saveAdminStore(store);
  res.json({ success: true, promos: store.promos });
});

app.put("/api/admin/orders/:orderRef", rateLimitMiddleware, requireAdminAuth, (req, res) => {
  const current = getOrderByRef(req.params.orderRef);
  if (!current) {
    return res.status(404).json({ success: false, error: "الطلب غير موجود" });
  }

  const updated = upsertOrderRecord({
    ...current,
    status: sanitizeText(req.body?.status || current.status || "pending"),
    adminTracking: sanitizeText(req.body?.adminTracking || current.adminTracking || ""),
    trackingHint: sanitizeText(req.body?.adminTracking || req.body?.trackingHint || current.trackingHint || "")
  });

  res.json({ success: true, order: updated });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: "المسار غير موجود" });
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
    error: status === 500 ? "خطأ داخلي في السيرفر" : error.message,
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
  log("log", `AliExpress Tunisia server listening on port ${PORT}`, {
    scrapeProxyConfigured: Boolean(getScrapeProxyConfig())
  });
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




