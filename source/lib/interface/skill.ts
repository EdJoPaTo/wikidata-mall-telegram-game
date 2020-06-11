import WikidataEntityReader from 'wikidata-entity-reader'
import WikidataEntityStore from 'wikidata-entity-store'

import {Context} from '../types'
import {SkillInTraining} from '../types/skills'

import {countdownHourMinute} from './formatted-time'
import {emojis} from './emojis'

export function skillQueueString(ctx: Context, skillQueue: readonly SkillInTraining[]): string {
	const now = Date.now() / 1000
	if (skillQueue.length === 0) {
		return ''
	}

	let text = ''
	text += '*'
	text += ctx.wd.reader('skill.training').label()
	text += '*'
	text += '\n'

	text += skillQueue
		.map(o => skillQueueEntryString(ctx, o, now))
		.join('\n')

	text += '\n\n'
	return text
}

function skillQueueEntryString(ctx: Context, skillInTraining: SkillInTraining, now: number): string {
	const {skill, category, endTimestamp} = skillInTraining
	let text = ''
	text += emojis[skill] || ''
	text += ctx.wd.reader(`skill.${skill}`).label()

	if (category) {
		text += ' '
		text += '('
		text += ctx.wd.reader(category).label()
		text += ')'
	}

	text += '\n'
	text += '  '
	text += emojis.countdown
	text += countdownHourMinute(endTimestamp - now)
	text += ' '
	text += ctx.wd.reader('unit.hour').label()

	return text
}

export function skillFinishedNotificationString(skillInTraining: SkillInTraining, entityStore: WikidataEntityStore, locale: string | undefined): string {
	const {skill, category} = skillInTraining

	let text = ''
	text += emojis[skill] || ''
	text += new WikidataEntityReader(entityStore.entity(`skill.${skill}`), locale).label()

	if (category) {
		text += ' '
		text += '('
		text += new WikidataEntityReader(entityStore.entity(category), locale).label()
		text += ')'
	}

	return text
}
