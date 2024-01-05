import config from 'config';
import { TelegramBot } from './telegramBot';
import { OpenaiApi } from './openAI';
import { FileManager } from './fileManager';

const fileManager = new FileManager();
const openai = new OpenaiApi(config.get('OPENAI_API_KEY'));
const bot = new TelegramBot(config.get('TELEGRAM_TOKEN'), openai, fileManager);

bot.subscribeOnUserEvents();

void bot.start();
