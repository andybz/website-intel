import { error, fail, redirect, type Actions } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { sites } from '$db/schema';

function normalizeUrl(input: string): URL | null {
	try {
		const url = new URL(input);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
		return url;
	} catch {
		return null;
	}
}

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { site } = await parent();
	if (locals.user?.role !== 'admin') error(403, 'Not authorized.');
	return { site };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Not authorized.', name: '', url: '' });

		const siteId = Number(params.id);
		if (!Number.isInteger(siteId)) error(404, 'Website not found');

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

		await db
			.update(sites)
			.set({ name, url: url.toString(), updatedAt: new Date() })
			.where(eq(sites.id, siteId));

		redirect(303, '/');
	}
};
