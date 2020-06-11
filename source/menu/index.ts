import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../lib/types'

import {canAddToSkillQueue} from '../lib/game-math/skill'
import {storageFilledPercentage} from '../lib/game-math/shop-capacity'

import {applicantButtonEmoji} from '../lib/interface/applicants'
import {buttonText, backButtons} from '../lib/interface/menu'
import {emojis} from '../lib/interface/emojis'
import {infoHeader, labeledFloat} from '../lib/interface/formatted-strings'
import {mallMoji} from '../lib/interface/mall'

import {menu as applicants} from './applicants'
import {menu as botStats} from './bot-stats'
import {menu as employees} from './employees'
import {menu as leaderboard} from './leaderboard'
import {menu as mall} from './mall'
import {menu as settings} from './settings'
import {menu as shops} from './shops'
import {menu as skills} from './skills'

async function menuBody(ctx: Context): Promise<Body> {
	let text = ''
	text += infoHeader(await ctx.wd.reader('menu.menu'))

	text += labeledFloat(await ctx.wd.reader('other.money'), ctx.session.money, emojis.currency)
	text += '\n'

	text += ctx.i18n.t('menu.welcome')
	text += '\n'
	text += emojis.warning
	text += ctx.i18n.t('menu.wikidataContentWarning')

	return {text, parse_mode: 'Markdown'}
}

export const menu = new MenuTemplate<Context>(menuBody)

function shopsRequireAttention(ctx: Context): boolean {
	const {shops, skills} = ctx.persist
	return shops.some(o => storageFilledPercentage(o, skills) === 0)
}

function shopsButtonSuffix(ctx: Context): string {
	const {shops} = ctx.persist
	return `(${shops.length})`
}

menu.submenu(buttonText(emojis.shop, 'menu.shop', {requireAttention: shopsRequireAttention, suffix: shopsButtonSuffix}), 'shops', shops)

menu.interact(buttonText(emojis.mall, 'menu.mall'), 'mallJoinHint', {
	hide: ctx => Boolean(ctx.persist.mall),
	do: async ctx => {
		const {username} = ctx.botInfo!
		let text = ''
		text += '@'
		text += username
		text += ' → '
		text += emojis.group
		text += (await ctx.wd.reader('menu.chat')).label()

		await ctx.answerCbQuery(text, true)
	}
})

function mallButtonEmojis(ctx: Context): string {
	const {mall} = ctx.persist
	return emojis.mall + String(mall && mallMoji(mall))
}

menu.submenu(buttonText(mallButtonEmojis, 'menu.mall'), 'mall', mall, {
	hide: ctx => !ctx.persist.mall
})

function applicantEmoji(ctx: Context): string {
	return applicantButtonEmoji(ctx.persist.applicants.list)
}

menu.submenu(buttonText(applicantEmoji, 'menu.applicant'), 'applicants', applicants, {
	hide: ctx => ctx.persist.shops.length === 0
})

menu.submenu(buttonText(emojis.person, 'menu.employee'), 'employees', employees, {
	joinLastRow: true,
	hide: ctx => ctx.persist.shops.length === 0
})

function skillRequireAttention(ctx: Context): boolean {
	const now = Date.now() / 1000
	return canAddToSkillQueue(ctx.session.skillQueue, now)
}

menu.submenu(buttonText(emojis.skill, 'menu.skill', {requireAttention: skillRequireAttention}), 'skill', skills, {
	hide: ctx => ctx.persist.shops.length === 0
})

menu.submenu(buttonText(emojis.leaderboard, 'menu.leaderboard'), 'leaderboard', leaderboard, {
	joinLastRow: true
})

menu.submenu(buttonText(emojis.settings, 'menu.settings'), 'settings', settings)

menu.submenu(buttonText(emojis.stats, 'stat.stats'), 'botStats', botStats, {
	joinLastRow: true
})

menu.url(buttonText(emojis.chat, 'menu.chat'), 'https://t.me/WikidataMallChat')

menu.url(buttonText(emojis.github, 'other.github'), 'https://github.com/EdJoPaTo/wikidata-mall-telegram-game', {
	joinLastRow: true
})

menu.url(buttonText(emojis.github, 'other.changelog'), 'https://github.com/EdJoPaTo/wikidata-mall-telegram-game/releases')

menu.manualRow(backButtons)
