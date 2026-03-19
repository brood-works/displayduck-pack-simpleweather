import { httpFetch, signal, type Signal, type WidgetContext, type WidgetPayload } from '@displayduck/base';

type Weather = {
  temperature: number;
  isDay: boolean;
  weatherCondition: { name: string; icon: string };
  windspeed: number | null;
  precipitation: number | null;
  precipitationProbability: number | null;
};

export class DisplayDuckWidget {
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private config: Signal<Record<string, unknown>>;
  private lastConfigFingerprint = '';

  public activatedOptions: Signal<number>;
  public cityName: Signal<string | null>;
  public currentWeather: Signal<Weather | null>;

  public constructor(private readonly ctx: WidgetContext) {
    this.config = signal(this.extractConfig(ctx.payload));
    this.activatedOptions = signal(0);
    this.cityName = signal<string | null>(null);
    this.currentWeather = signal<Weather | null>(null);
  }

  public onInit(): void {
    this.lastConfigFingerprint = this.configFingerprint();
    void this.refreshWeather();
  }

  public onUpdate(payload: WidgetPayload): void {
    this.config.set(this.extractConfig(payload));
    const nextFingerprint = this.configFingerprint();
    if (nextFingerprint === this.lastConfigFingerprint) {
      return;
    }
    this.lastConfigFingerprint = nextFingerprint;
    void this.refreshWeather();
  }

  public onDestroy(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  public unitsLabel(): string {
    return this.units() === 'metric' ? '°C' : '°F';
  }

  public windLabel(): string {
    return this.units() === 'metric' ? 'm/s' : 'mph';
  }

  public precipitationLabel(): string {
    return this.units() === 'metric' ? 'mm' : 'in';
  }

  public weatherIconUrl(): string {
    const icon = this.currentWeather()?.weatherCondition?.icon ?? 'unknown';
    return `img/${icon}.svg`;
  }

  public weatherFeatureClass(): string {
    return `has-features-${this.activatedOptions()}`;
  }

  public showWindSpeed(): boolean {
    return Boolean(this.config().showWindSpeed);
  }

  public showPrecipitation(): boolean {
    return Boolean(this.config().showPrecipitation);
  }

  public showCity(): boolean {
    return Boolean(this.config().showCity);
  }

  public temperatureText(): string {
    const value = this.currentWeather()?.temperature;
    return value === undefined || value === null ? '--' : String(value);
  }

  public windspeedText(): string {
    const value = this.currentWeather()?.windspeed;
    return value === undefined || value === null ? '--' : String(value);
  }

  public precipitationText(): string {
    const value = this.currentWeather()?.precipitation;
    return value === undefined || value === null ? '0' : String(value);
  }

  public precipitationProbabilityText(): string {
    const value = this.currentWeather()?.precipitationProbability;
    return value === undefined || value === null ? '0' : String(value);
  }

  private extractConfig(payload: WidgetPayload): Record<string, unknown> {
    const raw = (payload as { config?: unknown })?.config;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return {};
    }
    return raw as Record<string, unknown>;
  }

  private latitude(): number {
    return Number(this.config().latitude ?? 0);
  }

  private longitude(): number {
    return Number(this.config().longitude ?? 0);
  }

  private intervalMinutes(): number {
    return Math.max(1, Number(this.config().interval ?? 10) || 10);
  }

  private units(): 'metric' | 'imperial' {
    return String(this.config().units ?? 'metric') === 'imperial' ? 'imperial' : 'metric';
  }

  private configFingerprint(): string {
    return JSON.stringify({
      latitude: this.latitude(),
      longitude: this.longitude(),
      interval: this.intervalMinutes(),
      units: this.units(),
      showWindSpeed: this.showWindSpeed(),
      showPrecipitation: this.showPrecipitation(),
      showCity: this.showCity(),
    });
  }

