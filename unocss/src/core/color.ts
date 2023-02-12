import Theme, { ThemeColor } from "../theme/Theme";
import convert from 'better-color-tools';

export type ColorScheme = "dark" | "light";

export const getLCA = (color: ThemeColor): Record<ColorScheme, { l: number, c: number, a: number }> => {
  const l = color.dark.l;
  const c = color.dark.c;
  const a = color.dark.a ?? 1;

  return {
    dark: { l, c, a },
    light: {
      l: color.light?.l ?? 1 - l,
      c: color.light?.c ?? c,
      a: color.light?.a ?? a,
    },
  }
};

export const getLCHA = (hue: number, color: ThemeColor): Record<ColorScheme, { l: number, c: number, h: number, a: number }> => {
  let sla: any = getLCA(color);
  Object.assign(sla, {
    dark: { h: hue },
    light: { h: hue },
  });

  return sla;
};

export type ColorSchemeProps = Record<ColorScheme, Record<string, string>>;

export const getColorSchemeCSSProps = (theme: Theme, hue: number): ColorSchemeProps => {
  const { windblade } = theme;
  const { colors: colorCombos } = windblade;

  const colorSchemeProps: ColorSchemeProps = {
    light: {},
    dark: {},
  };

  // Iterate over color combos
  Object.entries(colorCombos).forEach(([colorComboName, colorCombo]) => {
    // Collect 'base' and 'on' colors into single array
    const colors = [
      colorCombo.base,
      ...colorCombo.on
    ];

    // Iterate over collected colors
    colors.forEach((color, i) => {
      // --NAME-0 is base
      // --NAME-1..inf is on
      const propName = `--${colorComboName}-${i === 0 ? "base" : "fg-" + i}`;

      const { dark: lcaDark, light: lcaLight } = getLCA(color);

      colorSchemeProps.dark[propName] = convert.from(`oklch(${lcaDark.l} ${lcaDark.c}, ${hue}, ${lcaDark.a})`).rgba;
      colorSchemeProps.light[propName] = convert.from(`oklch(${lcaLight.l} ${lcaLight.c}, ${hue}, ${lcaLight.a})`).rgba;
    });
  });

  return colorSchemeProps;
};
