import {Skills} from '../types/skills'

import {applicantSeats, secondsBetweenApplicants, maxDaysUntilRetirement} from '../game-math/applicant'
import {currentLevel} from '../game-math/skill'

import {emojis} from './emojis'
import {formatInt} from './format-number'

export function applicantInfluencesPart(ctx: any, skills: Skills, applicants: number, hideExplanationMath: boolean): string {
	const applicantSeatsLevel = currentLevel(skills, 'applicantSeats')
	const maxSeats = applicantSeats(skills)

	const applicantSpeedLevel = currentLevel(skills, 'applicantSpeed')
	const interval = secondsBetweenApplicants(skills)

	const healthCareLevel = currentLevel(skills, 'healthCare')
	const retirementDays = maxDaysUntilRetirement(skills)

	let text = ''
	text += emojis.seat
	text += ctx.wd.r('other.seat').label()
	text += ': '
	text += applicants
	text += ' / '
	text += maxSeats
	text += emojis.seat
	text += '\n'
	if (!hideExplanationMath && applicantSeatsLevel > 0) {
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
	if (!hideExplanationMath && applicantSpeedLevel > 0) {
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
	if (!hideExplanationMath && healthCareLevel > 0) {
		text += '  '
		text += emojis.skill
		text += ctx.wd.r('skill.healthCare').label()
		text += ': '
		text += healthCareLevel
		text += '\n'
	}

	return text
}
