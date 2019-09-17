type QNumber = string
type UnixTimestamp = number

interface BasicPerson {
	name: Name;
	type: PersonType;
	hobby: QNumber;
	retirementTimestamp: UnixTimestamp;
	talents: Talents;
}

export interface TemporaryWorker extends BasicPerson {
	type: 'temporary';
}

export interface RefinedWorker extends BasicPerson {
	type: 'refined';
	graduation?: UnixTimestamp;
}

export type Person = TemporaryWorker | RefinedWorker

export interface Name {
	given: string;
	family: string;
}

export type PersonType = 'refined' | 'temporary'
export type RefinedState = 'toddler' | 'student' | 'finished'

export interface Talents {
	purchasing: number;
	selling: number;
	storage: number;
}

export type TalentName = keyof Talents
export const TALENTS: TalentName[] = ['purchasing', 'selling', 'storage']

export interface Applicants {
	list: Person[];
	timestamp: UnixTimestamp;
}
