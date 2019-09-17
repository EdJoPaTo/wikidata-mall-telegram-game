import test, {ExecutionContext} from 'ava'

import {Skills} from '../../source/lib/types/skills'

import {applicantSeats, secondsBetweenApplicants, daysUntilRetirement, minutesUntilGraduation} from '../../source/lib/game-math/applicant'

function applicantSeatsMacro(t: ExecutionContext, applicantSeatsLevel: number, expected: number): void {
	const skills: Skills = {applicantSeats: applicantSeatsLevel}
	t.is(applicantSeats(skills), expected)
}

test('applicantSeats level 0', applicantSeatsMacro, 0, 1)
test('applicantSeats level 5', applicantSeatsMacro, 5, 6)
test('applicantSeats level 10', applicantSeatsMacro, 10, 11)
test('applicantSeats level 15', applicantSeatsMacro, 15, 16)
test('applicantSeats level 25', applicantSeatsMacro, 25, 26)

function secondsBetweenApplicantsMacro(t: ExecutionContext, applicantSpeedLevel: number, expected: number): void {
	const skills: Skills = {applicantSpeed: applicantSpeedLevel}
	t.is(secondsBetweenApplicants(skills), expected)
}

test('secondsBetweenApplicants level 0', secondsBetweenApplicantsMacro, 0, 300)
test('secondsBetweenApplicants level 5', secondsBetweenApplicantsMacro, 5, 50)
test('secondsBetweenApplicants level 9', secondsBetweenApplicantsMacro, 9, 30)
test('secondsBetweenApplicants level 14', secondsBetweenApplicantsMacro, 14, 20)
test('secondsBetweenApplicants level 24', secondsBetweenApplicantsMacro, 24, 12)

function daysUntilRetirementMacro(t: ExecutionContext, healthCareLevel: number, expectedMin: number, expectedMax: number): void {
	const skills: Skills = {healthCare: healthCareLevel}
	t.deepEqual(daysUntilRetirement(skills), {
		min: expectedMin,
		max: expectedMax
	})
}

test('daysUntilRetirement level 0', daysUntilRetirementMacro, 0, 1, 6)
test('daysUntilRetirement level 5', daysUntilRetirementMacro, 5, 1, 16)
test('daysUntilRetirement level 10', daysUntilRetirementMacro, 10, 1, 26)
test('daysUntilRetirement level 15', daysUntilRetirementMacro, 15, 1, 36)
test('daysUntilRetirement level 25', daysUntilRetirementMacro, 25, 1, 56)

test('minutesUntilGraduation', t => {
	t.deepEqual(minutesUntilGraduation(), {min: 2, max: 20})
})
