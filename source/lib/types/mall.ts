import {Chat} from 'telegram-typings'

import {Dictionary} from '../js-helper/dictionary'

import {Person} from './people'

type UserId = number
type UnixTimestamp = number

export interface Mall {
	applicants: Person[];
	// TODO: add attraction
	// attraction?: string;
	chat: Chat;
	member: UserId[];
	money: number;
	partsProducedBy?: Dictionary<UserId>;
	productionFinishes?: UnixTimestamp;
}

export interface MallProduction {
	competitionSince: UnixTimestamp;
	competitionUntil: UnixTimestamp;
	itemsProducedPerMall: Dictionary<number>;
	itemToProduce: string;
}
