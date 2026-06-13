const { Scenes, Markup } = require('telegraf');
const TelegramUser = require('../../models/TelegramUser');

const broadcastScene = new Scenes.WizardScene(
  'broadcast',

  // Step 0: Xabar so'rash
  async (ctx) => {
    const total = await TelegramUser.countDocuments();
    await ctx.reply(
      `📢 *Broadcast*\n\nBotdan foydalangan *${total}* ta foydalanuvchi mavjud.\n\nYubormoqchi bo\'lgan xabaringizni kiriting:\n\n(Bekor qilish: /cancel)`,
      { parse_mode: 'Markdown' }
    );
    return ctx.wizard.next();
  },

  // Step 1: Xabarni qabul qilish, tasdiqlash
  async (ctx) => {
    const text = ctx.message?.text?.trim();
    if (!text) {
      await ctx.reply('⚠️ Matn kiriting:');
      return;
    }

    ctx.wizard.state.message = text;
    const total = await TelegramUser.countDocuments();

    await ctx.reply(
      `📢 Quyidagi xabar *${total}* ta foydalanuvchiga yuboriladi:\n\n"${text}"\n\nTasdiqlaysizmi?`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Ha, yuborish', 'bc:yes'),
            Markup.button.callback('❌ Bekor qilish', 'bc:no'),
          ],
        ]),
      }
    );
    return ctx.wizard.next();
  },

  // Step 2: Tasdiqlash, broadcast
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply('⚠️ Iltimos, tugmani bosing:');
      return;
    }
    const answer = ctx.callbackQuery.data.split(':')[1];
    await ctx.answerCbQuery();

    if (answer === 'no') {
      await ctx.reply('❌ Bekor qilindi.');
      return ctx.scene.leave();
    }

    const users = await TelegramUser.find().lean();
    await ctx.reply('⏳ Xabar yuborilmoqda...');

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await ctx.telegram.sendMessage(user.telegramId, ctx.wizard.state.message);
        sent++;
      } catch {
        failed++;
      }
    }

    await ctx.reply(
      `📢 Broadcast yakunlandi!\n\n✅ Muvaffaqiyatli: ${sent}\n❌ Xato: ${failed}\n📊 Jami: ${users.length}`
    );
    return ctx.scene.leave();
  }
);

broadcastScene.command('cancel', async (ctx) => {
  await ctx.reply('❌ Bekor qilindi.');
  return ctx.scene.leave();
});

module.exports = broadcastScene;
