import { css, html, LitElement, nothing } from "lit";
import type { PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { assert } from "superstruct";
import { computeDomain } from "../ha/common/entity/compute_domain";
import { formatNumber } from "../ha/common/number/format_number";
import { DragScrollController } from "../ha/common/controllers/drag-scroll-controller";
import {
  ForecastAttribute,
  ForecastEvent,
  getDefaultForecastType,
  getForecast,
  getWeatherStateIcon,
  ModernForecastType,
  subscribeForecast,
  WeatherEntity,
  weatherSVGStyles,
} from "../ha/data/weather";
import type { HomeAssistant } from "../ha/types";
import { FEATURE_NAME, FEATURE_TYPE } from "./const";
import {
  normalizeWeatherForecastCardFeatureConfig,
  ForecastType,
  WeatherForecastCardFeatureConfig,
  weatherForecastCardFeatureConfigStruct,
} from "./weather-forecast-card-feature-config";
import {
  DEFAULT_FORECAST_SLOTS,
  MAX_FORECAST_SLOTS,
} from "./hui-weather-forecast-card-feature-editor";
import { registerCustomCardFeature } from "../utils/custom-cards";

const supportsWeatherForecastCardFeature = (
  hass: HomeAssistant,
  context: { entity_id?: string }
) => {
  const stateObj = context.entity_id
    ? (hass.states[context.entity_id] as WeatherEntity | undefined)
    : undefined;

  if (!stateObj || computeDomain(stateObj.entity_id) !== "weather") {
    return false;
  }

  return Boolean(
    getDefaultForecastType(stateObj) ||
    (stateObj.attributes.forecast?.length || 0) > 2
  );
};

registerCustomCardFeature({
  type: FEATURE_TYPE,
  name: FEATURE_NAME,
  configurable: true,
  isSupported: supportsWeatherForecastCardFeature,
});

@customElement(FEATURE_TYPE)
export class HuiWeatherForecastCardFeature extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @property({ attribute: false }) public context?: { entity_id?: string };

  @property({ attribute: false }) public stateObj?: WeatherEntity;

  @property({ attribute: false }) public color?: string;

  @property({ reflect: true }) public position?: string;

  @state() private _config?: WeatherForecastCardFeatureConfig;

  @state() private _forecastEvent?: ForecastEvent;

  @state() private _forecastType?: ForecastType;

  @state() private _subscribed?: Promise<() => void>;

  private _subscribedEntityId?: string;

  private _subscribedForecastType?: ModernForecastType;

  private _subscribedConnection?: HomeAssistant["connection"];

  private _dragScrollController = new DragScrollController(this, {
    selector: ".forecast",
    enabled: false,
  });

  static getStubConfig(): WeatherForecastCardFeatureConfig {
    return {
      type: `custom:${FEATURE_TYPE}`,
    };
  }

  public static async getConfigElement() {
    await import("./hui-weather-forecast-card-feature-editor");
    return document.createElement("hui-weather-forecast-card-feature-editor");
  }

  public setConfig(config: WeatherForecastCardFeatureConfig): void {
    const normalizedConfig = normalizeWeatherForecastCardFeatureConfig(
      config,
      DEFAULT_FORECAST_SLOTS,
      MAX_FORECAST_SLOTS
    );
    assert(normalizedConfig, weatherForecastCardFeatureConfigStruct);
    this._config = normalizedConfig;
  }

  public connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated) {
      this._subscribeForecastEvents();
    }
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    this._unsubscribeForecastEvents();
  }

  protected willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps);

    const nextForecastType = this._effectiveForecastType;
    const forecastTypeChanged = nextForecastType !== this._forecastType;
    const previousContext = changedProps.get("context") as
      | { entity_id?: string }
      | undefined;
    const contextEntityChanged =
      previousContext?.entity_id !== this.context?.entity_id;
    const previousHass = changedProps.get("hass") as HomeAssistant | undefined;
    const hassConnectionChanged =
      previousHass?.connection !== this.hass?.connection;
    const previousStateObj = changedProps.get("stateObj") as
      | WeatherEntity
      | undefined;
    const stateObjEntityChanged =
      previousStateObj?.entity_id !== this.stateObj?.entity_id;

    if (forecastTypeChanged) {
      this._forecastType = nextForecastType;
    }

    if (
      contextEntityChanged ||
      hassConnectionChanged ||
      stateObjEntityChanged ||
      changedProps.has("_config") ||
      forecastTypeChanged ||
      !this._subscribed
    ) {
      this._subscribeForecastEvents();
    }

    this._dragScrollController.enabled = Boolean(this._forecast?.length);
  }

  protected render() {
    if (
      !this._config ||
      !this.hass ||
      !this.context ||
      !this._stateObj ||
      !supportsWeatherForecastCardFeature(this.hass, this.context)
    ) {
      return nothing;
    }

    const hass = this.hass;

    const forecast = this._forecast;
    if (!forecast?.length) {
      return nothing;
    }

    const temperatureFormatOptions = this._config.round_temperature
      ? { maximumFractionDigits: 0 }
      : undefined;

    const forecastType = getForecast(
      this._stateObj.attributes,
      this._forecastEvent,
      this._forecastType
    )?.type;
    const hourly = forecastType === "hourly";
    const dayNight = forecastType === "twice_daily";
    const todayKey = this._dayKeyFromDate(new Date());

    return html`
      <div
        class=${classMap({
          forecast: true,
          dragging: this._dragScrollController.scrolling,
        })}
      >
        ${forecast.map(
          (item, index) => html`
            ${this._renderDayGroupLabel(
              item,
              index,
              forecast,
              dayNight,
              hourly,
              todayKey
            )}
            <div class="item">
              <div class="label">
                ${this._labelForForecast(item, hourly, dayNight)}
              </div>
              ${item.condition
                ? html`
                    <div class="icon">
                      ${getWeatherStateIcon(
                        item.condition,
                        this,
                        !(item.is_daytime || item.is_daytime === undefined)
                      ) ?? nothing}
                    </div>
                  `
                : nothing}
              <div class="temp">
                ${item.temperature !== undefined && item.temperature !== null
                  ? `${formatNumber(
                      item.temperature,
                      hass.locale,
                      temperatureFormatOptions
                    )}°`
                  : "--"}
              </div>
            </div>
          `
        )}
      </div>
    `;
  }

  private _renderDayGroupLabel(
    item: ForecastAttribute,
    index: number,
    forecast: ForecastAttribute[],
    dayNight: boolean,
    hourly: boolean,
    todayKey: string
  ) {
    if (!dayNight && !hourly) {
      return nothing;
    }
    const previousItem = forecast[index - 1];
    const itemDayKey = this._dayKeyForForecast(item);
    const dayChanged =
      !previousItem || itemDayKey !== this._dayKeyForForecast(previousItem);
    if (!dayChanged || itemDayKey === todayKey) {
      return nothing;
    }
    return html`<div class="item label-only">
      <div class="label">${this._dayLabelForForecast(item)}</div>
    </div>`;
  }

  private get _stateObj() {
    if (this.stateObj) {
      return this.stateObj;
    }
    if (!this.hass || !this.context?.entity_id) {
      return undefined;
    }
    return this.hass.states[this.context.entity_id] as
      | WeatherEntity
      | undefined;
  }

  private get _forecast() {
    const stateObj = this._stateObj;
    if (!stateObj) {
      return undefined;
    }
    return getForecast(
      stateObj.attributes,
      this._forecastEvent,
      this._forecastType
    )?.forecast?.slice(
      0,
      this._config?.forecast_slots ?? DEFAULT_FORECAST_SLOTS
    );
  }

  private get _effectiveForecastType(): ForecastType | undefined {
    const stateObj = this._stateObj;
    if (!stateObj) {
      return undefined;
    }

    if (this._config?.forecast_type !== undefined) {
      return this._config.forecast_type;
    }

    return (
      getDefaultForecastType(stateObj) ??
      ((stateObj.attributes.forecast?.length || 0) > 2 ? "legacy" : undefined)
    );
  }

  private get _modernForecastType(): ModernForecastType | undefined {
    return this._forecastType !== "legacy" ? this._forecastType : undefined;
  }

  private _unsubscribeForecastEvents() {
    if (this._subscribed) {
      this._subscribed.then((unsub) => unsub()).catch(() => undefined);
      this._subscribed = undefined;
    }
    this._subscribedEntityId = undefined;
    this._subscribedForecastType = undefined;
    this._subscribedConnection = undefined;
    this._forecastEvent = undefined;
  }

  private _subscribeForecastEvents() {
    const modernForecastType = this._modernForecastType;
    const stateObj = this._stateObj;

    if (!this.isConnected || !this.hass || !stateObj || !modernForecastType) {
      this._unsubscribeForecastEvents();
      return;
    }

    if (
      this._subscribed &&
      this._subscribedConnection === this.hass.connection &&
      this._subscribedEntityId === stateObj.entity_id &&
      this._subscribedForecastType === modernForecastType
    ) {
      return;
    }

    this._unsubscribeForecastEvents();

    const subscribed = subscribeForecast(
      this.hass,
      stateObj.entity_id,
      modernForecastType,
      (event) => {
        this._forecastEvent = event;
      }
    );

    this._subscribed = subscribed;
    this._subscribedEntityId = stateObj.entity_id;
    this._subscribedForecastType = modernForecastType;
    this._subscribedConnection = this.hass.connection;
    subscribed.catch(() => {
      if (this._subscribed === subscribed) {
        this._subscribed = undefined;
        this._subscribedEntityId = undefined;
        this._subscribedForecastType = undefined;
        this._subscribedConnection = undefined;
      }
    });
  }

  private _labelForForecast(
    item: ForecastAttribute,
    hourly: boolean,
    dayNight: boolean
  ) {
    if (!this.hass) {
      return "";
    }

    if (hourly) {
      return new Intl.DateTimeFormat(this.hass.locale.language, {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(item.datetime));
    }
    if (dayNight) {
      return item.is_daytime !== false
        ? this.hass.localize("ui.card.weather.day") || "Day"
        : this.hass.localize("ui.card.weather.night") || "Night";
    }
    return this._dayLabelForForecast(item);
  }

  private _dayLabelForForecast(item: ForecastAttribute) {
    if (!this.hass) {
      return "";
    }
    return new Intl.DateTimeFormat(this.hass.locale.language, {
      weekday: "short",
    }).format(new Date(item.datetime));
  }

  private _dayKeyForForecast(item: ForecastAttribute) {
    return this._dayKeyFromDate(new Date(item.datetime));
  }

  private _dayKeyFromDate(date: Date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  static styles = [
    weatherSVGStyles,
    css`
      :host {
        display: block;
        width: calc(100% + 16px);
        margin: 0 -8px;
        pointer-events: auto;
        --icon-size: 28px;
      }

      :host([position="inline"]) {
        --icon-size: 20px;
      }

      .forecast {
        display: flex;
        justify-content: space-between;
        max-width: 100%;
        overflow: auto;
        scrollbar-color: var(--scrollbar-thumb-color) transparent;
        scrollbar-width: none;
        mask-image: linear-gradient(
          90deg,
          transparent 0%,
          black 16px,
          black calc(100% - 16px),
          transparent 100%
        );
        user-select: none;
        cursor: grab;
      }

      .forecast.dragging {
        cursor: grabbing;
      }

      .forecast.dragging * {
        pointer-events: none;
      }

      .forecast::-webkit-scrollbar {
        display: none;
      }

      .forecast::before,
      .forecast::after {
        content: "";
        position: relative;
        display: block;
        min-width: 8px;
        height: 1px;
        flex: 0 0 auto;
      }

      .item {
        display: flex;
        min-width: 52px;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: var(--ha-space-1, 4px);
      }

      .item.label-only {
        justify-content: flex-start;
      }

      .item.label-only .label {
        color: var(--secondary-text-color);
        font-weight: var(--ha-font-weight-bold, 700);
      }

      .label,
      .temp {
        line-height: 1;
        white-space: nowrap;
      }

      .label {
        color: var(--secondary-text-color);
        font-size: var(--ha-font-size-s, 12px);
      }

      .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: var(--icon-size);
        height: var(--icon-size);
      }

      .icon > * {
        width: 100%;
        height: 100%;
        --mdc-icon-size: var(--icon-size);
      }

      .temp {
        font-size: var(--ha-font-size-m, 14px);
      }
    `,
  ];
}
