/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        forge: {
          bg: '#0a0a0f',
          panel: '#12121a',
          card: '#1a1a26',
          border: '#2a2a3e',
          accent: '#00ff94',
          accentDim: '#00cc76',
          warning: '#ffaa00',
          danger: '#ff4466',
          muted: '#6b6b8a',
          text: '#e8e8f0',
          textDim: '#9999b8',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Space Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #00ff9433' },
          '100%': { boxShadow: '0 0 20px #00ff9466' },
        }
      }
    },
  },
  plugins: [],
}
