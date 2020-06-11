import TelegrafInlineMenu from 'telegraf-inline-menu'
import WikidataEntityReader from 'wikidata-entity-reader'

import {Session, Persist} from '../../../lib/types'

import * as wdAttractions from '../../../lib/wikidata/attractions'

import {buttonText, menuPhoto} from '../../../lib/interface/menu'
import {emojis} from '../../../lib/interface/emojis'
import {formatFloat} from '../../../lib/interface/format-number'
import {infoHeader} from '../../../lib/interface/formatted-strings'
import {mallAttractionPart} from '../../../lib/interface/mall'

import {helpButtonText, createHelpMenu} from '../../help'

import buildMenu from './build'

function menuText(ctx: any): string {
	const {mall} = ctx.persist as Persist
	if (!mall) {
		throw new Error('You are not part of a mall')
	}

	let text = ''
	text += infoHeader(ctx.wd.r('mall.attraction'), {titlePrefix: emojis.attraction})

	const {attraction} = mall
	if (attraction) {
		text += mallAttractionPart(ctx, attraction.item)
	}

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto((ctx: any) => {
		const {mall} = ctx.persist as Persist
		if (!mall || !mall.attraction) {
			return undefined
		}

		return mall.attraction.item
	})
})

function buildAttractionOptions(ctx: any): Record<string, string> {
	const {mall} = ctx.persist as Persist
	if (!mall || mall.attraction) {
		return {}
	}

	const all = wdAttractions.allHeightSortedArray()
	const result: Record<string, string> = {}
	for (const o of all) {
		const r = ctx.wd.r(o.item) as WikidataEntityReader
		result[o.item] = `${r.label()} (${formatFloat(o.height)} ${ctx.wd.r('unit.meter').label()})`
	}

	return result
}

menu.selectSubmenu('build', buildAttractionOptions, buildMenu, {
	columns: 1,
	maxRows: 6,
	setPage: (ctx: any, page) => {
		const session = ctx.session as Session
		session.page = page
	},
	getCurrentPage: (ctx: any) => {
		const session = ctx.session as Session
		return session.page
	},
	prefixFunc: () => emojis.construction
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'mall.attraction'),
	(ctx: any) => ctx.wd.r('mall.attraction').url()
)

function currentAttractionQNumber(ctx: any): string {
	const {mall} = ctx.persist as Persist
	if (!mall || !mall.attraction) {
		return ''
	}

	return mall.attraction.item
}

menu.urlButton(
	buttonText(emojis.wikidataItem, (ctx: any) => currentAttractionQNumber(ctx)),
	(ctx: any) => ctx.wd.r(currentAttractionQNumber(ctx)).url(),
	{
		joinLastRow: true,
		hide: (ctx: any) => {
			const {mall} = ctx.persist as Persist
			return !mall || !mall.attraction
		}
	}
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.attraction'))

export default menu
