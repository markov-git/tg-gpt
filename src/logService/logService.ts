import { appendFile } from 'fs/promises';
import { resolve } from 'path';
import { getRootDir } from '../utils';

export class LogService {
	private readonly _rootDir: string;
	private readonly ERROR_FILE = 'errors.txt';

	constructor() {
		this._rootDir = getRootDir();
	}

	public async log(...text: unknown[]) {
		try {
			console.error(...text);
			const path = resolve(this._rootDir, this.ERROR_FILE);
			const content = [
				'\n',
				`----- ${new Date()} -----`,
				...text,
			].map(v => (v as any)?.toString?.() ?? '').join('\n');
			await appendFile(path, content, 'utf-8');
		} catch {}
	}
}