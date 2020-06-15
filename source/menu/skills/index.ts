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

async function simpleSkillInfo(ctx: Context, skills: Skills, skill: SimpleSkill): Promise<{emoji: string; label: string; level: number}> {
	return {
		emoji: emojis[skill],
		label: (await ctx.wd.reader(`skill.${skill}`)).label(),
		level: currentLevel(skills, skill)
	}
}

async function categorySkillInfo(ctx: Context, skills: Skills, skill: CategorySkill): Promise<{emoji: string; label: string; hours: number}> {
	return {
		emoji: emojis[skill],
		label: (await ctx.wd.reader(`skill.${skill}`)).label(),
		hours: categorySkillHoursInvested(skills, skill)
	}
}

async function menuBody(ctx: Context): Promise<Body> {
	const {__wikibase_language_code: locale} = ctx.session

	const hourLabel = (await ctx.wd.reader('unit.hour')).label()

	let text = ''
	const reader = await ctx.wd.reader('menu.skill')
	text += infoHeader(reader, {titlePrefix: emojis.skill})

	const simpleSkillInfos = await Promise.all(SIMPLE_SKILLS.map(async o => simpleSkillInfo(ctx, ctx.persist.skills, o)))
	const simpleSkillParts = simpleSkillInfos
		.sort((a, b) => a.label.localeCompare(b.label, locale === 'wikidatan' ? 'en' : locale))
		.map(o => `${o.emoji}${o.label}: ${o.level}`)

	const categorySkillInfos = await Promise.all(CATEGORY_SKILLS.map(async o => categorySkillInfo(ctx, ctx.persist.skills, o)))
	const categorySkillParts = categorySkillInfos
		.sort((a, b) => a.label.localeCompare(b.label, locale === 'wikidatan' ? 'en' : locale))
		.map(o => `${o.emoji}${o.label}: ${o.hours} ${hourLabel}`)

	if (simpleSkillParts.length + categorySkillParts.length > 0) {
		text += '*'
		text += (await ctx.wd.reader('skill.level')).label()
		text += '*'
		text += '\n'

		text += simpleSkillParts.join('\n')
		text += '\n\n'

		text += categorySkillParts.join('\n')
		text += '\n\n'
	}

	text += await skillQueueString(ctx, ctx.session.skillQueue)

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

async function skillOptions(ctx: Context, skills: readonly Skill[]): Promise<Record<string, string>> {
	const {__wikibase_language_code: locale} = ctx.session
	const readers = await Promise.all(skills.map(async o => ctx.wd.reader(`skill.${o}`)))
	const labels: Record<string, string> = {}
	for (const [i, reader] of readers.entries()) {
		const key = skills[i]
		labels[key] = reader.label()
	}

	const orderedKeys = sortDictKeysByStringValues(labels, locale === 'wikidatan' ? 'en' : locale)

	for (const key of skills) {
		const emoji = emojis[key]
		if (emoji) {
			labels[key] = emoji + ' ' + labels[key]
		}
	}

	return recreateDictWithGivenKeyOrder(labels, orderedKeys)
}

menu.chooseIntoSubmenu('simple', async ctx => skillOptions(ctx, SIMPLE_SKILLS), skillMenu, {
	columns: 2
})

menu.chooseIntoSubmenu('c', async ctx => skillOptions(ctx, CATEGORY_SKILLS), skillSelectCategory, {
	columns: 2
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	async ctx => (await ctx.wd.reader('menu.skill')).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.skills'))

menu.manualRow(backButtons)
