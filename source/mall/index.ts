import {Composer} from 'telegraf'

import applicants from './applicants'
import groupLogic from './group-logic'

const bot = new Composer()

bot.use(groupLogic.middleware())

bot.use(applicants.middleware())

export default bot
