const { log } = global.utils;

module.exports = async function ({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getText }) {
	// This is where you can add your custom code to the bot.
	// The bot will run this code every time it starts up (after logging in and loading data from the database).

	// Keep the fb_dtsg token fresh (needed by some Facebook actions).
	setInterval(async () => {
		api.refreshFb_dtsg()
			.then(() => {
				log.succes("refreshFb_dtsg", getText("custom", "refreshedFb_dtsg"));
			})
			.catch((err) => {
				log.error("refreshFb_dtsg", getText("custom", "refreshedFb_dtsgError"), err);
			});
	}, 1000 * 60 * 60 * 48); // 48h

	// Self-healing login: auto-renews cookies when Facebook logs the bot out.
	try {
		await require("./login/sessionGuardian.js")({ api });
	}
	catch (err) {
		log.error("SESSION GUARDIAN", "Could not start: " + (err.message || err));
	}
};
