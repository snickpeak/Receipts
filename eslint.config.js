// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoFlat = require("eslint-config-expo/flat");

const expoArray = Array.isArray(expoFlat) ? expoFlat : [expoFlat];

module.exports = defineConfig([
  ...expoArray,
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    ignores: ["dist/**", ".expo/**", "node_modules/**"],
  },
]);
