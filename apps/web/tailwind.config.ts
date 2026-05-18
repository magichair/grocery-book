import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1E40AF",
          light: "#3B82F6",
        },
        "best-price": "#F59E0B",
      },
    },
  },
  plugins: [],
}

export default config
