type QNumber = string
type UnixTimestamp = number

export interface Person {
	name: Name;
	hobby: QNumber;
	retirementTimestamp: UnixTimestamp;
	talents: Talents;
}

export interface Name {
	given: string;
	family: string;
}

export interface Talents {
	purchasing: number;
	selling: number;
	storage: number;
}

export type TalentName = keyof Talents
export const TALENTS: TalentName[] = ['purchasing', 'selling', 'storage']
