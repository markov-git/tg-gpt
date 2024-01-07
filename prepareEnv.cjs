const fs = require('fs');
const path = require('path');

const envFile = `DATABASE_URL="postgresql://${ process.env.DB_LOGIN }:${ process.env.DB_PASSWORD }@localhost:5432/${ process.env.DB_NAME }?schema=public"`;
const envFilePath = path.resolve(__dirname, '.env');
fs.writeFileSync(envFilePath, envFile, 'utf-8');

const appConfig = {
	TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
	OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};
const appConfigPath = path.resolve(__dirname, 'config', 'production.json');
fs.writeFileSync(appConfigPath, JSON.stringify(appConfig), 'utf-8');
