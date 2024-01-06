import { Telegraf } from 'telegraf';
import { UserSession } from './types';
import { message } from 'telegraf/filters';
import { FileManager } from '../fileManager';
import { OpenaiApi } from '../openAI';
import { DBService } from '../DBService';

interface TelegramBotArg {
	token: string;
	openai: OpenaiApi;
	fileManager: FileManager;
	dbService: DBService;
}

export class TelegramBot {
	private readonly _bot: Telegraf;
	private readonly _openai: OpenaiApi;
	private readonly _fileManager: FileManager;
	private readonly _dbService: DBService;

	private _session: Map<string, UserSession> = new Map();

	constructor(arg: TelegramBotArg) {
		this._bot = new Telegraf(arg.token, {
			handlerTimeout: Infinity,
		});
		this._openai = arg.openai;
		this._fileManager = arg.fileManager;
		this._dbService = arg.dbService;
	}

	public async start() {
		try {
			console.log('Bot starting...');

			await this.db.init();
			this.subscribeOnProcessEvents();

			await this.bot.launch();
		} catch (e) {
			console.error('Error while start bot', e);
		}
	}

	private onStop = async (reason: string) => {
		this.bot.stop(reason);
		this._session.clear();
		await this.db.stop();
	};

	public subscribeOnUserEvents() {
		this.subscribeUserCommands();
		this.subscribeUserInput();
	}

	private subscribeUserInput() {
		this.subscribeAudioMessage();
		this.subscribeTextMessage();
	}

	private subscribeUserCommands() {
		this.bot.command('start', async ctx => {
			this.setSessionById(String(ctx.message.from.id), this.initialSession);
			await ctx.reply('Жду вашего голосового или текстового сообщения');
		});
		this.bot.command('new', async ctx => {
			this.setSessionById(String(ctx.message.from.id), this.initialSession);
			await ctx.reply('Жду вашего голосового или текстового сообщения');
		});
	}

	private subscribeAudioMessage() {
		this.bot.on(message('voice'), async ctx => {
			try {
				await ctx.reply('Сообщение принято. Анализирую...');

				const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
				const userId = String(ctx.message.from.id);
				const session = this.getOrCreateSessionById(userId);
				await this.createUserIfNotExist(userId, ctx.message.from.username, ctx.message.from.first_name);

				const oggPath = await this.fileManager.createAndSaveAudio(link.href, userId);
				const mp3Path = await this.fileManager.toMp3(oggPath, userId);
				await this.fileManager.removeFile(oggPath);

				const text = await this.api.transcription(mp3Path);
				await ctx.reply('Ваш вопрос: ' + `"${ text }"`);
				await this.fileManager.removeFile(mp3Path);

				await this.createUserQuestion(userId, text, link.href);

				session.messages.push({ role: 'user', content: text });
				const responseMessage = await this.api.chat(session.messages);
				session.messages.push({ role: 'assistant', content: responseMessage });

				await ctx.reply(responseMessage);
			} catch (e) {
				console.error('Error while voice message', e);
			}
		});
	}

	private subscribeTextMessage() {
		this.bot.on(message('text'), async ctx => {
			try {
				await ctx.reply('Сообщение принято. Анализирую...');

				const userId = String(ctx.message.from.id);
				const session = this.getOrCreateSessionById(userId);
				await this.createUserIfNotExist(userId, ctx.message.from.username, ctx.message.from.first_name);
				await this.createUserQuestion(userId, ctx.message.text);

				session.messages.push({ role: 'user', content: ctx.message.text });
				const responseMessage = await this.api.chat(session.messages);
				session.messages.push({ role: 'assistant', content: responseMessage });

				await ctx.reply(responseMessage);
			} catch (e) {
				console.error('Error while voice message', e);
			}
		});
	}

	private subscribeOnProcessEvents() {
		process.once('SIGINT', () => this.onStop('SIGINT'));
		process.once('SIGTERM', () => this.onStop('SIGTERM'));
	}

	private getOrCreateSessionById(userId: string) {
		let candidate = this._session.get(userId);
		if (!candidate) {
			candidate = this.initialSession;
			this._session.set(userId, candidate);
		}
		return candidate;
	}

	private setSessionById(userId: string, session: UserSession) {
		this._session.set(userId, session);
	}

	private async createUserQuestion(userId: string, text: string, audioURL?: string) {
		await this.db.question.create(userId, text, audioURL);
	}

	private async createUserIfNotExist(userId: string, username: string | undefined, first_name: string) {
		const user = await this.db.user.getById(userId);
		if (user) return;
		await this.db.user.create(userId, first_name, username);
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

	private get db() {
		return this._dbService;
	}

	private get initialSession(): UserSession {
		return { messages: [] };
	}
}