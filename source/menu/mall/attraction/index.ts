import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../../../lib/types'

import * as wdAttractions from '../../../lib/wikidata/attractions'

import {buttonText, bodyPhoto, backButtons} from '../../../lib/interface/menu'
import {emojis} from '../../../lib/interface/emojis'
import {formatFloat} from '../../../lib/interface/format-number'
import {infoHeader} from '../../../lib/interface/formatted-strings'
import {mallAttractionPart} from '../../../lib/interface/mall'

import {helpButtonText, createHelpMenu} from '../../help'

import {menu as buildMenu} from './build'

async function menuBody(ctx: Context): Promise<Body> {
	const {mall} = ctx.persist
	if (!mall) {
		throw new Error('You are not part of a mall')
	}

	let text = ''
	text += infoHeader(await ctx.wd.reader('mall.attraction'), {titlePrefix: emojis.attraction})

	const {attraction} = mall
	if (attraction) {
		text += await mallAttractionPart(ctx, attraction.item)

		const reader = await ctx.wd.reader(attraction.item)
		return {
			...bodyPhoto(reader),
			text, parse_mode: 'Markdown'
		}
	}

	return {text, parse_mode: 'Markdown'}
}

export const menu = new MenuTemplate<Context>(menuBody)

async function buildAttractionOptions(ctx: Context): Promise<string[]> {
	const {mall} = ctx.persist
	if (!mall || mall.attraction) {
		return []
	}

	const all = wdAttractions.allHeightSortedArray()
	const itemIds = all.map(o => o.item)

	await ctx.wd.preload(itemIds)
	return itemIds
}

menu.chooseIntoSubmenu('build', buildAttractionOptions, buildMenu, {
	columns: 1,
	maxRows: 6,
	setPage: (ctx, page) => {
		ctx.session.page = page
	},
	getCurrentPage: ctx => ctx.session.page,
	buttonText: async (ctx, key) => {
		const height = wdAttractions.getHeight(key)
		const reader = await ctx.wd.reader(key)
		const readerMeter = await ctx.wd.reader('unit.meter')
		return `${emojis.construction} ${reader.label()} (${formatFloat(height)} ${readerMeter.label()})`
	}
})

menu.url(
	buttonText(emojis.wikidataItem, 'mall.attraction'),
	async ctx => (await ctx.wd.reader('mall.attraction')).url()
)

function currentAttractionQNumber(ctx: Context): string {
	const {mall} = ctx.persist
	if (!mall || !mall.attraction) {
		return ''
	}

	return mall.attraction.item
}

menu.url(
	buttonText(emojis.wikidataItem, ctx => currentAttractionQNumber(ctx)),
	async ctx => (await ctx.wd.reader(currentAttractionQNumber(ctx))).url(),
	{
		joinLastRow: true,
		hide: ctx => {
			const {mall} = ctx.persist
			return !mall || !mall.attraction
		}
	}
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.attraction'))

menu.manualRow(backButtons)
