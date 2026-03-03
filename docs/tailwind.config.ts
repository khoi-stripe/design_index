import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Sail Color Tokens
      colors: {
        // Primary colors
        primary: {
          DEFAULT: '#635BFF',
          hover: '#5851DF',
          pressed: '#4F46BA',
          light: '#E6E5FF',
        },
        // Semantic colors
        success: '#00D924',
        warning: '#FFA000',
        error: '#DF1B41',
        info: '#0074D4',
        // Neutral colors (support light/dark mode via CSS vars)
        background: {
          DEFAULT: 'var(--sail-color-background)',
          secondary: 'var(--sail-color-background-secondary)',
          tertiary: 'var(--sail-color-background-tertiary)',
        },
        foreground: {
          DEFAULT: 'var(--sail-color-text)',
          secondary: 'var(--sail-color-text-secondary)',
          tertiary: 'var(--sail-color-text-tertiary)',
        },
        border: {
          DEFAULT: 'var(--sail-color-border)',
          hover: 'var(--sail-color-border-hover)',
        },
      },
      // Sail Spacing Tokens
      spacing: {
        'sail-0': '0',
        'sail-25': '2px',
        'sail-50': '4px',
        'sail-75': '6px',
        'sail-100': '8px',
        'sail-150': '12px',
        'sail-200': '16px',
        'sail-300': '24px',
        'sail-400': '32px',
        'sail-500': '40px',
        'sail-600': '48px',
        'sail-700': '56px',
        'sail-800': '64px',
      },
      // Sail Border Radius
      borderRadius: {
        'sail-sm': '4px',
        'sail-md': '8px',
        'sail-lg': '12px',
        'sail-xl': '16px',
        'sail-full': '9999px',
      },
      // Sail Typography
      fontFamily: {
        sail: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Ubuntu',
          'sans-serif',
        ],
        mono: [
          'SFMono-Regular',
          'Consolas',
          'Liberation Mono',
          'Menlo',
          'Courier',
          'monospace',
        ],
      },
      fontSize: {
        'sail-xs': ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }],
        'sail-sm': ['14px', { lineHeight: '20px', letterSpacing: '0.01em' }],
        'sail-base': ['16px', { lineHeight: '24px', letterSpacing: '0' }],
        'sail-lg': ['18px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        'sail-xl': ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        'sail-2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
        'sail-3xl': ['30px', { lineHeight: '36px', letterSpacing: '-0.02em' }],
        'sail-4xl': ['36px', { lineHeight: '44px', letterSpacing: '-0.02em' }],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      // Sail Shadows
      boxShadow: {
        'sail-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'sail-md': '0 4px 8px rgba(0, 0, 0, 0.08)',
        'sail-lg': '0 8px 16px rgba(0, 0, 0, 0.12)',
        'sail-xl': '0 16px 32px rgba(0, 0, 0, 0.16)',
      },
      // Animation durations (Sail tokens)
      transitionDuration: {
        'sail-fast': '150ms',
        'sail-base': '250ms',
        'sail-slow': '350ms',
      },
      // Z-index layers
      zIndex: {
        'dropdown': '1000',
        'modal': '2000',
        'popover': '3000',
        'tooltip': '4000',
        'toast': '5000',
      },
    },
  },
  plugins: [],
  darkMode: 'class', // Enable dark mode via class
};

export default config;
