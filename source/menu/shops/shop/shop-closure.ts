import TelegrafInlineMenu from 'telegraf-inline-menu'
import WikidataEntityReader from 'wikidata-entity-reader'

import {Session, Persist} from '../../../lib/types'
import {Shop} from '../../../lib/types/shop'

import {moneyForShopClosure} from '../../../lib/game-math/shop-cost'

import * as wdShop from '../../../lib/wikidata/shops'

import {buttonText, menuPhoto} from '../../../lib/interface/menu'
import {emojis} from '../../../lib/interface/emojis'
import {formatFloat, formatInt} from '../../../lib/interface/format-number'
import {infoHeader, labeledFloat} from '../../../lib/interface/formatted-strings'

import {createHelpMenu, helpButtonText} from '../../help'
import {replyMenu} from '..'

function fromCtx(ctx: any): {shop: Shop; indexOfShop: number} {
	const persist = ctx.persist as Persist
	const shopType = ctx.match[1]
	const indexOfShop = persist.shops.map(o => o.id).indexOf(shopType)
	const shop = persist.shops[indexOfShop]
	return {shop, indexOfShop}
}

function menuText(ctx: any): string {
	const {shop} = fromCtx(ctx)
	const reader = ctx.wd.r('action.close') as WikidataEntityReader

	const session = ctx.session as Session
	const persist = ctx.persist as Persist

	const shopBuildable = wdShop.allShops().includes(shop.id)
	const closureMoney = moneyForShopClosure(persist.shops.length, shop.products.length, shopBuildable)

	let text = ''
	text += infoHeader(reader, {titlePrefix: emojis.close})

	text += labeledFloat(ctx.wd.r('other.money'), session.money, emojis.currency)
	text += '\n'

	text += emojis.close
	text += '*'
	text += ctx.wd.r(shop.id).label()
	text += '*'
	text += '\n'
	text += '+'
	text += formatFloat(closureMoney)
	text += emojis.currency
	text += '\n\n'

	const warnings: string[] = []

	const employeeCount = Object.values(shop.personal).length
	if (employeeCount > 0) {
		warnings.push(`${formatInt(employeeCount)}${emojis.person}`)
	}

	const itemsInStore = shop.products.map(o => o.itemsInStore).reduce((a, b) => a + b, 0)
	if (itemsInStore > 0) {
		warnings.push(`${formatInt(itemsInStore)}${emojis.storage}`)
	}

	const matchingSkillsInQueue = session.skillQueue.filter(o => o.category === shop.id).length
	if (matchingSkillsInQueue > 0) {
		warnings.push(`${formatInt(matchingSkillsInQueue)}${emojis.skill}`)
	}

	if (warnings.length > 0) {
		text += warnings
			.map(o => `${emojis.warning}${o}`)
			.join('\n')
		text += '\n\n'
	}

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto(ctx => fromCtx(ctx).shop.id)
})

menu.simpleButton(buttonText(emojis.yes + emojis.close, 'action.close'), 'remove', {
	doFunc: async (ctx: any) => {
		const {shop} = fromCtx(ctx)
		const session = ctx.session as Session
		const persist = ctx.persist as Persist

		const isBuildable = wdShop.allShops().includes(shop.id)
		const reward = moneyForShopClosure(persist.shops.length, shop.products.length, isBuildable)

		persist.shops = persist.shops.filter(o => o.id !== shop.id)
		session.money += reward

		await replyMenu.middleware()(ctx, async () => {/* next does nothing */})
	}
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r('action.close').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.shop-closure'))

export default menu
