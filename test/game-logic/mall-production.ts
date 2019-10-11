import test from 'ava'

import {decideVoteWinner} from '../../source/lib/game-logic/mall-production'

test('decideVoteWinner without votes', t => {
	t.is(decideVoteWinner({}), 'Q20873979')
})

test('decideVoteWinner most votes win', t => {
	const votes: Record<string, number[]> = {A: [1, 2], B: [3, 4, 5, 6], C: [7, 8, 9]}
	t.is(decideVoteWinner(votes), 'B')
})
