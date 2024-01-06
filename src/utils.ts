import { readdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const PACKAGE_NAME = 'package.json';
const __dirname = dirname(fileURLToPath(import.meta.url));

export function getRootDir(dirname: string = __dirname): string {
	const filesInDir = readdirSync(dirname);
	const hasPackage = filesInDir.includes(PACKAGE_NAME);
	if (hasPackage) return dirname;
	if (dirname == '/') throw new Error('Project RootDir not found!');
	return getRootDir(resolve(dirname, '..'));
}