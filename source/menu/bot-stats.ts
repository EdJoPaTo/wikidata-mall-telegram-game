import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../lib/types'
import {Person} from '../lib/types/people'

import * as userMalls from '../lib/data/malls'
import * as userSessions from '../lib/data/user-sessions'
import * as userShops from '../lib/data/shops'
import * as wdAttractions from '../lib/wikidata/attractions'
import * as wdNames from '../lib/wikidata/name'
import * as wdProduction from '../lib/wikidata/production'
import * as wdSets from '../lib/wikidata/sets'
import * as wdShops from '../lib/wikidata/shops'

import {buttonText, bodyPhoto, backButtons} from '../lib/interface/menu'
import {emojis} from '../lib/interface/emojis'
import {humanReadableTimestamp} from '../lib/interface/formatted-time'
import {infoHeader, labeledValue, labeledInt} from '../lib/interface/formatted-strings'

import {createHelpMenu, helpButtonText} from './help'

async function menuBody(ctx: Context): Promise<Body> {
	let text = ''
	const reader = ctx.wd.reader('stat.stats')
	text += infoHeader(reader, {titlePrefix: emojis.stats})

	text += '*'
	text += ctx.wd.reader('menu.wikidata').label()
	text += '*'
	text += '\n'

	text += labeledInt(ctx.wd.reader('menu.shop'), wdShops.allShops().length)
	text += labeledInt(ctx.wd.reader('product.product'), wdShops.allProductsAmount())
	text += labeledInt(ctx.wd.reader('stat.name.given'), wdNames.getGivenNames().length)
	text += labeledInt(ctx.wd.reader('stat.name.family'), wdNames.getFamilyNames().length)
	text += labeledInt(ctx.wd.reader('mall.production'), wdProduction.getProducts().length)
	text += labeledInt(ctx.wd.reader('mall.attraction'), Object.keys(wdAttractions.all()).length)
	text += labeledInt(ctx.wd.reader('mall.disaster'), wdSets.get('disaster').length)

	text += '\n'
	text += '*'
	text += ctx.wd.reader('stat.game').label()
	text += '*'
	text += '\n'

	const allShopsDict = await userShops.getAll()
	const allShops = Object.values(allShopsDict).flat()
	const allProducts = allShops.flatMap(o => o.products)
	const allEmployees = allShops.flatMap(o => Object.values(o.personal) as Person[])
	const allMallsDict = await userMalls.getAll()
	const allMalls = Object.values(allMallsDict)

	text += labeledInt(ctx.wd.reader('stat.player'), userSessions.getRaw().length)
	text += labeledInt(ctx.wd.reader('menu.mall'), allMalls.length)
	text += labeledInt(ctx.wd.reader('menu.shop'), allShops.length)
	text += labeledInt(ctx.wd.reader('menu.employee'), allEmployees.length)
	text += labeledInt(ctx.wd.reader('product.product'), allProducts.length)

	const {gameStarted, stats, timeZone, __wikibase_language_code: locale} = ctx.session

	text += '\n'
	text += '*'
	text += ctx.wd.reader('stat.player').label()
	text += '*'
	text += '\n'

	text += labeledValue(ctx.wd.reader('achievement.gameStarted'), humanReadableTimestamp(gameStarted, locale, timeZone))
	text += labeledInt(ctx.wd.reader('person.talents.purchasing'), stats.productsBought)

	return {
		...bodyPhoto(reader),
		text,
		parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	ctx => ctx.wd.reader('stat.stats').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.bot-stats'))

menu.manualRow(backButtons)
