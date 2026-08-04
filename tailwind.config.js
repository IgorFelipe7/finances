/**
 * Tailwind CSS v4 uses a CSS-first config (see @theme in src/index.css) as the
 * source of truth for design tokens. This file only carries the settings that
 * still require JS: dark mode strategy and font fallbacks.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist Variable', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
