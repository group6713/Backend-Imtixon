const { Markup } = require('telegraf');

const adminKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('➕ Create', 'admin:create'),
    Markup.button.callback('📄 List', 'admin:list'),
  ],
  [
    Markup.button.callback('✏️ Update', 'admin:update'),
    Markup.button.callback('🗑 Delete', 'admin:delete'),
  ],
  [
    Markup.button.callback('📊 Statistics', 'admin:stats'),
    Markup.button.callback('👥 Users', 'admin:users'),
  ],
  [Markup.button.callback('📢 Broadcast', 'admin:broadcast')],
]);

const adminHandler = async (ctx) => {
  if (ctx.callbackQuery) await ctx.answerCbQuery();
  await ctx.reply('🔧 *Admin Panel*\n\nQuyidagi amallardan birini tanlang:', {
    parse_mode: 'Markdown',
    ...adminKeyboard,
  });
};

module.exports = adminHandler;
