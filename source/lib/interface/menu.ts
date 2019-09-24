import WikidataEntityReader from 'wikidata-entity-reader'

type ConstOrPromise<T> = T | Promise<T>
type Func<T> = (ctx: any, key?: string) => ConstOrPromise<T>
type ConstOrContextFunc<T> = T | Func<T>

export interface ButtonTextOptions {
	suffix?: ConstOrContextFunc<string>;
}

export function buttonText(emoji: ConstOrContextFunc<string>, resourceKey: ConstOrContextFunc<string>, options: ButtonTextOptions = {}): (ctx: any, key?: string) => Promise<string> {
	const {suffix} = options
	return async (ctx: any, key?: string) => {
		const emojiString = typeof emoji === 'function' ? await emoji(ctx, key) : emoji
		const resourceKeyString = typeof resourceKey === 'function' ? await resourceKey(ctx, key) : resourceKey
		const suffixString = typeof suffix === 'function' ? await suffix(ctx, key) : suffix
		const suffixPart = suffixString ? ` ${suffixString}` : ''
		return `${emojiString} ${ctx.wd.r(resourceKeyString).label()}${suffixPart}`
	}
}

export function menuPhoto(qNumberOrResourceKey: ConstOrContextFunc<string | undefined>): (ctx: any) => Promise<string> {
	return async (ctx: any) => {
		const asString = typeof qNumberOrResourceKey === 'function' ? await qNumberOrResourceKey(ctx) : qNumberOrResourceKey
		if (!asString) {
			return ''
		}

		const reader = ctx.wd.r(asString) as WikidataEntityReader
		return reader.images(800)[0]
	}
}
