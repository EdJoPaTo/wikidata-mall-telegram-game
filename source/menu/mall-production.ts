import {markdown as format} from 'telegram-format'
import TelegrafInlineMenu from 'telegraf-inline-menu'
import WikidataEntityStore from 'wikidata-entity-store'

import * as mallProduction from '../lib/data/mall-production'
import * as userInfo from '../lib/data/user-info'
import * as userMalls from '../lib/data/malls'

import {getParts} from '../lib/wikidata/production'

import {preloadWithParts} from '../lib/game-logic/mall-production'

import {buttonText, menuPhoto} from '../lib/interface/menu'
import {emojis} from '../lib/interface/emojis'
import {infoHeader, labeledFloat} from '../lib/interface/formatted-strings'

async function menuText(ctx: any): Promise<string> {
	const mall = await userMalls.getMallOfUser(ctx.from.id)
	if (!mall) {
		throw new Error('You are not part of a mall')
	}

	const memberInfos = (await Promise.all(
		mall.member.map(async o => userInfo.get(o))
	))

	const {itemToProduce, competitionUntil} = await mallProduction.get()
	console.log('competition until', competitionUntil, new Date(competitionUntil * 1000))
	const store = ctx.wd.store as WikidataEntityStore
	console.log('preloadWithParts', 'menuText')
	await preloadWithParts(store, itemToProduce)

	let text = ''
	text += infoHeader(ctx.wd.r('mall.production'), {titlePrefix: emojis.production})
	text += '\n\n'

	text += labeledFloat(ctx.wd.r('other.money'), mall.money, emojis.currency)
	text += '\n\n'

	text += emojis.production
	text += format.bold(
		ctx.wd.r((await mallProduction.get()).itemToProduce).label()
	)
	text += '\n\n'

	if (mall.productionFinishes) {
		text += 'TODO: in production until… '
		text += mall.productionFinishes
		text += '\n\n'
	}

	if (mall.partsProducedBy) {
		text += 'TODO: currently some people are produing parts…'
		text += '\n```\n'
		text += JSON.stringify(mall.partsProducedBy)
		text += '\n```\n'

		text += '\n```\n'
		text += JSON.stringify(memberInfos)
		text += '\n```\n'
		text += '\n\n'
	}

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto('mall.production')
})

async function currentlyNotTakenParts(ctx: any): Promise<string[]> {
	const mall = await userMalls.getMallOfUser(ctx.from.id)
	if (!mall) {
		throw new Error('You are not part of a mall')
	}

	if (mall.productionFinishes) {
		return []
	}

	const {itemToProduce} = await mallProduction.get()
	const store = ctx.wd.store as WikidataEntityStore
	console.log('preloadWithParts', 'currentlyNotProducedParts')
	await preloadWithParts(store, itemToProduce)
	const parts = getParts(ctx.wd.r(itemToProduce))
	const takenParts = Object.keys(mall.partsProducedBy || {})
	const notTakenParts = parts
		.filter(o => !takenParts.includes(o))
	return notTakenParts
}

menu.select('take', currentlyNotTakenParts, {
	columns: 2,
	textFunc: (ctx: any, key) => ctx.wd.r(key).label(),
	setFunc: async (ctx: any, key) => {
		const mall = await userMalls.getMallOfUser(ctx.from.id)
		if (!mall) {
			throw new Error('You are not part of a mall')
		}

		if (mall.productionFinishes) {
			return
		}

		if (!mall.partsProducedBy) {
			mall.partsProducedBy = {}
		}

		if (mall.partsProducedBy[key]) {
			return
		}

		mall.partsProducedBy[key] = ctx.from.id
	}
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r('mall.production').url()
)

export default menu
