import {markdown as format} from 'telegram-format'
import TelegrafInlineMenu from 'telegraf-inline-menu'
import WikidataEntityStore from 'wikidata-entity-store'

import {MINUTE_IN_SECONDS} from '../../lib/math/timestamp-constants'

import {MallProduction, ProductionPart} from '../../lib/types/mall'
import {Persist, Session} from '../../lib/types'

import {productionReward, productionSeconds} from '../../lib/game-math/mall'

import * as mallProduction from '../../lib/data/mall-production'
import * as userInfo from '../../lib/data/user-info'

import {getParts} from '../../lib/wikidata/production'

import {preloadWithParts} from '../../lib/game-logic/mall-production'

import {buttonText, menuPhoto} from '../../lib/interface/menu'
import {countdownMinuteSecond, humanReadableTimestamp} from '../../lib/interface/formatted-time'
import {emojis} from '../../lib/interface/emojis'
import {formatFloat, formatInt} from '../../lib/interface/format-number'
import {infoHeader, labeledValue, labeledInt} from '../../lib/interface/formatted-strings'

import {helpButtonText, createHelpMenu} from '../help'

async function getProduction(ctx: any): Promise<MallProduction> {
	const now = Date.now() / 1000
	const store = ctx.wd.store as WikidataEntityStore
	const production = await mallProduction.get()
	if (production.itemToProduce) {
		await preloadWithParts(store, production.itemToProduce, now)
	}

	return production
}

async function partLine(ctx: any, part: ProductionPart, now: number): Promise<string> {
	const finished = part.finishTimestamp < now
	const user = await userInfo.get(part.user)
	const name = user ? user.first_name : '??'
	const isMe = ctx.from.id === part.user

	let text = ''
	text += format.bold(ctx.wd.r(part.part).label())
	text += '\n  '
	text += finished ? emojis.productionFinished : emojis.countdown
	text += isMe ? format.italic(name) : format.escape(name)

	if (!finished) {
		text += ' '
		text += countdownMinuteSecond(part.finishTimestamp - now)
		text += ' '
		text += ctx.wd.r('unit.minute').label()
	}

	return text
}

async function menuText(ctx: any): Promise<string> {
	const now = Date.now() / 1000
	const {hideExplanationMath, timeZone, __wikibase_language_code: locale} = ctx.session as Session
	const {mall} = ctx.persist as Persist
	if (!mall) {
		throw new Error('You are not part of a mall')
	}

	const {itemToProduce, competitionUntil} = await getProduction(ctx)
	if (!itemToProduce) {
		throw new Error('There is nothing to produce')
	}

	const parts = getParts(ctx.wd.r(itemToProduce))
	const inProduction = mall.production.map(o => o.part)
	const missing = parts.filter(o => !inProduction.includes(o))

	const currentlyBeeingProduced = mall.production.filter(o => o.finishTimestamp > now)
	const productionMinutes = productionSeconds(currentlyBeeingProduced.length) / MINUTE_IN_SECONDS

	let text = ''
	text += infoHeader(ctx.wd.r('mall.production'), {titlePrefix: emojis.production})

	text += emojis.countdown
	text += labeledValue(ctx.wd.r('other.end'), humanReadableTimestamp(competitionUntil, locale, timeZone))
	text += '\n'

	text += infoHeader(ctx.wd.r(itemToProduce), {titlePrefix: emojis.production})

	text += labeledValue(
		ctx.wd.r('mall.productionReward'),
		formatFloat(productionReward(parts.length)) + emojis.currencyMall
	)
	if (missing.length > 0) {
		text += labeledInt(
			ctx.wd.r('mall.production'),
			productionMinutes,
			` ${ctx.wd.r('unit.minute').label()}`
		)
		if (!hideExplanationMath && currentlyBeeingProduced.length > 0) {
			text += '  '
			text += emojis.group
			text += formatInt(currentlyBeeingProduced.length)
			text += ' '
			text += ctx.wd.r('mall.productionTeamwork').label()
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

	text += missing
		.map(o => ctx.wd.r(o).label())
		.map(o => `${format.bold(o)}\n  ${emojis.noPerson}`)
		.join('\n')

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto(async (ctx: any) => {
		const {itemToProduce} = await getProduction(ctx)
		return itemToProduce
	})
})

async function currentlyNotTakenParts(ctx: any): Promise<string[]> {
	const now = Date.now() / 1000
	const {mall} = ctx.persist as Persist
	if (!mall) {
		throw new Error('You are not part of a mall')
	}

	if (mall.production.some(o => o.user === ctx.from.id && o.finishTimestamp > now)) {
		// Currently producing something
		return []
	}

	const {itemToProduce} = await getProduction(ctx)
	const parts = getParts(ctx.wd.r(itemToProduce))
	const takenParts = mall.production.map(o => o.part)
	const notTakenParts = parts
		.filter(o => !takenParts.includes(o))
	return notTakenParts
}

menu.select('take', currentlyNotTakenParts, {
	columns: 2,
	textFunc: (ctx: any, key) => ctx.wd.r(key).label(),
	setFunc: (ctx: any, key) => {
		const now = Date.now() / 1000
		const {mall} = ctx.persist as Persist
		if (!mall) {
			throw new Error('You are not part of a mall')
		}

		if (mall.production.some(o => o.user === ctx.from.id && o.finishTimestamp > now)) {
			// Currently producing something
			return
		}

		if (mall.production.some(o => o.part === key)) {
			// Someone already took this part
			return
		}

		const currentlyBeeingProduced = mall.production.filter(o => o.finishTimestamp > now)
		const finishTimestamp = now + productionSeconds(currentlyBeeingProduced.length)

		mall.production.push({
			part: key,
			user: ctx.from.id,
			finishTimestamp
		})
	}
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'mall.production'),
	(ctx: any) => ctx.wd.r('mall.production').url()
)

menu.urlButton(
	buttonText(emojis.wikidataItem, async ctx => (await getProduction(ctx)).itemToProduce || ''),
	async (ctx: any) => ctx.wd.r((await getProduction(ctx)).itemToProduce).url(),
	{
		joinLastRow: true
	}
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.mall-production'))

export default menu
