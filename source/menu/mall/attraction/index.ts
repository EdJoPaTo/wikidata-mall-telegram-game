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

function menuBody(ctx: Context): Body {
	const {mall} = ctx.persist
	if (!mall) {
		throw new Error('You are not part of a mall')
	}

	let text = ''
	text += infoHeader(ctx.wd.reader('mall.attraction'), {titlePrefix: emojis.attraction})

	const {attraction} = mall
	if (attraction) {
		text += mallAttractionPart(ctx, attraction.item)

		const reader = ctx.wd.reader(attraction.item)
		return {
			...bodyPhoto(reader),
			text, parse_mode: 'Markdown'
		}
	}

	return {text, parse_mode: 'Markdown'}
}

export const menu = new MenuTemplate<Context>(menuBody)

function buildAttractionOptions(ctx: Context): Record<string, string> {
	const {mall} = ctx.persist
	if (!mall || mall.attraction) {
		return {}
	}

	const all = wdAttractions.allHeightSortedArray()
	const result: Record<string, string> = {}
	for (const o of all) {
		const r = ctx.wd.reader(o.item)
		result[o.item] = `${emojis.construction}${r.label()} (${formatFloat(o.height)} ${ctx.wd.reader('unit.meter').label()})`
	}

	return result
}

menu.chooseIntoSubmenu('build', buildAttractionOptions, buildMenu, {
	columns: 1,
	maxRows: 6,
	setPage: (ctx, page) => {
		ctx.session.page = page
	},
	getCurrentPage: ctx => ctx.session.page
})

menu.url(
	buttonText(emojis.wikidataItem, 'mall.attraction'),
	ctx => ctx.wd.reader('mall.attraction').url()
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
	ctx => ctx.wd.reader(currentAttractionQNumber(ctx)).url(),
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
