(() => {
    const API_BASE_URL = "";
    const ADMIN_TOKEN_KEY = "alex_admin_token_v1";

    const defaultSettings = {
        calculator: {
            thresholds: { low: 10, mid: 50, high: 150 },
            rates: { low: 4.5, mid: 4.3, high: 4.1, base: 3.8 },
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

    const dom = {
        loginPanel: document.getElementById("admin-login-panel"),
        app: document.getElementById("admin-app"),
        pinInput: document.getElementById("admin-pin-input"),
        loginBtn: document.getElementById("admin-login-btn"),
        loginMessage: document.getElementById("admin-login-message"),
        logoutBtn: document.getElementById("admin-logout-btn"),
        refreshBtn: document.getElementById("admin-refresh-btn"),
        sessionPill: document.getElementById("admin-session-pill"),
        activeBaseRateChip: document.getElementById("settings-active-base-rate"),
        serviceFeeChip: document.getElementById("settings-service-fee-chip"),
        refreshChip: document.getElementById("settings-refresh-chip"),
        lastSavedChip: document.getElementById("settings-last-saved"),
        kpiRevenue: document.getElementById("kpi-revenue"),
        kpiOrders: document.getElementById("kpi-orders"),
        kpiPending: document.getElementById("kpi-pending"),
        kpiDelivered: document.getElementById("kpi-delivered"),
        kpiRisk: document.getElementById("kpi-risk"),
        settingsThresholdLow: document.getElementById("settings-threshold-low"),
        settingsThresholdMid: document.getElementById("settings-threshold-mid"),
        settingsThresholdHigh: document.getElementById("settings-threshold-high"),
        settingsRateLow: document.getElementById("settings-rate-low"),
        settingsRateMid: document.getElementById("settings-rate-mid"),
        settingsRateHigh: document.getElementById("settings-rate-high"),
        settingsRateBase: document.getElementById("settings-rate-base"),
        settingsServiceFee: document.getElementById("settings-service-fee"),
        settingsWhatsapp: document.getElementById("settings-whatsapp"),
        settingsMessenger: document.getElementById("settings-messenger"),
        settingsInstagram: document.getElementById("settings-instagram"),
        settingsAutoRefresh: document.getElementById("settings-auto-refresh"),
        settingsPreviewUsd: document.getElementById("settings-preview-usd"),
        settingsPreviewRate: document.getElementById("settings-preview-rate"),
        settingsPreviewService: document.getElementById("settings-preview-service"),
        settingsPreviewTotal: document.getElementById("settings-preview-total"),
        settingsSave: document.getElementById("settings-save-btn"),
        settingsReset: document.getElementById("settings-reset-btn"),
        settingsMessage: document.getElementById("settings-message"),
        promosCount: document.getElementById("promos-count"),
        promoCode: document.getElementById("promo-code-input"),
        promoType: document.getElementById("promo-type-input"),
        promoValue: document.getElementById("promo-value-input"),
        promoLimit: document.getElementById("promo-limit-input"),
        promoExpiry: document.getElementById("promo-expiry-input"),
        promoSave: document.getElementById("promo-save-btn"),
        promoClear: document.getElementById("promo-clear-btn"),
        promoMessage: document.getElementById("promo-message"),
        promosList: document.getElementById("promos-list"),
        repeatCustomersList: document.getElementById("repeat-customers-list"),
        topPromosList: document.getElementById("top-promos-list"),
        adminActivity: document.getElementById("admin-activity-log"),
        ordersSearch: document.getElementById("orders-search-input"),
        ordersStatus: document.getElementById("orders-status-filter"),
        ordersSort: document.getElementById("orders-sort-filter"),
        ordersTable: document.getElementById("orders-table-body"),
        ordersStatusChart: document.getElementById("orders-status-chart"),
        topProductsChart: document.getElementById("top-products-chart")
    };

    const state = {
        token: "",
        promos: [],
        orders: [],
        analytics: null,
        settings: cloneValue(defaultSettings),
        activity: [],
        editingPromoCode: "",
        lastSyncAt: 0,
        autoRefreshHandle: 0,
        charts: {
            orders: null,
            products: null
        }
    };

    const STATUS_LABELS = {
        pending: "قيد الانتظار",
        processing: "قيد المعالجة",
        shipped: "تم الشحن",
        delivered: "تم التسليم"
    };

    const PROMO_TYPE_LABELS = {
        percent: "نسبة مئوية",
        fixed: "قيمة ثابتة"
    };

    function getStatusLabel(status) {
        const normalized = String(status || "").toLowerCase();
        return STATUS_LABELS[normalized] || status || "قيد الانتظار";
    }

    function cloneValue(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function toFiniteNumber(value, fallback) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function normalizeSettings(raw = {}) {
        const source = raw && typeof raw === "object" ? raw : {};
        const defaults = cloneValue(defaultSettings);
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
                whatsappNumber: String(storefront.whatsappNumber || defaults.storefront.whatsappNumber).trim().replace(/\D/g, "") || defaults.storefront.whatsappNumber,
                messengerHandle: String(storefront.messengerHandle || defaults.storefront.messengerHandle).trim().replace(/^@/, "") || defaults.storefront.messengerHandle,
                instagramHandle: String(storefront.instagramHandle || defaults.storefront.instagramHandle).trim().replace(/^@/, "") || defaults.storefront.instagramHandle
            },
            admin: {
                autoRefreshSeconds: Math.max(0, Math.round(toFiniteNumber(admin.autoRefreshSeconds, defaults.admin.autoRefreshSeconds)))
            }
        };
    }

    function getStoredToken() {
        try {
            return window.sessionStorage.getItem(ADMIN_TOKEN_KEY) || "";
        } catch {
            return "";
        }
    }

    function setStoredToken(token) {
        try {
            if (token) {
                window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
            } else {
                window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
            }
        } catch {
            // ignore
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

    function formatMoney(value) {
        return `${Number(value || 0).toFixed(3)} TND`;
    }

    function formatDateLabel(value) {
        if (!value) return "--";
        try {
            return new Intl.DateTimeFormat("ar-TN", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit"
            }).format(new Date(value));
        } catch {
            return String(value);
        }
    }

    function showSettingsMessage(text, tone = "text-slate-400") {
        if (!dom.settingsMessage) return;
        dom.settingsMessage.textContent = text;
        dom.settingsMessage.className = `text-sm font-bold mt-4 ${tone}`;
    }

    function pushActivity(text, tone = "text-slate-300") {
        state.activity.unshift({
            id: Date.now() + Math.random(),
            text,
            tone,
            time: formatDateLabel(new Date().toISOString())
        });
        state.activity = state.activity.slice(0, 12);
        renderActivity();
    }

    async function apiFetch(endpoint, options = {}, authRequired = true) {
        const headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
        if (authRequired && state.token) {
            headers.Authorization = `Bearer ${state.token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, Object.assign({}, options, { headers }));
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) {
            throw new Error(data.error || `فشل الطلب (${response.status})`);
        }
        return data;
    }

    function setSessionUi(unlocked) {
        dom.loginPanel?.classList.toggle("hidden", unlocked);
        dom.app?.classList.toggle("hidden", !unlocked);
        dom.logoutBtn?.classList.toggle("hidden", !unlocked);
        dom.refreshBtn?.classList.toggle("hidden", !unlocked);
        if (dom.sessionPill) {
            dom.sessionPill.textContent = unlocked ? "مفتوح" : "مغلق";
            dom.sessionPill.className = `status-pill ${unlocked ? "text-emerald-300" : "text-slate-300"}`;
        }
    }

    function clearAutoRefreshTimer() {
        if (state.autoRefreshHandle) {
            window.clearInterval(state.autoRefreshHandle);
            state.autoRefreshHandle = 0;
        }
    }

    function updateAutoRefreshTimer() {
        clearAutoRefreshTimer();
        const seconds = Number(state.settings?.admin?.autoRefreshSeconds || 0);
        if (!state.token || seconds <= 0) return;

        state.autoRefreshHandle = window.setInterval(() => {
            refreshState(false, false).catch((error) => {
                pushActivity(error.message || "فشل التحديث التلقائي.", "text-red-300");
            });
        }, seconds * 1000);
    }

    function normalizeFetchedState(data) {
        state.promos = Array.isArray(data.promos) ? data.promos : [];
        state.orders = Array.isArray(data.orders) ? data.orders : [];
        state.analytics = data.analytics || {};
        state.settings = normalizeSettings(data.settings || state.settings);
        state.lastSyncAt = Date.now();
        updateAutoRefreshTimer();
    }

    function resolveRate(totalUsd, settings = state.settings) {
        const calculator = settings?.calculator || defaultSettings.calculator;
        const thresholds = calculator.thresholds || defaultSettings.calculator.thresholds;
        const rates = calculator.rates || defaultSettings.calculator.rates;
        let rate = Number(rates.base || defaultSettings.calculator.rates.base);

        if (totalUsd > 0 && totalUsd < Number(thresholds.low || defaultSettings.calculator.thresholds.low)) {
            rate = Number(rates.low || rate);
        } else if (totalUsd < Number(thresholds.mid || defaultSettings.calculator.thresholds.mid)) {
            rate = Number(rates.mid || rate);
        } else if (totalUsd < Number(thresholds.high || defaultSettings.calculator.thresholds.high)) {
            rate = Number(rates.high || rate);
        }

        return rate;
    }

    function calculatePreview(totalUsd, settings = state.settings) {
        const numericTotal = Math.max(0, Number(totalUsd || 0));
        const rate = resolveRate(numericTotal, settings);
        const converted = numericTotal * rate;
        const serviceFeeTnd = Number(settings?.calculator?.serviceFeeTnd || 0);
        return {
            rate,
            converted,
            serviceFeeTnd,
            totalTnd: converted + serviceFeeTnd
        };
    }

    function renderHeroSummary() {
        const calculator = state.settings.calculator;
        if (dom.activeBaseRateChip) {
            dom.activeBaseRateChip.textContent = `السعر الأساسي ${Number(calculator.rates.base || 0).toFixed(3)}`;
        }
        if (dom.serviceFeeChip) {
            dom.serviceFeeChip.textContent = `رسوم الخدمة ${formatMoney(calculator.serviceFeeTnd || 0)}`;
        }
        if (dom.refreshChip) {
            const seconds = Number(state.settings.admin.autoRefreshSeconds || 0);
            dom.refreshChip.textContent = seconds > 0 ? `تحديث تلقائي كل ${seconds} ث` : "التحديث التلقائي متوقف";
        }
        if (dom.lastSavedChip) {
            dom.lastSavedChip.textContent = state.lastSyncAt ? `آخر مزامنة ${formatDateLabel(state.lastSyncAt)}` : "لم تتم المزامنة بعد";
        }
    }

    function renderKpis() {
        const analytics = state.analytics || {};
        if (dom.kpiRevenue) dom.kpiRevenue.textContent = formatMoney(analytics.totalRevenue || 0);
        if (dom.kpiOrders) dom.kpiOrders.textContent = String(analytics.totalOrders || 0);
        if (dom.kpiPending) dom.kpiPending.textContent = String(analytics.pendingOrders || 0);
        if (dom.kpiDelivered) dom.kpiDelivered.textContent = String(analytics.deliveredOrders || 0);
        if (dom.kpiRisk) dom.kpiRisk.textContent = String(analytics.riskyOrders || 0);
    }

    function renderMiniList(host, items, formatter) {
        if (!host) return;
        if (!items.length) {
            host.innerHTML = `<div class="empty-state">لا توجد بيانات متاحة حالياً.</div>`;
            return;
        }
        host.innerHTML = items.map(formatter).join("");
    }

    function renderPromos() {
        if (dom.promosCount) {
            dom.promosCount.textContent = `${state.promos.length} عروض`;
        }

        renderMiniList(dom.promosList, state.promos, (promo) => {
            const expiry = promo.expiresAt ? formatDateLabel(promo.expiresAt) : "بدون تاريخ انتهاء";
            const limit = Number(promo.limit || 0) > 0 ? Number(promo.limit || 0) : "غير محدود";
            return `
                <div class="mini-item">
                    <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                            <div class="text-sm font-black text-white">${escapeHtml(promo.code)}</div>
                            <div class="text-xs text-slate-400 mt-2">
                                ${promo.type === "percent" ? `${Number(promo.value || 0)}%` : formatMoney(promo.value || 0)} - ${escapeHtml(PROMO_TYPE_LABELS[promo.type] || promo.type || "")}
                            </div>
                            <div class="text-xs text-slate-500 mt-2">
                                استُخدم ${Number(promo.used || 0)} / ${limit} | ${escapeHtml(expiry)}
                            </div>
                        </div>
                        <div class="flex gap-2 shrink-0">
                            <button class="btn btn-ghost !px-3 !py-2 text-xs" data-edit-promo="${escapeHtml(promo.code)}">تعديل</button>
                            <button class="btn btn-danger !px-3 !py-2 text-xs" data-delete-promo="${escapeHtml(promo.code)}">حذف</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    function statusTone(status) {
        switch (String(status || "").toLowerCase()) {
            case "delivered":
                return "text-emerald-300";
            case "shipped":
                return "text-sky-300";
            case "processing":
                return "text-amber-300";
            default:
                return "text-slate-300";
        }
    }

    function orderSearchIndex(order) {
        const items = Array.isArray(order.items) ? order.items.map((item) => item?.name || "").join(" ") : "";
        const customer = [
            order.customer?.name || "",
            order.customer?.phone || "",
            order.customer?.city || "",
            order.customer?.address || ""
        ].join(" ");
        return `${order.orderRef || ""} ${items} ${customer} ${order.status || ""}`.toLowerCase();
    }

    function filteredOrders() {
        const query = String(dom.ordersSearch?.value || "").trim().toLowerCase();
        const status = dom.ordersStatus?.value || "all";
        const sort = dom.ordersSort?.value || "newest";

        let rows = state.orders.slice();
        if (query) {
            rows = rows.filter((order) => orderSearchIndex(order).includes(query));
        }
        if (status !== "all") {
            rows = rows.filter((order) => String(order.status || "") === status);
        }

        rows.sort((left, right) => {
            if (sort === "oldest") {
                return new Date(left.updatedAt || left.date || 0) - new Date(right.updatedAt || right.date || 0);
            }
            if (sort === "high-total") {
                return Number(right.total || 0) - Number(left.total || 0);
            }
            if (sort === "low-total") {
                return Number(left.total || 0) - Number(right.total || 0);
            }
            return new Date(right.updatedAt || right.date || 0) - new Date(left.updatedAt || left.date || 0);
        });

        return rows;
    }

    function renderOrders() {
        if (!dom.ordersTable) return;
        const rows = filteredOrders();
        if (!rows.length) {
            dom.ordersTable.innerHTML = `<tr><td colspan="8"><div class="empty-state">لا توجد طلبات مطابقة لهذا الفلتر.</div></td></tr>`;
            return;
        }

        dom.ordersTable.innerHTML = rows.map((order) => {
            const customer = [order.customer?.name, order.customer?.phone, order.customer?.city].filter(Boolean).join(" | ") || "لا توجد بيانات عميل";
            const itemsHtml = Array.isArray(order.items) && order.items.length
                ? order.items.slice(0, 3).map((item) => `<div class="text-xs text-slate-300">${escapeHtml(item?.name || "منتج")}</div>`).join("")
                : `<div class="text-xs text-slate-500">لا توجد منتجات</div>`;

            return `
                <tr>
                    <td>
                        <div class="font-black text-white">${escapeHtml(order.orderRef || "")}</div>
                        <div class="text-xs text-slate-500 mt-1">${escapeHtml(order.paymentMethod || "لا توجد طريقة دفع")}</div>
                    </td>
                    <td>
                        <div class="text-sm text-slate-200">${escapeHtml(order.date || "")}</div>
                        <div class="text-xs text-slate-500 mt-1">آخر تحديث ${escapeHtml(order.updatedAt || "")}</div>
                    </td>
                    <td>
                        <div class="text-sm text-slate-200">${escapeHtml(customer)}</div>
                    </td>
                    <td>${itemsHtml}</td>
                    <td>
                        <span class="status-pill ${statusTone(order.status)}">${escapeHtml(getStatusLabel(order.status || "pending"))}</span>
                    </td>
                    <td>
                        <div class="font-black text-white">${formatMoney(order.total || 0)}</div>
                        <div class="text-xs text-slate-500 mt-1">${Number(order.itemsCount || 0)} منتجات</div>
                    </td>
                    <td>
                        <div class="text-sm text-slate-200">${escapeHtml(order.adminTracking || order.trackingHint || "--")}</div>
                        <div class="text-xs text-slate-500 mt-1">${escapeHtml(order.promoCode || "")}</div>
                    </td>
                    <td>
                        <div class="grid gap-2">
                            <select class="select text-xs" data-order-status="${escapeHtml(order.orderRef || "")}">
                                <option value="pending" ${order.status === "pending" ? "selected" : ""}>قيد الانتظار</option>
                                <option value="processing" ${order.status === "processing" ? "selected" : ""}>قيد المعالجة</option>
                                <option value="shipped" ${order.status === "shipped" ? "selected" : ""}>تم الشحن</option>
                                <option value="delivered" ${order.status === "delivered" ? "selected" : ""}>تم التسليم</option>
                            </select>
                            <input class="field text-xs" data-order-tracking="${escapeHtml(order.orderRef || "")}" value="${escapeHtml(order.adminTracking || "")}" placeholder="ملاحظة التتبع">
                            <button class="btn btn-primary text-xs" data-save-order="${escapeHtml(order.orderRef || "")}">حفظ</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    function destroyChart(instance) {
        if (instance && typeof instance.destroy === "function") {
            instance.destroy();
        }
    }

    function renderCharts() {
        const analytics = state.analytics || {};
        const orderChartCtx = dom.ordersStatusChart?.getContext("2d");
        const productChartCtx = dom.topProductsChart?.getContext("2d");
        if (!orderChartCtx || !productChartCtx) return;

        destroyChart(state.charts.orders);
        destroyChart(state.charts.products);

        state.charts.orders = new Chart(orderChartCtx, {
            type: "doughnut",
            data: {
                labels: ["قيد الانتظار", "تم التسليم", "مخاطر"],
                datasets: [{
                    data: [
                        Number(analytics.pendingOrders || 0),
                        Number(analytics.deliveredOrders || 0),
                        Number(analytics.riskyOrders || 0)
                    ],
                    backgroundColor: ["#f59e0b", "#34d399", "#fb7185"],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "70%",
                plugins: {
                    legend: {
                        labels: {
                            color: "#d8e4f2",
                            font: { family: "Cairo", weight: "700" }
                        }
                    }
                }
            }
        });

        const topProducts = Array.isArray(analytics.topProducts) ? analytics.topProducts.slice(0, 5) : [];
        state.charts.products = new Chart(productChartCtx, {
            type: "bar",
            data: {
                labels: topProducts.map((item) => {
                    const label = String(item.name || "بدون اسم").trim();
                    return label.length > 22 ? `${label.slice(0, 22)}...` : label;
                }),
                datasets: [{
                    label: "الطلبات",
                    data: topProducts.map((item) => Number(item.count || 0)),
                    borderRadius: 14,
                    backgroundColor: ["#38bdf8", "#7dd3fc", "#f59e0b", "#34d399", "#f97316"]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        ticks: { color: "#d8e4f2", font: { family: "Cairo", weight: "700" } },
                        grid: { display: false }
                    },
                    y: {
                        ticks: { color: "#94a3b8" },
                        grid: { color: "rgba(255,255,255,0.06)" }
                    }
                }
            }
        });
    }

    function renderInsights() {
        const analytics = state.analytics || {};
        renderMiniList(dom.repeatCustomersList, analytics.repeatCustomers || [], (item) => `
            <div class="text-sm text-slate-200">
                <strong>${escapeHtml(item.id || "غير معروف")}</strong>
                <span class="text-slate-500"> | ${Number(item.ordersCount || 0)} طلبات</span>
            </div>
        `);
        renderMiniList(dom.topPromosList, analytics.topPromos || [], (item) => `
            <div class="text-sm text-slate-200">
                <strong>${escapeHtml(item.code || "غير متوفر")}</strong>
                <span class="text-slate-500"> | استُخدم ${Number(item.used || 0)}</span>
            </div>
        `);
    }

    function renderActivity() {
        renderMiniList(dom.adminActivity, state.activity, (entry) => `
            <div class="text-sm ${entry.tone}">
                <div class="font-bold">${escapeHtml(entry.text)}</div>
                <div class="text-xs text-slate-500 mt-1">${escapeHtml(entry.time)}</div>
            </div>
        `);
    }

    function fillPromoForm(promo) {
        if (!promo) return;
        dom.promoCode.value = promo.code || "";
        dom.promoType.value = promo.type || "percent";
        dom.promoValue.value = promo.value ?? "";
        dom.promoLimit.value = promo.limit ?? "";
        dom.promoExpiry.value = promo.expiresAt ? String(promo.expiresAt).slice(0, 16) : "";
        state.editingPromoCode = promo.code || "";
        dom.promoMessage.textContent = `جاري تعديل ${promo.code}`;
        dom.promoMessage.className = "text-sm font-bold text-sky-300 mb-4";
    }

    function clearPromoForm() {
        if (dom.promoCode) dom.promoCode.value = "";
        if (dom.promoType) dom.promoType.value = "percent";
        if (dom.promoValue) dom.promoValue.value = "";
        if (dom.promoLimit) dom.promoLimit.value = "";
        if (dom.promoExpiry) dom.promoExpiry.value = "";
        state.editingPromoCode = "";
        if (dom.promoMessage) {
            dom.promoMessage.textContent = "";
            dom.promoMessage.className = "text-sm font-bold text-slate-400 mb-4";
        }
    }

    function renderSettingsForm() {
        const settings = state.settings;
        if (dom.settingsThresholdLow) dom.settingsThresholdLow.value = settings.calculator.thresholds.low;
        if (dom.settingsThresholdMid) dom.settingsThresholdMid.value = settings.calculator.thresholds.mid;
        if (dom.settingsThresholdHigh) dom.settingsThresholdHigh.value = settings.calculator.thresholds.high;
        if (dom.settingsRateLow) dom.settingsRateLow.value = settings.calculator.rates.low.toFixed(3);
        if (dom.settingsRateMid) dom.settingsRateMid.value = settings.calculator.rates.mid.toFixed(3);
        if (dom.settingsRateHigh) dom.settingsRateHigh.value = settings.calculator.rates.high.toFixed(3);
        if (dom.settingsRateBase) dom.settingsRateBase.value = settings.calculator.rates.base.toFixed(3);
        if (dom.settingsServiceFee) dom.settingsServiceFee.value = Number(settings.calculator.serviceFeeTnd || 0).toFixed(3);
        if (dom.settingsWhatsapp) dom.settingsWhatsapp.value = settings.storefront.whatsappNumber || "";
        if (dom.settingsMessenger) dom.settingsMessenger.value = settings.storefront.messengerHandle || "";
        if (dom.settingsInstagram) dom.settingsInstagram.value = settings.storefront.instagramHandle || "";
        if (dom.settingsAutoRefresh) dom.settingsAutoRefresh.value = settings.admin.autoRefreshSeconds || 0;
        renderDraftPreview();
    }

    function getDraftSettings() {
        return normalizeSettings({
            calculator: {
                thresholds: {
                    low: dom.settingsThresholdLow?.value,
                    mid: dom.settingsThresholdMid?.value,
                    high: dom.settingsThresholdHigh?.value
                },
                rates: {
                    low: dom.settingsRateLow?.value,
                    mid: dom.settingsRateMid?.value,
                    high: dom.settingsRateHigh?.value,
                    base: dom.settingsRateBase?.value
                },
                serviceFeeTnd: dom.settingsServiceFee?.value
            },
            storefront: {
                whatsappNumber: dom.settingsWhatsapp?.value,
                messengerHandle: dom.settingsMessenger?.value,
                instagramHandle: dom.settingsInstagram?.value
            },
            admin: {
                autoRefreshSeconds: dom.settingsAutoRefresh?.value
            }
        });
    }

    function readRawSettingsInputs() {
        return {
            lowThreshold: Number(dom.settingsThresholdLow?.value || 0),
            midThreshold: Number(dom.settingsThresholdMid?.value || 0),
            highThreshold: Number(dom.settingsThresholdHigh?.value || 0),
            lowRate: Number(dom.settingsRateLow?.value || 0),
            midRate: Number(dom.settingsRateMid?.value || 0),
            highRate: Number(dom.settingsRateHigh?.value || 0),
            baseRate: Number(dom.settingsRateBase?.value || 0),
            serviceFeeTnd: Number(dom.settingsServiceFee?.value || 0),
            autoRefreshSeconds: Number(dom.settingsAutoRefresh?.value || 0)
        };
    }

    function validateDraftSettings() {
        const raw = readRawSettingsInputs();
        if (raw.lowThreshold < 0 || raw.midThreshold <= raw.lowThreshold || raw.highThreshold <= raw.midThreshold) {
            throw new Error("يجب أن تكون الحدود تصاعدية: الأول < الثاني < الثالث.");
        }
        if (raw.lowRate <= 0 || raw.midRate <= 0 || raw.highRate <= 0 || raw.baseRate <= 0) {
            throw new Error("يجب أن تكون كل أسعار الحاسبة أكبر من صفر.");
        }
        if (raw.serviceFeeTnd < 0) {
            throw new Error("لا يمكن أن تكون رسوم الخدمة سالبة.");
        }
        if (raw.autoRefreshSeconds < 0) {
            throw new Error("لا يمكن أن يكون التحديث التلقائي بقيمة سالبة.");
        }
    }

    function renderDraftPreview() {
        const draft = getDraftSettings();
        const sampleUsd = Number(dom.settingsPreviewUsd?.value || 0);
        const preview = calculatePreview(sampleUsd, draft);

        if (dom.settingsPreviewRate) dom.settingsPreviewRate.textContent = `${preview.rate.toFixed(3)} TND`;
        if (dom.settingsPreviewService) dom.settingsPreviewService.textContent = formatMoney(preview.serviceFeeTnd);
        if (dom.settingsPreviewTotal) dom.settingsPreviewTotal.textContent = formatMoney(preview.totalTnd);
    }

    function renderAll() {
        renderHeroSummary();
        renderKpis();
        renderPromos();
        renderOrders();
        renderCharts();
        renderInsights();
        renderActivity();
    }

    async function refreshState(showMessage = true, syncForms = false) {
        const data = await apiFetch("/api/admin/state");
        normalizeFetchedState(data);
        renderAll();
        if (syncForms) {
            renderSettingsForm();
        }
        if (showMessage) {
            pushActivity("تم تحديث بيانات لوحة الإدارة.", "text-emerald-300");
        }
    }

    async function login() {
        const pin = String(dom.pinInput?.value || "").trim();
        if (!pin) {
            if (dom.loginMessage) {
                dom.loginMessage.textContent = "أدخل رمز الإدارة أولاً.";
                dom.loginMessage.className = "text-sm font-bold text-red-300";
            }
            return;
        }

        if (dom.loginBtn) dom.loginBtn.disabled = true;
        if (dom.loginMessage) {
            dom.loginMessage.textContent = "جاري فتح جلسة الإدارة...";
            dom.loginMessage.className = "text-sm font-bold text-sky-300";
        }

        try {
            const data = await apiFetch("/api/admin/login", {
                method: "POST",
                body: JSON.stringify({ pin })
            }, false);

            state.token = data.token || "";
            setStoredToken(state.token);
            normalizeFetchedState(data.state || {});
            setSessionUi(true);
            renderAll();
            renderSettingsForm();
            showSettingsMessage("");
            pushActivity("تم فتح لوحة الإدارة.", "text-emerald-300");
            if (dom.loginMessage) dom.loginMessage.textContent = "";
        } catch (error) {
            if (dom.loginMessage) {
                dom.loginMessage.textContent = error.message || "فشل تسجيل الدخول.";
                dom.loginMessage.className = "text-sm font-bold text-red-300";
            }
        } finally {
            if (dom.loginBtn) dom.loginBtn.disabled = false;
        }
    }

    function logout() {
        state.token = "";
        setStoredToken("");
        clearAutoRefreshTimer();
        setSessionUi(false);
        pushActivity("تم إغلاق جلسة الإدارة.", "text-amber-300");
    }

    async function saveSettings() {
        try {
            validateDraftSettings();
            const payload = getDraftSettings();
            showSettingsMessage("جاري حفظ الإعدادات...", "text-sky-300");
            const data = await apiFetch("/api/admin/settings", {
                method: "PUT",
                body: JSON.stringify(payload)
            });
            state.settings = normalizeSettings(data.settings || payload);
            state.lastSyncAt = Date.now();
            updateAutoRefreshTimer();
            renderAll();
            renderSettingsForm();
            showSettingsMessage("تم حفظ الإعدادات ومزامنتها مع المتجر.", "text-emerald-300");
            pushActivity("تم تحديث إعدادات الحاسبة والمتجر.", "text-emerald-300");
        } catch (error) {
            showSettingsMessage(error.message || "فشل حفظ الإعدادات.", "text-red-300");
        }
    }

    function resetSettingsForm() {
        renderSettingsForm();
        showSettingsMessage("تمت إعادة النموذج إلى آخر قيم محفوظة.", "text-slate-300");
    }

    async function savePromo() {
        const code = String(dom.promoCode?.value || "").trim().toUpperCase();
        const type = dom.promoType?.value || "percent";
        const value = Number(dom.promoValue?.value || 0);
        const limit = Number(dom.promoLimit?.value || 0);
        const expiresAt = dom.promoExpiry?.value || "";

        if (!code || value <= 0) {
            if (dom.promoMessage) {
                dom.promoMessage.textContent = "أكمل بيانات العرض قبل الحفظ.";
                dom.promoMessage.className = "text-sm font-bold text-red-300 mb-4";
            }
            return;
        }

        try {
            const data = await apiFetch("/api/admin/promos", {
                method: "POST",
                body: JSON.stringify({
                    code,
                    type,
                    value,
                    limit,
                    expiresAt,
                    used: state.promos.find((promo) => promo.code === code)?.used || 0
                })
            });

            state.promos = Array.isArray(data.promos) ? data.promos : state.promos;
            renderPromos();
            clearPromoForm();
            await refreshState(false, false);
            pushActivity(`تم حفظ العرض ${code}.`, "text-emerald-300");
        } catch (error) {
            if (dom.promoMessage) {
                dom.promoMessage.textContent = error.message || "فشل حفظ العرض.";
                dom.promoMessage.className = "text-sm font-bold text-red-300 mb-4";
            }
        }
    }

    async function deletePromo(code) {
        if (!code) return;
        try {
            const data = await apiFetch(`/api/admin/promos/${encodeURIComponent(code)}`, {
                method: "DELETE"
            });
            state.promos = Array.isArray(data.promos) ? data.promos : [];
            renderPromos();
            await refreshState(false, false);
            pushActivity(`تم حذف العرض ${code}.`, "text-rose-300");
        } catch (error) {
            pushActivity(error.message || "فشل حذف العرض.", "text-red-300");
        }
    }

    async function updateOrder(orderRef) {
        const statusSelect = document.querySelector(`[data-order-status="${CSS.escape(orderRef)}"]`);
        const trackingInput = document.querySelector(`[data-order-tracking="${CSS.escape(orderRef)}"]`);
        if (!statusSelect || !trackingInput) return;

        try {
            const data = await apiFetch(`/api/admin/orders/${encodeURIComponent(orderRef)}`, {
                method: "PUT",
                body: JSON.stringify({
                    status: statusSelect.value,
                    adminTracking: trackingInput.value.trim()
                })
            });

            const nextOrder = data.order || null;
            if (nextOrder) {
                state.orders = state.orders.map((order) => order.orderRef === nextOrder.orderRef ? nextOrder : order);
            }
            await refreshState(false, false);
            pushActivity(`تم تحديث الطلب ${orderRef} إلى ${getStatusLabel(statusSelect.value)}.`, "text-sky-300");
        } catch (error) {
            pushActivity(error.message || `فشل تحديث الطلب ${orderRef}.`, "text-red-300");
        }
    }

    function wireEvents() {
        dom.loginBtn?.addEventListener("click", login);
        dom.pinInput?.addEventListener("keydown", (event) => {
            if (event.key === "Enter") login();
        });
        dom.logoutBtn?.addEventListener("click", logout);
        dom.refreshBtn?.addEventListener("click", () => refreshState(true, false));
        dom.settingsSave?.addEventListener("click", saveSettings);
        dom.settingsReset?.addEventListener("click", resetSettingsForm);
        dom.settingsPreviewUsd?.addEventListener("input", renderDraftPreview);
        dom.promoSave?.addEventListener("click", savePromo);
        dom.promoClear?.addEventListener("click", clearPromoForm);
        dom.ordersSearch?.addEventListener("input", renderOrders);
        dom.ordersStatus?.addEventListener("change", renderOrders);
        dom.ordersSort?.addEventListener("change", renderOrders);

        [
            dom.settingsThresholdLow,
            dom.settingsThresholdMid,
            dom.settingsThresholdHigh,
            dom.settingsRateLow,
            dom.settingsRateMid,
            dom.settingsRateHigh,
            dom.settingsRateBase,
            dom.settingsServiceFee,
            dom.settingsWhatsapp,
            dom.settingsMessenger,
            dom.settingsInstagram,
            dom.settingsAutoRefresh
        ].forEach((element) => {
            element?.addEventListener("input", renderDraftPreview);
        });

        dom.promosList?.addEventListener("click", (event) => {
            const editCode = event.target.closest("[data-edit-promo]")?.getAttribute("data-edit-promo");
            if (editCode) {
                const promo = state.promos.find((item) => item.code === editCode);
                if (promo) fillPromoForm(promo);
                return;
            }

            const deleteCode = event.target.closest("[data-delete-promo]")?.getAttribute("data-delete-promo");
            if (deleteCode) deletePromo(deleteCode);
        });

        dom.ordersTable?.addEventListener("click", (event) => {
            const orderRef = event.target.closest("[data-save-order]")?.getAttribute("data-save-order");
            if (orderRef) updateOrder(orderRef);
        });

        window.addEventListener("beforeunload", clearAutoRefreshTimer);
    }

    async function boot() {
        wireEvents();
        renderActivity();
        renderDraftPreview();

        state.token = getStoredToken();
        setSessionUi(Boolean(state.token));

        if (!state.token) return;

        try {
            await refreshState(false, true);
            pushActivity("تمت استعادة جلسة الإدارة السابقة.", "text-emerald-300");
        } catch {
            logout();
        }
    }

    boot();
})();
