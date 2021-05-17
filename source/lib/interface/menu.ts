import {createBackMainMenuButtons} from 'telegraf-inline-menu'
import {MediaBody} from 'telegraf-inline-menu/dist/source/body.js'
import WikidataEntityReader from 'wikidata-entity-reader'

import {Context} from '../types'

import {emojis} from './emojis'

type ConstOrPromise<T> = T | Promise<T>
type Func<T> = (ctx: Context, key?: string) => ConstOrPromise<T>
type ConstOrContextFunc<T> = T | Func<T>

export interface ButtonTextOptions {
	readonly requireAttention?: Func<boolean>;
	readonly suffix?: ConstOrContextFunc<string>;
}

export function buttonText(emoji: ConstOrContextFunc<string>, resourceKey: ConstOrContextFunc<string>, options: ButtonTextOptions = {}): (ctx: Context, key?: string) => Promise<string> {
	const {requireAttention, suffix} = options
	return async (ctx, key) => {
		const requireAttentionString = requireAttention && await requireAttention(ctx, key) ? emojis.requireAttention : ''
		const emojiString = typeof emoji === 'function' ? await emoji(ctx, key) : emoji
		const resourceKeyString = typeof resourceKey === 'function' ? await resourceKey(ctx, key) : resourceKey
		const suffixString = typeof suffix === 'function' ? await suffix(ctx, key) : suffix
		const suffixPart = suffixString ? ` ${suffixString}` : ''
		return `${requireAttentionString}${emojiString} ${await ctx.wd.reader(resourceKeyString).then(r => r.label())}${suffixPart}`
	}
}

export function bodyPhoto(reader: WikidataEntityReader): MediaBody | Record<string, unknown> {
	const url = reader.images(800)[0]
	if (!url) {
		return {}
	}

	return {
		media: url,
		type: 'photo'
	}
}

export const backButtons = createBackMainMenuButtons<Context>(
	ctx => `🔙 ${ctx.i18n.t('menu.back')}`,
	async ctx => `🔝 ${(await ctx.wd.reader('menu.menu')).label()}`
)
