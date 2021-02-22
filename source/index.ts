import {existsSync, readFileSync} from 'fs'

import {EntitySimplified} from 'wikidata-sdk-got'
import {generateUpdateMiddleware} from 'telegraf-middleware-console-time'
import {I18n as TelegrafI18n} from '@edjopato/telegraf-i18n'
import {MenuMiddleware} from 'telegraf-inline-menu'
import {Telegraf, Composer} from 'telegraf'
import {TelegrafWikibase, resourceKeysFromYaml} from 'telegraf-wikibase'
import {TtlKeyValueInMemoryFile} from '@edjopato/datastore'

import * as wikidata from './lib/wikidata'

import {HOUR_IN_SECONDS} from './lib/math/timestamp-constants'

import {Context} from './lib/types'
import data from './lib/data'

import {fixMallDataForAllMalls} from './lib/game-logic/mall-fix-data'

import * as notifications from './lib/session-math/notification'
import sessionMathMiddleware from './lib/session-math'

import {emojis} from './lib/interface/emojis'
import {notificationText} from './lib/interface/notification'

import {ErrorMiddleware} from './lib/error-middleware'
import {NotificationManager} from './lib/notification/manager'

import fallback from './fallback'
import mall from './mall'
import {menu} from './menu'

process.title = 'wikidata-mall-tgbot'

const token = (existsSync('/run/secrets/bot-token.txt') && readFileSync('/run/secrets/bot-token.txt', 'utf8').trim()) ||
	(existsSync('bot-token.txt') && readFileSync('bot-token.txt', 'utf8').trim()) ||
	process.env.BOT_TOKEN
if (!token) {
	throw new Error('You have to provide the bot-token from @BotFather via file (bot-token.txt) or environment variable (BOT_TOKEN)')
}

const bot = new Telegraf<Context>(token)

if (process.env.NODE_ENV !== 'production') {
	bot.use(generateUpdateMiddleware())
}

bot.use(new ErrorMiddleware({
	text: 'You should join the Chat Group and report this error. Let us make this bot even better together. ☺️',
	inlineKeyboardMarkup: {
		inline_keyboard: [
			[{text: emojis.chat + 'Join Chat', url: 'https://t.me/WikidataMallChat'}],
			[{text: emojis.github + 'GitHub Issues', url: 'https://github.com/EdJoPaTo/wikidata-mall-telegram-game/issues'}]
		]
	}
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
			// eslint-disable-next-line unicorn/prefer-ternary
			if (notification.photo) {
				await bot.telegram.sendPhoto(chatId, notification.photo, {parse_mode: 'Markdown', caption: text})
			} else {
				await bot.telegram.sendMessage(chatId, text, {parse_mode: 'Markdown'})
			}
		} catch (error: unknown) {
			if (error instanceof Error && error.message.includes('chat not found')) {
				console.error('notification failed to send', chatId, error.message)
			} else {
				console.error('notification failed to send', chatId, error)
			}
		}
	}
)

const wdCache = new TtlKeyValueInMemoryFile<EntitySimplified>('tmp/wikidata-cache.json')

const twb = new TelegrafWikibase({
	contextKey: 'wd',
	logQueriedEntityIds: process.env.NODE_ENV !== 'production',
	store: wdCache,
	ttl: 22 * HOUR_IN_SECONDS * 1000,
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

		if (process.env.NODE_ENV === 'production') {
			console.time('check-mall-groups')
			await fixMallDataForAllMalls(bot.telegram)
			console.timeEnd('check-mall-groups')
		}

		await twb.startRegularResourceKeyUpdate(error => {
			console.error('TelegrafWikibase', 'regular update failed', error)
		})

		await wikidata.preload()
		await notifications.initialize(notificationManager, twb)
		await bot.launch()
		console.log(new Date(), 'Bot started as', bot.botInfo?.username)

		setInterval(async () => wikidata.update(), 20 * HOUR_IN_SECONDS * 1000)
	} catch (error: unknown) {
		console.error('startup failed:', error)
	}
}

void startup()
