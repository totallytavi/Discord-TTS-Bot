import { ChatInputCommandInteraction, Client, SlashCommandBuilder } from 'discord.js';
import { TtsPlayer } from './TtsPlayer.js';
import { Sequelize } from 'sequelize';
import { type initModels } from '../models/init-models.js';

/**
 * @desc Interface that extends the {@link Client discord.js Client} for this project's needs
 */
export interface TtsClient extends Client {
	/**
	 * @desc Sequelize instance with the database models attached
	 */
	sequelize: Sequelize & { models: ReturnType<typeof initModels> };
	/**
	 * @desc Hashmap of channel IDs to their respective {@link TtsPlayer TTS Player}
	 */
	playerMap: Map<string, TtsPlayer>;
	/**
	 * @desc Contains all commands
	 */
	commands: Map<
		string,
		{
			/**
			 * @desc Underlying data for users to run the command
			 */
			data: SlashCommandBuilder;
			/**
			 * @desc Executes the command
			 * @param context Data at runtime
			 * @returns {Promise<void>} Returns when done executing
			 */
			execute: (context: CommandContext) => Promise<void>;
		}
	>;
}

/**
 * @desc Interface for the data behind a command being run
 */
export interface CommandContext {
	/**
	 * @desc The client that instantiated the command
	 * @see {@link TtsClient}
	 */
	client: TtsClient;
	/**
	 * @desc The {@link ChatInputCommandInteraction interaction} that triggered the command
	 */
	interaction: ChatInputCommandInteraction<'cached'>;
}

/** @see https://docs.cloud.google.com/speech-to-text/docs/speech-to-text-supported-languages */
export const GTTS_LANGUAGES_MERGED = {
	Arabic: {
		Algeria: 'ar-DZ',
		Bahrain: 'ar-BH',
		Egypt: 'ar-EG',
		Iraq: 'ar-IQ',
		Israel: 'ar-IL',
		Jordan: 'ar-JO',
		Kuwait: 'ar-KW',
		Lebanon: 'ar-LB',
		Mauritania: 'ar-MR',
		Morocco: 'ar-MA',
		Oman: 'ar-OM',
		Qatar: 'ar-QA',
		'Saudi Arabia': 'ar-SA',
		'State of Palestine': 'ar-PS',
		Tunisia: 'ar-TN',
		'United Arab Emirates': 'ar-AE',
		Yemen: 'ar-YE',
	},
	Bengali: {
		Bangladesh: 'bn-BD',
	},
	Bulgarian: {
		Bulgaria: 'bg-BG',
	},
	Czech: {
		'Czech Republic': 'cs-CZ',
	},
	Danish: {
		Denmark: 'da-DK',
	},
  // Not a real language, but exists for clueless users
  Default: {
    Default: 'en-GB'
  },
	Dutch: {
		Belgium: 'nl-BE',
		Netherlands: 'nl-NL',
	},
	English: {
		Australia: 'en-AU',
		'Hong Kong': 'en-HK',
		India: 'en-IN',
		Ireland: 'en-IE',
		'New Zealand': 'en-NZ',
		Pakistan: 'en-PK',
		Singapore: 'en-SG',
		'United Kingdom': 'en-GB',
		'United States': 'en-US',
	},
	Finnish: {
		Finland: 'fi-FI',
	},
	French: {
		Belgium: 'fr-BE',
		Canada: 'fr-CA',
		France: 'fr-FR',
		Switzerland: 'fr-CH',
	},
	German: {
		Austria: 'de-AT',
		Germany: 'de-DE',
		Switzerland: 'de-CH',
	},
	Hindi: {
		India: 'hi-IN',
	},
	Hungarian: {
		Hungary: 'hu-HU',
	},
	Indonesian: {
		Indonesia: 'id-ID',
	},
	Italian: {
		Italy: 'it-IT',
		Switzerland: 'it-CH',
	},
	Japanese: {
		Japan: 'ja-JP',
	},
	Kannada: {
		India: 'kn-IN',
	},
	Khmer: {
		Cambodia: 'km-KH',
	},
	Kinyarwanda: {
		Rwanda: 'rw-RW',
	},
	Korean: {
		'South Korea': 'ko-KR',
	},
	Macedonian: {
		'North Macedonia': 'mk-MK',
	},
	Malayalam: {
		India: 'ml-IN',
	},
	Marathi: {
		India: 'mr-IN',
	},
	'Norwegian Bokmål': {
		Norway: 'no-NO',
	},
	Polish: {
		Poland: 'pl-PL',
	},
	Portuguese: {
		Brazil: 'pt-BR',
		Portugal: 'pt-PT',
	},
	Romanian: {
		Romania: 'ro-RO',
	},
	Russian: {
		Russia: 'ru-RU',
	},
	'Southern Sotho': {
		'South Africa': 'st-ZA',
	},
	Spanish: {
		Argentina: 'es-AR',
		Bolivia: 'es-BO',
		Chile: 'es-CL',
		Colombia: 'es-CO',
		'Costa Rica': 'es-CR',
		'Dominican Republic': 'es-DO',
		Ecuador: 'es-EC',
		'El Salvador': 'es-SV',
		Guatemala: 'es-GT',
		Honduras: 'es-HN',
		Mexico: 'es-MX',
		Nicaragua: 'es-NI',
		Panama: 'es-PA',
		Peru: 'es-PE',
		'Puerto Rico': 'es-PR',
		Spain: 'es-ES',
		'United States': 'es-US',
		Uruguay: 'es-UY',
		Venezuela: 'es-VE',
	},
	Swati: {
		'Latin, South Africa': 'ss-Latn-ZA',
	},
	Swedish: {
		Sweden: 'sv-SE',
	},
	Tamil: {
		India: 'ta-IN',
	},
	Telugu: {
		India: 'te-IN',
	},
	Thai: {
		Thailand: 'th-TH',
	},
	Tsonga: {
		'South Africa': 'ts-ZA',
	},
	Tswana: {
		'Latin, South Africa': 'tn-Latn-ZA',
	},
	Turkish: {
		Turkey: 'tr-TR',
	},
	Ukrainian: {
		Ukraine: 'uk-UA',
	},
	Venda: {
		'South Africa': 've-ZA',
	},
	Vietnamese: {
		Vietnam: 'vi-VN',
	},
	Xhosa: {
		'South Africa': 'xh-ZA',
	},
} as Record<string, Record<string, string>>;