const Y = () => typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
class Z {
  constructor() {
    this.pending = /* @__PURE__ */ new Map(), this.subscribers = /* @__PURE__ */ new Map(), this.handleMessage = (e) => {
      const t = e.data;
      if (!(!t || typeof t != "object")) {
        if (t.kind === "response") {
          this.handleResponse(t);
          return;
        }
        t.kind === "push" && this.handlePush(t);
      }
    }, self.addEventListener("message", this.handleMessage);
  }
  call(e, t) {
    const i = Y(), s = { kind: "request", id: i, method: e, params: t };
    return new Promise((c, l) => {
      this.pending.set(i, { resolve: c, reject: l }), self.postMessage(s);
    });
  }
  emit(e, t) {
    const i = { kind: "event", method: e, params: t };
    self.postMessage(i);
  }
  subscribe(e, t) {
    let i = this.subscribers.get(e);
    return i || (i = /* @__PURE__ */ new Set(), this.subscribers.set(e, i)), i.add(t), () => {
      i?.delete(t);
    };
  }
  handleResponse(e) {
    const t = this.pending.get(e.id);
    t && (this.pending.delete(e.id), e.ok ? t.resolve(e.result) : t.reject(new Error(e.error ?? "RPC call failed.")));
  }
  handlePush(e) {
    const t = this.subscribers.get(e.channel);
    if (t?.size)
      for (const i of [...t])
        i(e.payload);
  }
}
let z = null;
const ee = () => (z || (z = new Z()), z), U = /* @__PURE__ */ new Map(), te = (n) => String(n ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"), ie = (n) => {
  const e = U.get(n);
  if (e)
    return e;
  const t = n.replace(/\bthis\b/g, "__item"), i = new Function("scope", `with (scope) { return (${t}); }`);
  return U.set(n, i), i;
}, A = (n, e) => {
  try {
    return ie(n)(e);
  } catch {
    return "";
  }
}, C = (n, e = 0, t) => {
  const i = [];
  let s = e;
  for (; s < n.length; ) {
    const c = n.indexOf("{{", s);
    if (c === -1)
      return i.push({ type: "text", value: n.slice(s) }), { nodes: i, index: n.length };
    c > s && i.push({ type: "text", value: n.slice(s, c) });
    const l = n.indexOf("}}", c + 2);
    if (l === -1)
      return i.push({ type: "text", value: n.slice(c) }), { nodes: i, index: n.length };
    const d = n.slice(c + 2, l).trim();
    if (s = l + 2, d === "/if" || d === "/each") {
      if (t === d)
        return { nodes: i, index: s };
      i.push({ type: "text", value: `{{${d}}}` });
      continue;
    }
    if (d.startsWith("#if ")) {
      const p = C(n, s, "/if");
      i.push({
        type: "if",
        condition: d.slice(4).trim(),
        children: p.nodes
      }), s = p.index;
      continue;
    }
    if (d.startsWith("#each ")) {
      const p = C(n, s, "/each");
      i.push({
        type: "each",
        source: d.slice(6).trim(),
        children: p.nodes
      }), s = p.index;
      continue;
    }
    i.push({ type: "expr", value: d });
  }
  return { nodes: i, index: s };
}, k = (n, e) => {
  let t = "";
  for (const i of n) {
    if (i.type === "text") {
      t += i.value;
      continue;
    }
    if (i.type === "expr") {
      t += te(A(i.value, e));
      continue;
    }
    if (i.type === "if") {
      A(i.condition, e) && (t += k(i.children, e));
      continue;
    }
    const s = A(i.source, e);
    if (Array.isArray(s))
      for (const c of s) {
        const l = Object.create(e);
        l.__item = c, t += k(i.children, l);
      }
  }
  return t;
}, re = (n) => {
  const e = C(n).nodes;
  return (t) => k(e, t);
}, ne = (n) => {
  if (typeof n != "function")
    return !1;
  const e = n;
  return e._isSignal === !0 && typeof e.set == "function" && typeof e.subscribe == "function";
}, P = (n) => {
  let e = n;
  const t = /* @__PURE__ */ new Set(), i = (() => e);
  return i._isSignal = !0, i.set = (s) => {
    if (!Object.is(e, s)) {
      e = s;
      for (const c of t)
        c(e);
    }
  }, i.update = (s) => {
    i.set(s(e));
  }, i.subscribe = (s) => (t.add(s), () => t.delete(s)), i;
}, se = /* @__PURE__ */ new Set([
  // Worker/message-channel plumbing the RPC layer itself needs.
  "self",
  "postMessage",
  "addEventListener",
  "removeEventListener",
  "dispatchEvent",
  "onmessage",
  "onmessageerror",
  "onerror",
  "onunhandledrejection",
  "onrejectionhandled",
  "name",
  "close",
  // Timers / scheduling.
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
  "queueMicrotask",
  // Pure computation / encoding -- no network, no storage, no cross-context reach.
  "crypto",
  "Crypto",
  "CryptoKey",
  "SubtleCrypto",
  "TextEncoder",
  "TextDecoder",
  "structuredClone",
  "atob",
  "btoa",
  "URL",
  "URLSearchParams",
  "AbortController",
  "AbortSignal",
  // Pure string -> detached-tree parsing, no network/storage/rendering side
  // effects (parsed <script> tags are inert) -- safe to keep in a worker.
  "DOMParser",
  "XMLSerializer",
  "console",
  "performance",
  "Performance",
  "PerformanceEntry",
  "PerformanceMark",
  "PerformanceMeasure",
  // Standard ECMAScript built-ins.
  "Object",
  "Array",
  "Function",
  "Boolean",
  "Symbol",
  "Error",
  "EvalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError",
  "AggregateError",
  "Number",
  "BigInt",
  "Math",
  "Date",
  "String",
  "RegExp",
  "JSON",
  "Promise",
  "Proxy",
  "Reflect",
  "Map",
  "Set",
  "WeakMap",
  "WeakSet",
  "WeakRef",
  "FinalizationRegistry",
  "ArrayBuffer",
  "SharedArrayBuffer",
  "DataView",
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Uint16Array",
  "Int32Array",
  "Uint32Array",
  "Float32Array",
  "Float64Array",
  "BigInt64Array",
  "BigUint64Array",
  "globalThis",
  "undefined",
  "NaN",
  "Infinity",
  "parseInt",
  "parseFloat",
  "isNaN",
  "isFinite",
  "encodeURIComponent",
  "decodeURIComponent",
  "encodeURI",
  "decodeURI"
]), oe = () => {
  const n = self;
  for (const e of Object.getOwnPropertyNames(n))
    if (!se.has(e))
      try {
        delete n[e];
      } catch {
      }
};
oe();
const ae = (n, e) => {
  const t = [];
  for (const i of Object.keys(n)) {
    const s = n[i];
    ne(s) && t.push(s.subscribe(() => e()));
  }
  return () => {
    for (const i of t)
      i();
  };
}, ce = (n, e) => new Proxy(
  { payload: e },
  {
    get(t, i) {
      if (typeof i != "string")
        return;
      if (i in t)
        return t[i];
      const s = n[i];
      return typeof s == "function" ? s.bind(n) : s;
    },
    has(t, i) {
      return typeof i != "string" ? !1 : i in t || i in n;
    }
  }
), F = "{{ASSETS}}", le = /\{\{pack-install-path\}\}\/([^"')\s]+)/g, L = (n, e) => {
  const t = e.trim().replace(/^\.\/+/, "").replace(/^\/+/, "");
  return !n || !t ? e : `${n.replace(/\/+$/, "")}/${t}`;
}, I = (n, e) => {
  if (!e)
    return n;
  let t = n;
  return t.includes(F) && (t = t.replaceAll(F, e)), t.replace(le, (i, s) => L(e, s));
};
class de {
  constructor(e, t) {
    this.rpc = e, this.selector = t;
  }
  setText(e) {
    this.rpc.emit("dom.setText", { selector: this.selector, text: e });
  }
  setAttribute(e, t) {
    this.rpc.emit("dom.setAttribute", { selector: this.selector, name: e, value: t });
  }
  removeAttribute(e) {
    this.rpc.emit("dom.removeAttribute", { selector: this.selector, name: e });
  }
  setStyle(e, t) {
    this.rpc.emit("dom.setStyle", { selector: this.selector, property: e, value: t });
  }
  addClass(...e) {
    this.rpc.emit("dom.addClass", { selector: this.selector, names: e });
  }
  removeClass(...e) {
    this.rpc.emit("dom.removeClass", { selector: this.selector, names: e });
  }
  toggleClass(e, t) {
    this.rpc.emit("dom.toggleClass", { selector: this.selector, name: e, on: t });
  }
  async getRect() {
    return this.rpc.call("dom.getRect", { selector: this.selector });
  }
}
let ue = class {
  get config() {
    return this._getConfig();
  }
  /** The full payload the host mounted this widget with (id, name,
   * directory, configuredWidgetId, config) -- most packs only need
   * `config`, but this is available for cases that need the widget's own
   * identity, e.g. distinguishing which manifest entry a shared bundle is
   * running as. */
  get payload() {
    return this._getPayload();
  }
  on(e, t, i) {
    return this._onRegister(e, t, i);
  }
  /** Pushed by the host's real ResizeObserver on the mount element -- a
   * worker can't do a synchronous getBoundingClientRect() read cheaply
   * (every read would be a round-trip), so this is push, not pull. */
  onResize(e) {
    return this._onResizeRegister(e);
  }
  /** Internal: called once by createWidgetClass() right after construction. */
  _attach(e) {
    this.dom = e.dom, this.assets = e.assets, this.network = e.network, this.media = e.media, this.audio = e.audio, this.metrics = e.metrics, this.storage = e.storage, this.permissions = e.permissions, this.app = e.app, this._getConfig = e.getConfig, this._getPayload = e.getPayload, this._onRegister = e.onRegister, this._onResizeRegister = e.onResizeRegister;
  }
};
const he = (n, e) => {
  const t = ee();
  let i = null, s = {}, c = {}, l = "", d = [], p = [], f = !1, g = !1, W = () => {
  };
  const b = /* @__PURE__ */ new Map();
  let _ = null;
  const O = (r, o, a) => {
    let u = b.get(r);
    u || (u = /* @__PURE__ */ new Map(), b.set(r, u));
    let h = u.get(o);
    return h || (h = /* @__PURE__ */ new Set(), u.set(o, h), t.emit("on.register", { eventName: r, selector: o })), h.add(a), _ ??= t.subscribe("dom-event", (x) => {
      const m = x, w = b.get(m.eventName)?.get(m.selector);
      if (w)
        for (const Q of [...w])
          Q(m);
    }), () => {
      h?.delete(a);
    };
  }, v = /* @__PURE__ */ new Set();
  let T = null;
  const D = (r) => (v.add(r), T ??= t.subscribe("resize", (o) => {
    const a = o;
    for (const u of [...v])
      u(a);
  }), () => {
    v.delete(r);
  }), j = {
    fetch: (r) => t.call("network.fetch", { url: r }),
    fetchAsDataUrl: (r) => t.call("network.fetchAsDataUrl", { url: r }),
    checkIframeEmbeddable: (r) => t.call("app.checkIframeEmbeddable", { url: r }),
    request: (r, o) => t.call("network.request", {
      url: r,
      method: o?.method ?? "GET",
      headers: o?.headers,
      body: o?.body
    })
  }, q = {
    get: (r) => t.call("storage.get", { key: r }),
    set: (r, o) => t.call("storage.set", { key: r, value: o }),
    remove: (r) => t.call("storage.remove", { key: r })
  }, S = /* @__PURE__ */ new Map();
  let E = null;
  const H = {
    playHls: (r) => t.call("media.playHls", { url: r }),
    stop: () => t.call("media.stop"),
    setVolume: (r) => t.call("media.setVolume", { volume: r }),
    setMuted: (r) => t.call("media.setMuted", { muted: r }),
    on: (r, o) => {
      let a = S.get(r);
      return a || (a = /* @__PURE__ */ new Set(), S.set(r, a)), a.add(o), E ??= t.subscribe("media-event", (u) => {
        const { eventName: h, detail: x } = u, m = S.get(h);
        if (m)
          for (const w of [...m])
            w(x);
      }), () => {
        a?.delete(o);
      };
    }
  }, $ = {
    listDevices: (r) => t.call("audio.listDevices", { vendor: r }),
    setVolume: (r, o, a) => t.call("audio.setVolume", { vendor: r, deviceId: o, volumePercent: a }),
    setMuted: (r, o, a) => t.call("audio.setMuted", { vendor: r, deviceId: o, muted: a })
  };
  let M = null, y = null;
  const V = {
    subscribe: (r, o) => (y = o, M ??= t.subscribe("metrics-update", (a) => {
      y?.(a);
    }), t.call("metrics.subscribe", { intervalMs: r }), () => {
      y = null, t.call("metrics.unsubscribe").catch(() => {
      });
    })
  }, B = {
    has: (r) => d.includes(r),
    get requested() {
      return p;
    }
  }, J = {
    setLoading: (r) => t.emit("app.setLoading", { loading: r }),
    focusView: () => t.call("app.focusView"),
    setRequireFocus: (r) => t.call("app.setRequireFocus", { required: r }),
    isViewFocused: () => t.call("app.isViewFocused"),
    switchView: (r) => t.call("app.switchView", { viewNumber: r })
  }, G = {
    query: (r) => new de(t, r)
  }, K = {
    resolve: (r) => L(l, r)
  }, R = () => {
    if (f = !1, !i || g)
      return;
    const r = ce(i, s), o = I(e.template, l), a = I(e.styles, l), h = re(o)(r);
    t.emit("render", { html: h, styles: a }), i.afterRender?.();
  }, X = () => {
    f || g || (f = !0, queueMicrotask(() => {
      !g && f && R();
    }));
  };
  t.subscribe("init", (r) => {
    const o = r;
    s = o.payload ?? {}, c = o.config ?? {}, l = o.assetsBaseUrl ?? "", d = o.grantedPermissions ?? [], p = o.requestedPermissions ?? [], i = new n(), i._attach({
      dom: G,
      assets: K,
      network: j,
      media: H,
      audio: $,
      metrics: V,
      storage: q,
      permissions: B,
      app: J,
      getConfig: () => c,
      getPayload: () => s,
      onRegister: O,
      onResizeRegister: D
    }), W = ae(i, X), i.onInit?.(), R();
  }), t.subscribe("payload-update", (r) => {
    const o = r;
    s = o.payload ?? {}, c = o.config ?? {}, i?.onUpdate?.(s), R();
  }), t.subscribe("destroy", () => {
    g = !0, f = !1, W(), _?.(), T?.(), E?.(), M?.(), y && (y = null, t.call("metrics.unsubscribe").catch(() => {
    })), i?.onDestroy?.();
  }), t.emit("ready");
};
let pe = class extends ue {
  constructor() {
    super(...arguments), this.refreshTimer = null, this.lastConfigFingerprint = "", this.activatedOptions = P(0), this.cityName = P(null), this.currentWeather = P(null);
  }
  onInit() {
    this.lastConfigFingerprint = this.configFingerprint(), this.refreshWeather();
  }
  onUpdate() {
    const e = this.configFingerprint();
    e !== this.lastConfigFingerprint && (this.lastConfigFingerprint = e, this.refreshWeather());
  }
  onDestroy() {
    this.refreshTimer && (clearTimeout(this.refreshTimer), this.refreshTimer = null);
  }
  unitsLabel() {
    return this.units() === "metric" ? "°C" : "°F";
  }
  windLabel() {
    return this.units() === "metric" ? "m/s" : "mph";
  }
  precipitationLabel() {
    return this.units() === "metric" ? "mm" : "in";
  }
  weatherIconUrl() {
    return `img/${this.currentWeather()?.weatherCondition?.icon ?? "unknown"}.svg`;
  }
  weatherFeatureClass() {
    return `has-features-${this.activatedOptions()}`;
  }
  showWindSpeed() {
    return !!this.config.showWindSpeed;
  }
  showPrecipitation() {
    return !!this.config.showPrecipitation;
  }
  showCity() {
    return !!this.config.showCity;
  }
  temperatureText() {
    const e = this.currentWeather()?.temperature;
    return e == null ? "--" : String(e);
  }
  windspeedText() {
    const e = this.currentWeather()?.windspeed;
    return e == null ? "--" : String(e);
  }
  precipitationText() {
    const e = this.currentWeather()?.precipitation;
    return e == null ? "0" : String(e);
  }
  precipitationProbabilityText() {
    const e = this.currentWeather()?.precipitationProbability;
    return e == null ? "0" : String(e);
  }
  latitude() {
    return Number(this.config.latitude ?? 0);
  }
  longitude() {
    return Number(this.config.longitude ?? 0);
  }
  intervalMinutes() {
    return Math.max(1, Number(this.config.interval ?? 10) || 10);
  }
  units() {
    return String(this.config.units ?? "metric") === "imperial" ? "imperial" : "metric";
  }
  configFingerprint() {
    return JSON.stringify({
      latitude: this.latitude(),
      longitude: this.longitude(),
      interval: this.intervalMinutes(),
      units: this.units(),
      showWindSpeed: this.showWindSpeed(),
      showPrecipitation: this.showPrecipitation(),
      showCity: this.showCity()
    });
  }
  async refreshWeather() {
    if (this.refreshTimer && (clearTimeout(this.refreshTimer), this.refreshTimer = null), !this.permissions.has("network")) {
      this.app.setLoading(!1);
      return;
    }
    this.app.setLoading(!0), this.recomputeActivatedOptions();
    try {
      let e = "temperature_2m,weathercode,is_day";
      this.showWindSpeed() && (e += ",windspeed_10m,winddirection_10m"), this.showPrecipitation() && (e += ",precipitation,precipitation_probability");
      const t = new URLSearchParams({
        latitude: this.latitude().toString(),
        longitude: this.longitude().toString(),
        temperature_unit: this.units() === "metric" ? "celsius" : "fahrenheit",
        windspeed_unit: this.units() === "metric" ? "kmh" : "mph",
        precipitation_unit: this.units() === "metric" ? "mm" : "inch",
        current: e
      }), i = JSON.parse(
        await this.network.fetch(`https://api.open-meteo.com/v1/forecast?${t.toString()}`)
      );
      this.currentWeather.set({
        temperature: i.current.temperature_2m,
        isDay: i.current.is_day === 1,
        weatherCondition: this.weatherMapping(i.current.weathercode, i.current.is_day === 1),
        windspeed: this.showWindSpeed() ? i.current.windspeed_10m ?? null : null,
        precipitation: this.showPrecipitation() ? i.current.precipitation ?? null : null,
        precipitationProbability: this.showPrecipitation() ? i.current.precipitation_probability ?? null : null
      }), this.showCity() ? await this.refreshCityName() : this.cityName.set(null);
    } catch (e) {
      console.error("[SimpleWeather] Failed to refresh weather", e);
    } finally {
      this.app.setLoading(!1), this.refreshTimer = setTimeout(() => {
        this.refreshWeather();
      }, this.intervalMinutes() * 60 * 1e3);
    }
  }
  async refreshCityName() {
    try {
      const e = new URLSearchParams({
        lat: this.latitude().toString(),
        lon: this.longitude().toString(),
        format: "json"
      }), i = JSON.parse(
        await this.network.fetch(`https://nominatim.openstreetmap.org/reverse?${e.toString()}`)
      ).address ?? {}, s = i.city ?? i.town ?? i.village ?? i.municipality ?? i.hamlet ?? i.county ?? i.state_district ?? null;
      this.cityName.set(s);
    } catch (e) {
      console.error("[SimpleWeather] Failed to refresh city name", e), this.cityName.set("Unknown");
    }
  }
  recomputeActivatedOptions() {
    let e = 0;
    this.showWindSpeed() && (e += 1), this.showPrecipitation() && (e += 1), this.showCity() && (e += 1), this.activatedOptions.set(e);
  }
  weatherMapping(e, t) {
    return {
      0: { name: "clear", icon: t ? "clear-day" : "clear-night" },
      1: { name: "partly-cloudy", icon: t ? "partly-cloudy-day" : "partly-cloudy-night" },
      2: { name: "cloudy", icon: t ? "overcast-day" : "overcast-night" },
      3: { name: "cloudy", icon: t ? "overcast-day" : "overcast-night" },
      45: { name: "fog", icon: t ? "fog-day" : "fog-night" },
      48: { name: "fog", icon: t ? "fog-day" : "fog-night" },
      51: { name: "drizzle", icon: t ? "partly-cloudy-day-drizzle" : "partly-cloudy-night-drizzle" },
      53: { name: "drizzle", icon: t ? "partly-cloudy-day-drizzle" : "partly-cloudy-night-drizzle" },
      55: { name: "drizzle", icon: t ? "partly-cloudy-day-drizzle" : "partly-cloudy-night-drizzle" },
      56: { name: "freezing-drizzle", icon: t ? "partly-cloudy-day-sleet" : "partly-cloudy-night-sleet" },
      57: { name: "freezing-drizzle", icon: t ? "partly-cloudy-day-sleet" : "partly-cloudy-night-sleet" },
      61: { name: "rain", icon: t ? "partly-cloudy-day-rain" : "partly-cloudy-night-rain" },
      63: { name: "rain", icon: t ? "partly-cloudy-day-rain" : "partly-cloudy-night-rain" },
      65: { name: "rain", icon: t ? "partly-cloudy-day-rain" : "partly-cloudy-night-rain" },
      66: { name: "freezing-rain", icon: t ? "partly-cloudy-day-sleet" : "partly-cloudy-night-sleet" },
      67: { name: "freezing-rain", icon: t ? "partly-cloudy-day-sleet" : "partly-cloudy-night-sleet" },
      71: { name: "snow", icon: t ? "partly-cloudy-day-snow" : "partly-cloudy-night-snow" },
      73: { name: "snow", icon: t ? "partly-cloudy-day-snow" : "partly-cloudy-night-snow" },
      75: { name: "snow", icon: t ? "partly-cloudy-day-snow" : "partly-cloudy-night-snow" },
      77: { name: "snow-grains", icon: t ? "partly-cloudy-day-snow" : "partly-cloudy-night-snow" },
      80: { name: "rain-showers", icon: t ? "partly-cloudy-day-rain" : "partly-cloudy-night-rain" },
      81: { name: "rain-showers", icon: t ? "partly-cloudy-day-rain" : "partly-cloudy-night-rain" },
      82: { name: "rain-showers", icon: t ? "partly-cloudy-day-rain" : "partly-cloudy-night-rain" },
      85: { name: "snow-showers", icon: t ? "partly-cloudy-day-snow" : "partly-cloudy-night-snow" },
      86: { name: "snow-showers", icon: t ? "partly-cloudy-day-snow" : "partly-cloudy-night-snow" },
      95: { name: "thunderstorm", icon: t ? "thunderstorms-day-rain" : "thunderstorms-night-rain" },
      96: { name: "thunderstorm", icon: t ? "thunderstorms-day-rain" : "thunderstorms-night-rain" },
      99: { name: "thunderstorm", icon: t ? "thunderstorms-day-rain" : "thunderstorms-night-rain" }
    }[e] ?? { name: "unknown", icon: "unknown" };
  }
};
const me = `{{#if currentWeather()}}
  <div class="weather pop-in {{ weatherFeatureClass() }}">
    <div class="icon-wrap">
      <img src="{{ weatherIconUrl() }}" alt="{{ currentWeather().weatherCondition.name }}" />
    </div>
    <div class="details">
      <div class="temperature">{{ temperatureText() }}<sup>{{ unitsLabel() }}</sup></div>
      {{#if showWindSpeed()}}
        <div class="wind">{{ windspeedText() }}<sub>{{ windLabel() }}</sub></div>
      {{/if}}
      {{#if showPrecipitation()}}
        <div class="precipitation">
          {{ precipitationText() }}<sub>{{ precipitationLabel() }}</sub>
          {{#if currentWeather().precipitation}} ({{ precipitationProbabilityText() }}%) {{/if}}
        </div>
      {{/if}}
      {{#if showCity()}}
        {{#if cityName()}}
          <div class="city">{{ cityName() }}</div>
        {{/if}}
      {{/if}}
    </div>
  </div>
{{/if}}
`, fe = ":host{display:block;width:100%;height:100%}.weather{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:4em}.weather.has-features-1{font-size:3.7em}.weather.has-features-2{font-size:2.8em}.weather.has-features-3{font-size:2.5em}.icon-wrap{width:40%;min-width:40%;height:100%;display:flex;align-items:center;justify-content:center}.icon-wrap img{width:100%;height:100%;object-fit:contain}.details{width:50%;max-width:50%;display:flex;flex-direction:column;justify-content:center}.temperature,.city,.precipitation,.wind{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.city{color:var(--color-primary)}sup,sub{font-size:.6em;opacity:.6}sub{padding-left:.2em}.text-shadows .weather img{filter:drop-shadow(1px 1px .25em rgba(0,0,0,.5))}", N = he(pe, { template: me, styles: fe }), ye = N, be = { DisplayDuckWidget: N, Widget: ye };
export {
  N as DisplayDuckWidget,
  ye as Widget,
  be as default
};
