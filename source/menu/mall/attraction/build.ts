import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../../../lib/types'

import {attractionCost} from '../../../lib/game-math/mall'

import * as wdAttractions from '../../../lib/wikidata/attractions'

import {createAttraction} from '../../../lib/game-logic/mall-attraction'

import {buttonText, bodyPhoto, backButtons} from '../../../lib/interface/menu'
import {emojis} from '../../../lib/interface/emojis'
import {mallAttractionPart} from '../../../lib/interface/mall'
import {mallMoneyCostPart} from '../../../lib/interface/formatted-strings'

import {helpButtonText, createHelpMenu} from '../../help'

function fromCtx(ctx: Context): string {
	return ctx.match![1]
}

async function menuBody(ctx: Context): Promise<Body> {
	const {mall} = ctx.persist
	if (!mall) {
		throw new Error('You are not part of a mall')
	}

	const attraction = fromCtx(ctx)
	const reader = await ctx.wd.reader(attraction)

	let text = ''
	text += await mallAttractionPart(ctx, attraction)
	text += await mallMoneyCostPart(ctx, mall.money, attractionCost(wdAttractions.getHeight(attraction)))

	return {
		...bodyPhoto(reader),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

menu.interact(buttonText(emojis.construction, 'action.construction'), 'construct', {
	hide: ctx => {
		const attraction = fromCtx(ctx)
		const {mall} = ctx.persist
		const cost = attractionCost(wdAttractions.getHeight(attraction))
		return Boolean(!mall || mall.money < cost)
	},
	do: ctx => {
		const now = Date.now() / 1000
		const {mall} = ctx.persist
		const attraction = fromCtx(ctx)
		const cost = attractionCost(wdAttractions.getHeight(attraction))
		if (!mall || mall.money < cost) {
			return
		}

		mall.attraction = createAttraction(attraction, now)
		mall.money -= cost
		return '..'
	}
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	async ctx => (await ctx.wd.reader(fromCtx(ctx))).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.attraction'))

menu.manualRow(backButtons)
