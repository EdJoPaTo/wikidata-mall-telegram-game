type QNumber = string
type UnixTimestamp = number

interface BasicPerson {
	name: Name;
	type: PersonType;
	hobby: QNumber;
	seatProtectionUntil?: UnixTimestamp;
	retirementTimestamp: UnixTimestamp;
	talents: Talents;
	nextTalentModification?: UnixTimestamp;
}

export interface SimpleWorker extends BasicPerson {
	type: Exclude<PersonType, 'refined'>;
}

export interface RefinedWorker extends BasicPerson {
	type: 'refined';
	graduation?: UnixTimestamp;
}

export type Person = SimpleWorker | RefinedWorker

export interface Name {
	given: string;
	family: string;
}

export type PersonType = 'refined' | 'temporary' | 'robot' | 'alien'
export type RefinedState = 'toddler' | 'student' | 'finished'

export type Talent = 'purchasing' | 'selling' | 'storage'
export type Talents = Record<Talent, number>
export const TALENTS: Talent[] = ['purchasing', 'selling', 'storage']

export interface Applicants {
	list: Person[];
	timestamp: UnixTimestamp;
}
