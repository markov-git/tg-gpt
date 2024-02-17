import { Telegraf } from 'telegraf';
import { OkUserMessagesResponse, UserMessagesResponse, UserSession } from './types';
import { message } from 'telegraf/filters';
import { FileManager } from '../fileManager';
import { AIMessage, OpenaiApi, TikToken } from '../openAI';
import { DBService } from '../dbService';
import { LogService } from '../logService';
import { Loader } from './loader';

interface TelegramBotArg {
	token: string;
	openai: OpenaiApi;
	fileManager: FileManager;
	dbService: DBService;
	logService: LogService;
	tiktoken: TikToken;
}

export class TelegramBot {
	private readonly _bot: Telegraf;
	private readonly _openai: OpenaiApi;
	private readonly _fileManager: FileManager;
	private readonly _dbService: DBService;
	private readonly _logService: LogService;
	private readonly _tiktoken: TikToken;

	private readonly _session: Map<string, UserSession> = new Map();

	constructor(arg: TelegramBotArg) {
		this._bot = new Telegraf(arg.token, {
			handlerTimeout: Infinity,
		});
		this._openai = arg.openai;
		this._fileManager = arg.fileManager;
		this._dbService = arg.dbService;
		this._logService = arg.logService;
		this._tiktoken = arg.tiktoken;
	}

	public async start() {
		try {
			console.log('Bot starting...');

			await this.db.init();
			this.subscribeOnProcessEvents();

			await this.bot.launch();
		} catch (e) {
			void this.logService.log('Error while start bot', e);
			throw e;
		}
	}

