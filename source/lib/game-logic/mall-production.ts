import randomItem from 'random-item'

type QNumber = string

export function decideVoteWinner(vote: Record<QNumber, unknown[]>): QNumber | undefined {
	const entries = Object.keys(vote)
	const mostVotes = Math.max(...entries.map(o => vote[o].length))
	if (mostVotes < 2) {
		return
	}

	const possible = entries.filter(o => vote[o].length >= mostVotes)
	return randomItem(possible)
}
