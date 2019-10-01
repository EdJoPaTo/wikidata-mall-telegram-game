import {Person, Talent} from './people'

type UnixTimestamp = number

export interface Product {
	id: string;
	itemsInStore: number;
	itemTimestamp: UnixTimestamp;
}

export type Personal = Record<Talent, Person | undefined>

export interface Shop {
	id: string;
	opening: UnixTimestamp;
	personal: Personal;
	products: Product[];
}

export interface Construction {
	possibleShops: string[];
	timestamp: UnixTimestamp;
}
