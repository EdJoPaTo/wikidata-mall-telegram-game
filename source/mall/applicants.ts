import {Composer} from 'telegraf'

import {Persist} from '../lib/types'

import {emojis} from '../lib/interface/emojis'

const bot = new Composer()

bot.action('takeAllApplicants', async (ctx: any) => {
	const {applicants, mall} = ctx.persist as Persist

	if (!mall) {
		return ctx.answerCbQuery(emojis.mall)
	}

	if (mall.applicants.length > 0) {
		applicants.list.push(...mall.applicants)
		mall.applicants = []
		await ctx.answerCbQuery(emojis.yes)
	} else {
		await ctx.answerCbQuery(emojis.noPerson)
	}

	try {
		await ctx.deleteMessage()
	} catch (_) {
		await ctx.editMessageReplyMarkup()
	}
})

export default bot
