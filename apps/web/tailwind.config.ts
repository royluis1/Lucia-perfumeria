import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-bg)',
        ink: 'var(--color-fg)',
        gold: 'var(--color-accent)',
        'gold-soft': 'var(--color-accent-soft)',
        sand: 'var(--color-sand)',
        line: 'var(--color-line)',
        muted: 'var(--color-muted)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Archivo', 'Arial Narrow', 'sans-serif'],
        body: ['var(--font-body)', 'Archivo', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
