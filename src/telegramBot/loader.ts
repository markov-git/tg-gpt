import { Context } from 'telegraf';

export class Loader {
	private readonly _ctx: Context;
	private readonly _icons = [ '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛' ];
	private readonly _textTemplate = 'Сообщение принято. Анализирую';

	private _message: Awaited<ReturnType<Context['reply']>> | null = null;
	private _intervalH: NodeJS.Timeout | null = null;

	constructor(ctx: Context) {
		this._ctx = ctx;
	}

	public async show() {
		let index = 0;
		this._message = await this._ctx.reply(this.getText(index));
		this._intervalH = setInterval(() => {
			if (!this._ctx.chat || !this._message) return;
			index = index < this._icons.length - 1 ? index + 1 : 0;
			this._ctx.telegram.editMessageText(
				this._ctx.chat.id,
				this._message.message_id,
				undefined,
				this.getText(index),
				// todo подумать как не игнорировать (падает из за того что уже может быть удалено)
			).catch(() => {});
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

	private getText(index: number) {
		return this._textTemplate + ' ' + this._icons[index];
	}
}