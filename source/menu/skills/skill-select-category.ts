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

async function categorySkillLine(ctx: Context, skills: Skills, skill: CategorySkill, category: string): Promise<string> {
	return labeledInt(await ctx.wd.reader(category), categorySkillSpecificLevel(skills, skill, category))
		.trim()
}

async function categoriesOfLevelLine(ctx: Context, level: number, categories: string[], locale: string | undefined): Promise<string> {
	let text = ''
	text += '*'
	text += (await ctx.wd.reader('skill.level')).label()
	text += ' '
	text += level
	text += '*'
	text += ' ('
	text += categories.length
	text += ')'
	text += ': '

	const readers = await Promise.all(categories.map(async o => ctx.wd.reader(o)))
	text += readers
		.map(o => o.label())
		.sort((a, b) => a.localeCompare(b, locale === 'wikidatan' ? 'en' : locale))
		.slice(0, 30) // Prevent Message too long
		.join(', ')

	if (categories.length > 30) {
		text += ', …'
	}

	return text
}

async function menuBody(ctx: Context): Promise<Body> {
	const {__wikibase_language_code: locale} = ctx.session
	const {skill} = fromCtx(ctx)

	let text = ''
	text += infoHeader(await ctx.wd.reader(`skill.${skill}`), {
		titlePrefix: emojis.skill + (emojis[skill] || '')
	})

	const shops = ctx.persist.shops.map(o => o.id)
	const categoriesSeenBefore = Object.keys(ctx.persist.skills[skill] || {})
		.filter(o => !shops.includes(o))
	const seenBeforeGroupedByLevel = categoriesSeenBefore
		.reduce(arrayReduceGroupBy(o => categorySkillSpecificLevel(ctx.persist.skills, skill, o)), {})

	await ctx.wd.preload([...shops, ...categoriesSeenBefore])

	if (categoriesSeenBefore.length > 0) {
		const lines = await Promise.all(Object.keys(seenBeforeGroupedByLevel)
			.map(o => Number(o))
			.map(async o => categoriesOfLevelLine(ctx, o, seenBeforeGroupedByLevel[o], locale))
		)
		text += lines.join('\n')
		text += '\n\n'
	}

	text += format.bold(format.escape((await ctx.wd.reader('menu.shop')).label()))
	text += '\n'
	const lines = await Promise.all(shops.map(async o => categorySkillLine(ctx, ctx.persist.skills, skill, o)))
	text += lines.join('\n')
	text += '\n\n'

	text += await skillQueueString(ctx, ctx.session.skillQueue)

	return {text, parse_mode: 'Markdown'}
}

export const menu = new MenuTemplate<Context>(menuBody)

function shops(ctx: Context): string[] {
	return ctx.persist.shops.map(o => o.id)
}

menu.chooseIntoSubmenu('s', shops, skillMenu, {
	columns: 2,
	buttonText: async (ctx, key) => (await ctx.wd.reader(key)).label()
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	async ctx => (await ctx.wd.reader(`skill.${fromCtx(ctx).skill}`)).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.skills'))

menu.manualRow(backButtons)
