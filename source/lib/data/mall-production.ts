import {RawObjectStorage, RawObjectInMemoryFile} from '@edjopato/datastore'

import {MallProduction} from '../types/mall'

const data: RawObjectStorage<MallProduction> = new RawObjectInMemoryFile<MallProduction>('persist/mall-production.json')

export async function get(): Promise<MallProduction> {
	const current = await data.get()

	// TODO: remove migration
	if (current) {
		if (!current.lastProducedItems) {
			current.lastProducedItems = []
		}

		if (!current.nextItemVote) {
			current.nextItemVote = {}
		}
	}

	return current || {
		competitionSince: 0,
		competitionUntil: Number.MAX_SAFE_INTEGER,
		itemsProducedPerMall: {},
		itemToProduce: 'Q20873979',
		lastProducedItems: [],
		nextItemVote: {}
	}
}

export async function set(value: MallProduction): Promise<void> {
	return data.set(value)
}
