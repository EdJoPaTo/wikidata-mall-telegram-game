import {existsSync, readFileSync} from 'fs'

import {EntitySimplified} from 'wikidata-sdk-got/dist/source/wikibase-sdk-types'
import {generateUpdateMiddleware} from 'telegraf-middleware-console-time'
import {MenuMiddleware} from 'telegraf-inline-menu'
import {TelegrafWikibase, resourceKeysFromYaml} from 'telegraf-wikibase'
import {TtlKeyValueInMemoryFile} from '@edjopato/datastore'
import Telegraf, {Extra, Markup, Composer} from 'telegraf'
import TelegrafI18n from 'telegraf-i18n'

import * as wikidata from './lib/wikidata'

import {HOUR_IN_SECONDS, MINUTE_IN_SECONDS} from './lib/math/timestamp-constants'

import {Context} from './lib/types'
import data from './lib/data'

import {fixMallDataForAllMalls} from './lib/game-logic/mall-fix-data'
import {removeOld} from './lib/game-logic/remove-old'

import * as notifications from './lib/session-math/notification'
import sessionMathMiddleware from './lib/session-math'

import {emojis} from './lib/interface/emojis'
import {notificationText} from './lib/interface/notification'

import {ErrorMiddleware} from './lib/error-middleware'
import {NotificationManager} from './lib/notification/manager'

import fallback from './fallback'
import mall from './mall'
import {menu} from './menu'

const tokenFilePath = existsSync('/run/secrets') ? '/run/secrets/bot-token.txt' : 'bot-token.txt'
const token = readFileSync(tokenFilePath, 'utf8').trim()
const bot = new Telegraf<Context>(token)

if (process.env.NODE_ENV !== 'production') {
	bot.use(generateUpdateMiddleware())
}

bot.use(new ErrorMiddleware({
	text: 'You should join the Chat Group and report this error. Let us make this bot even better together. ☺️',
	inlineKeyboardMarkup: Markup.inlineKeyboard([
		Markup.urlButton(emojis.chat + 'Join Chat', 'https://t.me/WikidataMallChat'),
		Markup.urlButton(emojis.github + 'GitHub Issues', 'https://github.com/EdJoPaTo/wikidata-mall-telegram-game/issues')
	], {columns: 1})
}).middleware())

bot.use(data.middleware())

const i18n = new TelegrafI18n({
	directory: 'locales',
	defaultLanguage: 'en',
	defaultLanguageOnMissing: true,
	useSession: true
})

bot.use(i18n.middleware())

const notificationManager = new NotificationManager(
	async (chatId, notification, fireDate) => {
		try {
			const text = notificationText(notification, fireDate)
			if (notification.photo) {
				await bot.telegram.sendPhoto(chatId, notification.photo, new Extra({
					caption: text
				}).markdown() as any)
			} else {
				await bot.telegram.sendMessage(chatId, text, Extra.markdown() as any)
			}
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

const wdCache = new TtlKeyValueInMemoryFile<EntitySimplified>('tmp/wikidata-cache.json')

const twb = new TelegrafWikibase(wdCache, {
	contextKey: 'wd',
	logQueriedEntityIds: process.env.NODE_ENV !== 'production',
	userAgent: 'github.com/EdJoPaTo/wikidata-mall-telegram-game'
})
twb.addResourceKeys(resourceKeysFromYaml(readFileSync('wikidata-items.yaml', 'utf8')))
bot.use(twb.middleware())

bot.use(sessionMathMiddleware())

const privateChatBot = new Composer<Context>()

const menuMiddleware = new MenuMiddleware<Context>('/', menu)
privateChatBot.command('start', async ctx => menuMiddleware.replyToContext(ctx))
privateChatBot.command('settings', async ctx => menuMiddleware.replyToContext(ctx, '/settings/'))
privateChatBot.command(['lang', 'language'], async ctx => menuMiddleware.replyToContext(ctx, '/settings/lang/'))
privateChatBot.use(menuMiddleware.middleware())

bot.use(Composer.privateChat(privateChatBot.middleware()))

bot.use(Telegraf.groupChat(mall.middleware()))

bot.use(fallback.middleware())

bot.catch((error: any) => {
	console.error('telegraf error occured', error)
})

async function startup(): Promise<void> {
	try {
		await bot.telegram.setMyCommands([
			{command: 'start', description: 'open the menu'},
			{command: 'language', description: 'set your language'},
			{command: 'settings', description: 'open settings'}
		])

		await removeOld()

		if (process.env.NODE_ENV === 'production') {
			console.time('check-mall-groups')
			await fixMallDataForAllMalls(bot.telegram)
			console.timeEnd('check-mall-groups')
		}

		await wikidata.preload()
		await notifications.initialize(notificationManager, twb)
		await bot.launch()
		console.log(new Date(), 'Bot started as', bot.options.username)

		setInterval(async () => wikidata.update(), 4 * HOUR_IN_SECONDS * 1000)
		setTimeout(async () => wikidata.update(), 15 * MINUTE_IN_SECONDS * 1000)
	} catch (error) {
		console.error('startup failed:', error)
	}
}

void startup()
