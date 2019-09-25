import {RawObjectStorage, RawObjectInMemoryFile} from '@edjopato/datastore'

import {MallProduction} from '../types/mall'

const data: RawObjectStorage<MallProduction> = new RawObjectInMemoryFile<MallProduction>('persist/mall-production.json')

export async function get(): Promise<MallProduction> {
	const current = await data.get()
	return current || {
		competitionSince: 0,
		competitionUntil: Number.MAX_SAFE_INTEGER,
		itemToProduce: 'Q20873979',
		itemsProducedPerMall: {}
	}
}

export async function set(value: MallProduction): Promise<void> {
	return data.set(value)
}
