import {Session, Persist} from '../types'

import {isSimpleSkill} from '../game-math/skill'

import {increaseLevelByOne} from '../game-logic/skills'

export default function applySkills(session: Session, persist: Persist, now: number): void {
	// TODO: remove migration
	if ((session as any).skillInTraining) {
		session.skillQueue = [
			(session as any).skillInTraining
		]
		delete (session as any).skillInTraining
	}

	if (session.skillQueue) {
		ensureCurrentlyTrainedSkillForShopHasItsShop(session, persist)
		applySkillWhenFinished(session, persist, now)
	}
}

function ensureCurrentlyTrainedSkillForShopHasItsShop(session: Session, persist: Persist): void {
	const existingShops = persist.shops.map(o => o.id)

	const endTimestampsWhichAreBad = session.skillQueue!
		.filter(o => o.category && !existingShops.includes(o.category))
		.map(o => o.endTimestamp)
	const allowedEndTimestamp = Math.min(...endTimestampsWhichAreBad)
	session.skillQueue = session.skillQueue!
		.filter(o => o.endTimestamp < allowedEndTimestamp)
}

function applySkillWhenFinished(session: Session, persist: Persist, now: number): void {
	for (const skillInTraining of session.skillQueue!) {
		const {skill, category, endTimestamp} = skillInTraining
		if (endTimestamp > now) {
			break
		}

		if (isSimpleSkill(skill)) {
			increaseLevelByOne(persist.skills, skill)
		} else {
			increaseLevelByOne(persist.skills, skill, category!)
		}
	}

	session.skillQueue = session.skillQueue!
		.filter(o => o.endTimestamp > now)
}
