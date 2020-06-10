import {Composer} from 'telegraf'

import {Persist} from '../lib/types'

import {applicantSeats} from '../lib/game-math/applicant'

import {emojis} from '../lib/interface/emojis'

const bot = new Composer()

bot.action('takeAllApplicants', async (ctx: any) => {
	const {applicants, mall, skills} = ctx.persist as Persist

	if (!mall) {
		return ctx.answerCbQuery(emojis.mall)
	}

	if (mall.applicants.length > 0) {
		const maxSeats = applicantSeats(skills)
		const maxSeatsReached = applicants.list.length > maxSeats
		if (maxSeatsReached) {
			return ctx.answerCbQuery(emojis.requireAttention + emojis.seat)
		}

		applicants.list.push(...mall.applicants)
		mall.applicants = []
		await ctx.answerCbQuery(emojis.yes)
	} else {
		await ctx.answerCbQuery(emojis.noPerson)
	}

	try {
		await ctx.deleteMessage()
	} catch {
		await ctx.editMessageReplyMarkup()
	}
})

export default bot
