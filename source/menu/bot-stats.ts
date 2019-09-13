import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Person} from '../lib/types/people'
import {Session} from '../lib/types'

import * as userSessions from '../lib/data/user-sessions'
import * as userShops from '../lib/data/shops'
import * as wdNames from '../lib/wikidata/name'
import * as wdShops from '../lib/wikidata/shops'

import {buttonText, menuPhoto} from '../lib/interface/menu'
import {emojis} from '../lib/interface/emojis'
import {formatInt} from '../lib/interface/format-number'
import {humanReadableTimestamp} from '../lib/interface/formatted-time'
import {infoHeader} from '../lib/interface/formatted-strings'

import {createHelpMenu, helpButtonText} from './help'

function entryLine(ctx: any, resourceKey: string, value: string): string {
	let text = ''
	text += ctx.wd.r(resourceKey).label()
	text += ': '
	text += value
	text += '\n'

	return text
}

async function menuText(ctx: any): Promise<string> {
	let text = ''
	text += infoHeader(ctx.wd.r('stat.stats'), {titlePrefix: emojis.stats})
	text += '\n\n'

	text += '*'
	text += ctx.wd.r('menu.wikidata').label()
	text += '*'
	text += '\n'

	text += entryLine(ctx, 'menu.shop', formatInt(wdShops.allShops().length))
	text += entryLine(ctx, 'product.product', formatInt(wdShops.allProductsAmount()))
	text += entryLine(ctx, 'stat.name.given', formatInt(wdNames.getGivenNames().length))
	text += entryLine(ctx, 'stat.name.family', formatInt(wdNames.getFamilyNames().length))

	text += '\n'
	text += '*'
	text += ctx.wd.r('stat.game').label()
	text += '*'
	text += '\n'

	const allShopsDict = await userShops.getAllShops()
	const allShops = Object.values(allShopsDict).flat()
	const allProducts = allShops.flatMap(o => o.products)
	const allEmployees = allShops.flatMap(o => Object.values(o.personal) as Person[])

	text += entryLine(ctx, 'stat.player', formatInt(userSessions.getRaw().length))
	text += entryLine(ctx, 'menu.shop', formatInt(allShops.length))
	text += entryLine(ctx, 'menu.employee', formatInt(allEmployees.length))
	text += entryLine(ctx, 'product.product', formatInt(allProducts.length))

	const {gameStarted, stats, __wikibase_language_code: locale} = ctx.session as Session

	text += '\n'
	text += '*'
	text += ctx.wd.r('stat.player').label()
	text += '*'
	text += '\n'

	text += entryLine(ctx, 'achievement.gameStarted', humanReadableTimestamp(gameStarted, locale))
	text += entryLine(ctx, 'person.talents.purchasing', formatInt(stats.productsBought))

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto('stat.stats')
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r('stat.stats').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.bot-stats'))

export default menu
