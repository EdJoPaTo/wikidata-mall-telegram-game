import {markdown as format} from 'telegram-format'
import arrayReduceGroupBy from 'array-reduce-group-by'
import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../../lib/types'
import {Skills, CategorySkill} from '../../lib/types/skills'

import {categorySkillSpecificLevel} from '../../lib/game-math/skill'

import {buttonText, backButtons} from '../../lib/interface/menu'
import {emojis} from '../../lib/interface/emojis'
import {infoHeader, labeledInt} from '../../lib/interface/formatted-strings'
import {skillQueueString} from '../../lib/interface/skill'

import {createHelpMenu, helpButtonText} from '../help'

import {menu as skillMenu} from './skill'

function fromCtx(ctx: Context): {skill: CategorySkill} {
	const skill = ctx.match![1] as CategorySkill
	return {
		skill
	}
}

function categorySkillLine(ctx: Context, skills: Skills, skill: CategorySkill, category: string): string {
	return labeledInt(ctx.wd.reader(category), categorySkillSpecificLevel(skills, skill, category))
		.trim()
}

function categoriesOfLevelLine(ctx: Context, level: number, categories: string[], locale: string | undefined): string {
	let text = ''
	text += '*'
	text += ctx.wd.reader('skill.level').label()
	text += ' '
	text += level
	text += '*'
	text += ' ('
	text += categories.length
	text += ')'
	text += ': '
	text += categories
		.map(o => ctx.wd.reader(o).label())
		.sort((a, b) => a.localeCompare(b, locale === 'wikidatanish' ? 'en' : locale))
		.slice(0, 30) // Prevent Message too long
		.join(', ')

	if (categories.length > 30) {
		text += ', …'
	}

	return text
}

function menuBody(ctx: Context): Body {
	const {__wikibase_language_code: locale} = ctx.session
	const {skill} = fromCtx(ctx)

	let text = ''
	text += infoHeader(ctx.wd.reader(`skill.${skill}`), {
		titlePrefix: emojis.skill + (emojis[skill] || '')
	})

	const shops = ctx.persist.shops.map(o => o.id)
	const categoriesSeenBefore = Object.keys(ctx.persist.skills[skill] || {})
		.filter(o => !shops.includes(o))
	const seenBeforeGroupedByLevel = categoriesSeenBefore
		.reduce(arrayReduceGroupBy(o => categorySkillSpecificLevel(ctx.persist.skills, skill, o)), {})

	if (categoriesSeenBefore.length > 0) {
		text +=	Object.keys(seenBeforeGroupedByLevel)
			.map(o => Number(o))
			.map(o => categoriesOfLevelLine(ctx, o, seenBeforeGroupedByLevel[o], locale))
			.join('\n')
		text += '\n\n'
	}

	text += format.bold(format.escape(ctx.wd.reader('menu.shop').label()))
	text += '\n'
	text +=	shops
		.map(o => categorySkillLine(ctx, ctx.persist.skills, skill, o))
		.join('\n')
	text += '\n\n'

	text += skillQueueString(ctx, ctx.session.skillQueue)

	return text
}

export const menu = new MenuTemplate<Context>(menuBody)

function shops(ctx: Context): string[] {
	return ctx.persist.shops.map(o => o.id)
}

menu.chooseIntoSubmenu('s', shops, skillMenu, {
	columns: 2,
	buttonText: (ctx, key) => ctx.wd.reader(key).label()
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	ctx => ctx.wd.reader(`skill.${fromCtx(ctx).skill}`).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.skills'))

menu.manualRow(backButtons)
