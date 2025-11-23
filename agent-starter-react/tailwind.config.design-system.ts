/**
 * Tailwind CSS Configuration
 * Maps to Design Token System
 * 
 * This extends the default Tailwind config with our custom design tokens
 * for seamless integration with the existing design system.
 */

import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: 'class',
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Primary Gradient Colors
                'gradient-start': '#7C4DFF',
                'gradient-end': '#FF3CA6',

                // Success/Confirmation
                success: {
                    DEFAULT: '#10B981',
                    light: '#D1FAE5',
                    dark: '#059669',
                },

                // Semantic Colors
                error: {
                    DEFAULT: '#EF4444',
                    light: '#FEE2E2',
                },
                warning: {
                    DEFAULT: '#F59E0B',
                    light: '#FEF3C7',
                },
                info: {
                    DEFAULT: '#3B82F6',
                    light: '#DBEAFE',
                },
            },

            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['Monaco', 'Courier New', 'monospace'],
            },

            fontSize: {
                'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
                'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
                'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
                'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
                'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
                '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
                '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
                '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
                '5xl': ['3rem', { lineHeight: '1' }],           // 48px
                '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
            },

            fontWeight: {
                regular: '400',
                medium: '500',
                semibold: '600',
                bold: '700',
                extrabold: '800',
            },

            spacing: {
                '1': '0.25rem',   // 4px
                '2': '0.5rem',    // 8px
                '3': '0.75rem',   // 12px
                '4': '1rem',      // 16px
                '5': '1.25rem',   // 20px
                '6': '1.5rem',    // 24px
                '8': '2rem',      // 32px
                '10': '2.5rem',   // 40px
                '12': '3rem',     // 48px
                '16': '4rem',     // 64px
                '20': '5rem',     // 80px
                '24': '6rem',     // 96px
            },

            borderRadius: {
                'sm': '0.5rem',     // 8px
                'md': '0.75rem',    // 12px
                'lg': '1rem',       // 16px
                'xl': '1.25rem',    // 20px
                '2xl': '1.5rem',    // 24px
                '3xl': '2rem',      // 32px
                'full': '9999px',
            },

            boxShadow: {
                'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

                // Custom colored shadows
                'primary': '0 10px 25px -5px rgba(124, 77, 255, 0.3), 0 8px 10px -6px rgba(255, 60, 166, 0.2)',
                'success': '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
            },

            backdropBlur: {
                'sm': '4px',
                'md': '10px',
                'lg': '16px',
            },

            transitionDuration: {
                'instant': '100ms',
                'fast': '150ms',
                'normal': '180ms',
                'slow': '250ms',
                'slower': '350ms',
            },

            transitionTimingFunction: {
                'smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            },

            keyframes: {
                // Bubble entry animations
                'bubble-enter-right': {
                    from: {
                        opacity: '0',
                        transform: 'translateX(20px) scale(0.9)',
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateX(0) scale(1)',
                    },
                },
                'bubble-enter-left': {
                    from: {
                        opacity: '0',
                        transform: 'translateX(-20px) scale(0.9)',
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateX(0) scale(1)',
                    },
                },

                // Typing indicator
                'typing-bounce': {
                    '0%, 60%, 100%': { transform: 'translateY(0)' },
                    '30%': { transform: 'translateY(-8px)' },
                },

                // Fade animations
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },

                // Modal animations
                'modal-enter': {
                    from: {
                        opacity: '0',
                        transform: 'translateY(-30px) scale(0.95)',
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateY(0) scale(1)',
                    },
                },

                // Card entry
                'card-enter': {
                    from: {
                        opacity: '0',
                        transform: 'translateY(20px) scale(0.95)',
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateY(0) scale(1)',
                    },
                },

                // Shake animation for errors
                'shake': {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-4px)' },
                    '75%': { transform: 'translateX(4px)' },
                },

                // Success pulse
                'success-pulse': {
                    '0%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)' },
                    '100%': { boxShadow: '0 0 0 8px rgba(16, 185, 129, 0)' },
                },

                // Star fill animation
                'star-fill': {
                    '0%': { transform: 'scale(0.5)', opacity: '0' },
                    '50%': { transform: 'scale(1.2)' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },

                // Gradient shift
                'gradient-shift': {
                    '0%, 100%': { backgroundPosition: '0% 50%, 100% 50%' },
                    '50%': { backgroundPosition: '100% 50%, 0% 50%' },
                },

                // Skeleton loading
                'skeleton-loading': {
                    '0%': { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' },
                },

                // Spin (for loading indicators)
                'spin': {
                    to: { transform: 'rotate(360deg)' },
                },

                // Text shimmer
                'shimmer': {
                    to: { backgroundPosition: '200% center' },
                },
            },

            animation: {
                'bubble-enter-right': 'bubble-enter-right 300ms ease-out backwards',
                'bubble-enter-left': 'bubble-enter-left 300ms ease-out backwards',
                'typing-bounce': 'typing-bounce 1.4s infinite ease-in-out',
                'fade-in': 'fade-in 250ms ease-out',
                'modal-enter': 'modal-enter 300ms ease-out',
                'card-enter': 'card-enter 400ms ease-out backwards',
                'shake': 'shake 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                'success-pulse': 'success-pulse 600ms ease-out',
                'star-fill': 'star-fill 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                'gradient-shift': 'gradient-shift 15s ease infinite',
                'skeleton-loading': 'skeleton-loading 1.5s ease-in-out infinite',
                'spin': 'spin 600ms linear infinite',
                'shimmer': 'shimmer 3s linear infinite',
            },

            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #7C4DFF 0%, #FF3CA6 100%)',
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            },
        },
    },
    plugins: [],
}

export default config
