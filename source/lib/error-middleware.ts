import {Context as TelegrafContext, MiddlewareFn} from 'telegraf'
import {InlineKeyboardMarkup} from 'typegram'

export type ErrorMatchRule = RegExp | string

export interface Options {
	readonly inlineKeyboardMarkup?: InlineKeyboardMarkup;
	readonly text?: string;
}

export interface TelegrafErrorPayload {
	readonly photo?: string;
	readonly media?: {
		readonly media: string;
	};
}

export class ErrorMiddleware {
	private readonly _keyboard?: InlineKeyboardMarkup

	private readonly _userText?: string

	constructor(options: Options = {}) {
		this._keyboard = options.inlineKeyboardMarkup
		this._userText = options.text
	}

	middleware(): MiddlewareFn<TelegrafContext> {
		return async (ctx, next) => {
			try {
				await next()
			} catch (error: unknown) {
				if (!(error instanceof Error)) {
					throw new TypeError(`Error is not of type error: ${typeof error} ${String(error)}`)
				}

				if (error.message.includes('Too Many Requests')) {
					console.warn('Telegraf Too Many Requests error. Skip.', error)
					return
				}

				if (isMatch(
					error.message,
					'cancelled by new editMessageMedia request',
					'message to edit not found',
					'query is too old'
				)) {
					console.warn('ERROR', ...getUpdateContext(ctx), error.message)
					return
				}

				let text = '🔥 Something went wrong here!'
				if (this._userText) {
					text += '\n'
					text += this._userText
				}

				text += '\n\n'

				const token = (ctx as any).tg.token as string
				text += 'Error: `'
				text += error.message
					.replace(token, '')
				text += '`'
				text += '\n\n'

				const payload = getTelegrafErrorPayload(error)

				if (payload && isMatch(
					error.message,
					'MEDIA_EMPTY',
					'WEBPAGE_CURL_FAILED',
					'wrong file identifier/HTTP URL specified'
				)) {
					// Some problem with the url
					const url = payload.photo ?? payload.media?.media
					console.warn('Telegram url fail', ...getUpdateContext(ctx), error.message, url ?? payload)
					if (url) {
						text += 'Problem with this url: '
						text +=	url
						text += '\n\n'
					}
				} else {
					// Generic log
					console.error('ERROR', 'try to send error to user', error.message, ctx.update, error, payload)
				}

				try {
					const target = (ctx.chat ?? ctx.from!).id
					await ctx.telegram.sendMessage(target, text, {
						...this._keyboard,
						parse_mode: 'Markdown',
						disable_web_page_preview: true
					})
				} catch (error: unknown) {
					console.error('send error to user failed', error)
				}
			}
		}
	}
}

function getUpdateContext(ctx: TelegrafContext): Array<string | number | undefined> {
	const infos: Array<string | number | undefined> = []

	if (ctx.chat) {
		infos.push(ctx.chat.id)
	}

	if (ctx.from) {
		infos.push(ctx.from.id)
	}

	if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
		infos.push(ctx.callbackQuery.data)
	}

	if (ctx.inlineQuery) {
		infos.push(ctx.inlineQuery.offset)
		infos.push(ctx.inlineQuery.query)
	}

	return infos
}

function isMatch(message: string, ...rules: ErrorMatchRule[]): boolean {
	return rules.some(rule =>
		rule instanceof RegExp ? rule.test(message) : message.includes(rule)
	)
}

function getTelegrafErrorPayload(error: any): TelegrafErrorPayload | undefined {
	return error?.on?.payload
}
