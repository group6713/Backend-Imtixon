const ADMIN_IDS = (process.env.ADMIN_IDS || '')
  .split(',')
  .map((id) => parseInt(id.trim(), 10))
  .filter(Boolean);

const isAdmin = async (ctx, next) => {
  if (!ADMIN_IDS.includes(ctx.from?.id)) {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('⛔ Sizda ruxsat yo\'q');
    } else {
      await ctx.reply('⛔ Sizda ruxsat yo\'q');
    }
    return;
  }
  return next();
};

module.exports = { isAdmin, ADMIN_IDS };