	private onStop = async (reason: string) => {
		this.bot.stop(reason);
		this._session.clear();
		this.tt.destruct();
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
			const userId = String(ctx.message.from.id);
			await this.createUserIfNotExist(userId, ctx.message.from.username, ctx.message.from.first_name);
			await ctx.reply('Жду вашего голосового или текстового сообщения');
		});
		this.bot.command('new', async ctx => {
			this.setSessionById(String(ctx.message.from.id), this.initialSession);
			const userId = String(ctx.message.from.id);
			await this.createUserIfNotExist(userId, ctx.message.from.username, ctx.message.from.first_name);
			this.setImageMode(userId, false);
			await ctx.reply('Жду вашего голосового или текстового сообщения');
		});
		this.bot.command('image', async ctx => {
			try {
				const userId = String(ctx.message.from.id);
				this.setImageMode(userId, true);
				await ctx.reply('Режим генерации изображений успешно включен');
			} catch (e) {
				void this.logService.log('Error while request logs', e);
				await ctx.reply(`Произошла непредвиденная ошибка :(`);
			}
		});
		this.bot.command('logs', async ctx => {
			try {
				const logs = await this.logService.readLogs();
				await ctx.reply(logs);
			} catch (e) {
				void this.logService.log('Error while request logs', e);
				await ctx.reply(`Произошла непредвиденная ошибка :(`);
			}
		});
		this.bot.command('users', async ctx => {
			try {
				const userId = String(ctx.message.from.id);
				const hasRights = await this.isAdmin(userId);
				if (!hasRights) {
					await ctx.reply("Insufficient rights for command");
					return;
				}

				const users = await this.db.user.list;
				const replyMessage = users
					.map(user => `${ user.id }: ${ user.username } - ${ user.first_name } ${ user.admin && 'ADMIN' }`)
					.join('\n')
				;
				await ctx.reply(replyMessage);
			} catch (e) {
				void this.logService.log('Error while request logs', e);
				await ctx.reply(`Произошла непредвиденная ошибка :(`);
			}
		});
		this.bot.command('q', async ctx => {
			try {
				const userId = String(ctx.message.from.id);
				const hasRights = await this.isAdmin(userId);
				if (!hasRights) {
					await ctx.reply("Insufficient rights for command");
					return;
				}

				const [, targetUserId] = ctx.message.text.split(' ');

				if (!targetUserId) return ctx.reply('Не задан ID пользователя');

				const questions = await this.db.question.findUserQuestions(targetUserId);
				const replyMessage = questions
					.map(q => `${q.text}`)
					.join('\n')
				;

				await ctx.reply(replyMessage);
			} catch (e) {
				void this.logService.log('Error while request logs', e);
				await ctx.reply(`Произошла непредвиденная ошибка :(`);
			}
		});
	}

	private async isAdmin(id: string) {
		const user = await this.db.user.getById(id);
		return !!user?.admin;
	}

	private subscribeAudioMessage() {
		this.bot.on(message('voice'), async ctx => {
			const loader = new Loader(ctx);

			try {
				await loader.show();

				const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
				const userId = String(ctx.message.from.id);
				await this.createUserIfNotExist(userId, ctx.message.from.username, ctx.message.from.first_name);

				const oggPath = await this.fileManager.createAndSaveAudio(link.href, userId);
				const mp3Path = await this.fileManager.toMp3(oggPath, userId);
				await this.fileManager.removeFile(oggPath);

				const text = await this.api.transcription(mp3Path);

				await loader.hide();
				await ctx.reply('Ваш вопрос: ' + `"${ text }"`);
				await this.fileManager.removeFile(mp3Path);

				await this.createUserQuestion(userId, text, link.href);

				let responseMessage = await this.analiseUserMessage(userId, text, loader);

				if (responseMessage.type === 'error') {
					this.clearUserMessages(userId);
					await loader.hide();
					await ctx.reply('Превышена длина контекста, начата новая сессия общения!');
					responseMessage = await this.analiseUserMessage(userId, text, loader);
				}

				await loader.hide();

				if (!this.isValidUserResponse(responseMessage)) {
					throw new Error(`Invalid user response: ${responseMessage.type}`);
				}

				if (responseMessage.type === 'url') {
					await ctx.replyWithPhoto(responseMessage.content);
				} else {
					await ctx.reply(responseMessage.content);
				}
			} catch (e) {
				void this.logService.log('Error while voice message', e);
				await loader.hide();
				await ctx.reply(`Произошла непредвиденная ошибка :(`);
			}
		});
	}

	private subscribeTextMessage() {
		this.bot.on(message('text'), async ctx => {
			const loader = new Loader(ctx);
			try {
				const userId = String(ctx.message.from.id);

				await this.createUserIfNotExist(userId, ctx.message.from.username, ctx.message.from.first_name);
				await this.createUserQuestion(userId, ctx.message.text);

				let responseMessage = await this.analiseUserMessage(userId, ctx.message.text, loader);

				if (responseMessage.type === 'error') {
					this.clearUserMessages(userId);
					await loader.hide();
					await ctx.reply('Превышена длина контекста, начата новая сессия общения!');
					responseMessage = await this.analiseUserMessage(userId, ctx.message.text, loader);
				}

				await loader.hide();

				if (!this.isValidUserResponse(responseMessage)) {
					throw new Error(`Invalid user response: ${responseMessage.type}`);
				}

				if (responseMessage.type === 'url') {
					await ctx.replyWithPhoto(responseMessage.content);
				} else {
					await ctx.reply(responseMessage.content);
				}
			} catch (e) {
				void this.logService.log('Error while voice message', e);
				await loader.hide();
				await ctx.reply(`Произошла непредвиденная ошибка :(`);
			}
		});
	}

	private clearUserMessages(userId: string): void {
		const session = this.getOrCreateSessionById(userId);
		this.setSessionById(userId, {
			...session,
			messages: [],
		});
	}

	private isValidUserResponse(response: UserMessagesResponse): response is OkUserMessagesResponse {
		return response.type !== 'error';
	}

	private async analiseUserMessage(userId: string, message: string, loader: Loader): Promise<UserMessagesResponse> {
		const session = this.getOrCreateSessionById(userId);

		session.messages.push({ role: 'user', content: message });
		let result: UserMessagesResponse;

		const tokensCount = this.calculateTokensInMessages(session.messages);

		await loader.show({ tokensCount, limit: this.tt.OPENAI_TOKENS_COUNT_LIMIT });

		if (this.isMessagesMoreLimit(tokensCount)) {
			result = {
				type: 'error',
				lastMessage: message,
			};
			return result;
		}

		if (session.imageMode) {
			const url = await this.api.createImage(message);
			if (!url) throw new Error('Error while analiseUserMessage');
			result = {
				content: url,
				type: 'url',
			};
		} else {
			result = {
				content: await this.api.chat(session.messages),
				type: 'text',
				tokensCount,
			};
		}

		session.messages.push({ role: 'assistant', content: result.content });

		return result;
	}

	private calculateTokensInMessages(messages: AIMessage[]): number {
		return messages.reduce((acc, message) => {
			if (typeof message.content === 'string') {
				return acc + this.tt.calculateTokens(message.content);
			} else {
				return acc;
			}
		}, 0);
	}

	private isMessagesMoreLimit(messagesTokensCount: number): boolean {
		return messagesTokensCount > this.tt.OPENAI_TOKENS_COUNT_LIMIT;
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

	private setImageMode(userId: string, value: boolean) {
		const cached = this._session.get(userId) || this.initialSession;
		this._session.set(userId, {
			...cached,
			imageMode: value,
		});
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

	private get logService() {
		return this._logService;
	}

	private get tt() {
		return this._tiktoken;
	}

	private get initialSession(): UserSession {
		return { messages: [], imageMode: false };
	}
}