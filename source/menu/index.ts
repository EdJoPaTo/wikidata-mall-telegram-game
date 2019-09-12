import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Session, Persist} from '../lib/types'

import {buttonText} from '../lib/interface/menu'
import {emojis} from '../lib/interface/emojis'
import {infoHeader, labeledFloat} from '../lib/interface/formatted-strings'

import applicants from './applicants'
import botStats from './bot-stats'
import employees from './employees'
import leaderboard from './leaderboard'
import settings from './settings'
import shops from './shops'
import skills from './skills'

function menuText(ctx: any): string {
	const session = ctx.session as Session

	let text = ''
	text += infoHeader(ctx.wd.r('menu.menu'))
	text += '\n\n'

	text += labeledFloat(ctx.wd.r('other.money'), session.money, emojis.currency)
	text += '\n\n'

	text += ctx.i18n.t('menu.welcome')

	text += '\n'
	text += '⚠️*BETA*\n'
	text += 'complete data reset may happen any time\n'
	text += 'please join the [chat](https://t.me/WikidataMallChat) to discuss features and bugs :)\n'

	return text
}

const menu = new TelegrafInlineMenu(menuText)
menu.setCommand('start')

function shopsButtonText(ctx: any): string {
	const persist = ctx.persist as Persist
	let text = ''
	text += emojis.shop
	text += ctx.wd.r('menu.shop').label()
	text += ' ('
	text += persist.shops.length
	text += ')'

	return text
}

menu.submenu(shopsButtonText, 'shops', shops)

menu.simpleButton(buttonText(emojis.mall + emojis.underConstruction, 'menu.mall'), 'mallJoinHint', {
	doFunc: async ctx => ctx.answerCbQuery(emojis.underConstruction + 'soon…')
})

function applicantEmoji(ctx: any): string {
	const session = ctx.session as Session
	return session.applicants.length > 0 ? emojis.applicantsAvailable : emojis.applicantsEmpty
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

function skillEmoji(ctx: any): string {
	const {skillQueue} = ctx.session as Session
	return (skillQueue && skillQueue.length > 0 ? '' : emojis.shopProductsEmpty) + emojis.skill
}

menu.submenu(buttonText(skillEmoji, 'menu.skill'), 'skill', skills, {
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
