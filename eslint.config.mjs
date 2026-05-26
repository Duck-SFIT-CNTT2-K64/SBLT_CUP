import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    ".next-old/**",
  ]),
  // Allow Math.random in visual-only components (sparkle/ball animations)
  {
    files: ["src/components/BallDraw.tsx"],
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Allow ref access during render for animation state display
  {
    files: ["src/components/tft/DuckRace.tsx"],
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);

export default eslintConfig;
