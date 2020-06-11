import {Context} from '../types'
import {Person} from '../types/people'
import {Skills} from '../types/skills'

import {applicantSeats, secondsBetweenApplicants, daysUntilRetirement} from '../game-math/applicant'
import {currentLevel} from '../game-math/skill'

import {emojis} from './emojis'
import {formatInt} from './format-number'
import {labeledValue, labeledInt} from './formatted-strings'

export async function applicantInfluencesPart(ctx: Context, skills: Skills, applicants: number, showExplanation: boolean): Promise<string> {
	const applicantSeatsLevel = currentLevel(skills, 'applicantSeats')
	const maxSeats = applicantSeats(skills)

	const applicantSpeedLevel = currentLevel(skills, 'applicantSpeed')
	const interval = secondsBetweenApplicants(skills)

	const healthCareLevel = currentLevel(skills, 'healthCare')
	const retirementDays = daysUntilRetirement(skills).max

	let text = ''
	text += emojis.seat
	text += labeledValue(await ctx.wd.reader('other.seat'), `${applicants} / ${maxSeats}${emojis.seat}`)
	if (showExplanation && applicantSeatsLevel > 0) {
		text += '  '
		text += emojis.skill
		text += labeledInt(await ctx.wd.reader('skill.applicantSeats'), applicantSeatsLevel)
	}

	text += '+1'
	text += emojis.person
	text += ' / '
	text += formatInt(interval)
	text += ' '
	text += (await ctx.wd.reader('unit.second')).label()
	text += '\n'
	if (showExplanation && applicantSpeedLevel > 0) {
		text += '  '
		text += emojis.skill
		text += labeledInt(await ctx.wd.reader('skill.applicantSpeed'), applicantSpeedLevel)
	}

	text += emojis.retirement
	text += labeledValue(
		await ctx.wd.reader('person.retirement'),
		`≤${formatInt(retirementDays)} ${(await ctx.wd.reader('unit.day')).label()}`
	)
	if (showExplanation && healthCareLevel > 0) {
		text += '  '
		text += emojis.skill
		text += labeledInt(await ctx.wd.reader('skill.healthCare'), healthCareLevel)
	}

	return text
}

export function applicantButtonEmoji(applicants: Person[]): string {
	return applicants.length > 0 ? emojis.applicantsAvailable : emojis.applicantsEmpty
}
