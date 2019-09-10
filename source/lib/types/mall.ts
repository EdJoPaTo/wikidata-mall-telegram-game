import {Chat} from 'telegram-typings'

type UserId = number

export interface Mall {
	// TODO: add attraction
	// attraction?: string;
	member: UserId[];
	money: number;
	chat: Chat;
}
