(() => {
    const API_BASE_URL = "";
    const FX_FALLBACK_RATE = 3.8;
    const FX_MARKUP = 0.03;
    const SERVICE_FEE_PERCENT = 0.08;
    const SERVICE_FEE_MIN_TND = 7;
    const RATE_REFRESH_MS = 15 * 60 * 1000;
    const WHATSAPP_NUMBER = "21627498276";

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
        previewPrice: document.getElementById("runtime-preview-price"),
        previewLink: document.getElementById("runtime-preview-link"),
        previewSource: document.getElementById("runtime-preview-source"),
        breakdownCard: document.getElementById("runtime-breakdown-card"),
        breakdownProduct: document.getElementById("runtime-breakdown-product"),
        breakdownShipping: document.getElementById("runtime-breakdown-shipping"),
        breakdownService: document.getElementById("runtime-breakdown-service"),
        breakdownTotal: document.getElementById("runtime-breakdown-total"),
        insightsCard: document.getElementById("runtime-insights-card"),
        deliveryEstimate: document.getElementById("runtime-delivery-estimate"),
        riskBadge: document.getElementById("runtime-risk-badge"),
        alerts: document.getElementById("runtime-alerts"),
        bannedError: document.getElementById("banned-error"),
        bannedErrorText: document.querySelector("#banned-error p"),
        manualQuoteBtn: document.getElementById("runtime-manual-quote"),
        quickOrderBtn: document.getElementById("runtime-quick-order"),
        historyList: document.getElementById("history-items-list"),
        trackResult: document.getElementById("search-result")
    };

    const state = {
        liveRate: FX_FALLBACK_RATE,
        currentProduct: null
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

    function formatUsd(value) {
        return `${Number(value || 0).toFixed(2)} USD`;
    }

    function formatTnd(value) {
        return `${Number(value || 0).toFixed(3)} TND`;
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

    function getRestrictionSummary(product) {
        if (!product?.restrictions) return "";
        if (product.restrictions.banned) return "خطر ديوانة مرتفع";
        if (product.restrictions.restricted) return "يلزم تثبت قبل الطلب";
        return "مقبول مبدئيًا";
    }

    function getEffectiveRate() {
        return Number(state.liveRate || FX_FALLBACK_RATE) * (1 + FX_MARKUP);
    }

    function calculatePricingData() {
        const productUsd = Number.parseFloat(dom.usdPrice?.value || "0") || 0;
        const shippingUsd = Number.parseFloat(dom.usdShip?.value || "0") || 0;
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
        if (dom.breakdownService) dom.breakdownService.textContent = formatTnd(pricing.serviceFee);
        if (dom.breakdownTotal) dom.breakdownTotal.textContent = formatTnd(pricing.finalTnd);
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
        if (state.currentProduct && dom.previewPrice) {
            dom.previewPrice.textContent = formatTnd(pricing.finalTnd);
        }
        if (dom.quickOrderBtn) {
            dom.quickOrderBtn.disabled = pricing.finalTnd <= 0;
            dom.quickOrderBtn.classList.toggle("opacity-60", pricing.finalTnd <= 0);
            dom.quickOrderBtn.classList.toggle("cursor-not-allowed", pricing.finalTnd <= 0);
        }

        renderBreakdown(pricing);
        return pricing;
    }

    function renderPreview(product) {
        state.currentProduct = product;
        if (!dom.previewCard) return;

        dom.previewCard.classList.remove("hidden");
        if (dom.previewImage) {
            dom.previewImage.src = product.image || "https://placehold.co/120x120/0f172a/f8fafc?text=AX";
        }
        if (dom.previewTitle) {
            dom.previewTitle.textContent = product.title || "AliExpress Product";
        }
        if (dom.previewMeta) {
            const metaParts = [
                getShippingLabel(product.shipping),
                `⭐ ${(Number(product.rating) || 0).toFixed(1)}`,
                product.deliveryEstimate ? product.deliveryEstimate : ""
            ].filter(Boolean);
            dom.previewMeta.textContent = metaParts.join(" • ");
        }
        if (dom.previewPrice) {
            dom.previewPrice.textContent = formatTnd(calculatePricingData().finalTnd);
        }
        if (dom.previewLink) {
            dom.previewLink.href = product.url || "#";
        }
        if (dom.previewSource) {
            dom.previewSource.textContent = String(product.source || "scrape").toUpperCase();
        }

        renderAlerts(product);
        renderRestrictionBanner(product);
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
        try {
            const response = await fetch(`${API_BASE_URL}/api/exchange-rate`);
            const data = await response.json();
            if (!response.ok || !data.success || !data.rate) {
                throw new Error("fx-rate-failed");
            }
            state.liveRate = Number(data.rate) || FX_FALLBACK_RATE;
        } catch {
            state.liveRate = FX_FALLBACK_RATE;
        }
        renderPricing();
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

            state.currentProduct = data;
            if (dom.calcName) dom.calcName.value = data.title || "";
            if (dom.usdPrice) dom.usdPrice.value = data.priceUnavailable ? "" : Number(data.price || 0).toFixed(2);
            if (dom.usdShip) dom.usdShip.value = data.shipping == null ? "" : Number(data.shipping || 0).toFixed(2);

            renderPreview(data);
            renderPricing();
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

    function buildManualQuoteMessage() {
        const pricing = calculatePricingData();
        const link = dom.calcLink?.value.trim() || state.currentProduct?.url || "";
        const title = dom.calcName?.value.trim() || state.currentProduct?.title || "منتج من AliExpress";
        const note = dom.calcNote?.value.trim() || "بدون ملاحظات";
        const restrictions = getRestrictionSummary(state.currentProduct);

        return [
            "سلام، نحب تسعيرة يدوية للمنتج هذا:",
            `المنتج: ${title}`,
            `الرابط: ${link || "غير متوفر"}`,
            `السعر: ${formatUsd(pricing.productUsd)}`,
            `الشحن: ${pricing.shippingUsd === 0 ? "شحن مجاني" : formatUsd(pricing.shippingUsd)}`,
            `عمولة الخدمة: ${formatTnd(pricing.serviceFee)}`,
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
        openWhatsAppMessage(buildManualQuoteMessage());
    }

    function quickOrderFromForm() {
        const pricing = calculatePricingData();
        if (pricing.finalTnd <= 0) {
            toast("كمّل بيانات المنتج أولاً");
            return;
        }

        const title = dom.calcName?.value.trim() || state.currentProduct?.title || "منتج من AliExpress";
        const note = dom.calcNote?.value.trim() || "بدون ملاحظات";
        const link = dom.calcLink?.value.trim() || state.currentProduct?.url || "";
        const delivery = state.currentProduct?.deliveryEstimate || "غير متوفر";
        const shippingText = pricing.shippingUsd === 0 ? "شحن مجاني" : formatUsd(pricing.shippingUsd);

        const message = [
            "سلام، نحب نطلب المنتج هذا:",
            `المنتج: ${title}`,
            `الرابط: ${link || "غير متوفر"}`,
            `سعر المنتج: ${formatUsd(pricing.productUsd)}`,
            `الشحن: ${shippingText}`,
            `عمولة الخدمة: ${formatTnd(pricing.serviceFee)}`,
            `الإجمالي النهائي: ${formatTnd(pricing.finalTnd)}`,
            `التوصيل المتوقع: ${delivery}`,
            `المواصفات: ${note}`
        ].join("\n");

        openWhatsAppMessage(message);
    }

    function getCurrentProductMeta() {
        const pricing = calculatePricingData();
        return {
            image: state.currentProduct?.image || "",
            rating: Number(state.currentProduct?.rating || 0),
            shippingUsd: pricing.shippingUsd,
            productUsd: pricing.productUsd,
            serviceFeeTnd: pricing.serviceFee,
            finalTnd: pricing.finalTnd,
            deliveryEstimate: state.currentProduct?.deliveryEstimate || "",
            alerts: state.currentProduct?.alerts || [],
            restrictions: state.currentProduct?.restrictions || null,
            source: state.currentProduct?.source || "manual"
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
            item.totalWithFee = meta.finalTnd;
            item.deliveryEstimate = meta.deliveryEstimate;
            item.alerts = meta.alerts;
            item.restrictions = meta.restrictions;
            item.source = meta.source;

            return item;
        };
    }

    function buildOrderMessage(items, paymentLabel, finalTotal, orderRef) {
        const lines = [`🚀 *طلب جديد Alexpress Tunisie*`, ``, `🧾 *المرجع:* ${orderRef}`, `💳 *الدفع:* ${paymentLabel}`, ``];

        items.forEach((item, index) => {
            lines.push(`📦 *منتج ${index + 1}:* ${item.name}`);
            lines.push(`🔗 الرابط: ${item.link || "غير متوفر"}`);
            lines.push(`🔢 الكمية: ${item.qty || 1}`);
            lines.push(`📝 المواصفات: ${item.note || "بدون ملاحظات"}`);
            lines.push(`💵 سعر المنتج: ${formatUsd(item.productUsd || item.usd || 0)}`);
            lines.push(`🚚 الشحن: ${Number(item.shippingUsd || 0) === 0 ? "شحن مجاني" : formatUsd(item.shippingUsd || 0)}`);
            lines.push(`🧰 عمولة الخدمة: ${formatTnd(item.serviceFeeTnd || 0)}`);
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

            const message = buildOrderMessage(cart, paymentLabel, finalTotal, orderRef);
            pushOrderHistory({
                id: Date.now(),
                orderRef,
                date: new Date().toLocaleString("ar-TN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
                total: finalTotal,
                itemsCount: cart.length,
                items: JSON.parse(JSON.stringify(cart)),
                status: "pending",
                paymentMethod: paymentLabel,
                trackingHint: "بعد ما نطلبوهولك، نبعثولك رقم التتبع على واتساب."
            });

            if (typeof saveData === "function") saveData();
            if (typeof window.renderHistory === "function") window.renderHistory();

            const encoded = encodeURIComponent(message);
            const urls = {
                whatsapp: `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`,
                messenger: `https://m.me/alexpresstunisie?text=${encoded}`,
                instagram: `https://ig.me/m/alexpress.tunisie?text=${encoded}`
            };
            window.open(urls[channel] || urls.whatsapp, "_blank", "noopener,noreferrer");

            clearCartState();
            toast("تم تجهيز الطلب وإرساله!");
        };
    }

    function renderHistoryCard(order) {
        const status = order.status || "pending";
        const statusMap = {
            pending: { label: "في الانتظار", classes: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
            processing: { label: "قيد المعالجة", classes: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
            shipped: { label: "تم الشحن", classes: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
            delivered: { label: "تم التسليم", classes: "text-green-400 bg-green-400/10 border-green-400/20" }
        };
        const statusUi = statusMap[status] || statusMap.pending;
        const items = Array.isArray(order.items) ? order.items : [];

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
                        <div class="text-[10px] text-blue-300 font-bold">${escapeHtml(order.trackingHint || "سيتم إرسال رقم التتبع بعد الشراء.")}</div>
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
        };
    }

    function renderTrackingHint() {
        if (!dom.trackResult || typeof orderHistory === "undefined" || !Array.isArray(orderHistory) || orderHistory.length === 0) return;
        const latest = orderHistory.slice(0, 3);
        const hintHtml = latest.map((order) => `
            <div class="rounded-2xl border border-white/5 bg-slate-900/40 p-3">
                <div class="text-[10px] font-black text-white">${escapeHtml(order.orderRef || String(order.id || ""))}</div>
                <div class="text-[9px] text-slate-400 mt-1">${escapeHtml(order.trackingHint || "سيتم إرسال رقم التتبع بعد الشراء.")}</div>
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

    function bindEvents() {
        dom.scrapeBtn?.addEventListener("click", scrapeProduct);
        dom.manualQuoteBtn?.addEventListener("click", sendManualQuote);
        dom.quickOrderBtn?.addEventListener("click", quickOrderFromForm);
        dom.calcLink?.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                scrapeProduct();
            }
        });
        dom.usdPrice?.addEventListener("input", renderPricing);
        dom.usdShip?.addEventListener("input", renderPricing);
        dom.calcName?.addEventListener("input", () => {
            if (state.currentProduct && dom.previewTitle && dom.calcName.value.trim()) {
                dom.previewTitle.textContent = dom.calcName.value.trim();
            }
        });
    }

    function patchGlobals() {
        window.calculateTND = renderPricing;
        window.autoScrapeProduct = scrapeProduct;
        patchGetFormData();
        patchRenderHistory();
        patchSendOrder();
    }

    function boot() {
        patchGlobals();
        bindEvents();
        loadLiveRate();
        renderPricing();
        if (typeof window.renderHistory === "function") window.renderHistory();
        renderTrackingHint();
        window.setInterval(loadLiveRate, RATE_REFRESH_MS);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
