import { Telegraf, session } from 'telegraf';
import { BotContext } from './types';
import { message } from 'telegraf/filters';
import { FileManager } from '../fileManager';
import { OpenaiApi } from '../openAI';

export class TelegramBot {
	private readonly _bot: Telegraf<BotContext>;
	private readonly _openai: OpenaiApi;
	private readonly _fileManager: FileManager;

	constructor(token: string, openai: OpenaiApi, fileManager: FileManager) {
		this._bot = new Telegraf<BotContext>(token, {
			handlerTimeout: Infinity,
		});
		this._bot.use(session());
		this._openai = openai;
		this._fileManager = fileManager;
	}

	public async start() {
		try {
			this.subscribeOnProcessEvents();

			console.log('Bot starting...');
			await this._bot.launch();
		} catch (e) {
			console.error('Error while start bot', e);
		}
	}

	public subscribeOnUserEvents() {
		this.subscribeUserInput();
		this.subscribeUserCommands();
	}

	private subscribeUserInput() {
		this.subscribeAudioMessage();
		this.subscribeTextMessage();
	}

	private subscribeUserCommands() {
		this.bot.command('start', this.handleInit);
		this.bot.command('new', this.handleInit);
	}

	private subscribeAudioMessage() {
		this.bot.on(message('voice'), async ctx => {
			ctx.session ??= this.initialSession;
			try {
				await ctx.reply('Сообщение принято. Анализирую...');

				const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
				const userId = String(ctx.message.from.id);

				const oggPath = await this.fileManager.createAndSaveAudio(link.href, userId);
				const mp3Path = await this.fileManager.toMp3(oggPath, userId);
				await this.fileManager.removeFile(oggPath);

				const text = await this.api.transcription(mp3Path);
				await ctx.reply('Ваш вопрос: ' + `"${ text }"`);
				await this.fileManager.removeFile(mp3Path);

				ctx.session.messages.push({ role: 'user', content: text });
				const responseMessage = await this.api.chat(ctx.session.messages);
				ctx.session.messages.push({ role: 'assistant', content: responseMessage });

				await ctx.reply(responseMessage);
			} catch (e) {
				console.error('Error while voice message', e);
			}
		});
	}

	private subscribeTextMessage() {
		this.bot.on(message('text'), async ctx => {
			ctx.session ??= this.initialSession;
			try {
				await ctx.reply('Сообщение принято. Анализирую...');

				const userId = String(ctx.message.from.id);

				ctx.session.messages.push({ role: 'user', content: ctx.message.text });
				const responseMessage = await this.api.chat(ctx.session.messages);
				ctx.session.messages.push({ role: 'assistant', content: responseMessage });

				await ctx.reply(responseMessage);
			} catch (e) {
				console.error('Error while voice message', e);
			}
		});
	}

	private handleInit = async (ctx: BotContext) => {
		ctx.session = this.initialSession;
		await ctx.reply('Жду вашего голосового или текстового сообщения');
	};

	private subscribeOnProcessEvents() {
		process.once('SIGINT', () => this._bot.stop('SIGINT'));
		process.once('SIGTERM', () => this._bot.stop('SIGTERM'));
	}

	private get bot() {
		return this._bot;
	}

	private get api() {
		return this._openai;
	}

	private get fileManager() {
		return this._fileManager;
	}

	private get initialSession(): BotContext['session'] {
		return { messages: [] };
	}
}