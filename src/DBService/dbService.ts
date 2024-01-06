import { PrismaClient } from '@prisma/client';
import { DBUserService } from './db.user';
import { DbQuestionService } from './db.question';

export class DBService {
	private readonly _client: PrismaClient;

	private readonly _user: DBUserService;
	private readonly _question: DbQuestionService;

	constructor() {
		this._client = new PrismaClient();
		this._user = new DBUserService(this._client);
		this._question = new DbQuestionService(this._client);
	}

	public async init() {
		await this._client.$connect();
		console.log('DBService: started');
	}

	public async stop() {
		await this._client.$disconnect();
		console.log('DBService: stopped');
	}

	public get user() {
		return this._user;
	}

	public get question() {
		return this._question;
	}
}