import test, {ExecutionContext} from 'ava'

import {Skills} from '../../source/lib/types/skills'

import {applicantSeats, secondsBetweenApplicants, daysUntilRetirement} from '../../source/lib/game-math/applicant'

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

test('secondsBetweenApplicants level 0', secondsBetweenApplicantsMacro, 0, 480)
test('secondsBetweenApplicants level 5', secondsBetweenApplicantsMacro, 5, 80)
test('secondsBetweenApplicants level 9', secondsBetweenApplicantsMacro, 9, 48)
test('secondsBetweenApplicants level 14', secondsBetweenApplicantsMacro, 14, 32)
test('secondsBetweenApplicants level 24', secondsBetweenApplicantsMacro, 24, 19.2)

function daysUntilRetirementMacro(t: ExecutionContext, healthCareLevel: number, expectedMin: number, expectedMax: number): void {
	const skills: Skills = {healthCare: healthCareLevel}
	t.deepEqual(daysUntilRetirement(skills), {
		min: expectedMin,
		max: expectedMax
	})
}

test('daysUntilRetirement level 0', daysUntilRetirementMacro, 0, 0, 6)
test('daysUntilRetirement level 5', daysUntilRetirementMacro, 5, 0, 11)
test('daysUntilRetirement level 10', daysUntilRetirementMacro, 10, 0, 16)
test('daysUntilRetirement level 15', daysUntilRetirementMacro, 15, 0, 21)
test('daysUntilRetirement level 25', daysUntilRetirementMacro, 25, 0, 31)
