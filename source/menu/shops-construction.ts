import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Session, Persist} from '../lib/types'

import {Dictionary, sortDictKeysByStringValues, recreateDictWithGivenKeyOrder} from '../lib/js-helper/dictionary'

import {costForAdditionalShop} from '../lib/game-math/shop-cost'

import {getCurrentConstructions, nextConstructionChange} from '../lib/game-logic/shop-construction'

import {buttonText, menuPhoto} from '../lib/interface/menu'
import {countdownHourMinute} from '../lib/interface/formatted-time'
import {emojis} from '../lib/interface/emojis'
import {infoHeader, labeledFloat} from '../lib/interface/formatted-strings'

import {createHelpMenu, helpButtonText} from './help'
import constructionOptionMenu from './shops-construction-option'

async function menuText(ctx: any): Promise<string> {
	const session = ctx.session as Session
	const persist = ctx.persist as Persist
	const now = Date.now() / 1000
	const cost = costForAdditionalShop(persist.shops.length)

	let text = ''
	text += infoHeader(ctx.wd.r('action.construction'), {
		titlePrefix: emojis.construction
	})
	text += '\n\n'

	text += labeledFloat(ctx.wd.r('other.money'), session.money, emojis.currency)
	text += '\n'

	if (session.money < cost) {
		text += emojis.requireAttention
	}

	text += labeledFloat(ctx.wd.r('other.cost'), cost, emojis.currency)
	text += '\n\n'

	text += Object.keys(await constructionOptions(ctx))
		.map(o => infoHeader(ctx.wd.r(o), {titlePrefix: emojis.shop}))
		.join('\n\n')
	text += '\n\n'

	text += emojis.countdown
	text += countdownHourMinute(nextConstructionChange(now) - now)
	text += ' '
	text += ctx.wd.r('unit.hour').label()
	text += '\n\n'

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto('action.construction')
})

async function constructionOptions(ctx: any): Promise<Dictionary<string>> {
	const {__wikibase_language_code: locale} = ctx.session as Session
	const now = Date.now() / 1000
	const construction = await getCurrentConstructions(now)

	const labels: Dictionary<string> = {}
	for (const shopId of construction.possibleShops) {
		labels[shopId] = ctx.wd.r(shopId).label()
	}

	const orderedKeys = sortDictKeysByStringValues(labels, locale === 'wikidatanish' ? 'en' : locale)
	return recreateDictWithGivenKeyOrder(labels, orderedKeys)
}

menu.selectSubmenu('s', constructionOptions, constructionOptionMenu, {
	columns: 1
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r('action.construction').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.shops-construction'))

export default menu
