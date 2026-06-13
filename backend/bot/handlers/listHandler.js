const { Markup } = require('telegraf');
const Task = require('../../models/Task');

const PAGE_SIZE = 10;
const STATUS_EMOJI = { pending: '⏳', in_progress: '🔄', completed: '✅' };
const PRIORITY_EMOJI = { low: '🟢', medium: '🟡', high: '🔴' };

const listHandler = async (ctx, page = 1) => {
  if (ctx.callbackQuery) await ctx.answerCbQuery();

  const skip = (page - 1) * PAGE_SIZE;
  const [tasks, total] = await Promise.all([
    Task.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .populate('category', 'name')
      .populate('user', 'name')
      .lean(),
    Task.countDocuments(),
  ]);

  if (!tasks.length) {
    const msg = '📭 Hech qanday vazifa yo\'q.';
    if (ctx.callbackQuery) return ctx.editMessageText(msg);
    return ctx.reply(msg);
  }

  const pages = Math.ceil(total / PAGE_SIZE);
  const lines = tasks.map(
    (t, i) =>
      `${skip + i + 1}. *${t.title}*\n` +
      `   ${STATUS_EMOJI[t.status] || ''} ${t.status} | ${PRIORITY_EMOJI[t.priority] || ''} ${t.priority}\n` +
      `   👤 ${t.user?.name || 'N/A'} | 📁 ${t.category?.name || 'N/A'}`
  );

  const navButtons = [];
  if (page > 1) navButtons.push(Markup.button.callback('⬅️ Oldingi', `task_page:${page - 1}`));
  if (page < pages) navButtons.push(Markup.button.callback('➡️ Keyingi', `task_page:${page + 1}`));

  const keyboard = navButtons.length
    ? Markup.inlineKeyboard([navButtons])
    : Markup.inlineKeyboard([]);

  const text =
    `📋 *Barcha vazifalar* (${total} ta) — Sahifa ${page}/${pages}\n\n` +
    lines.join('\n\n');

  if (ctx.callbackQuery) {
    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
  }
  return ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
};

module.exports = listHandler;
