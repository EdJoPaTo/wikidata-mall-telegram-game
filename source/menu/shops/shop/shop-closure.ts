import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../../../lib/types'
import {Shop} from '../../../lib/types/shop'

import {moneyForShopClosure} from '../../../lib/game-math/shop-cost'

import * as wdShop from '../../../lib/wikidata/shops'

import {buttonText, backButtons, bodyPhoto} from '../../../lib/interface/menu'
import {emojis} from '../../../lib/interface/emojis'
import {formatFloat, formatInt} from '../../../lib/interface/format-number'
import {infoHeader, labeledFloat} from '../../../lib/interface/formatted-strings'

import {createHelpMenu, helpButtonText} from '../../help'

function fromCtx(ctx: Context): {shop: Shop; indexOfShop: number} {
	const shopType = ctx.match![1]
	const indexOfShop = ctx.persist.shops.map(o => o.id).indexOf(shopType)
	const shop = ctx.persist.shops[indexOfShop]
	return {shop, indexOfShop}
}

async function menuBody(ctx: Context): Promise<Body> {
	const {shop} = fromCtx(ctx)
	const readerClose = await ctx.wd.reader('action.close')
	const readerShop = await ctx.wd.reader(shop.id)

	const shopBuildable = wdShop.allShops().includes(shop.id)
	const closureMoney = moneyForShopClosure(ctx.persist.shops.length, shop.products.length, shopBuildable)

	let text = ''
	text += infoHeader(readerClose, {titlePrefix: emojis.close})

	text += labeledFloat(await ctx.wd.reader('other.money'), ctx.session.money, emojis.currency)
	text += '\n'

	text += emojis.close
	text += '*'
	text += readerShop.label()
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

	const matchingSkillsInQueue = ctx.session.skillQueue.filter(o => o.category === shop.id).length
	if (matchingSkillsInQueue > 0) {
		warnings.push(`${formatInt(matchingSkillsInQueue)}${emojis.skill}`)
	}

	if (warnings.length > 0) {
		text += warnings
			.map(o => `${emojis.warning}${o}`)
			.join('\n')
		text += '\n\n'
	}

	return {
		...bodyPhoto(readerShop),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

menu.interact(buttonText(emojis.yes + emojis.close, 'action.close'), 'remove', {
	do: async ctx => {
		const {shop} = fromCtx(ctx)

		const isBuildable = wdShop.allShops().includes(shop.id)
		const reward = moneyForShopClosure(ctx.persist.shops.length, shop.products.length, isBuildable)

		ctx.persist.shops = ctx.persist.shops.filter(o => o.id !== shop.id)
		ctx.session.money += reward

		return '../..'
	}
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	async ctx => (await ctx.wd.reader('action.close')).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.shop-closure'))

menu.manualRow(backButtons)
