import test from 'ava'

import {Persist} from '../../source/lib/types'
import {SkillInTraining} from '../../source/lib/types/skills'

import handler from '../../source/lib/session-math/skills'

test('removes skills and all behind from queue when shop doesnt exist anymore', t => {
	const persist: Persist = {
		shops: [
			{
				id: 'Q5',
				opening: 0,
				personal: {},
				products: []
			}
		],
		skills: {}
	}
	const skillQueue: SkillInTraining[] = [
		{
			skill: 'applicantSeats',
			endTimestamp: 10
		},
		{
			skill: 'collector',
			category: 'Q5',
			endTimestamp: 20
		},
		{
			skill: 'collector',
			category: 'Q42',
			endTimestamp: 30
		},
		{
			skill: 'collector',
			category: 'Q5',
			endTimestamp: 40
		}
	]

	const session: any = {skillQueue}

	handler(session, persist, 0)

	t.deepEqual(session.skillQueue, [{
		skill: 'applicantSeats',
		endTimestamp: 10
	}, {
		skill: 'collector',
		category: 'Q5',
		endTimestamp: 20
	}])
})

test('removes nothing when all shops still exist', t => {
	const persist: Persist = {
		shops: [
			{
				id: 'Q5',
				opening: 0,
				personal: {},
				products: []
			}
		],
		skills: {}
	}
	const skillQueue: SkillInTraining[] = [
		{
			skill: 'applicantSeats',
			endTimestamp: 10
		},
		{
			skill: 'collector',
			category: 'Q5',
			endTimestamp: 20
		}
	]

	const session: any = {skillQueue}

	handler(session, persist, 0)

	t.deepEqual(session.skillQueue, [{
		skill: 'applicantSeats',
		endTimestamp: 10
	}, {
		skill: 'collector',
		category: 'Q5',
		endTimestamp: 20
	}])
})
