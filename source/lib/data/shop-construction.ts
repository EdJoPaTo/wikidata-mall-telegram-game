import {RawObjectStorage, RawObjectInMemoryFile} from '@edjopato/datastore'

import {Construction} from '../types/shop'

const data: RawObjectStorage<Construction> = new RawObjectInMemoryFile<Construction>('persist/shop-construction.json')

export default data

export async function get(): Promise<Construction | undefined> {
	return data.get()
}

export async function set(construction: Construction): Promise<void> {
	return data.set(construction)
}
