import {Composer} from 'telegraf'

import applicants from './applicants'
import groupLogic from './group-logic'
import vote from './vote'

const bot = new Composer()

bot.use((groupLogic as any).middleware())

bot.use((applicants as any).middleware())
bot.use((vote as any).middleware())

export default bot
