import {Extra, Markup} from 'telegraf'
import {markdown as format} from 'telegram-format'
import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Person} from '../../lib/types/people'
import {Persist} from '../../lib/types'

import {mallMemberAmountWithinLimits} from '../../lib/game-math/mall'

import {buttonText, menuPhoto} from '../../lib/interface/menu'
import {emojis} from '../../lib/interface/emojis'
import {personMarkdown, personStateEmoji, wdResourceKeyOfPerson} from '../../lib/interface/person'

import {createHelpMenu, helpButtonText} from '../help'

function fromCtx(ctx: any): {applicantId: number; applicant: Person; hobbyIsFitting: boolean} {
	const applicantId = Number(ctx.match[1])
	const persist = ctx.persist as Persist
	const applicant: Person = persist.applicants.list[applicantId]
	if (!applicant) {
		throw new Error('The applicant you are looking for is not there.')
	}

	const shopIds = persist.shops.map(o => o.id)
	const hobbyIsFitting = shopIds.some(o => o === applicant.hobby)
	return {applicantId, applicant, hobbyIsFitting}
}

function menuText(ctx: any): string {
	const {applicant, hobbyIsFitting} = fromCtx(ctx)
	const now = Date.now() / 1000

	let text = ''

	text += personMarkdown(ctx, applicant, hobbyIsFitting, now)
	text += '\n\n'

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto(ctx => fromCtx(ctx).applicant.hobby)
})

menu.button(buttonText(emojis.mall, 'menu.mall'), 'toMall', {
	joinLastRow: true,
	setParentMenuAfter: true,
	hide: (ctx: any) => {
		const {mall} = ctx.persist as Persist
		return !mall || !mallMemberAmountWithinLimits(mall) || mall.applicants.length > 0
	},
	doFunc: async (ctx: any) => {
		const now = Date.now() / 1000
		const {applicantId, applicant} = fromCtx(ctx)
		const {applicants, mall} = ctx.persist as Persist
		if (!mall) {
			throw new Error('You are not part of a mall')
		}

		if (mall.applicants.length > 0) {
			throw new Error('Mall seats are full')
		}

		let caption = ''
		caption += '😘'
		caption += format.url(ctx.from!.first_name, `tg://user?id=${ctx.from.id}`)
		caption += '\n\n'
		caption += personMarkdown(ctx, applicant, false, now)

		const photo = ctx.wd.r(applicant.hobby).images(800)[0]
		const groupKeyboard = Markup.inlineKeyboard([
			Markup.callbackButton(await buttonText(emojis.seat, 'other.seat')(ctx), 'takeAllApplicants')
		])
		if (photo) {
			await ctx.telegram.sendPhoto(mall.chat.id, photo, new Extra({caption}).markdown().markup(groupKeyboard))
		} else {
			await ctx.telegram.sendMessage(mall.chat.id, caption, Extra.markdown().markup(groupKeyboard))
		}

		mall.applicants.push(applicant)
		applicants.list.splice(applicantId, 1)
	}
})

menu.button(buttonText(emojis.door, 'other.door'), 'remove', {
	joinLastRow: true,
	setParentMenuAfter: true,
	doFunc: (ctx: any) => {
		const {applicantId} = fromCtx(ctx)
		const {applicants} = ctx.persist as Persist
		applicants.list.splice(applicantId, 1)
	}
})

menu.urlButton(
	(ctx: any) => {
		const {applicant} = fromCtx(ctx)
		const typeEmoji = personStateEmoji(applicant)
		const resourceKey = wdResourceKeyOfPerson(applicant)
		return `${emojis.wikidataItem}${typeEmoji}${ctx.wd.r(resourceKey).label()}`
	},
	(ctx: any) => {
		const {applicant} = fromCtx(ctx)
		const resourceKey = wdResourceKeyOfPerson(applicant)
		return ctx.wd.r(resourceKey).url()
	}
)

menu.urlButton(
	(ctx: any) => {
		const {applicant, hobbyIsFitting} = fromCtx(ctx)
		const hobby = hobbyIsFitting ? emojis.hobbyMatch : emojis.hobbyDifferent
		return `${emojis.wikidataItem}${hobby}${ctx.wd.r(applicant.hobby).label()}`
	},
	(ctx: any) => ctx.wd.r(fromCtx(ctx).applicant.hobby).url(),
	{
		joinLastRow: true
	}
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.applicants'))

export default menu
