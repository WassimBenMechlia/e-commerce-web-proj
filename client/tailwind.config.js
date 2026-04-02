/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          inverse: 'var(--bg-inverse)',
        },
        brand: {
          primary: 'var(--primary)',
          accent: 'var(--accent)',
          error: 'var(--error)',
          warning: 'var(--warning)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          inverse: 'var(--text-inverse)',
        },
        border: 'var(--border)',
        surface: 'var(--surface)',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(44, 36, 27, 0.08)',
      },
      borderRadius: {
        card: '12px',
        button: '8px',
        input: '4px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      backgroundImage: {
        'warm-grid':
          'radial-gradient(circle at top left, rgba(198, 93, 59, 0.12), transparent 42%), linear-gradient(180deg, rgba(234, 227, 217, 0.3), transparent)',
      },
    },
  },
  plugins: [],
};
