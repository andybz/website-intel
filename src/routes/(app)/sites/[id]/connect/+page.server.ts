import type { Actions, PageServerLoad } from './$types';
import { createPairingToken } from '$lib/server/pairing';

export const load: PageServerLoad = async ({ parent }) => {
	const { site } = await parent();
	return { site };
};

export const actions: Actions = {
	default: async ({ params }) => {
		const siteId = Number(params.id);
		const { token } = await createPairingToken(siteId);
		return { pairingToken: token };
	}
};
