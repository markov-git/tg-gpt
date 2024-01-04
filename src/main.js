import { Telegraf, session } from 'telegraf';
import { message } from 'telegraf/filters';
import config from 'config';
import { ogg } from './ogg.js';
import { openai } from './openai.js';

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'), {
	handlerTimeout: Infinity,
});

bot.use(session());
function getInitialSession() {
	return { messages: [] };
}

bot.on(message('voice'), async ctx => {
	ctx.session ??= getInitialSession();
	try {
		ctx.reply('Сообщение принято. Анализирую...');

		const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
		const userId = String(ctx.message.from.id);

		const oggPath = await ogg.create(link.href, userId);
		const mp3Path = await ogg.toMp3(oggPath, userId);

		const text = await openai.transcription(mp3Path);
		await ctx.reply("Ваш вопрос: " + `"${text}"`);

		ctx.session.messages.push({ role: openai.roles.USER, content: text });
		const response = await openai.chat(ctx.session.messages);
		ctx.session.messages.push({ role: openai.roles.ASSISTANT, content: response?.[0]?.message.content });

		await ctx.reply(response?.[0]?.message.content);
	} catch (e) {
		console.error('Error while voice message', e.message);
	}
});

bot.on(message('text'), async ctx => {
	ctx.session ??= getInitialSession();
	try {
		ctx.reply('Сообщение принято. Анализирую...');

		const userId = String(ctx.message.from.id);

		ctx.session.messages.push({ role: openai.roles.USER, content: ctx.message.text });
		const response = await openai.chat(ctx.session.messages);
		ctx.session.messages.push({ role: openai.roles.ASSISTANT, content: response?.[0]?.message.content });

		await ctx.reply(response?.[0]?.message.content);
	} catch (e) {
		console.error('Error while voice message', e.message);
	}
});

bot.command('start', async ctx => {
	ctx.session = getInitialSession();
	await ctx.reply('Жду вашего голосового или текстового сообщения');
});

bot.command('new', async ctx => {
	ctx.session = getInitialSession();
	await ctx.reply('Жду вашего голосового или текстового сообщения');
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
