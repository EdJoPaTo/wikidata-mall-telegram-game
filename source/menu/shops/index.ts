import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../../lib/types'
import {Shop} from '../../lib/types/shop'
import {Skills} from '../../lib/types/skills'

import {buyAllCost, buyAllCostFactor, magnetEnabled} from '../../lib/game-math/shop-cost'
import {storageCapacity, storageFilledPercentage} from '../../lib/game-math/shop-capacity'

import {buttonText, bodyPhoto, backButtons} from '../../lib/interface/menu'
import {emojis} from '../../lib/interface/emojis'
import {incomePart} from '../../lib/interface/shop'
import {infoHeader, labeledFloat} from '../../lib/interface/formatted-strings'
import {percentBonusString, percentString} from '../../lib/interface/format-percent'

import {createHelpMenu, helpButtonText} from '../help'

import {menu as constructionMenu} from './construction'
import {menu as shopMenu} from './shop'

function shopLine(ctx: Context, shop: Shop, skills: Skills): string {
	const percentageFilled = storageFilledPercentage(shop, skills)

	let text = ''
	text += ctx.wd.reader(shop.id).label()
	text += ': '
	text += percentString(percentageFilled)
	text += emojis.storage

	return text
}

function menuBody(ctx: Context): Body {
	let text = ''
	const reader = ctx.wd.reader('menu.shop')
	text += infoHeader(reader, {
		titlePrefix: emojis.shop,
		titleSuffix: `(${ctx.persist.shops.length})`
	})

	text += labeledFloat(ctx.wd.reader('other.money'), ctx.session.money, emojis.currency)
	text += '\n'

	text += incomePart(ctx, ctx.persist.shops, ctx.persist, !ctx.session.hideExplanationMath)

	if (ctx.persist.shops.length > 0) {
		text += ctx.persist.shops
			.map(o => shopLine(ctx, o, ctx.persist.skills))
			.join('\n')
		text += '\n\n'
	}

	return {
		...bodyPhoto(reader),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

function buyAllAdditionalCostString(ctx: Context): string {
	const factor = buyAllCostFactor(ctx.persist.skills, ctx.persist.shops.length)
	const content = percentBonusString(factor) + emojis.currency
	return `(${content})`
}

function userShops(ctx: Context): string[] {
	return ctx.persist.shops.map(o => o.id)
}

menu.chooseIntoSubmenu('s', userShops, shopMenu, {
	columns: 2,
	buttonText: (ctx, key) => ctx.wd.reader(key).label()
})

menu.submenu(buttonText(emojis.construction, 'action.construction'), 'build', constructionMenu)

menu.interact(buttonText(emojis.magnetism, 'person.talents.purchasing', {suffix: buyAllAdditionalCostString}), 'buy-all', {
	hide: ctx => ctx.persist.shops.length < 2 || !magnetEnabled(ctx.persist.shops, ctx.persist.skills, ctx.session.money),
	do: ctx => {
		const now = Math.floor(Date.now() / 1000)

		const cost = buyAllCost(ctx.persist.shops, ctx.persist.skills)

		if (cost > ctx.session.money) {
			// What?
			return '.'
		}

		for (const shop of ctx.persist.shops) {
			const storage = storageCapacity(shop, ctx.persist.skills)
			for (const product of shop.products) {
				product.itemsInStore = storage
				product.itemTimestamp = now
			}
		}

		ctx.session.money -= cost
		return '.'
	}
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	ctx => ctx.wd.reader('menu.shop').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.shops'))

menu.manualRow(backButtons)
