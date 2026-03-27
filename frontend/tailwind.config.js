export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream:    '#FAF6F0', sand:     '#EDE0CC', powder:   '#F5EDE2',
        warm:     '#E8D5B7', blossom:  '#F0E2D8', lavezzi:  '#DDD5C8',
        galet:    '#D4C4B0', tape:     '#C4B09A', tan:      '#B89A7A',
        akan:     '#C8A882', noisette: '#9B7D60',
        caramel: { DEFAULT:'#C9A84C', soft:'#D4B87A', dark:'#A8892A' },
        brown:  { DEFAULT:'#5C3D2E', deep:'#3D2314', soft:'#7A5C42' },
        iragi: {
          50:'#FAF6F0', 100:'#EDE0CC', 200:'#E8D5B7',
          300:'#D4C4B0', 400:'#C8A882', 500:'#C9A84C',
          600:'#A8892A', 700:'#7A5C42', 800:'#5C3D2E', 900:'#3D2314',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:    ['Syne', 'system-ui', 'sans-serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'beige-sm': '0 2px 8px rgba(61,35,20,0.06)',
        'beige-md': '0 8px 24px rgba(61,35,20,0.10)',
        'beige-lg': '0 16px 48px rgba(61,35,20,0.16)',
        'gold':     '0 4px 16px rgba(201,168,76,0.28)',
        'gold-lg':  '0 8px 32px rgba(201,168,76,0.40)',
      },
      borderRadius: { 'xl2': '20px', 'xl3': '24px', 'xl4': '32px' },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'shimmer':     'shimmer 3s ease infinite',
        'fade-in':     'fadeIn 0.3s ease',
        'slide-up':    'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        'pop-in':      'popIn 0.4s cubic-bezier(0.16,1,0.3,1)',
        'spin-slow':   'spin 3s linear infinite',
      },
    }
  },
  plugins: [],
};
