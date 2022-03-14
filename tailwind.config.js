/**
 * @type {import('@types/tailwindcss/tailwind-config').TailwindConfig}
 */

module.exports = {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
}
