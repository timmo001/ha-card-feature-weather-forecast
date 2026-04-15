# Weather forecast card

A custom Home Assistant card that renders weather forecast slots with support for daily, hourly, twice daily, and legacy forecast modes.

> [!WARNING]
> This card is experimental, and breaking changes may occur.

## Installation

### HACS (Recommended)

Since this card is not yet in the default HACS store, add it as a custom repository:

1. Open HACS in your Home Assistant instance
2. Click the **3 dots** in the top right corner
3. Select **"Custom repositories"**
4. Add repository URL: `https://github.com/timmo001/ha-card-feature-weather-forecast`
5. Select category: **Dashboard**
6. Click **"ADD"**
7. Find "Weather forecast card" in the list and click **Download**

### Manual

1. Download `ha-card-feature-weather-forecast.js` from the latest release
2. Place it in your `config/www` folder
3. Add the resource in your Lovelace dashboard

### Publish to a running Home Assistant (SSH)

Copy `.env.example` to `.env`, set `PUBLISH_TARGET` (and optional `PUBLISH_PORT`), then run:

```bash
pnpm publish-to-local
```

This builds and syncs `dist/ha-card-feature-weather-forecast.js` to `/config/www/community/ha-card-feature-weather-forecast/` on the remote.

## Usage

Add the card to your dashboard using the Lovelace UI editor or YAML:

```yaml
type: custom:ha-card-feature-weather-forecast
entity: weather.home
forecast_type: daily
forecast_slots: 12
round_temperature: false
```
