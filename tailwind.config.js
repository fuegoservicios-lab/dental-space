/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // --- NUEVA PALETA DE COLORES PROFESIONAL ---
      colors: {
        // Un azul cerceta más sofisticado para la marca principal
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9', // Azul vibrante
          600: '#0284c7', // Azul profesional (Botones primarios)
          700: '#0369a1', // Hover state
          900: '#075985', // Textos oscuros
        },
        // El color de acento derivado de tu logo (Magenta/Rosado)
        accent: {
          50: '#fdf2f8',
          100: '#fce7f3',
          500: '#ec4899', // El color principal del logo
          600: '#db2777', // Hover del acento
        }
      },
      // --- NUEVA FUENTE ---
      fontFamily: {
        sans: ['"Outfit"', 'sans-serif'], // Reemplaza la fuente por defecto
      },
      // --- MEJORES SOMBRAS ---
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}