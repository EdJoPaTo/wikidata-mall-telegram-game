type QNumber = string
type UnixTimestamp = number

export interface Person {
	name: Name;
	type: PersonType;
	hobby: QNumber;
	seatProtectionUntil?: UnixTimestamp;
	retirementTimestamp: UnixTimestamp;
	talents: Talents;
}

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
