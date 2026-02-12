import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          primary: '#1f2937',      // gray-800
          secondary: '#111827',    // gray-900
          light: '#374151',        // gray-700
          lighter: '#4b5563',      // gray-600
        },
      },
      backgroundImage: {
        'admin-gradient': 'linear-gradient(to right, #1f2937, #111827)',
        'admin-gradient-hover': 'linear-gradient(to right, #111827, #000000)',
      },
      boxShadow: {
        'admin': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'admin-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
