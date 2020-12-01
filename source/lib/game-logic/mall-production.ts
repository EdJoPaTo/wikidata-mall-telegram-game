import randomItem from 'random-item'

type QNumber = string

export function decideVoteWinner(vote: Record<QNumber, unknown[]>): QNumber | undefined {
	const mostVotes = Math.max(...Object.values(vote).map(votes => votes.length))
	if (mostVotes < 2) {
		return
	}

	const possible = Object.entries(vote)
		.filter(([_item, votes]) => votes.length >= mostVotes)
		.map(([item]) => item)
	return randomItem(possible)
}
