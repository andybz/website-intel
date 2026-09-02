import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Self-hosted on our own Docker/Node server behind nginx (see deploy/).
			adapter: adapter(),

			alias: {
				// Points at the top-level db/ directory (schema + migrations), outside src/.
				'$db': 'db',
				'$db/*': 'db/*'
			}
		})
	],
	server: {
		// Allow access via a Cloudflare quick tunnel for testing the WordPress
		// plugin against a real, publicly reachable site (local dev only).
		allowedHosts: ['.trycloudflare.com']
	}
});
