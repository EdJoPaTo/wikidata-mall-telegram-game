type Dictionary<T> = {[key: string]: T}

const basic: Dictionary<string> = {
	achievement: '🏅',
	add: '➕',
	applicantsAvailable: '📬',
	applicantsEmpty: '📭',
	chat: '💭',
	close: '🛑',
	collector: '🧳',
	construction: '🏗',
	countdown: '⏲',
	currency: '📎',
	employmentTermination: '🔫',
	hobby: '💚',
	income: '📈',
	language: '🏳️‍🌈',
	magnetism: '🧲',
	mall: '🏬',
	noPerson: '🕳',
	opening: '🎈',
	person: '👤',
	purchasing: '🛒',
	recruitment: '👏',
	retirement: '👻',
	seat: '💺',
	selling: '🤝',
	shop: '🏪',
	shopProductsEmpty: '🥺',
	skill: '⚗️',
	skillFinished: '✅',
	stats: '📊',
	storage: '📦',
	underConstruction: '🚧',
	warning: '⚠️',
	wikidataItem: 'ℹ️',
	yes: '👍'
}

export const emojis: Dictionary<string> = {
	...basic,
	applicantSpeed: basic.applicantsAvailable,
	healthCare: basic.retirement,
	logistics: basic.shop,
	machinePress: basic.storage,
	metalScissors: basic.purchasing,
	packaging: basic.selling
}
