import {Composer} from 'telegraf'

import groupLogic from './group-logic'

const bot = new Composer()

bot.use((groupLogic as any).middleware())

export default bot
