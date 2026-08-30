import type { Config } from 'tailwindcss'
import { fontFamily } from 'tailwindcss/defaultTheme'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      colors: {
        // ─── Primary — Azure ───────────────────────────────────────────
        primary: {
          DEFAULT: '#0EA5E9',
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          950: '#082F49',
          foreground: 'var(--primary-foreground)',
        },

        // ─── Secondary — Cyan ──────────────────────────────────────────
        cyan: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
        },

        // ─── Accent — Teal ─────────────────────────────────────────────
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },

        // ─── Semantic ──────────────────────────────────────────────────
        success: {
          DEFAULT: '#22C55E',
          light: '#DCFCE7',
          dark: '#15803D',
          border: '#BBF7D0',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#B45309',
          border: '#FDE68A',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
          dark: '#B91C1C',
          border: '#FECACA',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#EFF6FF',
          dark: '#1D4ED8',
          border: '#BFDBFE',
        },

        // ─── Surface — Background System ──────────────────────────────
        surface: {
          DEFAULT: '#F0F9FF',
          50: '#F0F9FF',
          100: '#ECFEFF',
          200: '#E0F2FE',
          300: '#CFFAFE',
          400: '#BAE6FD',
          white: '#FFFFFF',
          card: '#FFFFFF',
          overlay: 'rgba(15, 23, 42, 0.4)',
        },

        // ─── Text ──────────────────────────────────────────────────────
        text: {
          primary: '#0F172A',
          secondary: '#334155',
          tertiary: '#475569',
          muted: '#64748B',
          disabled: '#94A3B8',
          inverse: '#FFFFFF',
          link: '#0284C7',
          'link-hover': '#0369A1',
        },

        // ─── Border ────────────────────────────────────────────────────
        border: {
          DEFAULT: '#BAE6FD',
          subtle: '#E0F2FE',
          light: '#CFFAFE',
          medium: '#7DD3FC',
          strong: '#38BDF8',
          focus: '#0EA5E9',
        },

        // ─── Shadcn Semantic ──────────────────────────────────────────
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        input: 'var(--input)',
        ring: 'var(--ring)',
      },

      // ─── Typography ──────────────────────────────────────────────────
      fontFamily: {
        sans: ['Vazirmatn', ...fontFamily.sans],
        display: ['Vazirmatn', ...fontFamily.sans],
        mono: ['JetBrains Mono', 'Fira Code', ...fontFamily.mono],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
        xs: ['0.75rem', { lineHeight: '1.25rem' }],
        sm: ['0.875rem', { lineHeight: '1.5rem' }],
        base: ['1rem', { lineHeight: '1.75rem' }],
        lg: ['1.125rem', { lineHeight: '1.875rem' }],
        xl: ['1.25rem', { lineHeight: '1.875rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.375rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.75rem' }],
        '5xl': ['3rem', { lineHeight: '3.75rem' }],
      },

      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },

      letterSpacing: {
        tightest: '-0.05em',
        tighter: '-0.025em',
        tight: '-0.01em',
        normal: '0',
        wide: '0.025em',
      },

      // ─── Spacing ─────────────────────────────────────────────────────
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '6.5': '1.625rem',
        '7.5': '1.875rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '17': '4.25rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '68': '17rem',
        '72': '18rem',
        '76': '19rem',
        '80': '20rem',
        '88': '22rem',
        '96': '24rem',
      },

      // ─── Border Radius ───────────────────────────────────────────────
      borderRadius: {
        none: '0',
        xs: '4px',
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '14px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
        '5xl': '28px',
        full: '9999px',
      },

      // ─── Box Shadow ──────────────────────────────────────────────────
      boxShadow: {
        none: 'none',
        xs: '0 1px 4px rgba(14, 165, 233, 0.04)',
        soft: '0 2px 10px rgba(14, 165, 233, 0.06)',
        card: '0 4px 20px rgba(14, 165, 233, 0.08)',
        md: '0 6px 28px rgba(14, 165, 233, 0.10)',
        lg: '0 8px 36px rgba(14, 165, 233, 0.12)',
        xl: '0 12px 48px rgba(14, 165, 233, 0.15)',
        '2xl': '0 20px 64px rgba(14, 165, 233, 0.18)',
        inner: 'inset 0 2px 8px rgba(14, 165, 233, 0.08)',
        focus: '0 0 0 3px rgba(14, 165, 233, 0.20)',
        'focus-danger': '0 0 0 3px rgba(239, 68, 68, 0.20)',
        glow: '0 0 20px rgba(14, 165, 233, 0.20)',
        'glow-sm': '0 0 12px rgba(14, 165, 233, 0.15)',
        'glow-lg': '0 0 40px rgba(14, 165, 233, 0.25)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.20)',
        'glow-teal': '0 0 20px rgba(20, 184, 166, 0.20)',
        danger: '0 4px 20px rgba(239, 68, 68, 0.15)',
        success: '0 4px 20px rgba(34, 197, 94, 0.15)',
        warning: '0 4px 20px rgba(245, 158, 11, 0.15)',
      },

      // ─── Background Image ────────────────────────────────────────────
      backgroundImage: {
        // Main Gradients
        'gradient-main':
          'linear-gradient(135deg, #F0F9FF 0%, #ECFEFF 40%, #F0F9FF 70%, #FFFFFF 100%)',
        'gradient-surface':
          'linear-gradient(160deg, #F0F9FF 0%, #ECFEFF 100%)',
        'gradient-card':
          'linear-gradient(145deg, #FFFFFF 0%, #F0F9FF 60%, #ECFEFF 100%)',
        'gradient-card-hover':
          'linear-gradient(145deg, #FFFFFF 0%, #E0F2FE 60%, #CFFAFE 100%)',

        // Azure Gradients
        'gradient-azure':
          'linear-gradient(135deg, #0EA5E9 0%, #0284C7 50%, #0369A1 100%)',
        'gradient-azure-soft':
          'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 50%, #0284C7 100%)',
        'gradient-azure-light':
          'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 50%, #7DD3FC 100%)',

        // Cyan Gradients
        'gradient-cyan':
          'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
        'gradient-cyan-soft':
          'linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%)',

        // Teal Gradients
        'gradient-teal':
          'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',

        // Hero / Special
        'gradient-hero':
          'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 50%, #14B8A6 100%)',
        'gradient-hero-soft':
          'linear-gradient(135deg, #BAE6FD 0%, #A5F3FC 50%, #99F6E4 100%)',

        // Ambient / Glow
        'glow-top-right':
          'radial-gradient(ellipse at top right, rgba(14,165,233,0.15) 0%, transparent 50%)',
        'glow-top-left':
          'radial-gradient(ellipse at top left, rgba(6,182,212,0.12) 0%, transparent 50%)',
        'glow-bottom':
          'radial-gradient(ellipse at bottom, rgba(20,184,166,0.08) 0%, transparent 60%)',
        'glow-center':
          'radial-gradient(ellipse at center, rgba(14,165,233,0.08) 0%, transparent 70%)',
        'glow-radial':
          'radial-gradient(circle at 70% 20%, rgba(14,165,233,0.12) 0%, rgba(6,182,212,0.06) 30%, transparent 60%)',

        // Mesh / Pattern
        'mesh-azure':
          'radial-gradient(at 40% 20%, rgba(14,165,233,0.10) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(6,182,212,0.08) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(20,184,166,0.06) 0px, transparent 50%)',

        // Semantic
        'gradient-success':
          'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
        'gradient-warning':
          'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        'gradient-danger':
          'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        'gradient-info':
          'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',

        // Shimmer (for loading)
        shimmer:
          'linear-gradient(90deg, transparent 0%, rgba(14,165,233,0.08) 50%, transparent 100%)',

        // None
        none: 'none',
      },

      // ─── Animation ───────────────────────────────────────────────────
      animation: {
        // Entrance
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.35s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.35s ease-out forwards',
        'slide-in-right': 'slideInRight 0.35s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.35s ease-out forwards',
        'scale-in': 'scaleIn 0.25s ease-out forwards',
        'blur-in': 'blurIn 0.4s ease-out forwards',

        // Continuous
        'spin-slow': 'spin 3s linear infinite',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
        'pulse-azure': 'pulseAzure 2s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',

        // Attention
        'ping-sm': 'pingSm 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        wiggle: 'wiggle 0.5s ease-in-out',

        // Chart
        'draw-line': 'drawLine 1.5s ease-out forwards',
        'bar-grow': 'barGrow 0.8s ease-out forwards',
        'count-up': 'countUp 0.6s ease-out forwards',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        blurIn: {
          '0%': { opacity: '0', filter: 'blur(8px)' },
          '100%': { opacity: '1', filter: 'blur(0px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        pulseAzure: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(14, 165, 233, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(14, 165, 233, 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        pingSm: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '75%, 100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        drawLine: {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        barGrow: {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'bottom' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'bottom' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      // ─── Transition ──────────────────────────────────────────────────
      transitionDuration: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },

      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ease-in-back': 'cubic-bezier(0.36, 0, 0.66, -0.56)',
        'ease-out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // ─── Backdrop Blur ───────────────────────────────────────────────
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
      },

      // ─── Z-Index ─────────────────────────────────────────────────────
      zIndex: {
        '1': '1',
        '2': '2',
        '5': '5',
        '10': '10',
        '20': '20',
        '25': '25',
        '30': '30',
        '40': '40',
        '50': '50',
        sidebar: '30',
        header: '20',
        modal: '50',
        toast: '60',
        tooltip: '70',
      },

      // ─── Width / Height ──────────────────────────────────────────────
      width: {
        sidebar: '16rem',
        'sidebar-collapsed': '4.5rem',
      },

      height: {
        header: '4rem',
        'screen-minus-header': 'calc(100vh - 4rem)',
      },

      minHeight: {
        '0': '0',
        '1/4': '25vh',
        '1/2': '50vh',
        '3/4': '75vh',
        screen: '100vh',
      },

      // ─── Grid ────────────────────────────────────────────────────────
      gridTemplateColumns: {
        'auto-fill-card': 'repeat(auto-fill, minmax(280px, 1fr))',
        'auto-fill-metric': 'repeat(auto-fill, minmax(200px, 1fr))',
        sidebar: '16rem 1fr',
      },

      // ─── Blur ────────────────────────────────────────────────────────
      blur: {
        xs: '2px',
      },
    },
  },

  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    require('@tailwindcss/typography'),
  ],
}

export default config