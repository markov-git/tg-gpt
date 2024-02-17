import { AIMessage } from '../openAI';

export interface UserSession {
	messages: AIMessage[];
	imageMode: boolean;
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
