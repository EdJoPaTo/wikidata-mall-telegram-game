type Dictionary<T> = {[key: string]: T}

const basic: Dictionary<string> = {
	add: '➕',
	applicantsAvailable: '📬',
	applicantsEmpty: '📭',
	chat: '💭',
	clearSkillQueue: '❌',
	close: '🛑',
	collector: '🧳',
	construction: '🏗',
	countdown: '⏲',
	currency: '📎',
	door: '🚪',
	employmentTermination: '🔫',
	github: '🦑',
	graduation: '🎉',
	help: '🃏',
	hobbyDifferent: '❤️',
	hobbyMatch: '💚',
	income: '📈',
	language: '🏳️‍🌈',
	leaderboard: '🏆',
	magnetism: '🧲',
	mall: '🏬',
	noPerson: '🕳',
	person: '👤',
	purchasing: '🛒',
	recruitment: '👏',
	requireAttention: '🥺',
	retirement: '👻',
	seat: '💺',
	selling: '🤝',
	settings: '⚙️',
	shop: '🏪',
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
	applicantSeats: basic.seat,
	applicantSpeed: basic.applicantsAvailable,
	healthCare: basic.retirement,
	logistics: basic.shop,
	machinePress: basic.storage,
	metalScissors: basic.purchasing,
	packaging: basic.selling
}
