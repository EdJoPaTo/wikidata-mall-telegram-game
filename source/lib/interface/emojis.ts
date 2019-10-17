const basic: Record<string, string> = {
	add: '➕',
	applicantsAvailable: '📬',
	applicantsEmpty: '📭',
	attraction: '🎡',
	blacklisted: '😶',
	chat: '💭',
	clearSkillQueue: '❌',
	close: '🛑',
	collector: '🧳',
	construction: '🏗',
	countdown: '⏲',
	currency: '📎',
	currencyMall: '🧷',
	disaster: '😭',
	door: '🚪',
	employmentTermination: '🔫',
	github: '🦑',
	graduation: '🎉',
	group: '👥',
	halloweenPumpkin: '🎃',
	help: '🃏',
	hobbyDifferent: '❤️',
	hobbyMatch: '💚',
	image: '🖼',
	income: '📈',
	language: '🏳️‍🌈',
	leaderboard: '🏆',
	magnetism: '🧲',
	mall: '🏬',
	noPerson: '🕳',
	old: '⏳',
	part: '🧩',
	person: '👤',
	personAlien: '👽',
	personRefined: '💼',
	personRobot: '🤖',
	personStudent: '🎓',
	personTemporary: '🤠',
	personToddler: '👶',
	potentialProducts: '📜',
	production: '🛠',
	productionFinished: '✅',
	purchasing: '🛒',
	recruitment: '👏',
	requireAttention: '🥺',
	retirement: '👻',
	robotTinkering: '🙈',
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
	vote: '🗳️',
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
