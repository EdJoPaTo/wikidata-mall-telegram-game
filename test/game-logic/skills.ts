import test from 'ava'

import {Skills, SkillInTraining} from '../../source/lib/types/skills'

import {addSkillToQueue, increaseLevelByOne} from '../../source/lib/game-logic/skills'

const emptySkills: Skills = {}
const exampleSkills: Skills = {
	applicantSpeed: 2,
	collector: {
		Q2: 5,
		Q5: 3
	}
}

test('addSkillToQueue simple into empty', t => {
	const skills: Skills = {}
	const queue: SkillInTraining[] = []
	addSkillToQueue(queue, skills, 'healthCare', undefined, 0)
	t.deepEqual(queue, [
		{
			skill: 'healthCare',
			category: undefined,
			endTimestamp: 3600
		}
	])
})

test('addSkillToQueue complex into empty', t => {
	const skills: Skills = {}
	const queue: SkillInTraining[] = []
	addSkillToQueue(queue, skills, 'collector', 'Q42', 0)
	t.deepEqual(queue, [
		{
			skill: 'collector',
			category: 'Q42',
			endTimestamp: 3600
		}
	])
})

test('addSkillToQueue with different skill before', t => {
	const skills: Skills = {}
	const queue: SkillInTraining[] = [{
		skill: 'logistics',
		endTimestamp: 400
	}]
	addSkillToQueue(queue, skills, 'healthCare', undefined, 666)
	t.deepEqual(queue, [
		{
			skill: 'logistics',
			endTimestamp: 400
		},
		{
			skill: 'healthCare',
			category: undefined,
			endTimestamp: 4000
		}
	])
})

test('addSkillToQueue with same skill before', t => {
	const skills: Skills = {}
	const queue: SkillInTraining[] = [{
		skill: 'healthCare',
		endTimestamp: 400
	}]
	addSkillToQueue(queue, skills, 'healthCare', undefined, 666)

	t.deepEqual(queue, [
		{
			skill: 'healthCare',
			endTimestamp: 400
		},
		{
			skill: 'healthCare',
			category: undefined,
			endTimestamp: 400 + 7200
		}
	])
})

test('increaseLevelByOne categoryless not yet trained', t => {
	const skills: Skills = JSON.parse(JSON.stringify(emptySkills))
	increaseLevelByOne(skills, 'applicantSpeed')
	t.is(skills.applicantSpeed, 1)
})

test('increaseLevelByOne categoryless trained', t => {
	const skills: Skills = JSON.parse(JSON.stringify(exampleSkills))
	increaseLevelByOne(skills, 'applicantSpeed')
	t.is(skills.applicantSpeed, 3)
})

test('increaseLevelByOne with category never trained', t => {
	const skills: Skills = JSON.parse(JSON.stringify(emptySkills))
	increaseLevelByOne(skills, 'collector', 'Q5')
	t.deepEqual(skills.collector, {
		Q5: 1
	})
})

test('increaseLevelByOne with category not yet trained', t => {
	const skills: Skills = JSON.parse(JSON.stringify(exampleSkills))
	increaseLevelByOne(skills, 'collector', 'Q42')
	// eslint-disable-next-line @typescript-eslint/dot-notation
	t.is(skills.collector?.['Q42'], 1)
})

test('increaseLevelByOne with category trained', t => {
	const skills: Skills = JSON.parse(JSON.stringify(exampleSkills))
	increaseLevelByOne(skills, 'collector', 'Q5')
	// eslint-disable-next-line @typescript-eslint/dot-notation
	t.is(skills.collector?.['Q5'], 4)
})
