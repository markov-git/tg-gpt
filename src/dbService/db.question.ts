import { PrismaClient } from '@prisma/client';

export class DbQuestionService {
	private readonly _client: PrismaClient;

	constructor(client: PrismaClient) {
		this._client = client;
	}

	public create(
		userId: string,
		text: string,
		audioURL: string | undefined,
	) {
		return this._client.question.create({
			data: {
				userId,
				text,
				audioURL,
			},
		});
	}

	public findUserQuestions(userId: string) {
		return this._client.question.findMany({
			where: { userId },
		});
	}
}