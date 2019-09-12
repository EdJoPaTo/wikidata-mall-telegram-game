import {Composer} from 'telegraf'

import * as applicants from './applicants'
import * as malls from './malls'
import * as shops from './shops'
import * as skills from './skills'
import * as userInfo from './user-info'
import * as userSessions from './user-sessions'

const bot = new Composer()

bot.use(applicants.middleware())
bot.use(malls.middleware())
bot.use(shops.middleware())
bot.use(skills.middleware())
bot.use(userInfo.middleware())
bot.use(userSessions.middleware())

export default bot
