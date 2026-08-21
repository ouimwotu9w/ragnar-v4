const fs = require("fs");
const path = require("path");
const express = require("express");

const router = express.Router();

function getCommandCount() {
	try {
		return fs.readdirSync(path.join(process.cwd(), "scripts", "cmds"))
			.filter(file => file.endsWith(".js")).length;
	}
	catch (_) {
		return 0;
	}
}

function countEnabledSettings(settings = {}) {
	return [
		"sendWelcomeMessage",
		"sendLeaveMessage",
		"sendRankupMessage",
		"customCommand",
		"badWords",
		"hideNotiMessage"
	].filter(key => settings[key] === true).length;
}

module.exports = function ({
	isAuthenticated,
	isVeryfiUserIDFacebook,
	checkHasAndInThread,
	threadsData,
	checkAuthConfigDashboardOfThread,
	imageExt,
	videoExt,
	audioExt,
	convertSize,
	drive,
	isVideoFile,
	config
}) {
	router
		.get("/", [isAuthenticated, isVeryfiUserIDFacebook], async (req, res, next) => {
			try {
				const allThreads = await threadsData.getAll();
				const threads = allThreads
					.filter(thread => thread.isGroup !== false)
					.filter(thread => thread.members?.some(member => member.userID == req.user.facebookUserID && member.inGroup));
				const groupCount = threads.length;
				const memberCount = threads.reduce((total, thread) => total + (thread.members || []).filter(member => member.inGroup).length, 0);
				const manageableCount = (await Promise.all(threads.map(thread => checkAuthConfigDashboardOfThread(thread, req.user.facebookUserID))))
					.filter(Boolean).length;
				const automationsEnabled = threads.reduce((total, thread) => total + countEnabledSettings(thread.settings), 0);

				res.render("dashboard", {
					threads,
					dashboardStats: {
						groupCount,
						memberCount,
						manageableCount,
						automationsEnabled,
						commandCount: getCommandCount(),
						uptimeSeconds: Math.floor(process.uptime()),
						prefix: config.prefix,
						language: config.language
					}
				});
			}
			catch (error) {
				next(error);
			}
		})
		.get("/:threadID", [isAuthenticated, isVeryfiUserIDFacebook, checkHasAndInThread], async (req, res, next) => {
			try {
				const { threadData } = req;
				const authConfigDashboard = await checkAuthConfigDashboardOfThread(threadData, req.user.facebookUserID);
				const isThreadAdmin = threadData.adminIDs?.includes(req.user.facebookUserID) || false;
				const warnings = authConfigDashboard ? [] : [{ msg: "ليس لديك صلاحية تعديل إعدادات هذه المجموعة." }];
				delete req.threadData;
				res.render("dashboard-thread", {
					threadData,
					threadDataJSON: encodeURIComponent(JSON.stringify(threadData)),
					authConfigDashboard,
					isThreadAdmin,
					warnings,
					settingsSummary: countEnabledSettings(threadData.settings)
				});
			}
			catch (error) {
				next(error);
			}
		})
		.get("/:threadID/:command", [isAuthenticated, isVeryfiUserIDFacebook, checkHasAndInThread], async (req, res, next) => {
			try {
				const command = req.params.command;
				const threadData = req.threadData;
				const threadDataJSON = encodeURIComponent(JSON.stringify(threadData));
				const variables = {
					threadID: req.params.threadID,
					threadData,
					threadDataJSON,
					command,
					imageExt,
					videoExt,
					audioExt,
					convertSize,
					isVideoFile
				};
				let renderFile;
				switch (command) {
					case "welcome": {
						renderFile = "dashboard-welcome";
						const files = await Promise.allSettled((threadData.data.welcomeAttachment || []).map(fileId => drive.default.files.get({
							fileId,
							fields: "name,mimeType,size,id,createdTime,webContentLink,fileExtension"
						})));
						variables.defaultWelcomeMessage = global.GoatBot.configCommands.envEvents.welcome.defaultWelcomeMessage;
						variables.welcomeAttachments = files.filter(item => item.status === "fulfilled").map(({ value }) => ({ ...value.data, urlDownload: value.data.webContentLink }));
						break;
					}
					case "leave": {
						renderFile = "dashboard-leave";
						const files = await Promise.allSettled((threadData.data.leaveAttachment || []).map(fileId => drive.default.files.get({
							fileId,
							fields: "name,mimeType,size,id,createdTime,webContentLink,fileExtension"
						})));
						variables.defaultLeaveMessage = global.GoatBot.configCommands.envEvents.leave.defaultLeaveMessage;
						variables.leaveAttachments = files.filter(item => item.status === "fulfilled").map(({ value }) => ({ ...value.data, urlDownload: value.data.webContentLink }));
						break;
					}
					case "rankup":
						renderFile = "dashboard-rankup";
						break;
					case "custom-cmd":
						renderFile = "dashboard-custom-cmd";
						break;
					default:
						req.flash("errors", { msg: "الصفحة المطلوبة غير موجودة." });
						return res.redirect("/dashboard");
				}
				res.render(renderFile, variables);
			}
			catch (error) {
				next(error);
			}
		});

	return router;
};
