import SunCalc from "suncalc";

// Decide whether it's night for a given location, so the app can show dark mode
// after sunset and light mode after sunrise — automatically, per person, no toggle.
//
// Priority:
//   1) Real sunrise/sunset from approximate lat/long (no GPS permission — comes from
//      the request's network location).
//   2) Fallback to local hour from the timezone (dark 19:00–06:00).
//   3) Fallback to light.
export function isNight(
  lat: number | null,
  lng: number | null,
  timezone: string | null,
  now: Date = new Date()
): boolean {
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    try {
      const times = SunCalc.getTimes(now, lat, lng);
      const sunrise = times.sunrise?.getTime();
      const sunset = times.sunset?.getTime();
      if (sunrise && sunset && !Number.isNaN(sunrise) && !Number.isNaN(sunset)) {
        const t = now.getTime();
        return t < sunrise || t > sunset;
      }
    } catch {
      /* fall through to timezone */
    }
  }

  if (timezone) {
    try {
      const hour = Number(
        new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          hour12: false,
          timeZone: timezone
        }).format(now)
      );
      if (Number.isFinite(hour)) return hour >= 19 || hour < 6;
    } catch {
      /* fall through */
    }
  }

  return false;
}
