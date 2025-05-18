/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Algomancy color palette
        algomancy: {
          // Dark backgrounds
          dark: "#0a0a0a",
          darker: "#050505",

          // Accent colors from the game art
          purple: {
            light: "#9d4edd",
            DEFAULT: "#7b2cbf",
            dark: "#5a189a",
          },
          blue: {
            light: "#48bfe3",
            DEFAULT: "#5390d9",
            dark: "#3a0ca3",
          },
          gold: {
            light: "#ffda6b",
            DEFAULT: "#f9c74f",
            dark: "#f3a712",
          },
          teal: {
            light: "#80ffdb",
            DEFAULT: "#56cfe1",
            dark: "#2ec4b6",
          },
          cosmic: {
            light: "#c77dff",
            DEFAULT: "#9d4edd",
            dark: "#7b2cbf",
          },
        },
        // Add direct color mappings for easier access
        primary: "#7b2cbf",
        secondary: "#5390d9",
        accent: "#f9c74f",
        highlight: "#56cfe1",
        background: "#0a0a0a",
        foreground: "#ededed",
      },
    },
  },
  plugins: [],
};
