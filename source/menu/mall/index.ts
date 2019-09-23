import {markdown as format} from 'telegram-format'
import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Session, Persist} from '../../lib/types'

import * as userInfo from '../../lib/data/user-info'

import {mallMemberAmountWithinLimits} from '../../lib/game-math/mall'

import {applicantButtonEmoji} from '../../lib/interface/applicants'
import {buttonText, menuPhoto} from '../../lib/interface/menu'
import {emojis} from '../../lib/interface/emojis'
import {formatFloat} from '../../lib/interface/format-number'
import {infoHeader, labeledFloat} from '../../lib/interface/formatted-strings'
import {mallMoji, hintIncorrectPeopleAmount} from '../../lib/interface/mall'

import {helpButtonText, createHelpMenu} from '../help'

import applicantsMenu from './applicants'
import productionMenu from './production'

const DONATION_AMOUNT = 10

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

	text += labeledFloat(ctx.wd.r('other.money'), mall.money, emojis.currency)
	text += '\n\n'

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

function mallProductionButtonEmoji(ctx: any): string {
	const mall = (ctx.persist as Persist).mall!
	const currentlyProducing = Boolean(mall.productionFinishes)
	const userHasSelectedAPart = mall.partsProducedBy && Object.values(mall.partsProducedBy).includes(ctx.from.id)
	if (currentlyProducing || userHasSelectedAPart) {
		return emojis.production
	}

	return emojis.requireAttention + emojis.production
}

menu.submenu(buttonText(mallProductionButtonEmoji, 'mall.production'), 'production', productionMenu, {
	hide: hideWhenMemberAmountNotCorrect
})

menu.button(buttonText(emojis.currency, 'mall.donation'), 'donate', {
	hide: async (ctx: any) => {
		const {mall} = ctx.persist as Persist
		if (!mall || !mallMemberAmountWithinLimits(mall)) {
			return true
		}

		const session = ctx.session as Session
		if (session.money < DONATION_AMOUNT * 2) {
			return true
		}

		return mall.money >= DONATION_AMOUNT * 10
	},
	doFunc: async (ctx: any) => {
		const session = ctx.session as Session
		if (session.money < DONATION_AMOUNT * 2) {
			return
		}

		const {mall} = ctx.persist as Persist
		if (!mall) {
			throw new Error('user not part of a mall')
		}

		mall.money += DONATION_AMOUNT
		session.money -= DONATION_AMOUNT

		let text = ''
		text += emojis.person
		text += ' → '
		text += formatFloat(DONATION_AMOUNT) + emojis.currency
		text += ' → '
		text += emojis.mall
		return ctx.answerCbQuery(text)
	}
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r('menu.mall').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.mall'))

export default menu
