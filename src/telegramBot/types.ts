import { AIMessage } from '../openAI';
import { TiktokenModel } from 'tiktoken';

export interface UserSession {
	messages: AIMessage[];
	imageMode: boolean;
	gptMode: TiktokenModel;
}

export type UserMessagesResponse =
	| UserMessageResponseError
	| UserMessageResponseUrl
	| UserMessageResponseText
	;

export type OkUserMessagesResponse =
	| UserMessageResponseUrl
	| UserMessageResponseText
	;

interface UserMessageResponseError {
	type: 'error';
	lastMessage: string;
}

interface UserMessageResponseUrl {
	type: 'url';
	content: string;
}

interface UserMessageResponseText {
	type: 'text';
	content: string;
	tokensCount: number;
}
