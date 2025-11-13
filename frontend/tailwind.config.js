/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom dark theme colors
        dark: {
          bg: '#000000',
          surface: 'rgba(0, 0, 0, 0.8)',
          surfaceLight: 'rgba(0, 0, 0, 0.6)',
        },
        // Sentiment-based colors
        sentiment: {
          positive: '#FFA500',
          positiveLight: '#FFD700',
          negative: '#4169E1',
          negativeLight: '#6A5ACD',
          neutral: '#32CD32',
          neutralLight: '#00CED1',
        }
      },
      fontFamily: {
        'display': ['Space Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(255, 255, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 255, 255, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}