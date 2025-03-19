# Sunlight-Based Wallpaper Selector

## Description
A Node.js CLI tool that selects a desktop wallpaper based on the sun's location at execution time using provided latitude and longitude.

## Requirements
- Node.js (v12+ recommended)
- Linux Bash environment
- Internet access for API calls

## Installation
1. Clone the repository.
2. Install dependencies using:
   ```bash
   npm install
   ```
## Usage
Run the program with latitude and longitude as arguments:
```bash
npm run start <latitude> <longitude>
```

Example:
```bash
npm run start 31.9544 35.9106
```
## API Information
- **Timezone API:** Used to fetch the local timezone based on coordinates.
- **Sun Times API:** Used to retrieve sunrise, sunset, and other sun-related times.

## Program Structure
- **Input Validation:** Validates latitude and longitude ranges.
- **API Requests:** Implements retry logic for robust API calls.
- **Time Conversion:** Converts UTC times to local times using the fetched timezone.
- **Wallpaper Determination:** Chooses the appropriate image based on the current time relative to sunrise, solar noon, sunset, etc.
- **Output:** Prints the wallpaper filename to stdout.

## Error Handling
- Exits with an error message and status code 1 if invalid input or API errors occur.

## Testing (Optional)
If tests are included, you can run them with:
```bash
npm run test
```