import { assign, boolean, enums, number, object, optional } from "superstruct";
import type { LovelaceCardFeatureConfig } from "../ha";

export type ForecastType = "hourly" | "daily" | "twice_daily" | "legacy";

export interface WeatherForecastCardFeatureConfig extends LovelaceCardFeatureConfig {
  forecast_type?: ForecastType;
  forecast_slots?: number;
  round_temperature?: boolean;
}

const lovelaceCardFeatureConfigStruct = object({
  type: enums(["custom:hui-weather-forecast-card-feature"]),
});

export const weatherForecastCardFeatureConfigStruct = assign(
  lovelaceCardFeatureConfigStruct,
  object({
    forecast_type: optional(
      enums(["legacy", "daily", "hourly", "twice_daily"])
    ),
    forecast_slots: optional(number()),
    round_temperature: optional(boolean()),
  })
);

export const normalizeWeatherForecastCardFeatureConfig = (
  config: WeatherForecastCardFeatureConfig,
  defaultSlots: number,
  maxSlots: number
): WeatherForecastCardFeatureConfig => {
  const next = { ...config };
  const rawSlots = next.forecast_slots ?? defaultSlots;
  next.forecast_slots = Math.max(1, Math.min(maxSlots, Math.round(rawSlots)));
  return next;
};
