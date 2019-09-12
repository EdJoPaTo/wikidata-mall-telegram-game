import {Person} from './people'

type UnixTimestamp = number

export interface Product {
	id: string;
	itemsInStore: number;
	itemTimestamp: UnixTimestamp;
}

export interface Personal {
	purchasing?: Person;
	selling?: Person;
	storage?: Person;
}

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
