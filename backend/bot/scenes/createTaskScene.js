const { Scenes, Markup } = require('telegraf');
const Task = require('../../models/Task');
const Category = require('../../models/Category');
const User = require('../../models/User');

const STATUS_OPTIONS = ['pending', 'in_progress', 'completed'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

const createTaskScene = new Scenes.WizardScene(
  'create_task',

  // Step 0: Sarlavha so'rash
  async (ctx) => {
    await ctx.reply('📝 *Vazifa sarlavhasini kiriting:*\n\n(Bekor qilish: /cancel)', {
      parse_mode: 'Markdown',
    });
    return ctx.wizard.next();
  },

  // Step 1: Sarlavhani qabul qilish, tavsif so'rash
  async (ctx) => {
    const title = ctx.message?.text?.trim();
    if (!title) {
      await ctx.reply('❌ Sarlavha matn bo\'lishi kerak. Qaytadan kiriting:');
      return;
    }
    if (title.length > 200) {
      await ctx.reply('❌ Sarlavha 200 belgidan oshmasligi kerak. Qaytadan kiriting:');
      return;
    }
    ctx.wizard.state.title = title;
    await ctx.reply('📄 Tavsif kiriting:\n\n(O\'tkazib yuborish uchun "skip" yozing)');
    return ctx.wizard.next();
  },

  // Step 2: Tavsifni qabul qilish, status keyboard
  async (ctx) => {
    const text = ctx.message?.text?.trim();
    ctx.wizard.state.description = text === 'skip' ? '' : text;

    await ctx.reply(
      '📊 Holat tanlang:',
      Markup.inlineKeyboard([
        STATUS_OPTIONS.map((s) => Markup.button.callback(s, `status:${s}`)),
      ])
    );
    return ctx.wizard.next();
  },

  // Step 3: Statusni qabul qilish, priority keyboard
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply('⚠️ Iltimos, tugmani bosing:');
      return;
    }
    const status = ctx.callbackQuery.data.split(':')[1];
    if (!STATUS_OPTIONS.includes(status)) {
      await ctx.reply('⚠️ Noto\'g\'ri tanlov. Tugmani bosing:');
      return;
    }
    ctx.wizard.state.status = status;
    await ctx.answerCbQuery();

    await ctx.reply(
      '🔥 Prioritet tanlang:',
      Markup.inlineKeyboard([
        PRIORITY_OPTIONS.map((p) => Markup.button.callback(p, `priority:${p}`)),
      ])
    );
    return ctx.wizard.next();
  },

  // Step 4: Prioritetni qabul qilish, muddat so'rash
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply('⚠️ Iltimos, tugmani bosing:');
      return;
    }
    const priority = ctx.callbackQuery.data.split(':')[1];
    if (!PRIORITY_OPTIONS.includes(priority)) {
      await ctx.reply('⚠️ Noto\'g\'ri tanlov. Tugmani bosing:');
      return;
    }
    ctx.wizard.state.priority = priority;
    await ctx.answerCbQuery();

    await ctx.reply('📅 Muddati kiriting (YYYY-MM-DD formatda):\n\n(O\'tkazib yuborish: "skip")');
    return ctx.wizard.next();
  },

  // Step 5: Muddatni qabul qilish, kategoriya keyboard
  async (ctx) => {
    const text = ctx.message?.text?.trim();
    if (text && text !== 'skip') {
      const date = new Date(text);
      if (isNaN(date.getTime())) {
        await ctx.reply('❌ Noto\'g\'ri sana formati. YYYY-MM-DD kiriting yoki "skip":');
        return;
      }
      ctx.wizard.state.dueDate = date;
    }

    const categories = await Category.find().limit(20).lean();
    const buttons = categories.map((c) => [
      Markup.button.callback(c.name, `cat:${c._id}`),
    ]);
    buttons.push([Markup.button.callback('⏭ Skip (kategoriyasiz)', 'cat:skip')]);

    await ctx.reply('📁 Kategoriya tanlang:', Markup.inlineKeyboard(buttons));
    return ctx.wizard.next();
  },

  // Step 6: Kategoriyani qabul qilish, foydalanuvchi keyboard
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply('⚠️ Iltimos, tugmani bosing:');
      return;
    }
    const catData = ctx.callbackQuery.data.split(':')[1];
    ctx.wizard.state.category = catData === 'skip' ? null : catData;
    await ctx.answerCbQuery();

    const users = await User.find().limit(20).lean();
    if (!users.length) {
      await ctx.reply('❌ Tizimda foydalanuvchi yo\'q. Avval ro\'yxatdan o\'ting.');
      return ctx.scene.leave();
    }

    const buttons = users.map((u) => [
      Markup.button.callback(`${u.name} (${u.email})`, `usr:${u._id}`),
    ]);

    await ctx.reply('👤 Foydalanuvchi tanlang (vazifa kimga tegishli):', Markup.inlineKeyboard(buttons));
    return ctx.wizard.next();
  },

  // Step 7: Foydalanuvchini qabul qilish, tasdiq ko'rsatish
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply('⚠️ Iltimos, tugmani bosing:');
      return;
    }
    const userId = ctx.callbackQuery.data.split(':')[1];
    ctx.wizard.state.userId = userId;
    await ctx.answerCbQuery();

    const s = ctx.wizard.state;
    const summary = [
      '📋 *Vazifa ma\'lumotlari:*',
      `📝 Sarlavha: ${s.title}`,
      `📄 Tavsif: ${s.description || 'yo\'q'}`,
      `📊 Holat: ${s.status}`,
      `🔥 Prioritet: ${s.priority}`,
      `📅 Muddat: ${s.dueDate ? s.dueDate.toISOString().split('T')[0] : 'yo\'q'}`,
      `📁 Kategoriya: ${s.category ? 'belgilangan' : 'yo\'q'}`,
    ].join('\n');

    await ctx.reply(summary + '\n\nTaskni yaratishni tasdiqlaysizmi?', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Ha, yaratish', 'confirm:yes'),
          Markup.button.callback('❌ Bekor qilish', 'confirm:no'),
        ],
      ]),
    });
    return ctx.wizard.next();
  },

  // Step 8: Tasdiqlash, task yaratish
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

    const s = ctx.wizard.state;
    try {
      const task = await Task.create({
        title: s.title,
        description: s.description || undefined,
        status: s.status,
        priority: s.priority,
        dueDate: s.dueDate || undefined,
        category: s.category || undefined,
        user: s.userId,
      });

      await ctx.reply(`✅ Vazifa muvaffaqiyatli yaratildi!\n\n📝 *${task.title}*`, {
        parse_mode: 'Markdown',
      });
    } catch (err) {
      await ctx.reply(`❌ Xato: ${err.message}`);
    }

    return ctx.scene.leave();
  }
);

createTaskScene.command('cancel', async (ctx) => {
  await ctx.reply('❌ Bekor qilindi.');
  return ctx.scene.leave();
});

module.exports = createTaskScene;
