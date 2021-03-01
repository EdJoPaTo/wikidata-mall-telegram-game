import {Chat, ChatMember} from 'typegram'
import {Telegram} from 'telegraf'

import {sequentialAsync} from '../js-helper/async'

import * as userMalls from '../data/malls'

export async function fixMallDataForAllMalls(telegram: Telegram): Promise<void> {
	const allMalls = await userMalls.getAll()
	const allMallIds = Object.keys(allMalls).map(o => Number(o))
	await sequentialAsync(async o => fixMallDataForGroup(telegram, o), allMallIds)
}

export async function fixMallDataForGroup(telegram: Telegram, chatId: number): Promise<void> {
	console.log('checkGroup', chatId)
	const mallData = await userMalls.get(chatId)
	if (!mallData) {
		console.log('checkGroup', chatId, 'there is no mall for this chat, leave')
		return tryLeave(telegram, chatId)
	}

	console.log('checkGroup', chatId, 'get chat info…')
	const chat = await tryGetChat(telegram, chatId)
	console.log('checkGroup', chatId, 'chat', chat)

	if (!chat) {
		console.log('checkGroup', chatId, 'there is no chat for this mall data, remove')
		return userMalls.remove(chatId)
	}

	console.log('checkGroup', chatId, 'check each member…', mallData.member.length, mallData.member)
	const members = await Promise.all(
		mallData.member.map(async o => tryGetChatMember(telegram, chatId, o))
	)

	console.log('checkGroup', chatId, 'members', members)

	const membersStillInGroup = members
		.filter(o => o && o.status !== 'left' && o.status !== 'kicked') as ChatMember[]

	mallData.member = membersStillInGroup
		.map(o => o.user.id)

	console.log('checkGroup', chatId, 'remaining members', mallData.member.length, mallData.member)

	if (mallData.member.length === 0) {
		console.log('checkGroup', chatId, 'group has no member anymore, leave')
		await tryLeave(telegram, chatId)

		await userMalls.remove(chatId)
	} else {
		await userMalls.set(chatId, mallData)
	}
}

async function tryLeave(telegram: Telegram, chatId: number): Promise<void> {
	try {
		await telegram.leaveChat(chatId)
	} catch (error: unknown) {
		console.log('leaving chat error', chatId, error instanceof Error ? error.message : error)
	}
}

async function tryGetChat(telegram: Telegram, chatId: number): Promise<Chat.SupergroupChat | undefined> {
	try {
		const result = await telegram.getChat(chatId)
		if (result.type !== 'supergroup') {
			throw new Error('unexpected chat found. Chat is not a supergroup. Chat is a ' + result.type)
		}

		return result as Chat.SupergroupChat
	} catch (error: unknown) {
		console.log('get chat error', chatId, error instanceof Error ? error.message : error)
		return undefined
	}
}

async function tryGetChatMember(telegram: Telegram, chatId: number, userId: number): Promise<ChatMember | undefined> {
	try {
		const result = await telegram.getChatMember(chatId, userId)
		return result
	} catch (error: unknown) {
		console.log('get chat member error', chatId, userId, error instanceof Error ? error.message : error)
		return undefined
	}
}
