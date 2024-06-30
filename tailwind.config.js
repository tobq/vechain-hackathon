/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
                accent: "var(--app-accent-colour)",
                darken: "rgba(0, 0, 0, 0.3)",
				lighten: "rgba(255, 255, 255, 0.05)",
				light: "rgba(255, 255, 255, 0.5)",
            },
		},
	},
	plugins: [],
}
