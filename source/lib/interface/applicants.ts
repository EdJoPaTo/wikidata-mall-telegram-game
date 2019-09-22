import {Person} from '../types/people'
import {Skills} from '../types/skills'

import {applicantSeats, secondsBetweenApplicants, daysUntilRetirement, getRefinedState} from '../game-math/applicant'
import {currentLevel} from '../game-math/skill'

import {emojis} from './emojis'
import {formatInt} from './format-number'

export function applicantInfluencesPart(ctx: any, skills: Skills, applicants: number, showExplanation: boolean): string {
	const applicantSeatsLevel = currentLevel(skills, 'applicantSeats')
	const maxSeats = applicantSeats(skills)

	const applicantSpeedLevel = currentLevel(skills, 'applicantSpeed')
	const interval = secondsBetweenApplicants(skills)

	const healthCareLevel = currentLevel(skills, 'healthCare')
	const retirementDays = daysUntilRetirement(skills).max

	let text = ''
	text += emojis.seat
	text += ctx.wd.r('other.seat').label()
	text += ': '
	text += applicants
	text += ' / '
	text += maxSeats
	text += emojis.seat
	text += '\n'
	if (showExplanation && applicantSeatsLevel > 0) {
		text += '  '
		text += emojis.skill
		text += ctx.wd.r('skill.applicantSeats').label()
		text += ': '
		text += applicantSeatsLevel
		text += '\n'
	}

	text += '+1'
	text += emojis.person
	text += ' / '
	text += formatInt(interval)
	text += ' '
	text += ctx.wd.r('unit.second').label()
	text += '\n'
	if (showExplanation && applicantSpeedLevel > 0) {
		text += '  '
		text += emojis.skill
		text += ctx.wd.r('skill.applicantSpeed').label()
		text += ': '
		text += applicantSpeedLevel
		text += '\n'
	}

	text += emojis.retirement
	text += ctx.wd.r('person.retirement').label()
	text += ': '
	text += '≤'
	text += formatInt(retirementDays)
	text += ' '
	text += ctx.wd.r('unit.day').label()
	text += '\n'
	if (showExplanation && healthCareLevel > 0) {
		text += '  '
		text += emojis.skill
		text += ctx.wd.r('skill.healthCare').label()
		text += ': '
		text += healthCareLevel
		text += '\n'
	}

	return text
}

export function applicantButtonEmoji(applicants: Person[], now: number): string {
	const relevant = applicants
		.filter(o => o.type !== 'refined' || getRefinedState(o, now) !== 'student')
	return relevant.length > 0 ? emojis.applicantsAvailable : emojis.applicantsEmpty
}
