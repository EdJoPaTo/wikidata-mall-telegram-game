import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../../lib/types'
import {Skills, CategorySkill, SimpleSkill, SIMPLE_SKILLS, CATEGORY_SKILLS, Skill} from '../../lib/types/skills'

import {sortDictKeysByStringValues, recreateDictWithGivenKeyOrder} from '../../lib/js-helper/dictionary'

import {currentLevel, categorySkillHoursInvested} from '../../lib/game-math/skill'

import {emojis} from '../../lib/interface/emojis'
import {infoHeader} from '../../lib/interface/formatted-strings'
import {buttonText, bodyPhoto, backButtons} from '../../lib/interface/menu'
import {skillQueueString} from '../../lib/interface/skill'

import {createHelpMenu, helpButtonText} from '../help'

import {menu as skillMenu} from './skill'
import {menu as skillSelectCategory} from './skill-select-category'

function simpleSkillInfo(ctx: Context, skills: Skills, skill: SimpleSkill): {emoji: string; label: string; level: number} {
	return {
		emoji: emojis[skill],
		label: ctx.wd.reader(`skill.${skill}`).label(),
		level: currentLevel(skills, skill)
	}
}

function categorySkillInfo(ctx: Context, skills: Skills, skill: CategorySkill): {emoji: string; label: string; hours: number} {
	return {
		emoji: emojis[skill],
		label: ctx.wd.reader(`skill.${skill}`).label(),
		hours: categorySkillHoursInvested(skills, skill)
	}
}

function menuBody(ctx: Context): Body {
	const {__wikibase_language_code: locale} = ctx.session

	const hourLabel = ctx.wd.reader('unit.hour').label()

	let text = ''
	const reader = ctx.wd.reader('menu.skill')
	text += infoHeader(reader, {titlePrefix: emojis.skill})

	const simpleSkillParts = SIMPLE_SKILLS
		.map(o => simpleSkillInfo(ctx, ctx.persist.skills, o))
		.sort((a, b) => a.label.localeCompare(b.label, locale === 'wikidatanish' ? 'en' : locale))
		.map(o => `${o.emoji}${o.label}: ${o.level}`)

	const categorySkillParts = CATEGORY_SKILLS
		.map(o => categorySkillInfo(ctx, ctx.persist.skills, o))
		.sort((a, b) => a.label.localeCompare(b.label, locale === 'wikidatanish' ? 'en' : locale))
		.map(o => `${o.emoji}${o.label}: ${o.hours} ${hourLabel}`)

	if (simpleSkillParts.length + categorySkillParts.length > 0) {
		text += '*'
		text += ctx.wd.reader('skill.level').label()
		text += '*'
		text += '\n'

		text += simpleSkillParts.join('\n')
		text += '\n\n'

		text += categorySkillParts.join('\n')
		text += '\n\n'
	}

	text += skillQueueString(ctx, ctx.session.skillQueue)

	return {
		...bodyPhoto(reader),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

menu.interact(buttonText(emojis.clearSkillQueue, 'skill.queue'), 'clearQueue', {
	hide: ctx => {
		const {skillQueue} = ctx.session
		return skillQueue.length <= 1
	},
	do: ctx => {
		ctx.session.skillQueue = ctx.session.skillQueue
			.filter((_, i) => i === 0)
		return '.'
	}
})

function skillOptions(ctx: Context, skills: readonly Skill[]): Record<string, string> {
	const {__wikibase_language_code: locale} = ctx.session
	const labels: Record<string, string> = {}
	for (const key of skills) {
		labels[key] = ctx.wd.reader(`skill.${key}`).label()
	}

	const orderedKeys = sortDictKeysByStringValues(labels, locale === 'wikidatanish' ? 'en' : locale)

	for (const key of skills) {
		const emoji = emojis[key]
		if (emoji) {
			labels[key] = emoji + ' ' + labels[key]
		}
	}

	return recreateDictWithGivenKeyOrder(labels, orderedKeys)
}

menu.chooseIntoSubmenu('simple', ctx => skillOptions(ctx, SIMPLE_SKILLS), skillMenu, {
	columns: 2
})

menu.chooseIntoSubmenu('c', ctx => skillOptions(ctx, CATEGORY_SKILLS), skillSelectCategory, {
	columns: 2
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	ctx => ctx.wd.reader('menu.skill').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.skills'))

menu.manualRow(backButtons)
