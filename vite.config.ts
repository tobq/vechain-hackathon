import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
	build: {
		outDir: 'build',
		target: 'es2020',
		rollupOptions: {
			output: {
				format: 'iife', // Immediately Invoked Function Expression
				manualChunks: undefined,
			},
		},
	},
	server: {
		port: 3005,
		strictPort: true,
	},
	optimizeDeps: {
		esbuildOptions: { target: 'es2020' },
	},
	plugins: [
		nodePolyfills(),
		react(),
		svgr(),
	],
});
