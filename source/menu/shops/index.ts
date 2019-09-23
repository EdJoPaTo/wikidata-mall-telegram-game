import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Session, Persist} from '../../lib/types'
import {Shop} from '../../lib/types/shop'
import {Skills} from '../../lib/types/skills'

import {buyAllCost, buyAllCostFactor, magnetEnabled} from '../../lib/game-math/shop-cost'
import {storageCapacity, storageFilledPercentage} from '../../lib/game-math/shop-capacity'

import {buttonText, menuPhoto} from '../../lib/interface/menu'
import {emojis} from '../../lib/interface/emojis'
import {incomePart} from '../../lib/interface/shop'
import {infoHeader, labeledFloat} from '../../lib/interface/formatted-strings'
import {percentBonusString, percentString} from '../../lib/interface/format-percent'

import {createHelpMenu, helpButtonText} from '../help'

import constructionMenu from './construction'
import shopMenu from './shop'

function shopLine(ctx: any, shop: Shop, skills: Skills): string {
	const percentageFilled = storageFilledPercentage(shop, skills)

	let text = ''
	text += ctx.wd.r(shop.id).label()
	text += ': '
	text += percentString(percentageFilled)
	text += emojis.storage

	return text
}

function menuText(ctx: any): string {
	const session = ctx.session as Session
	const persist = ctx.persist as Persist

	let text = ''
	text += infoHeader(ctx.wd.r('menu.shop'), {
		titlePrefix: emojis.shop,
		titleSuffix: `(${persist.shops.length})`
	})
	text += '\n\n'

	text += labeledFloat(ctx.wd.r('other.money'), session.money, emojis.currency)
	text += '\n\n'

	text += incomePart(ctx, persist.shops, persist.skills, !session.hideExplanationMath)

	if (persist.shops.length > 0) {
		text += persist.shops
			.map(o => shopLine(ctx, o, persist.skills))
			.join('\n')
		text += '\n\n'
	}

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto('menu.shop')
})

function buyAllAdditionalCostString(ctx: any): string {
	const persist = ctx.persist as Persist
	const factor = buyAllCostFactor(persist.skills, persist.shops.length)
	return percentBonusString(factor) + emojis.currency
}

function userShops(ctx: any): string[] {
	const persist = ctx.persist as Persist
	return persist.shops.map(o => o.id)
}

menu.selectSubmenu('s', userShops, shopMenu, {
	columns: 2,
	textFunc: (ctx: any, key) => ctx.wd.r(key).label()
})

menu.submenu(buttonText(emojis.construction, 'action.construction'), 'build', constructionMenu)

menu.button(buttonText(emojis.magnetism, 'person.talents.purchasing', ctx => `(${buyAllAdditionalCostString(ctx)})`), 'buy-all', {
	hide: (ctx: any) => {
		const session = ctx.session as Session
		const persist = ctx.persist as Persist

		return persist.shops.length < 2 || !magnetEnabled(persist.shops, persist.skills, session.money)
	},
	doFunc: (ctx: any) => {
		const session = ctx.session as Session
		const persist = ctx.persist as Persist
		const now = Math.floor(Date.now() / 1000)

		const cost = buyAllCost(persist.shops, persist.skills)

		if (cost > session.money) {
			// What?
			return
		}

		for (const shop of persist.shops) {
			const storage = storageCapacity(shop, persist.skills)
			for (const product of shop.products) {
				product.itemsInStore = storage
				product.itemTimestamp = now
			}
		}

		session.money -= cost
	}
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r('menu.shop').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.shops'))

export default menu

export const replyMenu = menu.replyMenuMiddleware()
