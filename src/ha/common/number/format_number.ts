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

const getDefaultFormatOptions = (
  num: string | number,
  options?: Intl.NumberFormatOptions
): Intl.NumberFormatOptions => {
  const defaultOptions: Intl.NumberFormatOptions = {
    maximumFractionDigits: 2,
    ...options,
  };

  if (typeof num !== "string") {
    return defaultOptions;
  }

  if (
    !options ||
    (options.minimumFractionDigits === undefined &&
      options.maximumFractionDigits === undefined)
  ) {
    const digits = num.includes(".") ? num.split(".")[1].length : 0;
    defaultOptions.minimumFractionDigits = digits;
    defaultOptions.maximumFractionDigits = digits;
  }

  return defaultOptions;
};

export const formatNumber = (
  num: string | number,
  localeOptions?: FrontendLocaleData,
  options?: Intl.NumberFormatOptions
): string => {
  const locale = localeOptions
    ? numberFormatToLocale(localeOptions)
    : undefined;

  if (
    localeOptions?.number_format !== NumberFormat.none &&
    Number.isFinite(Number(num))
  ) {
    try {
      return new Intl.NumberFormat(
        locale,
        getDefaultFormatOptions(num, options)
      ).format(Number(num));
    } catch {
      return new Intl.NumberFormat(
        undefined,
        getDefaultFormatOptions(num, options)
      ).format(Number(num));
    }
  }

  return String(num);
};
