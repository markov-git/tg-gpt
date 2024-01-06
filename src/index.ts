import config from 'config';
import { TelegramBot } from './telegramBot';
import { OpenaiApi } from './openAI';
import { FileManager } from './fileManager';
import { DBService } from './dbService';
import { LogService } from './logService';

const logService = new LogService();
const fileManager = new FileManager();
const dbService = new DBService();
const openai = new OpenaiApi(config.get('OPENAI_API_KEY'));
const bot = new TelegramBot({
	token: config.get('TELEGRAM_TOKEN'),
	openai,
	fileManager,
	dbService,
	logService,
});

bot.subscribeOnUserEvents();

void bot.start();
