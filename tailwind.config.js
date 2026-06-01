/** @type {import('tailwindcss').Config} */
import PrimeUI from "tailwindcss-primeui";
import themeConfig from "../CommonLibrary-UI/BBLayout-mongo/src/lib/utility/tailwindconfig/tailwind.config";
module.exports = {
  content: ["./projects/**/*.{html,ts}"],
  theme: {
    ...themeConfig,
  },
  plugins: [PrimeUI],
};
