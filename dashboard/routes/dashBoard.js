const express = require("express");
const router = express.Router();

function getCommandMeta(command, name) {
	const config = command && command.config ? command.config : {};
	return {
		name: config.name || name,
		description: config.shortDescription || config.longDescription || "No description",
		category: config.category || "uncategorized",
		role: config.role ?? 0,
		aliases: Array.isArray(config.aliases) ? config.aliases : []
	};
}

module.exports = function ({ threadsData }) {
	router.get("/", async (req, res) => {
		const threads = await threadsData.getAll();
		const commands = Array.from(global.GoatBot.commands || new Map())
			.filter(([name, command]) => command && command.config && (command.config.name || name) === name)
			.map(([name, command]) => getCommandMeta(command, name))
			.sort((a, b) => a.name.localeCompare(b.name));
		const events = Array.from(global.GoatBot.eventCommands || new Map())
			.map(([name, event]) => ({
				name,
				description: event?.config?.description || event?.config?.shortDescription || "Event listener",
				category: event?.config?.category || "event"
			}))
			.sort((a, b) => a.name.localeCompare(b.name));

		res.render("dashboard", {
			threads,
			commands,
			events,
			bot: {
				id: global.botID || "Not connected",
				prefix: global.GoatBot.config.prefix,
				language: global.GoatBot.config.language,
				nickName: global.GoatBot.config.nickNameBot,
				databaseType: global.GoatBot.config.database?.type || "unknown",
				uptime: process.uptime()
			}
		});
	});

	return router;
};
