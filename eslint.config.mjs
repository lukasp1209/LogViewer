import { defineConfig, globalIgnores } from "eslint/config";
import parser from "jsonc-eslint-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname, // Optional, default to process.cwd()
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

/**
 * supported plugins for flat config
 * https://github.com/eslint/eslint/issues/18391
 */

export default defineConfig([
  globalIgnores([
    "**/coverage",
    "**eslint.config.mjs",
    "**/node_modules",
    "**/dist",
    "**/.angular",
    "**/.nx",
  ]),
  // order of extends is important
  // the first rule-set in extends is precedence over all other rule-sets in the extends list.
  // Rules can only be configured once, so when two rule-sets attempt to configure them,
  // the rule-set that is at the top of the hierarchy will have its configuration applied to the rule,
  // all other rule-sets attempting to configure the rule will be disregarded by ESLint for the rule in conflict (and only for the rule in conflict).

  ...compat.extends(
    "eslint:recommended",
    "plugin:@nx/typescript",
    "plugin:@nx/angular",
    "plugin:@typescript-eslint/recommended",
    "plugin:@angular-eslint/recommended"
  ),

  ...compat.plugins("@nx", "@angular-eslint", "@angular-eslint/template"),

  {
    files: ["**/*.json"],
    languageOptions: {
      parser: parser,
    },

    rules: {},
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: true,
          allow: [],

          depConstraints: [
            {
              sourceTag: "*",
              onlyDependOnLibsWithTags: ["*"],
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: compat.extends("plugin:@nx/typescript"),
    rules: {
      "@angular-eslint/use-component-view-encapsulation": "error",
      "@typescript-eslint/consistent-type-definitions": "error",
      "@typescript-eslint/explicit-member-accessibility": [
        "off",
        {
          accessibility: "explicit",
        },
      ],
      "@typescript-eslint/member-delimiter-style": [
        "off",
        {
          multiline: {
            delimiter: "none",
            requireLast: true,
          },

          singleline: {
            delimiter: "semi",
            requireLast: false,
          },
        },
      ],
      "no-console": "warn",
    },
  },
  {
    files: ["**/*.js", "**/*.jsx"],
    extends: compat.extends("plugin:@nx/javascript"),
    rules: {
      "no-extra-semi": "error",
    },
  },
  {
    files: ["**/*.html"],
    extends: compat.extends(),
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/adjacent-overload-signatures": "off",
      "@angular-eslint/template/no-inline-styles": [
        "error",
        { allowNgStyle: true },
      ],
    },
  },
]);
