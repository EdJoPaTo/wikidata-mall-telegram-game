import {Context} from '../types'
import {MiniWikidataStore} from '../notification/types'
import {SkillInTraining} from '../types/skills'

import {countdownHourMinute} from './formatted-time'
import {emojis} from './emojis'

export async function skillQueueString(ctx: Context, skillQueue: readonly SkillInTraining[]): Promise<string> {
	const now = Date.now() / 1000
	if (skillQueue.length === 0) {
		return ''
	}

	let text = ''
	text += '*'
	text += (await ctx.wd.reader('skill.training')).label()
	text += '*'
	text += '\n'

	const queueEntries = await Promise.all(skillQueue.map(async o => skillQueueEntryString(ctx, o, now)))
	text += queueEntries.join('\n')

	text += '\n\n'
	return text
}

async function skillQueueEntryString(ctx: Context, skillInTraining: SkillInTraining, now: number): Promise<string> {
	const {skill, category, endTimestamp} = skillInTraining
	let text = ''
	text += emojis[skill] || ''
	text += (await ctx.wd.reader(`skill.${skill}`)).label()

	if (category) {
		text += ' '
		text += '('
		text += await ctx.wd.reader(category).then(r => r.label())
		text += ')'
	}

	text += '\n'
	text += '  '
	text += emojis.countdown
	text += countdownHourMinute(endTimestamp - now)
	text += ' '
	text += (await ctx.wd.reader('unit.hour')).label()

	return text
}

export async function skillFinishedNotificationString(skillInTraining: SkillInTraining, entityStore: MiniWikidataStore, locale: string): Promise<string> {
	const {skill, category} = skillInTraining

	let text = ''
	text += emojis[skill] || ''
	text += await entityStore.reader(`skill.${skill}`, locale).then(r => r.label())

	if (category) {
		text += ' '
		text += '('
		text += await entityStore.reader(category, locale).then(r => r.label())
		text += ')'
	}

	return text
}
