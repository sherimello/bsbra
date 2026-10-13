import "server-only";
import { cacheLife, cacheTag } from "next/cache";

/**
 * Live sea conditions and a modelled tide forecast for the Sitakunda coast,
 * from Open-Meteo's free marine and weather APIs (no key; CC BY 4.0, with
 * attribution). Cached for 15 minutes and shared by every visitor; if the
 * service is unreachable the site simply hides the panels.
 *
 * Sea level is relative to mean sea level and comes from a global model, so
 * it complements — never replaces — the official tide tables (Admin → Tides).
 */

export const COAST = { latitude: 22.45, longitude: 91.68, timezone: "Asia/Dhaka" } as const;

export interface TideTurn {
  /** Local Dhaka time, "YYYY-MM-DDTHH:mm". */
  time: string;
  height: number;
  type: "high" | "low";
}

export interface CoastConditions {
  /** The forecast's own "now" (local Dhaka time), used instead of the clock. */
  now: string;
  seaLevel: number | null;
  trend: "rising" | "falling" | null;
  waveHeight: number | null;
  waveDirection: number | null;
  seaTemperature: number | null;
  airTemperature: number | null;
  wind: number | null;
  windDirection: number | null;
  gusts: number | null;
  weatherCode: number | null;
  /** Highs and lows from now on (about seven days). */
  turns: TideTurn[];
  /** Hourly sea level from six hours ago to two days ahead, for the curve. */
  curve: { time: string; level: number }[];
}

interface MarineResponse {
  current?: { time: string; wave_height?: number; wave_direction?: number; sea_surface_temperature?: number; sea_level_height_msl?: number };
  hourly?: { time: string[]; sea_level_height_msl: (number | null)[] };
}

interface WeatherResponse {
  current?: { temperature_2m?: number; wind_speed_10m?: number; wind_direction_10m?: number; wind_gusts_10m?: number; weather_code?: number };
}

const MINUTE = 60_000;
/** Parse a naive local timestamp as if it were UTC — only differences matter. */
const toMs = (local: string) => Date.parse(`${local}:00Z`);
const toLocal = (ms: number) => new Date(ms).toISOString().slice(0, 16);

/**
 * Turning points of an hourly series, refined to the minute by fitting a
 * parabola through each local extreme and its neighbours.
 */
export function findTurns(times: string[], levels: (number | null)[]): TideTurn[] {
  const turns: TideTurn[] = [];
  for (let i = 1; i < levels.length - 1; i++) {
    const [a, b, c] = [levels[i - 1], levels[i], levels[i + 1]];
    if (a == null || b == null || c == null) continue;
    const isHigh = b >= a && b > c;
    const isLow = b <= a && b < c;
    if (!isHigh && !isLow) continue;
    const denominator = a - 2 * b + c;
    const offset = denominator === 0 ? 0 : (a - c) / (2 * denominator); // hours, within ±0.5
    const height = b - ((a - c) * offset) / 4;
    turns.push({
      time: toLocal(toMs(times[i]) + Math.round(offset * 60) * MINUTE),
      height: Math.round(height * 100) / 100,
      type: isHigh ? "high" : "low",
    });
  }
  return turns;
}

export async function getCoastConditions(): Promise<CoastConditions | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });
  cacheTag("coast");

  const at = `latitude=${COAST.latitude}&longitude=${COAST.longitude}&timezone=${encodeURIComponent(COAST.timezone)}`;
  try {
    const [marineRes, weatherRes] = await Promise.all([
      fetch(
        `https://marine-api.open-meteo.com/v1/marine?${at}&past_days=1&forecast_days=8` +
          "&hourly=sea_level_height_msl&current=wave_height,wave_direction,sea_surface_temperature,sea_level_height_msl",
        { signal: AbortSignal.timeout(8000) },
      ),
      fetch(
        `https://api.open-meteo.com/v1/forecast?${at}` +
          "&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code",
        { signal: AbortSignal.timeout(8000) },
      ),
    ]);
    if (!marineRes.ok) return null;
    const marine = (await marineRes.json()) as MarineResponse;
    const weather = weatherRes.ok ? ((await weatherRes.json()) as WeatherResponse) : {};
    const times = marine.hourly?.time ?? [];
    const levels = marine.hourly?.sea_level_height_msl ?? [];
    const now = marine.current?.time ?? times[0];
    if (!now || !times.length) return null;

    const nowMs = toMs(now);
    const nearest = times.findIndex((t) => toMs(t) >= nowMs);
    const before = levels[Math.max(0, nearest - 1)];
    const after = levels[Math.min(levels.length - 1, nearest + 1)];
    const trend = before != null && after != null && before !== after ? (after > before ? "rising" : "falling") : null;

    const curve = times
      .map((time, i) => ({ time, level: levels[i] }))
      .filter((p): p is { time: string; level: number } => {
        const ms = toMs(p.time);
        return p.level != null && ms >= nowMs - 6 * 60 * MINUTE && ms <= nowMs + 48 * 60 * MINUTE;
      });

    return {
      now,
      seaLevel: marine.current?.sea_level_height_msl ?? null,
      trend,
      waveHeight: marine.current?.wave_height ?? null,
      waveDirection: marine.current?.wave_direction ?? null,
      seaTemperature: marine.current?.sea_surface_temperature ?? null,
      airTemperature: weather.current?.temperature_2m ?? null,
      wind: weather.current?.wind_speed_10m ?? null,
      windDirection: weather.current?.wind_direction_10m ?? null,
      gusts: weather.current?.wind_gusts_10m ?? null,
      weatherCode: weather.current?.weather_code ?? null,
      turns: findTurns(times, levels).filter((t) => toMs(t.time) >= nowMs),
      curve,
    };
  } catch {
    return null;
  }
}

/** Minutes between two local timestamps. */
export function minutesBetween(from: string, to: string) {
  return Math.round((toMs(to) - toMs(from)) / MINUTE);
}
