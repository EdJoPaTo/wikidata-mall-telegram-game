import {Composer, Extra, Markup, ContextMessageUpdate} from 'telegraf'

import * as userMalls from '../lib/data/malls'

const bot = new Composer()

async function replyJoinMessage(ctx: ContextMessageUpdate): Promise<void> {
	const button = Markup.callbackButton((ctx as any).wd.r('mall.participation').label(), 'join')
	const keyboard = Markup.inlineKeyboard([
		button
	])
	let text = ''
	text += '👋'
	text += '\n\n'
	text += (ctx as any).wd.r('menu.mall').label()

	await ctx.reply(text, Extra.markdown().inReplyTo(ctx.message!.message_id).markup(keyboard))
}

if (process.env.NODE_ENV !== 'production') {
	bot.use((ctx, next) => {
		console.log('happened in chat:', ctx.updateType, (ctx as any).updateSubTypes, ctx.chat)
		return next && next()
	})
}

bot.use(async (ctx, next) => {
	// Update title
	const mallId = ctx.chat!.id
	const mall = await userMalls.get(mallId)
	if (mall && ctx.chat) {
		if (mall.title !== ctx.chat.title) {
			mall.title = ctx.chat.title
			await userMalls.set(mallId, mall)
		}
	}

	return next && next()
})

bot.use(async (ctx, next) => {
	try {
		const members = await ctx.getChatMembersCount()
		if (members > 9) {
			try {
				await ctx.reply('You should start a new group for the mall.')
			} catch (error) {
				console.error('error while messaging big group', error)
			}

			await ctx.leaveChat()
			return
		}
	} catch (error) {
		console.error('error while detecting big group', error)
	}

	return next && next()
})

bot.on('left_chat_member', async ctx => {
	const mallId = ctx.chat!.id
	const left = ctx.message!.left_chat_member!
	const myId = (ctx as any).botInfo.id as number

	console.log(...(ctx as any).updateSubTypes, left)
	if (myId === left.id) {
		userMalls.remove(mallId)
	} else {
		const mallData = await userMalls.get(mallId)
		if (mallData) {
			mallData.member = mallData.member.filter(o => o !== left.id)
			if (mallData.member.length === 0) {
				await userMalls.remove(mallId)
				await ctx.leaveChat()
			} else {
				await userMalls.set(mallId, mallData)
			}
		}
	}
})

bot.on('migrate_to_chat_id', async ctx => {
	const newId = ctx.message!.migrate_to_chat_id!
	const oldId = ctx.chat!.id
	console.log('migrate_to_chat_id', oldId, newId)
})

bot.on('migrate_from_chat_id', async ctx => {
	await ctx.reply('Chat is now a supergroup 😎')
	return replyJoinMessage(ctx)
})

bot.use(Composer.optional(ctx => Boolean(ctx.chat && ctx.chat.type === 'group'), async ctx => {
	return ctx.reply((ctx as any).i18n.t('mall.supergroupMigration'))
}))

bot.use(Composer.optional(ctx => Boolean(ctx.chat && ctx.chat.username), async (ctx, next) => {
	await ctx.reply((ctx as any).i18n.t('mall.groupPrivate'))
	return next && next()
}))

bot.on(['group_chat_created', 'new_chat_members'], async ctx => {
	return replyJoinMessage(ctx)
})

bot.start(async ctx => replyJoinMessage(ctx))

bot.action('join', async ctx => {
	const mallId = ctx.chat!.id

	let mallData = await userMalls.get(mallId)
	if (mallData && mallData.member.includes(ctx.from!.id)) {
		return ctx.answerCbQuery('🥰')
	}

	const existingUserMallId = await userMalls.getMallIdOfUser(ctx.from!.id)
	if (existingUserMallId) {
		return ctx.answerCbQuery((ctx as any).i18n.t('mall.alreadyInDifferentMall'))
	}

	if (!mallData) {
		mallData = {
			member: [],
			money: 0,
			title: ctx.chat!.title
		}
	}

	mallData.member.push(ctx.from!.id)
	await userMalls.set(mallId, mallData)
	return ctx.answerCbQuery('👍')
})

export default bot
