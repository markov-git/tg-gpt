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

type UserMessageResponseError = {
	type: 'error';
	lastMessage: string;
};

type UserMessageResponseUrl = {
	type: 'url';
	content: string;
};

type UserMessageResponseText = {
	type: 'text';
	content: string;
};
