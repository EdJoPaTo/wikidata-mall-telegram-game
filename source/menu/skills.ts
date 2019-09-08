import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Session, Persist} from '../lib/types'
import {Skills, CategorySkill, SimpleSkill, SIMPLE_SKILLS, CATEGORY_SKILLS, Skill} from '../lib/types/skills'

import {sortDictKeysByStringValues, recreateDictWithGivenKeyOrder} from '../lib/js-helper/dictionary'

import {currentLevel} from '../lib/game-math/skill'

import {emojis} from '../lib/interface/emojis'
import {infoHeader} from '../lib/interface/formatted-strings'
import {menuPhoto, buttonText} from '../lib/interface/menu'
import {skillQueueString} from '../lib/interface/skill'

import skillMenu from './skill'
import skillSelectCategory from './skill-select-category'

type Dictionary<T> = {[key: string]: T}

function skillInfo(ctx: any, skills: Skills, skill: SimpleSkill | CategorySkill): {emoji: string; label: string; level: number} {
	return {
		emoji: emojis[skill],
		label: ctx.wd.r(`skill.${skill}`).label(),
		level: currentLevel(skills, skill)
	}
}

function menuText(ctx: any): string {
	const session = ctx.session as Session
	const persist = ctx.persist as Persist
	const {__wikibase_language_code: locale} = session

	let text = ''
	text += infoHeader(ctx.wd.r('menu.skill'), {titlePrefix: emojis.skill})
	text += '\n\n'

	const simpleSkillParts = SIMPLE_SKILLS
		.map(o => skillInfo(ctx, persist.skills, o))
		.sort((a, b) => a.label.localeCompare(b.label, locale === 'wikidatanish' ? 'en' : locale))
		.map(o => `${o.emoji}${o.label}: ${o.level}`)

	const categorySkillParts = CATEGORY_SKILLS
		.map(o => skillInfo(ctx, persist.skills, o))
		.sort((a, b) => a.label.localeCompare(b.label, locale === 'wikidatanish' ? 'en' : locale))
		.map(o => `${o.emoji}${o.label}: ${o.level}`)

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

	text += skillQueueString(ctx, session.skillQueue || [])

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto('menu.skill')
})

function skillOptions(ctx: any, skills: Skill[]): Dictionary<string> {
	const {__wikibase_language_code: locale} = ctx.session as Session
	const labels: Dictionary<string> = {}
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

export default menu
