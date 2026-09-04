import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createPairingToken } from '$lib/server/pairing';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { site } = await parent();
	if (locals.user?.role !== 'admin') error(403, 'Not authorized.');
	return { site };
};

export const actions: Actions = {
	default: async ({ params, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Not authorized.' });

		const siteId = Number(params.id);
		const { token } = await createPairingToken(siteId);
		return { pairingToken: token };
	}
};
