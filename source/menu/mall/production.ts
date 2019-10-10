import {markdown as format} from 'telegram-format'
import TelegrafInlineMenu from 'telegraf-inline-menu'
import WikidataEntityStore from 'wikidata-entity-store'

import {MallProduction} from '../../lib/types/mall'
import {Persist, Session} from '../../lib/types'

import {MALL_MIN_PEOPLE, MALL_PRODUCTION_TIME_IN_SECONDS, MALL_PRODUCTION_START_COST} from '../../lib/game-math/constants'
import {productionReward} from '../../lib/game-math/mall'

import * as mallProduction from '../../lib/data/mall-production'
import * as userInfo from '../../lib/data/user-info'

import {getParts} from '../../lib/wikidata/production'

import {preloadWithParts} from '../../lib/game-logic/mall-production'

import {buttonText, menuPhoto} from '../../lib/interface/menu'
import {countdownMinuteSecond, humanReadableTimestamp} from '../../lib/interface/formatted-time'
import {emojis} from '../../lib/interface/emojis'
import {formatFloat} from '../../lib/interface/format-number'
import {infoHeader, mallMoneyCostPart, labeledValue} from '../../lib/interface/formatted-strings'

import {helpButtonText, createHelpMenu} from '../help'

async function getProduction(ctx: any): Promise<MallProduction> {
	const now = Date.now() / 1000
	const store = ctx.wd.store as WikidataEntityStore
	const production = await mallProduction.get()
	await preloadWithParts(store, production.itemToProduce, now)
	return production
}

async function menuText(ctx: any): Promise<string> {
	const now = Date.now() / 1000
	const {timeZone, __wikibase_language_code: locale} = ctx.session as Session
	const {mall} = ctx.persist as Persist
	if (!mall) {
		throw new Error('You are not part of a mall')
	}

	const {itemToProduce, competitionUntil} = await getProduction(ctx)

	let text = ''
	text += infoHeader(ctx.wd.r('mall.production'), {titlePrefix: emojis.production})
	text += '\n\n'

	text += emojis.countdown
	text += labeledValue(ctx.wd.r('other.end'), humanReadableTimestamp(competitionUntil, locale, timeZone))
	text += '\n'

	text += infoHeader(ctx.wd.r(itemToProduce), {titlePrefix: emojis.production})
	text += '\n\n'

	if (mall.partsProducedBy) {
		const productionParticipants = Object.keys(mall.partsProducedBy).length
		text += labeledValue(
			ctx.wd.r('mall.productionReward'),
			formatFloat(productionReward(productionParticipants)) + emojis.currencyMall
		)

		if (!mall.productionFinishes) {
			text += '\n'
		}
	}

	if (mall.productionFinishes) {
		text += emojis.countdown
		text += countdownMinuteSecond(mall.productionFinishes - now)
		text += ' '
		text += ctx.wd.r('unit.minute').label()
		text += '\n\n'
	} else {
		const parts = getParts(ctx.wd.r(itemToProduce))

		const lines = await Promise.all(parts
			.map(async o => {
				let line = ''
				line += format.bold(ctx.wd.r(o).label())
				line += ':\n  '
				if (mall.partsProducedBy && mall.partsProducedBy[o]) {
					const userId = mall.partsProducedBy[o]
					const user = await userInfo.get(userId)
					line += format.escape(user ? user.first_name : '??')
				} else {
					line += emojis.noPerson
				}

				return line
			})
		)

		text += lines.join('\n')
		text += '\n\n'
	}

	if (!mall.partsProducedBy) {
		text += mallMoneyCostPart(ctx, mall.money, MALL_PRODUCTION_START_COST)
	}

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto(async (ctx: any) => {
		const {itemToProduce} = await getProduction(ctx)
		return itemToProduce
	})
})

async function currentlyNotTakenParts(ctx: any): Promise<string[]> {
	const {mall} = ctx.persist as Persist
	if (!mall) {
		throw new Error('You are not part of a mall')
	}

	const productionOngoing = Boolean(mall.productionFinishes)
	const alreadyPreparingOrHavingEnoughMoneyToStart = mall.partsProducedBy || mall.money > MALL_PRODUCTION_START_COST
	if (productionOngoing || !alreadyPreparingOrHavingEnoughMoneyToStart) {
		return []
	}

	const {itemToProduce} = await getProduction(ctx)
	const parts = getParts(ctx.wd.r(itemToProduce))
	const takenParts = Object.keys(mall.partsProducedBy || {})
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

		if (mall.productionFinishes || mall.money < MALL_PRODUCTION_START_COST) {
			return
		}

		if (!mall.partsProducedBy) {
			mall.partsProducedBy = {}
			mall.money -= MALL_PRODUCTION_START_COST
		}

		if (mall.partsProducedBy[key]) {
			return
		}

		const keysTakenByUser = Object.keys(mall.partsProducedBy)
			.filter(o => mall.partsProducedBy![o] === ctx.from.id)
		for (const k of keysTakenByUser) {
			delete mall.partsProducedBy[k]
		}

		mall.partsProducedBy[key] = ctx.from.id

		if (mall.member.length >= MALL_MIN_PEOPLE && mall.member.length <= Object.keys(mall.partsProducedBy).length) {
			mall.productionFinishes = Math.ceil(now + MALL_PRODUCTION_TIME_IN_SECONDS)
		}
	}
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'mall.production'),
	(ctx: any) => ctx.wd.r('mall.production').url()
)

menu.urlButton(
	buttonText(emojis.wikidataItem, async ctx => (await getProduction(ctx)).itemToProduce),
	async (ctx: any) => ctx.wd.r((await getProduction(ctx)).itemToProduce).url(),
	{
		joinLastRow: true
	}
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.mall-production'))

export default menu
