(() => {
    const API_BASE_URL = "";
    const ADMIN_TOKEN_KEY = "alex_admin_token_v1";

    const dom = {
        loginPanel: document.getElementById("admin-login-panel"),
        app: document.getElementById("admin-app"),
        pinInput: document.getElementById("admin-pin-input"),
        loginBtn: document.getElementById("admin-login-btn"),
        loginMessage: document.getElementById("admin-login-message"),
        logoutBtn: document.getElementById("admin-logout-btn"),
        refreshBtn: document.getElementById("admin-refresh-btn"),
        sessionPill: document.getElementById("admin-session-pill"),
        kpiRevenue: document.getElementById("kpi-revenue"),
        kpiOrders: document.getElementById("kpi-orders"),
        kpiPending: document.getElementById("kpi-pending"),
        kpiDelivered: document.getElementById("kpi-delivered"),
        kpiRisk: document.getElementById("kpi-risk"),
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
        activity: [],
        editingPromoCode: "",
        charts: {
            orders: null,
            products: null
        }
    };

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

    function pushActivity(text, tone = "text-slate-300") {
        state.activity.unshift({
            id: Date.now() + Math.random(),
            text,
            tone,
            time: new Date().toLocaleString("ar-TN", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "2-digit"
            })
        });
        state.activity = state.activity.slice(0, 10);
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
            throw new Error(data.error || `Request failed (${response.status})`);
        }
        return data;
    }

    function formatMoney(value) {
        return `${Number(value || 0).toFixed(3)} TND`;
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function statusTone(status) {
        switch (String(status || "").toLowerCase()) {
            case "delivered":
                return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
            case "shipped":
                return "bg-blue-500/10 text-blue-300 border-blue-500/20";
            case "processing":
                return "bg-amber-500/10 text-amber-300 border-amber-500/20";
            default:
                return "bg-slate-500/10 text-slate-300 border-slate-500/20";
        }
    }

    function orderSearchIndex(order) {
        const items = Array.isArray(order.items) ? order.items.map((item) => item?.name || "").join(" ") : "";
        const customer = `${order.customer?.phone || ""} ${order.customer?.city || ""} ${order.customer?.address || ""}`;
        return `${order.orderRef || ""} ${items} ${customer} ${order.status || ""}`.toLowerCase();
    }

    function setSessionUi(unlocked) {
        dom.loginPanel.classList.toggle("hidden", unlocked);
        dom.app.classList.toggle("hidden", !unlocked);
        dom.logoutBtn.classList.toggle("hidden", !unlocked);
        dom.refreshBtn.classList.toggle("hidden", !unlocked);
        dom.sessionPill.textContent = unlocked ? "🟢 Unlocked" : "🔒 Locked";
        dom.sessionPill.className = `status-pill ${unlocked ? "text-emerald-300" : "text-slate-300"}`;
    }

    function renderKpis() {
        const analytics = state.analytics || {};
        dom.kpiRevenue.textContent = formatMoney(analytics.totalRevenue || 0);
        dom.kpiOrders.textContent = String(analytics.totalOrders || 0);
        dom.kpiPending.textContent = String(analytics.pendingOrders || 0);
        dom.kpiDelivered.textContent = String(analytics.deliveredOrders || 0);
        dom.kpiRisk.textContent = String(analytics.riskyOrders || 0);
    }

    function renderMiniList(host, items, formatter) {
        if (!host) return;
        if (!items.length) {
            host.innerHTML = `<div class="empty-state">لا توجد بيانات حالياً.</div>`;
            return;
        }
        host.innerHTML = items.map(formatter).join("");
    }

    function renderPromos() {
        dom.promosCount.textContent = `${state.promos.length} promos`;
        renderMiniList(dom.promosList, state.promos, (promo) => `
            <div class="mini-item">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <div class="text-sm font-black text-white">${escapeHtml(promo.code)}</div>
                        <div class="text-xs text-slate-400 mt-1">
                            ${promo.type === "percent" ? `${promo.value}%` : `${promo.value} TND`}
                            • used ${Number(promo.used || 0)}/${Number(promo.limit || 0) || "∞"}
                            ${promo.expiresAt ? `• ${escapeHtml(promo.expiresAt)}` : ""}
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn btn-ghost !px-3 !py-2 text-xs" data-edit-promo="${escapeHtml(promo.code)}">تعديل</button>
                        <button class="btn btn-danger !px-3 !py-2 text-xs" data-delete-promo="${escapeHtml(promo.code)}">حذف</button>
                    </div>
                </div>
            </div>
        `);
    }

    function filteredOrders() {
        const query = String(dom.ordersSearch.value || "").trim().toLowerCase();
        const status = dom.ordersStatus.value || "all";
        const sort = dom.ordersSort.value || "newest";

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
        const rows = filteredOrders();
        if (!rows.length) {
            dom.ordersTable.innerHTML = `<tr><td colspan="8"><div class="empty-state">ما لقيناش طلبات بهذا الفلتر.</div></td></tr>`;
            return;
        }

        dom.ordersTable.innerHTML = rows.map((order) => {
            const customer = [order.customer?.phone, order.customer?.city].filter(Boolean).join(" • ") || "غير متوفر";
            const itemsHtml = Array.isArray(order.items) && order.items.length
                ? order.items.slice(0, 2).map((item) => `<div class="text-xs text-slate-300">${escapeHtml(item?.name || "Item")}</div>`).join("")
                : `<div class="text-xs text-slate-500">No items</div>`;

            return `
                <tr>
                    <td>
                        <div class="font-black text-white">${escapeHtml(order.orderRef || "")}</div>
                        <div class="text-xs text-slate-500 mt-1">${escapeHtml(order.paymentMethod || "No payment")}</div>
                    </td>
                    <td>
                        <div class="text-sm text-slate-200">${escapeHtml(order.date || "")}</div>
                        <div class="text-xs text-slate-500 mt-1">${escapeHtml(order.updatedAt || "")}</div>
                    </td>
                    <td>
                        <div class="text-sm text-slate-200">${escapeHtml(customer)}</div>
                    </td>
                    <td>${itemsHtml}</td>
                    <td>
                        <span class="status-pill ${statusTone(order.status)}">${escapeHtml(order.status || "pending")}</span>
                    </td>
                    <td>
                        <div class="font-black text-white">${formatMoney(order.total || 0)}</div>
                        <div class="text-xs text-slate-500 mt-1">${Number(order.itemsCount || 0)} items</div>
                    </td>
                    <td>
                        <div class="text-sm text-slate-200">${escapeHtml(order.adminTracking || order.trackingHint || "—")}</div>
                        <div class="text-xs text-slate-500 mt-1">${escapeHtml(order.promoCode || "")}</div>
                    </td>
                    <td>
                        <div class="grid gap-2">
                            <select class="select text-xs" data-order-status="${escapeHtml(order.orderRef || "")}">
                                <option value="pending" ${order.status === "pending" ? "selected" : ""}>pending</option>
                                <option value="processing" ${order.status === "processing" ? "selected" : ""}>processing</option>
                                <option value="shipped" ${order.status === "shipped" ? "selected" : ""}>shipped</option>
                                <option value="delivered" ${order.status === "delivered" ? "selected" : ""}>delivered</option>
                            </select>
                            <input class="field text-xs" data-order-tracking="${escapeHtml(order.orderRef || "")}" value="${escapeHtml(order.adminTracking || "")}" placeholder="Tracking">
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
                labels: ["Pending", "Delivered", "Risk"],
                datasets: [{
                    data: [
                        Number(analytics.pendingOrders || 0),
                        Number(analytics.deliveredOrders || 0),
                        Number(analytics.riskyOrders || 0)
                    ],
                    backgroundColor: ["#fbbf24", "#34d399", "#fb7185"],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "68%",
                plugins: {
                    legend: {
                        labels: {
                            color: "#cbd5e1",
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
                    const label = String(item.name || "Unnamed").trim();
                    return label.length > 20 ? `${label.slice(0, 20)}...` : label;
                }),
                datasets: [{
                    label: "Orders",
                    data: topProducts.map((item) => Number(item.count || 0)),
                    borderRadius: 12,
                    backgroundColor: ["#60a5fa", "#38bdf8", "#fbbf24", "#34d399", "#a78bfa"]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        ticks: { color: "#cbd5e1", font: { family: "Cairo", weight: "700" } },
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
                <strong>${escapeHtml(item.id || "Unknown")}</strong>
                <span class="text-slate-500">• ${Number(item.ordersCount || 0)} orders</span>
            </div>
        `);
        renderMiniList(dom.topPromosList, analytics.topPromos || [], (item) => `
            <div class="text-sm text-slate-200">
                <strong>${escapeHtml(item.code || "N/A")}</strong>
                <span class="text-slate-500">• used ${Number(item.used || 0)}</span>
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
        dom.promoCode.value = promo.code || "";
        dom.promoType.value = promo.type || "percent";
        dom.promoValue.value = promo.value ?? "";
        dom.promoLimit.value = promo.limit ?? "";
        dom.promoExpiry.value = promo.expiresAt ? String(promo.expiresAt).slice(0, 16) : "";
        state.editingPromoCode = promo.code || "";
        dom.promoMessage.textContent = `Editing ${promo.code}`;
        dom.promoMessage.className = "text-sm font-bold text-blue-300 mb-4";
    }

    function clearPromoForm() {
        dom.promoCode.value = "";
        dom.promoType.value = "percent";
        dom.promoValue.value = "";
        dom.promoLimit.value = "";
        dom.promoExpiry.value = "";
        state.editingPromoCode = "";
        dom.promoMessage.textContent = "";
        dom.promoMessage.className = "text-sm font-bold text-slate-400 mb-4";
    }

    function normalizeFetchedState(data) {
        state.promos = Array.isArray(data.promos) ? data.promos : [];
        state.orders = Array.isArray(data.orders) ? data.orders : [];
        state.analytics = data.analytics || {};
    }

    function renderAll() {
        renderKpis();
        renderPromos();
        renderOrders();
        renderCharts();
        renderInsights();
        renderActivity();
    }

    async function refreshState(showMessage = true) {
        const data = await apiFetch("/api/admin/state");
        normalizeFetchedState(data);
        renderAll();
        if (showMessage) {
            pushActivity("تم تحديث بيانات الإدارة.", "text-emerald-300");
        }
    }

    async function login() {
        const pin = String(dom.pinInput.value || "").trim();
        if (!pin) {
            dom.loginMessage.textContent = "دخل PIN الإدارة.";
            dom.loginMessage.className = "text-sm font-bold text-red-300";
            return;
        }
        dom.loginBtn.disabled = true;
        dom.loginMessage.textContent = "جارٍ فتح الجلسة...";
        dom.loginMessage.className = "text-sm font-bold text-blue-300";

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
            pushActivity("تم فتح Admin Studio بنجاح.", "text-emerald-300");
            dom.loginMessage.textContent = "";
        } catch (error) {
            dom.loginMessage.textContent = error.message || "فشل الدخول.";
            dom.loginMessage.className = "text-sm font-bold text-red-300";
        } finally {
            dom.loginBtn.disabled = false;
        }
    }

    function logout() {
        state.token = "";
        setStoredToken("");
        setSessionUi(false);
        pushActivity("تم تسجيل الخروج من الإدارة.", "text-amber-300");
    }

    async function savePromo() {
        const code = String(dom.promoCode.value || "").trim().toUpperCase();
        const type = dom.promoType.value || "percent";
        const value = Number(dom.promoValue.value || 0);
        const limit = Number(dom.promoLimit.value || 0);
        const expiresAt = dom.promoExpiry.value || "";

        if (!code || value <= 0) {
            dom.promoMessage.textContent = "كمّل بيانات البرومو كما يلزم.";
            dom.promoMessage.className = "text-sm font-bold text-red-300 mb-4";
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
            await refreshState(false);
            pushActivity(`تم حفظ البرومو ${code}.`, "text-emerald-300");
        } catch (error) {
            dom.promoMessage.textContent = error.message || "Promo save failed.";
            dom.promoMessage.className = "text-sm font-bold text-red-300 mb-4";
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
            await refreshState(false);
            pushActivity(`تم حذف البرومو ${code}.`, "text-rose-300");
        } catch (error) {
            pushActivity(error.message || "فشل حذف البرومو.", "text-red-300");
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
            await refreshState(false);
            pushActivity(`تم تحديث ${orderRef} إلى ${statusSelect.value}.`, "text-blue-300");
        } catch (error) {
            pushActivity(error.message || `فشل تحديث ${orderRef}.`, "text-red-300");
        }
    }

    function wireEvents() {
        dom.loginBtn?.addEventListener("click", login);
        dom.pinInput?.addEventListener("keydown", (event) => {
            if (event.key === "Enter") login();
        });
        dom.logoutBtn?.addEventListener("click", logout);
        dom.refreshBtn?.addEventListener("click", () => refreshState());
        dom.promoSave?.addEventListener("click", savePromo);
        dom.promoClear?.addEventListener("click", clearPromoForm);
        dom.ordersSearch?.addEventListener("input", renderOrders);
        dom.ordersStatus?.addEventListener("change", renderOrders);
        dom.ordersSort?.addEventListener("change", renderOrders);

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
    }

    async function boot() {
        wireEvents();
        state.token = getStoredToken();
        setSessionUi(Boolean(state.token));
        renderActivity();

        if (!state.token) return;

        try {
            await refreshState(false);
            pushActivity("تم استرجاع جلسة الإدارة.", "text-emerald-300");
        } catch {
            logout();
        }
    }

    boot();
})();
