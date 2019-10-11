import {markdown as format} from 'telegram-format'
import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Session, Persist} from '../../lib/types'

import * as userInfo from '../../lib/data/user-info'

import {mallMemberAmountWithinLimits} from '../../lib/game-math/mall'

import {applicantButtonEmoji} from '../../lib/interface/applicants'
import {buttonText, menuPhoto} from '../../lib/interface/menu'
import {emojis} from '../../lib/interface/emojis'
import {infoHeader, labeledFloat} from '../../lib/interface/formatted-strings'
import {mallMoji, hintIncorrectPeopleAmount} from '../../lib/interface/mall'

import {helpButtonText, createHelpMenu} from '../help'

import applicantsMenu from './applicants'
import attractionMenu from './attraction'
import productionMenu from './production'

async function menuText(ctx: any): Promise<string> {
	const {__wikibase_language_code: locale} = ctx.session as Session
	const {mall} = ctx.persist as Persist
	if (!mall) {
		throw new Error('You are not part of a mall')
	}

	const memberInfos = (await Promise.all(
		mall.member.map(async o => userInfo.get(o))
	))

	let text = ''
	text += infoHeader(ctx.wd.r('menu.mall'), {titlePrefix: emojis.mall + mallMoji(mall)})
	text += '\n\n'

	text += labeledFloat(ctx.wd.r('other.money'), mall.money, emojis.currencyMall)
	text += '\n'

	text += format.bold(
		ctx.wd.r('mall.participation').label()
	)
	text += ' '
	text += '('
	text += mall.member.length
	text += ')'
	text += '\n'
	text += memberInfos
		.map(o => o ? o.first_name : '??')
		.map(o => format.escape(o))
		.sort((a, b) => a.localeCompare(b, locale === 'wikidatanish' ? 'en' : locale))
		.map(o => `  ${o}`)
		.join('\n')
	text += '\n\n'

	text += hintIncorrectPeopleAmount(ctx, mall)

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto('menu.mall')
})

function hideWhenMemberAmountNotCorrect(ctx: any): boolean {
	const {mall} = ctx.persist as Persist
	return Boolean(!mall || !mallMemberAmountWithinLimits(mall))
}

function mallProductionRequiresAttention(ctx: any): boolean {
	const now = Date.now() / 1000
	const mall = (ctx.persist as Persist).mall!
	const currentlyProducing = mall.production.some(o => o.user === ctx.from.id && o.finishTimestamp > now)
	return !currentlyProducing
}

menu.submenu(buttonText(emojis.production, 'mall.production', {requireAttention: mallProductionRequiresAttention}), 'production', productionMenu, {
	hide: hideWhenMemberAmountNotCorrect
})

function attractionLabelResourceKey(ctx: any): string {
	const {mall} = ctx.persist as Persist
	return mall && mall.attraction ? mall.attraction.item : 'mall.attraction'
}

menu.submenu(buttonText(emojis.attraction, attractionLabelResourceKey), 'attraction', attractionMenu, {
	hide: hideWhenMemberAmountNotCorrect
})

function applicantEmoji(ctx: any): string {
	const now = Date.now() / 1000
	const {mall} = ctx.persist as Persist
	if (!mall) {
		throw new Error('user not part of a mall')
	}

	return applicantButtonEmoji(mall.applicants, now)
}

menu.submenu(buttonText(applicantEmoji, 'menu.applicant'), 'applicants', applicantsMenu, {
	hide: hideWhenMemberAmountNotCorrect
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r('menu.mall').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.mall'))

export default menu
