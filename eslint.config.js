import globals from "globals";
import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.browser,
                proj4: "readonly",
                Highcharts: "readonly",
                $: "readonly",  // jQuery
            },
        },
        files: ["static/js/**/*.js"],
        rules: {
            // Warnings for unused variables/params
            "no-unused-vars": ["warn", {
                "argsIgnorePattern": "^e$|^event$",  // Ignore 'e' and 'event' params
                "varsIgnorePattern": "^TARGET_YEARS$|^extractTimeSeriesData$|^buttonRect$|^chartRect$" // Ignore specific vars
            }],
            "no-undef": "warn",

            // Style rules
            "semi": ["error", "always"],
            "quotes": ["error", "single"],
            "indent": ["error", 4],
            "no-trailing-spaces": "error",
            "no-multiple-empty-lines": ["error", { "max": 2 }],
            "eol-last": ["error", "always"]
        }
    }
];
