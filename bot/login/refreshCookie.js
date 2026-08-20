/**
 * refreshCookie.js — shared "get a fresh appState" helper.
 *
 * Used by:
 *   - bot/login/sessionGuardian.js (automatic renewal in the background)
 *   - dashboard/app.js          (manual "Refresh cookies" button)
 *
 * Logs in with email + password (+ 2FASecret when 2FA is enabled) and returns
 * a fresh appState array ready to be written to account.txt.
 */

const totp = require("totp-generator");

function normalize2FASecret(secret) {
	// Mirrors the normalization done in login.js so TOTP codes match.
	return secret
		.normalize("NFD")
		.toLowerCase()
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[đ]/g, "d")
		.replace(/[Đ]/g, "D")
		.replace(/[(),\s]/g, "");
}

/**
 * @param {{email:string, password:string, "2FASecret"?:string, userAgent?:string, proxy?:any}} fbAccount
 * @param {object} [log] logger (optional)
 * @returns {Promise<Array>} fresh appState
 */
async function getFreshCookie(fbAccount, log) {
	const { email, password, userAgent, proxy, "2FASecret": secret2FA } = fbAccount;

	if (!email || !password)
		throw new Error("Email/password are not configured (config.json → facebookAccount)");

	const getFbstate1 = require("./getFbstate1.js");

	let appState;
	try {
		appState = await getFbstate1(email, password, userAgent, proxy);
	}
	catch (err) {
		if (err && err.name === "2FA_CODE_REQUIRED" && typeof err.continue === "function") {
			if (!secret2FA) {
				const e = new Error("2FA required but '2FASecret' is not set — add it to config.json → facebookAccount");
				e.name = "2FA_MISSING";
				throw e;
			}
			if (log && log.warn)
				log.warn("REFRESH COOKIE", "2FA required — generating code from 2FASecret…");
			const code = totp(normalize2FASecret(secret2FA));
			appState = await err.continue(code);
		}
		else {
			throw err;
		}
	}

	if (!appState || !appState.length)
		throw new Error("Login returned an empty appState");

	return appState;
}

module.exports = { getFreshCookie, normalize2FASecret };
