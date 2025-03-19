// Constants
const TIMEZONE_API_URL = "https://www.timeapi.io/api/timezone/coordinate";
const SUN_TIMES_API_URL = "https://api.sunrise-sunset.org/json";
const DEFAULT_RETRIES = 3;
const RETRY_DELAY_MS = 500;

// Interface representing sun times from the API.
interface SunTimes {
  sunrise: string;
  sunset: string;
  solarNoon: string;
  civilTwilightEnd: string;
}

/**
 * Helper function to perform a fetch with a simple retry logic.
 * @param url - The URL to fetch.
 * @param retries - Number of retry attempts (default is DEFAULT_RETRIES).
 * @param delay - Delay in milliseconds between retries (default is RETRY_DELAY_MS).
 * @returns A promise resolving to the Response object.
 * @throws An error if all attempts fail.
 */
async function fetchWithRetry(url: string, retries: number = DEFAULT_RETRIES, delay: number = RETRY_DELAY_MS): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      console.error(`Attempt ${attempt} failed for ${url}: ${error}`);
      if (attempt < retries) {
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw new Error(`Failed to fetch ${url} after ${retries} attempts: ${error}`);
      }
    }
  }
  throw new Error('Unexpected error in fetchWithRetry');
}

/**
 * Validate that the given string represents a valid latitude or longitude.
 * @param value - The value to validate.
 * @param type - 'latitude' or 'longitude'.
 * @returns The parsed number if valid.
 * @throws Error if the value is invalid or out of range.
 */
export function validateCoordinate(value: string, type: 'latitude' | 'longitude'): number {
  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new Error(`Invalid ${type}: "${value}" is not a number.`);
  }
  if (type === 'latitude' && (num < -90 || num > 90)) {
    throw new Error(`Invalid latitude: ${num} is out of range (-90 to 90).`);
  }
  if (type === 'longitude' && (num < -180 || num > 180)) {
    throw new Error(`Invalid longitude: ${num} is out of range (-180 to 180).`);
  }
  return num;
}

/**
 * Fetches the timezone based on latitude and longitude.
 * @param lat - Latitude as a string.
 * @param lon - Longitude as a string.
 * @returns A promise that resolves to the timezone string.
 * @throws Error if the API call fails or the response is missing the timeZone field.
 */
async function getTimezone(lat: string, lon: string): Promise<string> {
  const url = `${TIMEZONE_API_URL}?latitude=${lat}&longitude=${lon}`;
  try {
    const response = await fetchWithRetry(url);
    const data = await response.json();
    if (!data.timeZone) {
      throw new Error("Timezone not found in API response.");
    }
    return data.timeZone;
  } catch (error) {
    console.error(`Error fetching timezone for (${lat}, ${lon}): ${error}`);
    throw error;
  }
}

/**
 * Fetches sunrise, sunset, solar noon, and civil twilight end times.
 * @param lat - Latitude as a string.
 * @param lon - Longitude as a string.
 * @returns A promise that resolves to a SunTimes object.
 * @throws Error if the API call fails or the response is malformed.
 */
export async function getSunTimes(lat: string, lon: string): Promise<SunTimes> {
  const url = `${SUN_TIMES_API_URL}?lat=${lat}&lng=${lon}&formatted=0`;
  try {
    const response = await fetchWithRetry(url);
    const data = await response.json();
    if (!data.results) {
      throw new Error("Sun times not found in API response.");
    }
    const results = data.results;
    return {
      sunrise: results.sunrise,
      sunset: results.sunset,
      solarNoon: results.solar_noon,
      civilTwilightEnd: results.civil_twilight_end
    };
  } catch (error) {
    console.error(`Error fetching sun times for (${lat}, ${lon}): ${error}`);
    throw error;
  }
}

/**
 * Converts a UTC ISO date string to a Date in the provided timezone.
 * @param utcIso - UTC time in ISO format.
 * @param timeZone - The target timezone.
 * @returns A Date object representing the local time.
 */
function toLocalTime(utcIso: string, timeZone: string): Date {
  const utcDate = new Date(utcIso);
  const localeString = utcDate.toLocaleString('en-US', { timeZone });
  return new Date(localeString);
}

/**
 * Determines which wallpaper to use based on the current local time and sun times.
 * @param current - The current local time as a Date object.
 * @param sunrise - Sunrise time as a Date object.
 * @param sunset - Sunset time as a Date object.
 * @param solarNoon - Solar noon time as a Date object.
 * @param civilTwilightEnd - End of civil twilight as a Date object.
 * @returns The filename of the wallpaper.
 */
export function determineTimeOfDay(
  current: Date,
  sunrise: Date,
  sunset: Date,
  solarNoon: Date,
  civilTwilightEnd: Date
): string {
  const currentMs = current.getTime();
  const sunriseMs = sunrise.getTime();
  const sunsetMs = sunset.getTime();
  const solarNoonMs = solarNoon.getTime();
  const civilTwilightEndMs = civilTwilightEnd.getTime();

  if (currentMs === sunriseMs) {
    return 'sunrise.png';
  }
  if (currentMs === sunsetMs) {
    return 'sunset.png';
  }
  if (currentMs > sunriseMs && currentMs < solarNoonMs) {
    return 'morning.png';
  }
  if (currentMs > solarNoonMs && currentMs < sunsetMs) {
    return 'noon.png';
  }
  if (currentMs > sunsetMs && currentMs <= civilTwilightEndMs) {
    return 'evening.png';
  }
  if (currentMs > civilTwilightEndMs || currentMs < sunriseMs) {
    return 'night.png';
  }
  return '';
}

/**
 * Main function tying everything together.
 * Validates inputs, fetches necessary data, converts times to local, and determines the appropriate wallpaper.
 */
async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.error("Usage: npm run start <latitude> <longitude>");
    process.exit(1);
  }

  let lat: number, lon: number;
  try {
    lat = validateCoordinate(args[0], 'latitude');
    lon = validateCoordinate(args[1], 'longitude');
  } catch (error: any) {
    console.error(`Input validation error: ${error.message}`);
    process.exit(1);
  }

  try {
    // Fetch sun times
    const { sunrise, sunset, solarNoon, civilTwilightEnd } = await getSunTimes(lat.toString(), lon.toString());
    // Get timezone string from the API
    const tzStr = await getTimezone(lat.toString(), lon.toString());

    // Convert UTC times to local times
    const sunriseLocal = toLocalTime(sunrise, tzStr);
    const sunsetLocal = toLocalTime(sunset, tzStr);
    const solarNoonLocal = toLocalTime(solarNoon, tzStr);
    const civilTwilightEndLocal = toLocalTime(civilTwilightEnd, tzStr);

    // Get current local time in the target timezone
    const now = new Date();
    const currentLocal = new Date(now.toLocaleString('en-US', { timeZone: tzStr }));

    // Determine and output the appropriate wallpaper
    const wallpaper = determineTimeOfDay(
      currentLocal,
      sunriseLocal,
      sunsetLocal,
      solarNoonLocal,
      civilTwilightEndLocal
    );
    console.log(wallpaper);
  } catch (error: any) {
    console.error("An error occurred during execution:", error.message);
    process.exit(1);
  }
}
if (import.meta.url === process.argv[1] || import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  main();
}
