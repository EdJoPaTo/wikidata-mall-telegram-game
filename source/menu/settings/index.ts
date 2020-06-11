import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Session} from '../../lib/types'

import {buttonText, menuPhoto} from '../../lib/interface/menu'
import {emojis} from '../../lib/interface/emojis'
import {infoHeader} from '../../lib/interface/formatted-strings'

import {createHelpMenu, helpButtonText} from '../help'

import languageMenu from './languages'
import timezoneMenu from './timezone'

function menuText(ctx: any): string {
	let text = ''
	text += infoHeader(ctx.wd.reader('menu.settings'), {titlePrefix: emojis.settings})
	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto('menu.settings')
})
menu.setCommand('settings')

menu.submenu(buttonText(emojis.language, 'menu.language'), 'lang', languageMenu)

menu.submenu(buttonText(emojis.timezone, 'menu.timezone'), 'tz', timezoneMenu)

menu.toggle((ctx: any) => ctx.wd.reader('other.math').label(), 'explanationMath', {
	isSetFunc: (ctx: any) => {
		const session = ctx.session as Session
		return !session.hideExplanationMath
	},
	setFunc: (ctx: any, newState) => {
		const session = ctx.session as Session
		if (newState) {
			delete session.hideExplanationMath
		} else {
			session.hideExplanationMath = true
		}
	}
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.reader('menu.settings').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.settings'))

export default menu
