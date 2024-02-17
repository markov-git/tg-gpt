import { encoding_for_model, Tiktoken, TiktokenModel } from 'tiktoken';

export class TikToken {
	private readonly _encoding: Tiktoken;
	public readonly OPENAI_TOKENS_COUNT_LIMIT = 4_097;

	constructor(gptModel: TiktokenModel) {
		this._encoding = encoding_for_model(gptModel);
	}

	public calculateTokens(text: string): number {
		const tokens = this._encoding.encode(text);
		return tokens.length;
	}

	public destruct() {
		this._encoding.free();
	}
}