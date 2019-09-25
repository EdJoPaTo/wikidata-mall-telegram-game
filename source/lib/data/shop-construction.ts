import {Construction} from '../types/shop'

import {SimpleStorage, InMemoryFile} from './datastore'

const data: SimpleStorage<Construction> = new InMemoryFile<Construction>('persist/shop-construction.json')

export default data

export async function get(): Promise<Construction | undefined> {
	return data.get()
}

export async function set(construction: Construction): Promise<void> {
	return data.set(construction)
}
