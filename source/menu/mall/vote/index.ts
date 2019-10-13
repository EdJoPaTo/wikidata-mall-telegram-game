import TelegrafInlineMenu from 'telegraf-inline-menu'
import WikidataEntityReader from 'wikidata-entity-reader'

import {sortDictKeysByStringValues, recreateDictWithGivenKeyOrder} from '../../../lib/js-helper/dictionary'

import {Session} from '../../../lib/types'

import * as mallProduction from '../../../lib/data/mall-production'

import {buttonText, menuPhoto} from '../../../lib/interface/menu'
import {emojis} from '../../../lib/interface/emojis'
import {infoHeader, labeledInt} from '../../../lib/interface/formatted-strings'

import {helpButtonText, createHelpMenu} from '../../help'

import optionMenu from './option'

async function menuText(ctx: any): Promise<string> {
	const currentProduction = await mallProduction.get()
	const votes = Object.values(currentProduction.nextItemVote).flat().length

	let text = ''
	text += infoHeader(ctx.wd.r('mall.voting'), {titlePrefix: emojis.production + emojis.vote})

	text += labeledInt(ctx.wd.r('mall.vote'), votes)

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto('mall.voting')
})

async function voteOptions(ctx: any): Promise<Record<string, string>> {
	const {__wikibase_language_code: locale} = ctx.session as Session
	const currentProduction = await mallProduction.get()
	const possible = Object.keys(currentProduction.nextItemVote)

	const result: Record<string, string> = {}
	for (const o of possible) {
		const r = ctx.wd.r(o) as WikidataEntityReader
		result[o] = r.label()
	}

	const order = sortDictKeysByStringValues(result, locale === 'wikidatanish' ? 'en' : locale)
	return recreateDictWithGivenKeyOrder(result, order)
}

menu.selectSubmenu('v', voteOptions, optionMenu, {
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
	prefixFunc: async (ctx: any, key) => {
		const currentProduction = await mallProduction.get()
		const voters = currentProduction.nextItemVote[key]
		const userVoted = voters.includes(ctx.from.id)

		return userVoted ? emojis.yes : emojis.vote
	}
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r('mall.voting').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.mall-production-vote'))

export default menu
