import {existsSync, readFileSync} from 'fs'

import {KeyValueInMemoryFiles} from '@edjopato/datastore'
import Telegraf, {Extra, Markup} from 'telegraf'
import TelegrafI18n from 'telegraf-i18n'
import TelegrafWikibase from 'telegraf-wikibase'
import WikidataEntityStore, {EntityEntry} from 'wikidata-entity-store'

import * as wikidata from './lib/wikidata'

import {HOUR_IN_SECONDS, MINUTE_IN_SECONDS} from './lib/math/timestamp-constants'

import data from './lib/data'

import {removeOld} from './lib/game-logic/remove-old'

import * as notifications from './lib/session-math/notification'
import sessionMathMiddleware from './lib/session-math'

import {emojis} from './lib/interface/emojis'
import {notificationText} from './lib/interface/notification'

import {ErrorMiddleware} from './lib/error-middleware'
import {NotificationManager} from './lib/notification/manager'

import fallback from './fallback'
import mall from './mall'
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

bot.use(new ErrorMiddleware({
	text: 'You should join the Chat Group and report this error. Let us make this bot even better together. ☺️',
	inlineKeyboardMarkup: Markup.inlineKeyboard([
		Markup.urlButton(emojis.chat + 'Join Chat', 'https://t.me/WikidataMallChat'),
		Markup.urlButton(emojis.github + 'GitHub Issues', 'https://github.com/EdJoPaTo/wikidata-mall-telegram-game/issues')
	], {columns: 1})
}).middleware())

bot.use((data as any).middleware())

removeOld()

const i18n = new TelegrafI18n({
	directory: 'locales',
	defaultLanguage: 'en',
	defaultLanguageOnMissing: true,
	useSession: true
})

bot.use(i18n.middleware())

console.time('wdEntityStore')
console.timeLog('wdEntityStore', 'start')
const wdEntityStore = new WikidataEntityStore({
	entityStore: new KeyValueInMemoryFiles<EntityEntry>('wikidata-cache/entity-store'),
	properties: ['labels', 'descriptions', 'claims']
})
console.timeEnd('wdEntityStore')

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

bot.use(sessionMathMiddleware())

bot.use((Telegraf as any).privateChat(menu.init({
	backButtonText: (ctx: any) => `🔙 ${ctx.i18n.t('menu.back')}`,
	mainMenuButtonText: (ctx: any) => `🔝 ${ctx.wd.r('menu.menu').label()}`
})))

bot.use((Telegraf as any).groupChat((mall as any).middleware()))

bot.use((fallback as any).middleware())

bot.catch((error: any) => {
	console.error('telegraf error occured', error)
})

async function startup(): Promise<void> {
	try {
		await wikidata.preload(wdEntityStore)
		await notifications.initialize(notificationManager, wdEntityStore)
		bot.launch()
		console.log(new Date(), 'Bot started')

		setInterval(async () => wikidata.update(wdEntityStore), 4 * HOUR_IN_SECONDS * 1000)
		setTimeout(async () => wikidata.update(wdEntityStore), 15 * MINUTE_IN_SECONDS * 1000)
	} catch (error) {
		console.error('startup failed:', error)
	}
}

startup()
