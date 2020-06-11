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
	const reader = await ctx.wd.reader('action.construction')
	text += infoHeader(reader, {
		titlePrefix: emojis.construction
	})

	text += await moneyCostPart(ctx, ctx.session.money, cost)

	const readersOptions = await Promise.all(options.map(async o => ctx.wd.reader(o)))
	text += readersOptions
		.map(r => infoHeader(r, {
			titlePrefix: emojis.shop,
			titleSuffix: constructionSuffix(ctx.persist.skills, r.qNumber())
		}))
		.join('')

	text += emojis.countdown
	text += (await ctx.wd.reader('action.change')).label()
	text += ': '
	text += countdownHourMinute(nextConstructionChange(now) - now)
	text += ' '
	text += (await ctx.wd.reader('unit.hour')).label()
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
	buttonText: async (ctx, key) => emojis.construction + await ctx.wd.reader(key).then(r => r.label())
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	async ctx => (await ctx.wd.reader('action.construction')).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.shops-construction'))

menu.manualRow(backButtons)
