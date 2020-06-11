import {Person, Talent} from './people'

type UnixTimestamp = number
type QNumber = string

export interface Product {
	readonly id: QNumber;
	itemsInStore: number;
	itemTimestamp: UnixTimestamp;
}

export type Personal = Record<Talent, Person | undefined>

export interface Shop {
	readonly id: QNumber;
	readonly opening: UnixTimestamp;
	readonly personal: Personal;
	readonly products: Product[];
}

export interface Construction {
	possibleShops: QNumber[];
	timestamp: UnixTimestamp;
}
