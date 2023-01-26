import type { ThemeColorCombo } from "./ThemeColors"

type Theme = {
  windblade: {
    colors: Record<string, ThemeColorCombo>;
    proportions: Record<string, number>;
    miscSizes: Record<string, string>;
    time: {
      baseUnitMs: number;
      functions: Record<string, string> & {
        default: string;
      };
    };
  };
};

export default Theme;
export * from "./ThemeColors";
