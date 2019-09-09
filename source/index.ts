import {existsSync, readFileSync} from 'fs'

import Telegraf, {Extra, Markup} from 'telegraf'
import TelegrafI18n from 'telegraf-i18n'
import TelegrafWikibase from 'telegraf-wikibase'
import WikidataEntityStore from 'wikidata-entity-store'

import * as wikidata from './lib/wikidata'

import {HOUR_IN_SECONDS} from './lib/math/timestamp-constants'

import * as dataShops from './lib/data/shops'
import * as dataSkills from './lib/data/skills'
import * as userInfo from './lib/data/user-info'
import * as userSessions from './lib/data/user-sessions'

import {removeOld} from './lib/game-logic/remove-old'

import * as notifications from './lib/session-math/notification'
import sessionMathMiddleware from './lib/session-math'

import {emojis} from './lib/interface/emojis'
import {notificationText} from './lib/interface/notification'

import {NotificationManager} from './lib/notification/manager'

import menu from './menu'

const tokenFilePath = existsSync('/run/secrets') ? '/run/secrets/bot-token.txt' : 'bot-token.txt'
const token = readFileSync(tokenFilePath, 'utf8').trim()
const bot = new Telegraf(token)

if (process.env.NODE_ENV !== 'production') {
	bot.use(async (ctx, next) => {
		const updateId = ctx.update.update_id.toString(36)
		const content = (ctx.callbackQuery && ctx.callbackQuery.data) || (ctx.message && ctx.message.text)
		const identifier = `${updateId} ${ctx.updateType} ${(ctx as any).updateSubTypes} ${ctx.from!.first_name} ${content && content.length} ${content}`

		console.time(identifier)
		if (next) {
			await next()
		}

		console.timeEnd(identifier)
	})
}

bot.use(async (ctx, next) => {
	try {
		if (next) {
			await next()
		}
	} catch (error) {
		if (error.message.includes('Too Many Requests')) {
			console.warn('Telegraf Too Many Requests error. Skip.', error)
			return
		}

		if (
			error.message.includes('cancelled by new editMessageMedia request') ||
			error.message.includes('message to edit not found') ||
			error.message.includes('query is too old')
		) {
			console.warn('ERROR', ctx.from!.id, ctx.callbackQuery && ctx.callbackQuery.data, error.message)
			return
		}

		if (error.message.includes('400: Bad Request: ') && (
				error.message.includes('MEDIA_EMPTY') ||
				error.message.includes('WEBPAGE_CURL_FAILED') ||
				error.message.includes('wrong file identifier/HTTP URL specified')
		)) {
			const payload = error && error.on && error.on.payload
			const url = !payload || payload.photo || (payload.media && payload.media.media) || payload
			console.warn('some url fail', ctx.from!.id, ctx.callbackQuery && ctx.callbackQuery.data, error.message, url)
		} else {
			console.error('try to send error to user', ctx.update, error, error && error.on && error.on.payload)
		}

		let text = '🔥 Something went wrong here!'
		text += '\n'
		text += 'You should join the Chat Group and report this error. Let us make this bot even better together. ☺️'

		text += '\n\n'
		text += 'Error: `'
		text += error.message
			.replace(token, '')
		text += '`'

		const target = (ctx.chat || ctx.from!).id
		const keyboard = Markup.inlineKeyboard([
			Markup.urlButton(emojis.chat + 'Join Chat', 'https://t.me/WikidataMallChat')
		], {columns: 1})
		await bot.telegram.sendMessage(target, text, Extra.markdown().markup(keyboard))
	}
})

removeOld()

bot.use(userInfo.middleware())
bot.use(userSessions.middleware())
bot.use(dataShops.middleware())
bot.use(dataSkills.middleware())
bot.use(sessionMathMiddleware())

const i18n = new TelegrafI18n({
	directory: 'locales',
	defaultLanguage: 'en',
	defaultLanguageOnMissing: true,
	useSession: true
})

bot.use(i18n.middleware())

const wdEntityStore = new WikidataEntityStore({
	properties: ['labels', 'descriptions', 'claims']
})

const notificationManager = new NotificationManager(
	async (chatId, notification, fireDate) => {
		try {
			const text = notificationText(notification, fireDate)
			await bot.telegram.sendMessage(chatId, text, Extra.markdown() as any)
		} catch (error) {
			const {message} = error as Error
			if (message.includes('chat not found')) {
				console.error('notification failed to send', chatId, message)
			} else {
				console.error('notification failed to send', chatId, error)
			}
		}
	}
)

bot.use(new TelegrafWikibase(wdEntityStore, {
	contextKey: 'wd'
}).middleware())

bot.use(menu.init({
	backButtonText: (ctx: any) => `🔙 ${ctx.i18n.t('menu.back')}`,
	mainMenuButtonText: (ctx: any) => `🔝 ${ctx.wd.r('menu.menu').label()}`
}))

bot.catch((error: any) => {
	console.error('telegraf error occured', error)
})

wikidata.preload(wdEntityStore)
	.then(async () => {
		await notifications.initialize(notificationManager, wdEntityStore)
		bot.launch()
		console.log(new Date(), 'Bot started')

		setInterval(async () => wikidata.update(wdEntityStore), 12 * HOUR_IN_SECONDS * 1000)
	})
	.catch(error => {
		console.error('startup failed:', error)
	})
