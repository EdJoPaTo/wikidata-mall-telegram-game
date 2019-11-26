import {Applicants} from '../types/people'
import {Session, Persist} from '../types'
import {Skills} from '../types/skills'

import {secondsBetweenApplicants, applicantSeats} from '../game-math/applicant'

import {createApplicant} from '../game-logic/applicant'

export function before(session: Session, persist: Persist, now: number): void {
	// TODO: remove migration
	if ((session as any).applicantWaiting) {
		delete (session as any).applicantWaiting
	}

	if ((session as any).applicants) {
		delete (session as any).applicants
	}

	if ((session as any).applicantTimestamp) {
		delete (session as any).applicantTimestamp
	}

	retireWaitingApplicants(persist.applicants, now)
	addWaitingApplicants(persist.applicants, persist.skills, now)
}

function retireWaitingApplicants(applicants: Applicants, now: number): void {
	applicants.list = applicants.list.filter(person => person.retirementTimestamp > now)
}

function addWaitingApplicants(applicants: Applicants, skills: Skills, now: number): void {
	const interval = secondsBetweenApplicants(skills)
	const secondsSinceLastApplicant = now - applicants.timestamp
	const possibleApplicants = Math.floor(secondsSinceLastApplicant / interval)
	if (possibleApplicants <= 0) {
		return
	}

	const maxSeats = applicantSeats(skills)
	const freeApplicantSeats = maxSeats - applicants.list.length
	const creatableApplicants = Math.min(possibleApplicants, freeApplicantSeats)
	const newTimestamp = applicants.timestamp + (creatableApplicants * interval)

	for (let i = 0; i < creatableApplicants; i++) {
		applicants.list.push(
			createApplicant(skills, now)
		)
	}

	// Ensure timer is still running when there are free seats.
	// If not reset the timer to now
	applicants.timestamp = Math.floor(maxSeats - applicants.list.length > 0 ? newTimestamp : now)
}
