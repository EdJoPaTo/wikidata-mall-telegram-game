import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Session, Persist} from '../../lib/types'
import {Skills, CategorySkill, SimpleSkill, SIMPLE_SKILLS, CATEGORY_SKILLS, Skill} from '../../lib/types/skills'

import {sortDictKeysByStringValues, recreateDictWithGivenKeyOrder} from '../../lib/js-helper/dictionary'

import {currentLevel, categorySkillHoursInvested} from '../../lib/game-math/skill'

import {emojis} from '../../lib/interface/emojis'
import {infoHeader} from '../../lib/interface/formatted-strings'
import {menuPhoto, buttonText} from '../../lib/interface/menu'
import {skillQueueString} from '../../lib/interface/skill'

import {createHelpMenu, helpButtonText} from '../help'

import skillMenu from './skill'
import skillSelectCategory from './skill-select-category'

function simpleSkillInfo(ctx: any, skills: Skills, skill: SimpleSkill): {emoji: string; label: string; level: number} {
	return {
		emoji: emojis[skill],
		label: ctx.wd.r(`skill.${skill}`).label(),
		level: currentLevel(skills, skill)
	}
}

function categorySkillInfo(ctx: any, skills: Skills, skill: CategorySkill): {emoji: string; label: string; hours: number} {
	return {
		emoji: emojis[skill],
		label: ctx.wd.r(`skill.${skill}`).label(),
		hours: categorySkillHoursInvested(skills, skill)
	}
}

function menuText(ctx: any): string {
	const session = ctx.session as Session
	const persist = ctx.persist as Persist
	const {__wikibase_language_code: locale} = session

	const hourLabel = ctx.wd.r('unit.hour').label()

	let text = ''
	text += infoHeader(ctx.wd.r('menu.skill'), {titlePrefix: emojis.skill})

	const simpleSkillParts = SIMPLE_SKILLS
		.map(o => simpleSkillInfo(ctx, persist.skills, o))
		.sort((a, b) => a.label.localeCompare(b.label, locale === 'wikidatanish' ? 'en' : locale))
		.map(o => `${o.emoji}${o.label}: ${o.level}`)

	const categorySkillParts = CATEGORY_SKILLS
		.map(o => categorySkillInfo(ctx, persist.skills, o))
		.sort((a, b) => a.label.localeCompare(b.label, locale === 'wikidatanish' ? 'en' : locale))
		.map(o => `${o.emoji}${o.label}: ${o.hours} ${hourLabel}`)

	if (simpleSkillParts.length + categorySkillParts.length > 0) {
		text += '*'
		text += ctx.wd.r('skill.level').label()
		text += '*'
		text += '\n'

		text += simpleSkillParts.join('\n')
		text += '\n\n'

		text += categorySkillParts.join('\n')
		text += '\n\n'
	}

	text += skillQueueString(ctx, session.skillQueue)

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto('menu.skill')
})

menu.button(buttonText(emojis.clearSkillQueue, 'skill.queue'), 'clearQueue', {
	hide: (ctx: any) => {
		const {skillQueue} = ctx.session as Session
		return skillQueue.length <= 1
	},
	doFunc: (ctx: any) => {
		const session = ctx.session as Session
		session.skillQueue = session.skillQueue
			.filter((_, i) => i === 0)
	}
})

function skillOptions(ctx: any, skills: readonly Skill[]): Record<string, string> {
	const {__wikibase_language_code: locale} = ctx.session as Session
	const labels: Record<string, string> = {}
	for (const key of skills) {
		labels[key] = ctx.wd.r(`skill.${key}`).label()
	}

	const orderedKeys = sortDictKeysByStringValues(labels, locale === 'wikidatanish' ? 'en' : locale)
	return recreateDictWithGivenKeyOrder(labels, orderedKeys)
}

menu.selectSubmenu('simple', ctx => skillOptions(ctx, SIMPLE_SKILLS), skillMenu, {
	columns: 2,
	prefixFunc: (_, key) => emojis[key] || ''
})

menu.selectSubmenu('c', ctx => skillOptions(ctx, CATEGORY_SKILLS), skillSelectCategory, {
	columns: 2,
	prefixFunc: (_, key) => emojis[key] || ''
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r('menu.skill').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.skills'))

export default menu
