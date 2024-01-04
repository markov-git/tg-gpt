import OpenAI from 'openai';
import config from 'config';
import { createReadStream } from 'fs';

class Openai {
	constructor(apiKey) {
		this.openai = new OpenAI({ apiKey });
	}

	async chat() {
		try {
			const completion = await this.openai.chat.completions.create({
				model: 'gpt-3.5-turbo',
				messages: [
					{ role: "user", content: 'Ты меня понимаешь?' }
				]
			});
			return completion.choices;
		} catch (e) {
			console.error('Error while chat', e.message);
		}
	}

	async transcription(filePath) {
		try {
			const file = createReadStream(filePath);
			console.log('Start transcription');
			const transcription = await this.openai.audio.transcriptions.create({
				file,
				model: 'whisper-1',
			});
			return transcription.text;
		} catch (e) {
			console.error('Error while transcription', e.message);
		}
	}
}

export const openai = new Openai(config.get('OPENAI_API_KEY'));