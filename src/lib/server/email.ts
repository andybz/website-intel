import { env } from '$env/dynamic/private';

// Thin wrapper around Resend's HTTP API - no SDK dependency needed for one call.
export async function sendEmail(options: {
	to: string | string[];
	subject: string;
	html: string;
	text: string;
}) {
	if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
		throw new Error('RESEND_API_KEY / RESEND_FROM_EMAIL are not configured.');
	}

	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.RESEND_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: env.RESEND_FROM_EMAIL,
			to: options.to,
			subject: options.subject,
			html: options.html,
			text: options.text
		})
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Resend API error (${response.status}): ${body}`);
	}
}
