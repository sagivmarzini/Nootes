import coreWebVitalsConfig from "eslint-config-next/core-web-vitals";
import typescriptConfig from "eslint-config-next/typescript";

const eslintConfig = [
  ...coreWebVitalsConfig,
  ...typescriptConfig,

  {
    ignores: ["app/generated/prisma/**"],
  },

  {
    files: ["app/generated/prisma/**/*.js"],
    languageOptions: {
      sourceType: "module",
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-unused-vars": "off",
    },
  },
];

export default eslintConfig;
