import type { TemplateResult } from "lit";
import { isTemplateResult } from "lit/directive-helpers.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getWeatherStateIcon } from "./weather";

const collectTemplateStrings = (part?: TemplateResult): string[] => {
  if (!part) {
    return [];
  }

  const strings = [...part.strings];

  for (const value of part.values) {
    if (isTemplateResult(value) && "strings" in value) {
      strings.push(...collectTemplateStrings(value));
    }
  }

  return strings;
};

const flattenTemplateStrings = (part?: TemplateResult): string =>
  collectTemplateStrings(part).join(" ");

const createElement = (): HTMLElement => Object.create(null);

beforeEach(() => {
  vi.stubGlobal("getComputedStyle", () => ({
    getPropertyValue: () => "",
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const hasClass = (strings: string, className: string) =>
  strings.includes(`class="${className}"`) ||
  strings.includes(`class=${className}`);

const hasTag = (strings: string, tagName: string) =>
  strings.includes(`<${tagName}`) || strings.includes(tagName);

describe("getWeatherStateIcon", () => {
  it("returns sun icon for partlycloudy during daytime", () => {
    const element = createElement();
    const icon = getWeatherStateIcon("partlycloudy", element, false);
    const strings = flattenTemplateStrings(icon);

    expect(hasClass(strings, "sun")).toBe(true);
    expect(hasClass(strings, "moon")).toBe(false);
  });

  it("returns moon icon for partlycloudy at night", () => {
    const element = createElement();
    const icon = getWeatherStateIcon("partlycloudy", element, true);
    const strings = flattenTemplateStrings(icon);

    expect(hasClass(strings, "moon")).toBe(true);
    expect(hasClass(strings, "sun")).toBe(false);
  });

  it("falls back to mdi icon for non-svg weather states", () => {
    const element = createElement();
    const icon = getWeatherStateIcon("exceptional", element);
    const strings = flattenTemplateStrings(icon);

    expect(hasTag(strings, "ha-icon")).toBe(true);
  });

  it("returns undefined for unknown weather states", () => {
    const element = createElement();
    const icon = getWeatherStateIcon("definitely-unknown", element);

    expect(icon).toBeUndefined();
  });
});
