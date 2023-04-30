import type { APIRoute } from 'astro';
import { handleError, initAuth as initBaseAuth } from '@propelauth/cloudflare-worker';

export const get: APIRoute = async ({ params, request }) => {
	const propelauth = initBaseAuth({
		authUrl: import.meta.env.PUBLIC_AUTH_URL,
		apiKey: import.meta.env.PROPELAUTH_API_KEY,
		verifierKey: import.meta.env.PROPELAUTH_VERIFIER_KEY,
	});
	const token = request.headers.get('Authorization');
	try {
		if (!token) {
			throw new Error('No token');
		}
		const { orgId } = params;
		if (!orgId) {
			throw new Error('No orgId');
		}
		// check that we have access to this org
		await propelauth.validateAuthHeaderAndGetUserWithOrgInfo(token, { orgId });
		// get users in org
		const orgUsers = await propelauth.fetchUsersInOrg({ orgId });

		const responseData = {
			users: orgUsers.users.map((x) => {
				return {
					userId: x.userId,
					email: x.email,
				};
			}),
		};
		return new Response(JSON.stringify(responseData), { status: 200 });
	} catch (e) {
		const err = handleError(e, { logError: true, returnDetailedErrorToUser: false });
		return new Response(err.message, { status: err.status });
	}
};
