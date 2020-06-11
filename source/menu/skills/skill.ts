import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../../lib/types'
import {Skill} from '../../lib/types/skills'

import {currentLevel, skillUpgradeEndTimestamp, isSimpleSkill, categorySkillSpecificLevel, canAddToSkillQueue, entriesInSkillQueue, levelAfterSkillQueue} from '../../lib/game-math/skill'

import {addSkillToQueue} from '../../lib/game-logic/skills'

import {countdownHourMinute} from '../../lib/interface/formatted-time'
import {emojis} from '../../lib/interface/emojis'
import {infoHeader} from '../../lib/interface/formatted-strings'
import {buttonText, backButtons, bodyPhoto} from '../../lib/interface/menu'
import {skillQueueString} from '../../lib/interface/skill'

import {createHelpMenu, helpButtonText} from '../help'

function fromCtx(ctx: Context): {skill: Skill; category?: string} {
	const skill = ctx.match![1] as Skill
	const category = ctx.match?.[2]

	return {
		skill,
		category
	}
}

function menuBody(ctx: Context): Body {
	const {skill, category} = fromCtx(ctx)

	const level = isSimpleSkill(skill) ? currentLevel(ctx.persist.skills, skill) : categorySkillSpecificLevel(ctx.persist.skills, skill, category!)
	const inQueue = entriesInSkillQueue(ctx.session.skillQueue, skill, category)
	const afterQueueLevel = levelAfterSkillQueue(ctx.persist.skills, ctx.session.skillQueue, skill, category)

	let text = ''
	const reader = ctx.wd.reader(`skill.${skill}`)
	text += infoHeader(reader, {
		titlePrefix: emojis.skill + (emojis[skill] || '')
	})

	if (category) {
		text += infoHeader(ctx.wd.reader(category))
	}

	text += ctx.wd.reader('skill.level').label()
	text += ': '
	text += level
	if (inQueue > 0) {
		text += ` + ${inQueue}`
	}

	text += '\n'

	text += ctx.wd.reader('action.research').label()
	text += ': '
	text += countdownHourMinute(skillUpgradeEndTimestamp(afterQueueLevel, 0))
	text += ' '
	text += ctx.wd.reader('unit.hour').label()
	text += '\n'

	text += '\n'
	text += skillQueueString(ctx, ctx.session.skillQueue)

	return {
		...bodyPhoto(reader),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

menu.interact(buttonText(emojis.skill, 'action.research'), 'research', {
	hide: ctx => {
		const {skillQueue} = ctx.session
		const now = Date.now() / 1000
		return !canAddToSkillQueue(skillQueue, now)
	},
	do: ctx => {
		const now = Math.floor(Date.now() / 1000)

		if (!ctx.session.skillQueue) {
			ctx.session.skillQueue = []
		}

		if (!canAddToSkillQueue(ctx.session.skillQueue, now)) {
			return
		}

		const {skill, category} = fromCtx(ctx)
		addSkillToQueue(ctx.session.skillQueue, ctx.persist.skills, skill, category, now)
		return '.'
	}
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	ctx => ctx.wd.reader(`skill.${fromCtx(ctx).skill}`).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.skills'))

menu.manualRow(backButtons)
