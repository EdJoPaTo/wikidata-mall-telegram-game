import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../../../lib/types'

import {costForAdditionalShop} from '../../../lib/game-math/shop-cost'

import {getCurrentConstructions, nextConstructionChange} from '../../../lib/game-logic/shop-construction'

import {buttonText, bodyPhoto, backButtons} from '../../../lib/interface/menu'
import {constructionSuffix} from '../../../lib/interface/shop-construction'
import {countdownHourMinute} from '../../../lib/interface/formatted-time'
import {emojis} from '../../../lib/interface/emojis'
import {infoHeader, moneyCostPart} from '../../../lib/interface/formatted-strings'

import {createHelpMenu, helpButtonText} from '../../help'

import {menu as constructionOptionMenu} from './option'

type QNumber = string

async function menuBody(ctx: Context): Promise<Body> {
	const now = Date.now() / 1000
	const cost = costForAdditionalShop(ctx.persist.shops.length)
	const options = await constructionOptions()

	let text = ''
	const reader = ctx.wd.reader('action.construction')
	text += infoHeader(reader, {
		titlePrefix: emojis.construction
	})

	text += moneyCostPart(ctx, ctx.session.money, cost)

	text += options
		.map(o => infoHeader(ctx.wd.reader(o), {
			titlePrefix: emojis.shop,
			titleSuffix: constructionSuffix(ctx.persist.skills, o)
		}))
		.join('')

	text += emojis.countdown
	text += ctx.wd.reader('action.change').label()
	text += ': '
	text += countdownHourMinute(nextConstructionChange(now) - now)
	text += ' '
	text += ctx.wd.reader('unit.hour').label()
	text += '\n\n'

	return {
		...bodyPhoto(reader),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

async function constructionOptions(): Promise<readonly QNumber[]> {
	const now = Date.now() / 1000
	const construction = await getCurrentConstructions(now)
	return construction.possibleShops
}

menu.chooseIntoSubmenu('s', constructionOptions, constructionOptionMenu, {
	columns: 1,
	buttonText: (ctx, key) => {
		return emojis.construction + ctx.wd.reader(key).label()
	}
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	ctx => ctx.wd.reader('action.construction').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.shops-construction'))

menu.manualRow(backButtons)
