import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../../../../lib/types'
import {Shop} from '../../../../lib/types/shop'
import {Talent, Person} from '../../../../lib/types/people'

import {EMPLOYMENT_PROTECTION_SECONDS} from '../../../../lib/game-math/constants'
import {personalBonusWhenEmployed} from '../../../../lib/game-math/personal'

import {buttonText, backButtons} from '../../../../lib/interface/menu'
import {emojis} from '../../../../lib/interface/emojis'
import {infoHeader} from '../../../../lib/interface/formatted-strings'
import {percentBonusString} from '../../../../lib/interface/format-percent'
import {personMarkdown} from '../../../../lib/interface/person'

function fromCtx(ctx: Context): {shop: Shop; talent: Talent; employee?: Person; applicantId: number; applicant: Person} {
	const shopType = ctx.match![1]
	const talent = ctx.match![2] as Talent
	const applicantId = Number(ctx.match![3])

	const shop = ctx.persist.shops.find(o => o.id === shopType)!
	const employee = shop.personal[talent]
	const applicant = ctx.persist.applicants.list[applicantId]

	if (!applicant) {
		throw new Error('These aren\'t the applicants you are looking for')
	}

	return {shop, talent, employee, applicantId, applicant}
}

async function menuBody(ctx: Context): Promise<Body> {
	const {shop, talent, applicant} = fromCtx(ctx)
	const now = Date.now() / 1000
	const bonusWhenEmployed = personalBonusWhenEmployed(shop, talent, applicant)

	let text = ''
	text += infoHeader(await ctx.wd.reader(`person.talents.${talent}`), {titlePrefix: emojis[talent]})

	text += await personMarkdown(ctx, applicant, shop.id === applicant.hobby, now)
	text += '\n\n'

	if (bonusWhenEmployed < 1) {
		text += emojis.warning
		text += emojis[talent]
		text += percentBonusString(bonusWhenEmployed)
	}

	return {text, parse_mode: 'Markdown'}
}

export const menu = new MenuTemplate<Context>(menuBody)

menu.interact(buttonText(emojis.yes + emojis.recruitment, 'action.recruitment'), 'recruit', {
	hide: ctx => {
		const {shop, talent, applicant} = fromCtx(ctx)
		const bonusWhenEmployed = personalBonusWhenEmployed(shop, talent, applicant)
		return bonusWhenEmployed < 1
	},
	do: ctx => {
		const now = Math.floor(Date.now() / 1000)
		const {applicants} = ctx.persist
		const {shop, talent, employee, applicantId, applicant} = fromCtx(ctx)

		if (employee) {
			applicants.list.push(employee)
		}

		if (applicant.type !== 'robot') {
			applicant.seatProtectionUntil = now + EMPLOYMENT_PROTECTION_SECONDS
		}

		shop.personal[talent] = applicant
		applicants.list.splice(applicantId, 1)
		applicants.timestamp = now
		return '..'
	}
})

menu.manualRow(backButtons)
