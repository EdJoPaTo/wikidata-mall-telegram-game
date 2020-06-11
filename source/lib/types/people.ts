type QNumber = string
type UnixTimestamp = number

export interface Person {
	readonly name: Name;
	readonly type: PersonType;
	readonly hobby: QNumber;
	seatProtectionUntil?: UnixTimestamp;
	readonly retirementTimestamp: UnixTimestamp;
	readonly talents: Talents;
}

export interface Name {
	readonly given: string;
	readonly family: string;
}

export type PersonType =
	'alien'|
	'christmasAngel' |
	'halloweenPumpkin' |
	'refined' |
	'robot' |
	'temporary'

export const PERSON_EVENT_TYPES: readonly PersonType[] = [
	'christmasAngel',
	'halloweenPumpkin'
]

export type Talent = 'purchasing' | 'selling' | 'storage'
export type Talents = Readonly<Record<Talent, number>>
export const TALENTS: readonly Talent[] = ['purchasing', 'selling', 'storage']

export interface Applicants {
	list: Person[];
	timestamp: UnixTimestamp;
}
