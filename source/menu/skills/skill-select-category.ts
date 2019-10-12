import {markdown as format} from 'telegram-format'
import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Session, Persist} from '../../lib/types'
import {Skills, CategorySkill} from '../../lib/types/skills'

import {categorySkillSpecificLevel} from '../../lib/game-math/skill'

import {buttonText} from '../../lib/interface/menu'
import {emojis} from '../../lib/interface/emojis'
import {infoHeader, labeledInt} from '../../lib/interface/formatted-strings'
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
	return labeledInt(ctx.wd.r(category), categorySkillSpecificLevel(skills, skill, category))
		.trim()
}

function categoriesOfLevelLine(ctx: any, level: number, categories: string[], locale: string | undefined): string {
	let text = ''
	text += '*'
	text += ctx.wd.r('skill.level').label()
	text += ' '
	text += level
	text += '*'
	text += ' ('
	text += categories.length
	text += ')'
	text += ': '
	text += categories
		.map(o => ctx.wd.r(o).label() as string)
		.sort((a, b) => a.localeCompare(b, locale === 'wikidatanish' ? 'en' : locale))
		.slice(0, 30) // Prevent Message too long
		.join(', ')

	if (categories.length > 30) {
		text += ', …'
	}

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

	const shops = persist.shops.map(o => o.id)
	const categoriesSeenBefore = Object.keys(persist.skills[skill] || {})
		.filter(o => !shops.includes(o))
	const seenBeforeGroupedByLevel = categoriesSeenBefore
		.reduce((coll: Record<number, string[]>, add) => {
			const level = categorySkillSpecificLevel(persist.skills, skill, add)
			if (!coll[level]) {
				coll[level] = []
			}

			coll[level].push(add)
			return coll
		}, {})

	if (shops.length + categoriesSeenBefore.length > 0) {
		text += format.bold(ctx.wd.r('menu.shop').label())
		text += '\n'
		text +=	shops
			.map(o => categorySkillLine(ctx, persist.skills, skill, o))
			.join('\n')
		text += '\n\n'

		if (categoriesSeenBefore.length > 0) {
			text += format.bold(ctx.wd.r('skill.seenBefore').label())
			text += '\n'
			text +=	Object.keys(seenBeforeGroupedByLevel)
				.map(o => Number(o))
				.map(o => categoriesOfLevelLine(ctx, o, seenBeforeGroupedByLevel[o], locale))
				.join('\n')
			text += '\n\n'
		}
	}

	text += skillQueueString(ctx, session.skillQueue)

	return text
}

const menu = new TelegrafInlineMenu(menuText)

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
