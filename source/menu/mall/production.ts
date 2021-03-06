import {markdown as format} from 'telegram-format'
import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {MINUTE_IN_SECONDS} from '../../lib/math/timestamp-constants'

import {ProductionPart} from '../../lib/types/mall'
import {Context} from '../../lib/types'

import {productionReward, productionSeconds} from '../../lib/game-math/mall'

import * as mallProduction from '../../lib/data/mall-production'
import * as userInfo from '../../lib/data/user-info'

import {getParts} from '../../lib/wikidata/production'

import {buttonText, backButtons, bodyPhoto} from '../../lib/interface/menu'
import {countdownMinuteSecond, humanReadableTimestamp} from '../../lib/interface/formatted-time'
import {emojis} from '../../lib/interface/emojis'
import {formatFloat, formatInt} from '../../lib/interface/format-number'
import {infoHeader, labeledValue, labeledInt} from '../../lib/interface/formatted-strings'

import {helpButtonText, createHelpMenu} from '../help'

async function partLine(ctx: Context, part: ProductionPart, now: number): Promise<string> {
	const finished = part.finishTimestamp < now
	const user = await userInfo.get(part.user)
	const name = format.escape(user ? user.first_name : '??')
	const isMe = ctx.from!.id === part.user

	let text = ''
	text += format.bold(format.escape(await ctx.wd.reader(part.part).then(r => r.label())))
	text += '\n  '
	text += finished ? emojis.productionFinished : emojis.countdown
	text += isMe ? format.italic(name) : name

	if (!finished) {
		text += ' '
		text += countdownMinuteSecond(part.finishTimestamp - now)
		text += ' '
		text += (await ctx.wd.reader('unit.minute')).label()
	}

	return text
}

async function menuBody(ctx: Context): Promise<Body> {
	const now = Date.now() / 1000
	const {hideExplanationMath, timeZone, __wikibase_language_code: locale} = ctx.session
	const {mall} = ctx.persist
	if (!mall) {
		throw new Error('You are not part of a mall')
	}

	const {itemToProduce, competitionUntil} = await mallProduction.get()
	if (!itemToProduce) {
		throw new Error('There is nothing to produce')
	}

	const parts = getParts(itemToProduce)
	const inProduction = new Set(mall.production.map(o => o.part))
	const missing = parts.filter(o => !inProduction.has(o))

	const currentlyBeeingProduced = mall.production.filter(o => o.finishTimestamp > now)
	const productionMinutes = productionSeconds(currentlyBeeingProduced.length) / MINUTE_IN_SECONDS

	let text = ''
	text += infoHeader(await ctx.wd.reader('mall.production'), {titlePrefix: emojis.production})

	text += emojis.countdown
	text += labeledValue(await ctx.wd.reader('other.end'), humanReadableTimestamp(competitionUntil, locale, timeZone))
	text += '\n'

	const reader = await ctx.wd.reader(itemToProduce)
	text += infoHeader(reader, {titlePrefix: emojis.production})

	text += labeledValue(
		await ctx.wd.reader('mall.productionReward'),
		formatFloat(productionReward(parts.length)) + emojis.currencyMall
	)
	if (missing.length > 0) {
		text += labeledInt(
			await ctx.wd.reader('mall.production'),
			productionMinutes,
			` ${(await ctx.wd.reader('unit.minute')).label()}`
		)
		if (!hideExplanationMath && currentlyBeeingProduced.length > 0) {
			text += '  '
			text += emojis.group
			text += formatInt(currentlyBeeingProduced.length)
			text += ' '
			text += (await ctx.wd.reader('mall.productionTeamwork')).label()
			text += '\n'
		}
	}

	text += '\n'

	const partLines = await Promise.all(
		mall.production
			.map(async o => partLine(ctx, o, now))
	)
	text += partLines
		.join('\n')

	if (partLines.length > 0 && missing.length > 0) {
		text += '\n'
	}

	await ctx.wd.preload(missing)
	const readersMissing = await Promise.all(missing.map(async o => ctx.wd.reader(o)))
	text += readersMissing
		.map(o => o.label())
		.map(o => `${format.bold(format.escape(o))}\n  ${emojis.noPerson}`)
		.join('\n')

	return {
		...bodyPhoto(reader),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

async function currentlyNotTakenParts(ctx: Context): Promise<string[]> {
	const now = Date.now() / 1000
	const {mall} = ctx.persist
	if (!mall) {
		throw new Error('You are not part of a mall')
	}

	if (mall.production.some(o => o.user === ctx.from!.id && o.finishTimestamp > now)) {
		// Currently producing something
		return []
	}

	const {itemToProduce} = await mallProduction.get()
	const parts = getParts(itemToProduce!)
	const takenParts = new Set(mall.production.map(o => o.part))
	const notTakenParts = parts
		.filter(o => !takenParts.has(o))
	return notTakenParts
}

menu.choose('take', currentlyNotTakenParts, {
	columns: 2,
	buttonText: async (ctx, key) => (await ctx.wd.reader(key)).label(),
	do: (ctx, key) => {
		const now = Date.now() / 1000
		const {mall} = ctx.persist
		if (!mall) {
			throw new Error('You are not part of a mall')
		}

		if (mall.production.some(o => o.user === ctx.from!.id && o.finishTimestamp > now)) {
			// Currently producing something
			return '.'
		}

		if (mall.production.some(o => o.part === key)) {
			// Someone already took this part
			return '.'
		}

		const currentlyBeeingProduced = mall.production.filter(o => o.finishTimestamp > now)
		const finishTimestamp = now + productionSeconds(currentlyBeeingProduced.length)

		mall.production.push({
			part: key,
			user: ctx.from!.id,
			finishTimestamp
		})

		return '.'
	}
})

menu.url(
	buttonText(emojis.wikidataItem, 'mall.production'),
	async ctx => (await ctx.wd.reader('mall.production')).url()
)

menu.url(
	buttonText(emojis.wikidataItem, async () => (await mallProduction.get()).itemToProduce ?? ''),
	async ctx => (await ctx.wd.reader((await mallProduction.get()).itemToProduce!)).url(),
	{
		joinLastRow: true
	}
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.mall-production'))

menu.manualRow(backButtons)
