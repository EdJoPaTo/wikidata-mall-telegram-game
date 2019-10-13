import {Skills} from '../types/skills'

import {categorySkillSpecificLevel} from '../game-math/skill'

import * as wdShops from '../wikidata/shops'

import {emojis} from './emojis'

export function constructionSuffix(skills: Skills, qNumber: string): string {
	const entries: string[] = []

	const level = categorySkillSpecificLevel(skills, 'collector', qNumber)
	if (level > 0) {
		entries.push(`${level}${emojis.collector}`)
	}

	const potentialProducts = wdShops.productPotential(qNumber)
	entries.push(`${potentialProducts}${emojis.potentialProducts}`)

	return `(${entries.join(', ')})`
}
