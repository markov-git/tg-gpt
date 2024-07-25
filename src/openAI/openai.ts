import OpenAI from 'openai';
import { createReadStream } from 'fs';
import { AIMessage } from './types';
import { TiktokenModel } from 'tiktoken';

export class OpenaiApi {
	private readonly openai: OpenAI;
	private gptModel: TiktokenModel;

	constructor(apiKey: string, defaultGptModel: TiktokenModel) {
		this.openai = new OpenAI({ apiKey });
		this.gptModel = defaultGptModel;
	}

	public setModel(model: TiktokenModel) {
		this.gptModel = model;
	}

	public async chat(messages: AIMessage[]): Promise<string> {
		const response = await this.sendMessage(messages);
		const responseText = response[0].message.content;
		if (!responseText) throw new Error('Empty message in response!');
		return responseText;
	}

	public async createImage(prompt: string) {
		const response = await this.openai.images.generate({
			model: 'dall-e-3',
			size: "1024x1024",
			n: 1,
			prompt,
		});
		return response.data[0]?.url;
	}

	private async sendMessage(messages: AIMessage[]) {
		try {
			const completion = await this.openai.chat.completions.create({
				model: this.gptModel,
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
