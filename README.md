# Weather forecast card feature

> [!WARNING]
> This card feature is experimental, and breaking changes may occur.

A custom Home Assistant tile card feature that renders weather forecast slots with support for daily, hourly, twice daily, and legacy forecast modes.

https://github.com/user-attachments/assets/b9081de3-0d2e-4199-a740-d3970a38eb78

Original from https://github.com/home-assistant/frontend/pull/51559 which is not a good fit for main repo, so was moved here.

Some other concerns raised on that PR are not resolved at time of writing. Support will be limited, but contributions and fixes welcome.

## Installation

### HACS (Recommended)

Since this card is not yet in the default HACS store, add it as a custom repository:

1. Open HACS in your Home Assistant instance
2. Click the **3 dots** in the top right corner
3. Select **"Custom repositories"**
4. Add repository URL: `https://github.com/timmo001/ha-card-feature-weather-forecast`
5. Select category: **Dashboard**
6. Click **"ADD"**
7. Find "Card feature weather forecast" in the list and click **Download**

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

Add the feature to a tile card in YAML:

```yaml
type: tile
entity: weather.home
features:
  - type: custom:hui-weather-forecast-card-feature
    forecast_type: daily
    forecast_slots: 12
    round_temperature: false
```
