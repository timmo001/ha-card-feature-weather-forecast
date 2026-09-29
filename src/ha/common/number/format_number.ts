import { FrontendLocaleData, NumberFormat } from "../../data/translation";

const numberFormatToLocale = (
  localeOptions: FrontendLocaleData
): string | string[] | undefined => {
  switch (localeOptions.number_format) {
    case NumberFormat.comma_decimal:
      return ["en-US", "en"];
    case NumberFormat.decimal_comma:
      return ["de", "es", "it"];
    case NumberFormat.space_comma:
      return ["fr", "sv", "cs"];
    case NumberFormat.system:
      return undefined;
    default:
      return localeOptions.language;
  }
};

export const formatNumber = (
  num: number,
  localeOptions?: FrontendLocaleData,
  options?: Intl.NumberFormatOptions
): string => {
  const locale = localeOptions
    ? numberFormatToLocale(localeOptions)
    : undefined;

  if (
    localeOptions?.number_format !== NumberFormat.none &&
    Number.isFinite(num)
  ) {
    const formatOptions: Intl.NumberFormatOptions = {
      maximumFractionDigits: 2,
      ...options,
    };

    try {
      return new Intl.NumberFormat(locale, formatOptions).format(num);
    } catch {
      return new Intl.NumberFormat(undefined, formatOptions).format(num);
    }
  }

  return String(num);
};
