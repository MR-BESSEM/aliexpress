(() => {
    const API_BASE_URL = "";
    const FX_FALLBACK_RATE = 4.5;
    const FX_MARKUP = 0;
    const SERVICE_FEE_PERCENT = 0.08;
    const SERVICE_FEE_MIN_TND = 7;
    const RATE_REFRESH_MS = 15 * 60 * 1000;
    const WHATSAPP_NUMBER = "21627498276";
    const RECENT_LINKS_KEY = "alex_recent_links_v1";
    const ACCOUNT_PREFS_KEY = "alex_account_prefs_v1";
    const LOCAL_STATS_KEY = "alex_local_stats_v1";
    const BUDGET_PREFS_KEY = "alex_budget_prefs_v1";
    const SAVED_PACKS_KEY = "alex_saved_packs_v1";
    const PRICE_ALERTS_KEY = "alex_price_alerts_v1";
    const REFERRAL_STATE_KEY = "alex_referral_state_v1";
    const ADMIN_PROMOS_KEY = "alex_admin_promos_v1";
    const ADMIN_PIN_KEY = "alex_admin_pin_v1";
    const ADMIN_TOKEN_KEY = "alex_admin_token_v1";
    const ACTIVITY_LOG_KEY = "alex_activity_log_v1";

    const dom = {
        calcLink: document.getElementById("calc-link"),
        calcName: document.getElementById("calc-name"),
        calcNote: document.getElementById("calc-note"),
        calcImage: document.getElementById("calc-image"),
        usdPrice: document.getElementById("usd-price"),
        usdShip: document.getElementById("usd-ship"),
        tndResult: document.getElementById("tnd-result"),
        rateBadge: document.getElementById("rate-badge"),
        liveRateDisplay: document.getElementById("live-rate-display"),
        scrapeBtn: document.getElementById("runtime-scrape-btn"),
        scrapeLoader: document.getElementById("runtime-scrape-loader"),
        scrapeError: document.getElementById("runtime-scrape-error"),
        previewCard: document.getElementById("runtime-preview-card"),
        previewImage: document.getElementById("runtime-preview-image"),
        previewTitle: document.getElementById("runtime-preview-title"),
        previewMeta: document.getElementById("runtime-preview-meta"),
        previewDescription: document.getElementById("runtime-preview-description"),
        previewPrice: document.getElementById("runtime-preview-price"),
        previewLink: document.getElementById("runtime-preview-link"),
        previewSource: document.getElementById("runtime-preview-source"),
        previewShipping: document.getElementById("runtime-preview-shipping"),
        previewDelivery: document.getElementById("runtime-preview-delivery"),
        previewRating: document.getElementById("runtime-preview-rating"),
        previewReviews: document.getElementById("runtime-preview-reviews"),
        previewVariantSummary: document.getElementById("runtime-preview-variant-summary"),
        createAlertBtn: document.getElementById("runtime-create-alert"),
        shareReferralBtn: document.getElementById("runtime-copy-referral-share"),
        trustCard: document.getElementById("runtime-trust-card"),
        trustBadge: document.getElementById("runtime-trust-badge"),
        trustRating: document.getElementById("runtime-trust-rating"),
        trustReviews: document.getElementById("runtime-trust-reviews"),
        trustSold: document.getElementById("runtime-trust-sold"),
        trustNote: document.getElementById("runtime-trust-note"),
        variantsCard: document.getElementById("runtime-variants-card"),
        variantGroups: document.getElementById("runtime-variant-groups"),
        metricOrders: document.getElementById("runtime-metric-orders"),
        metricPromos: document.getElementById("runtime-metric-promos"),
        metricFetches: document.getElementById("runtime-metric-fetches"),
        metricRate: document.getElementById("runtime-metric-rate"),
        recentLinksCard: document.getElementById("runtime-recent-links-card"),
        recentLinks: document.getElementById("runtime-recent-links"),
        clearLinksBtn: document.getElementById("runtime-clear-links"),
        breakdownCard: document.getElementById("runtime-breakdown-card"),
        breakdownProduct: document.getElementById("runtime-breakdown-product"),
        breakdownShipping: document.getElementById("runtime-breakdown-shipping"),
        breakdownServiceLabel: document.getElementById("runtime-breakdown-service-label"),
        breakdownService: document.getElementById("runtime-breakdown-service"),
        breakdownTotal: document.getElementById("runtime-breakdown-total"),
        budgetCard: document.getElementById("runtime-budget-card"),
        budgetInput: document.getElementById("runtime-budget-input"),
        budgetBuffer: document.getElementById("runtime-budget-buffer"),
        budgetStatus: document.getElementById("runtime-budget-status"),
        budgetRemaining: document.getElementById("runtime-budget-remaining"),
        budgetSafeTotal: document.getElementById("runtime-budget-safe-total"),
        budgetMaxUsd: document.getElementById("runtime-budget-max-usd"),
        budgetNote: document.getElementById("runtime-budget-note"),
        customsCard: document.getElementById("runtime-customs-card"),
        customsLevel: document.getElementById("runtime-customs-level"),
        customsNote: document.getElementById("runtime-customs-note"),
        customsDocs: document.getElementById("runtime-customs-docs"),
        customsAlt: document.getElementById("runtime-customs-alt"),
        quoteCompareCard: document.getElementById("runtime-quote-compare-card"),
        quoteCompareStatus: document.getElementById("runtime-quote-compare-status"),
        quoteAuto: document.getElementById("runtime-quote-auto"),
        quoteSimilar: document.getElementById("runtime-quote-similar"),
        quoteManual: document.getElementById("runtime-quote-manual"),
        quoteNote: document.getElementById("runtime-quote-note"),
        resellerCard: document.getElementById("runtime-reseller-card"),
        resellerStatus: document.getElementById("runtime-reseller-status"),
        resellerPrice: document.getElementById("runtime-reseller-price"),
        resellerQty: document.getElementById("runtime-reseller-qty"),
        profitUnit: document.getElementById("runtime-profit-unit"),
        profitTotal: document.getElementById("runtime-profit-total"),
        profitRoi: document.getElementById("runtime-profit-roi"),
        profitBreakEven: document.getElementById("runtime-profit-break-even"),
        insightsCard: document.getElementById("runtime-insights-card"),
        deliveryEstimate: document.getElementById("runtime-delivery-estimate"),
        riskBadge: document.getElementById("runtime-risk-badge"),
        alerts: document.getElementById("runtime-alerts"),
        bannedError: document.getElementById("banned-error"),
        bannedErrorText: document.querySelector("#banned-error p"),
        manualQuoteBtn: document.getElementById("runtime-manual-quote"),
        quickOrderBtn: document.getElementById("runtime-quick-order"),
        imagePreviewCard: document.getElementById("runtime-image-preview-card"),
        imagePreview: document.getElementById("runtime-image-preview"),
        imageClearBtn: document.getElementById("runtime-image-clear"),
        historyList: document.getElementById("history-items-list"),
        historySearch: document.getElementById("runtime-history-search"),
        historyStatus: document.getElementById("runtime-history-status"),
        repeatOrders: document.getElementById("runtime-repeat-orders"),
        trackResult: document.getElementById("search-result"),
        notifications: document.getElementById("runtime-notifications"),
        cartInsightsCard: document.getElementById("runtime-cart-insights-card"),
        cartHealth: document.getElementById("runtime-cart-health"),
        cartUnits: document.getElementById("runtime-cart-units"),
        cartService: document.getElementById("runtime-cart-service"),
        cartFreeShip: document.getElementById("runtime-cart-free-ship"),
        cartRisk: document.getElementById("runtime-cart-risk"),
        cartEta: document.getElementById("runtime-cart-eta"),
        cartRecommendation: document.getElementById("runtime-cart-recommendation"),
        bundleCard: document.getElementById("runtime-bundle-card"),
        bundleBadge: document.getElementById("runtime-bundle-badge"),
        bundleSavings: document.getElementById("runtime-bundle-savings"),
        bundleTitle: document.getElementById("runtime-bundle-title"),
        bundleNote: document.getElementById("runtime-bundle-note"),
        voiceCard: document.getElementById("runtime-voice-card"),
        voiceRecordBtn: document.getElementById("runtime-voice-record"),
        voiceStopBtn: document.getElementById("runtime-voice-stop"),
        voiceUpload: document.getElementById("runtime-voice-upload"),
        voicePlayer: document.getElementById("runtime-voice-player"),
        voiceStatus: document.getElementById("runtime-voice-status"),
        voiceNote: document.getElementById("runtime-voice-note"),
        downloadQuoteBtn: document.getElementById("runtime-download-quote"),
        exportCsvBtn: document.getElementById("runtime-export-csv"),
        accountPhone: document.getElementById("account-phone"),
        accountCity: document.getElementById("account-city"),
        accountAddress: document.getElementById("account-address"),
        accountContactMethod: document.getElementById("account-contact-method"),
        accountSavePrefs: document.getElementById("account-save-prefs"),
        accountPrefsStatus: document.getElementById("account-prefs-status"),
        langSwitch: document.getElementById("lang-switch"),
        packName: document.getElementById("runtime-pack-name"),
        savePackBtn: document.getElementById("runtime-save-pack"),
        packCount: document.getElementById("runtime-pack-count"),
        savedPacks: document.getElementById("runtime-saved-packs"),
        alertCount: document.getElementById("runtime-alert-count"),
        alertWatchlist: document.getElementById("runtime-alert-watchlist"),
        referralTier: document.getElementById("runtime-referral-tier"),
        referralCode: document.getElementById("runtime-referral-code"),
        referralCredits: document.getElementById("runtime-referral-credits"),
        referralInput: document.getElementById("runtime-referral-input"),
        referralApply: document.getElementById("runtime-referral-apply"),
        referralCopy: document.getElementById("runtime-referral-copy"),
        referralNote: document.getElementById("runtime-referral-note"),
        accountOrders: document.getElementById("acc-stat-orders"),
        accountWish: document.getElementById("acc-stat-wish"),
        accountFetches: document.getElementById("acc-stat-fetches"),
        accountQuotes: document.getElementById("acc-stat-quotes"),
        customerTier: document.getElementById("runtime-customer-tier"),
        loyaltyPoints: document.getElementById("runtime-loyalty-points"),
        customerTagCount: document.getElementById("runtime-customer-tag-count"),
        customerTags: document.getElementById("runtime-customer-tags"),
        trackRef: document.getElementById("runtime-track-ref"),
        trackSearchBtn: document.getElementById("runtime-track-search-btn"),
        trackStatusCard: document.getElementById("runtime-track-status-card"),
        trackStatusRef: document.getElementById("runtime-track-status-ref"),
        trackStatusBadge: document.getElementById("runtime-track-status-badge"),
        trackStatusNote: document.getElementById("runtime-track-status-note"),
        trackStatusExtra: document.getElementById("runtime-track-status-extra"),
        trackTimeline: document.getElementById("runtime-track-timeline"),
        adminPin: document.getElementById("admin-pin"),
        adminUnlockBtn: document.getElementById("admin-unlock-btn"),
        adminLockBtn: document.getElementById("admin-lock-btn"),
        adminUnlockStatus: document.getElementById("admin-unlock-status"),
        adminPanel: document.getElementById("runtime-admin-panel"),
        adminPromoCode: document.getElementById("admin-promo-code"),
        adminPromoType: document.getElementById("admin-promo-type"),
        adminPromoValue: document.getElementById("admin-promo-value"),
        adminPromoLimit: document.getElementById("admin-promo-limit"),
        adminPromoExpiry: document.getElementById("admin-promo-expiry"),
        adminPromoSave: document.getElementById("admin-promo-save"),
        adminPromos: document.getElementById("runtime-admin-promos"),
        adminOrderRef: document.getElementById("admin-order-ref"),
        adminOrderStatus: document.getElementById("admin-order-status"),
        adminOrderTracking: document.getElementById("admin-order-tracking"),
        adminOrderUpdate: document.getElementById("admin-order-update"),
        adminOrders: document.getElementById("runtime-admin-orders"),
        adminActivity: document.getElementById("runtime-admin-activity"),
        adminAnalytics: document.getElementById("runtime-admin-analytics")
    };

    const state = {
        liveRate: FX_FALLBACK_RATE,
        currentProduct: null,
        recentLinks: [],
        accountPrefs: null,
        budgetPrefs: null,
        savedPacks: [],
        priceAlerts: [],
        referral: null,
        voiceNote: null,
        mediaRecorder: null,
        audioChunks: [],
        adminAnalytics: null,
        adminUnlocked: false,
        adminToken: "",
        adminPromos: [],
        activePromoCode: "",
        activityLog: [],
        selectedVariants: {},
        stats: {
            fetches: 0,
            manualQuotes: 0
        }
    };

    const original = {
        getFormData: typeof window._getFormData === "function" ? window._getFormData : null,
        sendOrder: typeof window.sendOrder === "function" ? window.sendOrder : null,
        renderHistory: typeof window.renderHistory === "function" ? window.renderHistory : null
    };

    function isAliExpressUrl(value) {
        try {
            const parsed = new URL(String(value || "").trim());
            return /(^|\.)aliexpress\.(com|us)$/i.test(parsed.hostname) || /(^|\.)a\.aliexpress\.com$/i.test(parsed.hostname);
        } catch {
            return false;
        }
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function readJsonStorage(key, fallback) {
        try {
            const raw = window.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    function writeJsonStorage(key, value) {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // ignore quota/storage errors
        }
    }

    function getStoredAdminToken() {
        try {
            return window.sessionStorage.getItem(ADMIN_TOKEN_KEY) || "";
        } catch {
            return "";
        }
    }

    function setStoredAdminToken(token) {
        try {
            if (token) {
                window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
            } else {
                window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
            }
        } catch {
            // ignore storage errors
        }
    }

    async function apiFetch(endpoint, options = {}, requiresAuth = false) {
        const headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
        if (requiresAuth && state.adminToken) {
            headers.Authorization = `Bearer ${state.adminToken}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, Object.assign({}, options, { headers }));
        let data = {};
        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (!response.ok || data.success === false) {
            const error = new Error(data.error || `Request failed (${response.status})`);
            error.status = response.status;
            throw error;
        }

        return data;
    }

    function getAccountPrefs() {
        if (state.accountPrefs) return state.accountPrefs;
        state.accountPrefs = readJsonStorage(ACCOUNT_PREFS_KEY, {
            phone: "",
            city: "",
            address: "",
            contactMethod: "whatsapp"
        });
        return state.accountPrefs;
    }

    function getBudgetPrefs() {
        if (state.budgetPrefs) return state.budgetPrefs;
        state.budgetPrefs = readJsonStorage(BUDGET_PREFS_KEY, {
            budget: "",
            buffer: "10"
        });
        return state.budgetPrefs;
    }

    function saveBudgetPrefs(prefs) {
        state.budgetPrefs = prefs;
        writeJsonStorage(BUDGET_PREFS_KEY, prefs);
    }

    function getSavedPacks() {
        if (Array.isArray(state.savedPacks) && state.savedPacks.length) return state.savedPacks;
        state.savedPacks = readJsonStorage(SAVED_PACKS_KEY, []);
        return state.savedPacks;
    }

    function saveSavedPacks(packs) {
        state.savedPacks = packs.slice(0, 8);
        writeJsonStorage(SAVED_PACKS_KEY, state.savedPacks);
        renderSavedPacks();
    }

    function getPriceAlerts() {
        if (Array.isArray(state.priceAlerts) && state.priceAlerts.length) return state.priceAlerts;
        state.priceAlerts = readJsonStorage(PRICE_ALERTS_KEY, []);
        return state.priceAlerts;
    }

    function savePriceAlerts(alerts) {
        state.priceAlerts = alerts.slice(0, 20);
        writeJsonStorage(PRICE_ALERTS_KEY, state.priceAlerts);
        renderPriceAlerts();
    }

    function buildReferralCode() {
        let seed = window.userId || window.localStorage.getItem("alexpress_user_id") || window.localStorage.getItem("alex_referral_seed") || "";
        if (!seed) {
            seed = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
            window.localStorage.setItem("alex_referral_seed", seed);
        }
        seed = String(seed).replace(/[^A-Z0-9]/gi, "").toUpperCase();
        return `ALEX-${seed.slice(-6).padStart(6, "0")}`;
    }

    function getReferralState() {
        if (state.referral) return state.referral;
        state.referral = readJsonStorage(REFERRAL_STATE_KEY, {
            code: buildReferralCode(),
            credits: 0,
            appliedCodes: [],
            usedOwnCode: false
        });
        return state.referral;
    }

    function saveReferralState(referral) {
        state.referral = referral;
        writeJsonStorage(REFERRAL_STATE_KEY, referral);
        renderReferralCard();
    }

    function getLocalStats() {
        if (state.stats && typeof state.stats.fetches === "number") return state.stats;
        state.stats = readJsonStorage(LOCAL_STATS_KEY, { fetches: 0, manualQuotes: 0 });
        return state.stats;
    }

    function getActivityLog() {
        if (Array.isArray(state.activityLog) && state.activityLog.length) return state.activityLog;
        state.activityLog = readJsonStorage(ACTIVITY_LOG_KEY, []);
        return state.activityLog;
    }

    function saveActivityLog(entries) {
        state.activityLog = entries.slice(0, 12);
        writeJsonStorage(ACTIVITY_LOG_KEY, state.activityLog);
    }

    function pushActivityLog(type, text) {
        const next = [{
            id: Date.now(),
            type,
            text,
            at: new Date().toLocaleString("ar-TN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })
        }].concat(getActivityLog()).slice(0, 12);
        saveActivityLog(next);
        renderActivityLog();
        renderNotifications();
    }

    function getAdminPin() {
        return window.localStorage.getItem(ADMIN_PIN_KEY) || "2749";
    }

    function getAdminPromos() {
        if (Array.isArray(state.adminPromos) && state.adminPromos.length) return state.adminPromos;
        state.adminPromos = readJsonStorage(ADMIN_PROMOS_KEY, []);
        return state.adminPromos;
    }

    function saveAdminPromos(promos) {
        state.adminPromos = promos;
        writeJsonStorage(ADMIN_PROMOS_KEY, promos);
        openAccountPanel("admin");
        renderAdminPromos();
        renderAccountStats();
        renderNotifications();
    }

    function mergeOrderIntoHistory(order) {
        if (!order || typeof orderHistory === "undefined" || !Array.isArray(orderHistory)) return;
        const ref = String(order.orderRef || order.id || "");
        const index = orderHistory.findIndex((item) => String(item.orderRef || item.id || "") === ref);
        if (index >= 0) {
            orderHistory[index] = Object.assign({}, orderHistory[index], order);
        } else {
            orderHistory.unshift(order);
        }
    }

    function syncOrdersFromServer(orders) {
        if (!Array.isArray(orders) || typeof orderHistory === "undefined" || !Array.isArray(orderHistory)) return;
        orders.forEach(mergeOrderIntoHistory);
        if (typeof saveData === "function") saveData();
        if (typeof window.renderHistory === "function") window.renderHistory();
    }

    async function refreshPublicPromos() {
        try {
            const data = await apiFetch("/api/promos");
            if (Array.isArray(data.promos)) {
                saveAdminPromos(data.promos);
            }
        } catch {
            // keep local fallback
        }
    }

    async function refreshAdminState() {
        if (!state.adminToken) return false;
        const data = await apiFetch("/api/admin/state", {}, true);
        state.adminUnlocked = true;
        state.adminAnalytics = data.analytics || null;
        saveAdminPromos(Array.isArray(data.promos) ? data.promos : []);
        syncOrdersFromServer(Array.isArray(data.orders) ? data.orders : []);
        if (dom.adminPanel) dom.adminPanel.classList.remove("hidden");
        if (dom.adminUnlockStatus) {
            dom.adminUnlockStatus.textContent = "Unlocked";
            dom.adminUnlockStatus.className = "text-[9px] font-black text-emerald-300";
        }
        openAccountPanel("admin");
        renderAdminAnalytics();
        return true;
    }

    async function persistOrderToBackend(order) {
        try {
            const data = await apiFetch("/api/orders/register", {
                method: "POST",
                body: JSON.stringify(order)
            });
            if (data.order) {
                mergeOrderIntoHistory(data.order);
                if (typeof saveData === "function") saveData();
                if (typeof window.renderHistory === "function") window.renderHistory();
            }
        } catch {
            // local fallback already exists
        }
    }

    function formatUsd(value) {
        return `${Number(value || 0).toFixed(2)} USD`;
    }

    function formatTnd(value) {
        return `${Number(value || 0).toFixed(3)} TND`;
    }

    function formatDateLabel(dateLike) {
        const date = dateLike ? new Date(dateLike) : new Date();
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleDateString("en-GB");
    }

    function cloneData(value) {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch {
            return value;
        }
    }

    function getProductOptionGroups(product = state.currentProduct) {
        return Array.isArray(product?.variants)
            ? product.variants.filter((group) => Array.isArray(group?.values) && group.values.length)
            : [];
    }

    function productHasOptions(product = state.currentProduct) {
        return getProductOptionGroups(product).length > 0;
    }

    function getSpecsPlaceholder(product = state.currentProduct) {
        return productHasOptions(product)
            ? "اكتب الخيار المطلوب هنا: لون، مقاس، طول، نسخة..."
            : "مثال: Bleu 1.5m";
    }

    function getSpecsValueText(product = state.currentProduct) {
        const note = String(dom.calcNote?.value || "").trim();
        if (note) return note;
        if (productHasOptions(product)) return "يرجى كتابة اللون / المقاس / الطول المطلوب في خانة المواصفات";
        return "بدون ملاحظات";
    }

    function getServiceFeeDisplayText(pricing, product = state.currentProduct) {
        return productHasOptions(product) ? "مشمولة" : formatTnd(pricing.serviceFee);
    }

    function updateSpecsGuidance(product = state.currentProduct) {
        if (!dom.calcNote) return;
        dom.calcNote.placeholder = getSpecsPlaceholder(product);
    }

    function syncProductInputs(product = state.currentProduct) {
        if (!product) return;

        const safeTitle = String(product.title || "").trim();
        if (dom.calcName) {
            dom.calcName.value = safeTitle && !/^aliexpress$/i.test(safeTitle)
                ? safeTitle
                : (dom.calcName.value || "");
        }

        if (dom.usdPrice) {
            const price = Number(product.price || 0);
            dom.usdPrice.value = Number.isFinite(price) && price > 0 ? price.toFixed(2) : "0";
        }

        if (dom.usdShip) {
            const shipping = product.shipping == null ? 0 : Number(product.shipping);
            dom.usdShip.value = Number.isFinite(shipping) && shipping > 0 ? shipping.toFixed(2) : "0";
        }

        updateSpecsGuidance(product);
    }

    function parseDeliveryWindow(label) {
        const values = String(label || "").match(/\d+/g);
        if (!values || !values.length) return null;
        const numbers = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
        if (!numbers.length) return null;
        if (numbers.length === 1) {
            return { min: numbers[0], max: numbers[0] };
        }
        return { min: Math.min(...numbers), max: Math.max(...numbers) };
    }

    function toast(message) {
        if (typeof window.showToast === "function") {
            window.showToast(message);
        }
    }

    function getShippingLabel(value) {
        if (value == null || Number.isNaN(Number(value))) return "غير متوفر";
        if (Number(value) === 0) return "شحن مجاني";
        return `${formatUsd(value)} شحن`;
    }

    function parseLocaleNumber(value) {
        const normalized = String(value ?? "")
            .trim()
            .replace(/\s+/g, "")
            .replace(/,/g, ".");
        const parsed = Number.parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function getRestrictionSummary(product) {
        if (!product?.restrictions) return "";
        if (product.restrictions.banned) return "خطر ديوانة مرتفع";
        if (product.restrictions.restricted) return "يلزم تثبت قبل الطلب";
        return "مقبول مبدئيًا";
    }

    function incrementStat(key) {
        const stats = getLocalStats();
        stats[key] = Number(stats[key] || 0) + 1;
        state.stats = stats;
        writeJsonStorage(LOCAL_STATS_KEY, stats);
        renderAccountStats();
    }

    function renderAccountStats() {
        const stats = getLocalStats();
        const ordersCount = typeof orderHistory !== "undefined" && Array.isArray(orderHistory) ? orderHistory.length : 0;
        const wishCount = typeof wishlist !== "undefined" && Array.isArray(wishlist) ? wishlist.length : 0;
        if (dom.accountFetches) dom.accountFetches.textContent = Number(stats.fetches || 0);
        if (dom.accountQuotes) dom.accountQuotes.textContent = Number(stats.manualQuotes || 0);
        if (dom.accountOrders) dom.accountOrders.textContent = ordersCount;
        if (dom.accountWish) dom.accountWish.textContent = wishCount;
        if (dom.metricOrders) dom.metricOrders.textContent = ordersCount;
        if (dom.metricPromos) {
            dom.metricPromos.textContent = getCombinedPromos().length;
        }
        if (dom.metricFetches) {
            dom.metricFetches.textContent = Number(stats.fetches || 0);
        }
        if (dom.metricRate) {
            dom.metricRate.textContent = Number(state.liveRate || FX_FALLBACK_RATE).toFixed(3);
        }
        renderCustomerProfile();
        renderNavBadges();
        renderPriceAlerts();
        renderReferralCard();
        renderAdminAnalytics();
        renderRepeatOrders();
    }

    function getCustomerProfile() {
        const stats = getLocalStats();
        const ordersCount = typeof orderHistory !== "undefined" && Array.isArray(orderHistory) ? orderHistory.length : 0;
        const wishCount = typeof wishlist !== "undefined" && Array.isArray(wishlist) ? wishlist.length : 0;
        const points = (ordersCount * 120) + (Number(stats.fetches || 0) * 5) + (Number(stats.manualQuotes || 0) * 15) + (wishCount * 8);
        const tags = [];

        if (ordersCount >= 8) tags.push({ label: "VIP CLIENT", tone: "amber" });
        else if (ordersCount >= 3) tags.push({ label: "RETURNING", tone: "blue" });
        else tags.push({ label: "NEW CLIENT", tone: "slate" });

        if (Number(stats.fetches || 0) >= 10) tags.push({ label: "POWER SEARCHER", tone: "emerald" });
        if (Number(stats.manualQuotes || 0) >= 3) tags.push({ label: "QUOTE READY", tone: "purple" });
        if (wishCount >= 4) tags.push({ label: "HIGH INTENT", tone: "pink" });

        let tier = "BRONZE";
        if (points >= 1800) tier = "PLATINUM";
        else if (points >= 900) tier = "GOLD";
        else if (points >= 350) tier = "SILVER";

        return { points, tags, tier };
    }

    function renderCustomerProfile() {
        if (!dom.customerTier || !dom.loyaltyPoints || !dom.customerTagCount || !dom.customerTags) return;
        const profile = getCustomerProfile();
        const toneMap = {
            amber: "bg-amber-400/10 text-amber-300 border-amber-400/20",
            blue: "bg-blue-500/10 text-blue-300 border-blue-500/20",
            emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
            purple: "bg-purple-500/10 text-purple-300 border-purple-500/20",
            pink: "bg-pink-500/10 text-pink-300 border-pink-500/20",
            slate: "bg-white/5 text-slate-300 border-white/10"
        };

        dom.customerTier.textContent = profile.tier;
        dom.loyaltyPoints.textContent = profile.points;
        dom.customerTagCount.textContent = profile.tags.length;
        dom.customerTags.innerHTML = profile.tags.map((tag) => `
            <span class="px-3 py-1 rounded-full border text-[9px] font-black ${toneMap[tag.tone] || toneMap.slate}">
                ${escapeHtml(tag.label)}
            </span>
        `).join("");
    }

    function ensureNavBadge(buttonId, badgeId, classes) {
        const button = document.getElementById(buttonId);
        if (!button) return null;
        let badge = document.getElementById(badgeId);
        if (!badge) {
            button.classList.add("relative");
            badge = document.createElement("span");
            badge.id = badgeId;
            badge.className = classes;
            badge.textContent = "0";
            button.appendChild(badge);
        }
        return badge;
    }

    function renderNavBadges() {
        const ordersCount = typeof orderHistory !== "undefined" && Array.isArray(orderHistory) ? orderHistory.length : 0;
        const pendingCount = typeof orderHistory !== "undefined" && Array.isArray(orderHistory)
            ? orderHistory.filter((order) => ["pending", "processing", "shipped"].includes(String(order.status || "pending"))).length
            : 0;
        const accountBadgeCount = Math.min(9, ordersCount || 0);

        const historyBadge = ensureNavBadge("tab-history", "runtime-history-badge", "absolute -top-1 -left-1 bg-blue-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black ring-2 ring-slate-900");
        const accountBadge = ensureNavBadge("tab-account", "runtime-account-badge", "absolute -top-1 -left-1 bg-amber-400 text-black text-[8px] px-1.5 py-0.5 rounded-full font-black ring-2 ring-slate-900");

        if (historyBadge) {
            historyBadge.textContent = pendingCount;
            historyBadge.classList.toggle("hidden", pendingCount === 0);
        }
        if (accountBadge) {
            accountBadge.textContent = accountBadgeCount;
            accountBadge.classList.toggle("hidden", accountBadgeCount === 0);
        }
    }

    function renderActivityLog() {
        if (!dom.adminActivity) return;
        const entries = getActivityLog();
        if (!entries.length) {
            dom.adminActivity.innerHTML = `<div class="text-[10px] text-slate-500 italic">No activity yet.</div>`;
            return;
        }

        dom.adminActivity.innerHTML = entries.map((entry) => `
            <div class="rounded-xl border border-white/5 bg-slate-900/70 p-3">
                <div class="flex items-center justify-between gap-3">
                    <span class="text-[9px] font-black text-white uppercase">${escapeHtml(entry.type || "info")}</span>
                    <span class="text-[9px] text-slate-500 font-bold">${escapeHtml(entry.at || "")}</span>
                </div>
                <div class="text-[10px] text-slate-300 mt-2">${escapeHtml(entry.text || "")}</div>
            </div>
        `).join("");
    }

    function renderNotifications() {
        if (!dom.notifications) return;
        const toneMap = {
            blue: "border-blue-400/20 bg-blue-500/10",
            emerald: "border-emerald-400/20 bg-emerald-500/10",
            amber: "border-amber-400/20 bg-amber-400/10",
            slate: "border-white/5 bg-slate-900/60"
        };
        const notices = [];
        const promos = getCombinedPromos();
        const latestOrder = typeof orderHistory !== "undefined" && Array.isArray(orderHistory) && orderHistory.length ? orderHistory[0] : null;
        const stats = getLocalStats();

        if (latestOrder) {
            notices.push({
                tone: "blue",
                title: `Latest order: ${latestOrder.orderRef || latestOrder.id}`,
                body: latestOrder.adminTracking || latestOrder.trackingHint || getStatusUi(latestOrder.status || "pending").label
            });
        }
        if (promos.length) {
            notices.push({
                tone: "emerald",
                title: `${promos.length} active promos`,
                body: `Top code: ${promos[0].code}`
            });
        }
        if (stats.manualQuotes > 0) {
            notices.push({
                tone: "amber",
                title: "Manual quote activity",
                body: `${stats.manualQuotes} quote requests prepared from this device`
            });
        }
        if (!notices.length) {
            notices.push({
                tone: "slate",
                title: "System ready",
                body: "ابدأ scrape جديد أو اطلب quote باش يبان النشاط هنا."
            });
        }

        dom.notifications.innerHTML = notices.slice(0, 4).map((item) => `
            <div class="rounded-xl border p-3 ${toneMap[item.tone] || toneMap.slate}">
                <div class="text-[10px] font-black text-white">${escapeHtml(item.title)}</div>
                <div class="text-[9px] text-slate-300 mt-1 leading-relaxed">${escapeHtml(item.body)}</div>
            </div>
        `).join("");
    }

    function getStatusUi(status) {
        const statusMap = {
            pending: { label: "قيد المراجعة", classes: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
            processing: { label: "تم الشراء", classes: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
            shipped: { label: "في الطريق", classes: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
            delivered: { label: "تم التسليم", classes: "text-green-400 bg-green-400/10 border-green-400/20" }
        };
        return statusMap[status] || statusMap.pending;
    }

    function findOrderByRef(ref) {
        if (typeof orderHistory === "undefined" || !Array.isArray(orderHistory)) return null;
        return orderHistory.find((order) => String(order.orderRef || order.id || "").toLowerCase() === String(ref || "").trim().toLowerCase()) || null;
    }

    function renderTrackLookupResult(order) {
        if (!dom.trackStatusCard || !dom.trackStatusRef || !dom.trackStatusBadge || !dom.trackStatusNote || !dom.trackStatusExtra) return;
        if (!order) {
            dom.trackStatusCard.classList.add("hidden");
            renderTrackingTimeline(null);
            return;
        }
        const statusUi = getStatusUi(order.status || "pending");
        dom.trackStatusCard.classList.remove("hidden");
        dom.trackStatusRef.textContent = order.orderRef || String(order.id || "");
        dom.trackStatusBadge.textContent = statusUi.label;
        dom.trackStatusBadge.className = `text-[10px] px-3 py-1 rounded-full font-black border ${statusUi.classes}`;
        dom.trackStatusNote.textContent = order.trackingHint || order.adminTracking || "مازال ما فماش tracking note مضافة.";
        dom.trackStatusExtra.textContent = order.adminTracking ? `Tracking: ${order.adminTracking}` : "";
        renderTrackingTimeline(order);
    }

    async function searchTrackedOrder() {
        const ref = dom.trackRef?.value.trim() || "";
        if (!ref) {
            toast("دخل مرجع الطلب أولًا.");
            return;
        }
        let order = null;
        try {
            const data = await apiFetch(`/api/orders/${encodeURIComponent(ref)}`);
            order = data.order || null;
            if (order) {
                mergeOrderIntoHistory(order);
                if (typeof saveData === "function") saveData();
            }
        } catch {
            order = null;
        }
        if (!order) order = findOrderByRef(ref);
        if (!order) {
            renderTrackLookupResult(null);
            toast("ما لقيناش الطلب بهذا المرجع.");
            return;
        }
        renderTrackLookupResult(order);
    }

    async function unlockAdmin() {
        const pin = dom.adminPin?.value.trim() || "";
        state.adminUnlocked = pin === getAdminPin();
        if (!dom.adminPanel || !dom.adminUnlockStatus) return;
        dom.adminPanel.classList.toggle("hidden", !state.adminUnlocked);
        dom.adminUnlockStatus.textContent = state.adminUnlocked ? "Unlocked" : "Locked";
        dom.adminUnlockStatus.className = `text-[9px] font-black ${state.adminUnlocked ? "text-emerald-300" : "text-red-300"}`;
        if (!state.adminUnlocked) {
            toast("PIN admin غالط.");
            return;
        }
        renderAdminPromos();
        renderAdminOrders();
        toast("تم فتح لوحة الإدارة.");
    }

    function lockAdmin() {
        state.adminUnlocked = false;
        if (dom.adminPanel) dom.adminPanel.classList.add("hidden");
        if (dom.adminUnlockStatus) {
            dom.adminUnlockStatus.textContent = "Locked";
            dom.adminUnlockStatus.className = "text-[9px] font-black text-red-300";
        }
        openAccountPanel("overview");
    }

    function renderAdminPromos() {
        if (!dom.adminPromos) return;
        const promos = getAdminPromos();
        if (!promos.length) {
            dom.adminPromos.innerHTML = `<div class="text-[10px] text-slate-500 italic">ما فماش promo codes محليين توّا.</div>`;
            return;
        }
        dom.adminPromos.innerHTML = promos.map((promo, index) => `
            <div class="rounded-2xl border border-white/5 bg-slate-900/70 p-3 flex items-center justify-between gap-3">
                <div class="min-w-0">
                    <div class="text-[10px] font-black text-white">${escapeHtml(promo.code)}</div>
                    <div class="text-[9px] text-slate-400">
                        ${promo.type === "percent" ? `${promo.value}%` : `${promo.value} TND`} • 
                        used ${Number(promo.used || 0)}/${Number(promo.limit || 0) || "∞"} • 
                        ${promo.expiresAt || "no expiry"}
                    </div>
                </div>
                <button type="button" class="text-[9px] font-black text-red-300 hover:text-red-200 transition-colors" data-remove-promo="${index}">Delete</button>
            </div>
        `).join("");
    }

    function renderAdminOrders() {
        if (!dom.adminOrders) return;
        const orders = typeof orderHistory !== "undefined" && Array.isArray(orderHistory) ? orderHistory.slice(0, 8) : [];
        if (!orders.length) {
            dom.adminOrders.innerHTML = `<div class="text-[10px] text-slate-500 italic">ما فماش طلبات حتى الآن.</div>`;
            return;
        }
        dom.adminOrders.innerHTML = orders.map((order) => {
            const statusUi = getStatusUi(order.status || "pending");
            return `
                <button type="button" class="w-full text-right rounded-2xl border border-white/5 bg-slate-900/70 p-3 hover:border-amber-400/30 transition-colors" data-fill-order="${escapeHtml(order.orderRef || String(order.id || ""))}">
                    <div class="flex items-center justify-between gap-3">
                        <span class="text-[10px] font-black text-white">${escapeHtml(order.orderRef || String(order.id || ""))}</span>
                        <span class="text-[9px] px-2 py-1 rounded-md border ${statusUi.classes} font-bold">${statusUi.label}</span>
                    </div>
                    <div class="text-[9px] text-slate-500 mt-2">${escapeHtml(order.adminTracking || order.trackingHint || "")}</div>
                </button>
            `;
        }).join("");
    }

    function saveAdminPromo() {
        const code = (dom.adminPromoCode?.value || "").trim().toUpperCase();
        const type = dom.adminPromoType?.value || "percent";
        const value = Number(dom.adminPromoValue?.value || 0);
        const limit = Number(dom.adminPromoLimit?.value || 0);
        const expiresAt = dom.adminPromoExpiry?.value || "";
        if (!code || value <= 0) {
            toast("كمّل بيانات الـ promo code.");
            return;
        }
        const promos = getAdminPromos().filter((promo) => promo.code !== code);
        promos.unshift({ code, type, value, limit, expiresAt, used: 0 });
        saveAdminPromos(promos);
        if (dom.adminPromoCode) dom.adminPromoCode.value = "";
        if (dom.adminPromoValue) dom.adminPromoValue.value = "";
        if (dom.adminPromoLimit) dom.adminPromoLimit.value = "";
        if (dom.adminPromoExpiry) dom.adminPromoExpiry.value = "";
        toast("تم حفظ الـ promo code.");
    }

    function normalizePromo(promo) {
        if (!promo) return null;
        const code = String(promo.code || "").trim().toUpperCase();
        if (!code) return null;
        return {
            code,
            type: promo.type || (promo.discountType === "fixed" ? "fixed" : "percent"),
            value: Number(promo.value ?? promo.discount ?? 0),
            limit: Number(promo.limit ?? promo.usageLimit ?? 0),
            used: Number(promo.used || 0),
            expiresAt: promo.expiresAt || promo.expiry || promo.expires || ""
        };
    }

    function getCombinedPromos() {
        const cloud = Array.isArray(window.availablePromos) ? window.availablePromos : [];
        const combined = [...getAdminPromos(), ...cloud].map(normalizePromo).filter(Boolean);
        const seen = new Set();
        return combined.filter((promo) => {
            if (seen.has(promo.code)) return false;
            seen.add(promo.code);
            return true;
        });
    }

    function applyPromoCode() {
        const codeInput = document.getElementById("promo-code");
        const msg = document.getElementById("promo-message");
        const discountBadge = document.getElementById("discount-badge");
        const code = String(codeInput?.value || "").trim().toUpperCase();
        if (!code || typeof currentDiscount === "undefined") {
            toast("دخل promo code صحيح.");
            return;
        }

        const now = new Date();
        const promo = getCombinedPromos().find((item) => item.code === code);
        const expired = promo?.expiresAt ? new Date(promo.expiresAt) < now : false;
        const limitReached = promo?.limit > 0 && promo.used >= promo.limit;

        if (!promo || promo.value <= 0 || expired || limitReached) {
            currentDiscount = 0;
            discountType = "";
            state.activePromoCode = "";
            if (msg) {
                msg.classList.remove("hidden", "text-green-400");
                msg.classList.add("text-red-400");
                msg.textContent = "الكود غالط، منتهي، أو limit متاعو كمل.";
            }
            discountBadge?.classList.add("hidden");
            if (typeof renderCart === "function") renderCart();
            toast("الـ promo code موش صالح.");
            return;
        }

        currentDiscount = promo.value;
        discountType = promo.type;
        state.activePromoCode = promo.code;
        if (msg) {
            msg.classList.remove("hidden", "text-red-400");
            msg.classList.add("text-green-400");
            msg.textContent = promo.type === "percent"
                ? `تم تفعيل ${promo.code} بخصم ${promo.value}%`
                : `تم تفعيل ${promo.code} بخصم ${promo.value} TND`;
        }
        discountBadge?.classList.remove("hidden");
        if (typeof renderCart === "function") renderCart();
        toast("تم تفعيل الـ promo code.");
    }

    function markPromoUsed(code) {
        if (!code) return;
        const promos = getAdminPromos().slice();
        const index = promos.findIndex((promo) => String(promo.code || "").trim().toUpperCase() === String(code).trim().toUpperCase());
        if (index === -1) return;
        promos[index].used = Number(promos[index].used || 0) + 1;
        saveAdminPromos(promos);
    }

    function removeAdminPromo(index) {
        const promos = getAdminPromos().slice();
        promos.splice(index, 1);
        saveAdminPromos(promos);
        toast("تم حذف الـ promo code.");
    }

    function fillAdminOrder(ref) {
        const order = findOrderByRef(ref);
        if (!order) return;
        if (dom.adminOrderRef) dom.adminOrderRef.value = order.orderRef || String(order.id || "");
        if (dom.adminOrderStatus) dom.adminOrderStatus.value = order.status || "pending";
        if (dom.adminOrderTracking) dom.adminOrderTracking.value = order.adminTracking || order.trackingHint || "";
    }

    function updateAdminOrder() {
        const ref = dom.adminOrderRef?.value.trim() || "";
        if (!ref || typeof orderHistory === "undefined" || !Array.isArray(orderHistory)) {
            toast("دخل مرجع طلب صحيح.");
            return;
        }
        const target = findOrderByRef(ref);
        if (!target) {
            toast("الطلب هذا موش موجود.");
            return;
        }
        target.status = dom.adminOrderStatus?.value || "pending";
        target.adminTracking = dom.adminOrderTracking?.value.trim() || "";
        target.trackingHint = target.adminTracking || target.trackingHint || "";
        if (typeof saveData === "function") saveData();
        if (typeof window.renderHistory === "function") window.renderHistory();
        renderTrackLookupResult(target);
        renderAdminOrders();
        toast("تم تحديث status الطلب.");
    }

    async function unlockAdminRemote() {
        const pin = dom.adminPin?.value.trim() || "";
        if (!dom.adminPanel || !dom.adminUnlockStatus) return;

        try {
            const data = await apiFetch("/api/admin/login", {
                method: "POST",
                body: JSON.stringify({ pin })
            });
            state.adminToken = data.token || "";
            state.adminUnlocked = Boolean(state.adminToken);
            setStoredAdminToken(state.adminToken);
            state.adminAnalytics = data.state?.analytics || null;
            saveAdminPromos(Array.isArray(data.state?.promos) ? data.state.promos : []);
            syncOrdersFromServer(Array.isArray(data.state?.orders) ? data.state.orders : []);
            dom.adminPanel.classList.remove("hidden");
            dom.adminUnlockStatus.textContent = "Unlocked";
            dom.adminUnlockStatus.className = "text-[9px] font-black text-emerald-300";
            openAccountPanel("admin");
            renderAdminPromos();
            renderAdminOrders();
            renderAdminAnalytics();
            pushActivityLog("admin", "Admin session unlocked and synced.");
            toast("Admin synced.");
        } catch (error) {
            state.adminUnlocked = false;
            state.adminToken = "";
            setStoredAdminToken("");
            dom.adminPanel.classList.add("hidden");
            dom.adminUnlockStatus.textContent = "Locked";
            dom.adminUnlockStatus.className = "text-[9px] font-black text-red-300";
            toast(error.message || "Admin login failed.");
        }
    }

    function lockAdminRemote() {
        state.adminUnlocked = false;
        state.adminToken = "";
        setStoredAdminToken("");
        if (dom.adminPanel) dom.adminPanel.classList.add("hidden");
        if (dom.adminUnlockStatus) {
            dom.adminUnlockStatus.textContent = "Locked";
            dom.adminUnlockStatus.className = "text-[9px] font-black text-red-300";
        }
        openAccountPanel("overview");
    }

    async function searchTrackedOrderRemote() {
        return searchTrackedOrder();
    }

    async function saveAdminPromoRemote() {
        const code = (dom.adminPromoCode?.value || "").trim().toUpperCase();
        const type = dom.adminPromoType?.value || "percent";
        const value = Number(dom.adminPromoValue?.value || 0);
        const limit = Number(dom.adminPromoLimit?.value || 0);
        const expiresAt = dom.adminPromoExpiry?.value || "";

        if (!code || value <= 0) {
            toast("Promo data is incomplete.");
            return;
        }
        if (!state.adminToken) {
            toast("Unlock admin first.");
            return;
        }

        try {
            const data = await apiFetch("/api/admin/promos", {
                method: "POST",
                body: JSON.stringify({ code, type, value, limit, expiresAt, used: 0 })
            }, true);
            saveAdminPromos(Array.isArray(data.promos) ? data.promos : []);
            if (dom.adminPromoCode) dom.adminPromoCode.value = "";
            if (dom.adminPromoValue) dom.adminPromoValue.value = "";
            if (dom.adminPromoLimit) dom.adminPromoLimit.value = "";
            if (dom.adminPromoExpiry) dom.adminPromoExpiry.value = "";
            pushActivityLog("promo", `Saved promo ${code}.`);
            toast("Promo saved.");
        } catch (error) {
            toast(error.message || "Promo save failed.");
        }
    }

    async function removeAdminPromoRemote(index) {
        const promo = getAdminPromos().slice()[index];
        if (!promo?.code) return;
        if (!state.adminToken) {
            toast("Unlock admin first.");
            return;
        }

        try {
            const data = await apiFetch(`/api/admin/promos/${encodeURIComponent(promo.code)}`, {
                method: "DELETE"
            }, true);
            saveAdminPromos(Array.isArray(data.promos) ? data.promos : []);
            pushActivityLog("promo", `Deleted promo ${promo.code}.`);
            toast("Promo deleted.");
        } catch (error) {
            toast(error.message || "Promo delete failed.");
        }
    }

    async function updateAdminOrderRemote() {
        const ref = dom.adminOrderRef?.value.trim() || "";
        if (!ref) {
            toast("Order ref required.");
            return;
        }
        if (!state.adminToken) {
            toast("Unlock admin first.");
            return;
        }

        try {
            const data = await apiFetch(`/api/admin/orders/${encodeURIComponent(ref)}`, {
                method: "PUT",
                body: JSON.stringify({
                    status: dom.adminOrderStatus?.value || "pending",
                    adminTracking: dom.adminOrderTracking?.value.trim() || ""
                })
            }, true);
            if (data.order) {
                mergeOrderIntoHistory(data.order);
                if (typeof saveData === "function") saveData();
                if (typeof window.renderHistory === "function") window.renderHistory();
                renderTrackLookupResult(data.order);
                renderAdminOrders();
                pushActivityLog("order", `Updated ${ref} to ${dom.adminOrderStatus?.value || "pending"}.`);
            }
            toast("Order updated.");
        } catch (error) {
            toast(error.message || "Order update failed.");
        }
    }

    function renderRecentLinks() {
        if (!dom.recentLinksCard || !dom.recentLinks) return;
        state.recentLinks = [];
        writeJsonStorage(RECENT_LINKS_KEY, []);
        dom.recentLinks.innerHTML = "";
        dom.recentLinksCard.classList.add("hidden");
    }

    function saveRecentLink(product) {
        return;
    }

    function useRecentLink(index) {
        return;
    }

    function clearRecentLinks() {
        state.recentLinks = [];
        writeJsonStorage(RECENT_LINKS_KEY, []);
        renderRecentLinks();
    }

    function renderImagePreview(dataUrl) {
        if (!dom.imagePreviewCard || !dom.imagePreview) return;
        const hasImage = Boolean(dataUrl);
        dom.imagePreviewCard.classList.toggle("hidden", !hasImage);
        if (hasImage) dom.imagePreview.src = dataUrl;
    }

    function ensurePreviewDescriptionNode() {
        if (dom.previewDescription) return dom.previewDescription;
        if (!dom.previewTitle || !dom.previewTitle.parentElement) return null;
        const node = document.createElement("p");
        node.id = "runtime-preview-description";
        node.className = "text-[11px] md:text-sm text-slate-300 leading-relaxed max-w-4xl";
        node.textContent = "وصف المنتج باش يظهر هنا كي يتجلب المنتج.";
        dom.previewTitle.insertAdjacentElement("afterend", node);
        dom.previewDescription = node;
        return node;
    }

    function applyCalculatorUiCleanup() {
        const noteBlock = dom.calcNote?.closest("div");
        const imageBlock = dom.calcImage?.closest("div");
        if (noteBlock) noteBlock.classList.remove("hidden");
        if (imageBlock) imageBlock.classList.add("hidden");
        if (dom.imagePreviewCard) dom.imagePreviewCard.classList.add("hidden");
        if (dom.budgetCard) dom.budgetCard.classList.add("hidden");
        if (dom.customsCard) dom.customsCard.classList.add("hidden");
        if (dom.resellerCard) dom.resellerCard.classList.add("hidden");
    }

    function applyAccountUiCleanup() {
        const toolsPanel = document.querySelector('#section-account details[data-account-panel="tools"]');
        const notificationsPanel = document.querySelector('#section-account details[data-account-panel="notifications"]');
        const legacyAccount = document.getElementById("section-account-legacy");
        if (toolsPanel) {
            toolsPanel.open = false;
            toolsPanel.classList.add("hidden");
        }
        if (notificationsPanel) {
            notificationsPanel.open = false;
            notificationsPanel.classList.add("hidden");
        }
        if (legacyAccount) {
            legacyAccount.remove();
        }
    }

    function repairTabLayout() {
        const main = document.querySelector("main");
        if (!main) return;

        const orderedSectionIds = [
            "section-guide",
            "section-calc",
            "section-wishlist",
            "section-history",
            "section-track",
            "section-cart",
            "section-check",
            "section-account"
        ];

        let anchor = null;
        orderedSectionIds.forEach((sectionId) => {
            const section = document.getElementById(sectionId);
            if (!section) return;
            if (!anchor) {
                if (section.parentElement !== main) {
                    main.prepend(section);
                }
                anchor = section;
                return;
            }
            if (section.parentElement !== main || section.previousElementSibling !== anchor) {
                anchor.insertAdjacentElement("afterend", section);
            }
            anchor = section;
        });

        const legacyAccount = document.getElementById("section-account-legacy");
        if (legacyAccount) legacyAccount.remove();
    }

    function patchTabSwitching() {
        const sectionIds = ["guide", "calc", "wishlist", "history", "track", "cart", "check", "account"];

        function applyTabState(tabId) {
            const safeTabId = sectionIds.includes(tabId) ? tabId : "guide";
            sectionIds.forEach((id) => {
                const section = document.getElementById(`section-${id}`);
                const button = document.getElementById(`tab-${id}`);
                const isActive = id === safeTabId;
                if (section) {
                    section.classList.toggle("active", isActive);
                    section.style.display = isActive ? "block" : "none";
                }
                if (button) {
                    button.classList.toggle("active-tab", isActive);
                }
            });
            window.scrollTo({ top: 0, behavior: "smooth" });
            if (safeTabId === "guide" && typeof window.initCharts === "function") {
                window.initCharts();
            }
        }

        window.switchTab = applyTabState;

        const activeButton = document.querySelector(".nav-btn.active-tab");
        const currentTab = activeButton?.id?.replace(/^tab-/, "") || "guide";
        applyTabState(currentTab);
    }

    function getAccountPanels() {
        return Array.from(document.querySelectorAll('#section-account details.account-panel:not(.hidden)'));
    }

    function openAccountPanel(panelName) {
        const panels = getAccountPanels();
        if (!panels.length) return;
        let matched = false;
        panels.forEach((panel) => {
            const shouldOpen = panel.dataset.accountPanel === panelName;
            panel.open = shouldOpen;
            matched = matched || shouldOpen;
        });
        if (!matched && panels[0]) panels[0].open = true;
    }

    function initAccountPanels() {
        const panels = getAccountPanels();
        if (!panels.length) return;
        if (!panels.some((panel) => panel.open)) {
            panels[0].open = true;
        }
        panels.forEach((panel) => {
            if (panel.__accountBound) return;
            panel.addEventListener("toggle", () => {
                if (!panel.open) return;
                panels.forEach((otherPanel) => {
                    if (otherPanel !== panel) otherPanel.open = false;
                });
            });
            panel.__accountBound = true;
        });
    }

    const UI_TRANSLATIONS = {
        ar: {
            page_title: "مركز عمليات Alexpress Tunisie",
            nav_guide: "الدليل",
            nav_calc: "الحاسبة",
            nav_cart: "السلة",
            nav_wish: "المفضلة",
            nav_track: "التتبع",
            nav_check: "الأمان",
            nav_hist: "طلباتي",
            nav_acc: "الحساب",
            hero_title_1: "كيفاش تشري",
            hero_title_2: "من AliExpress؟",
            hero_desc: "دليلك الكامل باش طلبيتك توصل لباب دارك في تونس، بطريقة واضحة وأنيقة.",
            hero_btn: "ابدأ الحساب من هنا",
            trust_1: "أمان كامل",
            trust_2: "شحن سريع",
            trust_3: "دعم متواصل",
            trust_4: "خدمة مضمونة",
            step1_title: "لوّج في AliExpress",
            step1_desc: "اختار المنتج اللي يعجبك وخذ الرابط متاعو.",
            step2_title: "انسخ الرابط",
            step2_desc: "الصق الرابط هنا باش نجهزلك المعطيات بسرعة.",
            step3_title: "احسب وراجع",
            step3_desc: "شوف المعطيات، الوصف، والتنبيهات قبل التأكيد.",
            step4_title: "أرسل الطلب",
            step4_desc: "ثبت الطلب وابعثهولنا مباشرة على واتساب.",
            pay_title: "طرق الدفع المتاحة",
            faq_title: "أسئلة شائعة",
            faq_q1: "قداش تقعد الشحنة حتى توصل؟",
            faq_a1: "عادة بين 15 و45 يوم عمل حسب نوع الشحن والمنتج.",
            faq_q2: "كيفاش نخلّص بالدينار؟",
            faq_a2: "تخلّص بالدينار وإحنا نتكفلوا بالدفع للمزوّد.",
            faq_q3: "فما ضمان؟",
            faq_a3: "نضمنوا المتابعة والتنسيق حتى يوصل الطلب بطريقة صحيحة.",
            faq_q4: "قداش نخلّص في البريد؟",
            faq_a4: "إذا فما معلوم بريد أو ديوانة يبانلك قبل التأكيد أو وقت الاستلام.",
            transp_title: "شفافية كاملة في الأسعار",
            transp_desc: "تفاصيل التكلفة ديما واضحة: المنتج، الخدمات، وأي مصاريف إضافية.",
            transp_1: "سعر المنتج من المصدر",
            transp_2: "مصاريف الخدمة والتحويل",
            transp_3: "أي معلوم إضافي عند الاستلام",
            transp_btn: "امشِ للحاسبة وجرّب",
            calc_rate: "سعر الصرف اليوم:",
            calc_guide_btn: "أول مرة تشري؟ اقرأ الدليل",
            calc_title: "الحاسبة الذكية",
            banned_err: "المنتج هذا يحتاج مراجعة قبل ما نكملوا الطلب.",
            lbl_link: "رابط AliExpress",
            lbl_name: "اسم المنتج",
            btn_format: "ترتيب الاسم",
            lbl_spec: "المواصفات (لون، مقاس...)",
            plc_link: "https://aliexpress.com/item/...",
            plc_name: "مثال: Cable USB Type C",
            plc_spec: "مثال: Bleu 1.5m",
            cart_total_lbl: "المبلغ الجملي:",
            lbl_pay_method: "اختر وسيلة الدفع",
            pay_d17: "تطبيق D17",
            pay_flouci: "App Flouci",
            pay_poste: "حوالة بريدية",
            pay_vir: "تحويل بنكي",
            btn_send: "إرسال",
            saf_title: "الأمان والديوانة",
            saf_desc1: "أهم الفئات اللي تحتاج حذر أو مراجعة في تونس.",
            saf_desc2: "كل طلب يتراجع حسب نوع المنتج قبل التأكيد النهائي.",
            saf_calc_title: "حاسبة الديوانة التقريبية",
            saf_calc_desc: "اختار نوع المنتج وخذ فكرة سريعة على المصاريف المحتملة.",
            saf_btn_clothes: "ملابس وأحذية",
            saf_btn_elec: "إلكترونيات",
            saf_btn_acc: "إكسسوارات",
            saf_btn_other: "أخرى",
            acc_title: "حسابي الشخصي",
            acc_subtitle: "بياناتك وتجربتك محفوظين بطريقة مرتبة.",
            acc_id_lbl: "معرّف الحساب",
            acc_sync_status: "حالة المزامنة",
            acc_sync_ok: "متصل وبالسحابة",
            lvl_title: "مستوى الحساب",
            acc_note: "تنجم ترجع لبياناتك من نفس الجهاز أو بالمزامنة وقت تكون متاحة.",
            footer_desc: "وسيط تونسي مرتب وعملي للتسوق من AliExpress."
        },
        fr: {
            page_title: "Centre Alexpress Tunisie",
            nav_guide: "Guide",
            nav_calc: "Calculatrice",
            nav_cart: "Panier",
            nav_wish: "Favoris",
            nav_track: "Suivi",
            nav_check: "Securite",
            nav_hist: "Commandes",
            nav_acc: "Compte",
            hero_title_1: "Comment acheter",
            hero_title_2: "sur AliExpress ?",
            hero_desc: "Une experience claire et elegante pour commander depuis AliExpress vers la Tunisie.",
            hero_btn: "Commencer le calcul",
            trust_1: "Securite totale",
            trust_2: "Livraison rapide",
            trust_3: "Support continu",
            trust_4: "Service garanti",
            step1_title: "Choisissez le produit",
            step1_desc: "Prenez le lien du produit qui vous interesse.",
            step2_title: "Collez le lien",
            step2_desc: "Nous recuperons les informations les plus utiles automatiquement.",
            step3_title: "Revoyez les details",
            step3_desc: "Nom, image, description et alertes utiles avant validation.",
            step4_title: "Envoyez la commande",
            step4_desc: "Finalisez rapidement via WhatsApp.",
            pay_title: "Moyens de paiement",
            faq_title: "Questions frequentes",
            faq_q1: "Quel est le delai de livraison ?",
            faq_a1: "En general entre 15 et 45 jours ouvrables.",
            faq_q2: "Comment payer en dinars ?",
            faq_a2: "Vous payez en TND et nous gerons le paiement au fournisseur.",
            faq_q3: "Y a-t-il une garantie ?",
            faq_a3: "Nous assurons le suivi et la coordination jusqu'a reception.",
            faq_q4: "Y a-t-il des frais a la poste ?",
            faq_a4: "Selon le produit, un petit montant peut etre demande a la reception.",
            transp_title: "Transparence totale",
            transp_desc: "Les composantes du prix restent claires a chaque etape.",
            transp_1: "Prix du produit",
            transp_2: "Frais de service et conversion",
            transp_3: "Eventuels frais a la reception",
            transp_btn: "Aller a la calculatrice",
            calc_rate: "Taux du jour :",
            calc_guide_btn: "Premiere visite ? Lire le guide",
            calc_title: "Calculatrice intelligente",
            banned_err: "Ce produit demande une verification avant confirmation.",
            lbl_link: "Lien AliExpress",
            lbl_name: "Nom du produit",
            btn_format: "Nettoyer le nom",
            lbl_spec: "Specifications (couleur, taille...)",
            plc_link: "https://aliexpress.com/item/...",
            plc_name: "Exemple : Cable USB Type C",
            plc_spec: "Exemple : Bleu 1.5m",
            cart_total_lbl: "Total :",
            lbl_pay_method: "Choisissez le paiement",
            pay_d17: "Application D17",
            pay_flouci: "Application Flouci",
            pay_poste: "Mandat postal",
            pay_vir: "Virement bancaire",
            btn_send: "Envoyer",
            saf_title: "Securite et douane",
            saf_desc1: "Categories sensibles ou controlees en Tunisie.",
            saf_desc2: "Chaque demande est revue avant validation finale.",
            saf_calc_title: "Estimation douane",
            saf_calc_desc: "Selectionnez la categorie pour une idee rapide.",
            saf_btn_clothes: "Vetements",
            saf_btn_elec: "Electronique",
            saf_btn_acc: "Accessoires",
            saf_btn_other: "Autre",
            acc_title: "Mon compte",
            acc_subtitle: "Vos preferences et votre activite dans un espace propre.",
            acc_id_lbl: "Identifiant compte",
            acc_sync_status: "Etat de sync",
            acc_sync_ok: "Connecte au cloud",
            lvl_title: "Niveau du compte",
            acc_note: "Vos donnees restent accessibles sur le meme appareil ou via synchronisation.",
            footer_desc: "Votre passerelle tunisienne pour acheter sur AliExpress."
        },
        en: {
            page_title: "Alexpress Tunisie Operations Center",
            nav_guide: "Guide",
            nav_calc: "Calculator",
            nav_cart: "Cart",
            nav_wish: "Wishlist",
            nav_track: "Tracking",
            nav_check: "Safety",
            nav_hist: "Orders",
            nav_acc: "Account",
            hero_title_1: "How to buy",
            hero_title_2: "from AliExpress?",
            hero_desc: "A clearer, more premium way to manage AliExpress orders for Tunisia.",
            hero_btn: "Start calculating",
            trust_1: "Full Security",
            trust_2: "Fast Delivery",
            trust_3: "Always-On Support",
            trust_4: "Guaranteed Service",
            step1_title: "Pick your product",
            step1_desc: "Copy the AliExpress link for the item you want.",
            step2_title: "Paste the link",
            step2_desc: "We pull the most useful product details automatically.",
            step3_title: "Review the details",
            step3_desc: "Check the name, image, description, and any warnings.",
            step4_title: "Send the order",
            step4_desc: "Finalize quickly through WhatsApp.",
            pay_title: "Payment Methods",
            faq_title: "Frequently Asked Questions",
            faq_q1: "How long does delivery take?",
            faq_a1: "Usually between 15 and 45 business days.",
            faq_q2: "How do I pay in TND?",
            faq_a2: "You pay locally in TND and we handle the supplier payment.",
            faq_q3: "Is there any guarantee?",
            faq_a3: "We provide follow-up and coordination through the full order flow.",
            faq_q4: "Are there postal fees?",
            faq_a4: "Some products may have small fees at delivery depending on the shipment.",
            transp_title: "Full Price Transparency",
            transp_desc: "Every cost component stays visible throughout the process.",
            transp_1: "Source product cost",
            transp_2: "Service and transfer fees",
            transp_3: "Possible fees on receipt",
            transp_btn: "Open the calculator",
            calc_rate: "Today's exchange rate:",
            calc_guide_btn: "First order? Read the guide",
            calc_title: "Smart Calculator",
            banned_err: "This product needs review before final confirmation.",
            lbl_link: "AliExpress Link",
            lbl_name: "Product Name",
            btn_format: "Clean Title",
            lbl_spec: "Specifications (color, size...)",
            plc_link: "https://aliexpress.com/item/...",
            plc_name: "Example: Cable USB Type C",
            plc_spec: "Example: Blue 1.5m",
            cart_total_lbl: "Grand Total:",
            lbl_pay_method: "Choose payment method",
            pay_d17: "D17 App",
            pay_flouci: "Flouci App",
            pay_poste: "Postal Mandate",
            pay_vir: "Bank Transfer",
            btn_send: "Send",
            saf_title: "Safety and Customs",
            saf_desc1: "Key categories that may need review in Tunisia.",
            saf_desc2: "Each request is checked before final confirmation.",
            saf_calc_title: "Customs Estimate",
            saf_calc_desc: "Select a category for a quick estimate.",
            saf_btn_clothes: "Clothes",
            saf_btn_elec: "Electronics",
            saf_btn_acc: "Accessories",
            saf_btn_other: "Other",
            acc_title: "My Account",
            acc_subtitle: "Your preferences and activity in one clean space.",
            acc_id_lbl: "Account ID",
            acc_sync_status: "Sync Status",
            acc_sync_ok: "Cloud connected",
            lvl_title: "Account Level",
            acc_note: "Your data stays available on the same device or through sync when available.",
            footer_desc: "A polished Tunisian gateway for AliExpress orders."
        }
    };

    const RUNTIME_TRANSLATIONS = {
        ar: {
            preview_ready: "جاهز لتونس",
            preview_review: "راجع قبل التأكيد",
            preview_no_desc: "ما لقيناش وصف واضح، أما الاسم والصورة متوفرين.",
            stat_shipping: "شحن تونس",
            stat_delivery: "التوصيل",
            stat_rating: "التقييم",
            stat_reviews: "المراجعات",
            action_open: "فتح المنتج الأصلي",
            action_alert: "تنبيه هبوط السعر",
            action_share: "مشاركة الإحالة",
            trust_title: "ثقة البائع",
            trust_desc: "تقييم سريع حسب التقييم والمراجعات والشحن والمخاطر",
            variant_title: "ملاحظة على الخيارات",
            variant_desc: "إذا المنتج فيه لون أو مقاس أو طول، اكتب الخيار المطلوب في المواصفات لأن السعر ينجم يتبدل",
            variant_auto: "SPEC",
            quote_pdf: "PDF / عرض سعر",
            export_csv: "تصدير CSV",
            account_overview: "نظرة عامة",
            account_overview_desc: "ملخص سريع للحساب والنشاط",
            account_contact: "بيانات وتفضيلات",
            account_contact_desc: "بياناتك المحفوظة وطرق التواصل",
            account_admin: "لوحة الإدارة",
            account_admin_desc: "البروموات والطلبات وإدارة الحالة",
            cloud_identity: "هوية السحابة",
            saved_yes: "محفوظة",
            saved_no: "غير محفوظة",
            contact_whatsapp: "واتساب",
            contact_call: "مكالمة",
            contact_sms: "SMS",
            cart_eta: "التوصيل",
            cart_ready: "جاهز",
            cart_split: "قسّم الطلب",
            cart_rec_empty: "أضف منتجات للسلة باش يبان التحليل الذكي.",
            cart_rec_ready: "السلة متوازنة وجاهزة للإرسال كطلب واحد.",
            cart_rec_risk: "في السلة منتجات تحتاج حذر أو مراجعة. الأفضل تقسيمها أو مراجعتها يدويًا.",
            cart_rec_eta: "مواعيد التوصيل متباعدة. تقسيم الطلب ينجم يكون أوضح وأسرع.",
            cart_rec_large: "السلة كبيرة. راجع المقاسات والخيارات قبل الإرسال النهائي.",
            bundle_default: "تجميعة ذكية",
            bundle_note_low: "أضف أكثر من منتج باش تتحسن التجميعة أكثر.",
            bundle_note_hot: "التجميعة هاذي تنجم توفر أكثر في الرسوم والخدمة.",
            safety_ban: "ممنوع 100%",
            safety_license: "قد يطلب ترخيص",
            safety_before: "قبل ما تطلب",
            safety_docs: "وثائق تنجم تنفع",
            safety_notice: "تنبيه مهم",
            remove: "حذف",
            total: "الإجمالي",
            shipping_free: "شحن مجاني",
            reviews_na: "غير متوفر",
            rating_na: "غير متوفر"
        },
        fr: {
            preview_ready: "Pret pour la Tunisie",
            preview_review: "A revoir avant validation",
            preview_no_desc: "La description n'est pas claire pour le moment, mais le nom et l'image sont disponibles.",
            stat_shipping: "Livraison TN",
            stat_delivery: "Delai",
            stat_rating: "Note",
            stat_reviews: "Avis",
            action_open: "Ouvrir le produit",
            action_alert: "Alerte prix",
            action_share: "Partager l'affiliation",
            trust_title: "Confiance vendeur",
            trust_desc: "Resume rapide selon note, avis, livraison et risque douane",
            variant_title: "Note options",
            variant_desc: "Si le produit a couleur, taille ou longueur, ecrivez l'option dans les specifications car le prix peut changer",
            variant_auto: "SPEC",
            quote_pdf: "PDF / Devis",
            export_csv: "Exporter CSV",
            account_overview: "Vue d'ensemble",
            account_overview_desc: "Resume rapide du compte et de l'activite",
            account_contact: "Contact & Preferences",
            account_contact_desc: "Vos informations sauvegardees et votre moyen de contact",
            account_admin: "Admin Studio",
            account_admin_desc: "Promos, commandes et suivi admin",
            cloud_identity: "Identite cloud",
            saved_yes: "Sauvegarde",
            saved_no: "Non sauvegarde",
            contact_whatsapp: "WhatsApp",
            contact_call: "Appel",
            contact_sms: "SMS",
            cart_eta: "Livraison",
            cart_ready: "PRET",
            cart_split: "SEPARER",
            cart_rec_empty: "Ajoutez des produits pour afficher l'analyse intelligente.",
            cart_rec_ready: "Panier equilibre et pret a etre envoye comme une seule commande.",
            cart_rec_risk: "Certains articles demandent plus de prudence. Il vaut mieux separer ou verifier.",
            cart_rec_eta: "Les delais sont tres differents. Separer la commande peut etre plus pratique.",
            cart_rec_large: "Panier assez grand. Verifiez bien tailles et options avant validation.",
            bundle_default: "Bundle intelligent",
            bundle_note_low: "Ajoutez plus d'articles pour mieux optimiser le bundle.",
            bundle_note_hot: "Ce bundle peut reduire une partie des frais et du service.",
            safety_ban: "Interdit 100%",
            safety_license: "Licence possible",
            safety_before: "Avant de commander",
            safety_docs: "Documents utiles",
            safety_notice: "Note importante",
            remove: "Supprimer",
            total: "Total",
            shipping_free: "Livraison gratuite",
            reviews_na: "Indispo",
            rating_na: "Indispo"
        },
        en: {
            preview_ready: "Tunisia Ready",
            preview_review: "Review Before Checkout",
            preview_no_desc: "A clear description is not available yet, but the product name and image are ready.",
            stat_shipping: "Tunisia Shipping",
            stat_delivery: "Delivery ETA",
            stat_rating: "Rating",
            stat_reviews: "Reviews",
            action_open: "Open Original Product",
            action_alert: "Price Alert",
            action_share: "Share Referral",
            trust_title: "Seller Trust Score",
            trust_desc: "Quick view based on rating, reviews, shipping, and customs risk",
            variant_title: "Options Note",
            variant_desc: "If the product has color, size, or length choices, write the option in specs because the price may change",
            variant_auto: "SPEC",
            quote_pdf: "PDF / Quote",
            export_csv: "Export CSV",
            account_overview: "Overview",
            account_overview_desc: "Quick account and activity summary",
            account_contact: "Contact & Preferences",
            account_contact_desc: "Saved customer details and preferred contact method",
            account_admin: "Admin Studio",
            account_admin_desc: "Promos, orders, and admin controls",
            cloud_identity: "Cloud Identity",
            saved_yes: "Saved",
            saved_no: "Not saved",
            contact_whatsapp: "WhatsApp",
            contact_call: "Call",
            contact_sms: "SMS",
            cart_eta: "ETA",
            cart_ready: "READY",
            cart_split: "SPLIT",
            cart_rec_empty: "Add products to see smart cart analysis.",
            cart_rec_ready: "This cart looks balanced and ready to send as one order.",
            cart_rec_risk: "Some items need extra customs care. Splitting or manual review is safer.",
            cart_rec_eta: "Delivery windows are far apart. Splitting the order may be cleaner.",
            cart_rec_large: "This is a large cart. Double-check sizes and options before sending it.",
            bundle_default: "Smart Bundle",
            bundle_note_low: "Add more products to improve the bundle suggestion.",
            bundle_note_hot: "This bundle can save part of the fees and service cost.",
            safety_ban: "100% Prohibited",
            safety_license: "May Need License",
            safety_before: "Before You Order",
            safety_docs: "Helpful Documents",
            safety_notice: "Important Note",
            remove: "Remove",
            total: "Total",
            shipping_free: "Free Shipping",
            reviews_na: "N/A",
            rating_na: "N/A"
        }
    };

    function currentUiLanguage() {
        const lang = window.localStorage.getItem("alexpress_lang") || "ar";
        return RUNTIME_TRANSLATIONS[lang] ? lang : "ar";
    }

    function rt(key, lang = currentUiLanguage()) {
        return RUNTIME_TRANSLATIONS[lang]?.[key] || RUNTIME_TRANSLATIONS.ar[key] || key;
    }

    function applyLanguageMeta(lang) {
        const rtl = lang === "ar";
        document.documentElement.lang = lang;
        document.documentElement.dir = rtl ? "rtl" : "ltr";
        document.body.classList.toggle("tracking-tight", rtl);
        document.body.classList.toggle("tracking-[0.01em]", !rtl);
        if (dom.langSwitch && dom.langSwitch.value !== lang) dom.langSwitch.value = lang;
        const guideBtn = document.querySelector('.sticky-mobile-bar button[onclick*="guide"]');
        const cartBtn = document.querySelector('.sticky-mobile-bar button[onclick*="cart"]');
        const waBtn = document.querySelector('.sticky-mobile-bar a[href*="wa.me"]');
        if (guideBtn) guideBtn.textContent = rtl ? "الحاسبة" : (lang === "fr" ? "Calcul" : "Calculator");
        if (cartBtn) cartBtn.textContent = rtl ? "السلة" : (lang === "fr" ? "Panier" : "Cart");
        if (waBtn) waBtn.textContent = rtl ? "واتساب" : "WhatsApp";
        const options = dom.langSwitch?.querySelectorAll("option") || [];
        if (options[0]) options[0].textContent = "TN AR";
        if (options[1]) options[1].textContent = "FR";
        if (options[2]) options[2].textContent = "EN";
    }

    function applyUiTranslations(lang) {
        const dict = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.ar;
        document.title = dict.page_title || document.title;
        document.querySelectorAll("[data-i18n]").forEach((element) => {
            const key = element.getAttribute("data-i18n");
            if (!key || !dict[key]) return;
            element.textContent = dict[key];
        });
        document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
            const key = element.getAttribute("data-i18n-placeholder");
            if (!key || !dict[key]) return;
            element.placeholder = dict[key];
        });
    }

    function applyRuntimeTranslations(lang) {
        const setText = (selector, value) => {
            const element = document.querySelector(selector);
            if (element) element.textContent = value;
        };
        const setMany = (selector, index, value) => {
            const elements = document.querySelectorAll(selector);
            if (elements[index]) elements[index].textContent = value;
        };

        setMany("#runtime-preview-card .runtime-preview-stat-label", 0, rt("stat_shipping", lang));
        setMany("#runtime-preview-card .runtime-preview-stat-label", 1, rt("stat_delivery", lang));
        setMany("#runtime-preview-card .runtime-preview-stat-label", 2, rt("stat_rating", lang));
        setMany("#runtime-preview-card .runtime-preview-stat-label", 3, rt("stat_reviews", lang));
        setText("#runtime-preview-link span", rt("action_open", lang));
        setText("#runtime-create-alert", rt("action_alert", lang));
        setText("#runtime-copy-referral-share", rt("action_share", lang));
        setText("#runtime-trust-card .text-[10px].font-black.text-white", rt("trust_title", lang));
        setText("#runtime-trust-card .text-[9px].text-slate-500.font-bold", rt("trust_desc", lang));
        setText("#runtime-variants-card .text-[10px].font-black.text-white", rt("variant_title", lang));
        setText("#runtime-variants-card .text-[9px].text-slate-500.font-bold", rt("variant_desc", lang));
        setText("#runtime-variants-card span.px-3.py-1.rounded-full", rt("variant_auto", lang));
        setText("#runtime-download-quote", rt("quote_pdf", lang));
        setText("#runtime-export-csv", rt("export_csv", lang));
        setText("#section-account details[data-account-panel='overview'] .text-sm.font-black.text-white", rt("account_overview", lang));
        setText("#section-account details[data-account-panel='overview'] .text-[11px].text-slate-500.font-bold", rt("account_overview_desc", lang));
        setText("#section-account details[data-account-panel='prefs'] .text-sm.font-black.text-white", rt("account_contact", lang));
        setText("#section-account details[data-account-panel='prefs'] .text-[11px].text-slate-500.font-bold", rt("account_contact_desc", lang));
        setText("#section-account details[data-account-panel='admin'] .text-sm.font-black.text-white", rt("account_admin", lang));
        setText("#section-account details[data-account-panel='admin'] .text-[11px].text-slate-500.font-bold", rt("account_admin_desc", lang));
        setText("#section-check .grid.grid-cols-1.md\\:grid-cols-3.gap-4.mt-8 .text-\\[10px\\].font-black.text-red-300.uppercase.tracking-\\[0\\.25em\\].mb-3", rt("safety_ban", lang));
        setText("#section-check .grid.grid-cols-1.md\\:grid-cols-3.gap-4.mt-8 .text-\\[10px\\].font-black.text-amber-300.uppercase.tracking-\\[0\\.25em\\].mb-3", rt("safety_license", lang));
        setText("#section-check .grid.grid-cols-1.md\\:grid-cols-3.gap-4.mt-8 .text-\\[10px\\].font-black.text-emerald-300.uppercase.tracking-\\[0\\.25em\\].mb-3", rt("safety_before", lang));
        setMany("#section-check .mt-6.grid.grid-cols-1.md\\:grid-cols-2.gap-4 .text-\\[10px\\].font-black.text-white.uppercase.tracking-\\[0\\.2em\\].mb-3", 0, rt("safety_docs", lang));
        setMany("#section-check .mt-6.grid.grid-cols-1.md\\:grid-cols-2.gap-4 .text-\\[10px\\].font-black.text-white.uppercase.tracking-\\[0\\.2em\\].mb-3", 1, rt("safety_notice", lang));

        const contactOptions = dom.accountContactMethod?.querySelectorAll("option") || [];
        if (contactOptions[0]) contactOptions[0].textContent = rt("contact_whatsapp", lang);
        if (contactOptions[1]) contactOptions[1].textContent = rt("contact_call", lang);
        if (contactOptions[2]) contactOptions[2].textContent = rt("contact_sms", lang);
    }

    function applyLanguage(lang = "ar") {
        const safeLang = UI_TRANSLATIONS[lang] ? lang : "ar";
        window.localStorage.setItem("alexpress_lang", safeLang);
        applyLanguageMeta(safeLang);
        applyUiTranslations(safeLang);
        applyRuntimeTranslations(safeLang);
        if (dom.previewMeta && dom.previewMeta.textContent === "Product Summary") {
            dom.previewMeta.textContent = safeLang === "ar" ? "ملخص المنتج" : (safeLang === "fr" ? "Resume produit" : "Product Summary");
        }
        if (typeof window.renderCart === "function") window.renderCart();
        if (typeof window.renderHistory === "function") window.renderHistory();
        renderNotifications();
        renderSavedPacks();
        renderBundleDeals();
        renderCartInsights();
        if (state.currentProduct) renderPreview(state.currentProduct);
    }

    function clearImagePreview() {
        if (dom.calcImage) dom.calcImage.value = "";
        renderImagePreview("");
    }

    function loadAccountPrefsIntoForm() {
        const prefs = getAccountPrefs();
        if (dom.accountPhone) dom.accountPhone.value = prefs.phone || "";
        if (dom.accountCity) dom.accountCity.value = prefs.city || "";
        if (dom.accountAddress) dom.accountAddress.value = prefs.address || "";
        if (dom.accountContactMethod) dom.accountContactMethod.value = prefs.contactMethod || "whatsapp";
        if (dom.accountPrefsStatus) {
            const hasPrefs = Boolean(prefs.phone || prefs.city || prefs.address);
            dom.accountPrefsStatus.textContent = hasPrefs ? rt("saved_yes") : rt("saved_no");
            dom.accountPrefsStatus.className = `text-[9px] font-black ${hasPrefs ? "text-emerald-400" : "text-slate-500"}`;
        }
    }

    function saveAccountPrefs() {
        const prefs = {
            phone: dom.accountPhone?.value.trim() || "",
            city: dom.accountCity?.value.trim() || "",
            address: dom.accountAddress?.value.trim() || "",
            contactMethod: dom.accountContactMethod?.value || "whatsapp"
        };
        state.accountPrefs = prefs;
        writeJsonStorage(ACCOUNT_PREFS_KEY, prefs);
        loadAccountPrefsIntoForm();
        toast("تم حفظ بياناتك السريعة.");
    }

    function getEffectiveRate() {
        return Number(state.liveRate || FX_FALLBACK_RATE) * (1 + FX_MARKUP);
    }

    function calculatePricingData() {
        const productUsd = parseLocaleNumber(dom.usdPrice?.value || "0");
        const shippingUsd = parseLocaleNumber(dom.usdShip?.value || "0");
        const rate = getEffectiveRate();
        const productTnd = productUsd * rate;
        const shippingTnd = shippingUsd * rate;
        const subtotalUsd = productUsd + shippingUsd;
        const subtotalTnd = productTnd + shippingTnd;
        const serviceFee = subtotalTnd > 0 ? Math.max(SERVICE_FEE_MIN_TND, subtotalTnd * SERVICE_FEE_PERCENT) : 0;
        const finalTnd = subtotalTnd + serviceFee;

        return {
            productUsd,
            shippingUsd,
            productTnd,
            shippingTnd,
            subtotalUsd,
            subtotalTnd,
            serviceFee,
            finalTnd,
            rate
        };
    }

    function renderBreakdown(pricing) {
        if (!dom.breakdownCard) return;
        const hasData = pricing.productUsd > 0 || pricing.shippingUsd > 0;
        dom.breakdownCard.classList.toggle("hidden", !hasData);
        if (!hasData) return;

        if (dom.breakdownProduct) dom.breakdownProduct.textContent = formatTnd(pricing.productTnd);
        if (dom.breakdownShipping) dom.breakdownShipping.textContent = pricing.shippingUsd === 0 ? "شحن مجاني" : formatTnd(pricing.shippingTnd);
        if (dom.breakdownServiceLabel) dom.breakdownServiceLabel.textContent = "عمولة الخدمة";
        if (dom.breakdownService) dom.breakdownService.textContent = getServiceFeeDisplayText(pricing);
        if (dom.breakdownTotal) dom.breakdownTotal.textContent = formatTnd(pricing.finalTnd);
    }

    function renderBudgetPlanner(pricing) {
        if (dom.budgetCard) dom.budgetCard.classList.add("hidden");
        return;
        if (!dom.budgetCard || !dom.budgetInput || !dom.budgetBuffer || !dom.budgetStatus || !dom.budgetRemaining || !dom.budgetSafeTotal || !dom.budgetMaxUsd || !dom.budgetNote) {
            return;
        }

        const prefs = getBudgetPrefs();
        if (document.activeElement !== dom.budgetInput && prefs.budget && !dom.budgetInput.value) {
            dom.budgetInput.value = prefs.budget;
        }
        if (prefs.buffer && dom.budgetBuffer.value !== prefs.buffer) {
            dom.budgetBuffer.value = prefs.buffer;
        }

        const budget = Number.parseFloat(dom.budgetInput.value || prefs.budget || "0") || 0;
        const buffer = Number.parseFloat(dom.budgetBuffer.value || prefs.buffer || "10") || 0;
        const hasBudget = budget > 0;
        const hasPricing = pricing.productUsd > 0 || pricing.shippingUsd > 0;

        dom.budgetCard.classList.toggle("hidden", !hasBudget && !hasPricing);
        if (!hasBudget && !hasPricing) return;

        const safeSpend = Math.max(0, budget * (1 - (buffer / 100)));
        const remaining = budget - pricing.finalTnd;
        const subtotalThreshold = SERVICE_FEE_MIN_TND / SERVICE_FEE_PERCENT;
        const safeSubtotalTnd = safeSpend >= subtotalThreshold * (1 + SERVICE_FEE_PERCENT)
            ? safeSpend / (1 + SERVICE_FEE_PERCENT)
            : Math.max(0, safeSpend - SERVICE_FEE_MIN_TND);
        const maxProductUsd = Math.max(0, (safeSubtotalTnd / Math.max(pricing.rate || getEffectiveRate(), 0.0001)) - pricing.shippingUsd);

        let statusText = "READY";
        let statusClasses = "px-3 py-1 rounded-full text-[10px] font-black bg-slate-500/10 text-slate-200";
        let note = "أدخل budget باش تشوف التوصية الذكية.";

        if (!hasBudget) {
            note = "المنتج محضر. زيد budget بالدينار باش نوريولك margin الأمان.";
        } else if (!hasPricing) {
            note = `عندك safe spend حتى ${formatTnd(safeSpend)} بعد buffer ${buffer}%. كمل السعر والشحن باش نقارنوهم بالميزانية.`;
        } else if (pricing.finalTnd <= safeSpend) {
            statusText = "SAFE";
            statusClasses = "px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-300";
            note = `المنتج داخل الـ safe zone. يبقالك ${formatTnd(Math.max(0, remaining))} من budget الكلي.`;
        } else if (pricing.finalTnd <= budget) {
            statusText = "TIGHT";
            statusClasses = "px-3 py-1 rounded-full text-[10px] font-black bg-amber-400/10 text-amber-300";
            note = `المنتج داخل budget، أما buffer الأمان تقريبًا تستهلك. max product price المقترح هو ${maxProductUsd.toFixed(2)} USD مع نفس الشحن.`;
        } else {
            statusText = "OVER";
            statusClasses = "px-3 py-1 rounded-full text-[10px] font-black bg-red-500/10 text-red-300";
            note = `المنتج فوق budget بحوالي ${formatTnd(Math.abs(remaining))}. جرّب تنقص سعر المنتج، تبدل الشحن، أو اطلب manual quote.`;
        }

        dom.budgetStatus.textContent = statusText;
        dom.budgetStatus.className = statusClasses;
        dom.budgetRemaining.textContent = hasBudget && hasPricing ? formatTnd(remaining) : formatTnd(0);
        dom.budgetRemaining.className = `text-lg font-black ${remaining < 0 ? "text-red-300" : "text-white"}`;
        dom.budgetSafeTotal.textContent = formatTnd(safeSpend);
        dom.budgetMaxUsd.textContent = `${maxProductUsd.toFixed(2)} USD`;
        dom.budgetNote.textContent = note;
    }

    function getCartInsights() {
        const items = typeof cart !== "undefined" && Array.isArray(cart) ? cart : [];
        const deliveryWindows = items
            .map((item) => parseDeliveryWindow(item.deliveryEstimate))
            .filter(Boolean);
        const freeShipping = items.filter((item) => Number(item.shippingUsd || 0) === 0).length;
        const riskyItems = items.filter((item) => item?.restrictions?.banned || item?.restrictions?.restricted).length;
        const totalUnits = items.reduce((sum, item) => sum + Number(item.qty || 1), 0);
        const totalService = items.reduce((sum, item) => sum + (Number(item.serviceFeeTnd || 0) * Number(item.qty || 1)), 0);
        const etaMin = deliveryWindows.length ? Math.min(...deliveryWindows.map((window) => window.min)) : null;
        const etaMax = deliveryWindows.length ? Math.max(...deliveryWindows.map((window) => window.max)) : null;
        const mixedEta = etaMin != null && etaMax != null && (etaMax - etaMin >= 10);
        const splitRecommended = riskyItems > 0 || mixedEta;

        let recommendation = rt("cart_rec_ready");
        if (riskyItems > 0) {
            recommendation = rt("cart_rec_risk");
        } else if (mixedEta) {
            recommendation = rt("cart_rec_eta");
        } else if (totalUnits >= 6) {
            recommendation = rt("cart_rec_large");
        }

        return {
            totalUnits,
            totalService,
            freeShipping,
            riskyItems,
            etaLabel: etaMin != null && etaMax != null ? `${etaMin}-${etaMax} days` : "--",
            splitRecommended,
            recommendation
        };
    }

    function renderCartInsights() {
        if (!dom.cartInsightsCard || !dom.cartHealth || !dom.cartUnits || !dom.cartService || !dom.cartFreeShip || !dom.cartRisk || !dom.cartEta || !dom.cartRecommendation) {
            return;
        }

        const items = typeof cart !== "undefined" && Array.isArray(cart) ? cart : [];
        const hasItems = items.length > 0;
        dom.cartInsightsCard.classList.toggle("hidden", !hasItems);
        if (!hasItems) return;

        const insights = getCartInsights();
        dom.cartUnits.textContent = String(insights.totalUnits);
        dom.cartService.textContent = formatTnd(insights.totalService);
        dom.cartFreeShip.textContent = String(insights.freeShipping);
        dom.cartRisk.textContent = String(insights.riskyItems);
        dom.cartEta.textContent = `${rt("cart_eta")}: ${insights.etaLabel}`;
        dom.cartRecommendation.textContent = insights.recommendation;
        dom.cartHealth.textContent = insights.splitRecommended ? rt("cart_split") : rt("cart_ready");
        dom.cartHealth.className = `px-3 py-1 rounded-full text-[10px] font-black ${
            insights.splitRecommended ? "bg-amber-400/10 text-amber-300" : "bg-emerald-500/10 text-emerald-300"
        }`;
    }

    function formatCompactCount(value) {
        const count = Number(value || 0);
        if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
        if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
        return String(count);
    }

    function buildDisplayProductTitle(title) {
        const raw = String(title || "").replace(/\s+/g, " ").trim();
        if (!raw) return "AliExpress Product";
        const words = raw.split(" ");
        if (raw.length <= 58 && words.length <= 8) return raw;

        const stopWords = new Set(["for", "with", "and", "the", "a", "an", "of", "to", "in", "on", "wholesale"]);
        const picked = [];
        const seen = new Set();

        for (const word of words) {
            const clean = word.replace(/[^\w-]/g, "");
            const key = clean.toLowerCase();
            if (!clean) continue;
            if (picked.length >= 7) break;
            if (seen.has(key) && !stopWords.has(key)) continue;
            picked.push(word);
            seen.add(key);
        }

        const compact = picked.join(" ").trim().slice(0, 54).trim();
        return compact.length && compact.length < raw.length ? `${compact}...` : raw;
    }

    function renderSellerTrust(product) {
        if (!dom.trustCard || !dom.trustBadge || !dom.trustRating || !dom.trustReviews || !dom.trustSold || !dom.trustNote) return;
        if (!product || (Number(product.rating || 0) <= 0 && Number(product.reviewCount || 0) <= 0 && Number(product.soldCount || 0) <= 0)) {
            dom.trustCard.classList.add("hidden");
            return;
        }

        const trust = product.trustScore || { score: 60, label: rt("trust_desc") };
        dom.trustCard.classList.remove("hidden");
        dom.trustBadge.dir = "ltr";
        dom.trustBadge.textContent = `${trust.score} / 100`;
        dom.trustBadge.className = `px-3 py-1 rounded-full text-[10px] font-black ${
            trust.score >= 80 ? "bg-emerald-500/10 text-emerald-300" :
            trust.score >= 65 ? "bg-blue-500/10 text-blue-300" :
            "bg-amber-400/10 text-amber-300"
        }`;
        dom.trustRating.textContent = Number(product.rating || 0).toFixed(1);
        dom.trustReviews.textContent = formatCompactCount(product.reviewCount || 0);
        dom.trustSold.textContent = formatCompactCount(product.soldCount || 0);
        dom.trustNote.textContent = product.restrictions?.banned
            ? `${rt("trust_title")}: ${trust.label}. ${rt("cart_rec_risk")}`
            : (product.restrictions?.restricted
                ? `${rt("trust_title")}: ${trust.label}. ${rt("safety_license")}`
                : `${rt("trust_title")}: ${trust.label}.`);
    }

    function renderVariants(product) {
        if (!dom.variantsCard || !dom.variantGroups) return;
        const groups = Array.isArray(product?.variants) ? product.variants.filter((group) => Array.isArray(group.values) && group.values.length) : [];
        dom.variantsCard.classList.toggle("hidden", groups.length === 0);
        if (!groups.length) {
            state.selectedVariants = {};
            if (dom.previewVariantSummary) dom.previewVariantSummary.classList.add("hidden");
            renderVariantSummary();
            return;
        }

        dom.variantGroups.innerHTML = `
            <div class="rounded-2xl border border-fuchsia-400/15 bg-black/20 p-4 space-y-3">
                <div class="text-[10px] text-fuchsia-100 font-black leading-relaxed">
                    السعر ينجم يتبدل إذا تختار لون أو مقاس أو طول مختلف. اكتب الخيار المطلوب في خانة المواصفات قبل ما تبعث الطلب.
                </div>
                <div class="text-[9px] text-slate-400 font-bold leading-relaxed">
                    المواصفات: لون، مقاس، طول، نسخة، pack...
                </div>
                <div class="space-y-2">
                    ${groups.map((group, index) => `
                        <div class="space-y-2">
                            <div class="text-[10px] font-black text-white">${escapeHtml(group.name || `Option ${index + 1}`)}</div>
                            <div class="flex flex-wrap gap-2">
                                ${group.values.map((value) => `
                                    <span class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-[9px] font-black text-slate-200">
                                        ${escapeHtml(value)}
                                    </span>
                                `).join("")}
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;
        if (dom.previewVariantSummary) dom.previewVariantSummary.classList.add("hidden");
        renderVariantSummary();
    }

    function renderCustomsAdvisor(product) {
        if (dom.customsCard) dom.customsCard.classList.add("hidden");
        return;
        if (!dom.customsCard || !dom.customsLevel || !dom.customsNote || !dom.customsDocs || !dom.customsAlt) return;
        if (!product) {
            dom.customsCard.classList.add("hidden");
            return;
        }

        const advisor = product.customsAdvisor || {};
        dom.customsCard.classList.remove("hidden");
        dom.customsLevel.textContent = String(advisor.level || "low").toUpperCase();
        dom.customsLevel.className = `px-3 py-1 rounded-full text-[10px] font-black ${
            advisor.level === "high" ? "bg-red-500/10 text-red-300" :
            advisor.level === "medium" ? "bg-amber-400/10 text-amber-300" :
            "bg-emerald-500/10 text-emerald-300"
        }`;
        dom.customsNote.textContent = advisor.note || "No customs issue detected yet.";
        dom.customsDocs.innerHTML = (Array.isArray(advisor.docs) ? advisor.docs : []).map((doc) => `
            <span class="px-3 py-1 rounded-full bg-black/20 border border-white/5 text-[9px] font-black text-slate-200">${escapeHtml(doc)}</span>
        `).join("");
        dom.customsAlt.textContent = advisor.saferAlternative || "";
    }

    function getSimilarOrderAverage(title) {
        const normalized = String(title || "").trim().toLowerCase();
        if (!normalized || typeof orderHistory === "undefined" || !Array.isArray(orderHistory)) return 0;
        const matches = orderHistory.flatMap((order) => Array.isArray(order.items) ? order.items : [])
            .filter((item) => String(item.name || "").toLowerCase().includes(normalized.slice(0, 8)) || normalized.includes(String(item.name || "").toLowerCase().slice(0, 8)))
            .map((item) => Number(item.totalWithFee || item.tnd || 0))
            .filter((value) => value > 0);
        if (!matches.length) return 0;
        return matches.reduce((sum, value) => sum + value, 0) / matches.length;
    }

    function renderQuoteComparison(product) {
        if (dom.quoteCompareCard) dom.quoteCompareCard.classList.add("hidden");
        return;
    }

    function renderResellerMode() {
        if (dom.resellerCard) dom.resellerCard.classList.add("hidden");
        return;
        if (!dom.resellerPrice || !dom.resellerQty || !dom.profitUnit || !dom.profitTotal || !dom.profitRoi || !dom.profitBreakEven || !dom.resellerStatus) return;
        const pricing = calculatePricingData();
        const resale = Number(dom.resellerPrice.value || 0);
        const qty = Math.max(1, Number(dom.resellerQty.value || 1));
        const cost = pricing.finalTnd;
        const profitUnit = resale - cost;
        const totalProfit = profitUnit * qty;
        const roi = cost > 0 ? (profitUnit / cost) * 100 : 0;

        dom.profitUnit.textContent = cost > 0 ? profitUnit.toFixed(3) : "0.000";
        dom.profitTotal.textContent = cost > 0 ? totalProfit.toFixed(3) : "0.000";
        dom.profitRoi.textContent = `${roi.toFixed(1)}%`;
        dom.profitBreakEven.textContent = cost.toFixed(3);
        dom.resellerStatus.textContent = cost <= 0 ? "READY" : (profitUnit > 0 ? "PROFIT" : "LOSS");
        dom.resellerStatus.className = `px-3 py-1 rounded-full text-[10px] font-black ${
            cost <= 0 ? "bg-slate-500/10 text-slate-200" :
            profitUnit > 0 ? "bg-emerald-500/10 text-emerald-300" :
            "bg-red-500/10 text-red-300"
        }`;
    }

    function renderBundleDeals() {
        if (!dom.bundleCard || !dom.bundleBadge || !dom.bundleSavings || !dom.bundleTitle || !dom.bundleNote) return;
        const items = typeof cart !== "undefined" && Array.isArray(cart) ? cart : [];
        dom.bundleCard.classList.toggle("hidden", items.length < 2);
        if (items.length < 2) return;

        const freeShippingCount = items.filter((item) => Number(item.shippingUsd || 0) === 0).length;
        const serviceFees = items.reduce((sum, item) => sum + Number(item.serviceFeeTnd || 0), 0);
        const estimatedSavings = (serviceFees * 0.2) + (freeShippingCount * 1.5);
        const names = items.slice(0, 2).map((item) => item.name).filter(Boolean);

        dom.bundleSavings.textContent = formatTnd(estimatedSavings);
        dom.bundleTitle.textContent = names.length ? `${names.join(" + ")}` : rt("bundle_default");
        dom.bundleBadge.textContent = estimatedSavings >= 8 ? "HOT" : rt("bundle_default");
        dom.bundleNote.textContent = estimatedSavings >= 8
            ? rt("bundle_note_hot")
            : rt("bundle_note_low");
    }

    function renderVoiceNote() {
        if (dom.voiceCard) {
            dom.voiceCard.classList.add("hidden");
            dom.voiceCard.style.display = "none";
        }
        if (!dom.voicePlayer || !dom.voiceStatus || !dom.voiceNote) return;
        const hasVoice = Boolean(state.voiceNote?.url);
        dom.voicePlayer.classList.toggle("hidden", !hasVoice);
        if (hasVoice) {
            dom.voicePlayer.src = state.voiceNote.url;
            dom.voiceStatus.textContent = "READY";
            dom.voiceStatus.className = "px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px] font-black";
            dom.voiceNote.textContent = state.voiceNote.label || "Voice note attached.";
        } else {
            dom.voicePlayer.removeAttribute("src");
            dom.voiceStatus.textContent = "EMPTY";
            dom.voiceStatus.className = "px-3 py-1 rounded-full bg-slate-500/10 text-slate-200 text-[10px] font-black";
            dom.voiceNote.textContent = "No voice note attached yet.";
        }
    }

    function setVoiceNoteFromBlob(blob, label) {
        if (!blob) return;
        if (state.voiceNote?.url && state.voiceNote.url.startsWith("blob:")) {
            window.URL.revokeObjectURL(state.voiceNote.url);
        }
        state.voiceNote = {
            url: window.URL.createObjectURL(blob),
            label
        };
        renderVoiceNote();
        pushActivityLog("voice", "Voice note attached to current order.");
    }

    function renderPriceAlerts() {
        if (!dom.alertWatchlist || !dom.alertCount) return;
        const alerts = Array.isArray(state.priceAlerts) ? state.priceAlerts : [];
        dom.alertCount.textContent = `${alerts.length} ${alerts.length === 1 ? "watch" : "watches"}`;
        if (!alerts.length) {
            dom.alertWatchlist.innerHTML = `<div class="text-[10px] text-slate-500 italic">No alerts yet.</div>`;
            return;
        }
        dom.alertWatchlist.innerHTML = alerts.map((alert) => `
            <div class="rounded-2xl border border-white/5 bg-black/20 p-4 flex flex-wrap items-center justify-between gap-3">
                <div class="min-w-0">
                    <div class="text-[10px] font-black text-white">${escapeHtml(alert.title || "AliExpress Product")}</div>
                    <div class="text-[9px] text-slate-500 font-bold">Target ${escapeHtml(formatUsd(alert.targetPriceUsd || 0))} • ship ${escapeHtml(formatUsd(alert.targetShippingUsd || 0))}</div>
                </div>
                <button type="button" data-remove-alert="${escapeHtml(alert.url)}" class="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[9px] font-black text-red-200 hover:bg-red-500/20 transition-colors">Delete</button>
            </div>
        `).join("");
    }

    function renderReferralCard() {
        if (!dom.referralCode || !dom.referralCredits || !dom.referralTier || !dom.referralNote) return;
        const referral = getReferralState();
        dom.referralCode.textContent = referral.code;
        dom.referralCredits.textContent = String(referral.credits || 0);
        dom.referralTier.textContent = referral.credits >= 100 ? "Ambassador" : (referral.credits >= 40 ? "Booster" : "Starter");
        dom.referralNote.textContent = referral.appliedCodes?.length
            ? `Applied ${referral.appliedCodes.length} referral code(s). Credits are ready to use for future promos.`
            : "Share your code to grow your rewards balance.";
    }

    function renderAdminAnalytics() {
        if (!dom.adminAnalytics) return;
        const orders = typeof orderHistory !== "undefined" && Array.isArray(orderHistory) ? orderHistory : [];
        const analytics = state.adminAnalytics || {};
        const totalRevenue = analytics.totalRevenue != null ? analytics.totalRevenue : orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
        const topProducts = Array.isArray(analytics.topProducts) ? analytics.topProducts : [];
        const topPromos = Array.isArray(analytics.topPromos) ? analytics.topPromos : [];
        const repeatCustomers = Array.isArray(analytics.repeatCustomers) ? analytics.repeatCustomers : [];

        dom.adminAnalytics.innerHTML = `
            <div class="grid grid-cols-2 gap-3">
                <div class="rounded-2xl border border-white/5 bg-slate-900/70 p-3 text-center">
                    <div class="text-lg font-black text-white">${orders.length}</div>
                    <div class="text-[9px] text-slate-500 font-bold uppercase mt-1">Orders</div>
                </div>
                <div class="rounded-2xl border border-white/5 bg-slate-900/70 p-3 text-center">
                    <div class="text-lg font-black text-amber-300" dir="ltr">${formatTnd(totalRevenue)}</div>
                    <div class="text-[9px] text-slate-500 font-bold uppercase mt-1">Revenue</div>
                </div>
            </div>
            <div class="text-[10px] font-black text-white">Top Products</div>
            <div class="space-y-2">
                ${(topProducts.length ? topProducts : [{ name: "No product data yet", count: 0 }]).map((item) => `
                    <div class="rounded-xl border border-white/5 bg-slate-900/70 p-3 flex items-center justify-between gap-3">
                        <span class="text-[10px] text-slate-200 font-bold">${escapeHtml(item.name || item.id || "Unknown")}</span>
                        <span class="text-[9px] text-amber-300 font-black">${escapeHtml(item.count || item.ordersCount || 0)}</span>
                    </div>
                `).join("")}
            </div>
            <div class="text-[10px] font-black text-white">Promo / Repeat Clients</div>
            <div class="space-y-2">
                ${[...(topPromos.slice(0, 2)), ...(repeatCustomers.slice(0, 2))].length ? [...(topPromos.slice(0, 2)), ...(repeatCustomers.slice(0, 2))].map((item) => `
                    <div class="rounded-xl border border-white/5 bg-slate-900/70 p-3 flex items-center justify-between gap-3">
                        <span class="text-[10px] text-slate-200 font-bold">${escapeHtml(item.code || item.id || "Client")}</span>
                        <span class="text-[9px] text-blue-300 font-black">${escapeHtml(item.used || item.ordersCount || 0)}</span>
                    </div>
                `).join("") : `<div class="text-[10px] text-slate-500 italic">No analytics yet.</div>`}
            </div>
        `;
    }

    function getOrderTimelineSteps(order) {
        const status = String(order?.status || "pending");
        const steps = [
            { key: "pending", label: "Review" },
            { key: "processing", label: "Purchase" },
            { key: "shipped", label: "Transit" },
            { key: "delivered", label: "Delivered" }
        ];
        const currentIndex = steps.findIndex((step) => step.key === status);
        return steps.map((step, index) => ({
            ...step,
            active: currentIndex >= index,
            current: currentIndex === index
        }));
    }

    function renderTrackingTimeline(order) {
        if (!dom.trackTimeline) return;
        if (!order) {
            dom.trackTimeline.innerHTML = "";
            return;
        }
        dom.trackTimeline.innerHTML = getOrderTimelineSteps(order).map((step) => `
            <div class="rounded-2xl border p-3 text-center ${step.active ? "bg-amber-400/10 border-amber-400/20 text-amber-300" : "bg-white/5 border-white/5 text-slate-500"}">
                <div class="text-[9px] font-black uppercase">${escapeHtml(step.label)}</div>
                <div class="text-[8px] font-bold mt-1">${step.current ? "Current" : (step.active ? "Done" : "Next")}</div>
            </div>
        `).join("");
    }

    function renderRepeatOrders() {
        if (!dom.repeatOrders || typeof orderHistory === "undefined" || !Array.isArray(orderHistory)) return;
        const orders = orderHistory.slice(0, 3).filter((order) => Array.isArray(order.items) && order.items.length);
        dom.repeatOrders.classList.toggle("hidden", orders.length === 0);
        if (!orders.length) return;
        dom.repeatOrders.innerHTML = `
            <div class="text-[10px] font-black text-white">Repeat-Order Assistant</div>
            ${orders.map((order) => `
                <div class="rounded-2xl border border-white/5 bg-black/20 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div class="text-[10px] font-black text-white">${escapeHtml(order.orderRef || String(order.id || ""))}</div>
                        <div class="text-[9px] text-slate-500 font-bold">${escapeHtml((order.items || []).map((item) => item.name).slice(0, 2).join(" + "))}</div>
                    </div>
                    <button type="button" data-repeat-order="${escapeHtml(order.orderRef || String(order.id || ""))}" class="px-4 py-2 rounded-xl bg-blue-600 text-white text-[9px] font-black hover:bg-blue-500 transition-colors">Buy Again</button>
                </div>
            `).join("")}
        `;
    }

    function createPriceAlertFromCurrentProduct() {
        const product = state.currentProduct;
        if (!product?.url) {
            toast("Fetch a product first.");
            return;
        }
        const alerts = getPriceAlerts().filter((entry) => entry.url !== product.url);
        alerts.unshift({
            url: product.url,
            title: product.title || dom.calcName?.value.trim() || "AliExpress Product",
            targetPriceUsd: Number(product.price || dom.usdPrice?.value || 0),
            targetShippingUsd: Number(product.shipping || dom.usdShip?.value || 0),
            createdAt: new Date().toISOString()
        });
        savePriceAlerts(alerts);
        pushActivityLog("alert", `Created price alert for ${product.title || "product"}.`);
        toast("Price-drop alert saved.");
    }

    function removePriceAlert(url) {
        savePriceAlerts(getPriceAlerts().filter((entry) => entry.url !== url));
        toast("Alert removed.");
    }

    function checkPriceAlerts(product) {
        const alerts = getPriceAlerts();
        const watch = alerts.find((entry) => entry.url === product?.url);
        if (!watch) return;
        const currentPrice = Number(product.price || 0);
        const currentShipping = Number(product.shipping || 0);
        if ((currentPrice > 0 && currentPrice < Number(watch.targetPriceUsd || 0)) || currentShipping < Number(watch.targetShippingUsd || 0)) {
            toast(`Price drop detected for ${product.title || "saved alert"}!`);
            pushActivityLog("alert", `Price drop detected for ${product.title || "saved alert"}.`);
        }
    }

    function copyReferral(shareMode = false) {
        const referral = getReferralState();
        const text = shareMode
            ? `Use my Alexpress referral code: ${referral.code}`
            : referral.code;
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(() => toast("Referral copied."));
            return;
        }
        toast("Clipboard unavailable.");
    }

    function applyReferralCode() {
        const referral = getReferralState();
        const code = String(dom.referralInput?.value || "").trim().toUpperCase();
        if (!code || code === referral.code) {
            toast("Enter a valid referral code.");
            return;
        }
        if (referral.appliedCodes.includes(code)) {
            toast("This referral code is already used.");
            return;
        }
        referral.appliedCodes.push(code);
        referral.credits = Number(referral.credits || 0) + 20;
        saveReferralState(referral);
        if (dom.referralInput) dom.referralInput.value = "";
        pushActivityLog("referral", `Applied referral code ${code}.`);
        toast("Referral bonus added.");
    }

    function applyVariantSelection(group, value) {
        const current = String(dom.calcNote?.value || "").trim();
        const cleanedParts = current.split("|").map((part) => part.trim()).filter(Boolean).filter((part) => !part.toLowerCase().startsWith(String(group || "").toLowerCase()));
        cleanedParts.push(`${group}: ${value}`);
        if (dom.calcNote) dom.calcNote.value = cleanedParts.join(" | ");
        state.selectedVariants = {
            ...(state.selectedVariants || {}),
            [group]: value
        };
        if (dom.variantGroups) {
            dom.variantGroups.querySelectorAll("[data-variant-group][data-variant-value]").forEach((button) => {
                const isMatch = button.getAttribute("data-variant-group") === String(group || "") && button.getAttribute("data-variant-value") === String(value || "");
                button.classList.toggle("is-active", isMatch);
            });
        }
        renderVariantSummary();
        toast(`${group} set to ${value}`);
    }

    function renderVariantSummary() {
        if (!dom.previewVariantSummary) return;
        const selectedEntries = Object.entries(state.selectedVariants || {}).filter(([, value]) => String(value || "").trim());
        const hasSelection = selectedEntries.length > 0;
        dom.previewVariantSummary.classList.toggle("hidden", !hasSelection);
        if (!hasSelection) return;
        dom.previewVariantSummary.textContent = selectedEntries.map(([group, value]) => `${group}: ${value}`).join(" • ");
    }

    function loadOrderIntoCart(orderRef) {
        if (typeof orderHistory === "undefined" || !Array.isArray(orderHistory) || typeof cart === "undefined" || !Array.isArray(cart)) return;
        const order = orderHistory.find((entry) => String(entry.orderRef || entry.id || "") === String(orderRef || ""));
        if (!order || !Array.isArray(order.items)) return;
        cart = cloneData(order.items);
        if (typeof updateBadges === "function") updateBadges();
        if (typeof renderCart === "function") renderCart();
        if (typeof saveData === "function") saveData();
        if (typeof window.switchTab === "function") window.switchTab("cart");
        pushActivityLog("repeat", `Loaded repeat order ${orderRef}.`);
        toast("Order loaded back into cart.");
    }

    async function startVoiceRecording() {
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
            toast("Voice recording is not supported on this device.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            state.audioChunks = [];
            recorder.ondataavailable = (event) => {
                if (event.data?.size) state.audioChunks.push(event.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(state.audioChunks, { type: recorder.mimeType || "audio/webm" });
                setVoiceNoteFromBlob(blob, `Recorded voice note (${Math.max(1, Math.round(blob.size / 1024))} KB)`);
                stream.getTracks().forEach((track) => track.stop());
            };
            recorder.start();
            state.mediaRecorder = recorder;
            dom.voiceStatus.textContent = "REC";
            dom.voiceStatus.className = "px-3 py-1 rounded-full bg-red-500/10 text-red-300 text-[10px] font-black";
            dom.voiceNote.textContent = "Recording in progress...";
        } catch {
            toast("Microphone access was blocked.");
        }
    }

    function stopVoiceRecording() {
        if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") {
            state.mediaRecorder.stop();
            state.mediaRecorder = null;
        }
    }

    function renderAlerts(product) {
        if (!dom.insightsCard || !dom.alerts || !dom.deliveryEstimate || !dom.riskBadge) return;

        const alerts = Array.isArray(product?.alerts) ? product.alerts : [];
        const hasInsights = Boolean(product) || alerts.length > 0;
        dom.insightsCard.classList.toggle("hidden", !hasInsights);
        if (!hasInsights) return;

        dom.deliveryEstimate.textContent = `التوصيل: ${product?.deliveryEstimate || "غير متوفر"}`;

        const restrictionText = getRestrictionSummary(product);
        dom.riskBadge.textContent = restrictionText || "تحذير";
        dom.riskBadge.classList.toggle("hidden", !restrictionText);
        dom.riskBadge.className = `px-3 py-1 rounded-full text-[10px] font-black ${
            product?.restrictions?.banned
                ? "bg-red-500/10 text-red-300"
                : product?.restrictions?.restricted
                    ? "bg-amber-400/10 text-amber-300"
                    : "bg-emerald-500/10 text-emerald-300"
        }`;

        const renderedAlerts = [];
        if (alerts.length) {
            alerts.forEach((alert) => {
                const tone =
                    alert.level === "danger"
                        ? "border-red-500/30 bg-red-500/10 text-red-200"
                        : alert.level === "warning"
                            ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
                            : "border-blue-500/30 bg-blue-500/10 text-blue-100";
                renderedAlerts.push(`
                    <div class="rounded-2xl border ${tone} p-3 text-[10px] md:text-xs font-bold leading-relaxed">
                        ${escapeHtml(alert.text)}
                    </div>
                `);
            });
        } else {
            renderedAlerts.push(`
                <div class="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[10px] md:text-xs font-bold text-emerald-100 leading-relaxed">
                    المنتج ظاهر مبدئيًا مقبول للطلب، وإذا تحب نراجعولك التفاصيل يدويًا إحنا موجودين.
                </div>
            `);
        }

        dom.alerts.innerHTML = renderedAlerts.join("");
    }

    function renderRestrictionBanner(product) {
        if (!dom.bannedError || !dom.bannedErrorText) return;
        if (!product?.restrictions?.banned && !product?.restrictions?.restricted) {
            dom.bannedError.classList.add("hidden");
            return;
        }

        const text = product.restrictions.banned
            ? "عذراً، المنتج هذا عندو خطر حجز كبير في تونس. اطلب تسعيرة يدوية قبل التأكيد."
            : "ملاحظة: المنتج هذا ينجم يحتاج مراجعة أو تصريح قبل ما نكملوه.";
        dom.bannedErrorText.textContent = text;
        dom.bannedError.classList.remove("hidden");
    }

    function renderPricing() {
        const pricing = calculatePricingData();

        if (dom.tndResult) {
            dom.tndResult.innerHTML = `${pricing.finalTnd.toFixed(3)} <span class="text-base md:text-xl text-amber-400/50">TND</span>`;
        }
        if (dom.rateBadge) {
            dom.rateBadge.textContent = pricing.subtotalUsd > 0 ? `Rate: ${pricing.rate.toFixed(3)}` : "--";
        }
        if (dom.liveRateDisplay) {
            dom.liveRateDisplay.textContent = `1 USD ≈ ${pricing.rate.toFixed(3)} TND`;
        }
        if (dom.previewPrice) {
            dom.previewPrice.textContent = state.currentProduct?.priceUnavailable ? "Manual Quote" : formatTnd(pricing.finalTnd);
            dom.previewPrice.classList.toggle("hidden", pricing.finalTnd <= 0 && !state.currentProduct?.priceUnavailable);
        }
        if (dom.quickOrderBtn) {
            dom.quickOrderBtn.disabled = pricing.finalTnd <= 0;
            dom.quickOrderBtn.classList.toggle("opacity-60", pricing.finalTnd <= 0);
            dom.quickOrderBtn.classList.toggle("cursor-not-allowed", pricing.finalTnd <= 0);
        }

        renderBreakdown(pricing);
        renderBudgetPlanner(pricing);
        renderQuoteComparison(state.currentProduct);
        renderResellerMode();
        return pricing;
    }

    function renderPreview(product, options = {}) {
        const resetSelection = Boolean(options.resetSelection);
        if (resetSelection) {
            state.baseProduct = cloneData(product);
            state.selectedVariants = {};
            state.activeVariantOffer = null;
        }
        state.currentProduct = product;
        updateSpecsGuidance(getBaseProduct() || product);
        if (!dom.previewCard) return;
        const previewDescriptionNode = ensurePreviewDescriptionNode();
        const currentLang = currentUiLanguage();

        const pricing = calculatePricingData();
        const sourceKey = String(product?.source || "scrape").toLowerCase();
        const hasShippingValue = product?.shipping != null && product.shipping !== "" && Number.isFinite(Number(product.shipping));
        const hasDeliveryValue = Boolean(String(product?.deliveryEstimate || "").trim());
        const hasRatingValue = Number(product?.rating || 0) > 0;
        const hasReviewValue = Number(product?.reviewCount || 0) > 0;
        const sourceLabelMap = {
            ar: {
                "api+scrape": "بيانات مؤكدة",
                "scrape": "جلب مباشر",
                "partial-fallback": "بيانات جزئية",
                "api-fallback": "بيانات الكاتالوج"
            },
            fr: {
                "api+scrape": "Donnees verifiees",
                "scrape": "Capture live",
                "partial-fallback": "Donnees partielles",
                "api-fallback": "Catalogue"
            },
            en: {
                "api+scrape": "Verified Data",
                "scrape": "Live Capture",
                "partial-fallback": "Partial Data",
                "api-fallback": "Catalog Data"
            }
        };
        const sourceUiMap = {
            "api+scrape": { label: sourceLabelMap[currentLang]["api+scrape"], classes: "runtime-preview-chip bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
            "scrape": { label: sourceLabelMap[currentLang]["scrape"], classes: "runtime-preview-chip bg-sky-500/10 text-sky-300 border-sky-500/20" },
            "partial-fallback": { label: sourceLabelMap[currentLang]["partial-fallback"], classes: "runtime-preview-chip bg-amber-400/10 text-amber-300 border-amber-400/20" },
            "api-fallback": { label: sourceLabelMap[currentLang]["api-fallback"], classes: "runtime-preview-chip bg-violet-500/10 text-violet-200 border-violet-500/20" }
        };
        const sourceUi = sourceUiMap[sourceKey] || {
            label: String(product?.source || "scrape").replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
            classes: "runtime-preview-chip bg-white/5 text-slate-200 border-white/10"
        };
        const metaLabel = product?.manualQuoteRecommended
            ? rt("preview_review")
            : rt("preview_ready");

        dom.previewCard.classList.remove("hidden");
        if (dom.previewImage) {
            dom.previewImage.src = product.image || "https://placehold.co/120x120/0f172a/f8fafc?text=AX";
        }
        if (dom.previewTitle) {
            const fullTitle = product.title || "AliExpress Product";
            dom.previewTitle.textContent = buildDisplayProductTitle(fullTitle);
            dom.previewTitle.title = fullTitle;
        }
        if (dom.previewMeta) {
            dom.previewMeta.textContent = metaLabel;
            dom.previewMeta.className = `runtime-preview-chip ${
                product?.manualQuoteRecommended
                    ? "bg-amber-400/10 text-amber-300 border-amber-400/20"
                    : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
            }`;
        }
        if (dom.previewPrice) {
            dom.previewPrice.textContent = product?.priceUnavailable ? "Manual Quote" : formatTnd(pricing.finalTnd);
            dom.previewPrice.classList.toggle("hidden", pricing.finalTnd <= 0 && !product?.priceUnavailable);
        }
        if (dom.previewLink) {
            dom.previewLink.href = product.url || "#";
        }
        if (dom.previewSource) {
            dom.previewSource.textContent = sourceUi.label;
            dom.previewSource.className = sourceUi.classes;
        }
        if (dom.previewShipping) {
            dom.previewShipping.textContent = hasShippingValue
                ? (Number(product.shipping) === 0 ? rt("shipping_free") : getShippingLabel(product.shipping))
                : rt("reviews_na");
        }
        if (dom.previewDelivery) {
            dom.previewDelivery.textContent = hasDeliveryValue ? product.deliveryEstimate : rt("reviews_na");
        }
        if (dom.previewRating) {
            dom.previewRating.textContent = hasRatingValue ? Number(product.rating || 0).toFixed(1) : rt("rating_na");
        }
        if (dom.previewReviews) {
            dom.previewReviews.textContent = hasReviewValue ? formatCompactCount(product.reviewCount || 0) : rt("reviews_na");
        }
        if (previewDescriptionNode) {
            previewDescriptionNode.textContent = product.description || rt("preview_no_desc");
            previewDescriptionNode.title = product.description || rt("preview_no_desc");
        }
        renderVariantSummary();

        renderAlerts(product);
        renderRestrictionBanner(product);
        renderSellerTrust(product);
        renderVariants(getBaseProduct() || product);
        renderCustomsAdvisor(product);
        renderQuoteComparison(product);
        checkPriceAlerts(product);
    }

    function setError(message = "") {
        if (!dom.scrapeError) return;
        dom.scrapeError.textContent = message;
        dom.scrapeError.classList.toggle("hidden", !message);
    }

    function setLoading(isLoading) {
        if (dom.scrapeBtn) {
            dom.scrapeBtn.disabled = isLoading;
            dom.scrapeBtn.classList.toggle("opacity-70", isLoading);
            dom.scrapeBtn.classList.toggle("cursor-not-allowed", isLoading);
        }
        if (dom.scrapeLoader) {
            dom.scrapeLoader.classList.toggle("hidden", !isLoading);
        }
    }

    async function loadLiveRate() {
        state.liveRate = FX_FALLBACK_RATE;
        if (dom.liveRateDisplay) {
            dom.liveRateDisplay.textContent = `1 USD ≈ ${FX_FALLBACK_RATE.toFixed(3)} TND`;
        }
        if (dom.rateBadge) {
            dom.rateBadge.textContent = `Rate: ${FX_FALLBACK_RATE.toFixed(3)}`;
        }
        renderPricing();
        renderAccountStats();
    }

    async function scrapeProduct() {
        const url = dom.calcLink?.value.trim() || "";
        if (!isAliExpressUrl(url)) {
            const message = "يرجى إدخال رابط AliExpress صحيح";
            setError(message);
            toast(message);
            return;
        }

        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/product?url=${encodeURIComponent(url)}`);
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
                throw new Error(data.error || "فشل الجلب التلقائي، حاول مرة أخرى");
            }

            state.baseProduct = cloneData(data);
            state.currentProduct = cloneData(data);
            state.activeVariantOffer = null;
            incrementStat("fetches");
            syncProductInputs(state.currentProduct);
            renderPreview(state.currentProduct, { resetSelection: true });
            renderPricing();
            saveRecentLink(data);
            pushActivityLog("fetch", data.title ? `Fetched ${data.title}` : "Fetched AliExpress product data.");
            if (data.priceUnavailable) {
                setError("السعر exact موش متوفر توّا. استعمل التسعيرة اليدوية أو ابعث الرابط على واتساب.");
                toast("لقينا المنتج، أما السعر exact يحتاج مراجعة يدوية.");
            } else {
                toast(data.manualQuoteRecommended ? "تم الجلب. ننصحك بمراجعة يدوية قبل التأكيد." : "تم جلب البيانات بنجاح!");
            }
        } catch (error) {
            const message = error.message || "خطأ في الاتصال بسيرفر الجلب";
            setError(message);
            toast(message);
        } finally {
            setLoading(false);
        }
    }

    function buildCustomerSummaryLines() {
        const prefs = getAccountPrefs();
        const lines = [];
        if (prefs.phone) lines.push(`الهاتف: ${prefs.phone}`);
        if (prefs.city) lines.push(`المدينة: ${prefs.city}`);
        if (prefs.address) lines.push(`العنوان: ${prefs.address}`);
        if (prefs.contactMethod) lines.push(`طريقة التواصل: ${prefs.contactMethod}`);
        return lines;
    }

    function buildManualQuoteMessage() {
        const pricing = calculatePricingData();
        const link = dom.calcLink?.value.trim() || state.currentProduct?.url || "";
        const title = dom.calcName?.value.trim() || state.currentProduct?.title || "منتج من AliExpress";
        const note = getSpecsValueText(state.currentProduct);
        const restrictions = getRestrictionSummary(state.currentProduct);

        return [
            "سلام، نحب تسعيرة يدوية للمنتج هذا:",
            `المنتج: ${title}`,
            `الرابط: ${link || "غير متوفر"}`,
            `السعر: ${formatUsd(pricing.productUsd)}`,
            `الشحن: ${pricing.shippingUsd === 0 ? "شحن مجاني" : formatUsd(pricing.shippingUsd)}`,
            `عمولة الخدمة: ${getServiceFeeDisplayText(pricing, state.currentProduct)}`,
            `الإجمالي النهائي: ${formatTnd(pricing.finalTnd)}`,
            `المواصفات: ${note}`,
            restrictions ? `ملاحظة: ${restrictions}` : ""
        ].filter(Boolean).join("\n");
    }

    function openWhatsAppMessage(message) {
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    }

    function sendManualQuote() {
        const link = dom.calcLink?.value.trim() || "";
        if (!link && !dom.calcName?.value.trim()) {
            toast("حط الرابط أو اسم المنتج أولاً");
            return;
        }
        incrementStat("manualQuotes");
        saveRecentLink(state.currentProduct || { url: link, title: dom.calcName?.value.trim() || "AliExpress product" });
        pushActivityLog("quote", "Prepared a manual quote request.");
        openWhatsAppMessage([buildManualQuoteMessage()].concat(buildCustomerSummaryLines()).join("\n"));
    }

    function quickOrderFromForm() {
        const pricing = calculatePricingData();
        if (pricing.finalTnd <= 0) {
            toast("كمّل بيانات المنتج أولاً");
            return;
        }

        const title = dom.calcName?.value.trim() || state.currentProduct?.title || "منتج من AliExpress";
        const note = getSpecsValueText(state.currentProduct);
        const link = dom.calcLink?.value.trim() || state.currentProduct?.url || "";
        const delivery = state.currentProduct?.deliveryEstimate || "غير متوفر";
        const shippingText = pricing.shippingUsd === 0 ? "شحن مجاني" : formatUsd(pricing.shippingUsd);

        const message = [
            "سلام، نحب نطلب المنتج هذا:",
            `المنتج: ${title}`,
            `الرابط: ${link || "غير متوفر"}`,
            `سعر المنتج: ${formatUsd(pricing.productUsd)}`,
            `الشحن: ${shippingText}`,
            `عمولة الخدمة: ${getServiceFeeDisplayText(pricing, state.currentProduct)}`,
            `الإجمالي النهائي: ${formatTnd(pricing.finalTnd)}`,
            `التوصيل المتوقع: ${delivery}`,
            `المواصفات: ${note}`
        ].join("\n");

        saveRecentLink(state.currentProduct || { url: link, title });
        pushActivityLog("quick-order", `Prepared quick order for ${title}.`);
        openWhatsAppMessage([message].concat(buildCustomerSummaryLines()).join("\n"));
    }

    function renderSavedPacks() {
        if (!dom.savedPacks || !dom.packCount || !dom.savePackBtn) return;
        const packs = Array.isArray(state.savedPacks) ? state.savedPacks : [];
        dom.packCount.textContent = `${packs.length} ${packs.length === 1 ? "pack" : "packs"}`;

        const cartItems = typeof cart !== "undefined" && Array.isArray(cart) ? cart : [];
        dom.savePackBtn.disabled = cartItems.length === 0;
        dom.savePackBtn.classList.toggle("opacity-60", cartItems.length === 0);
        dom.savePackBtn.classList.toggle("cursor-not-allowed", cartItems.length === 0);

        if (!packs.length) {
            dom.savedPacks.innerHTML = `<div class="text-[10px] text-slate-500 italic">No saved packs yet.</div>`;
            return;
        }

        dom.savedPacks.innerHTML = packs.map((pack) => `
            <div class="rounded-2xl border border-white/5 bg-black/20 p-4 space-y-3">
                <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="min-w-0">
                        <div class="text-[11px] font-black text-white">${escapeHtml(pack.name || "Saved Pack")}</div>
                        <div class="text-[9px] text-slate-500 font-bold">${escapeHtml(pack.itemCount || 0)} items • ${escapeHtml(formatTnd(pack.total || 0))} • ${escapeHtml(formatDateLabel(pack.createdAt))}</div>
                    </div>
                    <div class="flex gap-2">
                        <button type="button" data-pack-load="${escapeHtml(pack.id)}" class="px-3 py-2 rounded-xl bg-emerald-500 text-white text-[9px] font-black hover:bg-emerald-400 transition-colors">Load</button>
                        <button type="button" data-pack-delete="${escapeHtml(pack.id)}" class="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-[9px] font-black hover:bg-red-500/20 transition-colors">Delete</button>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${(Array.isArray(pack.items) ? pack.items.slice(0, 3) : []).map((item) => `
                        <span class="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-[9px] font-black text-slate-200">
                            ${escapeHtml(item.name || "Item")}
                        </span>
                    `).join("")}
                    ${(Array.isArray(pack.items) && pack.items.length > 3) ? `<span class="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-slate-400">+${pack.items.length - 3} more</span>` : ""}
                </div>
            </div>
        `).join("");
    }

    function saveCurrentPack() {
        const items = typeof cart !== "undefined" && Array.isArray(cart) ? cart : [];
        if (!items.length) {
            toast("السلة فارغة، ما نجمناش نحفظو pack.");
            return;
        }

        const packName = (dom.packName?.value || "").trim() || `Pack ${formatDateLabel(new Date())}`;
        const total = items.reduce((sum, item) => sum + (Number(item.totalWithFee || item.tnd || 0) * Number(item.qty || 1)), 0);
        const packs = (Array.isArray(state.savedPacks) ? state.savedPacks : []).filter((pack) => pack.name !== packName);
        packs.unshift({
            id: `${Date.now()}`,
            name: packName,
            createdAt: new Date().toISOString(),
            itemCount: items.reduce((sum, item) => sum + Number(item.qty || 1), 0),
            total,
            items: cloneData(items)
        });
        saveSavedPacks(packs);
        if (dom.packName) dom.packName.value = "";
        pushActivityLog("pack", `Saved pack ${packName}.`);
        toast("تم حفظ الـ pack بنجاح.");
    }

    function loadSavedPack(id) {
        const pack = (Array.isArray(state.savedPacks) ? state.savedPacks : []).find((item) => String(item.id) === String(id));
        if (!pack || typeof cart === "undefined" || !Array.isArray(cart)) return;
        cart = cloneData(pack.items || []);
        if (typeof updateBadges === "function") updateBadges();
        if (typeof renderCart === "function") renderCart();
        if (typeof saveData === "function") saveData();
        if (typeof window.switchTab === "function") window.switchTab("cart");
        pushActivityLog("pack", `Loaded pack ${pack.name}.`);
        toast("تم تحميل الـ pack إلى السلة.");
    }

    function deleteSavedPack(id) {
        const deleted = (Array.isArray(state.savedPacks) ? state.savedPacks : []).find((item) => String(item.id) === String(id));
        const next = (Array.isArray(state.savedPacks) ? state.savedPacks : []).filter((item) => String(item.id) !== String(id));
        saveSavedPacks(next);
        if (deleted) {
            pushActivityLog("pack", `Deleted pack ${deleted.name}.`);
        }
        toast("تم حذف الـ pack.");
    }

    function downloadBlob(filename, content, type) {
        const blob = new Blob([content], { type });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);
    }

    function downloadQuoteDocument() {
        const items = typeof cart !== "undefined" && Array.isArray(cart) ? cart : [];
        if (!items.length) {
            toast("السلة فارغة، ما فماش quote باش نخرجوها.");
            return;
        }

        const paymentSelect = document.getElementById("payment-method");
        const paymentLabel = paymentSelect?.options?.[paymentSelect.selectedIndex]?.text || "Not selected";
        const quoteRef = `QT-${Date.now().toString().slice(-8)}`;
        const total = items.reduce((sum, item) => sum + (Number(item.totalWithFee || item.tnd || 0) * Number(item.qty || 1)), 0);
        const customerLines = buildCustomerSummaryLines();
        const rows = items.map((item, index) => `
            <tr>
                <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${index + 1}</td>
                <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.name || "Item")}</td>
                <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.note || "-")}</td>
                <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${Number(item.qty || 1)}</td>
                <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${escapeHtml(formatTnd((item.totalWithFee || item.tnd || 0) * (item.qty || 1)))}</td>
            </tr>
        `).join("");

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Alexpress Quote ${quoteRef}</title>
<style>
body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
.hero { display:flex; justify-content:space-between; gap:24px; margin-bottom:24px; }
.badge { display:inline-block; background:#fef3c7; color:#92400e; padding:6px 12px; border-radius:999px; font-weight:700; font-size:12px; }
.card { border:1px solid #e2e8f0; border-radius:16px; padding:20px; margin-bottom:20px; }
table { width:100%; border-collapse:collapse; font-size:14px; }
th { text-align:left; padding:10px; background:#f8fafc; border-bottom:1px solid #e2e8f0; }
.muted { color:#64748b; font-size:12px; }
</style>
</head>
<body>
    <div class="hero">
        <div>
            <div class="badge">Alexpress Tunisie Quote</div>
            <h1 style="margin:14px 0 8px;">Quote ${quoteRef}</h1>
            <div class="muted">Generated ${escapeHtml(new Date().toLocaleString("en-GB"))}</div>
        </div>
        <div style="text-align:right;">
            <div><strong>Total:</strong> ${escapeHtml(formatTnd(total))}</div>
            <div><strong>Payment:</strong> ${escapeHtml(paymentLabel)}</div>
            <div><strong>Items:</strong> ${items.length}</div>
        </div>
    </div>
    <div class="card">
        <h3 style="margin-top:0;">Customer Summary</h3>
        <div class="muted">${customerLines.length ? customerLines.map((line) => escapeHtml(line)).join("<br>") : "No customer info saved yet."}</div>
    </div>
    <div class="card">
        <h3 style="margin-top:0;">Order Lines</h3>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Notes</th>
                    <th>Qty</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </div>
</body>
</html>`;

        const quoteWindow = window.open("", "_blank", "noopener,noreferrer");
        if (!quoteWindow) {
            downloadBlob(`alexpress-quote-${quoteRef}.html`, html, "text/html;charset=utf-8");
            toast("فتح الطباعة ما نجحش، هبطنا quote HTML بدلها.");
            return;
        }
        quoteWindow.document.open();
        quoteWindow.document.write(html);
        quoteWindow.document.close();
        quoteWindow.focus();
        window.setTimeout(() => quoteWindow.print(), 300);
    }

    function exportOrdersCsv() {
        const orders = typeof orderHistory !== "undefined" && Array.isArray(orderHistory) ? orderHistory : [];
        if (!orders.length) {
            toast("ما فماش طلبات باش نصدرهم.");
            return;
        }

        const rows = [
            ["orderRef", "date", "status", "paymentMethod", "totalTnd", "itemsCount", "promoCode", "tracking", "items"]
        ];

        orders.forEach((order) => {
            rows.push([
                order.orderRef || order.id || "",
                order.date || "",
                order.status || "pending",
                order.paymentMethod || "",
                Number(order.total || 0).toFixed(3),
                Number(order.itemsCount || (Array.isArray(order.items) ? order.items.length : 0)),
                order.promoCode || "",
                order.adminTracking || order.trackingHint || "",
                Array.isArray(order.items) ? order.items.map((item) => item.name).join(" | ") : ""
            ]);
        });

        const csv = rows.map((row) => row.map((cell) => {
            const value = String(cell ?? "");
            return `"${value.replace(/"/g, '""')}"`;
        }).join(",")).join("\n");

        downloadBlob(`alexpress-orders-${formatDateLabel(new Date()).replace(/\//g, "-")}.csv`, csv, "text/csv;charset=utf-8");
        toast("تم تصدير orders CSV.");
    }

    function getCurrentProductMeta() {
        const pricing = calculatePricingData();
        return {
            image: state.currentProduct?.image || "",
            rating: Number(state.currentProduct?.rating || 0),
            shippingUsd: pricing.shippingUsd,
            productUsd: pricing.productUsd,
            serviceFeeTnd: pricing.serviceFee,
            serviceFeeDisplay: getServiceFeeDisplayText(pricing, state.currentProduct),
            finalTnd: pricing.finalTnd,
            deliveryEstimate: state.currentProduct?.deliveryEstimate || "",
            alerts: state.currentProduct?.alerts || [],
            restrictions: state.currentProduct?.restrictions || null,
            trustScore: state.currentProduct?.trustScore || null,
            reviewCount: Number(state.currentProduct?.reviewCount || 0),
            soldCount: Number(state.currentProduct?.soldCount || 0),
            source: state.currentProduct?.source || "manual",
            hasOptions: productHasOptions(state.currentProduct)
        };
    }

    function patchGetFormData() {
        if (typeof original.getFormData !== "function") return;

        window._getFormData = function patchedGetFormData() {
            const item = original.getFormData();
            if (!item) return item;

            const meta = getCurrentProductMeta();
            item.image = meta.image;
            item.rating = meta.rating;
            item.shippingUsd = meta.shippingUsd;
            item.productUsd = meta.productUsd;
            item.serviceFeeTnd = meta.serviceFeeTnd;
            item.serviceFeeDisplay = meta.serviceFeeDisplay;
            item.totalWithFee = meta.finalTnd;
            item.deliveryEstimate = meta.deliveryEstimate;
            item.alerts = meta.alerts;
            item.restrictions = meta.restrictions;
            item.trustScore = meta.trustScore;
            item.reviewCount = meta.reviewCount;
            item.soldCount = meta.soldCount;
            item.source = meta.source;
            item.hasOptions = meta.hasOptions;

            return item;
        };
    }

    function buildOrderMessage(items, paymentLabel, finalTotal, orderRef) {
        const lines = [`🚀 *طلب جديد Alexpress Tunisie*`, ``, `🧾 *المرجع:* ${orderRef}`, `💳 *الدفع:* ${paymentLabel}`, ``];

        items.forEach((item, index) => {
            lines.push(`📦 *منتج ${index + 1}:* ${item.name}`);
            lines.push(`🔗 الرابط: ${item.link || "غير متوفر"}`);
            lines.push(`🔢 الكمية: ${item.qty || 1}`);
            lines.push(`📝 المواصفات: ${item.note || (item.hasOptions ? "يرجى تحديد اللون / المقاس / الطول المطلوب" : "بدون ملاحظات")}`);
            lines.push(`💵 سعر المنتج: ${formatUsd(item.productUsd || item.usd || 0)}`);
            lines.push(`🚚 الشحن: ${Number(item.shippingUsd || 0) === 0 ? "شحن مجاني" : formatUsd(item.shippingUsd || 0)}`);
            lines.push(`🧰 عمولة الخدمة: ${item.serviceFeeDisplay || (item.hasOptions ? "مشمولة" : formatTnd(item.serviceFeeTnd || 0))}`);
            lines.push(`💰 الإجمالي: ${formatTnd((item.totalWithFee || item.tnd || 0) * (item.qty || 1))}`);
            if (item.deliveryEstimate) lines.push(`⏱️ التوصيل المتوقع: ${item.deliveryEstimate}`);
            if (item.restrictions?.banned) lines.push(`⚠️ تنبيه: خطر ديوانة مرتفع`);
            else if (item.restrictions?.restricted) lines.push(`⚠️ تنبيه: يلزم تثبت قبل الطلب`);
            lines.push(`────────────`);
        });

        if (typeof currentDiscount !== "undefined" && currentDiscount > 0) {
            lines.push(`🎟️ التخفيض: ${discountType === "percent" ? `${currentDiscount}%` : `${currentDiscount} TND`}`);
        }

        lines.push(`💵 *TOTAL:* ${formatTnd(finalTotal)}`);
        lines.push(`📲 نحب تأكيد الطلب والمتابعة.`);
        return lines.join("\n");
    }

    function pushOrderHistory(entry) {
        if (typeof orderHistory === "undefined") return;
        orderHistory.unshift(entry);
        if (orderHistory.length > 20) orderHistory.pop();
    }

    function clearCartState() {
        if (typeof cart !== "undefined") {
            cart = [];
        }
        if (typeof currentDiscount !== "undefined") currentDiscount = 0;
        if (typeof discountType !== "undefined") discountType = "";
        document.getElementById("promo-code")?.setAttribute("value", "");
        const promoInput = document.getElementById("promo-code");
        if (promoInput) promoInput.value = "";
        document.getElementById("promo-message")?.classList.add("hidden");
        document.getElementById("discount-badge")?.classList.add("hidden");
        if (typeof updateBadges === "function") updateBadges();
        if (typeof renderCart === "function") renderCart();
        if (typeof saveData === "function") saveData();
    }

    function patchRenderCart() {
        if (typeof window.renderCart !== "function" || window.renderCart.__runtimeWrapped) return;
        const wrapped = function patchedRenderCart() {
            const list = document.getElementById("cart-items-list");
            const footer = document.getElementById("cart-footer");
            const totalDisplay = document.getElementById("cart-total-display");
            const items = typeof cart !== "undefined" && Array.isArray(cart) ? cart : [];

            if (!list || !footer || !totalDisplay) {
                renderCartInsights();
                renderBundleDeals();
                renderSavedPacks();
                return;
            }

            if (!items.length) {
                list.innerHTML = `<div class="text-center py-12 text-slate-600 text-xs italic">${typeof t === "function" ? t("cart_empty") : "The cart is empty."}</div>`;
                totalDisplay.textContent = "TND 0.000";
                footer.classList.add("hidden");
                renderCartInsights();
                renderBundleDeals();
                renderSavedPacks();
                return;
            }

            footer.classList.remove("hidden");

            let subtotal = 0;
            list.innerHTML = items.map((item) => {
                const qty = Math.max(1, Number(item.qty || 1));
                const lineTotal = Number(item.totalWithFee || item.tnd || 0) * qty;
                subtotal += lineTotal;
                const shippingText = Number(item.shippingUsd || 0) === 0 ? rt("shipping_free") : formatUsd(item.shippingUsd || 0);
                const ratingText = Number(item.rating || 0) > 0 ? Number(item.rating || 0).toFixed(1) : rt("rating_na");
                const reviewText = Number(item.reviewCount || 0) > 0 ? formatCompactCount(item.reviewCount || 0) : rt("reviews_na");
                const imgHtml = item.image
                    ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name || "Item")}" class="w-20 h-20 rounded-2xl object-cover border border-white/10 shadow-lg shrink-0">`
                    : `<div class="w-20 h-20 rounded-2xl border border-white/10 bg-black/20 flex items-center justify-center text-slate-500 shrink-0"><i class="fas fa-box text-xl"></i></div>`;

                return `
                    <div class="bg-slate-900/55 p-4 md:p-5 rounded-3xl border border-white/5 space-y-4 auto-align shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
                        <div class="flex flex-col md:flex-row gap-4 md:items-start">
                            ${imgHtml}
                            <div class="flex-1 min-w-0 space-y-2">
                                <div class="text-sm md:text-base font-black text-white leading-relaxed break-words">${escapeHtml(item.name || "Product")}</div>
                                <div class="flex flex-wrap gap-2 text-[9px] font-black">
                                    ${item.note ? `<span class="px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300">${escapeHtml(item.note)}</span>` : ""}
                                    ${item.deliveryEstimate ? `<span class="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">${escapeHtml(item.deliveryEstimate)}</span>` : ""}
                                    <span class="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">${escapeHtml(shippingText)}</span>
                                </div>
                                ${item.link && item.link !== "https://" ? `<a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-[10px] font-black text-blue-300 hover:text-white transition-colors break-all"><i class="fas fa-up-right-from-square"></i><span>${typeof t === "function" ? t("prod_link") : "Product Link"}</span></a>` : ""}
                            </div>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div class="rounded-2xl bg-black/25 border border-white/5 p-3 text-center">
                                <div class="text-[9px] text-slate-500 font-black uppercase">USD</div>
                                <div class="text-sm font-black text-white mt-1" dir="ltr">${formatUsd(item.productUsd || item.usd || 0)}</div>
                            </div>
                            <div class="rounded-2xl bg-black/25 border border-white/5 p-3 text-center">
                                <div class="text-[9px] text-slate-500 font-black uppercase">${escapeHtml(rt("stat_rating"))}</div>
                                <div class="text-sm font-black text-white mt-1" dir="ltr">${escapeHtml(ratingText)}</div>
                            </div>
                            <div class="rounded-2xl bg-black/25 border border-white/5 p-3 text-center">
                                <div class="text-[9px] text-slate-500 font-black uppercase">${escapeHtml(rt("stat_reviews"))}</div>
                                <div class="text-sm font-black text-white mt-1" dir="ltr">${escapeHtml(reviewText)}</div>
                            </div>
                            <div class="rounded-2xl bg-black/25 border border-white/5 p-3 text-center">
                                <div class="text-[9px] text-slate-500 font-black uppercase">${escapeHtml(rt("total"))}</div>
                                <div class="text-sm font-black text-amber-300 mt-1" dir="ltr">${formatTnd(lineTotal)}</div>
                            </div>
                        </div>
                        <div class="flex items-center justify-between gap-3 border-t border-white/5 pt-4">
                            <div class="flex items-center bg-black/40 rounded-2xl px-3 py-2 gap-4 border border-white/5" dir="ltr">
                                <button onclick="changeQty(${item.id}, -1)" class="text-amber-400 font-black text-sm hover:text-white transition-colors">-</button>
                                <span class="text-xs font-black text-white min-w-[18px] text-center">${qty}</span>
                                <button onclick="changeQty(${item.id}, 1)" class="text-amber-400 font-black text-sm hover:text-white transition-colors">+</button>
                            </div>
                            <button onclick="removeItem(${item.id})" class="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-[10px] font-black hover:bg-red-500/20 transition-colors">${escapeHtml(rt("remove"))}</button>
                        </div>
                    </div>
                `;
            }).join("");

            let finalTotal = subtotal;
            if (typeof currentDiscount !== "undefined" && Number(currentDiscount || 0) > 0) {
                if (typeof discountType !== "undefined" && discountType === "percent") {
                    finalTotal = subtotal - (subtotal * (Number(currentDiscount || 0) / 100));
                } else {
                    finalTotal = Math.max(0, subtotal - Number(currentDiscount || 0));
                }
            }

            totalDisplay.textContent = `TND ${Number(finalTotal || 0).toFixed(3)}`;
            renderCartInsights();
            renderBundleDeals();
            renderSavedPacks();
        };
        wrapped.__runtimeWrapped = true;
        window.renderCart = wrapped;
    }

    function patchSendOrder() {
        if (typeof window.sendOrder !== "function") return;

        window.sendOrder = function patchedSendOrder(channel) {
            if (typeof cart === "undefined" || !Array.isArray(cart) || cart.length === 0) {
                toast("السلة فارغة.. ابدأ بالحساب!");
                return;
            }

            const paymentSelect = document.getElementById("payment-method");
            const paymentLabel = paymentSelect?.options?.[paymentSelect.selectedIndex]?.text || "غير محدد";
            const orderRef = `AX-${Date.now().toString().slice(-8)}`;

            let subtotal = 0;
            cart.forEach((item) => {
                subtotal += (Number(item.totalWithFee || item.tnd || 0) * Number(item.qty || 1));
            });

            let finalTotal = subtotal;
            if (typeof currentDiscount !== "undefined" && currentDiscount > 0) {
                if (typeof discountType !== "undefined" && discountType === "percent") {
                    finalTotal = subtotal - (subtotal * (currentDiscount / 100));
                } else {
                    finalTotal = Math.max(0, subtotal - currentDiscount);
                }
            }

            const message = [buildOrderMessage(cart, paymentLabel, finalTotal, orderRef)]
                .concat(buildCustomerSummaryLines())
                .join("\n");
            const referral = getReferralState();
            const orderEntry = {
                id: Date.now(),
                orderRef,
                date: new Date().toLocaleString("ar-TN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
                total: finalTotal,
                itemsCount: cart.length,
                items: JSON.parse(JSON.stringify(cart)),
                status: "pending",
                paymentMethod: paymentLabel,
                trackingHint: "بعد ما نطلبوهولك، نبعثولك رقم التتبع على واتساب.",
                adminTracking: "",
                promoCode: state.activePromoCode || "",
                customer: getAccountPrefs(),
                referralCode: referral.code,
                loyaltyCredit: Math.max(0, Math.round(finalTotal * 0.03))
            };
            pushOrderHistory(orderEntry);
            persistOrderToBackend(orderEntry);
            pushActivityLog("order", `Placed new order ${orderRef}.`);
            referral.credits = Number(referral.credits || 0) + Number(orderEntry.loyaltyCredit || 0);
            saveReferralState(referral);

            if (typeof saveData === "function") saveData();
            if (typeof window.renderHistory === "function") window.renderHistory();
            if (state.activePromoCode) {
                markPromoUsed(state.activePromoCode);
                state.activePromoCode = "";
            }

            const encoded = encodeURIComponent(message);
            const urls = {
                whatsapp: `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`,
                messenger: `https://m.me/alexpresstunisie?text=${encoded}`,
                instagram: `https://ig.me/m/alexpress.tunisie?text=${encoded}`
            };
            window.open(urls[channel] || urls.whatsapp, "_blank", "noopener,noreferrer");

            clearCartState();
            renderVoiceNote();
            toast("تم تجهيز الطلب وإرساله!");
        };
    }

    function patchPromoLogic() {
        window.applyPromo = applyPromoCode;
    }

    function renderHistoryCard(order) {
        const status = order.status || "pending";
        const statusMap = {
            pending: { label: "في الانتظار", classes: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
            processing: { label: "قيد المعالجة", classes: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
            shipped: { label: "تم الشحن", classes: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
            delivered: { label: "تم التسليم", classes: "text-green-400 bg-green-400/10 border-green-400/20" }
        };
        const statusUi = getStatusUi(status);
        const items = Array.isArray(order.items) ? order.items : [];
        const trackingText = order.adminTracking || order.trackingHint || "سيتم إرسال رقم التتبع بعد الشراء.";
        const steps = ["pending", "processing", "shipped", "delivered"];

        const itemsHtml = items.map((item) => `
            <div class="rounded-2xl border border-white/5 bg-black/20 p-3 space-y-1">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <div class="text-[11px] font-black text-white">${escapeHtml(item.name || "منتج")}</div>
                        <div class="text-[9px] text-slate-400 break-all">${escapeHtml(item.link || "")}</div>
                    </div>
                    <div class="text-[10px] font-black text-amber-400 shrink-0">${formatTnd((item.totalWithFee || item.tnd || 0) * (item.qty || 1))}</div>
                </div>
                <div class="flex flex-wrap gap-2 text-[9px] text-slate-400">
                    <span>QTE: ${Number(item.qty || 1)}</span>
                    <span>${Number(item.shippingUsd || 0) === 0 ? "شحن مجاني" : formatUsd(item.shippingUsd || 0)}</span>
                    ${item.deliveryEstimate ? `<span>${escapeHtml(item.deliveryEstimate)}</span>` : ""}
                </div>
            </div>
        `).join("");

        return `
            <div class="bg-slate-900/60 rounded-2xl border border-white/5 overflow-hidden">
                <div class="p-4 flex items-start justify-between gap-4">
                    <div class="space-y-1 min-w-0">
                        <div class="flex flex-wrap gap-2 items-center">
                            <span class="text-[10px] font-black text-slate-500">#${escapeHtml(order.orderRef || String(order.id || ""))}</span>
                            <span class="text-[9px] px-2 py-1 rounded-md border ${statusUi.classes} font-bold">${statusUi.label}</span>
                        </div>
                        <div class="text-[10px] text-slate-400">${escapeHtml(order.date || "")}</div>
                        <div class="text-[10px] text-blue-300 font-bold">${escapeHtml(trackingText)}</div>
                        <div class="flex flex-wrap gap-2 pt-2">
                            ${steps.map((step, index) => {
                                const active = steps.indexOf(status) >= index;
                                return `<span class="text-[8px] px-2 py-1 rounded-full border ${active ? "bg-amber-400/10 text-amber-300 border-amber-400/20" : "bg-white/5 text-slate-500 border-white/5"}">${escapeHtml(getStatusUi(step).label)}</span>`;
                            }).join("")}
                        </div>
                    </div>
                    <div class="text-left rtl:text-left ltr:text-right shrink-0">
                        <div class="text-sm font-black text-blue-400" dir="ltr">${formatTnd(order.total || 0)}</div>
                        <div class="text-[9px] text-slate-500 mt-1">${Number(order.itemsCount || items.length || 0)} منتج</div>
                    </div>
                </div>
                <details class="group/details border-t border-white/5">
                    <summary class="p-3 text-[10px] font-bold text-slate-400 cursor-pointer hover:bg-white/5 transition-colors flex justify-between items-center outline-none select-none">
                        <span>شوف التفاصيل</span>
                        <i class="fas fa-chevron-down group-open/details:rotate-180 transition-transform"></i>
                    </summary>
                    <div class="p-3 pt-0 space-y-2 pb-4">
                        ${itemsHtml || `<div class="text-[10px] text-slate-500">لا توجد تفاصيل عناصر.</div>`}
                        ${order.paymentMethod ? `<div class="text-[9px] text-slate-500 mt-3 border-t border-white/5 pt-3"><i class="fas fa-wallet mr-1"></i> الدفع: <strong class="text-white">${escapeHtml(order.paymentMethod)}</strong></div>` : ""}
                        <button type="button" data-repeat-order="${escapeHtml(order.orderRef || String(order.id || ""))}" class="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-[9px] font-black hover:bg-blue-500 transition-colors">Buy Again</button>
                    </div>
                </details>
            </div>
        `;
    }

    function patchRenderHistory() {
        if (!dom.historyList) return;

        window.renderHistory = function patchedRenderHistory() {
            if (typeof orderHistory === "undefined" || !Array.isArray(orderHistory) || orderHistory.length === 0) {
                dom.historyList.innerHTML = `<div class="text-center py-12 text-slate-600 text-xs italic">لا يوجد سجل طلبات حتى الآن</div>`;
                return;
            }

            dom.historyList.innerHTML = orderHistory.map(renderHistoryCard).join("");
            renderTrackingHint();
            renderAccountStats();
            renderAdminOrders();
            renderRepeatOrders();
        };
    }

    function renderTrackingHint() {
        if (!dom.trackResult || typeof orderHistory === "undefined" || !Array.isArray(orderHistory) || orderHistory.length === 0) return;
        const latest = orderHistory.slice(0, 3);
        const hintHtml = latest.map((order) => `
            <div class="rounded-2xl border border-white/5 bg-slate-900/40 p-3">
                <div class="text-[10px] font-black text-white">${escapeHtml(order.orderRef || String(order.id || ""))}</div>
                <div class="text-[9px] text-slate-400 mt-1">${escapeHtml(order.adminTracking || order.trackingHint || "سيتم إرسال رقم التتبع بعد الشراء.")}</div>
            </div>
        `).join("");

        let host = document.getElementById("runtime-track-orders");
        if (!host) {
            dom.trackResult.insertAdjacentHTML("afterbegin", `<div id="runtime-track-orders" class="mt-6 space-y-3"></div>`);
            host = document.getElementById("runtime-track-orders");
        }
        if (!host) return;

        host.innerHTML = `
            <div class="space-y-3">
                <div class="text-[10px] font-black text-slate-400">آخر الطلبات المسجلة عندك:</div>
                ${hintHtml}
            </div>`;
    }

    function patchHistoryFilters() {
        if (typeof window.renderHistory !== "function" || window.renderHistory.__historyFilterWrapped) return;
        const originalRenderHistory = window.renderHistory;
        const wrapped = function patchedHistoryWithFilters() {
            originalRenderHistory();
            if (!dom.historyList || typeof orderHistory === "undefined" || !Array.isArray(orderHistory) || orderHistory.length === 0) {
                renderNotifications();
                return;
            }

            const search = String(dom.historySearch?.value || "").trim().toLowerCase();
            const status = String(dom.historyStatus?.value || "all").trim().toLowerCase();
            if (!search && status === "all") {
                renderNotifications();
                return;
            }

            const filtered = orderHistory.filter((order) => {
                const haystack = [
                    order.orderRef,
                    order.status,
                    order.paymentMethod,
                    ...(Array.isArray(order.items) ? order.items.map((item) => item.name) : [])
                ].join(" ").toLowerCase();
                const statusOk = status === "all" || String(order.status || "pending").toLowerCase() === status;
                const searchOk = !search || haystack.includes(search);
                return statusOk && searchOk;
            });

            dom.historyList.innerHTML = filtered.length
                ? filtered.map(renderHistoryCard).join("")
                : `<div class="text-center py-12 text-slate-600 text-xs italic">No matching orders found.</div>`;
            renderNotifications();
        };
        wrapped.__historyFilterWrapped = true;
        window.renderHistory = wrapped;
    }

    function patchCollectionActions() {
        const wrappers = [
            "addItemToCart",
            "addItemToWishlist",
            "removeItem",
            "removeWishlist",
            "moveToCartFromWishlist",
            "changeQty"
        ];

        wrappers.forEach((name) => {
            if (typeof window[name] !== "function" || window[name].__runtimeWrapped) return;
            const originalFn = window[name];
            const wrapped = function patchedCollectionAction(...args) {
                const result = originalFn.apply(this, args);
                window.setTimeout(() => {
                    renderAccountStats();
                    renderCartInsights();
                    renderBundleDeals();
                    renderSavedPacks();
                }, 0);
                return result;
            };
            wrapped.__runtimeWrapped = true;
            window[name] = wrapped;
        });
    }

    function bindEvents() {
        dom.scrapeBtn?.addEventListener("click", scrapeProduct);
        dom.createAlertBtn?.addEventListener("click", createPriceAlertFromCurrentProduct);
        dom.shareReferralBtn?.addEventListener("click", () => copyReferral(true));
        dom.manualQuoteBtn?.addEventListener("click", sendManualQuote);
        dom.quickOrderBtn?.addEventListener("click", quickOrderFromForm);
        dom.clearLinksBtn?.addEventListener("click", clearRecentLinks);
        dom.imageClearBtn?.addEventListener("click", clearImagePreview);
        dom.accountSavePrefs?.addEventListener("click", saveAccountPrefs);
        dom.referralApply?.addEventListener("click", applyReferralCode);
        dom.referralCopy?.addEventListener("click", () => copyReferral(false));
        dom.downloadQuoteBtn?.addEventListener("click", downloadQuoteDocument);
        dom.exportCsvBtn?.addEventListener("click", exportOrdersCsv);
        dom.savePackBtn?.addEventListener("click", saveCurrentPack);
        dom.voiceRecordBtn?.addEventListener("click", startVoiceRecording);
        dom.voiceStopBtn?.addEventListener("click", stopVoiceRecording);
        dom.trackSearchBtn?.addEventListener("click", searchTrackedOrderRemote);
        dom.trackRef?.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                searchTrackedOrderRemote();
            }
        });
        dom.historySearch?.addEventListener("input", () => {
            if (typeof window.renderHistory === "function") window.renderHistory();
        });
        dom.historyStatus?.addEventListener("change", () => {
            if (typeof window.renderHistory === "function") window.renderHistory();
        });
        dom.adminUnlockBtn?.addEventListener("click", unlockAdminRemote);
        dom.adminLockBtn?.addEventListener("click", lockAdminRemote);
        dom.adminPromoSave?.addEventListener("click", saveAdminPromoRemote);
        dom.adminOrderUpdate?.addEventListener("click", updateAdminOrderRemote);
        dom.calcLink?.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                scrapeProduct();
            }
        });
        dom.calcImage?.addEventListener("change", (event) => {
            const file = event.target?.files?.[0];
            if (!file) {
                renderImagePreview("");
                return;
            }
            const reader = new FileReader();
            reader.onload = () => renderImagePreview(String(reader.result || ""));
            reader.readAsDataURL(file);
        });
        dom.voiceUpload?.addEventListener("change", (event) => {
            const file = event.target?.files?.[0];
            if (!file) return;
            setVoiceNoteFromBlob(file, `Uploaded voice note: ${file.name}`);
        });
        dom.recentLinks?.addEventListener("click", (event) => {
            const trigger = event.target.closest("[data-recent-index]");
            if (!trigger) return;
            useRecentLink(Number(trigger.getAttribute("data-recent-index")));
        });
        dom.variantGroups?.addEventListener("click", (event) => {
            const trigger = event.target.closest("[data-variant-group][data-variant-value]");
            if (!trigger) return;
            applyVariantSelection(trigger.getAttribute("data-variant-group"), trigger.getAttribute("data-variant-value"));
        });
        dom.budgetInput?.addEventListener("input", () => {
            saveBudgetPrefs({
                budget: dom.budgetInput?.value || "",
                buffer: dom.budgetBuffer?.value || "10"
            });
            renderPricing();
        });
        dom.budgetBuffer?.addEventListener("change", () => {
            saveBudgetPrefs({
                budget: dom.budgetInput?.value || "",
                buffer: dom.budgetBuffer?.value || "10"
            });
            renderPricing();
        });
        dom.savedPacks?.addEventListener("click", (event) => {
            const loadTrigger = event.target.closest("[data-pack-load]");
            if (loadTrigger) {
                loadSavedPack(loadTrigger.getAttribute("data-pack-load"));
                return;
            }
            const deleteTrigger = event.target.closest("[data-pack-delete]");
            if (deleteTrigger) {
                deleteSavedPack(deleteTrigger.getAttribute("data-pack-delete"));
            }
        });
        dom.alertWatchlist?.addEventListener("click", (event) => {
            const trigger = event.target.closest("[data-remove-alert]");
            if (!trigger) return;
            removePriceAlert(trigger.getAttribute("data-remove-alert"));
        });
        dom.repeatOrders?.addEventListener("click", (event) => {
            const trigger = event.target.closest("[data-repeat-order]");
            if (!trigger) return;
            loadOrderIntoCart(trigger.getAttribute("data-repeat-order"));
        });
        dom.historyList?.addEventListener("click", (event) => {
            const trigger = event.target.closest("[data-repeat-order]");
            if (!trigger) return;
            loadOrderIntoCart(trigger.getAttribute("data-repeat-order"));
        });
        dom.adminPromos?.addEventListener("click", (event) => {
            const trigger = event.target.closest("[data-remove-promo]");
            if (!trigger) return;
            removeAdminPromoRemote(Number(trigger.getAttribute("data-remove-promo")));
        });
        dom.adminOrders?.addEventListener("click", (event) => {
            const trigger = event.target.closest("[data-fill-order]");
            if (!trigger) return;
            fillAdminOrder(trigger.getAttribute("data-fill-order"));
        });
        dom.usdPrice?.addEventListener("input", renderPricing);
        dom.usdShip?.addEventListener("input", renderPricing);
        dom.resellerPrice?.addEventListener("input", renderResellerMode);
        dom.resellerQty?.addEventListener("input", renderResellerMode);
        dom.calcName?.addEventListener("input", () => {
            if (state.currentProduct && dom.previewTitle && dom.calcName.value.trim()) {
                dom.previewTitle.textContent = dom.calcName.value.trim();
            }
        });
    }

    function patchGlobals() {
        window.calculateTND = renderPricing;
        window.autoScrapeProduct = scrapeProduct;
        window.changeLanguage = applyLanguage;
        patchPromoLogic();
        patchGetFormData();
        patchRenderCart();
        patchRenderHistory();
        patchHistoryFilters();
        patchSendOrder();
    }

    function boot() {
        state.recentLinks = readJsonStorage(RECENT_LINKS_KEY, []);
        state.accountPrefs = readJsonStorage(ACCOUNT_PREFS_KEY, {
            phone: "",
            city: "",
            address: "",
            contactMethod: "whatsapp"
        });
        state.budgetPrefs = readJsonStorage(BUDGET_PREFS_KEY, {
            budget: "",
            buffer: "10"
        });
        state.savedPacks = readJsonStorage(SAVED_PACKS_KEY, []);
        state.priceAlerts = readJsonStorage(PRICE_ALERTS_KEY, []);
        state.referral = readJsonStorage(REFERRAL_STATE_KEY, {
            code: buildReferralCode(),
            credits: 0,
            appliedCodes: [],
            usedOwnCode: false
        });
        state.adminPromos = readJsonStorage(ADMIN_PROMOS_KEY, []);
        state.adminToken = getStoredAdminToken();
        state.adminUnlocked = Boolean(state.adminToken);
        state.activityLog = readJsonStorage(ACTIVITY_LOG_KEY, []);
        state.stats = readJsonStorage(LOCAL_STATS_KEY, { fetches: 0, manualQuotes: 0 });
        repairTabLayout();
        patchGlobals();
        patchCollectionActions();
        patchTabSwitching();
        bindEvents();
        applyCalculatorUiCleanup();
        applyAccountUiCleanup();
        initAccountPanels();
        applyLanguage(window.localStorage.getItem("alexpress_lang") || "ar");
        renderRecentLinks();
        loadAccountPrefsIntoForm();
        renderSavedPacks();
        renderPriceAlerts();
        renderReferralCard();
        renderVoiceNote();
        renderAccountStats();
        renderAdminPromos();
        renderAdminOrders();
        renderActivityLog();
        renderNotifications();
        loadLiveRate();
        renderPricing();
        renderResellerMode();
        renderCartInsights();
        renderBundleDeals();
        if (typeof window.renderHistory === "function") window.renderHistory();
        renderTrackingHint();
        refreshPublicPromos();
        if (state.adminToken) {
            refreshAdminState().catch(() => {
                state.adminUnlocked = false;
                state.adminToken = "";
                setStoredAdminToken("");
                lockAdminRemote();
            });
        }
        window.setInterval(loadLiveRate, RATE_REFRESH_MS);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
