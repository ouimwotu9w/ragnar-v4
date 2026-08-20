const axios = require("axios");

module.exports = {
	config: {
		name: "quran",
		aliases: ["ayah", "quranverse"],
		version: "1.0.0",
		author: "EryXenX",
		countDown: 5,
		role: 0,
		shortDescription: {
			en: "Get a random or specific Quran verse with translation",
			ar: "آية قرآنية عشوائية أو محددة مع الترجمة"
		},
		longDescription: {
			en: "Fetch a random verse from the Holy Quran, or a specific verse by reference (e.g. 2:255). Returns the Arabic text, English translation and Surah info.",
			ar: "جلب آية عشوائية من القرآن الكريم، أو آية محددة بالرقم (مثل 2:255). يعرض النص العربي والترجمة الإنجليزية ومعلومات السورة."
		},
		category: "religion",
		guide: {
			en: "   {pn}: Get a random verse\n   {pn} <surah:ayah>: Get a specific verse (e.g. {pn} 2:255)",
			ar: "   {pn}: آية عشوائية\n   {pn} <السورة:الآية>: آية محددة (مثل {pn} 2:255)"
		}
	},

	onStart: async function ({ message, args }) {
		const ref = args[0]?.trim();

		// Validate the reference format if provided (surah:ayah, both numeric).
		if (ref && !/^\d{1,3}:\d{1,3}$/.test(ref))
			return message.reply("❌ Invalid reference. Use the format `surah:ayah`, e.g. `2:255`.");

		// Random ayah (total ayahs in the Quran = 6236).
		const target = ref || `${Math.floor(Math.random() * 6236) + 1}`;

		const url = ref
			? `https://api.alquran.cloud/v1/ayah/${ref}/editions/quran-uthmani,en.sahih`
			: `https://api.alquran.cloud/v1/ayah/${target}/editions/quran-uthmani,en.sahih`;

		let data;
		try {
			const res = await axios.get(url, { timeout: 15000 });
			data = res.data;
		}
		catch (err) {
			return message.reply("⚠️ Could not reach the Quran API. Please try again later.");
		}

		if (!data || data.code !== 200 || !Array.isArray(data.data) || data.data.length < 2)
			return message.reply("⚠️ Sorry, I couldn't find that verse. Check the reference and try again.");

		const arabic = data.data.find(e => e.edition?.identifier === "quran-uthmani") || data.data[0];
		const english = data.data.find(e => e.edition?.identifier === "en.sahih") || data.data[1];

		const surahNameAr = arabic.surah?.name || "";
		const surahNameEn = english.surah?.englishName || "";
		const ayahNumber = arabic.numberInSurah;
		const surahNumber = arabic.surah?.number;

		const text = `🕌 ── ‏القرآن الكريم  ── 🕌

${arabic.text || ""}

─────────────
📖 ${surahNameEn} (${surahNumber}:${ayahNumber}) · ${surahNameAr}
🇬🇧 ${english.text || ""}

➤ Reply with another reference like \`2:255\` for a specific verse.`;

		return message.reply(text);
	}
};
