import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../../lib/types'

import {emojis} from '../../lib/interface/emojis'
import {infoHeader} from '../../lib/interface/formatted-strings'
import {bodyPhoto, backButtons} from '../../lib/interface/menu'
import {percentString} from '../../lib/interface/format-percent'

/* eslint @typescript-eslint/no-var-requires: warn */
/* eslint @typescript-eslint/no-require-imports: warn */
const localeEmoji = require('locale-emoji')

async function menuBody(ctx: Context): Promise<Body> {
	const flag = flagString(ctx.wd.locale(), true)
	let text = ''
	const reader = await ctx.wd.reader('menu.language')
	text += infoHeader(reader, {titlePrefix: flag})

	if (ctx.wd.locale() !== 'wikidatanish') {
		text += (await ctx.wd.reader('other.translation')).label()
		text += ' '
		text += '`'
		text += ctx.wd.locale()
		text += '`'
		text += ': '
		text += percentString(await ctx.wd.localeProgress())
	}

	return {
		...bodyPhoto(reader),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

menu.toggle(async ctx => (await ctx.wd.reader('menu.allLanguages')).label(), 'all', {
	isSet: ctx => Boolean(ctx.session.showAllLanguages),
	set: (ctx, newState) => {
		if (newState) {
			ctx.session.showAllLanguages = newState
		} else {
			delete ctx.session.showAllLanguages
		}
	}
})

menu.interact(`${emojis.language} Wikidatanish`, 'wikidata', {
	do: ctx => {
		// Keep last set i18n locale
		// ctx.i18n.locale(key)
		ctx.wd.locale('wikidatanish')
		return '.'
	}
})

function flagString(languageCode: string, useFallbackFlag = false): string {
	const flag = localeEmoji(languageCode)
	if (!flag && useFallbackFlag) {
		return emojis.language
	}

	return flag
}

async function languageOptions(ctx: Context): Promise<readonly string[]> {
	const minPercentage = ctx.session.showAllLanguages ? 0 : undefined
	return ctx.wd.availableLocales(minPercentage)
}

menu.select('lang', languageOptions, {
	columns: 3,
	buttonText: (_, key) => {
		const flag = flagString(key)
		return `${flag} ${key}`
	},
	isSet: (ctx, key) => key === ctx.wd.locale(),
	set: (ctx, key) => {
		ctx.i18n.locale(key)
		ctx.wd.locale(key)
	},
	getCurrentPage: ctx => {
		return ctx.session.page
	},
	setPage: (ctx, page) => {
		ctx.session.page = page
	}
})

menu.manualRow(backButtons)
