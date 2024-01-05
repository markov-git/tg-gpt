import { Telegraf, session, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import config from 'config';
import { fileManager } from './fileManager';
import { openai } from './openai';
import { AIMessage } from './openAI/types';

interface BotContext extends Context {
	session: {
		messages: AIMessage[];
	};
}

const bot = new Telegraf<BotContext>(config.get('TELEGRAM_TOKEN'), {
	handlerTimeout: Infinity,
});

bot.use(session());

function getInitialSession() {
	return { messages: [] };
}

bot.on(message('voice'), async ctx => {
	ctx.session ??= getInitialSession();
	try {
		await ctx.reply('Сообщение принято. Анализирую...');

		const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
		const userId = String(ctx.message.from.id);

		const oggPath = await fileManager.createAndSaveAudio(link.href, userId);
		const mp3Path = await fileManager.toMp3(oggPath, userId);

		const text = await openai.transcription(mp3Path);
		await ctx.reply('Ваш вопрос: ' + `"${ text }"`);

		ctx.session.messages.push({ role: 'user', content: text });
		const response = await openai.chat(ctx.session.messages);
		ctx.session.messages.push({ role: 'assistant', content: response?.[0]?.message.content });

		// todo
		if (!response?.[0]?.message.content) return;
		await ctx.reply(response?.[0]?.message.content);
	} catch (e) {
		console.error('Error while voice message', e);
	}
});

bot.on(message('text'), async ctx => {
	ctx.session ??= getInitialSession();
	try {
		await ctx.reply('Сообщение принято. Анализирую...');

		const userId = String(ctx.message.from.id);

		ctx.session.messages.push({ role: 'user', content: ctx.message.text });
		const response = await openai.chat(ctx.session.messages);
		ctx.session.messages.push({ role: 'assistant', content: response?.[0]?.message.content });

		// todo
		if (!response?.[0]?.message.content) return;
		await ctx.reply(response?.[0]?.message.content);
	} catch (e) {
		console.error('Error while voice message', e);
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

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

bot.launch();
