import {markdown as format} from 'telegram-format'
import {User} from 'telegram-typings'
import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Dictionary, sortDictKeysByNumericValues} from '../lib/js-helper/dictionary'

import {Session, LeaderboardView, LEADERBOARD_VIEWS} from '../lib/types'
import {Skills} from '../lib/types/skills'

import {WEEK_IN_SECONDS} from '../lib/math/timestamp-constants'

import * as userInfo from '../lib/data/user-info'
import * as userShops from '../lib/data/shops'
import * as userSkills from '../lib/data/skills'

import {currentLevel} from '../lib/game-math/skill'
import {lastTimeActive} from '../lib/game-math/shop-time'
import {returnOnInvestment, sellPerMinute} from '../lib/game-math/shop-cost'

import {emojis} from '../lib/interface/emojis'
import {formatFloat} from '../lib/interface/format-number'
import {infoHeader} from '../lib/interface/formatted-strings'
import {menuPhoto, buttonText} from '../lib/interface/menu'
import {percentBonusString} from '../lib/interface/format-percent'

import {createHelpMenu, helpButtonText} from './help'

const DEFAULT_VIEW: LeaderboardView = 'returnOnInvestment'

interface LeaderboardEntries {
	order: string[];
	values: Dictionary<number>;
}

async function getROITable(now: number): Promise<LeaderboardEntries> {
	const allUserShops = await userShops.getAllShops()
	const allUserSkills = await userSkills.getAllSkills()
	const playerIds = Object.keys(allUserShops)
		.filter(o => now - lastTimeActive(allUserShops[o]) < WEEK_IN_SECONDS)

	const values: Dictionary<number> = {}
	for (const playerId of playerIds) {
		const shops = allUserShops[playerId]
		const skills: Skills = allUserSkills[playerId] || {}
		const roi = returnOnInvestment(shops, skills)
		if (!isFinite(roi)) {
			continue
		}

		values[playerId] = roi
	}

	return {
		values,
		order: sortDictKeysByNumericValues(values, true)
	}
}

async function getSellPerMinuteTable(now: number): Promise<LeaderboardEntries> {
	const allUserShops = await userShops.getAllShops()
	const allUserSkills = await userSkills.getAllSkills()
	const playerIds = Object.keys(allUserShops)
		.filter(o => now - lastTimeActive(allUserShops[o]) < WEEK_IN_SECONDS)

	const values: Dictionary<number> = {}
	for (const playerId of playerIds) {
		const shops = allUserShops[playerId]
		const skills: Skills = allUserSkills[playerId] || {}
		const income = shops
			.map(o => sellPerMinute(o, skills, () => true))
			.reduce((a, b) => a + b, 0)
		if (!isFinite(income) || income < 0.01) {
			continue
		}

		values[playerId] = income
	}

	return {
		values,
		order: sortDictKeysByNumericValues(values, true)
	}
}

async function getCollectorTable(): Promise<LeaderboardEntries> {
	const allUserSkills = await userSkills.getAllSkills()
	const values: Dictionary<number> = {}
	for (const playerId of Object.keys(allUserSkills)) {
		const level = currentLevel(allUserSkills[playerId], 'collector')
		values[playerId] = level
	}

	return {
		values,
		order: sortDictKeysByNumericValues(values, true)
	}
}

function entryLine(index: number, info: User | undefined, formattedValue: string, highlighted: boolean): string {
	const name = info ? info.first_name : '??'
	const rank = index + 1

	const parts: string[] = []
	parts.push(`${rank}.`)
	parts.push(format.italic(formattedValue))
	parts.push(highlighted ? format.bold(name) : format.escape(name))

	return parts.join(' ')
}

async function generateTable(entries: LeaderboardEntries, forPlayerId: number, formatNumberFunc: (num: number) => string): Promise<string> {
	const allPlayerInfos = await userInfo.getAll()
	const indexOfPlayer = entries.order.indexOf(String(forPlayerId))

	const lines = await Promise.all(
		entries.order.map((playerId, i) => {
			if (i < 10 || (i > indexOfPlayer - 5 && i < indexOfPlayer + 5)) {
				return entryLine(i, allPlayerInfos[playerId], formatNumberFunc(entries.values[playerId]), i === indexOfPlayer)
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
	const now = Date.now() / 1000

	let text = ''
	text += infoHeader(ctx.wd.r('menu.leaderboard'), {titlePrefix: emojis.leaderboard})
	text += '\n\n'

	const view = session.leaderboardView || DEFAULT_VIEW
	text += infoHeader(ctx.wd.r(viewResourceKey(view)))
	text += '\n\n'

	switch (view) {
		case 'returnOnInvestment':
			text += await generateTable(await getROITable(now), ctx.from.id, percentBonusString)
			break

		case 'sellPerMinute':
			text += await generateTable(await getSellPerMinuteTable(now), ctx.from.id, o => `≤${formatFloat(o)}${emojis.currency} / ${ctx.wd.r('unit.minute').label()}`)
			break

		case 'collector':
			text += await generateTable(await getCollectorTable(), ctx.from.id, o => String(o))
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
		case 'sellPerMinute':
			return 'other.income'
		case 'collector':
			return 'skill.collector'
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
