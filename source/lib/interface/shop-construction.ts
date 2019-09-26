import {Skills} from '../types/skills'

import {categorySkillSpecificLevel} from '../game-math/skill'

import {emojis} from './emojis'

export function collectorSuffix(skills: Skills, qNumber: string): string {
	const level = categorySkillSpecificLevel(skills, 'collector', qNumber)
	if (!level) {
		return ''
	}

	return `(${level}${emojis.collector})`
}
