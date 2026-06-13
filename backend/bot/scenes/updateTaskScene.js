const { Scenes, Markup } = require('telegraf');
const Task = require('../../models/Task');

const STATUS_OPTIONS = ['pending', 'in_progress', 'completed'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

const FIELDS = [
  { key: 'title', label: '📝 Sarlavha' },
  { key: 'description', label: '📄 Tavsif' },
  { key: 'status', label: '📊 Holat' },
  { key: 'priority', label: '🔥 Prioritet' },
  { key: 'dueDate', label: '📅 Muddat' },
];

const updateTaskScene = new Scenes.WizardScene(
  'update_task',

  // Step 0: Task ro'yxatini ko'rsatish
  async (ctx) => {
    const tasks = await Task.find().sort({ createdAt: -1 }).limit(20)
      .populate('user', 'name').lean();

    if (!tasks.length) {
      await ctx.reply('📭 Hech qanday vazifa yo\'q.');
      return ctx.scene.leave();
    }

    ctx.wizard.state.tasks = tasks;

    const buttons = tasks.map((t, i) => [
      Markup.button.callback(
        `${i + 1}. ${t.title.substring(0, 32)}`,
        `pick:${t._id}`
      ),
    ]);
    buttons.push([Markup.button.callback('❌ Bekor qilish', 'pick:cancel')]);

    await ctx.reply(
      '✏️ Yangilamoqchi bo\'lgan vazifani tanlang:\n\n(Bekor qilish: /cancel)',
      Markup.inlineKeyboard(buttons)
    );
    return ctx.wizard.next();
  },

  // Step 1: Taskni qabul qilish, maydon menyu
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

    const fieldButtons = FIELDS.map((f) => [
      Markup.button.callback(f.label, `field:${f.key}`),
    ]);
    fieldButtons.push([Markup.button.callback('❌ Bekor qilish', 'field:cancel')]);

    await ctx.reply(
      `✏️ *"${task.title}"*\n\nQaysi maydonni o\'zgartirmoqchisiz?`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard(fieldButtons) }
    );
    return ctx.wizard.next();
  },

  // Step 2: Maydonni qabul qilish, yangi qiymat so'rash
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply('⚠️ Iltimos, tugmani bosing:');
      return;
    }
    const field = ctx.callbackQuery.data.split(':')[1];
    await ctx.answerCbQuery();

    if (field === 'cancel') {
      await ctx.reply('❌ Bekor qilindi.');
      return ctx.scene.leave();
    }

    ctx.wizard.state.field = field;

    if (field === 'status') {
      ctx.wizard.state.expectCb = true;
      await ctx.reply(
        'Yangi holat tanlang:',
        Markup.inlineKeyboard([STATUS_OPTIONS.map((s) => Markup.button.callback(s, `val:${s}`))])
      );
    } else if (field === 'priority') {
      ctx.wizard.state.expectCb = true;
      await ctx.reply(
        'Yangi prioritet tanlang:',
        Markup.inlineKeyboard([PRIORITY_OPTIONS.map((p) => Markup.button.callback(p, `val:${p}`))])
      );
    } else if (field === 'dueDate') {
      ctx.wizard.state.expectCb = false;
      await ctx.reply('Yangi sana kiriting (YYYY-MM-DD):\n\n("skip" — sanani o\'chirish)');
    } else {
      ctx.wizard.state.expectCb = false;
      const label = FIELDS.find((f) => f.key === field)?.label || field;
      await ctx.reply(`Yangi ${label} ni kiriting:`);
    }

    return ctx.wizard.next();
  },

  // Step 3: Yangi qiymatni qabul qilish, tasdiq
  async (ctx) => {
    let newValue;

    if (ctx.wizard.state.expectCb) {
      if (!ctx.callbackQuery) {
        await ctx.reply('⚠️ Iltimos, tugmani bosing:');
        return;
      }
      newValue = ctx.callbackQuery.data.split(':')[1];
      await ctx.answerCbQuery();
    } else {
      if (!ctx.message?.text) {
        await ctx.reply('⚠️ Matn kiriting:');
        return;
      }
      const text = ctx.message.text.trim();

      if (ctx.wizard.state.field === 'dueDate') {
        if (text === 'skip') {
          newValue = null;
        } else {
          const d = new Date(text);
          if (isNaN(d.getTime())) {
            await ctx.reply('❌ Noto\'g\'ri sana. YYYY-MM-DD kiriting yoki "skip":');
            return;
          }
          newValue = d;
        }
      } else {
        newValue = text;
      }
    }

    ctx.wizard.state.newValue = newValue;

    const displayVal =
      newValue instanceof Date
        ? newValue.toISOString().split('T')[0]
        : newValue === null
        ? 'o\'chiriladi'
        : newValue;

    await ctx.reply(
      `*${ctx.wizard.state.field}* → \`${displayVal}\`\n\nTasdiqlaysizmi?`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Ha', 'upd:yes'),
            Markup.button.callback('❌ Yo\'q', 'upd:no'),
          ],
        ]),
      }
    );
    return ctx.wizard.next();
  },

  // Step 4: Tasdiqlash, task yangilash
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
      const { taskId, field, newValue } = ctx.wizard.state;
      await Task.findByIdAndUpdate(
        taskId,
        { [field]: newValue },
        { runValidators: true }
      );
      await ctx.reply(`✅ Vazifa yangilandi!\n\n📝 *${ctx.wizard.state.taskTitle}*\n🔄 ${field} o'zgartirildi.`, {
        parse_mode: 'Markdown',
      });
    } catch (err) {
      await ctx.reply(`❌ Xato: ${err.message}`);
    }

    return ctx.scene.leave();
  }
);

updateTaskScene.command('cancel', async (ctx) => {
  await ctx.reply('❌ Bekor qilindi.');
  return ctx.scene.leave();
});

module.exports = updateTaskScene;
