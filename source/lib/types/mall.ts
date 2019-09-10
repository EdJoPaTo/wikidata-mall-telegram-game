import {Chat} from 'telegram-typings'

import {Dictionary} from '../js-helper/dictionary'

type UserId = number
type UnixTimestamp = number

export interface Mall {
	// TODO: add attraction
	// attraction?: string;
	member: UserId[];
	money: number;
	chat: Chat;
	partsProducedBy?: Dictionary<UserId>;
	productionFinishes?: UnixTimestamp;
}

export interface MallProduction {
	competitionUntil: UnixTimestamp;
	itemsProducedPerMall: Dictionary<number>;
	itemToProduce: string;
}
