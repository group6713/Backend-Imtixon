const User = require('../../models/User');
const Task = require('../../models/Task');
const Category = require('../../models/Category');

const statsHandler = async (ctx) => {
  if (ctx.callbackQuery) await ctx.answerCbQuery();

  const [userCount, taskCount, catCount, pending, inProgress, completed, lastTask] =
    await Promise.all([
      User.countDocuments(),
      Task.countDocuments(),
      Category.countDocuments(),
      Task.countDocuments({ status: 'pending' }),
      Task.countDocuments({ status: 'in_progress' }),
      Task.countDocuments({ status: 'completed' }),
      Task.findOne().sort({ createdAt: -1 }).populate('user', 'name').lean(),
    ]);

  const lastTaskLine = lastTask
    ? `🕒 Oxirgi vazifa: *${lastTask.title}*\n   👤 ${lastTask.user?.name || "Noma'lum"}`
    : '📭 Hech qanday vazifa yo\'q';

  const text = [
    '📊 *Statistika*',
    '',
    `👥 Foydalanuvchilar: *${userCount}*`,
    `📋 Jami vazifalar: *${taskCount}*`,
    `📁 Kategoriyalar: *${catCount}*`,
    '',
    '*Vazifalar holati:*',
    `⏳ Pending: ${pending}`,
    `🔄 In Progress: ${inProgress}`,
    `✅ Completed: ${completed}`,
    '',
    lastTaskLine,
  ].join('\n');

  await ctx.reply(text, { parse_mode: 'Markdown' });
};

module.exports = statsHandler;
