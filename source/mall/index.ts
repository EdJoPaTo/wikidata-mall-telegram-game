import {Composer} from 'telegraf'

import {Context} from '../lib/types'

import applicants from './applicants'
import groupLogic from './group-logic'

const bot = new Composer<Context>()

bot.use(groupLogic.middleware())

bot.use(applicants.middleware())

export default bot
