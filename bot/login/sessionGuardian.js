/**
 * sessionGuardian.js — Self-healing login for GoatBot-Pro
 *
 * Why this exists:
 *   Facebook frequently invalidates a bot's session cookies (logging in on
 *   another device, security checkpoints, password changes, or simply time).
 *   When that happens the bot silently goes "Not logged in" and you had to
 *   manually paste new cookies into account.txt.
 *
 * What it does:
 *   1. Periodically checks whether the current session cookie is still alive
 *      (using the same check Facebook-login uses at startup).
 *   2. If the session is dead, it automatically re-logs in using the email +
 *      password (+ 2FA secret if configured) and writes the fresh cookies to
 *      account.txt, then restarts the bot so it picks them up.
 *   3. If no email/password is configured it does nothing (it only logs a hint).
 *
 * Requirements (in config.json → facebookAccount):
 *   - email, password        (required for auto-relogin)
 *   - 2FASecret              (optional but strongly recommended — lets the bot
 *                             pass 2FA / login-approval automatically)
 *   - userAgent, proxy       (optional, reused from your login config)
 *   - intervalGetNewCookie   (minutes between checks, default 1440 = 1 day)
 */

const fs = require("fs-extra");
const checkLiveCookie = require("./checkLiveCookie.js");
const { getFreshCookie } = require("./refreshCookie.js");

function buildCookieString(appState) {
	if (Array.isArray(appState))
		return appState
			.map(c => `${c.key || c.name}=${c.value}`)
			.join("; ");
	return String(appState);
}

async function readCurrentAppState(api, dirAccount) {
	// Prefer the live appState from the fca API; fall back to account.txt.
	if (api && typeof api.getAppState === "function") {
		try {
			const state = api.getAppState();
			if (state && (Array.isArray(state) ? state.length : true))
				return state;
		}
		catch (e) { /* ignore and fall back */ }
	}
	const raw = await fs.readFile(dirAccount, "utf8");
	return JSON.parse(raw);
}

/**
 * @param {{ api: object }} ctx
 * @returns {boolean} true if the guardian started, false if skipped (no creds)
 */
module.exports = async function ({ api }) {
	const { config } = global.GoatBot;
	const { log, getText } = global.utils;
	const fbAccount = config.facebookAccount || {};

	const email = (fbAccount.email || "").trim();
	const password = (fbAccount.password || "").trim();

	if (!email || !password) {
		log.warn(
			"SESSION GUARDIAN",
			"Skipped — no email/password in config.json → facebookAccount. " +
			"Set them (plus 2FASecret) to enable automatic cookie renewal when Facebook logs the bot out."
		);
		return false;
	}

	const intervalMinutes = parseInt(fbAccount.intervalGetNewCookie, 10);
	const intervalMs = (isNaN(intervalMinutes) || intervalMinutes <= 0 ? 1440 : intervalMinutes) * 60 * 1000;
	const dirAccount = global.client.dirAccount;

	// Prevent overlapping runs (e.g. a slow relogin while the next tick fires).
	let running = false;

	const check = async () => {
		if (running)
			return;
		running = true;
		try {
			const appState = await readCurrentAppState(api, dirAccount);
			const cookie = buildCookieString(appState);
			const alive = await checkLiveCookie(cookie, fbAccount.userAgent);

			if (alive) {
				log.info("SESSION GUARDIAN", "Session is alive ✅ (next check in " + intervalMinutes + " min)");
				return;
			}

			log.warn("SESSION GUARDIAN", "Session cookie is dead ❌ — attempting automatic re-login via email/password…");
			const fresh = await getFreshCookie(fbAccount, log);
			await fs.writeFile(dirAccount, JSON.stringify(fresh, null, 2));
			log.success("SESSION GUARDIAN", "Fresh cookies saved to account.txt — restarting bot to apply…");
			setTimeout(() => process.exit(2), 1500);
		}
		catch (err) {
			const name = err && err.name ? err.name : "";
			const msg = err && err.message ? err.message : String(err);

			if (name === "WRONG_ACCOUNT" || name === "OLD_PASSWORD") {
				log.err("SESSION GUARDIAN", "Auto-relogin failed: " + msg + " — update email/password in config and restart.");
			}
			else if (name === "2FA_MISSING") {
				log.err("SESSION GUARDIAN", msg);
			}
			else if (name && name.startsWith("CHECKPOINT_")) {
				log.err("SESSION GUARDIAN", "Facebook checkpointed the account (" + msg + "). Log in manually and complete it.");
			}
			else {
				log.err("SESSION GUARDIAN", "Could not auto-renew cookies: " + msg);
			}
		}
		finally {
			running = false;
		}
	};

	// First check after a short delay (let startup settle), then on interval.
	setTimeout(check, 30 * 1000);
	setInterval(check, intervalMs);

	log.info("SESSION GUARDIAN", "Active — auto-renewing cookies every " + intervalMinutes + " min when needed");
	return true;
};
