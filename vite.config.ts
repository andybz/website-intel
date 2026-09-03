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

			// SvelteKit manages the nonce/hash for its own inline hydration
			// script automatically - hand-rolling this header in hooks.server.ts
			// would block hydration (README section 52 baseline hardening).
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					'style-src': ['self', 'unsafe-inline'],
					'img-src': ['self', 'data:', 'https://s.wordpress.com', 'https://*.wp.com'],
					'connect-src': ['self'],
					'frame-ancestors': ['none'],
					'base-uri': ['self'],
					'form-action': ['self']
				}
			},

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
