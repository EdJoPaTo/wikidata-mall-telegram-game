import {Applicants} from './people'
import {Mall} from './mall'
import {Shop} from './shop'
import {Skills} from './skills'

// Contains things that are stored outside of the session
export interface Persist {
	applicants: Applicants;
	mall?: Mall;
	shops: Shop[];
	skills: Skills;
}
