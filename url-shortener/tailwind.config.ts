// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}', // Keep if you also use pages dir
    './components/**/*.{js,ts,jsx,tsx,mdx}', // For shared components
    './app/**/*.{js,ts,jsx,tsx,mdx}', // <<< IMPORTANT FOR APP ROUTER
  ],
  theme: {
    extend: {
      backgroundImage: { // Example extension
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
export default config;