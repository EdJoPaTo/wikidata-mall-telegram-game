import {Composer, Extra, Markup} from 'telegraf'
import {markdown as format} from 'telegram-format'

import {Persist} from './lib/types'

import {emojis} from './lib/interface/emojis'

const bot = new Composer()

bot.command('production', async ctx => {
	const persist = (ctx as any).persist as Persist

	if (!persist.mall) {
		return ctx.reply(emojis.requireAttention + emojis.mall, Extra.inReplyTo(ctx.message!.message_id) as any)
	}

	let text = ''
	text += '🤩'

	if (ctx.chat && ctx.from && ctx.chat.id !== persist.mall.chat.id) {
		if (ctx.from.username) {
			text += `@${ctx.from.username}`
		} else {
			text += format.url(ctx.from.first_name, `tg://user?id=${ctx.from.id}`)
		}
	}

	return ctx.telegram.sendMessage(persist.mall.chat.id, text, Extra.markup(Markup.forceReply()) as any)
})

export default bot
