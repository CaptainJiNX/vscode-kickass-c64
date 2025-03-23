const { defineConfig } = require("eslint/config");
const js = require("@eslint/js");
const globals = require("globals");
const prettierConfig = require("eslint-config-prettier");
const prettierPlugin = require("eslint-plugin-prettier");

module.exports = defineConfig([
  prettierConfig,
  {
    plugins: {
      js,
      prettier: prettierPlugin,
    },
    extends: ["js/recommended"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "commonjs",
      globals: globals.node,
    },
    rules: {
      "no-console": "off",
      "prettier/prettier": "error",
    },
  },
  {
    ignores: ["client/node_modules/**", "server/node_modules/**"],
  },
]);
