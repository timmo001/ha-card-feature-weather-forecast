import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getWeatherStateIcon } from "./weather";

type PartRecord = Record<string, unknown>;

const collectTemplateStrings = (part: unknown): string[] => {
  if (!part || typeof part !== "object") {
    return [];
  }

  const strings: string[] = [];
  const candidateStrings = (part as PartRecord).strings;
  if (Array.isArray(candidateStrings)) {
    strings.push(
      ...candidateStrings.filter(
        (value): value is string => typeof value === "string"
      )
    );
  }

  const values = (part as PartRecord).values;
  if (Array.isArray(values)) {
    for (const value of values) {
      strings.push(...collectTemplateStrings(value));
    }
  }

  return strings;
};

const flattenTemplateStrings = (part: unknown): string =>
  collectTemplateStrings(part).join(" ");

const createElement = () => ({}) as HTMLElement;

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
