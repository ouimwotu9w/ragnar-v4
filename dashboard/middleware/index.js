const { threadsData } = global.db;

function isPostMethod(req) {
	return req.method === "POST";
}

function permissionError(res, status, message) {
	return res.status(status).send({
		status: "error",
		error: "PERMISSION_DENIED",
		message
	});
}

module.exports = function (checkAuthConfigDashboardOfThread) {
	return {
		isAuthenticated(req, res, next) {
			if (req.isAuthenticated()) return next();
			if (isPostMethod(req)) return permissionError(res, 401, "يجب تسجيل الدخول أولًا.");
			req.flash("errors", { msg: "يجب تسجيل الدخول أولًا." });
			return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
		},

		unAuthenticated(req, res, next) {
			if (!req.isAuthenticated()) return next();
			if (isPostMethod(req)) return permissionError(res, 403, "هذه العملية غير متاحة للحساب المسجل حاليًا.");
			return res.redirect("/");
		},

		isVeryfiUserIDFacebook(req, res, next) {
			if (req.user.facebookUserID) return next();
			if (isPostMethod(req)) return permissionError(res, 401, "يجب ربط معرّف فيسبوك بالحساب أولًا.");
			req.flash("errors", { msg: "اربط معرّف فيسبوك بالحساب قبل متابعة هذه العملية." });
			return res.redirect(`/verifyfbid?redirect=${encodeURIComponent(req.originalUrl)}`);
		},

		isWaitVerifyAccount(req, res, next) {
			if (req.session.waitVerifyAccount) return next();
			if (isPostMethod(req)) return permissionError(res, 401, "جلسة التحقق غير صالحة أو منتهية.");
			return res.redirect("/register");
		},

		async checkHasAndInThread(req, res, next) {
			try {
				const userID = req.user.facebookUserID;
				const threadID = isPostMethod(req) ? req.body.threadID : req.params.threadID;
				const threadData = await threadsData.get(threadID);
				if (!threadData) {
					if (isPostMethod(req)) return permissionError(res, 404, "المجموعة غير موجودة.");
					req.flash("errors", { msg: "المجموعة غير موجودة." });
					return res.redirect("/dashboard");
				}

				const findMember = threadData.members?.find(member => member.userID == userID && member.inGroup === true);
				if (!findMember) {
					if (isPostMethod(req)) return permissionError(res, 403, "حسابك ليس عضوًا حاليًا في هذه المجموعة.");
					req.flash("errors", { msg: "حسابك ليس عضوًا حاليًا في هذه المجموعة." });
					return res.redirect("/dashboard");
				}
				req.threadData = threadData;
				return next();
			}
			catch (error) {
				return next(error);
			}
		},

		async middlewareCheckAuthConfigDashboardOfThread(req, res, next) {
			try {
				const threadID = isPostMethod(req) ? req.body.threadID : req.params.threadID;
				if (await checkAuthConfigDashboardOfThread(threadID, req.user.facebookUserID)) return next();
				if (isPostMethod(req)) return permissionError(res, 403, "ليس لديك صلاحية تعديل إعدادات هذه المجموعة.");
				req.flash("errors", { msg: "إعدادات المجموعة متاحة لمشرفي المجموعة أو للأعضاء المخوّلين فقط." });
				return res.redirect("/dashboard");
			}
			catch (error) {
				return next(error);
			}
		},

		async isAdmin(req, res, next) {
			const userID = req.user.facebookUserID;
			if (!global.GoatBot.config.adminBot.includes(userID)) {
				if (isPostMethod(req)) return permissionError(res, 403, "هذه العملية متاحة لمدير البوت فقط.");
				req.flash("errors", { msg: "هذه الصفحة متاحة لمدير البوت فقط." });
				return res.redirect("/dashboard");
			}
			return next();
		}
	};
};
