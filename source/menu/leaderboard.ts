import {markdown as format} from 'telegram-format'
import {MenuTemplate, Body} from 'telegraf-inline-menu'
import {User} from 'typegram'

import {sortDictKeysByNumericValues} from '../lib/js-helper/dictionary'

import {Context} from '../lib/types'
import {LeaderboardView, LEADERBOARD_VIEWS} from '../lib/types/leaderboard'
import {Mall} from '../lib/types/mall'
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

import {buttonText, backButtons, bodyPhoto} from '../lib/interface/menu'
import {emojis} from '../lib/interface/emojis'
import {formatFloat, formatInt} from '../lib/interface/format-number'
import {infoHeader} from '../lib/interface/formatted-strings'
import {mallMoji} from '../lib/interface/mall'
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
		// eslint-disable-next-line no-await-in-loop
		const mallId = await userMalls.getMallIdOfUser(playerId)
		// eslint-disable-next-line no-await-in-loop
		const mall = mallId === undefined ? undefined : await userMalls.get(mallId)
		const attractionHeight = getAttractionHeight(mall?.attraction)

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

async function menuBody(ctx: Context): Promise<Body> {
	const {mall} = ctx.persist
	const production = await mallProduction.get()
	const now = Date.now() / 1000

	let text = ''
	const reader = await ctx.wd.reader('menu.leaderboard')
	text += infoHeader(reader, {titlePrefix: emojis.leaderboard})

	const view = ctx.session.leaderboardView || DEFAULT_VIEW
	text += infoHeader(await ctx.wd.reader(viewResourceKey(view)))

	const readerMinute = await ctx.wd.reader('unit.minute')
	const readerMeter = await ctx.wd.reader('unit.meter')

	switch (view) {
		case 'returnOnInvestment':
			text += await generateTable(await getROITable(now), ctx.from!.id, percentBonusString)
			break

		case 'matchingHobbies':
			text += await generateTable(await getMatchingHobbiesTable(now), ctx.from!.id, o => String(o))
			break

		case 'assortment':
			text += await generateTable(await getAssortmentTable(now), ctx.from!.id, o => formatInt(o))
			break

		case 'sellPerMinute':
			text += await generateTable(await getSellPerMinuteTable(now), ctx.from!.id, o => `≤${formatFloat(o)}${emojis.currency} / ${readerMinute.label()}`)
			break

		case 'collector':
			text += await generateTable(await getCollectorTable(), ctx.from!.id, percentBonusString)
			break

		case 'mallProduction':
			if (production.itemToProduce) {
				text += infoHeader(await ctx.wd.reader(production.itemToProduce))
			}

			text += await generateTable(await getMallProductionTable(), mall?.chat.id, o => formatInt(o))
			break

		case 'mallAttraction':
			text += await generateTable(await getMallAttractionTable(now), mall?.chat.id, o => `${formatFloat(o)} ${readerMeter.label()}`)
			break

		default:
			throw new Error(`unknown leaderboard view: ${view}`)
	}

	return {
		...bodyPhoto(reader),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate(menuBody)

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
	isSet: (ctx, key) => {
		return ctx.session.leaderboardView === key || (key === DEFAULT_VIEW && !ctx.session.leaderboardView)
	},
	set: (ctx, key) => {
		ctx.session.leaderboardView = key as LeaderboardView
		return true
	},
	buttonText: async (ctx, key) => (await ctx.wd.reader(viewResourceKey(key as LeaderboardView))).label()
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	async ctx => (await ctx.wd.reader('menu.leaderboard')).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.leaderboard'))

menu.manualRow(backButtons)
