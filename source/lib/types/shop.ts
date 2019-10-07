import {Person, Talent} from './people'

type UnixTimestamp = number
type QNumber = string

export interface Product {
	id: QNumber;
	itemsInStore: number;
	itemTimestamp: UnixTimestamp;
}

export type Personal = Record<Talent, Person | undefined>

export interface Shop {
	id: QNumber;
	opening: UnixTimestamp;
	personal: Personal;
	products: Product[];
}

export interface Construction {
	possibleShops: QNumber[];
	timestamp: UnixTimestamp;
}