  private async refreshWeather(): Promise<void> {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.ctx.setLoading(true);
    this.recomputeActivatedOptions();

    try {
      let currentFields = 'temperature_2m,weathercode,is_day';
      if (this.showWindSpeed()) currentFields += ',windspeed_10m,winddirection_10m';
      if (this.showPrecipitation()) currentFields += ',precipitation,precipitation_probability';

      const params = new URLSearchParams({
        latitude: this.latitude().toString(),
        longitude: this.longitude().toString(),
        temperature_unit: this.units() === 'metric' ? 'celsius' : 'fahrenheit',
        windspeed_unit: this.units() === 'metric' ? 'kmh' : 'mph',
        precipitation_unit: this.units() === 'metric' ? 'mm' : 'inch',
        current: currentFields,
      });

      const data = JSON.parse(
        await httpFetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`),
      ) as {
        current: {
          temperature_2m: number;
          is_day: number;
          weathercode: number;
          windspeed_10m?: number | null;
          precipitation?: number | null;
          precipitation_probability?: number | null;
        };
      };

      this.currentWeather.set({
        temperature: data.current.temperature_2m,
        isDay: data.current.is_day === 1,
        weatherCondition: this.weatherMapping(data.current.weathercode, data.current.is_day === 1),
        windspeed: this.showWindSpeed() ? (data.current.windspeed_10m ?? null) : null,
        precipitation: this.showPrecipitation() ? (data.current.precipitation ?? null) : null,
        precipitationProbability: this.showPrecipitation() ? (data.current.precipitation_probability ?? null) : null,
      });

      if (this.showCity()) {
        await this.refreshCityName();
      } else {
        this.cityName.set(null);
      }

    } catch (error) { 
      console.error('[SimpleWeather] Failed to refresh weather', error);
    } finally {
      this.ctx.setLoading(false);
      this.refreshTimer = setTimeout(() => {
        void this.refreshWeather();
      }, this.intervalMinutes() * 60 * 1000);
    }
  }

  private async refreshCityName(): Promise<void> {
    try {
      const params = new URLSearchParams({
        lat: this.latitude().toString(),
        lon: this.longitude().toString(),
        format: 'json',
      });
      const data = JSON.parse(
        await httpFetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`),
      ) as {
        address?: Record<string, string | undefined>;
      };
      const address = data.address ?? {};
      const city =
        address.city ??
        address.town ??
        address.village ??
        address.municipality ??
        address.hamlet ??
        address.county ??
        address.state_district ??
        null;
      this.cityName.set(city);
    } catch (error) {
      console.error('[SimpleWeather] Failed to refresh city name', error);
      this.cityName.set('Unknown');
    }
  }

  private recomputeActivatedOptions(): void {
    let count = 0;
    if (this.showWindSpeed()) count += 1;
    if (this.showPrecipitation()) count += 1;
    if (this.showCity()) count += 1;
    this.activatedOptions.set(count);
  }

  private weatherMapping(weathercode: number, day: boolean): { name: string; icon: string } {
    const mapIndex: Record<number, { name: string; icon: string }> = {
      0: { name: 'clear', icon: day ? 'clear-day' : 'clear-night' },
      1: { name: 'partly-cloudy', icon: day ? 'partly-cloudy-day' : 'partly-cloudy-night' },
      2: { name: 'cloudy', icon: day ? 'overcast-day' : 'overcast-night' },
      3: { name: 'cloudy', icon: day ? 'overcast-day' : 'overcast-night' },
      45: { name: 'fog', icon: day ? 'fog-day' : 'fog-night' },
      48: { name: 'fog', icon: day ? 'fog-day' : 'fog-night' },
      51: { name: 'drizzle', icon: day ? 'partly-cloudy-day-drizzle' : 'partly-cloudy-night-drizzle' },
      53: { name: 'drizzle', icon: day ? 'partly-cloudy-day-drizzle' : 'partly-cloudy-night-drizzle' },
      55: { name: 'drizzle', icon: day ? 'partly-cloudy-day-drizzle' : 'partly-cloudy-night-drizzle' },
      56: { name: 'freezing-drizzle', icon: day ? 'partly-cloudy-day-sleet' : 'partly-cloudy-night-sleet' },
      57: { name: 'freezing-drizzle', icon: day ? 'partly-cloudy-day-sleet' : 'partly-cloudy-night-sleet' },
      61: { name: 'rain', icon: day ? 'partly-cloudy-day-rain' : 'partly-cloudy-night-rain' },
      63: { name: 'rain', icon: day ? 'partly-cloudy-day-rain' : 'partly-cloudy-night-rain' },
      65: { name: 'rain', icon: day ? 'partly-cloudy-day-rain' : 'partly-cloudy-night-rain' },
      66: { name: 'freezing-rain', icon: day ? 'partly-cloudy-day-sleet' : 'partly-cloudy-night-sleet' },
      67: { name: 'freezing-rain', icon: day ? 'partly-cloudy-day-sleet' : 'partly-cloudy-night-sleet' },
      71: { name: 'snow', icon: day ? 'partly-cloudy-day-snow' : 'partly-cloudy-night-snow' },
      73: { name: 'snow', icon: day ? 'partly-cloudy-day-snow' : 'partly-cloudy-night-snow' },
      75: { name: 'snow', icon: day ? 'partly-cloudy-day-snow' : 'partly-cloudy-night-snow' },
      77: { name: 'snow-grains', icon: day ? 'partly-cloudy-day-snow' : 'partly-cloudy-night-snow' },
      80: { name: 'rain-showers', icon: day ? 'partly-cloudy-day-rain' : 'partly-cloudy-night-rain' },
      81: { name: 'rain-showers', icon: day ? 'partly-cloudy-day-rain' : 'partly-cloudy-night-rain' },
      82: { name: 'rain-showers', icon: day ? 'partly-cloudy-day-rain' : 'partly-cloudy-night-rain' },
      85: { name: 'snow-showers', icon: day ? 'partly-cloudy-day-snow' : 'partly-cloudy-night-snow' },
      86: { name: 'snow-showers', icon: day ? 'partly-cloudy-day-snow' : 'partly-cloudy-night-snow' },
      95: { name: 'thunderstorm', icon: day ? 'thunderstorms-day-rain' : 'thunderstorms-night-rain' },
      96: { name: 'thunderstorm', icon: day ? 'thunderstorms-day-rain' : 'thunderstorms-night-rain' },
      99: { name: 'thunderstorm', icon: day ? 'thunderstorms-day-rain' : 'thunderstorms-night-rain' },
    };
    return mapIndex[weathercode] ?? { name: 'unknown', icon: 'unknown' };
  }
}
