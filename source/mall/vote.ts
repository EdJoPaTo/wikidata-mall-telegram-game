import {Composer, Extra} from 'telegraf'
import {markdown as format} from 'telegram-format'
import WikidataEntityReader from 'wikidata-entity-reader'
import WikidataEntityStore from 'wikidata-entity-store'

import {canProduce} from '../lib/game-logic/mall-production'

import {getParts} from '../lib/wikidata/production'
import * as mallProduction from '../lib/data/mall-production'

import {emojis} from '../lib/interface/emojis'

const bot = new Composer()

bot.on('message', async (ctx, next) => {
	const captionText = ctx.message!.caption
	const messageText = ctx.message!.text
	const totalText = `${messageText} ${captionText}`

	const regex = /Q[1-9]\d*/gi

	let match: RegExpExecArray | null
	const found: string[] = []
	while ((match = regex.exec(totalText)) !== null) {
		found.push(match[0])
	}

	if (found.length === 0) {
		return next && next()
	}

	const store = (ctx as any).wd.store as WikidataEntityStore
	await store.updateQNumbers(found, 1)

	const allReader = found
		.map(o => (ctx as any).wd.r(o) as WikidataEntityReader)

	const allParts = allReader.flatMap(o => getParts(o))
	await store.preloadQNumbers(...allParts)

	const currentProduction = await mallProduction.get()

	const valid: string[] = []
	let text = ''
	for (const o of allReader) {
		let line = ''
		if (currentProduction.itemToProduce === o.qNumber()) {
			line += emojis.requireAttention + emojis.production
		} else if (currentProduction.lastProducedItems.includes(o.qNumber())) {
			line += emojis.requireAttention + emojis.old
		} else if (!canProduce(o)) {
			line += emojis.requireAttention + emojis.part
		} else if (o.images().length === 0) {
			line += emojis.requireAttention + emojis.image
		} else if (Object.keys(currentProduction.nextItemVote).includes(o.qNumber())) {
			line += emojis.vote
		} else {
			line += emojis.yes
			valid.push(o.qNumber())
		}

		line += format.url(o.label(), o.url())

		text += line + '\n'
	}

	if (valid.length > 0) {
		for (const o of valid) {
			currentProduction.nextItemVote[o] = []
		}

		await mallProduction.set(currentProduction)
	}

	return ctx.replyWithMarkdown(text, Extra.inReplyTo(ctx.message!.message_id).webPreview(false) as any)
})

export default bot
