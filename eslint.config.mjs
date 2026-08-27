import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const ignores = [
  ".next/**",
  "coverage/**",
  "node_modules/**",
  "playwright-report/**",
  "test-results/**"
];

const eslintConfig = [...nextVitals, ...nextTypescript, { ignores }];

export default eslintConfig;
