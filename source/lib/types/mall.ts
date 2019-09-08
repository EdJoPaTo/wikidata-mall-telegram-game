import {Chat} from 'telegram-typings'

export interface Mall {
	// TODO: add attraction
	// attraction?: string;
	member: number[];
	money: number;
	chat: Chat;
}
