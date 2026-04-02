(() => {
    const API_BASE_URL = "";
    const FX_FALLBACK_RATE = 3.8;
    const FX_MARKUP = 0.03;
    const SERVICE_FEE_PERCENT = 0.08;
    const SERVICE_FEE_MIN_TND = 7;
    const RATE_REFRESH_MS = 15 * 60 * 1000;

    const dom = {
        calcLink: document.getElementById("calc-link"),
        calcName: document.getElementById("calc-name"),
        calcNote: document.getElementById("calc-note"),
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
        previewSource: document.getElementById("runtime-preview-source")
    };

    const state = {
        liveRate: FX_FALLBACK_RATE,
        currentProduct: null
    };

    function isAliExpressUrl(value) {
        try {
            const parsed = new URL(String(value || "").trim());
            return /(^|\.)aliexpress\.(com|us)$/i.test(parsed.hostname) || /(^|\.)a\.aliexpress\.com$/i.test(parsed.hostname);
        } catch {
            return false;
        }
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

    function getEffectiveRate() {
        return Number(state.liveRate || FX_FALLBACK_RATE) * (1 + FX_MARKUP);
    }

    function calculatePricingData() {
        const productUsd = Number.parseFloat(dom.usdPrice?.value || "0") || 0;
        const shippingUsd = Number.parseFloat(dom.usdShip?.value || "0") || 0;
        const rate = getEffectiveRate();
        const subtotalUsd = productUsd + shippingUsd;
        const subtotalTnd = subtotalUsd * rate;
        const serviceFee = subtotalTnd > 0 ? Math.max(SERVICE_FEE_MIN_TND, subtotalTnd * SERVICE_FEE_PERCENT) : 0;
        const finalTnd = subtotalTnd + serviceFee;

        return {
            productUsd,
            shippingUsd,
            subtotalUsd,
            subtotalTnd,
            serviceFee,
            finalTnd,
            rate
        };
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
            dom.previewMeta.textContent = `${getShippingLabel(product.shipping)} • ⭐ ${(Number(product.rating) || 0).toFixed(1)}`;
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
            if (dom.usdPrice) dom.usdPrice.value = Number(data.price || 0).toFixed(2);
            if (dom.usdShip) dom.usdShip.value = data.shipping == null ? "" : Number(data.shipping || 0).toFixed(2);

            renderPreview(data);
            renderPricing();
            toast("تم جلب البيانات بنجاح! ✨");
        } catch (error) {
            const message = error.message || "خطأ في الاتصال بسيرفر الجلب";
            setError(message);
            toast(message);
        } finally {
            setLoading(false);
        }
    }

    function bindEvents() {
        dom.scrapeBtn?.addEventListener("click", scrapeProduct);
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
    }

    function boot() {
        patchGlobals();
        bindEvents();
        loadLiveRate();
        renderPricing();
        window.setInterval(loadLiveRate, RATE_REFRESH_MS);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
