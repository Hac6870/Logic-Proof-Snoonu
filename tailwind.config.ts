import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                'snoonu-red': '#D80010',
                'snoonu-dark': '#404040',
                'snoonu-bg': '#F8F8F8',
                'snoonu-input': '#F0F0F0',
                'text-primary': '#111111',
                'text-secondary': '#6B6B6B',
                'divider': '#E8E8E8',
                'badge-green': '#22C55E',
            },
            borderRadius: {
                'card': '20px',
                'pill': '30px',
            },
            fontFamily: {
                sans: [
                    '-apple-system',
                    'BlinkMacSystemFont',
                    '"SF Pro Display"',
                    '"SF Pro Text"',
                    '"Helvetica Neue"',
                    'Arial',
                    'sans-serif'
                ],
            },
            boxShadow: {
                'card': '0 6px 18px rgba(0,0,0,0.06)',
            }
        },
    },
    plugins: [
        require("tailwindcss-animate"),
    ],
};
export default config;
