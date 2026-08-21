const express = require("express");
const fs = require("fs-extra");
const router = express.Router();

function getCommandMeta(command, name) {
	const config = command && command.config ? command.config : {};
	return {
		name: config.name || name,
		description: config.shortDescription || config.longDescription || "لا يوجد وصف",
		category: config.category || "عام",
		role: config.role ?? 0,
		countDown: config.countDown ?? 0,
		aliases: Array.isArray(config.aliases) ? config.aliases : []
	};
}

function cleanList(value) {
	return String(value || "")
		.split(/[\n,]+/)
		.map(item => item.trim())
		.filter(Boolean);
}

function buildDashboardState({ threads, commands, events }) {
	const config = global.GoatBot.config;
	const uptime = process.uptime();
	const memory = process.memoryUsage();
	return {
		threads,
		commands,
		events,
		bot: {
			name: "RagnarBot-V0",
			programmer: "Saga Sama",
			id: global.botID || global.GoatBot.botID || "غير متصل",
			prefix: config.prefix,
			language: config.language,
			nickName: config.nickNameBot || "RagnarBot-V0",
			databaseType: config.database?.type || "unknown",
			dashboardPort: config.dashBoard?.port || config.serverUptime?.port || 3001,
			uptime,
			nodeVersion: process.version,
			platform: process.platform,
			memoryMB: Math.round(memory.rss / 1024 / 1024)
		},
		settings: {
			antiInbox: config.antiInbox === true,
			noPrefix: config.noPrefix?.enable === true,
			adminOnly: config.adminOnly?.enable === true,
			whiteListMode: config.whiteListMode?.enable === true,
			whiteListThreadMode: config.whiteListModeThread?.enable === true,
			autoRefreshThreadInfoFirstTime: config.database?.autoRefreshThreadInfoFirstTime === true,
			autoSyncWhenStart: config.database?.autoSyncWhenStart === true,
			sessionRefreshMinutes: config.facebookAccount?.intervalGetNewCookie || 1440,
			admins: config.adminBot || [],
			whiteListIds: config.whiteListMode?.whiteListIds || [],
			whiteListThreadIds: config.whiteListModeThread?.whiteListThreadIds || []
		}
	};
}

async function getDashboardPayload() {
	const threads = await global.db.threadsData.getAll();
	const commands = Array.from(global.GoatBot.commands || new Map())
		.filter(([name, command]) => command && command.config && (command.config.name || name) === name)
		.map(([name, command]) => getCommandMeta(command, name))
		.sort((a, b) => a.name.localeCompare(b.name));
	const events = Array.from(global.GoatBot.eventCommands || new Map())
		.map(([name, event]) => ({
			name,
			description: event?.config?.description || event?.config?.shortDescription || "مستمع أحداث",
			category: event?.config?.category || "event"
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
	return buildDashboardState({ threads, commands, events });
}

module.exports = function () {
	router.get("/", async (req, res) => {
		res.render("dashboard", await getDashboardPayload());
	});

	router.post("/settings", async (req, res) => {
		const config = global.GoatBot.config;
		const body = req.body || {};

		if (body.prefix)
			config.prefix = String(body.prefix).trim().slice(0, 10);
		if (body.language)
			config.language = String(body.language).trim().slice(0, 10);
		if (body.nickNameBot)
			config.nickNameBot = String(body.nickNameBot).trim().slice(0, 80);

		config.antiInbox = body.antiInbox === "on" || body.antiInbox === true;
		config.noPrefix = config.noPrefix || {};
		config.noPrefix.enable = body.noPrefix === "on" || body.noPrefix === true;
		config.adminOnly = config.adminOnly || {};
		config.adminOnly.enable = body.adminOnly === "on" || body.adminOnly === true;
		config.whiteListMode = config.whiteListMode || {};
		config.whiteListMode.enable = body.whiteListMode === "on" || body.whiteListMode === true;
		config.whiteListMode.whiteListIds = cleanList(body.whiteListIds);
		config.whiteListModeThread = config.whiteListModeThread || {};
		config.whiteListModeThread.enable = body.whiteListThreadMode === "on" || body.whiteListThreadMode === true;
		config.whiteListModeThread.whiteListThreadIds = cleanList(body.whiteListThreadIds);

		await fs.writeFile(global.client.dirConfig, JSON.stringify(config, null, 2));
		res.send({ status: "success", message: "تم حفظ إعدادات RagnarBot-V0 بنجاح. بعض الإعدادات تحتاج إعادة تشغيل." });
	});

	return router;
};
