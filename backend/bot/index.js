const { Telegraf, Scenes, session } = require('telegraf');
const TelegramUser = require('../models/TelegramUser');
const { isAdmin } = require('./middleware/isAdmin');

const createTaskScene = require('./scenes/createTaskScene');
const updateTaskScene = require('./scenes/updateTaskScene');
const deleteTaskScene = require('./scenes/deleteTaskScene');
const broadcastScene = require('./scenes/broadcastScene');

const adminHandler = require('./handlers/adminHandler');
const listHandler = require('./handlers/listHandler');
const statsHandler = require('./handlers/statsHandler');
const usersHandler = require('./handlers/usersHandler');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.warn('⚠️  BOT_TOKEN .env da topilmadi. Telegram bot ishga tushmaydi.');
  module.exports = null;
  return;
}

const bot = new Telegraf(BOT_TOKEN);

// Scenes stage
const stage = new Scenes.Stage([
  createTaskScene,
  updateTaskScene,
  deleteTaskScene,
  broadcastScene,
]);

bot.use(session());
bot.use(stage.middleware());

// Har bir foydalanuvchini TelegramUser ga saqlash (broadcast uchun)
bot.use(async (ctx, next) => {
  if (ctx.from) {
    TelegramUser.findOneAndUpdate(
      { telegramId: ctx.from.id },
      {
        telegramId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
      },
      { upsert: true, new: true }
    ).catch(() => {});
  }
  return next();
});

// ─── Komandalar ─────────────────────────────────────────────────────────────

bot.start(async (ctx) => {
  await ctx.reply(
    `Salom, ${ctx.from.first_name}! 👋\n\n` +
    `Bu TaskManager admin botiga xush kelibsiz.\n\n` +
    `📌 Mavjud komandalar:\n` +
    `/admin — Admin panel\n` +
    `/stats — Statistika\n` +
    `/users — Foydalanuvchilar ro\'yxati\n` +
    `/broadcast — Barcha foydalanuvchilarga xabar`
  );
});

bot.command('admin', isAdmin, adminHandler);
bot.command('stats', isAdmin, statsHandler);
bot.command('users', isAdmin, (ctx) => usersHandler(ctx));
bot.command('broadcast', isAdmin, (ctx) => ctx.scene.enter('broadcast'));

// ─── Admin Panel Inline Keyboard ─────────────────────────────────────────────

bot.action('admin:create', isAdmin, async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('create_task');
});

bot.action('admin:list', isAdmin, (ctx) => listHandler(ctx));

bot.action('admin:update', isAdmin, async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('update_task');
});

bot.action('admin:delete', isAdmin, async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('delete_task');
});

bot.action('admin:stats', isAdmin, statsHandler);

bot.action('admin:users', isAdmin, (ctx) => usersHandler(ctx));

bot.action('admin:broadcast', isAdmin, async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('broadcast');
});

// ─── Pagination ───────────────────────────────────────────────────────────────

bot.action(/^task_page:(\d+)$/, isAdmin, (ctx) => {
  const page = parseInt(ctx.match[1], 10);
  return listHandler(ctx, page);
});

bot.action(/^users_page:(\d+)$/, isAdmin, (ctx) => {
  const page = parseInt(ctx.match[1], 10);
  return usersHandler(ctx, page);
});

// ─── Fallback: javobsiz qolgan callback querylar ─────────────────────────────

bot.on('callback_query', (ctx) => ctx.answerCbQuery().catch(() => {}));

// ─── Global xato handler ─────────────────────────────────────────────────────

bot.catch((err, ctx) => {
  console.error(`[Bot xato] ${ctx?.updateType}:`, err.message);
  ctx?.reply('❌ Kutilmagan xato yuz berdi.').catch(() => {});
});

// ─── Botni ishga tushirish ───────────────────────────────────────────────────

bot
  .launch()
  .then(() => console.log('🤖 Telegram bot ishga tushdi'))
  .catch((err) => console.error('❌ Bot ishga tushmadi:', err.message));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;
