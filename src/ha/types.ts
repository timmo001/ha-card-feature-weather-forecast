import type {
  Connection,
  HassConfig,
  HassEntities,
} from "home-assistant-js-websocket";
import type { FrontendLocaleData } from "./data/translation";

export interface HomeAssistant {
  connection: Connection;
  states: HassEntities;
  config: HassConfig;
  locale: FrontendLocaleData;
  localize: (key: string, ...args: any[]) => string;
}

export interface LovelaceCardFeatureConfig {
  type: string;
  [key: string]: unknown;
}
