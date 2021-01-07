import {Skills, CategorySkill, SimpleSkill, SIMPLE_SKILLS, Skill, CATEGORY_SKILLS, SkillInTraining} from '../types/skills'

import {HOUR_IN_SECONDS} from '../math/timestamp-constants'
import * as fibonacci from '../math/fibonacci'

export function isSimpleSkill(skill: Skill): skill is SimpleSkill {
	return (SIMPLE_SKILLS as string[]).includes(skill)
}

export function isCategorySkill(skill: Skill): skill is CategorySkill {
	return (CATEGORY_SKILLS as string[]).includes(skill)
}

export function currentLevel(skills: Skills, skill: SimpleSkill): number {
	const content = skills[skill]
	if (!content) {
		return 0
	}

	return content
}

export function categorySkillCategories(skills: Skills, skill: CategorySkill): readonly string[] {
	return Object.keys(skills[skill] ?? {})
}

export function categorySkillSpecificLevel(skills: Skills, skill: CategorySkill, category: string): number {
	const content = skills[skill]
	if (!content) {
		return 0
	}

	return content[category] ?? 0
}

export function entriesInSkillQueue(queue: readonly SkillInTraining[], skill: Skill, category: string | undefined): number {
	return queue
		.filter(o => o.skill === skill && o.category === category)
		.length
}

export function levelAfterSkillQueue(skills: Skills, queue: readonly SkillInTraining[], skill: Skill, category: string | undefined): number {
	const levelBefore = isSimpleSkill(skill) ? currentLevel(skills, skill) : categorySkillSpecificLevel(skills, skill, category!)
	const entries = entriesInSkillQueue(queue, skill, category)
	return levelBefore + entries
}

/**
 * Calculates the time needed to upgrade a skill with this current level. Time is in hours
 * @returns time in hours
 */
export function skillUpgradeTimeNeeded(currentLevel: number): number {
	return fibonacci.cached(currentLevel + 2)
}

export function skillTimeNeededTillLevel(wantedLevel: number): number {
	let result = 0
	for (let i = 0; i < wantedLevel; i++) {
		result += skillUpgradeTimeNeeded(i)
	}

	return result
}

export function categorySkillHoursInvested(skills: Skills, skill: CategorySkill): number {
	return categorySkillCategories(skills, skill)
		.map(o => categorySkillSpecificLevel(skills, skill, o))
		.map(o => skillTimeNeededTillLevel(o))
		.reduce((a, b) => a + b, 0)
}

export function skillUpgradeEndTimestamp(currentLevel: number, startTimestamp: number): number {
	const hoursNeeded = skillUpgradeTimeNeeded(currentLevel)
	const secondsNeeded = hoursNeeded * HOUR_IN_SECONDS
	return startTimestamp + secondsNeeded
}

export function canAddToSkillQueue(queue: readonly SkillInTraining[], now: number): boolean {
	const hasToBeBefore = now + (HOUR_IN_SECONDS * 12)
	return queue.every(o => o.endTimestamp < hasToBeBefore)
}
