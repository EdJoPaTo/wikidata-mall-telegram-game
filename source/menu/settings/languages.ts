import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Session} from '../../lib/types'

import {emojis} from '../../lib/interface/emojis'
import {infoHeader} from '../../lib/interface/formatted-strings'
import {menuPhoto} from '../../lib/interface/menu'
import {percentString} from '../../lib/interface/format-percent'

/* eslint @typescript-eslint/no-var-requires: warn */
/* eslint @typescript-eslint/no-require-imports: warn */
const localeEmoji = require('locale-emoji')

function menuText(ctx: any): string {
	const flag = flagString(ctx.wd.locale(), true)
	let text = ''
	text += infoHeader(ctx.wd.r('menu.language'), {titlePrefix: flag})

	if (ctx.wd.locale() !== 'wikidatanish') {
		text += ctx.wd.r('other.translation').label()
		text += ' '
		text += '`'
		text += ctx.wd.locale()
		text += '`'
		text += ': '
		text += percentString(ctx.wd.localeProgress())
	}

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto('menu.language')
})
menu.setCommand('language')

menu.toggle((ctx: any) => ctx.wd.r('menu.allLanguages').label(), 'all', {
	isSetFunc: (ctx: any) => {
		const session = ctx.session as Session
		return Boolean(session.showAllLanguages)
	},
	setFunc: (ctx: any, newState) => {
		const session = ctx.session as Session
		if (newState) {
			session.showAllLanguages = newState
		} else {
			delete session.showAllLanguages
		}
	}
})

menu.button(`${emojis.language} Wikidatanish`, 'wikidata', {
	doFunc: (ctx: any) => {
		// Keep last set i18n locale
		// ctx.i18n.locale(key)
		ctx.wd.locale('wikidatanish')
	}
})

function flagString(languageCode: string, useFallbackFlag = false): string {
	const flag = localeEmoji(languageCode)
	if (!flag && useFallbackFlag) {
		return emojis.language
	}

	return flag
}

function languageOptions(ctx: any): string[] {
	const session = ctx.session as Session
	const minPercentage = session.showAllLanguages ? 0 : 0.1
	return ctx.wd.availableLocales(minPercentage)
}

menu.select('lang', languageOptions, {
	columns: 3,
	textFunc: (_ctx, key) => {
		const flag = flagString(key)
		return `${flag} ${key}`
	},
	isSetFunc: (ctx: any, key) => key === ctx.wd.locale(),
	setFunc: (ctx: any, key) => {
		ctx.i18n.locale(key)
		ctx.wd.locale(key)
	},
	getCurrentPage: (ctx: any) => {
		const session = ctx.session as Session
		return session.page
	},
	setPage: (ctx: any, page) => {
		const session = ctx.session as Session
		session.page = page
	}
})

export default menu
