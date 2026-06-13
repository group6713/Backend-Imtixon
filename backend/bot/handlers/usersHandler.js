const { Markup } = require('telegraf');
const User = require('../../models/User');

const PAGE_SIZE = 10;

const usersHandler = async (ctx, page = 1) => {
  if (ctx.callbackQuery) await ctx.answerCbQuery();

  const skip = (page - 1) * PAGE_SIZE;
  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(PAGE_SIZE).lean(),
    User.countDocuments(),
  ]);

  if (!users.length) {
    const msg = '👥 Foydalanuvchilar yo\'q.';
    if (ctx.callbackQuery) return ctx.editMessageText(msg);
    return ctx.reply(msg);
  }

  const pages = Math.ceil(total / PAGE_SIZE);
  const lines = users.map(
    (u, i) =>
      `${skip + i + 1}. *${u.name}*\n` +
      `   📧 ${u.email}\n` +
      `   🔑 ${u.role} | 📅 ${new Date(u.createdAt).toLocaleDateString('uz-UZ')}`
  );

  const navButtons = [];
  if (page > 1) navButtons.push(Markup.button.callback('⬅️ Oldingi', `users_page:${page - 1}`));
  if (page < pages) navButtons.push(Markup.button.callback('➡️ Keyingi', `users_page:${page + 1}`));

  const keyboard = navButtons.length
    ? Markup.inlineKeyboard([navButtons])
    : Markup.inlineKeyboard([]);

  const text =
    `👥 *Foydalanuvchilar* (${total} ta) — Sahifa ${page}/${pages}\n\n` +
    lines.join('\n\n');

  if (ctx.callbackQuery) {
    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
  }
  return ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
};

module.exports = usersHandler;
