import { Context } from 'telegraf';
import { AIMessage } from '../openAI';

export interface BotContext extends Context {
	session: {
		messages: AIMessage[];
	};
}