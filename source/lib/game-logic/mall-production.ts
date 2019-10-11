import randomItem from 'random-item'
import WikidataEntityReader from 'wikidata-entity-reader'
import WikidataEntityStore from 'wikidata-entity-store'

import {DAY_IN_SECONDS, HOUR_IN_SECONDS} from '../math/timestamp-constants'

import {getParts} from '../wikidata/production'

type QNumber = string

export async function preloadWithParts(store: WikidataEntityStore, qNumber: QNumber, now: number): Promise<void> {
	await store.loadQNumbers(now - HOUR_IN_SECONDS, qNumber)
	const reader = new WikidataEntityReader(store.entity(qNumber))
	if (!canProduce(reader)) {
		return
	}

	const parts = getParts(reader)
	await store.loadQNumbers(now - DAY_IN_SECONDS, ...parts)
}

export function canProduce(item: WikidataEntityReader): boolean {
	const parts = getParts(item)
	return parts.length >= 3
}

export function decideVoteWinner(vote: Record<QNumber, unknown[]>): QNumber {
	const entries = Object.keys(vote)
	if (entries.length === 0) {
		return 'Q20873979'
	}

	const mostVotes = Math.max(...entries.map(o => vote[o].length))
	const possible = entries.filter(o => vote[o].length >= mostVotes)
	return randomItem(possible)
}
