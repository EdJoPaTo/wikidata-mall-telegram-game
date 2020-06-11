import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../../lib/types'

import {buttonText, bodyPhoto, backButtons} from '../../lib/interface/menu'
import {emojis} from '../../lib/interface/emojis'
import {infoHeader} from '../../lib/interface/formatted-strings'

import {createHelpMenu, helpButtonText} from '../help'

import {menu as languageMenu} from './languages'
import {menu as timezoneMenu} from './timezone'

async function menuBody(ctx: Context): Promise<Body> {
	let text = ''
	const reader = await ctx.wd.reader('menu.settings')
	text += infoHeader(reader, {titlePrefix: emojis.settings})
	return {
		...bodyPhoto(reader),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

menu.submenu(buttonText(emojis.language, 'menu.language'), 'lang', languageMenu)

menu.submenu(buttonText(emojis.timezone, 'menu.timezone'), 'tz', timezoneMenu)

menu.toggle(async ctx => (await ctx.wd.reader('other.math')).label(), 'explanationMath', {
	isSet: ctx => {
		return !ctx.session.hideExplanationMath
	},
	set: (ctx, newState) => {
		if (newState) {
			delete ctx.session.hideExplanationMath
		} else {
			ctx.session.hideExplanationMath = true
		}
	}
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	async ctx => (await ctx.wd.reader('menu.settings')).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.settings'))

menu.manualRow(backButtons)
