import {Extra, Markup} from 'telegraf'
import {markdown as format} from 'telegram-format'
import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Person} from '../../lib/types/people'
import {Context} from '../../lib/types'

import {mallMemberAmountWithinLimits} from '../../lib/game-math/mall'

import {buttonText, bodyPhoto, backButtons} from '../../lib/interface/menu'
import {emojis} from '../../lib/interface/emojis'
import {personMarkdown, personStateEmoji, wdResourceKeyOfPerson} from '../../lib/interface/person'

import {createHelpMenu, helpButtonText} from '../help'

function fromCtx(ctx: Context): {applicantId: number; applicant: Person; hobbyIsFitting: boolean} {
	const applicantId = Number(ctx.match![1])
	const applicant = ctx.persist.applicants.list[applicantId]
	if (!applicant) {
		throw new Error('The applicant you are looking for is not there.')
	}

	const shopIds = ctx.persist.shops.map(o => o.id)
	const hobbyIsFitting = shopIds.some(o => o === applicant.hobby)
	return {applicantId, applicant, hobbyIsFitting}
}

async function menuBody(ctx: Context): Promise<Body> {
	const {applicant, hobbyIsFitting} = fromCtx(ctx)
	const now = Date.now() / 1000

	let text = ''

	text += await personMarkdown(ctx, applicant, hobbyIsFitting, now)
	text += '\n\n'

	return {
		...bodyPhoto(await ctx.wd.reader(applicant.hobby)),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

menu.interact(buttonText(emojis.mall, 'menu.mall'), 'toMall', {
	joinLastRow: true,
	hide: ctx => {
		const {mall} = ctx.persist
		return !mall || !mallMemberAmountWithinLimits(mall) || mall.applicants.length > 0
	},
	do: async ctx => {
		const now = Date.now() / 1000
		const {applicantId, applicant} = fromCtx(ctx)
		const {applicants, mall} = ctx.persist
		if (!mall) {
			throw new Error('You are not part of a mall')
		}

		let caption = ''
		caption += '😘'
		caption += format.url(format.escape(ctx.from!.first_name), `tg://user?id=${ctx.from!.id}`)
		caption += '\n\n'
		caption += await personMarkdown(ctx, applicant, false, now)

		const photo = await ctx.wd.reader(applicant.hobby).then(r => r.images(800)[0])
		const groupKeyboard = Markup.inlineKeyboard([
			Markup.callbackButton(await buttonText(emojis.seat, 'other.seat')(ctx), 'takeAllApplicants')
		])
		if (photo) {
			await ctx.telegram.sendPhoto(mall.chat.id, photo, new Extra({caption}).markdown().markup(groupKeyboard) as any)
		} else {
			await ctx.telegram.sendMessage(mall.chat.id, caption, Extra.markdown().markup(groupKeyboard))
		}

		mall.applicants.push(applicant)
		applicants.list.splice(applicantId, 1)
		return '..'
	}
})

menu.interact(buttonText(emojis.door, 'other.door'), 'remove', {
	joinLastRow: true,
	do: ctx => {
		const {applicantId} = fromCtx(ctx)
		const {applicants} = ctx.persist
		applicants.list.splice(applicantId, 1)
		return '..'
	}
})

menu.url(
	async ctx => {
		const {applicant} = fromCtx(ctx)
		const typeEmoji = personStateEmoji(applicant)
		const resourceKey = wdResourceKeyOfPerson(applicant)
		return `${emojis.wikidataItem}${typeEmoji}${await ctx.wd.reader(resourceKey).then(r => r.label())}`
	},
	async ctx => {
		const {applicant} = fromCtx(ctx)
		const resourceKey = wdResourceKeyOfPerson(applicant)
		return (await ctx.wd.reader(resourceKey)).url()
	}
)

menu.url(
	async ctx => {
		const {applicant, hobbyIsFitting} = fromCtx(ctx)
		const hobby = hobbyIsFitting ? emojis.hobbyMatch : emojis.hobbyDifferent
		return `${emojis.wikidataItem}${hobby}${await ctx.wd.reader(applicant.hobby).then(r => r.label())}`
	},
	async ctx => (await ctx.wd.reader(fromCtx(ctx).applicant.hobby)).url(),
	{
		joinLastRow: true
	}
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.applicants'))

menu.manualRow(backButtons)
