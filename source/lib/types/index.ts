import {Person} from './people'
import {Shop} from './shop'
import {Skills, SkillInTraining} from './skills'
import {Stats} from './stats'

type UnixTimestamp = number

/* eslint @typescript-eslint/camelcase: warn */

export type LeaderboardView = 'returnOnInvestment' | 'collector'
export const LEADERBOARD_VIEWS: LeaderboardView[] = ['returnOnInvestment', 'collector']

// Contains smaller things only relevant to a specific player
export interface Session {
	__wikibase_language_code: string;
	applicants: Person[];
	applicantTimestamp: UnixTimestamp;
	gameStarted: UnixTimestamp;
	hideExplanationMath?: true;
	leaderboardView?: LeaderboardView;
	money: number;
	page?: number;
	showAllLanguages?: true;
	skillQueue?: SkillInTraining[];
	stats: Stats;
}

// Contains things that are stored outside of the session
export interface Persist {
	shops: Shop[];
	skills: Skills;
}
