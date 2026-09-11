// Builds the self-hosted WordPress plugin update package (README: this
// plugin is private, not on wordpress.org, so it checks our own server for
// updates via the "Plugin Update Checker" library bundled inside it).
// Runs as part of `npm run build` so every deploy ships a zip/JSON manifest
// matching whatever plugin version is currently in the repo.
import { createWriteStream, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ZipArchive } from 'archiver';

const APP_URL = 'https://monitor.andybz.com';
const PLUGIN_SLUG = 'causetrail-monitor';
const ROOT = join(import.meta.dirname, '..');
const PLUGIN_DIR = join(ROOT, 'wordpress-plugin', PLUGIN_SLUG);
const OUTPUT_DIR = join(ROOT, 'static', 'downloads');

function readPluginVersion(): string {
	const mainFile = readFileSync(join(PLUGIN_DIR, `${PLUGIN_SLUG}.php`), 'utf-8');
	const match = /^\s*\*\s*Version:\s*([\d.]+)/m.exec(mainFile);
	if (!match) throw new Error(`Could not find a Version header in ${PLUGIN_SLUG}.php`);
	return match[1];
}

async function buildZip(version: string): Promise<void> {
	const outputPath = join(OUTPUT_DIR, `${PLUGIN_SLUG}.zip`);
	const output = createWriteStream(outputPath);
	const archive = new ZipArchive({ zlib: { level: 9 } });

	const done = new Promise<void>((resolve, reject) => {
		output.on('close', () => resolve());
		archive.on('error', reject);
	});

	archive.pipe(output);
	// Nest under a folder matching the plugin slug - WordPress expects a
	// zip's top-level directory name to match the plugin for a clean install.
	archive.directory(PLUGIN_DIR, PLUGIN_SLUG);
	await archive.finalize();
	await done;

	console.log(`Built ${outputPath} (v${version})`);
}

function writeManifest(version: string): void {
	const manifest = {
		name: 'CauseTrail',
		version,
		download_url: `${APP_URL}/downloads/${PLUGIN_SLUG}.zip`,
		requires: '5.8',
		tested: '6.7',
		requires_php: '7.4',
		sections: {
			description:
				'Securely connects this WordPress website to the CauseTrail monitoring platform. Private plugin - not distributed via wordpress.org.'
		}
	};

	const outputPath = join(OUTPUT_DIR, `${PLUGIN_SLUG}.json`);
	writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
	console.log(`Wrote ${outputPath}`);
}

async function main() {
	if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

	const version = readPluginVersion();
	await buildZip(version);
	writeManifest(version);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
