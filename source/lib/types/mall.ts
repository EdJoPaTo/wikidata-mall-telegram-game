import {Chat} from 'telegram-typings'

import {Person} from './people'

type MallId = number
type QNumber = string
type UnixTimestamp = number
type UserId = number

export interface Mall {
	applicants: Person[];
	attraction?: Attraction;
	chat: Chat;
	member: UserId[];
	money: number;
	production: ProductionPart[];
}

export interface ProductionPart {
	user: UserId;
	part: QNumber;
	finishTimestamp: UnixTimestamp;
}

export interface Attraction {
	item: QNumber;
	opening: UnixTimestamp;
	disasterKind: QNumber;
	disasterTimestamp: UnixTimestamp;
}

export interface MallProduction {
	competitionSince: UnixTimestamp;
	competitionUntil: UnixTimestamp;
	itemsProducedPerMall: Record<MallId, number>;
	itemToProduce?: QNumber;
	lastProducedItems: QNumber[];
	nextItemVote: Record<QNumber, UserId[]>;
}
