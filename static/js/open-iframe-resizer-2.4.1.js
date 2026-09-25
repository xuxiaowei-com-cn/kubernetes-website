//#region src/common.ts
var e = () => typeof window < "u", t = () => {
	try {
		return window.self !== window.top;
	} catch {
		return !0;
	}
}, n = (e) => e instanceof HTMLIFrameElement, r = (e) => {
	window.document.readyState === "complete" ? e() : window.addEventListener("load", e, { once: !0 });
}, i = (e, t) => {
	t(), e.addEventListener("load", t, { once: !0 });
}, a = (e, t) => {
	let n = e.contentWindow?.document.readyState === "complete";
	e.src !== "about:blank" && e.contentWindow?.location.href !== "about:blank" && n && t();
}, o = () => ({
	offsetSize: 0,
	checkOrigin: !0,
	enableLegacyLibSupport: !1
});
async function s(e) {
	try {
		return e.contentDocument?.URL === "about:blank" ? new Promise((t) => {
			e.addEventListener("load", () => t(e.contentDocument !== null), { once: !0 });
		}) : e.contentDocument !== null;
	} catch {
		return !1;
	}
}
var c = (e) => {
	try {
		let t = new URL(e.src).origin;
		if (t !== "about:blank") return t;
	} catch {}
	return null;
}, l = (e) => (Object.keys(e).forEach((t) => {
	e[t] === void 0 && delete e[t];
}), e), u = (e) => {
	let { height: t, width: n } = e.getBoundingClientRect();
	return {
		height: Math.ceil(t),
		width: Math.ceil(n)
	};
}, d = (e, t) => e ? t ? e.querySelector(t) : e.documentElement : null, f = (e, t) => {
	e && (t.bodyPadding && (e.body.style.padding = t.bodyPadding), t.bodyMargin && (e.body.style.margin = t.bodyMargin));
}, p = (e) => e <= 100 ? 100 : e <= 120 ? 1e3 : 1e4, m = () => "[iFrameSizer]ID:0:false:false:32:true:true::auto:::0:false:child:auto:true:::true:::false";
function h(e) {
	if (typeof e.data != "string" || !e.data.startsWith("[iFrameSizer]")) return null;
	let t = e.data.endsWith("mutationObserver") || e.data.endsWith("resizeObserver"), n = e.data.search(/:init(:[\d.]+)?/g) >= 0;
	if (!t && !n) return null;
	let [r, i] = e.data.split(":"), a = +i;
	return a > 0 ? a : null;
}
//#endregion
//#region src/parent.ts
var g = T(), _ = [], v = async (t, n) => {
	if (!e()) return [];
	let r = {
		...o(),
		...l(t ?? {})
	}, i = y(n), a = b(r, i);
	return Promise.all(i.map(async (e) => {
		let t = {
			iframe: e,
			settings: r,
			interactionState: { isHovered: !1 },
			initContext: {
				isInitialized: !1,
				retryAttempts: 0
			}
		}, { unsubscribe: n, resize: i } = await x(t, a);
		return _.push(t), {
			unsubscribe: () => {
				n(), _ = _.filter((t) => t.iframe !== e);
			},
			resize: i
		};
	}));
};
function y(e) {
	return typeof e == "string" ? Array.from(document.querySelectorAll(e)).filter(n) : e ? n(e) ? [e] : [] : Array.from(document.getElementsByTagName("iframe"));
}
function b(e, t) {
	if (Array.isArray(e.checkOrigin)) return e.checkOrigin;
	if (!e.checkOrigin) return [];
	let n = [];
	for (let e of t) {
		let t = c(e);
		t && n.push(t);
	}
	return n;
}
async function x(e, t) {
	let { unsubscribe: n, resize: r } = await s(e.iframe) ? C(e) : S(e, t), i = w(e);
	return {
		unsubscribe: () => {
			n(), i();
		},
		resize: r
	};
}
function S(e, t) {
	let { iframe: n, initContext: r, settings: { checkOrigin: a, enableLegacyLibSupport: o, targetElementSelector: s, bodyPadding: c, bodyMargin: l } } = e, u = (r) => {
		let i = r.origin === "null", s = !a || i || t.includes(r.origin);
		if (!(n.contentWindow !== r.source || !s)) {
			if (r.data?.type === "iframe-resized") {
				let { height: t } = r.data;
				t && D({
					newHeight: t,
					registeredElement: e
				});
				return;
			}
			if (o) {
				let t = h(r);
				t !== null && D({
					newHeight: t,
					registeredElement: e
				});
				return;
			}
		}
	};
	window.addEventListener("message", u);
	let d = o ? m() : {
		type: "iframe-child-init",
		targetElementSelector: s,
		bodyPadding: c,
		bodyMargin: l
	}, f = () => {
		i(n, () => n.contentWindow?.postMessage(d, "*")), r.retryAttempts++, r.retryTimeoutId = window.setTimeout(f, p(r.retryAttempts));
	}, g = () => {
		r.isInitialized && (r.isInitialized = !1, r.retryAttempts = 0, f());
	};
	return n.addEventListener("load", g), f(), {
		unsubscribe: () => {
			window.removeEventListener("message", u), n.removeEventListener("load", g);
		},
		resize: () => {
			n.contentWindow?.postMessage({ type: "iframe-get-child-dimensions" }, "*");
		}
	};
}
function C(e) {
	let { iframe: t, settings: n } = e, { targetElementSelector: r } = n, i = 0, o = () => {
		let e = d(t.contentDocument, r);
		if (!t.contentDocument || !e) return i++, setTimeout(o, p(i));
		f(t.contentDocument, n), g().observe(e);
	};
	return a(t, o), t.addEventListener("load", o), {
		unsubscribe: () => {
			let e = d(t.contentDocument, r);
			e && g().unobserve(e), t.removeEventListener("load", o);
		},
		resize: () => E(e)
	};
}
function w({ iframe: e, interactionState: t, settings: n }) {
	if (!n.onBeforeIframeResize && !n.onIframeResize) return () => {};
	let r = () => {
		t.isHovered = !0;
	}, i = () => {
		t.isHovered = !1;
	};
	return e.addEventListener("mouseenter", r), e.addEventListener("mouseleave", i), () => {
		e.removeEventListener("mouseenter", r), e.removeEventListener("mouseleave", i);
	};
}
function T() {
	let e = null;
	return () => {
		if (!e) {
			let t = ({ target: e }) => {
				let t = _.find(({ iframe: t }) => t.contentDocument === e.ownerDocument);
				t && E(t);
			};
			e = new ResizeObserver((e) => e.forEach(t));
		}
		return e;
	};
}
function E(e) {
	let { iframe: t, settings: n } = e, r = d(t.contentDocument, n.targetElementSelector);
	if (!r) return;
	let { height: i } = u(r);
	i && D({
		newHeight: i,
		registeredElement: e
	});
}
function D({ registeredElement: e, newHeight: t }) {
	let { iframe: n, settings: r, interactionState: i, initContext: a } = e;
	if (a.isInitialized || (a.isInitialized = !0, clearTimeout(a.retryTimeoutId)), r.onBeforeIframeResize?.({
		iframe: n,
		interactionState: { ...i },
		settings: { ...r },
		observedHeight: t
	}) === !1) return;
	let o = n.getBoundingClientRect(), s = t + r.offsetSize;
	if (n.style.height = `${s}px`, !r.onIframeResize) return;
	let c = {
		iframe: n,
		settings: { ...r },
		interactionState: { ...i },
		previousRenderState: { rect: o },
		nextRenderState: { rect: n.getBoundingClientRect() }
	};
	r.onIframeResize(c);
}
//#endregion
//#region src/child.ts
var O = P(), k = !1, A;
j();
function j() {
	!e() || !t() || window.addEventListener("message", (e) => {
		if (e.data?.type === "iframe-child-init") return r(() => M(e));
		if (e.data?.type === "iframe-get-child-dimensions") return r(() => N(e));
	});
}
function M(e, t = 0) {
	let { targetElementSelector: n, bodyPadding: r, bodyMargin: i } = e.data, a = d(document, n);
	if (k || window.parent !== e.source) return;
	if (!a) return setTimeout(() => M(e, t + 1), p(t));
	f(document, {
		bodyMargin: i,
		bodyPadding: r
	}), A = n;
	let o = O();
	o.disconnect(), o.observe(a), k = !0;
}
function N(e) {
	let t = d(document, A);
	!k || window.parent !== e.source || !t || F(t);
}
function P() {
	let e = null;
	return () => (e ||= new ResizeObserver((e) => {
		e[0].target && F(e[0].target);
	}), e);
}
var F = (e) => {
	let { width: t, height: n } = u(e), r = {
		type: "iframe-resized",
		width: t,
		height: n
	};
	window.parent.postMessage(r, "*");
}, I = ({ previousRenderState: e, nextRenderState: t, iframe: n }) => {
	document.activeElement === n && window.scrollBy(0, t.rect.bottom - e.rect.bottom);
};
//#endregion
export { v as initialize, j as initializeChildListener, I as updateParentScrollOnResize };
