import TelegrafInlineMenu from 'telegraf-inline-menu'

import {emojis} from '../lib/interface/emojis'
import {infoHeader} from '../lib/interface/formatted-strings'
import {buttonText} from '../lib/interface/menu'

export function createHelpMenu(i18nKey: string): TelegrafInlineMenu {
	const menu = new TelegrafInlineMenu(menuText(i18nKey))

	menu.urlButton(
		buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
		(ctx: any) => ctx.wd.reader('menu.help').url()
	)

	menu.urlButton(buttonText(emojis.chat, 'menu.chat'), 'https://t.me/WikidataMallChat')

	menu.urlButton(buttonText(emojis.github, 'other.github'), 'https://github.com/EdJoPaTo/wikidata-mall-telegram-game/tree/master/locales', {
		joinLastRow: true
	})

	return menu
}

export function helpButtonText(): (ctx: any) => Promise<string> {
	return buttonText(emojis.help, 'menu.help')
}

function menuText(i18nKey: string): (ctx: any) => string {
	return ctx => {
		let text = ''
		text += infoHeader(ctx.wd.reader('menu.help'), {titlePrefix: emojis.help})

		text += ctx.i18n.t(i18nKey).trim()

		text += '\n\n\n'
		text += '——————'
		text += '\n'

		text += ctx.i18n.t('help.improveHelp', {key: i18nKey, language: ctx.i18n.languageCode})

		return text
	}
}
