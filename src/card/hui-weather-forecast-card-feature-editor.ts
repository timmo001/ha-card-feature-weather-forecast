import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import memoizeOne from "memoize-one";
import { assert } from "superstruct";
import { supportsFeature } from "../ha/common/entity/supports-feature";
import type {
  ForecastType,
  ModernForecastType,
  WeatherEntity,
} from "../ha/data/weather";
import { WeatherEntityFeature } from "../ha/data/weather";
import type { HomeAssistant } from "../ha/types";
import { FEATURE_EDITOR_TYPE, FEATURE_TYPE } from "./const";
import {
  normalizeWeatherForecastCardFeatureConfig,
  WeatherForecastCardFeatureConfig,
  weatherForecastCardFeatureConfigStruct,
} from "./weather-forecast-card-feature-config";

export const DEFAULT_FORECAST_SLOTS = 12;
export const MAX_FORECAST_SLOTS = 48;

type HaFormSchema = { name: string; [key: string]: unknown };

@customElement(FEATURE_EDITOR_TYPE)
export class HuiWeatherForecastCardFeatureEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @property({ attribute: false }) public context?: { entity_id?: string };

  @state() private _config?: WeatherForecastCardFeatureConfig;

  public setConfig(config: WeatherForecastCardFeatureConfig): void {
    const normalizedConfig = normalizeWeatherForecastCardFeatureConfig(
      config,
      DEFAULT_FORECAST_SLOTS,
      MAX_FORECAST_SLOTS
    );
    assert(normalizedConfig, weatherForecastCardFeatureConfigStruct);
    this._config = normalizedConfig;
  }

  private get _stateObj(): WeatherEntity | undefined {
    if (!this.hass || !this.context?.entity_id) {
      return undefined;
    }

    return this.hass.states[this.context.entity_id] as
      | WeatherEntity
      | undefined;
  }

  private _forecastSupported(forecastType: ForecastType): boolean {
    const stateObj = this._stateObj;
    if (!stateObj || forecastType === "legacy") {
      return false;
    }

    if (forecastType === "daily") {
      return supportsFeature(stateObj, WeatherEntityFeature.FORECAST_DAILY);
    }
    if (forecastType === "hourly") {
      return supportsFeature(stateObj, WeatherEntityFeature.FORECAST_HOURLY);
    }

    return supportsFeature(stateObj, WeatherEntityFeature.FORECAST_TWICE_DAILY);
  }

  private get _defaultForecastType(): ModernForecastType | undefined {
    if (this._forecastSupported("daily")) {
      return "daily";
    }
    if (this._forecastSupported("hourly")) {
      return "hourly";
    }
    if (this._forecastSupported("twice_daily")) {
      return "twice_daily";
    }
    return undefined;
  }

  private _schema = memoizeOne(
    (
      localize: HomeAssistant["localize"],
      hasDaily: boolean,
      hasHourly: boolean,
      hasTwiceDaily: boolean,
      hasLegacy: boolean
    ) => {
      const forecastTypeOptions = [
        ...(hasDaily
          ? ([
              {
                value: "daily",
                label:
                  localize("ui.card.weather.forecast_type.daily") || "Daily",
              },
            ] as const)
          : []),
        ...(hasHourly
          ? ([
              {
                value: "hourly",
                label:
                  localize("ui.card.weather.forecast_type.hourly") || "Hourly",
              },
            ] as const)
          : []),
        ...(hasTwiceDaily
          ? ([
              {
                value: "twice_daily",
                label:
                  localize("ui.card.weather.forecast_type.twice_daily") ||
                  "Twice daily",
              },
            ] as const)
          : []),
        ...(hasLegacy
          ? ([
              {
                value: "legacy",
                label: "Legacy",
              },
            ] as const)
          : []),
      ];

      return [
        ...(forecastTypeOptions.length
          ? ([
              {
                name: "forecast_type",
                default: forecastTypeOptions[0].value,
                selector: {
                  select: {
                    options: forecastTypeOptions,
                  },
                },
              },
            ] as const)
          : []),
        {
          name: "forecast_slots",
          default: DEFAULT_FORECAST_SLOTS,
          selector: {
            number: {
              min: 1,
              max: MAX_FORECAST_SLOTS,
              mode: "slider",
            },
          },
        },
        {
          name: "round_temperature",
          selector: { boolean: {} },
        },
      ] as const satisfies readonly HaFormSchema[];
    }
  );

  protected render() {
    if (!this.hass || !this._config) {
      return nothing;
    }

    const schema = this._schema(
      this.hass.localize,
      this._forecastSupported("daily"),
      this._forecastSupported("hourly"),
      this._forecastSupported("twice_daily"),
      (this._stateObj?.attributes.forecast?.length || 0) > 2
    );

    const data = normalizeWeatherForecastCardFeatureConfig(
      {
        ...this._config,
        forecast_type: this._config.forecast_type ?? this._defaultForecastType,
        type: `custom:${FEATURE_TYPE}`,
      },
      DEFAULT_FORECAST_SLOTS,
      MAX_FORECAST_SLOTS
    );

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${schema}
        .computeLabel=${this._computeLabelCallback}
        .computeHelper=${this._computeHelperCallback}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    const config = normalizeWeatherForecastCardFeatureConfig(
      {
        ...(this._config || { type: `custom:${FEATURE_TYPE}` }),
        ...ev.detail.value,
        type: `custom:${FEATURE_TYPE}`,
      },
      DEFAULT_FORECAST_SLOTS,
      MAX_FORECAST_SLOTS
    );

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
      })
    );
  }

  private _computeLabelCallback = (schema: HaFormSchema) => {
    switch (schema.name) {
      case "forecast_type":
        return "Forecast type";
      case "forecast_slots":
        return "Forecast slots";
      case "round_temperature":
        return "Round temperature";
      default:
        return undefined;
    }
  };

  private _computeHelperCallback = (schema: HaFormSchema) => {
    switch (schema.name) {
      case "forecast_type":
        return "Choose which forecast stream to render";
      case "forecast_slots":
        return "Set how many forecast entries to display";
      case "round_temperature":
        return "Show temperatures as whole numbers";
      default:
        return undefined;
    }
  };

  static get styles() {
    return [
      css`
        ha-form {
          display: block;
          margin-bottom: 24px;
        }
      `,
    ];
  }
}
