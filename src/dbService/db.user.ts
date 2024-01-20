import { PrismaClient } from '@prisma/client';

export class DBUserService {
	private readonly _client: PrismaClient;

	constructor(client: PrismaClient) {
		this._client = client;
	}

	public async create(
		id: string,
		first_name: string,
		username: string | undefined,
	) {
		await this._client.user.create({
			data: {
				id,
				username,
				first_name,
				questions: {
					create: [],
				},
			},
		});
	}

	public async setAsAdmin(id: string) {
		await this._client.user.update({
			where: { id },
			data: { admin: true }
		});
	}

	public getById(id: string) {
		return this._client.user.findUnique({
			where: {
				id,
			},
		});
	}

	public get list() {
		return this._client.user.findMany();
	}
}