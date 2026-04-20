/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        primary: { DEFAULT: '#2563EB', hover: '#1D4ED8', light: '#EFF6FF', mid: '#DBEAFE' },
        success: { DEFAULT: '#16A34A', light: '#F0FDF4', mid: '#DCFCE7' },
        danger:  { DEFAULT: '#DC2626', light: '#FEF2F2', mid: '#FEE2E2' },
        warning: { DEFAULT: '#D97706', light: '#FFFBEB', mid: '#FEF3C7' },
        sidebar: { DEFAULT: '#0F172A', 2: '#1E293B', 3: '#334155' },
        bg: '#F1F5F9',
        card: '#FFFFFF',
        border: { DEFAULT: '#E2E8F0', 2: '#CBD5E1' },
        t1: '#0F172A', t2: '#334155', t3: '#64748B', t4: '#94A3B8', t5: '#CBD5E1',
      },
      borderRadius: { sm: '8px', md: '12px', lg: '16px' },
      boxShadow: {
        sm: '0 1px 3px rgba(15,23,42,0.06),0 1px 2px rgba(15,23,42,0.04)',
        md: '0 4px 12px rgba(15,23,42,0.08),0 2px 4px rgba(15,23,42,0.04)',
        lg: '0 12px 32px rgba(15,23,42,0.12),0 4px 8px rgba(15,23,42,0.06)',
      },
    },
  },
  plugins: [],
}

