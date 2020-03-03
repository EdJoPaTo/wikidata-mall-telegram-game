import {markdown as format} from 'telegram-format'
import TelegrafInlineMenu from 'telegraf-inline-menu'
import WikidataEntityReader from 'wikidata-entity-reader'

import {getParts} from '../../../lib/wikidata/production'
import * as mallProduction from '../../../lib/data/mall-production'

import {emojis} from '../../../lib/interface/emojis'
import {infoHeader} from '../../../lib/interface/formatted-strings'
import {menuPhoto, buttonText} from '../../../lib/interface/menu'

import {helpButtonText, createHelpMenu} from '../../help'

function fromCtx(ctx: any): string {
	return ctx.match[1]
}

function menuText(ctx: any): string {
	const qNumber = fromCtx(ctx)
	const reader = ctx.wd.r(qNumber) as WikidataEntityReader

	let text = ''
	text += infoHeader(reader, {titlePrefix: emojis.vote})

	const parts = getParts(qNumber)

	text += parts
		.map(o => ctx.wd.r(o) as WikidataEntityReader)
		.map(o => format.url(format.escape(o.label()), o.url()))
		.join(', ')

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto(fromCtx)
})

menu.button(buttonText(emojis.yes, 'mall.vote'), 'vote', {
	hide: async (ctx: any) => {
		const qNumber = fromCtx(ctx)
		const currentProduction = await mallProduction.get()
		const voters = currentProduction.nextItemVote[qNumber]
		return !voters || voters.includes(ctx.from.id)
	},
	doFunc: async (ctx: any) => {
		const qNumber = fromCtx(ctx)

		const currentProduction = await mallProduction.get()
		for (const o of Object.keys(currentProduction.nextItemVote)) {
			currentProduction.nextItemVote[o] = currentProduction.nextItemVote[o]
				.filter(o => o !== ctx.from.id)
		}

		if (!currentProduction.nextItemVote[qNumber]) {
			throw new Error('You cant vote for something not on the list')
		}

		currentProduction.nextItemVote[qNumber].push(ctx.from.id)
		await mallProduction.set(currentProduction)
	}
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r(fromCtx(ctx)).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.mall-production-vote'))

export default menu
