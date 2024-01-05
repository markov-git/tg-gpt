import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import installer from '@ffmpeg-installer/ffmpeg';
import { createWriteStream, readdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { unlink } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class FileManager {
	private readonly _rootDir: string;

	constructor() {
		this._rootDir = this.getRootDir(__dirname);
		ffmpeg.setFfmpegPath(installer.path);
	}

	public toMp3(input: string, output: string): Promise<string> {
		try {
			const outputPath = resolve(dirname(input), `${ output }.mp3`);
			return new Promise((resolve, reject) => {
				ffmpeg(input)
					.inputOption('-t 30')
					.output(outputPath)
					.on('end', () => resolve(outputPath))
					.on('error', e => reject(e))
					.run()
				;
			});
		} catch (e) {
			console.error('Error while creating mp3', e);
			throw e;
		}
	}

	public async createAndSaveAudio(url: string, fileName: string): Promise<string> {
		try {
			const oggPath = resolve(this._rootDir, 'voices', `${ fileName }.ogg`);
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

	private readonly PACKAGE_NAME = 'package.json';
	private getRootDir(dirname: string): string {
		const filesInDir = readdirSync(dirname);
		const hasPackage = filesInDir.includes(this.PACKAGE_NAME);
		if (hasPackage) return dirname;
		if (dirname == '/') throw new Error('Project RootDir not found!');
		return this.getRootDir(resolve(dirname, '..'));
	}
}
