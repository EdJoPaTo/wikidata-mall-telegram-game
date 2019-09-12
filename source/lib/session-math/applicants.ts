import {Session, Persist} from '../types'

import {secondsBetweenApplicants, applicantSeats} from '../game-math/applicant'

import {createApplicant} from '../game-logic/applicant'

export default function calcApplicants(session: Session, persist: Persist, now: number): void {
	if (!session.applicants) {
		session.applicants = []
		session.applicantTimestamp = now
	}

	retireWaitingApplicants(session, now)
	addWaitingApplicants(session, persist, now)
}

function retireWaitingApplicants(session: Session, now: number): void {
	session.applicants = session.applicants.filter(person => person.retirementTimestamp > now)
}

function addWaitingApplicants(session: Session, persist: Persist, now: number): void {
	const interval = secondsBetweenApplicants(persist.skills)
	const secondsSinceLastApplicant = now - session.applicantTimestamp
	const possibleApplicants = Math.floor(secondsSinceLastApplicant / interval)
	if (possibleApplicants <= 0) {
		return
	}

	const maxSeats = applicantSeats(persist.skills)
	const freeApplicantSeats = maxSeats - session.applicants.length
	const creatableApplicants = Math.min(possibleApplicants, freeApplicantSeats)
	const newTimestamp = session.applicantTimestamp + (creatableApplicants * interval)

	for (let i = 0; i < creatableApplicants; i++) {
		session.applicants.push(
			createApplicant(persist.skills, now)
		)
	}

	// Ensure timer is still running when there are free seats.
	// If not reset the timer to now
	session.applicantTimestamp = Math.floor(maxSeats - session.applicants.length > 0 ? newTimestamp : now)
}
