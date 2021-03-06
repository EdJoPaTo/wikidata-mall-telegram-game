import {Chat} from 'typegram'
import {Composer, Markup} from 'telegraf'
import stringify from 'json-stable-stringify'

import {Mall} from '../lib/types/mall'
import {Context} from '../lib/types'

import * as userMalls from '../lib/data/malls'

import {fixMallDataForGroup} from '../lib/game-logic/mall-fix-data'

import {emojis} from '../lib/interface/emojis'

const bot = new Composer<Context>()

async function replyJoinMessage(ctx: Context): Promise<void> {
	const button = Markup.button.callback((await ctx.wd.reader('mall.participation')).label(), 'join')
	const keyboard = Markup.inlineKeyboard([
		button
	])
	let text = ''
	text += '👋'
	text += '\n\n'
	text += (await ctx.wd.reader('menu.mall')).label()

	await ctx.reply(text, {
		...keyboard,
		parse_mode: 'Markdown',
		reply_to_message_id: ctx.message!.message_id
	})
}

async function checkEveryMemberAndRemoveIfNeeded(ctx: Context, mallData: Mall): Promise<void> {
	const remaining = await Promise.all(
		mallData.member.map(async memberId => {
			try {
				const entry = await ctx.getChatMember(memberId)
				console.log('entry status', memberId, entry.status)
				if (entry.status === 'left' || entry.status === 'kicked') {
					return false
				}

				return entry.user.id
			} catch (error: unknown) {
				console.log('error while testing members', memberId, error instanceof Error ? error.message : error)
				return false
			}
		})
	)
	const remainingIds = remaining
		.filter((o): o is number => typeof o === 'number')
	mallData.member = remainingIds
}

if (process.env['NODE_ENV'] !== 'production') {
	bot.use(async (ctx, next) => {
		console.log('happened in chat:', ctx.updateType, ctx.chat)
		return next()
	})
}

bot.use(Composer.optional(ctx => Boolean(ctx.chat && ctx.chat.type === 'group'), async ctx => {
	if (!ctx.message || 'migrate_to_chat_id' in ctx.message) {
		return
	}

	try {
		await ctx.reply(ctx.i18n.t('mall.supergroupMigration'))
	} catch (error: unknown) {
		console.log('supergroup migration hint error', error instanceof Error ? error.message : error, ctx.updateType, ctx.update)
	}
}))

bot.use(async (ctx, next) => {
	// Update title
	if (ctx.chat && ctx.chat.type === 'supergroup') {
		const {chat} = ctx
		const mallId = chat.id
		const mall = await userMalls.get(mallId)
		if (mall) {
			const stored = stringify(mall.chat)
			const current = stringify(chat)
			if (stored !== current) {
				mall.chat = chat
				await userMalls.set(mallId, mall)
			}
		}
	}

	return next()
})

bot.on('left_chat_member', async ctx => {
	const mallId = ctx.chat.id
	const left = ctx.message.left_chat_member
	const myId = ctx.botInfo.id

	if (myId === left.id) {
		await userMalls.remove(mallId)
	} else {
		const mallData = await userMalls.get(mallId)
		if (mallData) {
			mallData.member = mallData.member.filter(o => o !== left.id)
			await checkEveryMemberAndRemoveIfNeeded(ctx, mallData)
			if (mallData.member.length === 0) {
				await userMalls.remove(mallId)
				await ctx.leaveChat()
			} else {
				await userMalls.set(mallId, mallData)
			}
		}
	}
})

bot.on('migrate_from_chat_id', async ctx => {
	await ctx.reply('Chat is now a supergroup 😎')
	return replyJoinMessage(ctx)
})

bot.use(Composer.optional(ctx => Boolean(ctx.chat && 'username' in ctx.chat), async (ctx, next) => {
	await ctx.reply(ctx.i18n.t('mall.groupPrivate'))
	return next()
}))

bot.on(['group_chat_created', 'new_chat_members'], async ctx => {
	const mallId = ctx.chat.id
	const mallData = await userMalls.get(mallId)
	try {
		const members = await ctx.getChatMembersCount()
		if (members > 9) {
			await ctx.reply('You should start a new group for the mall.')
			if (!mallData) {
				await ctx.leaveChat()
				return
			}
		}
	} catch (error: unknown) {
		console.error('error while detecting big group', ctx.updateType, error)
	}

	return replyJoinMessage(ctx)
})

bot.start(async ctx => replyJoinMessage(ctx))

bot.action('join', async ctx => {
	const mallId = ctx.chat!.id

	let mallData = await userMalls.get(mallId)
	if (mallData?.member.includes(ctx.from!.id)) {
		return ctx.answerCbQuery('🥰')
	}

	if (ctx.persist.mall) {
		return ctx.answerCbQuery(ctx.i18n.t('mall.alreadyInDifferentMall'))
	}

	let text = ''
	text += '👍'
	text += ctx.from!.first_name
	await ctx.reply(text)

	if (!mallData) {
		mallData = {
			applicants: [],
			member: [],
			money: 0,
			production: [],
			chat: ctx.chat as Chat.SupergroupChat
		}
	}

	mallData.member.push(ctx.from!.id)
	await userMalls.set(mallId, mallData)
	return ctx.answerCbQuery('👍')
})

bot.command('fix', async ctx => {
	if (!ctx.from || !ctx.chat || ctx.from.username !== 'EdJoPaTo') {
		return ctx.reply('You should tell @EdJoPaTo something is strange.')
	}

	await fixMallDataForGroup(ctx.telegram, ctx.chat.id)
	return ctx.reply('everything should be in sync now.')
})

bot.command(['language', 'settings'], async ctx => {
	const {username} = ctx.botInfo
	return ctx.reply(`${emojis.chat}@${username}`)
})

export default bot
