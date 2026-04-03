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
const PLAYWRIGHT_EXECUTABLE_PATH = process.env.PLAYWRIGHT_EXECUTABLE_PATH || "";
const ADMIN_PIN = String(process.env.ADMIN_PIN || "2749").trim();
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

function hasUsableImage(value) {
  return Boolean(normalizeUrl(value));
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

function getDefaultAdminStore() {
  return {
    promos: [],
    orders: [],
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
    return res.status(401).json({ success: false, error: "Unauthorized admin session" });
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

  if (validInput) candidates.push(validInput);

  if (productId) {
    candidates.push(
      `https://www.aliexpress.com/item/${productId}.html`,
      `https://ar.aliexpress.com/item/${productId}.html`,
      `https://www.aliexpress.us/item/${productId}.html`,
      `https://m.aliexpress.com/i/${productId}.html`
    );
  }

  return Array.from(new Set(candidates.filter(Boolean)));
}

function isAliExpressBlockedTitle(title) {
  return /封禁|blocked|access denied|forbidden|ip ban|verification required/i.test(String(title || ""));
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
  const match = text.match(/([0-9]+(?:[.,][0-9]+)?)\s*([km])?/i);
  if (!match) return 0;
  const base = Number.parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(base) || base < 0) return 0;
  const multiplier = match[2] === "k" ? 1_000 : (match[2] === "m" ? 1_000_000 : 1);
  return Math.round(base * multiplier);
}

function extractCountFromTextList(texts = [], keywordPattern) {
  for (const raw of texts) {
    const text = sanitizeText(raw);
    if (!text || !keywordPattern.test(text)) continue;
    const count = parseCompactCount(text);
    if (count > 0) return count;
  }
  return 0;
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

  if (Number(product.shipping) === 0) {
    alerts.push({ level: "info", text: "الشحن مجاني في العرض الحالي." });
  } else if (Number(product.shipping) >= 8) {
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
    .filter((value) => value && value.length <= 40 && !/^[0-9.]+$/.test(value))
  ));
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
  const groups = [];
  const candidateSelectors = [
    "[class*='sku'] button",
    "[class*='Sku'] button",
    "[class*='variant'] button",
    "[class*='property'] li",
    "select option"
  ];

  const texts = candidateSelectors.flatMap((selector) =>
    $(selector).map((_, element) => sanitizeText($(element).text())).get()
  );

  const values = uniqueShortText(texts).filter((value) => !/^select|choose/i.test(value));
  if (values.length >= 2) {
    groups.push({ name: guessVariantLabel("", values), values: values.slice(0, 8) });
  }

  return groups;
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

  if (Number(product.shipping) === 0) score += 4;
  else if (Number(product.shipping) >= 10) score -= 4;

  if (product.restrictions?.restricted) score -= 10;
  if (product.restrictions?.banned) score -= 25;
  if (product.priceUnavailable) score -= 5;

  const finalScore = Math.max(15, Math.min(98, Math.round(score)));
  let label = "Fair";
  if (finalScore >= 85) label = "Excellent";
  else if (finalScore >= 72) label = "Strong";
  else if (finalScore >= 58) label = "Good";

  return { score: finalScore, label };
}

function buildCustomsAdvisor(product) {
  const category = product.restrictions?.category || "general";
  const riskLevel = product.restrictions?.banned ? "high" : (product.restrictions?.restricted ? "medium" : "low");
  const docsMap = {
    phone: ["IMEI / homologation proof", "Seller invoice"],
    radio: ["Import authorization", "Seller invoice"],
    "tv-box": ["Technical product reference", "Seller invoice"],
    supplements: ["Ingredient list", "Seller invoice"],
    knife: ["Manual review before order"],
    general: ["Seller invoice"]
  };
  const saferAlternativeMap = {
    phone: "Prefer accessories or spare parts instead of full phones.",
    radio: "Prefer Bluetooth accessories without radio transmission hardware.",
    "tv-box": "Prefer streaming accessories with standard certification.",
    supplements: "Prefer non-ingestible wellness accessories.",
    knife: "Prefer kitchen tools with low customs sensitivity.",
    general: "Choose products with clear specs and normal shipping."
  };

  return {
    level: riskLevel,
    category,
    docs: docsMap[category] || docsMap.general,
    note: product.restrictions?.reasons?.[0] || "No major customs blocker detected.",
    saferAlternative: saferAlternativeMap[category] || saferAlternativeMap.general
  };
}

