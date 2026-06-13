const { Scenes, Markup } = require('telegraf');
const Task = require('../../models/Task');

const deleteTaskScene = new Scenes.WizardScene(
  'delete_task',

  // Step 0: Task ro'yxatini ko'rsatish
  async (ctx) => {
    const tasks = await Task.find().sort({ createdAt: -1 }).limit(20)
      .populate('user', 'name').lean();

    if (!tasks.length) {
      await ctx.reply('📭 Hech qanday vazifa yo\'q.');
      return ctx.scene.leave();
    }

    const buttons = tasks.map((t, i) => [
      Markup.button.callback(
        `${i + 1}. ${t.title.substring(0, 32)}`,
        `del_pick:${t._id}`
      ),
    ]);
    buttons.push([Markup.button.callback('❌ Bekor qilish', 'del_pick:cancel')]);

    await ctx.reply(
      '🗑 O\'chirmoqchi bo\'lgan vazifani tanlang:\n\n(Bekor qilish: /cancel)',
      Markup.inlineKeyboard(buttons)
    );
    return ctx.wizard.next();
  },

  // Step 1: Taskni qabul qilish, tasdiqlash
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply('⚠️ Iltimos, tugmani bosing:');
      return;
    }
    const taskId = ctx.callbackQuery.data.split(':')[1];
    await ctx.answerCbQuery();

    if (taskId === 'cancel') {
      await ctx.reply('❌ Bekor qilindi.');
      return ctx.scene.leave();
    }

    const task = await Task.findById(taskId).lean();
    if (!task) {
      await ctx.reply('❌ Vazifa topilmadi.');
      return ctx.scene.leave();
    }

    ctx.wizard.state.taskId = taskId;
    ctx.wizard.state.taskTitle = task.title;

    await ctx.reply(
      `🗑 *"${task.title}"* vazifasini o'chirishni tasdiqlaysizmi?`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Ha, o\'chirish', 'del_conf:yes'),
            Markup.button.callback('❌ Yo\'q', 'del_conf:no'),
          ],
        ]),
      }
    );
    return ctx.wizard.next();
  },

  // Step 2: Tasdiqlash, o'chirish
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

    try {
      await Task.findByIdAndDelete(ctx.wizard.state.taskId);
      await ctx.reply(`✅ *"${ctx.wizard.state.taskTitle}"* muvaffaqiyatli o'chirildi.`, {
        parse_mode: 'Markdown',
      });
    } catch (err) {
      await ctx.reply(`❌ Xato: ${err.message}`);
    }

    return ctx.scene.leave();
  }
);

deleteTaskScene.command('cancel', async (ctx) => {
  await ctx.reply('❌ Bekor qilindi.');
  return ctx.scene.leave();
});

module.exports = deleteTaskScene;
