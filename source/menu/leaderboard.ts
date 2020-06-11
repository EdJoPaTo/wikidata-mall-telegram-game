import {markdown as format} from 'telegram-format'
import {User} from 'telegram-typings'
import TelegrafInlineMenu from 'telegraf-inline-menu'

import {sortDictKeysByNumericValues} from '../lib/js-helper/dictionary'

import {LeaderboardView, LEADERBOARD_VIEWS} from '../lib/types/leaderboard'
import {Mall} from '../lib/types/mall'
import {Session, Persist} from '../lib/types'
import {Skills} from '../lib/types/skills'

import {WEEK_IN_SECONDS} from '../lib/math/timestamp-constants'

import * as mallProduction from '../lib/data/mall-production'
import * as userInfo from '../lib/data/user-info'
import * as userMalls from '../lib/data/malls'
import * as userShops from '../lib/data/shops'
import * as userSkills from '../lib/data/skills'

import * as wdAttraction from '../lib/wikidata/attractions'

import {employeesWithFittingHobbyAmount} from '../lib/game-math/personal'
import {lastTimeActive} from '../lib/game-math/shop-time'
import {productBasePriceCollectorFactor} from '../lib/game-math/product'
import {returnOnInvestment, maxSellPerMinute} from '../lib/game-math/shop-cost'

import {getAttractionHeight} from '../lib/game-logic/mall-attraction'

import {emojis} from '../lib/interface/emojis'
import {formatFloat, formatInt} from '../lib/interface/format-number'
import {infoHeader} from '../lib/interface/formatted-strings'
import {mallMoji} from '../lib/interface/mall'
import {menuPhoto, buttonText} from '../lib/interface/menu'
import {percentBonusString} from '../lib/interface/format-percent'

import {createHelpMenu, helpButtonText} from './help'

const DEFAULT_VIEW: LeaderboardView = 'returnOnInvestment'

interface LeaderboardEntries<T> {
	readonly order: readonly string[];
	readonly values: Readonly<Record<string, T>>;
}

async function getMatchingHobbiesTable(now: number): Promise<LeaderboardEntries<number>> {
	const allUserShops = await userShops.getAll()
	const playerIds = Object.keys(allUserShops)
		.map(o => Number(o))
		.filter(o => now - lastTimeActive(allUserShops[o]) < WEEK_IN_SECONDS)

	const values: Record<string, number> = {}
	for (const playerId of playerIds) {
		const shops = allUserShops[playerId]
		const currently = employeesWithFittingHobbyAmount(shops)
		if (currently > 0) {
			values[playerId] = currently
		}
	}

	return {
		values,
		order: sortDictKeysByNumericValues(values, true)
	}
}

async function getROITable(now: number): Promise<LeaderboardEntries<number>> {
	const allUserShops = await userShops.getAll()
	const allUserSkills = await userSkills.getAll()
	const playerIds = Object.keys(allUserShops)
		.map(o => Number(o))
		.filter(o => now - lastTimeActive(allUserShops[o]) < WEEK_IN_SECONDS)

	const values: Record<string, number> = {}
	for (const playerId of playerIds) {
		const shops = allUserShops[playerId]
		const skills: Skills = allUserSkills[playerId] || {}
		const roi = returnOnInvestment(shops, skills)
		if (!Number.isFinite(roi)) {
			continue
		}

		values[playerId] = roi
	}

	return {
		values,
		order: sortDictKeysByNumericValues(values, true)
	}
}

async function getAssortmentTable(now: number): Promise<LeaderboardEntries<number>> {
	const allUserShops = await userShops.getAll()
	const playerIds = Object.keys(allUserShops)
		.map(o => Number(o))
		.filter(o => now - lastTimeActive(allUserShops[o]) < WEEK_IN_SECONDS)

	const values: Record<string, number> = {}
	for (const playerId of playerIds) {
		const shops = allUserShops[playerId]
		const products = shops.flatMap(o => o.products).length
		values[playerId] = products
	}

	return {
		values,
		order: sortDictKeysByNumericValues(values, true)
	}
}

async function getSellPerMinuteTable(now: number): Promise<LeaderboardEntries<number>> {
	const allUserShops = await userShops.getAll()
	const allUserSkills = await userSkills.getAll()
	const playerIds = Object.keys(allUserShops)
		.map(o => Number(o))
		.filter(o => now - lastTimeActive(allUserShops[o]) < WEEK_IN_SECONDS)

	const values: Record<string, number> = {}
	for (const playerId of playerIds) {
		/* eslint no-await-in-loop: warn */
		const mallId = await userMalls.getMallIdOfUser(playerId)
		const mall = mallId === undefined ? undefined : await userMalls.get(mallId)
		const attractionHeight = getAttractionHeight(mall && mall.attraction)

		const shops = allUserShops[playerId]
		const skills: Skills = allUserSkills[playerId] || {}
		const income = shops
			.map(o => maxSellPerMinute(o, skills, attractionHeight))
			.reduce((a, b) => a + b, 0)
		if (!Number.isFinite(income) || income < 0.01) {
			continue
		}

		values[playerId] = income
	}

	return {
		values,
		order: sortDictKeysByNumericValues(values, true)
	}
}

async function getCollectorTable(): Promise<LeaderboardEntries<number>> {
	const allUserSkills = await userSkills.getAll()
	const values: Record<string, number> = {}
	for (const playerId of Object.keys(allUserSkills).map(o => Number(o))) {
		const bonus = productBasePriceCollectorFactor(allUserSkills[playerId])
		values[playerId] = bonus
	}

	return {
		values,
		order: sortDictKeysByNumericValues(values, true)
	}
}

