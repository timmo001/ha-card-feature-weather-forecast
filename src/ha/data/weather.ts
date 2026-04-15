import type {
  HassEntityAttributeBase,
  HassEntityBase,
} from "home-assistant-js-websocket";
import type { TemplateResult } from "lit";
import { css, html } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { supportsFeature } from "../common/entity/supports-feature";
import type { HomeAssistant } from "../types";

export const enum WeatherEntityFeature {
  FORECAST_DAILY = 1,
  FORECAST_HOURLY = 2,
  FORECAST_TWICE_DAILY = 4,
}

export type ModernForecastType = "hourly" | "daily" | "twice_daily";

export type ForecastType = ModernForecastType | "legacy";

export interface ForecastAttribute {
  temperature: number;
  datetime: string;
  templow?: number;
  precipitation?: number;
  precipitation_probability?: number;
  humidity?: number;
  condition?: string;
  is_daytime?: boolean;
  pressure?: number;
  wind_speed?: string;
}

interface WeatherEntityAttributes extends HassEntityAttributeBase {
  forecast?: ForecastAttribute[];
  precipitation_unit?: string;
  pressure_unit?: string;
  temperature_unit?: string;
  visibility_unit?: string;
  wind_speed_unit?: string;
}

export interface ForecastEvent {
  type: ModernForecastType;
  forecast: ForecastAttribute[] | null;
}

export interface WeatherEntity extends HassEntityBase {
  attributes: WeatherEntityAttributes;
}

export const weatherSVGStyles = css`
  .weather-icon {
    color: var(--primary-text-color);
  }
`;

const weatherIcons: Record<string, string> = {
  "clear-night": "mdi:weather-night",
  cloudy: "mdi:weather-cloudy",
  exceptional: "mdi:alert-circle-outline",
  fog: "mdi:weather-fog",
  hail: "mdi:weather-hail",
  lightning: "mdi:weather-lightning",
  "lightning-rainy": "mdi:weather-lightning-rainy",
  partlycloudy: "mdi:weather-partly-cloudy",
  pouring: "mdi:weather-pouring",
  rainy: "mdi:weather-rainy",
  snowy: "mdi:weather-snowy",
  "snowy-rainy": "mdi:weather-snowy-rainy",
  sunny: "mdi:weather-sunny",
  windy: "mdi:weather-windy",
  "windy-variant": "mdi:weather-windy-variant",
};

export const getWeatherStateIcon = (
  state: string,
  element: HTMLElement
): TemplateResult | undefined => {
  const userDefinedIcon = getComputedStyle(element).getPropertyValue(
    `--weather-icon-${state}`
  );

  if (userDefinedIcon) {
    return html`
      <div
        style="background-size: cover;${styleMap({
          "background-image": userDefinedIcon,
        })}"
      ></div>
    `;
  }

  const icon = weatherIcons[state];
  if (!icon) {
    return undefined;
  }

  return html`<ha-icon class="weather-icon" .icon=${icon}></ha-icon>`;
};

const EIGHT_HOURS = 28800000;
const DAY_IN_MILLISECONDS = 86400000;

const isForecastHourly = (
  forecast?: ForecastAttribute[]
): boolean | undefined => {
  if (forecast && forecast.length > 2) {
    const date1 = new Date(forecast[1].datetime);
    const date2 = new Date(forecast[2].datetime);
    const timeDiff = date2.getTime() - date1.getTime();

    return timeDiff < EIGHT_HOURS;
  }

  return undefined;
};

const isForecastTwiceDaily = (
  forecast?: ForecastAttribute[]
): boolean | undefined => {
  if (forecast && forecast.length > 2) {
    const date1 = new Date(forecast[1].datetime);
    const date2 = new Date(forecast[2].datetime);
    const timeDiff = date2.getTime() - date1.getTime();

    return timeDiff < DAY_IN_MILLISECONDS;
  }

  return undefined;
};

const getLegacyForecast = (
  weatherAttributes?: WeatherEntityAttributes
):
  | {
      forecast: ForecastAttribute[];
      type: "daily" | "hourly" | "twice_daily";
    }
  | undefined => {
  if (weatherAttributes?.forecast && weatherAttributes.forecast.length > 2) {
    if (isForecastHourly(weatherAttributes.forecast)) {
      return {
        forecast: weatherAttributes.forecast,
        type: "hourly",
      };
    }
    if (isForecastTwiceDaily(weatherAttributes.forecast)) {
      return {
        forecast: weatherAttributes.forecast,
        type: "twice_daily",
      };
    }
    return { forecast: weatherAttributes.forecast, type: "daily" };
  }
  return undefined;
};

export const getForecast = (
  weatherAttributes?: WeatherEntityAttributes,
  forecastEvent?: ForecastEvent,
  forecastType?: ForecastType
):
  | {
      forecast: ForecastAttribute[];
      type: "daily" | "hourly" | "twice_daily";
    }
  | undefined => {
  if (forecastType === undefined) {
    if (
      forecastEvent?.type !== undefined &&
      forecastEvent.forecast &&
      forecastEvent.forecast.length > 2
    ) {
      return { forecast: forecastEvent.forecast, type: forecastEvent.type };
    }
    return getLegacyForecast(weatherAttributes);
  }

  if (forecastType === "legacy") {
    return getLegacyForecast(weatherAttributes);
  }

  if (
    forecastType === forecastEvent?.type &&
    forecastEvent.forecast &&
    forecastEvent.forecast.length > 2
  ) {
    return { forecast: forecastEvent.forecast, type: forecastType };
  }

  return undefined;
};

export const subscribeForecast = (
  hass: HomeAssistant,
  entityId: string,
  forecastType: ModernForecastType,
  callback: (forecastEvent: ForecastEvent) => void
) =>
  hass.connection.subscribeMessage<ForecastEvent>(callback, {
    type: "weather/subscribe_forecast",
    forecast_type: forecastType,
    entity_id: entityId,
  });

export const getDefaultForecastType = (
  stateObj: HassEntityBase
): ModernForecastType | undefined => {
  if (supportsFeature(stateObj, WeatherEntityFeature.FORECAST_DAILY)) {
    return "daily";
  }
  if (supportsFeature(stateObj, WeatherEntityFeature.FORECAST_TWICE_DAILY)) {
    return "twice_daily";
  }
  if (supportsFeature(stateObj, WeatherEntityFeature.FORECAST_HOURLY)) {
    return "hourly";
  }
  return undefined;
};
