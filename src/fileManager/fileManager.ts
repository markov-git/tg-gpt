import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg'
import installer from '@ffmpeg-installer/ffmpeg'
import { createWriteStream } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { unlink } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

class FileManager {
	constructor() {
		ffmpeg.setFfmpegPath(installer.path);
	}

	public toMp3(input: string, output: string): Promise<string> {
		try {
			const outputPath = resolve(dirname(input), `${output}.mp3`);
			return new Promise((resolve, reject) => {
				ffmpeg(input)
					.inputOption('-t 30')
					.output(outputPath)
					.on('end', async () => {
						await this.removeFile(input);
						resolve(outputPath);
					})
					.on('error', e => reject(e))
					.run()
				;
			})
		} catch (e) {
			console.error('Error while creating mp3', e);
			throw e;
		}
	}

	public async createAndSaveAudio(url: string, fileName: string): Promise<string> {
		try {
			const oggPath = resolve(__dirname, '..', 'voices', `${ fileName }.ogg`);
			const response = await axios({
				method: 'GET',
				url,
				responseType: 'stream',
			});
			return new Promise((resolve, reject) => {
				const stream = createWriteStream(oggPath);
				response.data.pipe(stream);
				stream.on('finish', () => resolve(oggPath));
				stream.on('error', (err) => reject(err));
			});
		} catch (e) {
			console.error('Error while creating ogg', e);
			throw e;
		}
	}

	public async removeFile(path: string) {
		try {
			await unlink(path);
		} catch (e) {
			console.error('Error while removing file', e);
		}
	}
}

export const fileManager = new FileManager();
