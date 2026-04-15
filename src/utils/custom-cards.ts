interface RegisterCardFeatureParams {
  type: string;
  name: string;
  isSupported?: (hass: any, context: any) => boolean;
  configurable?: boolean;
}

export function registerCustomCardFeature(params: RegisterCardFeatureParams) {
  const customCardsWindow = window as Window & {
    customCardFeatures?: RegisterCardFeatureParams[];
  };

  customCardsWindow.customCardFeatures =
    customCardsWindow.customCardFeatures || [];

  if (
    customCardsWindow.customCardFeatures.some(
      (entry) => entry.type === params.type
    )
  ) {
    return;
  }

  customCardsWindow.customCardFeatures.push(params);
}
