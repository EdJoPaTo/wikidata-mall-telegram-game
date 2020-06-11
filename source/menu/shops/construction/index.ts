import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Session, Persist} from '../../../lib/types'

import {costForAdditionalShop} from '../../../lib/game-math/shop-cost'

import {getCurrentConstructions, nextConstructionChange} from '../../../lib/game-logic/shop-construction'

import {buttonText, menuPhoto} from '../../../lib/interface/menu'
import {constructionSuffix} from '../../../lib/interface/shop-construction'
import {countdownHourMinute} from '../../../lib/interface/formatted-time'
import {emojis} from '../../../lib/interface/emojis'
import {infoHeader, moneyCostPart} from '../../../lib/interface/formatted-strings'

import {createHelpMenu, helpButtonText} from '../../help'

import constructionOptionMenu from './option'

type QNumber = string

async function menuText(ctx: any): Promise<string> {
	const session = ctx.session as Session
	const persist = ctx.persist as Persist
	const now = Date.now() / 1000
	const cost = costForAdditionalShop(persist.shops.length)
	const options = await constructionOptions()

	let text = ''
	text += infoHeader(ctx.wd.reader('action.construction'), {
		titlePrefix: emojis.construction
	})

	text += moneyCostPart(ctx, session.money, cost)

	text += options
		.map(o => infoHeader(ctx.wd.reader(o), {
			titlePrefix: emojis.shop,
			titleSuffix: constructionSuffix(persist.skills, o)
		}))
		.join('')

	text += emojis.countdown
	text += ctx.wd.reader('action.change').label()
	text += ': '
	text += countdownHourMinute(nextConstructionChange(now) - now)
	text += ' '
	text += ctx.wd.reader('unit.hour').label()
	text += '\n\n'

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto('action.construction')
})

async function constructionOptions(): Promise<readonly QNumber[]> {
	const now = Date.now() / 1000
	const construction = await getCurrentConstructions(now)
	return construction.possibleShops
}

menu.selectSubmenu('s', constructionOptions, constructionOptionMenu, {
	columns: 1,
	prefixFunc: () => emojis.construction,
	textFunc: (ctx: any, key) => {
		return ctx.wd.reader(key).label()
	}
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.reader('action.construction').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.shops-construction'))

export default menu
