import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Session, Persist} from '../../lib/types'
import {Skill} from '../../lib/types/skills'

import {currentLevel, skillUpgradeEndTimestamp, isSimpleSkill, categorySkillSpecificLevel, canAddToSkillQueue, entriesInSkillQueue, levelAfterSkillQueue} from '../../lib/game-math/skill'

import {addSkillToQueue} from '../../lib/game-logic/skills'

import {countdownHourMinute} from '../../lib/interface/formatted-time'
import {emojis} from '../../lib/interface/emojis'
import {infoHeader} from '../../lib/interface/formatted-strings'
import {menuPhoto, buttonText} from '../../lib/interface/menu'
import {skillQueueString} from '../../lib/interface/skill'

import {createHelpMenu, helpButtonText} from '../help'

function fromCtx(ctx: any): {skill: Skill; category?: string} {
	const skill = ctx.match[1]
	const category = ctx.match[2]

	return {
		skill,
		category
	}
}

function menuText(ctx: any): string {
	const session = ctx.session as Session
	const persist = ctx.persist as Persist
	const {skill, category} = fromCtx(ctx)

	const level = isSimpleSkill(skill) ? currentLevel(persist.skills, skill) : categorySkillSpecificLevel(persist.skills, skill, category!)
	const inQueue = entriesInSkillQueue(session.skillQueue || [], skill, category)
	const afterQueueLevel = levelAfterSkillQueue(persist.skills, session.skillQueue || [], skill, category)

	let text = ''
	text += infoHeader(ctx.wd.r(`skill.${skill}`), {
		titlePrefix: emojis.skill + (emojis[skill] || '')
	})
	text += '\n\n'

	if (category) {
		text += infoHeader(ctx.wd.r(category))
		text += '\n\n'
	}

	text += ctx.wd.r('skill.level').label()
	text += ': '
	text += level
	if (inQueue > 0) {
		text += ` + ${inQueue}`
	}

	text += '\n'

	text += ctx.wd.r('action.research').label()
	text += ': '
	text += countdownHourMinute(skillUpgradeEndTimestamp(afterQueueLevel, 0))
	text += ' '
	text += ctx.wd.r('unit.hour').label()
	text += '\n'

	text += '\n'
	text += skillQueueString(ctx, session.skillQueue || [])

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto(ctx => `skill.${fromCtx(ctx).skill}`)
})

menu.button(buttonText(emojis.skill, 'action.research'), 'research', {
	hide: (ctx: any) => {
		const {skillQueue} = ctx.session as Session
		const now = Date.now() / 1000
		return !canAddToSkillQueue(skillQueue || [], now)
	},
	doFunc: (ctx: any) => {
		const session = ctx.session as Session
		const persist = ctx.persist as Persist
		const now = Math.floor(Date.now() / 1000)

		if (!session.skillQueue) {
			session.skillQueue = []
		}

		if (!canAddToSkillQueue(session.skillQueue, now)) {
			return
		}

		const {skill, category} = fromCtx(ctx)
		addSkillToQueue(session.skillQueue, persist.skills, skill, category, now)
	}
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r(`skill.${fromCtx(ctx).skill}`).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.skills'))

export default menu
