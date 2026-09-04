import { error, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { sites } from '$db/schema';
import { createPairingToken } from '$lib/server/pairing';

function normalizeUrl(input: string): URL | null {
	try {
		const url = new URL(input);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
		return url;
	} catch {
		return null;
	}
}

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role !== 'admin') error(404, 'Not found');
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Not authorized.', name: '', url: '' });

		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const rawUrl = String(data.get('url') ?? '').trim();

		if (!name || !rawUrl) {
			return fail(400, { error: 'Name and URL are required.', name, url: rawUrl });
		}

		const url = normalizeUrl(rawUrl);
		if (!url) {
			return fail(400, {
				error: 'Enter a valid website URL, e.g. https://example.com',
				name,
				url: rawUrl
			});
		}

		const [site] = await db
			.insert(sites)
			.values({ name, url: url.toString() })
			.returning();

		const { token } = await createPairingToken(site.id);

		return { success: true, site, pairingToken: token };
	}
};