function buildEstimatedTimeline(product) {
  const estimate = inferDeliveryEstimate(product.shipping);
  return [
    { step: "Order Confirmed", status: "current", note: "Once payment is validated we place the order with the seller." },
    { step: "Seller Processing", status: "upcoming", note: "Usually 1-4 days before dispatch." },
    { step: "International Transit", status: "upcoming", note: estimate },
    { step: "Tunisia Customs", status: product.restrictions?.restricted || product.restrictions?.banned ? "attention" : "upcoming", note: product.restrictions?.reasons?.[0] || "Standard customs verification." },
    { step: "Local Handoff", status: "upcoming", note: "Final delivery through local carrier or Poste." }
  ];
}

function cleanupProductTitle(title) {
  return sanitizeText(title)
    .replace(/\s{2,}/g, " ")
    .replace(/^[\-\|\s]+|[\-\|\s]+$/g, "")
    .trim();
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
      const start = script.search(/[\[{]/, match.index);
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

function extractProductFieldsFromObjectTree(source) {
  const result = { title: "", image: "", price: 0, rating: 0, reviewCount: 0, soldCount: 0, variants: [] };

  walkObject(source, (node) => {
    if (Array.isArray(node)) return;
    for (const [key, value] of Object.entries(node)) {
      const lowerKey = key.toLowerCase();

      if (!result.title && typeof value === "string" && /(?:subject|title|producttitle|seotitle|displaytitle|productname|itemname|tradename|name)/i.test(lowerKey)) {
        const title = sanitizeText(value);
        if (title && !/^aliexpress$/i.test(title)) result.title = title;
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

      if (!result.rating && /(?:rating|star|reviewscore|averagestar)/i.test(lowerKey)) {
        const rating = Number.parseFloat(String(readScalar(value) || "").replace(/[^0-9.]/g, ""));
        if (Number.isFinite(rating) && rating > 0 && rating <= 5) result.rating = rating;
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
  const jsonLdObjects = $("script[type='application/ld+json']").map((_, element) => safeJsonParse($(element).html() || "")).get().filter(Boolean);
  const embedded = extractProductFieldsFromObjectTree([
    ...extractJsonObjectsFromHtml(html, $),
    ...jsonLdObjects
  ]);
  const title =
    embedded.title ||
    sanitizeText($("meta[property='og:title']").attr("content")) ||
    sanitizeText($("meta[name='twitter:title']").attr("content")) ||
    sanitizeText($("meta[name='title']").attr("content")) ||
    sanitizeText($("[data-pl='product-title']").first().text()) ||
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
      parseMoney($("meta[itemprop='price']").attr("content")),
      extractPriceFromTextList([
        $("meta[property='og:description']").attr("content"),
        $("[class*='price']").first().text(),
        $("[class*='Price']").first().text(),
        $("[data-testid*='price']").first().text(),
        $("body").text().slice(0, 4000)
      ])
    ]);
  const rating = embedded.rating || extractRatingFromTextList([$("body").text()]);
  const reviewCount = embedded.reviewCount || extractCountFromTextList([
    $("body").text(),
    ...$("[class*='review'], [class*='Review'], [class*='feedback']").map((_, el) => $(el).text()).get()
  ], /review|feedback|ratings?|avis/i);
  const soldCount = embedded.soldCount || extractCountFromTextList([
    $("body").text(),
    ...$("[class*='sold'], [class*='order'], [class*='trade']").map((_, el) => $(el).text()).get()
  ], /sold|orders?|commandes|ventes/i);
  const shipping = parseShippingTexts([
    $("body").text(),
    ...$("[class*='shipping'], [class*='delivery'], [class*='freight'], [class*='logistics']").map((_, el) => $(el).text()).get()
  ]);
  const variants = embedded.variants?.length ? embedded.variants : extractVariantGroupsFromHtml($);

  return {
    success: true,
    title: isAliExpressBlockedTitle(title) ? "" : title,
    price,
    shipping,
    image,
    rating: rating || 4.5,
    reviewCount,
    soldCount,
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
      if (error?.nonRetryable) break;
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
    reviewCount: extracted.reviewCount || 0,
    soldCount: extracted.soldCount || 0,
    variants: extracted.variants || [],
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

      const globalSnapshots = [];
      [
        window.runParams,
        window.__INITIAL_STATE__,
        window.__data__,
        window.__AER_DATA__,
        window.__NEXT_DATA__,
        window.detailData,
        window.pageData
      ].forEach((entry) => {
        if (entry && typeof entry === "object") {
          globalSnapshots.push(entry);
        }
      });

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
        pageTitle: clean(document.title),
        bodyText: clean(document.body?.innerText || ""),
        globalSnapshots
      };
    });

    const html = await page.content();
    const parsed = extractHtmlProduct(html, page.url(), "playwright");
    const fromGlobals = extractProductFieldsFromObjectTree(runtime.globalSnapshots || []);

    const merged = {
      ...parsed,
      title: sanitizeText(runtime.title || fromGlobals.title || parsed.title || runtime.pageTitle),
      image: normalizeUrl(runtime.image || fromGlobals.image || parsed.image),
      price: extractPriceFromTextList([...runtime.priceTexts, runtime.bodyText]) || fromGlobals.price || parsed.price,
      rating: extractRatingFromTextList(runtime.ratingTexts) || parsed.rating,
      shipping: parseShippingTexts(runtime.shippingTexts) ?? parsed.shipping
    };

    if (isAliExpressBlockedTitle(merged.title || runtime.pageTitle)) {
      const error = new Error("AliExpress blocked this host for the current URL");
      error.partialData = {
        title: "",
        image: merged.image,
        price: merged.price,
        shipping: merged.shipping,
        rating: merged.rating
      };
      error.nonRetryable = true;
      throw error;
    }

    if (!merged.title || /^aliexpress$/i.test(merged.title) || !merged.image || merged.price <= 0) {
      log("warn", "Playwright extracted partial product data", {
        url,
        title: merged.title || null,
        image: Boolean(merged.image),
        price: merged.price || 0,
        shipping: merged.shipping,
        rating: merged.rating || 0
      });
      const error = new Error("Playwright scrape returned incomplete product data");
      error.partialData = {
        title: merged.title,
        image: merged.image,
        price: merged.price,
        shipping: merged.shipping,
        rating: merged.rating
      };
      if (hasUsableImage(merged.image) && (!merged.title || merged.price <= 0)) {
        error.nonRetryable = true;
      }
      throw error;
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
    const error = new Error("HTTP fallback returned incomplete product data");
    error.partialData = {
      title: parsed.title,
      image: parsed.image,
      price: parsed.price,
      shipping: parsed.shipping,
      rating: parsed.rating
    };
    if (hasUsableImage(parsed.image) && (!parsed.title || parsed.price <= 0)) {
      error.nonRetryable = true;
    }
    throw error;
  }
  if (parsed.shipping == null) parsed.shipping = DEFAULT_SHIPPING_USD;
  return parsed;
}

async function fetchProduct(url) {
  const urlCandidates = getProductUrlCandidates(url);
  const canonicalUrl = urlCandidates[0] || getCanonicalProductUrl(url);
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
  let lastPageError = null;
  let partialPageData = null;
  const canUsePartialData = () => Boolean(partialPageData && hasUsableImage(partialPageData.image));

  for (const candidateUrl of urlCandidates) {
    try {
      pageData = await withRetries("playwright-scrape", () => scrapeWithPlaywright(candidateUrl));
      if (pageData) break;
    } catch (error) {
      lastPageError = error;
      if (error?.partialData) partialPageData = { ...(partialPageData || {}), ...error.partialData, url: candidateUrl };
      log("warn", "Playwright scrape exhausted for candidate, switching candidate/fallback", { candidateUrl, error: error.message });
      if (canUsePartialData()) break;
    }
  }

  if (!pageData) {
    for (const candidateUrl of urlCandidates) {
      try {
        pageData = await withRetries("http-scrape", () => scrapeWithHttp(candidateUrl));
        if (pageData) break;
      } catch (error) {
        lastPageError = error;
        if (error?.partialData) partialPageData = { ...(partialPageData || {}), ...error.partialData, url: candidateUrl };
        log("warn", "HTTP fallback exhausted for candidate", { candidateUrl, error: error.message });
        if (canUsePartialData()) break;
      }
    }
  }

  if (!pageData && !apiData && !partialPageData) {
    const error = lastPageError || new Error("Unable to fetch product details from AliExpress right now");
    error.status = 502;
    error.message = "Unable to fetch product details from AliExpress right now";
    throw error;
  }

  if (!pageData) {
    pageData = {
      title: partialPageData?.title || `AliExpress Product #${productId}`,
      price: Number(partialPageData?.price || 0),
      image: normalizeUrl(partialPageData?.image) || "https://placehold.co/600x600/0f172a/f8fafc?text=AliExpress",
      rating: Number(partialPageData?.rating || 4.5),
      url: partialPageData?.url || canonicalUrl,
      source: partialPageData ? "partial-fallback" : "api-fallback",
      shipping: Number(partialPageData?.shipping ?? DEFAULT_SHIPPING_USD),
      priceUnavailable: true
    };
  } else if (pageData.shipping == null) {
    pageData.shipping = DEFAULT_SHIPPING_USD;
  }

  const product = {
    success: true,
    title: cleanupProductTitle(apiData?.title || pageData?.title || "AliExpress Product"),
    price: Number(apiData?.price || pageData?.price || 0),
    shipping: Number(pageData?.shipping ?? DEFAULT_SHIPPING_USD),
    image: apiData?.image || pageData?.image || "",
    rating: Number(apiData?.rating || pageData?.rating || 4.5),
    reviewCount: Number(apiData?.reviewCount || pageData?.reviewCount || 0),
    soldCount: Number(apiData?.soldCount || pageData?.soldCount || 0),
    variants: Array.isArray(apiData?.variants) && apiData.variants.length ? apiData.variants : (Array.isArray(pageData?.variants) ? pageData.variants : []),
    url: canonicalUrl,
    source: apiData ? "api+scrape" : (pageData?.source || "scrape"),
    cached: false,
    fetchedAt: new Date().toISOString()
  };

  product.shippingLabel = product.shipping === 0 ? "شحن مجاني" : `${product.shipping.toFixed(2)} USD`;
  product.deliveryEstimate = inferDeliveryEstimate(product.shipping);
  product.restrictions = classifyProductRestrictions(product);
  product.alerts = buildProductAlerts(product);
  product.trustScore = buildSellerTrustScore(product);
  product.customsAdvisor = buildCustomsAdvisor(product);
  product.deliveryTimeline = buildEstimatedTimeline(product);
  product.manualQuoteRecommended = Boolean(product.restrictions?.banned || product.restrictions?.restricted || product.shipping >= 8);
  product.priceUnavailable = Boolean(pageData?.priceUnavailable && !apiData?.price && product.price <= 0);

  if (product.priceUnavailable) {
    product.alerts.unshift({
      level: "warning",
      text: "ما قدرناش نجيبولك السعر exact توّا بسبب حماية AliExpress. استعمل التسعيرة اليدوية أو ابعثنا الرابط على واتساب."
    });
    product.manualQuoteRecommended = true;
  }

  if (!hasUsableImage(product.image) || (!product.priceUnavailable && product.price <= 0) || /^aliexpress$/i.test(product.title)) {
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

app.get("/api/promos", rateLimitMiddleware, (req, res) => {
  res.json({
    success: true,
    promos: getPublicPromoState()
  });
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

app.post("/api/orders/register", rateLimitMiddleware, (req, res, next) => {
  try {
    const payload = req.body || {};
    const previousOrder = payload.orderRef ? getOrderByRef(payload.orderRef) : null;
    const order = upsertOrderRecord(payload);
    if (!order) {
      return res.status(400).json({ success: false, error: "Missing orderRef" });
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
    return res.status(404).json({ success: false, error: "Order not found" });
  }

  res.json({ success: true, order });
});

app.post("/api/admin/login", rateLimitMiddleware, (req, res) => {
  const pin = sanitizeText(req.body?.pin || "");
  if (!pin || pin !== ADMIN_PIN) {
    return res.status(401).json({ success: false, error: "Invalid admin PIN" });
  }

  res.json({
    success: true,
    token: createAdminToken(),
    state: {
      promos: loadAdminStore().promos,
      orders: sortOrdersNewestFirst(loadAdminStore().orders),
      analytics: buildAdminAnalytics(loadAdminStore())
    }
  });
});

app.get("/api/admin/state", rateLimitMiddleware, requireAdminAuth, (req, res) => {
  const store = loadAdminStore();
  res.json({
    success: true,
    promos: store.promos,
    orders: sortOrdersNewestFirst(store.orders),
    analytics: buildAdminAnalytics(store)
  });
});

app.post("/api/admin/promos", rateLimitMiddleware, requireAdminAuth, (req, res) => {
  const store = loadAdminStore();
  const promo = normalizePromoRecord(req.body || {});
  if (!promo || promo.value <= 0) {
    return res.status(400).json({ success: false, error: "Invalid promo payload" });
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
    return res.status(404).json({ success: false, error: "Order not found" });
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
