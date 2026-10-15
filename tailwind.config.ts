import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  corePlugins: {
    // Preserve the existing design system's reset and typography.
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
