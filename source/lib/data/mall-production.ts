import {MallProduction} from '../types/mall'

import {InMemoryFile} from './datastore/in-memory-file'

const data = new InMemoryFile<MallProduction>('persist/mall-production.json')

export async function get(): Promise<MallProduction> {
	const current = await data.get()
	return current || {
		itemToProduce: 'Q20873979',
		competitionUntil: Infinity,
		itemsProducedPerMall: {}
	}
}

export async function set(value: MallProduction): Promise<void> {
	return data.set(value)
}
