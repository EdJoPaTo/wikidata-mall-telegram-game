import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Session, Persist} from '../../lib/types'
import {Skills, CategorySkill} from '../../lib/types/skills'

import {currentLevel, categorySkillSpecificLevel} from '../../lib/game-math/skill'

import {emojis} from '../../lib/interface/emojis'
import {infoHeader} from '../../lib/interface/formatted-strings'
import {menuPhoto, buttonText} from '../../lib/interface/menu'
import {skillQueueString} from '../../lib/interface/skill'

import {createHelpMenu, helpButtonText} from '../help'

import skillMenu from './skill'

function fromCtx(ctx: any): {skill: CategorySkill} {
	const skill = ctx.match[1]
	return {
		skill
	}
}

function categorySkillLine(ctx: any, skills: Skills, skill: CategorySkill, category: string): string {
	let text = ''
	text += ctx.wd.r(category).label()
	text += ': '
	text += categorySkillSpecificLevel(skills, skill, category)
	return text
}

function menuText(ctx: any): string {
	const session = ctx.session as Session
	const persist = ctx.persist as Persist
	const {__wikibase_language_code: locale} = session
	const {skill} = fromCtx(ctx)

	let text = ''
	text += infoHeader(ctx.wd.r(`skill.${skill}`), {
		titlePrefix: emojis.skill + (emojis[skill] || '')
	})
	text += '\n\n'

	const shops = persist.shops.map(o => o.id)
	const skillCategories = Object.keys(persist.skills[skill] || {})
		.filter(o => !shops.includes(o))

	if (shops.length + skillCategories.length > 0) {
		text += '*'
		text += ctx.wd.r('skill.level').label()
		text += '*'
		text += ' ('
		text += currentLevel(persist.skills, 'collector')
		text += ')'
		text += '\n'

		text +=	shops
			.map(o => categorySkillLine(ctx, persist.skills, skill, o))
			.join('\n')
		text += '\n\n'

		if (skillCategories.length > 0) {
			text +=	skillCategories
				.map(o => categorySkillLine(ctx, persist.skills, skill, o))
				.sort((a, b) => a.localeCompare(b, locale === 'wikidatanish' ? 'en' : locale))
				.join('\n')
			text += '\n\n'
		}
	}

	text += skillQueueString(ctx, session.skillQueue || [])

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto(ctx => `skill.${fromCtx(ctx).skill}`)
})

function shops(ctx: any): string[] {
	const persist = ctx.persist as Persist
	return persist.shops.map(o => o.id)
}

menu.selectSubmenu('s', shops, skillMenu, {
	columns: 2,
	textFunc: (ctx: any, key) => ctx.wd.r(key).label()
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r(`skill.${fromCtx(ctx).skill}`).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.skills'))

export default menu
