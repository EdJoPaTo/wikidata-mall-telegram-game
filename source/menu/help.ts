import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../lib/types'

import {emojis} from '../lib/interface/emojis'
import {infoHeader} from '../lib/interface/formatted-strings'
import {buttonText, backButtons} from '../lib/interface/menu'

export function createHelpMenu(i18nKey: string): MenuTemplate<Context> {
	const menu = new MenuTemplate<Context>(menuBody(i18nKey))

	menu.url(
		buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
		ctx => ctx.wd.reader('menu.help').url()
	)

	menu.url(buttonText(emojis.chat, 'menu.chat'), 'https://t.me/WikidataMallChat')

	menu.url(buttonText(emojis.github, 'other.github'), 'https://github.com/EdJoPaTo/wikidata-mall-telegram-game/tree/master/locales', {
		joinLastRow: true
	})

	menu.manualRow(backButtons)

	return menu
}

export function helpButtonText(): (ctx: Context) => Promise<string> {
	return buttonText(emojis.help, 'menu.help')
}

function menuBody(i18nKey: string): (ctx: Context) => Body {
	return ctx => {
		let text = ''
		text += infoHeader(ctx.wd.reader('menu.help'), {titlePrefix: emojis.help})

		text += ctx.i18n.t(i18nKey).trim()

		text += '\n\n\n'
		text += '——————'
		text += '\n'

		text += ctx.i18n.t('help.improveHelp', {key: i18nKey, language: ctx.i18n.locale()})

		return {text, parse_mode: 'Markdown'}
	}
}
