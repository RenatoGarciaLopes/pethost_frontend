import type { StorybookConfig } from "@storybook/nextjs-vite";

/** REQ-TOOL-011: Next/Vite workbench with accessible, executable stories. */
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)", "../.storybook/examples/*.stories.@(ts|tsx)"],
  staticDirs: ["../public"],
  framework: "@storybook/nextjs-vite",
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs", "@storybook/addon-vitest"],
};

export default config;
