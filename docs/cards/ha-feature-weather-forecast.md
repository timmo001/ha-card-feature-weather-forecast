# Weather forecast card feature

Use this feature inside a tile card to display weather forecast entries.

```yaml
type: tile
entity: weather.home
features:
  - type: custom:hui-weather-forecast-card-feature
    forecast_type: daily
    forecast_slots: 12
    round_temperature: false
```

`forecast_type` supports `daily`, `hourly`, `twice_daily`, or `legacy`.
