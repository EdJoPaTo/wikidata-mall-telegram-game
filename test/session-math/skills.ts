import test from 'ava'

import {Persist} from '../../source/lib/types'
import {SkillInTraining} from '../../source/lib/types/skills'

import * as handler from '../../source/lib/session-math/skills'

test('does not crash when there is no queue', t => {
	const persist: Persist = {
		applicants: {
			list: [],
			timestamp: 0
		},
		shops: [],
		skills: {}
	}

	const session: any = {skillQueue: []}
	t.notThrows(() => {
		handler.startup(session, persist)
	})
	t.notThrows(() => handler.incomeUntil(session))
	t.notThrows(() => {
		handler.incomeLoop(session, persist, 0)
	})
})

test('removes skills and all behind from queue when shop doesnt exist anymore', t => {
	const persist: Persist = {
		applicants: {
			list: [],
			timestamp: 0
		},
		shops: [
			{
				id: 'Q5',
				opening: 0,
				personal: {
					purchasing: undefined,
					selling: undefined,
					storage: undefined
				},
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

	handler.startup(session, persist)

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
		applicants: {
			list: [],
			timestamp: 0
		},
		shops: [
			{
				id: 'Q5',
				opening: 0,
				personal: {
					purchasing: undefined,
					selling: undefined,
					storage: undefined
				},
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

	handler.startup(session, persist)
	handler.incomeLoop(session, persist, 0)

	t.deepEqual(session.skillQueue, [{
		skill: 'applicantSeats',
		endTimestamp: 10
	}, {
		skill: 'collector',
		category: 'Q5',
		endTimestamp: 20
	}])
})

test('skills simple skill when time is up', t => {
	const persist: Persist = {
		applicants: {
			list: [],
			timestamp: 0
		},
		shops: [
			{
				id: 'Q5',
				opening: 0,
				personal: {
					purchasing: undefined,
					selling: undefined,
					storage: undefined
				},
				products: []
			}
		],
		skills: {}
	}
	const skillQueue: SkillInTraining[] = [
		{
			skill: 'applicantSeats',
			endTimestamp: 10
		}
	]

	const session: any = {skillQueue}

	handler.incomeLoop(session, persist, 20)

	t.deepEqual(persist.skills, {
		applicantSeats: 1
	})
})

test('skills category skill when time is up', t => {
	const persist: Persist = {
		applicants: {
			list: [],
			timestamp: 0
		},
		shops: [
			{
				id: 'Q5',
				opening: 0,
				personal: {
					purchasing: undefined,
					selling: undefined,
					storage: undefined
				},
				products: []
			}
		],
		skills: {}
	}
	const skillQueue: SkillInTraining[] = [
		{
			skill: 'collector',
			category: 'Q5',
			endTimestamp: 10
		}
	]

	const session: any = {skillQueue}

	handler.incomeLoop(session, persist, 20)

	t.deepEqual(persist.skills, {
		collector: {
			Q5: 1
		}
	})
})

test('incomeUntil without queue', t => {
	const session: any = {skillQueue: []}
	t.is(handler.incomeUntil(session), Number.POSITIVE_INFINITY)
})

test('incomeUntil without skill', t => {
	const skillQueue: SkillInTraining[] = []
	const session: any = {skillQueue}
	t.is(handler.incomeUntil(session), Number.POSITIVE_INFINITY)
})

test('incomeUntil with skill', t => {
	const skillQueue: SkillInTraining[] = [
		{
			skill: 'collector',
			category: 'Q5',
			endTimestamp: 10
		}
	]

	const session: any = {skillQueue}
	t.is(handler.incomeUntil(session), 10)
})
