import {Applicants} from './people'
import {Mall} from './mall'
import {Shop} from './shop'
import {Skills, SkillInTraining} from './skills'
import {Stats} from './stats'

type UnixTimestamp = number

/* eslint @typescript-eslint/camelcase: warn */

export type LeaderboardView = 'returnOnInvestment' | 'sellPerMinute' | 'collector'
export const LEADERBOARD_VIEWS: LeaderboardView[] = ['returnOnInvestment', 'sellPerMinute', 'collector']

// Contains smaller things only relevant to a specific player
export interface Session {
	__wikibase_language_code?: string;
	gameStarted: UnixTimestamp;
	hideExplanationMath?: true;
	leaderboardView?: LeaderboardView;
	money: number;
	page?: number;
	showAllLanguages?: true;
	skillQueue?: SkillInTraining[];
	stats: Stats;
	timeZone?: string;
}

// Contains things that are stored outside of the session
export interface Persist {
	applicants: Applicants;
	shops: Shop[];
	skills: Skills;
	mall?: Mall;
}
