import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Persist} from '../../../lib/types'

import {attractionCost} from '../../../lib/game-math/mall'

import * as wdAttractions from '../../../lib/wikidata/attractions'

import {createAttraction} from '../../../lib/game-logic/mall-attraction'

import {buttonText, menuPhoto} from '../../../lib/interface/menu'
import {emojis} from '../../../lib/interface/emojis'
import {mallAttractionPart} from '../../../lib/interface/mall'
import {mallMoneyCostPart} from '../../../lib/interface/formatted-strings'

import {helpButtonText, createHelpMenu} from '../../help'

function fromCtx(ctx: any): string {
	return ctx.match[1]
}

function menuText(ctx: any): string {
	const {mall} = ctx.persist as Persist
	if (!mall) {
		throw new Error('You are not part of a mall')
	}

	const attraction = fromCtx(ctx)

	let text = ''
	text += mallAttractionPart(ctx, attraction)
	text += mallMoneyCostPart(ctx, mall.money, attractionCost(wdAttractions.getHeight(attraction)))

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto(ctx => fromCtx(ctx))
})

menu.button(buttonText(emojis.construction, 'action.construction'), 'construct', {
	setParentMenuAfter: true,
	hide: (ctx: any) => {
		const attraction = fromCtx(ctx)
		const {mall} = ctx.persist as Persist
		const cost = attractionCost(wdAttractions.getHeight(attraction))
		return Boolean(!mall || mall.money < cost)
	},
	doFunc: (ctx: any) => {
		const now = Date.now() / 1000
		const {mall} = ctx.persist as Persist
		const attraction = fromCtx(ctx)
		const cost = attractionCost(wdAttractions.getHeight(attraction))
		if (!mall || mall.money < cost) {
			return
		}

		mall.attraction = createAttraction(attraction, now)
		mall.money -= cost
	}
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.reader(fromCtx(ctx)).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.attraction'))

export default menu
