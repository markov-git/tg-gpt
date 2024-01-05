import {
	ChatCompletionAssistantMessageParam,
	ChatCompletionUserMessageParam,
} from 'openai/src/resources/chat/completions';

export type AIRole = AIMessage['role'];

export type AIMessage =
	| ChatCompletionUserMessageParam
	| ChatCompletionAssistantMessageParam;