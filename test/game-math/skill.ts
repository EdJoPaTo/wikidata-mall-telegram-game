import test from 'ava'

import {Skills} from '../../source/lib/types/skills'

import {currentLevel, collectorTotalLevel, skillUpgradeTimeNeeded, increaseLevelByOne, skillUpgradeEndTimestamp} from '../../source/lib/game-math/skill'

const emptySkills: Skills = {}
const exampleSkills: Skills = {
	applicantSpeed: 2,
	collector: {
		Q2: 5,
		Q5: 3
	}
}

test('currentLevel 0 from unset productless skill', t => {
	t.is(currentLevel(emptySkills, 'applicantSpeed'), 0)
})

test('currentLevel 0 from unset product skill', t => {
	t.is(currentLevel(emptySkills, 'collector', 'Q42'), 0)
})

test('currentLevel 0 from product skill when not yet trained', t => {
	t.is(currentLevel(exampleSkills, 'collector', 'Q42'), 0)
})

test('currentLevel correct on productless skill', t => {
	t.is(currentLevel(exampleSkills, 'applicantSpeed'), 2)
})

test('currentLevel correct on product skill', t => {
	t.is(currentLevel(exampleSkills, 'collector', 'Q5'), 3)
})

test('currentLevel throws error when required product is not specified', t => {
	t.throws(() => currentLevel(exampleSkills, 'collector'), /product has to be specified/)
})

test('collectorTotalLevel no collector yet', t => {
	t.is(collectorTotalLevel(emptySkills), 0)
})

test('collectorTotalLevel example', t => {
	t.is(collectorTotalLevel(exampleSkills), 8)
})

test('skillUpgradeTimeNeeded examples', t => {
	t.is(skillUpgradeTimeNeeded(0), 1)
	t.is(skillUpgradeTimeNeeded(1), 2)
	t.is(skillUpgradeTimeNeeded(2), 3)
	t.is(skillUpgradeTimeNeeded(3), 5)
	t.is(skillUpgradeTimeNeeded(4), 8)
})

test('skill', t => {
	t.is(skillUpgradeEndTimestamp(0, 10000000), 10000000 + (60 * 60 * 1))
	t.is(skillUpgradeEndTimestamp(1, 10000000), 10000000 + (60 * 60 * 2))
	t.is(skillUpgradeEndTimestamp(2, 10000000), 10000000 + (60 * 60 * 3))
})

test('increaseLevelByOne productless not yet trained', t => {
	const skills: Skills = JSON.parse(JSON.stringify(emptySkills))
	increaseLevelByOne(skills, 'applicantSpeed')
	t.is(skills.applicantSpeed, 1)
})

test('increaseLevelByOne productless trained', t => {
	const skills: Skills = JSON.parse(JSON.stringify(exampleSkills))
	increaseLevelByOne(skills, 'applicantSpeed')
	t.is(skills.applicantSpeed, 3)
})

test('increaseLevelByOne with product never trained', t => {
	const skills: Skills = JSON.parse(JSON.stringify(emptySkills))
	increaseLevelByOne(skills, 'collector', 'Q5')
	t.deepEqual(skills.collector, {
		Q5: 1
	})
})

test('increaseLevelByOne with product not yet trained', t => {
	const skills: Skills = JSON.parse(JSON.stringify(exampleSkills))
	increaseLevelByOne(skills, 'collector', 'Q42')
	t.is(skills.collector!.Q42, 1)
})

test('increaseLevelByOne with product trained', t => {
	const skills: Skills = JSON.parse(JSON.stringify(exampleSkills))
	increaseLevelByOne(skills, 'collector', 'Q5')
	t.is(skills.collector!.Q5, 4)
})