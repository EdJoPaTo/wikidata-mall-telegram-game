import {Skill, Skills, SkillInTraining, SimpleSkill, CategorySkill, SkillCategorySet} from '../types/skills'

import {skillUpgradeEndTimestamp, levelAfterSkillQueue, isCategorySkill, isSimpleSkill} from '../game-math/skill'

export function addSkillToQueue(queue: SkillInTraining[], skills: Skills, skill: Skill, category: string | undefined, now: number): void {
	const skillBefore = queue.slice(-1)[0]
	const level = levelAfterSkillQueue(skills, queue, skill, category)
	const endTimestamp = skillUpgradeEndTimestamp(level, skillBefore ? skillBefore.endTimestamp : now)
	queue.push({
		skill,
		category,
		endTimestamp
	})
}

/**
 * Increases the given skills level in `skills`.
 */
export function increaseLevelByOne(skills: Skills, skill: SimpleSkill): void
export function increaseLevelByOne(skills: Skills, skill: CategorySkill, category: string): void
export function increaseLevelByOne(skills: Skills, skill: SimpleSkill | CategorySkill, category?: string): void {
	if (!skills[skill]) {
		if (isCategorySkill(skill)) {
			const initialContent: SkillCategorySet = {}
			initialContent[category!] = 0
			skills[skill] = initialContent as any
		} else {
			const initialContent = 0
			skills[skill] = initialContent as any
		}
	}

	if (isSimpleSkill(skill)) {
		skills[skill]! += 1
		return
	}

	const content = skills[skill]!

	if (!content[category!]) {
		content[category!] = 0
	}

	content[category!]++
}
