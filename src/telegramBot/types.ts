import { AIMessage } from '../openAI';

export interface UserSession {
	messages: AIMessage[];
	imageMode: boolean;
}