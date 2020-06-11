import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Persist} from '../../../../lib/types'
import {Shop} from '../../../../lib/types/shop'
import {Talent, Person} from '../../../../lib/types/people'

import {EMPLOYMENT_PROTECTION_SECONDS} from '../../../../lib/game-math/constants'
import {personalBonusWhenEmployed} from '../../../../lib/game-math/personal'

import {buttonText} from '../../../../lib/interface/menu'
import {emojis} from '../../../../lib/interface/emojis'
import {infoHeader} from '../../../../lib/interface/formatted-strings'
import {percentBonusString} from '../../../../lib/interface/format-percent'
import {personMarkdown} from '../../../../lib/interface/person'

function fromCtx(ctx: any): {shop: Shop; talent: Talent; employee?: Person; applicantId: number; applicant: Person} {
	const shopType = ctx.match[1]
	const talent = ctx.match[2] as Talent
	const applicantId = Number(ctx.match[3])

	const persist = ctx.persist as Persist
	const shop = persist.shops.filter(o => o.id === shopType)[0]
	const employee = shop.personal[talent]
	const applicant = persist.applicants.list[applicantId]

	if (!applicant) {
		throw new Error('These aren\'t the applicants you are looking for')
	}

	return {shop, talent, employee, applicantId, applicant}
}

function menuText(ctx: any): string {
	const {shop, talent, applicant} = fromCtx(ctx)
	const now = Date.now() / 1000
	const bonusWhenEmployed = personalBonusWhenEmployed(shop, talent, applicant)

	let text = ''
	text += infoHeader(ctx.wd.reader(`person.talents.${talent}`), {titlePrefix: emojis[talent]})

	text += personMarkdown(ctx, applicant, shop.id === applicant.hobby, now)
	text += '\n\n'

	if (bonusWhenEmployed < 1) {
		text += emojis.warning
		text += emojis[talent]
		text += percentBonusString(bonusWhenEmployed)
	}

	return text
}

const menu = new TelegrafInlineMenu(menuText)

menu.button(buttonText(emojis.yes + emojis.recruitment, 'action.recruitment'), 'recruit', {
	setParentMenuAfter: true,
	hide: (ctx: any) => {
		const {shop, talent, applicant} = fromCtx(ctx)
		const bonusWhenEmployed = personalBonusWhenEmployed(shop, talent, applicant)
		return bonusWhenEmployed < 1
	},
	doFunc: (ctx: any) => {
		const now = Math.floor(Date.now() / 1000)
		const {applicants} = ctx.persist as Persist
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
	}
})

export default menu
