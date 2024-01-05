import OpenAI from 'openai';
import { createReadStream } from 'fs';
import { AIMessage } from './types';

export class OpenaiApi {
	private openai: OpenAI;

	constructor(apiKey: string) {
		this.openai = new OpenAI({ apiKey });
	}

	public async chat(messages: AIMessage[]): Promise<string> {
		const response = await this.sendMessage(messages);
		const responseText = response[0].message.content;
		if (!responseText) throw new Error('Empty message in response!');
		return responseText;
	}

	private async sendMessage(messages: AIMessage[]) {
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

	public async transcription(filePath: string) {
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
