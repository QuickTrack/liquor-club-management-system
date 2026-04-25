import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      "node_modules/**",
      ".kilo/worktrees/**",
      ".next/**",
    ],
  },
];

export default eslintConfig;
