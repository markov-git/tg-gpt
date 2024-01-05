import OpenAI from 'openai';
import config from 'config';
import { createReadStream } from 'fs';
import { AIMessage } from './openAI/types';

class Openai {
	private openai: OpenAI;

	constructor(apiKey: string) {
		this.openai = new OpenAI({ apiKey });
	}

	async chat(messages: AIMessage[]) {
		try {
			const completion = await this.openai.chat.completions.create({
				model: 'gpt-3.5-turbo',
				messages,
			});
			return completion.choices;
		} catch (e) {
			console.error('Error while chat', e);
			throw e;
		}
	}

	async transcription(filePath: string) {
		try {
			const file = createReadStream(filePath);
			const transcription = await this.openai.audio.transcriptions.create({
				file,
				model: 'whisper-1',
			});
			return transcription.text;
		} catch (e) {
			console.error('Error while transcription', e);
			throw e;
		}
	}
}

export const openai = new Openai(config.get('OPENAI_API_KEY'));