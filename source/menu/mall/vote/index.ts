import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {sortDictKeysByStringValues, recreateDictWithGivenKeyOrder} from '../../../lib/js-helper/dictionary'

import {Context} from '../../../lib/types'

import * as mallProduction from '../../../lib/data/mall-production'

import {buttonText, bodyPhoto, backButtons} from '../../../lib/interface/menu'
import {emojis} from '../../../lib/interface/emojis'
import {humanReadableTimestamp} from '../../../lib/interface/formatted-time'
import {infoHeader, labeledInt, labeledValue} from '../../../lib/interface/formatted-strings'

import {helpButtonText, createHelpMenu} from '../../help'

import {menu as optionMenu} from './option'

async function menuBody(ctx: Context): Promise<Body> {
	const {timeZone, __wikibase_language_code: locale} = ctx.session
	const currentProduction = await mallProduction.get()
	const votes = Object.values(currentProduction.nextItemVote).flat().length

	let text = ''
	const reader = await ctx.wd.reader('mall.voting')
	text += infoHeader(reader, {titlePrefix: emojis.production + emojis.vote})

	text += emojis.countdown
	text += labeledValue(await ctx.wd.reader('other.end'), humanReadableTimestamp(currentProduction.competitionUntil, locale, timeZone))
	text += '\n'

	text += labeledInt(await ctx.wd.reader('mall.vote'), votes)

	return {
		...bodyPhoto(reader),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

async function voteOptions(ctx: Context): Promise<Record<string, string>> {
	const {__wikibase_language_code: locale} = ctx.session
	const currentProduction = await mallProduction.get()
	const possible = Object.keys(currentProduction.nextItemVote)
	await ctx.wd.preload(possible)
	const readers = await Promise.all(possible.map(async o => ctx.wd.reader(o)))

	const result: Record<string, string> = {}
	for (const r of readers) {
		result[r.qNumber()] = r.label()
	}

	const order = sortDictKeysByStringValues(result, locale === 'wikidatan' ? 'en' : locale)

	for (const o of possible) {
		const voters = currentProduction.nextItemVote[o]
		const userVoted = voters.includes(ctx.from!.id)
		const prefix = userVoted ? emojis.yes : emojis.vote
		result[o] = prefix + ' ' + result[o]
	}

	return recreateDictWithGivenKeyOrder(result, order)
}

menu.chooseIntoSubmenu('v', voteOptions, optionMenu, {
	columns: 1,
	maxRows: 6,
	setPage: (ctx, page) => {
		ctx.session.page = page
	},
	getCurrentPage: ctx => ctx.session.page
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	async ctx => (await ctx.wd.reader('mall.voting')).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.mall-production-vote'))

menu.manualRow(backButtons)
