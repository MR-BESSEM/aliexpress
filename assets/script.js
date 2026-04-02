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
        liveRateDisplay: document.getElementById("live-rate-display")
    };

    const state = {
        liveRate: FX_FALLBACK_RATE,
        currentProduct: null,
        previousOnload: typeof window.onload === "function" ? window.onload : null,
        previewCard: null,
        previewImage: null,
        previewTitle: null,
        previewMeta: null,
        previewPrice: null,
        previewLink: null,
        scrapeBtn: null,
        scrapeLoader: null,
        scrapeError: null
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

    function getShippingLabel(value) {
        if (value == null || Number.isNaN(Number(value))) return "غير متوفر";
        if (Number(value) === 0) return "شحن مجاني";
        return `${formatUsd(value)} شحن`;
    }

    function toast(message) {
        if (typeof window.showToast === "function") {
            window.showToast(message);
        }
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
        if (state.previewPrice && state.currentProduct) {
            state.previewPrice.textContent = formatTnd(pricing.finalTnd);
        }

        return pricing;
    }

    function ensureScrapeUi() {
        if (!dom.calcLink) return;

        const linkField = dom.calcLink.parentElement;
        if (linkField && !state.scrapeBtn) {
            const actions = document.createElement("div");
            actions.className = "mt-3 flex flex-col sm:flex-row gap-2";
            actions.innerHTML = `
                <button id="runtime-scrape-btn" type="button" class="bg-blue-600 text-white px-4 py-3 rounded-xl text-xs font-black hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg">
                    <i class="fas fa-wand-magic-sparkles"></i>
                    <span>جلب تلقائي</span>
                </button>
                <div id="runtime-scrape-loader" class="hidden text-[10px] text-blue-400 font-black flex items-center gap-2 px-2">
                    <span class="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                    <span>جاري جلب بيانات المنتج...</span>
                </div>
            `;
            state.scrapeBtn = actions.querySelector("#runtime-scrape-btn");
            state.scrapeLoader = actions.querySelector("#runtime-scrape-loader");
            linkField.appendChild(actions);
        }

        if (!state.scrapeError && linkField) {
            const errorBox = document.createElement("div");
            errorBox.className = "hidden mt-2 text-[10px] text-red-400 font-black";
            linkField.appendChild(errorBox);
            state.scrapeError = errorBox;
        }

        if (!state.previewCard) {
            const previewCard = document.createElement("div");
            previewCard.className = "hidden glass-card p-5 rounded-3xl border border-white/5";
            previewCard.innerHTML = `
                <div class="flex flex-col md:flex-row gap-4 items-center md:items-start auto-align">
                    <img id="runtime-preview-image" src="" alt="Product preview" class="w-24 h-24 rounded-2xl object-cover border border-white/10 bg-slate-900">
                    <div class="flex-1 space-y-3">
                        <div class="flex flex-wrap gap-2 items-center">
                            <span id="runtime-preview-source" class="px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 text-[10px] font-black uppercase">SCRAPE</span>
                            <span id="runtime-preview-meta" class="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black">غير متوفر</span>
                        </div>
                        <h3 id="runtime-preview-title" class="text-sm md:text-lg font-black text-white leading-relaxed">اسم المنتج</h3>
                        <div id="runtime-preview-price" class="text-2xl md:text-3xl font-black text-amber-400" dir="ltr">0.000 TND</div>
                        <a id="runtime-preview-link" href="#" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-white transition-colors">
                            <i class="fas fa-arrow-up-right-from-square"></i>
                            <span>فتح المنتج الأصلي</span>
                        </a>
                    </div>
                </div>
            `;

            const mountAfter = document.querySelector("#section-calc .space-y-5.auto-align");
            if (mountAfter) {
                mountAfter.insertBefore(previewCard, dom.calcName?.parentElement || null);
            }

            state.previewCard = previewCard;
            state.previewImage = previewCard.querySelector("#runtime-preview-image");
            state.previewTitle = previewCard.querySelector("#runtime-preview-title");
            state.previewMeta = previewCard.querySelector("#runtime-preview-meta");
            state.previewPrice = previewCard.querySelector("#runtime-preview-price");
            state.previewLink = previewCard.querySelector("#runtime-preview-link");
        }
    }

    function setLoading(isLoading) {
        if (state.scrapeBtn) {
            state.scrapeBtn.disabled = isLoading;
            state.scrapeBtn.classList.toggle("opacity-70", isLoading);
            state.scrapeBtn.classList.toggle("cursor-not-allowed", isLoading);
        }
        if (state.scrapeLoader) {
            state.scrapeLoader.classList.toggle("hidden", !isLoading);
        }
    }

    function setError(message = "") {
        if (!state.scrapeError) return;
        state.scrapeError.textContent = message;
        state.scrapeError.classList.toggle("hidden", !message);
    }

    function renderPreview(product) {
        ensureScrapeUi();
        state.currentProduct = product;
        if (!state.previewCard) return;

        state.previewCard.classList.remove("hidden");
        state.previewImage.src = product.image || "https://placehold.co/120x120/0f172a/f8fafc?text=AX";
        state.previewTitle.textContent = product.title || "AliExpress Product";
        state.previewMeta.textContent = `${getShippingLabel(product.shipping)} • ⭐ ${(Number(product.rating) || 0).toFixed(1)}`;
        state.previewPrice.textContent = formatTnd(calculatePricingData().finalTnd);
        state.previewLink.href = product.url || "#";

        const sourceBadge = state.previewCard.querySelector("#runtime-preview-source");
        if (sourceBadge) {
            sourceBadge.textContent = String(product.source || "scrape").toUpperCase();
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
            if (dom.usdShip) {
                dom.usdShip.value = data.shipping == null ? "" : Number(data.shipping || 0).toFixed(2);
            }

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

    function patchFunctions() {
        window.calculateTND = renderPricing;
        window.autoScrapeProduct = scrapeProduct;
    }

    function patchInteractions() {
        if (state.scrapeBtn) {
            state.scrapeBtn.addEventListener("click", scrapeProduct);
        }
        dom.calcLink?.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                scrapeProduct();
            }
        });
        dom.usdPrice?.addEventListener("input", renderPricing);
        dom.usdShip?.addEventListener("input", renderPricing);
        dom.calcName?.addEventListener("input", () => {
            if (state.previewTitle && dom.calcName.value.trim()) {
                state.previewTitle.textContent = dom.calcName.value.trim();
            }
        });
    }

    window.onload = async function enhancedOnload(event) {
        ensureScrapeUi();
        patchFunctions();
        if (typeof state.previousOnload === "function") {
            await state.previousOnload.call(window, event);
        }
        patchInteractions();
        await loadLiveRate();
        renderPricing();
        window.setInterval(loadLiveRate, RATE_REFRESH_MS);
    };
})();
