const basic: Record<string, string> = {
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
	group: '👥',
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
	personAlien: '👽',
	personRefined: '💼',
	personRobot: '🤖',
	personStudent: '🎓',
	personTemporary: '🤠',
	personToddler: '👶',
	production: '🛠',
	purchasing: '🛒',
	recruitment: '👏',
	requireAttention: '🥺',
	retirement: '👻',
	seat: '💺',
	seatProtection: '🤕',
	selling: '🤝',
	settings: '⚙️',
	shop: '🏪',
	skill: '⚗️',
	skillFinished: '✅',
	stats: '📊',
	storage: '📦',
	timezone: '🕑',
	underConstruction: '🚧',
	warning: '⚠️',
	wikidataItem: 'ℹ️',
	yes: '👍'
}

export const emojis: Record<string, string> = {
	...basic,
	applicantSeats: basic.seat,
	applicantSpeed: basic.applicantsAvailable,
	healthCare: basic.retirement,
	logistics: basic.shop,
	machinePress: basic.storage,
	metalScissors: basic.purchasing,
	packaging: basic.selling
}
