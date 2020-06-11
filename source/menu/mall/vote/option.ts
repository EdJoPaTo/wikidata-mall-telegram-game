import {markdown as format} from 'telegram-format'
import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {getParts} from '../../../lib/wikidata/production'
import * as mallProduction from '../../../lib/data/mall-production'

import {Context} from '../../../lib/types'

import {emojis} from '../../../lib/interface/emojis'
import {infoHeader} from '../../../lib/interface/formatted-strings'
import {buttonText, bodyPhoto, backButtons} from '../../../lib/interface/menu'

import {helpButtonText, createHelpMenu} from '../../help'

function fromCtx(ctx: Context): string {
	return ctx.match![1]
}

function menuBody(ctx: Context): Body {
	const qNumber = fromCtx(ctx)
	const reader = ctx.wd.reader(qNumber)

	let text = ''
	text += infoHeader(reader, {titlePrefix: emojis.vote})

	const parts = getParts(qNumber)

	text += parts
		.map(o => ctx.wd.reader(o))
		.map(o => format.url(format.escape(o.label()), o.url()))
		.join(', ')

	return {
		...bodyPhoto(reader),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

menu.interact(buttonText(emojis.yes, 'mall.vote'), 'vote', {
	hide: async ctx => {
		const qNumber = fromCtx(ctx)
		const currentProduction = await mallProduction.get()
		const voters = currentProduction.nextItemVote[qNumber]
		return !voters || voters.includes(ctx.from!.id)
	},
	do: async ctx => {
		const qNumber = fromCtx(ctx)

		const currentProduction = await mallProduction.get()
		for (const o of Object.keys(currentProduction.nextItemVote)) {
			currentProduction.nextItemVote[o] = currentProduction.nextItemVote[o]
				.filter(o => o !== ctx.from!.id)
		}

		if (!currentProduction.nextItemVote[qNumber]) {
			throw new Error('You cant vote for something not on the list')
		}

		currentProduction.nextItemVote[qNumber].push(ctx.from!.id)
		await mallProduction.set(currentProduction)
		return '.'
	}
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	ctx => ctx.wd.reader(fromCtx(ctx)).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.mall-production-vote'))

menu.manualRow(backButtons)