async function getMallProductionTable(): Promise<LeaderboardEntries<number>> {
	const production = await mallProduction.get()
	const values = production.itemsProducedPerMall
	return {
		values,
		order: sortDictKeysByNumericValues(values, true)
	}
}

async function getMallAttractionTable(now: number): Promise<LeaderboardEntries<number>> {
	const allMalls = await userMalls.getAll()
	const values: Record<string, number> = {}
	for (const mallId of Object.keys(allMalls).map(o => Number(o))) {
		const mall = allMalls[mallId]

		if (mall.attraction && mall.attraction.disasterTimestamp > now) {
			values[mallId] = wdAttraction.getHeight(mall.attraction.item)
		}
	}

	return {
		values,
		order: sortDictKeysByNumericValues(values, true)
	}
}

function entryLine(index: number, name: string, formattedValue: string, highlighted: boolean): string {
	const rank = index + 1

	const parts: string[] = []
	parts.push(`${rank}.`)
	parts.push(format.italic(format.escape(formattedValue)))
	const escapedName = format.escape(name)
	parts.push(highlighted ? format.bold(escapedName) : escapedName)

	return parts.join(' ')
}

function nameOfId(allPlayerInfos: Record<string, User>, allMallInfos: Record<string, Mall>, id: string): string {
	const playerInfo = allPlayerInfos[id]
	if (playerInfo) {
		return playerInfo.first_name
	}

	const mallInfo = allMallInfos[id]
	if (mallInfo) {
		return mallMoji(mallInfo)
	}

	return '??'
}

async function generateTable<T>(entries: LeaderboardEntries<T>, forPlayerId: number | undefined, formatNumberFunc: (num: T) => string): Promise<string> {
	const allPlayerInfos = await userInfo.getAll()
	const allMallInfos = await userMalls.getAll()
	const indexOfPlayer = entries.order.indexOf(String(forPlayerId))

	const lines = await Promise.all(
		entries.order.map((playerId, i) => {
			if (i < 10 || (i > indexOfPlayer - 5 && i < indexOfPlayer + 5)) {
				return entryLine(i, nameOfId(allPlayerInfos, allMallInfos, playerId), formatNumberFunc(entries.values[playerId]), i === indexOfPlayer)
			}

			return undefined
		})
	)

	return lines
		.filter(o => o)
		.join('\n')
}

async function menuText(ctx: any): Promise<string> {
	const session = ctx.session as Session
	const {mall} = ctx.persist as Persist
	const production = await mallProduction.get()
	const now = Date.now() / 1000

	let text = ''
	text += infoHeader(ctx.wd.r('menu.leaderboard'), {titlePrefix: emojis.leaderboard})

	const view = session.leaderboardView || DEFAULT_VIEW
	text += infoHeader(ctx.wd.r(viewResourceKey(view)))

	switch (view) {
		case 'returnOnInvestment':
			text += await generateTable(await getROITable(now), ctx.from.id, percentBonusString)
			break

		case 'matchingHobbies':
			text += await generateTable(await getMatchingHobbiesTable(now), ctx.from.id, o => String(o))
			break

		case 'assortment':
			text += await generateTable(await getAssortmentTable(now), ctx.from.id, o => formatInt(o))
			break

		case 'sellPerMinute':
			text += await generateTable(await getSellPerMinuteTable(now), ctx.from.id, o => `≤${formatFloat(o)}${emojis.currency} / ${ctx.wd.r('unit.minute').label()}`)
			break

		case 'collector':
			text += await generateTable(await getCollectorTable(), ctx.from.id, percentBonusString)
			break

		case 'mallProduction':
			if (production.itemToProduce) {
				text += infoHeader(ctx.wd.r(production.itemToProduce))
			}

			text += await generateTable(await getMallProductionTable(), mall && mall.chat.id, o => formatInt(o))
			break

		case 'mallAttraction':
			text += await generateTable(await getMallAttractionTable(now), mall && mall.chat.id, o => `${formatFloat(o)} ${ctx.wd.r('unit.meter').label()}`)
			break

		default:
			throw new Error(`unknown leaderboard view: ${view}`)
	}

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto('menu.leaderboard')
})

function viewResourceKey(view: LeaderboardView): string {
	switch (view) {
		case 'returnOnInvestment':
			return 'other.returnOnInvestment'
		case 'matchingHobbies':
			return 'person.hobby'
		case 'assortment':
			return 'other.assortment'
		case 'sellPerMinute':
			return 'other.income'
		case 'collector':
			return 'skill.collector'
		case 'mallProduction':
			return 'mall.production'
		case 'mallAttraction':
			return 'mall.attraction'
		default:
			throw new Error(`unknown leaderboard view: ${view}`)
	}
}

menu.select('view', LEADERBOARD_VIEWS, {
	columns: 2,
	isSetFunc: (ctx: any, key) => {
		const session = ctx.session as Session
		return session.leaderboardView === key || (key === DEFAULT_VIEW && !session.leaderboardView)
	},
	setFunc: (ctx: any, key) => {
		const session = ctx.session as Session
		session.leaderboardView = key as LeaderboardView
	},
	textFunc: (ctx: any, key) => {
		return ctx.wd.r(viewResourceKey(key as LeaderboardView)).label()
	}
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r('menu.leaderboard').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.leaderboard'))

export default menu
