import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Session, Persist} from '../lib/types'

import {canAddToSkillQueue} from '../lib/game-math/skill'
import {storageFilledPercentage} from '../lib/game-math/shop-capacity'

import {applicantButtonEmoji} from '../lib/interface/applicants'
import {buttonText} from '../lib/interface/menu'
import {emojis} from '../lib/interface/emojis'
import {infoHeader, labeledFloat} from '../lib/interface/formatted-strings'
import {mallMoji} from '../lib/interface/mall'

import applicants from './applicants'
import botStats from './bot-stats'
import employees from './employees'
import leaderboard from './leaderboard'
import mall from './mall'
import settings from './settings'
import shops from './shops'
import skills from './skills'

function menuText(ctx: any): string {
	const session = ctx.session as Session

	let text = ''
	text += infoHeader(ctx.wd.r('menu.menu'))

	text += labeledFloat(ctx.wd.r('other.money'), session.money, emojis.currency)
	text += '\n'

	text += ctx.i18n.t('menu.welcome')
	text += '\n'
	text += emojis.warning
	text += ctx.i18n.t('menu.wikidataContentWarning')

	text += '\n'
	text += '⚠️*BETA*\n'
	text += 'complete data reset may happen any time\n'
	text += 'please join the [chat](https://t.me/WikidataMallChat) to discuss features and bugs :)\n'

	return text
}

const menu = new TelegrafInlineMenu(menuText)
menu.setCommand('start')

function shopsRequireAttention(ctx: any): boolean {
	const {shops, skills} = ctx.persist as Persist
	return shops.some(o => storageFilledPercentage(o, skills) === 0)
}

function shopsButtonSuffix(ctx: any): string {
	const {shops} = ctx.persist as Persist
	return `(${shops.length})`
}

menu.submenu(buttonText(emojis.shop, 'menu.shop', {requireAttention: shopsRequireAttention, suffix: shopsButtonSuffix}), 'shops', shops)

menu.simpleButton(buttonText(emojis.mall, 'menu.mall'), 'mallJoinHint', {
	hide: (ctx: any) => {
		const persist = ctx.persist as Persist
		return Boolean(persist.mall)
	},
	doFunc: async ctx => {
		const {username} = (ctx as any).botInfo
		let text = ''
		text += '@'
		text += username
		text += ' → '
		text += emojis.group
		text += (ctx as any).wd.r('menu.chat').label()

		await ctx.answerCbQuery(text, true)
	}
})

function mallButtonEmojis(ctx: any): string {
	const {mall} = ctx.persist as Persist
	return emojis.mall + String(mall && mallMoji(mall))
}

menu.submenu(buttonText(mallButtonEmojis, 'menu.mall'), 'mall', mall, {
	hide: (ctx: any) => {
		const persist = ctx.persist as Persist
		return !persist.mall
	}
})

function applicantEmoji(ctx: any): string {
	const now = Date.now() / 1000
	const {applicants} = ctx.persist as Persist
	return applicantButtonEmoji(applicants.list, now)
}

menu.submenu(buttonText(applicantEmoji, 'menu.applicant'), 'applicants', applicants, {
	hide: (ctx: any) => {
		const persist = ctx.persist as Persist
		return persist.shops.length === 0
	}
})

menu.submenu(buttonText(emojis.person, 'menu.employee'), 'employees', employees, {
	joinLastRow: true,
	hide: (ctx: any) => {
		const persist = ctx.persist as Persist
		return persist.shops.length === 0
	}
})

function skillRequireAttention(ctx: any): boolean {
	const {skillQueue} = ctx.session as Session
	const now = Date.now() / 1000
	return canAddToSkillQueue(skillQueue, now)
}

menu.submenu(buttonText(emojis.skill, 'menu.skill', {requireAttention: skillRequireAttention}), 'skill', skills, {
	hide: (ctx: any) => {
		const persist = ctx.persist as Persist
		return persist.shops.length === 0
	}
})

menu.submenu(buttonText(emojis.leaderboard, 'menu.leaderboard'), 'leaderboard', leaderboard, {
	joinLastRow: true
})

menu.submenu(buttonText(emojis.settings, 'menu.settings'), 'settings', settings)

menu.submenu(buttonText(emojis.stats, 'stat.stats'), 'botStats', botStats, {
	joinLastRow: true
})

menu.urlButton(buttonText(emojis.chat, 'menu.chat'), 'https://t.me/WikidataMallChat')

menu.urlButton(buttonText(emojis.github, 'other.github'), 'https://github.com/EdJoPaTo/wikidata-mall-telegram-game', {
	joinLastRow: true
})

menu.urlButton(buttonText(emojis.github, 'other.changelog'), 'https://github.com/EdJoPaTo/wikidata-mall-telegram-game/releases')

export default menu
