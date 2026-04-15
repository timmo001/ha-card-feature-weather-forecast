# Weather forecast card

Use this card to display weather forecast entries for a weather entity.

```yaml
type: custom:ha-card-feature-weather-forecast
entity: weather.home
forecast_type: daily
forecast_slots: 12
round_temperature: false
```

`forecast_type` supports `daily`, `hourly`, `twice_daily`, or `legacy`.
