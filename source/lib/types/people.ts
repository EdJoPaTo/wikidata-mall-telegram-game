type QNumber = string
type UnixTimestamp = number

interface BasicPerson {
	name: Name;
	type: PersonType;
	hobby: QNumber;
	seatProtectionUntil?: UnixTimestamp;
	retirementTimestamp: UnixTimestamp;
	talents: Talents;
}

export interface SimpleWorker extends BasicPerson {
	type: Exclude<PersonType, 'refined' | 'robot'>;
}

export interface RefinedWorker extends BasicPerson {
	type: 'refined';
	graduation?: UnixTimestamp;
}

export interface RobotWorker extends BasicPerson {
	type: 'robot';
	tinkeredAmount?: number;
}

export type Person = SimpleWorker | RefinedWorker | RobotWorker

export interface Name {
	given: string;
	family: string;
}

export type PersonType =
	'alien'|
	'christmasAngel' |
	'halloweenPumpkin' |
	'refined' |
	'robot' |
	'temporary'

export type RefinedState = 'toddler' | 'student' | 'finished'

export const PERSON_EVENT_TYPES: PersonType[] = [
	'christmasAngel',
	'halloweenPumpkin'
]

export type Talent = 'purchasing' | 'selling' | 'storage'
export type Talents = Record<Talent, number>
export const TALENTS: Talent[] = ['purchasing', 'selling', 'storage']

export interface Applicants {
	list: Person[];
	timestamp: UnixTimestamp;
}
