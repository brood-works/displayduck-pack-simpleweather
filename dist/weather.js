const m = /* @__PURE__ */ new Map(), A = (i) => String(i ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"), x = (i) => {
  const t = m.get(i);
  if (t)
    return t;
  const e = i.replace(/\bthis\b/g, "__item"), r = new Function("scope", `with (scope) { return (${e}); }`);
  return m.set(i, r), r;
}, d = (i, t) => {
  try {
    return x(i)(t);
  } catch {
    return "";
  }
}, p = (i, t = 0, e) => {
  const r = [];
  let n = t;
  for (; n < i.length; ) {
    const s = i.indexOf("{{", n);
    if (s === -1)
      return r.push({ type: "text", value: i.slice(n) }), { nodes: r, index: i.length };
    s > n && r.push({ type: "text", value: i.slice(n, s) });
    const o = i.indexOf("}}", s + 2);
    if (o === -1)
      return r.push({ type: "text", value: i.slice(s) }), { nodes: r, index: i.length };
    const a = i.slice(s + 2, o).trim();
    if (n = o + 2, a === "/if" || a === "/each") {
      if (e === a)
        return { nodes: r, index: n };
      r.push({ type: "text", value: `{{${a}}}` });
      continue;
    }
    if (a.startsWith("#if ")) {
      const c = p(i, n, "/if");
      r.push({
        type: "if",
        condition: a.slice(4).trim(),
        children: c.nodes
      }), n = c.index;
      continue;
    }
    if (a.startsWith("#each ")) {
      const c = p(i, n, "/each");
      r.push({
        type: "each",
        source: a.slice(6).trim(),
        children: c.nodes
      }), n = c.index;
      continue;
    }
    r.push({ type: "expr", value: a });
  }
  return { nodes: r, index: n };
}, f = (i, t) => {
  let e = "";
  for (const r of i) {
    if (r.type === "text") {
      e += r.value;
      continue;
    }
    if (r.type === "expr") {
      e += A(d(r.value, t));
      continue;
    }
    if (r.type === "if") {
      d(r.condition, t) && (e += f(r.children, t));
      continue;
    }
    const n = d(r.source, t);
    if (Array.isArray(n))
      for (const s of n) {
        const o = Object.create(t);
        o.__item = s, e += f(r.children, o);
      }
  }
  return e;
}, D = (i) => {
  const t = p(i).nodes;
  return (e) => f(t, e);
};
async function E(i, t = {}, e) {
  return window.__TAURI_INTERNALS__.invoke(i, t, e);
}
function v(i, t = "asset") {
  return window.__TAURI_INTERNALS__.convertFileSrc(i, t);
}
var g;
(function(i) {
  i.WINDOW_RESIZED = "tauri://resize", i.WINDOW_MOVED = "tauri://move", i.WINDOW_CLOSE_REQUESTED = "tauri://close-requested", i.WINDOW_DESTROYED = "tauri://destroyed", i.WINDOW_FOCUS = "tauri://focus", i.WINDOW_BLUR = "tauri://blur", i.WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change", i.WINDOW_THEME_CHANGED = "tauri://theme-changed", i.WINDOW_CREATED = "tauri://window-created", i.WEBVIEW_CREATED = "tauri://webview-created", i.DRAG_ENTER = "tauri://drag-enter", i.DRAG_OVER = "tauri://drag-over", i.DRAG_DROP = "tauri://drag-drop", i.DRAG_LEAVE = "tauri://drag-leave";
})(g || (g = {}));
const z = (i) => {
  if (typeof i != "function")
    return !1;
  const t = i;
  return t._isSignal === !0 && typeof t.set == "function" && typeof t.subscribe == "function";
}, l = (i) => {
  let t = i;
  const e = /* @__PURE__ */ new Set(), r = (() => t);
  return r._isSignal = !0, r.set = (n) => {
    t = n;
    for (const s of e)
      s(t);
  }, r.update = (n) => {
    r.set(n(t));
  }, r.subscribe = (n) => (e.add(n), () => e.delete(n)), r;
}, w = (i) => E("controller_http_get_text", { url: i }), C = (i, t) => {
  const e = [];
  for (const r of Object.keys(i)) {
    const n = i[r];
    z(n) && e.push(n.subscribe(() => t()));
  }
  return () => {
    for (const r of e)
      r();
  };
}, O = (i, t) => new Proxy(
  { payload: t },
  {
    get(e, r) {
      if (typeof r != "string")
        return;
      if (r in e)
        return e[r];
      const n = i[r];
      return typeof n == "function" ? n.bind(i) : n;
    },
    has(e, r) {
      return typeof r != "string" ? !1 : r in e || r in i;
    }
  }
), N = ["src", "href", "poster"], T = "{{pack-install-path}}/", b = "{{ASSETS}}", L = (i) => {
  const t = i.trim();
  return t.length === 0 || t.startsWith("data:") || t.startsWith("blob:") || t.startsWith("http://") || t.startsWith("https://") || t.startsWith("file:") || t.startsWith("asset:") || t.startsWith("mailto:") || t.startsWith("tel:") || t.startsWith("javascript:") || t.startsWith("//") || t.startsWith("/") || t.startsWith("#");
}, R = (i) => {
  const t = i.trim();
  if (!t)
    return null;
  if (!L(t))
    return t.replace(/^\.\/+/, "").replace(/^\/+/, "");
  if (t.startsWith("http://") || t.startsWith("https://"))
    try {
      const e = new URL(t);
      if (e.origin === window.location.origin)
        return `${e.pathname}${e.search}${e.hash}`.replace(/^\/+/, "");
    } catch {
      return null;
    }
  return null;
}, I = (i, t) => {
  const e = i.replaceAll("\\", "/").replace(/\/+$/, ""), r = `${e}/${t.trim()}`, n = r.split("/"), s = [];
  for (const o of n) {
    if (!o || o === ".") {
      s.length === 0 && r.startsWith("/") && s.push("");
      continue;
    }
    if (o === "..") {
      (s.length > 1 || s.length === 1 && s[0] !== "") && s.pop();
      continue;
    }
    s.push(o);
  }
  return s.join("/") || e;
}, u = (i, t) => {
  const e = R(t);
  if (!i || !e)
    return t;
  try {
    return v(I(i, e));
  } catch {
    return t;
  }
}, P = (i) => {
  const t = i.trim().replaceAll("\\", "/").replace(/\/+$/, "");
  if (!t)
    return "";
  try {
    return v(t);
  } catch {
    return t;
  }
}, U = (i, t) => i.split(",").map((e) => {
  const r = e.trim();
  if (!r)
    return r;
  const [n, s] = r.split(/\s+/, 2), o = u(t, n);
  return s ? `${o} ${s}` : o;
}).join(", "), F = (i, t) => i.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (e, r, n) => {
  const s = u(t, n);
  return s === n ? e : `url("${s}")`;
}), y = (i, t) => {
  for (const n of N) {
    const s = i.getAttribute(n);
    if (!s)
      continue;
    const o = u(t, s);
    o !== s && i.setAttribute(n, o);
  }
  const e = i.getAttribute("srcset");
  if (e) {
    const n = U(e, t);
    n !== e && i.setAttribute("srcset", n);
  }
  const r = i.getAttribute("style");
  if (r) {
    const n = F(r, t);
    n !== r && i.setAttribute("style", n);
  }
}, S = (i, t) => {
  if (t) {
    i instanceof Element && y(i, t);
    for (const e of Array.from(i.querySelectorAll("*")))
      y(e, t);
  }
}, W = (i, t) => {
  if (!t)
    return i;
  let e = i;
  const r = P(t);
  return r && e.includes(b) && (e = e.replaceAll(b, r)), e.includes(T) ? e.replace(/\{\{pack-install-path\}\}\/([^"')\s]+)/g, (n, s) => u(t, s)) : e;
}, k = (i, t) => class {
  constructor({
    mount: r,
    payload: n,
    setLoading: s
  }) {
    this.cleanups = [], this.widgetDirectory = "", this.mount = r, this.payload = n ?? {}, this.setLoading = typeof s == "function" ? s : (() => {
    }), this.assetObserver = new MutationObserver((o) => {
      if (this.widgetDirectory)
        for (const a of o) {
          if (a.type === "attributes" && a.target instanceof Element) {
            y(a.target, this.widgetDirectory);
            continue;
          }
          for (const c of Array.from(a.addedNodes))
            c instanceof Element && S(c, this.widgetDirectory);
        }
    }), this.logic = new i({
      mount: r,
      payload: this.payload,
      setLoading: (o) => this.setLoading(!!o),
      on: (o, a, c) => this.on(o, a, c)
    }), this.cleanupSignalSubscriptions = C(this.logic, () => this.render()), this.assetObserver.observe(this.mount, {
      subtree: !0,
      childList: !0,
      attributes: !0,
      attributeFilter: ["src", "href", "poster", "srcset", "style"]
    });
  }
  onInit() {
    this.render(), this.logic.onInit?.();
  }
  onUpdate(r) {
    this.payload = r ?? {}, this.logic.onUpdate?.(this.payload), this.render();
  }
  onDestroy() {
    for (this.cleanupSignalSubscriptions(); this.cleanups.length > 0; )
      this.cleanups.pop()?.();
    this.assetObserver.disconnect(), this.logic.onDestroy?.(), this.mount.innerHTML = "";
  }
  render() {
    const r = O(this.logic, this.payload);
    this.widgetDirectory = String(
      this.payload?.widgetDirectory ?? this.payload?.directory ?? ""
    ).trim();
    const n = W(t.template, this.widgetDirectory), s = W(t.styles, this.widgetDirectory), a = D(n)(r);
    this.mount.innerHTML = `<style>${s}</style>${a}`, this.mount.setAttribute("data-displayduck-render-empty", a.trim().length === 0 ? "true" : "false"), S(this.mount, this.widgetDirectory), this.logic.afterRender?.();
  }
  on(r, n, s) {
    const o = (c) => {
      const h = c.target?.closest(n);
      !h || !this.mount.contains(h) || s(c, h);
    };
    this.mount.addEventListener(r, o);
    const a = () => this.mount.removeEventListener(r, o);
    return this.cleanups.push(a), a;
  }
};
let $ = class {
  constructor(t) {
    this.ctx = t, this.refreshTimer = null, this.lastConfigFingerprint = "", this.config = l(this.extractConfig(t.payload)), this.activatedOptions = l(0), this.cityName = l(null), this.currentWeather = l(null);
  }
  onInit() {
    this.lastConfigFingerprint = this.configFingerprint(), this.refreshWeather();
  }
  onUpdate(t) {
    this.config.set(this.extractConfig(t));
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
    return !!this.config().showWindSpeed;
  }
  showPrecipitation() {
    return !!this.config().showPrecipitation;
  }
  showCity() {
    return !!this.config().showCity;
  }
  temperatureText() {
    const t = this.currentWeather()?.temperature;
    return t == null ? "--" : String(t);
  }
  windspeedText() {
    const t = this.currentWeather()?.windspeed;
    return t == null ? "--" : String(t);
  }
  precipitationText() {
    const t = this.currentWeather()?.precipitation;
    return t == null ? "0" : String(t);
  }
  precipitationProbabilityText() {
    const t = this.currentWeather()?.precipitationProbability;
    return t == null ? "0" : String(t);
  }
  extractConfig(t) {
    const e = t?.config;
    return !e || typeof e != "object" || Array.isArray(e) ? {} : e;
  }
  latitude() {
    return Number(this.config().latitude ?? 0);
  }
  longitude() {
    return Number(this.config().longitude ?? 0);
  }
  intervalMinutes() {
    return Math.max(1, Number(this.config().interval ?? 10) || 10);
  }
  units() {
    return String(this.config().units ?? "metric") === "imperial" ? "imperial" : "metric";
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
    this.refreshTimer && (clearTimeout(this.refreshTimer), this.refreshTimer = null), this.ctx.setLoading(!0), this.recomputeActivatedOptions();
    try {
      let t = "temperature_2m,weathercode,is_day";
      this.showWindSpeed() && (t += ",windspeed_10m,winddirection_10m"), this.showPrecipitation() && (t += ",precipitation,precipitation_probability");
      const e = new URLSearchParams({
        latitude: this.latitude().toString(),
        longitude: this.longitude().toString(),
        temperature_unit: this.units() === "metric" ? "celsius" : "fahrenheit",
        windspeed_unit: this.units() === "metric" ? "kmh" : "mph",
        precipitation_unit: this.units() === "metric" ? "mm" : "inch",
        current: t
      }), r = JSON.parse(
        await w(`https://api.open-meteo.com/v1/forecast?${e.toString()}`)
      );
      this.currentWeather.set({
        temperature: r.current.temperature_2m,
        isDay: r.current.is_day === 1,
        weatherCondition: this.weatherMapping(r.current.weathercode, r.current.is_day === 1),
        windspeed: this.showWindSpeed() ? r.current.windspeed_10m ?? null : null,
        precipitation: this.showPrecipitation() ? r.current.precipitation ?? null : null,
        precipitationProbability: this.showPrecipitation() ? r.current.precipitation_probability ?? null : null
      }), this.showCity() ? await this.refreshCityName() : this.cityName.set(null);
    } catch (t) {
      console.error("[SimpleWeather] Failed to refresh weather", t);
    } finally {
      this.ctx.setLoading(!1), this.refreshTimer = setTimeout(() => {
        this.refreshWeather();
      }, this.intervalMinutes() * 60 * 1e3);
    }
  }
  async refreshCityName() {
    try {
      const t = new URLSearchParams({
        lat: this.latitude().toString(),
        lon: this.longitude().toString(),
        format: "json"
      }), r = JSON.parse(
        await w(`https://nominatim.openstreetmap.org/reverse?${t.toString()}`)
      ).address ?? {}, n = r.city ?? r.town ?? r.village ?? r.municipality ?? r.hamlet ?? r.county ?? r.state_district ?? null;
      this.cityName.set(n);
    } catch (t) {
      console.error("[SimpleWeather] Failed to refresh city name", t), this.cityName.set("Unknown");
    }
  }
  recomputeActivatedOptions() {
    let t = 0;
    this.showWindSpeed() && (t += 1), this.showPrecipitation() && (t += 1), this.showCity() && (t += 1), this.activatedOptions.set(t);
  }
  weatherMapping(t, e) {
    return {
      0: { name: "clear", icon: e ? "clear-day" : "clear-night" },
      1: { name: "partly-cloudy", icon: e ? "partly-cloudy-day" : "partly-cloudy-night" },
      2: { name: "cloudy", icon: e ? "overcast-day" : "overcast-night" },
      3: { name: "cloudy", icon: e ? "overcast-day" : "overcast-night" },
      45: { name: "fog", icon: e ? "fog-day" : "fog-night" },
      48: { name: "fog", icon: e ? "fog-day" : "fog-night" },
      51: { name: "drizzle", icon: e ? "partly-cloudy-day-drizzle" : "partly-cloudy-night-drizzle" },
      53: { name: "drizzle", icon: e ? "partly-cloudy-day-drizzle" : "partly-cloudy-night-drizzle" },
      55: { name: "drizzle", icon: e ? "partly-cloudy-day-drizzle" : "partly-cloudy-night-drizzle" },
      56: { name: "freezing-drizzle", icon: e ? "partly-cloudy-day-sleet" : "partly-cloudy-night-sleet" },
      57: { name: "freezing-drizzle", icon: e ? "partly-cloudy-day-sleet" : "partly-cloudy-night-sleet" },
      61: { name: "rain", icon: e ? "partly-cloudy-day-rain" : "partly-cloudy-night-rain" },
      63: { name: "rain", icon: e ? "partly-cloudy-day-rain" : "partly-cloudy-night-rain" },
      65: { name: "rain", icon: e ? "partly-cloudy-day-rain" : "partly-cloudy-night-rain" },
      66: { name: "freezing-rain", icon: e ? "partly-cloudy-day-sleet" : "partly-cloudy-night-sleet" },
      67: { name: "freezing-rain", icon: e ? "partly-cloudy-day-sleet" : "partly-cloudy-night-sleet" },
      71: { name: "snow", icon: e ? "partly-cloudy-day-snow" : "partly-cloudy-night-snow" },
      73: { name: "snow", icon: e ? "partly-cloudy-day-snow" : "partly-cloudy-night-snow" },
      75: { name: "snow", icon: e ? "partly-cloudy-day-snow" : "partly-cloudy-night-snow" },
      77: { name: "snow-grains", icon: e ? "partly-cloudy-day-snow" : "partly-cloudy-night-snow" },
      80: { name: "rain-showers", icon: e ? "partly-cloudy-day-rain" : "partly-cloudy-night-rain" },
      81: { name: "rain-showers", icon: e ? "partly-cloudy-day-rain" : "partly-cloudy-night-rain" },
      82: { name: "rain-showers", icon: e ? "partly-cloudy-day-rain" : "partly-cloudy-night-rain" },
      85: { name: "snow-showers", icon: e ? "partly-cloudy-day-snow" : "partly-cloudy-night-snow" },
      86: { name: "snow-showers", icon: e ? "partly-cloudy-day-snow" : "partly-cloudy-night-snow" },
      95: { name: "thunderstorm", icon: e ? "thunderstorms-day-rain" : "thunderstorms-night-rain" },
      96: { name: "thunderstorm", icon: e ? "thunderstorms-day-rain" : "thunderstorms-night-rain" },
      99: { name: "thunderstorm", icon: e ? "thunderstorms-day-rain" : "thunderstorms-night-rain" }
    }[t] ?? { name: "unknown", icon: "unknown" };
  }
};
const M = `{{#if currentWeather()}}
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
`, j = ":host{display:block;width:100%;height:100%}.weather{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:4em}.weather.has-features-1{font-size:3.7em}.weather.has-features-2{font-size:2.8em}.weather.has-features-3{font-size:2.5em}.icon-wrap{width:40%;min-width:40%;height:100%;display:flex;align-items:center;justify-content:center}.icon-wrap img{width:100%;height:100%;object-fit:contain}.details{width:50%;max-width:50%;display:flex;flex-direction:column;justify-content:center}.temperature,.city,.precipitation,.wind{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.city{color:var(--color-primary)}sup,sub{font-size:.6em;opacity:.6}sub{padding-left:.2em}.text-shadows .weather img{filter:drop-shadow(1px 1px .25em rgba(0,0,0,.5))}", _ = k($, { template: M, styles: j }), B = _, q = { DisplayDuckWidget: _, Widget: B };
export {
  _ as DisplayDuckWidget,
  B as Widget,
  q as default
};
