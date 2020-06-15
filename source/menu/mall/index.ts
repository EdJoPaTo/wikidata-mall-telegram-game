import {markdown as format} from 'telegram-format'
import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../../lib/types'

import {mallMemberAmountWithinLimits} from '../../lib/game-math/mall'

import * as mallProduction from '../../lib/data/mall-production'
import * as userInfo from '../../lib/data/user-info'

import {applicantButtonEmoji} from '../../lib/interface/applicants'
import {buttonText, bodyPhoto, backButtons} from '../../lib/interface/menu'
import {emojis} from '../../lib/interface/emojis'
import {infoHeader, labeledFloat} from '../../lib/interface/formatted-strings'
import {mallMoji, hintIncorrectPeopleAmount} from '../../lib/interface/mall'

import {helpButtonText, createHelpMenu} from '../help'

import {menu as applicantsMenu} from './applicants'
import {menu as attractionMenu} from './attraction'
import {menu as productionMenu} from './production'
import {menu as voteMenu} from './vote'

async function menuBody(ctx: Context): Promise<Body> {
	const {__wikibase_language_code: locale} = ctx.session
	const {mall} = ctx.persist
	if (!mall) {
		throw new Error('You are not part of a mall')
	}

	const memberInfos = (await Promise.all(
		mall.member.map(async o => userInfo.get(o))
	))

	let text = ''
	const reader = await ctx.wd.reader('menu.mall')
	text += infoHeader(reader, {titlePrefix: emojis.mall + mallMoji(mall)})

	text += labeledFloat(await ctx.wd.reader('other.money'), mall.money, emojis.currencyMall)
	text += '\n'

	text += format.bold(format.escape(
		(await ctx.wd.reader('mall.participation')).label()
	))
	text += ' '
	text += '('
	text += mall.member.length
	text += ')'
	text += '\n'
	text += memberInfos
		.map(o => o ? o.first_name : '??')
		.map(o => format.escape(o))
		.sort((a, b) => a.localeCompare(b, locale === 'wikidatan' ? 'en' : locale))
		.map(o => `  ${o}`)
		.join('\n')
	text += '\n\n'

	text += await hintIncorrectPeopleAmount(ctx, mall)

	return {
		...bodyPhoto(reader),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

function hideWhenMemberAmountNotCorrect(ctx: Context): boolean {
	const {mall} = ctx.persist
	return Boolean(!mall || !mallMemberAmountWithinLimits(mall))
}

function mallProductionRequiresAttention(ctx: Context): boolean {
	const now = Date.now() / 1000
	const mall = ctx.persist.mall!
	const currentlyProducing = mall.production.some(o => o.user === ctx.from!.id && o.finishTimestamp > now)
	return !currentlyProducing
}

menu.submenu(buttonText(emojis.production, 'mall.production', {requireAttention: mallProductionRequiresAttention}), 'production', productionMenu, {
	hide: async ctx => {
		if (hideWhenMemberAmountNotCorrect(ctx)) {
			return true
		}

		const production = await mallProduction.get()
		return !production.itemToProduce
	}
})

async function mallVoteRequiresAttention(ctx: Context): Promise<boolean> {
	const currentProduction = await mallProduction.get()
	const playersVoted = Object.values(currentProduction.nextItemVote).flat()
	return !playersVoted.includes(ctx.from!.id)
}

menu.submenu(buttonText(emojis.production + emojis.vote, 'mall.voting', {requireAttention: mallVoteRequiresAttention}), 'vote', voteMenu, {
	joinLastRow: true,
	hide: hideWhenMemberAmountNotCorrect
})

function attractionLabelResourceKey(ctx: Context): string {
	return ctx.persist.mall?.attraction?.item ?? 'mall.attraction'
}

menu.submenu(buttonText(emojis.attraction, attractionLabelResourceKey), 'attraction', attractionMenu, {
	hide: hideWhenMemberAmountNotCorrect
})

function applicantEmoji(ctx: Context): string {
	return applicantButtonEmoji(ctx.persist.mall!.applicants)
}

menu.submenu(buttonText(applicantEmoji, 'menu.applicant'), 'applicants', applicantsMenu, {
	hide: hideWhenMemberAmountNotCorrect
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	async ctx => (await ctx.wd.reader('menu.mall')).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.mall'))

menu.manualRow(backButtons)
