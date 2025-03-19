import assert from 'assert';
import { validateCoordinate, determineTimeOfDay } from './index.js';

// --- Testing validateCoordinate ---

// Test valid latitude
assert.strictEqual(validateCoordinate("45", "latitude"), 45);
console.log("validateCoordinate passed valid latitude test");

// Test valid longitude
assert.strictEqual(validateCoordinate("-120", "longitude"), -120);
console.log("validateCoordinate passed valid longitude test");

// Test invalid latitude input (non-number)
try {
    validateCoordinate("not-a-number", "latitude");
    console.error("validateCoordinate did not throw for non-numeric latitude");
} catch (err) {
    console.log("validateCoordinate correctly threw error for non-numeric latitude");
}

// Test latitude out of range
try {
    validateCoordinate("100", "latitude");
    console.error("validateCoordinate did not throw for out-of-range latitude");
} catch (err) {
    console.log("validateCoordinate correctly threw error for out-of-range latitude");
}

// --- Testing determineTimeOfDay ---

// dummy Date objects to simulate times
// Assume: sunrise at 06:00, solar noon at 12:00, sunset at 18:00, civil twilight end at 19:00.
const dateBase = new Date('2024-06-01T00:00:00Z');
const sunrise = new Date(dateBase.getTime() + 6 * 3600 * 1000);          // 06:00
const solarNoon = new Date(dateBase.getTime() + 12 * 3600 * 1000);       // 12:00
const sunset = new Date(dateBase.getTime() + 18 * 3600 * 1000);            // 18:00
const civilTwilightEnd = new Date(dateBase.getTime() + 19 * 3600 * 1000);  // 19:00

// Test exact sunrise time
const atSunrise = new Date(sunrise.getTime());
assert.strictEqual(determineTimeOfDay(atSunrise, sunrise, sunset, solarNoon, civilTwilightEnd), 'sunrise.png');
console.log("determineTimeOfDay passed sunrise test");

// Test exact sunset time
const atSunset = new Date(sunset.getTime());
assert.strictEqual(determineTimeOfDay(atSunset, sunrise, sunset, solarNoon, civilTwilightEnd), 'sunset.png');
console.log("determineTimeOfDay passed sunset test");

// Test morning: current time between sunrise and solar noon (e.g., 09:00)
const currentMorning = new Date(dateBase.getTime() + 9 * 3600 * 1000);
assert.strictEqual(determineTimeOfDay(currentMorning, sunrise, sunset, solarNoon, civilTwilightEnd), 'morning.png');
console.log("determineTimeOfDay passed morning test");

// Test noon: current time between solar noon and sunset (e.g., 15:00)
const currentNoon = new Date(dateBase.getTime() + 15 * 3600 * 1000);
assert.strictEqual(determineTimeOfDay(currentNoon, sunrise, sunset, solarNoon, civilTwilightEnd), 'noon.png');
console.log("determineTimeOfDay passed noon test");

// Test evening: current time between sunset and civil twilight end (e.g., 18:30)
const currentEvening = new Date(dateBase.getTime() + 18.5 * 3600 * 1000);
assert.strictEqual(determineTimeOfDay(currentEvening, sunrise, sunset, solarNoon, civilTwilightEnd), 'evening.png');
console.log("determineTimeOfDay passed evening test");

// Test night: current time after civil twilight end (e.g., 20:00)
const currentNight = new Date(dateBase.getTime() + 20 * 3600 * 1000);
assert.strictEqual(determineTimeOfDay(currentNight, sunrise, sunset, solarNoon, civilTwilightEnd), 'night.png');
console.log("determineTimeOfDay passed night test");

// Test pre-sunrise: current time before sunrise (e.g., 03:00)
const currentEarly = new Date(dateBase.getTime() + 3 * 3600 * 1000);
assert.strictEqual(determineTimeOfDay(currentEarly, sunrise, sunset, solarNoon, civilTwilightEnd), 'night.png');
console.log("determineTimeOfDay passed pre-sunrise test");