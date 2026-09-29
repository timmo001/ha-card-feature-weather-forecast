interface RegisterCardFeatureParams {
  type: string;
  name: string;
  isSupported?: (hass: any, context: any) => boolean;
  configurable?: boolean;
}

declare global {
  interface Window {
    customCardFeatures?: RegisterCardFeatureParams[];
  }
}

export function registerCustomCardFeature(params: RegisterCardFeatureParams) {
  window.customCardFeatures = window.customCardFeatures || [];

  if (window.customCardFeatures.some((entry) => entry.type === params.type)) {
    return;
  }

  window.customCardFeatures.push(params);
}
