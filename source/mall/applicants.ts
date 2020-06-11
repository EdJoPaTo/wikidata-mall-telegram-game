import {Composer} from 'telegraf'

import {Context} from '../lib/types'

import {applicantSeats} from '../lib/game-math/applicant'

import {emojis} from '../lib/interface/emojis'

const bot = new Composer<Context>()

bot.action('takeAllApplicants', async ctx => {
	const {applicants, mall, skills} = ctx.persist

	if (!mall) {
		await ctx.answerCbQuery(emojis.mall)
		return
	}

	if (mall.applicants.length > 0) {
		const maxSeats = applicantSeats(skills)
		const maxSeatsReached = applicants.list.length > maxSeats
		if (maxSeatsReached) {
			await ctx.answerCbQuery(emojis.requireAttention + emojis.seat)
			return
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
