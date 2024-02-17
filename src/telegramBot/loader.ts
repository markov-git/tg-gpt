import { Context } from 'telegraf';

interface LoaderTokensConfig {
	tokensCount: number;
	limit: number;
}

export class Loader {
	private readonly _ctx: Context;
	private readonly _icons = [ '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛' ];
	private readonly _textTemplate = 'Сообщение принято{TOKENS}.\nАнализирую';
	private readonly _tokensTemplate = ' (Величина контекста {COUNT} - токенов, лимит {LIMIT})';

	private _message: Awaited<ReturnType<Context['reply']>> | null = null;
	private _intervalH: NodeJS.Timeout | null = null;

	constructor(ctx: Context) {
		this._ctx = ctx;
	}

	public async show(tokensConfig?: LoaderTokensConfig) {
		let index = 0;
		this._message = await this._ctx.reply(this.getText(index, tokensConfig));
		this._intervalH = setInterval(async () => {
			if (!this._ctx.chat || !this._message) return;
			index = index < this._icons.length - 1 ? index + 1 : 0;
			try {
				await this._ctx.telegram.editMessageText(
					this._ctx.chat.id,
					this._message.message_id,
					undefined,
					this.getText(index, tokensConfig),
				);
			} catch (e) {
				await this.hide();
			}
		}, 1000);
	}

	public async hide() {
		if (this._intervalH && this._ctx.chat && this._message) {
			clearInterval(this._intervalH);
			this._intervalH = null;
			await this._ctx.telegram.deleteMessage(this._ctx.chat.id, this._message.message_id);
			this._message = null;
		}
	}

	private getText(index: number, tokensConfig: LoaderTokensConfig | undefined) {
		const text = tokensConfig
			? this._textTemplate.replace(
				'{TOKENS}',
				this._tokensTemplate.replace('{COUNT}', tokensConfig.tokensCount.toString()).replace('{LIMIT}', tokensConfig.limit.toString())
			)
			: this._textTemplate.replace('{TOKENS}', '');
		return text + ' ' + this._icons[index];
	}
}