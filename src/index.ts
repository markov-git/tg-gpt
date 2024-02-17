import config from 'config';
import { TelegramBot } from './telegramBot';
import { OpenaiApi } from './openAI';
import { FileManager } from './fileManager';
import { DBService } from './dbService';
import { LogService } from './logService';
import { TikToken } from './openAI/tokens';
import { TiktokenModel } from 'tiktoken';

const GPT_MODEL: TiktokenModel = 'gpt-3.5-turbo';

const logService = new LogService();
const fileManager = new FileManager();
const dbService = new DBService();
const openai = new OpenaiApi(config.get('OPENAI_API_KEY'), GPT_MODEL);
const tiktoken = new TikToken(GPT_MODEL);
const bot = new TelegramBot({
	token: config.get('TELEGRAM_TOKEN'),
	openai,
	fileManager,
	dbService,
	logService,
	tiktoken,
});

bot.subscribeOnUserEvents();

void bot.start();
