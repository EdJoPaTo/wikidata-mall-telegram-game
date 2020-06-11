import {Context as TelegrafContext} from 'telegraf'
import {I18n} from 'telegraf-i18n'
import {MiddlewareProperty} from 'telegraf-wikibase'

import {Session} from './session'
import {Persist} from './persist'

export interface Context extends TelegrafContext {
	readonly i18n: I18n;
	readonly persist: Persist;
	readonly session: Session;
	readonly wd: MiddlewareProperty;
}
