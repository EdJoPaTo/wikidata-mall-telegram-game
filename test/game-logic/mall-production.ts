import test from 'ava'

import {decideVoteWinner} from '../../source/lib/game-logic/mall-production'

test('decideVoteWinner without votes', t => {
	t.is(decideVoteWinner({}), undefined)
})

test('decideVoteWinner most votes win', t => {
	const votes: Record<string, number[]> = {A: [1, 2], B: [3, 4, 5, 6], C: [7, 8, 9]}
	t.is(decideVoteWinner(votes), 'B')
})

test('decideVoteWinner items with less than two votes on items wont win', t => {
	const votes: Record<string, number[]> = {A: [1], B: [3], C: []}
	t.is(decideVoteWinner(votes), undefined)
})
