import type { Config } from 'tailwindcss'
import flowbite from "flowbite/plugin";


const config = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}', "./node_modules/flowbite-react/**/*.js",
    "./node_modules/flowbite/**/*.js",],
  theme: {
    extend: {},
  },
  plugins: [flowbite],
} satisfies Config

export default config