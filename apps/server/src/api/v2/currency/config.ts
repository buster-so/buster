import type { Currency } from '@buster/server-shared/currency';

const codeToFlag = {
  AED: '🇦🇪',
  AFN: '🇦🇫',
  ALL: '🇦🇱',
  AMD: '🇦🇲',
  ANG: '🇳🇱',
  AOA: '🇦🇴',
  ARS: '🇦🇷',
  AUD: '🇦🇺',
  AWG: '🇦🇼',
  AZN: '🇦🇿',
  BAM: '🇧🇦',
  BBD: '🇧🇧',
  BDT: '🇧🇩',
  BGN: '🇧🇬',
  BHD: '🇧🇭',
  BIF: '🇧🇮',
  BMD: '🇧🇲',
  BND: '🇧🇳',
  BOB: '🇧🇴',
  BRL: '🇧🇷',
  BSD: '🇧🇸',
  BTN: '🇧🇹',
  BWP: '🇧🇼',
  BYN: '🇧🇾',
  BYR: '🇧🇾',
  BZD: '🇧🇿',
  CAD: '🇨🇦',
  CDF: '🇨🇩',
  CHF: '🇨🇭',
  CLF: '🇨🇱',
  CLP: '🇨🇱',
  CNY: '🇨🇳',
  COP: '🇨🇴',
  CRC: '🇨🇷',
  CUC: '🇨🇺',
  CUP: '🇨🇺',
  CVE: '🇨🇻',
  CZK: '🇨🇿',
  DJF: '🇩🇯',
  DKK: '🇩🇰',
  DOP: '🇩🇴',
  DZD: '🇩🇿',
  EGP: '🇪🇬',
  ERN: '🇪🇷',
  ETB: '🇪🇹',
  EUR: '🇪🇺',
  FJD: '🇫🇯',
  FKP: '🇫🇰',
  GBP: '🇬🇧',
  GEL: '🇬🇪',
  GHS: '🇬🇭',
  GIP: '🇬🇮',
  GMD: '🇬🇲',
  GNF: '🇬🇳',
  GTQ: '🇬🇹',
  GYD: '🇬🇾',
  HKD: '🇭🇰',
  HNL: '🇭🇳',
  HRK: '🇭🇷',
  HTG: '🇭🇹',
  HUF: '🇭🇺',
  IDR: '🇮🇩',
  ILS: '🇮🇱',
  INR: '🇮🇳',
  IQD: '🇮🇶',
  IRR: '🇮🇷',
  ISK: '🇮🇸',
  JMD: '🇯🇲',
  JOD: '🇯🇴',
  JPY: '🇯🇵',
  KES: '🇰🇪',
  KGS: '🇰🇬',
  KHR: '🇰🇭',
  KMF: '🇰🇲',
  KPW: '🇰🇵',
  KRW: '🇰🇷',
  KWD: '🇰🇼',
  KYD: '🇰🇾',
  KZT: '🇰🇿',
  LAK: '🇱🇦',
  LBP: '🇱🇧',
  LKR: '🇱🇰',
  LRD: '🇱🇷',
  LSL: '🇱🇸',
  LTL: '🇱🇹',
  LVL: '🇱🇻',
  LYD: '🇱🇾',
  MAD: '🇲🇦',
  MDL: '🇲🇩',
  MGA: '🇲🇬',
  MKD: '🇲🇰',
  MMK: '🇲🇲',
  MNT: '🇲🇳',
  MOP: '🇲🇴',
  MRO: '🇲🇷',
  MUR: '🇲🇺',
  MVR: '🇲🇻',
  MWK: '🇲🇼',
  MXN: '🇲🇽',
  MYR: '🇲🇾',
  MZN: '🇲🇿',
  NAD: '🇳🇦',
  NGN: '🇳🇬',
  NIO: '🇳🇮',
  NOK: '🇳🇴',
  NPR: '🇳🇵',
  NZD: '🇳🇿',
  OMR: '🇴🇲',
  PAB: '🇵🇦',
  PEN: '🇵🇪',
  PGK: '🇵🇬',
  PHP: '🇵🇭',
  PKR: '🇵🇰',
  PLN: '🇵🇱',
  PYG: '🇵🇾',
  QAR: '🇶🇦',
  RON: '🇷🇴',
  RSD: '🇷🇸',
  RUB: '🇷🇺',
  RWF: '🇷🇼',
  SAR: '🇸🇦',
  SBD: '🇸🇧',
  SCR: '🇸🇨',
  SDG: '🇸🇩',
  SEK: '🇸🇪',
  SGD: '🇸🇬',
  SHP: '🇸🇭',
  SLE: '🇸🇱',
  SLL: '🇸🇱',
  SOS: '🇸🇴',
  SRD: '🇸🇷',
  STD: '🇸🇹',
  SYP: '🇸🇾',
  SZL: '🇸🇿',
  THB: '🇹🇭',
  TJS: '🇹🇯',
  TMT: '🇹🇲',
  TND: '🇹🇳',
  TOP: '🇹🇴',
  TRY: '🇹🇷',
  TTD: '🇹🇹',
  TWD: '🇹🇼',
  TZS: '🇹🇿',
  UAH: '🇺🇦',
  UGX: '🇺🇬',
  USD: '🇺🇸',
  UYU: '🇺🇾',
  UZS: '🇺🇿',
  VEF: '🇻🇪',
  VES: '🇻🇪',
  VND: '🇻🇳',
  VUV: '🇻🇺',
  WST: '🇼🇸',
  XAF: '🇨🇲',
  XCD: '🇦🇮',
  XOF: '🇧🇯',
  XPF: '🇵🇫',
  YER: '🇾🇪',
  ZAR: '🇿🇦',
  ZMW: '🇿🇲',
  ZWL: '🇿🇼',
  DEFAULT: '🏳️',
};


export const CURRENCIES_MAP: Currency[] = [
  {
    code: 'AED',
    description: 'United Arab Emirates Dirham',
  },
  {
    code: 'AFN',
    description: 'Afghan Afghani',
  },
  {
    code: 'ALL',
    description: 'Albanian Lek',
  },
  {
    code: 'AMD',
    description: 'Armenian Dram',
  },
  {
    code: 'ANG',
    description: 'Netherlands Antillean Gulden',
  },
  {
    code: 'AOA',
    description: 'Angolan Kwanza',
  },
  {
    code: 'ARS',
    description: 'Argentine Peso',
  },
  {
    code: 'AUD',
    description: 'Australian Dollar',
  },
  {
    code: 'AWG',
    description: 'Aruban Florin',
  },
  {
    code: 'AZN',
    description: 'Azerbaijani Manat',
  },
  {
    code: 'BAM',
    description: 'Bosnia & Herzegovina Convertible Mark',
  },
  {
    code: 'BBD',
    description: 'Barbadian Dollar',
  },
  {
    code: 'BDT',
    description: 'Bangladeshi Taka',
  },
  {
    code: 'BGN',
    description: 'Bulgarian Lev',
  },
  {
    code: 'BIF',
    description: 'Burundian Franc',
  },
  {
    code: 'BMD',
    description: 'Bermudian Dollar',
  },
  {
    code: 'BND',
    description: 'Brunei Dollar',
  },
  {
    code: 'BOB',
    description: 'Bolivian Boliviano',
  },
  {
    code: 'BRL',
    description: 'Brazilian Real',
  },
  {
    code: 'BSD',
    description: 'Bahamian Dollar',
  },
  {
    code: 'BWP',
    description: 'Botswana Pula',
  },
  {
    code: 'BZD',
    description: 'Belize Dollar',
  },
  {
    code: 'CAD',
    description: 'Canadian Dollar',
  },
  {
    code: 'CDF',
    description: 'Congolese Franc',
  },
  {
    code: 'CHF',
    description: 'Swiss Franc',
  },
  {
    code: 'CLP',
    description: 'Chilean Peso',
  },
  {
    code: 'CNY',
    description: 'Chinese Renminbi Yuan',
  },
  {
    code: 'COP',
    description: 'Colombian Peso',
  },
  {
    code: 'CRC',
    description: 'Costa Rican Colón',
  },
  {
    code: 'CVE',
    description: 'Cape Verdean Escudo',
  },
  {
    code: 'CZK',
    description: 'Czech Koruna',
  },
  {
    code: 'DJF',
    description: 'Djiboutian Franc',
  },
  {
    code: 'DKK',
    description: 'Danish Krone',
  },
  {
    code: 'DOP',
    description: 'Dominican Peso',
  },
  {
    code: 'DZD',
    description: 'Algerian Dinar',
  },
  {
    code: 'EGP',
    description: 'Egyptian Pound',
  },
  {
    code: 'ETB',
    description: 'Ethiopian Birr',
  },
  {
    code: 'EUR',
    description: 'Euro',
  },
  {
    code: 'FJD',
    description: 'Fijian Dollar',
  },
  {
    code: 'FKP',
    description: 'Falkland Islands Pound',
  },
  {
    code: 'GBP',
    description: 'British Pound',
  },
  {
    code: 'GEL',
    description: 'Georgian Lari',
  },
  {
    code: 'GIP',
    description: 'Gibraltar Pound',
  },
  {
    code: 'GMD',
    description: 'Gambian Dalasi',
  },
  {
    code: 'GNF',
    description: 'Guinean Franc',
  },
  {
    code: 'GTQ',
    description: 'Guatemalan Quetzal',
  },
  {
    code: 'GYD',
    description: 'Guyanese Dollar',
  },
  {
    code: 'HKD',
    description: 'Hong Kong Dollar',
  },
  {
    code: 'HNL',
    description: 'Honduran Lempira',
  },
  {
    code: 'HRK',
    description: 'Croatian Kuna',
  },
  {
    code: 'HTG',
    description: 'Haitian Gourde',
  },
  {
    code: 'HUF',
    description: 'Hungarian Forint',
  },
  {
    code: 'IDR',
    description: 'Indonesian Rupiah',
  },
  {
    code: 'ILS',
    description: 'Israeli New Sheqel',
  },
  {
    code: 'INR',
    description: 'Indian Rupee',
  },
  {
    code: 'ISK',
    description: 'Icelandic Króna',
  },
  {
    code: 'JMD',
    description: 'Jamaican Dollar',
  },
  {
    code: 'JPY',
    description: 'Japanese Yen',
  },
  {
    code: 'KES',
    description: 'Kenyan Shilling',
  },
  {
    code: 'KGS',
    description: 'Kyrgyzstani Som',
  },
  {
    code: 'KHR',
    description: 'Cambodian Riel',
  },
  {
    code: 'KMF',
    description: 'Comorian Franc',
  },
  {
    code: 'KRW',
    description: 'South Korean Won',
  },
  {
    code: 'KYD',
    description: 'Cayman Islands Dollar',
  },
  {
    code: 'KZT',
    description: 'Kazakhstani Tenge',
  },
  {
    code: 'LAK',
    description: 'Lao Kip',
  },
  {
    code: 'LBP',
    description: 'Lebanese Pound',
  },
  {
    code: 'LKR',
    description: 'Sri Lankan Rupee',
  },
  {
    code: 'LRD',
    description: 'Liberian Dollar',
  },
  {
    code: 'LSL',
    description: 'Lesotho Loti',
  },
  {
    code: 'MAD',
    description: 'Moroccan Dirham',
  },
  {
    code: 'MDL',
    description: 'Moldovan Leu',
  },
  {
    code: 'MGA',
    description: 'Malagasy Ariary',
  },
  {
    code: 'MKD',
    description: 'Macedonian Denar',
  },
  {
    code: 'MNT',
    description: 'Mongolian Tögrög',
  },
  {
    code: 'MOP',
    description: 'Macanese Pataca',
  },
  {
    code: 'MRO',
    description: 'Mauritanian Ouguiya',
  },
  {
    code: 'MUR',
    description: 'Mauritian Rupee',
  },
  {
    code: 'MVR',
    description: 'Maldivian Rufiyaa',
  },
  {
    code: 'MWK',
    description: 'Malawian Kwacha',
  },
  {
    code: 'MXN',
    description: 'Mexican Peso',
  },
  {
    code: 'MYR',
    description: 'Malaysian Ringgit',
  },
  {
    code: 'MZN',
    description: 'Mozambican Metical',
  },
  {
    code: 'NAD',
    description: 'Namibian Dollar',
  },
  {
    code: 'NGN',
    description: 'Nigerian Naira',
  },
  {
    code: 'NIO',
    description: 'Nicaraguan Córdoba',
  },
  {
    code: 'NOK',
    description: 'Norwegian Krone',
  },
  {
    code: 'NPR',
    description: 'Nepalese Rupee',
  },
  {
    code: 'NZD',
    description: 'New Zealand Dollar',
  },
  {
    code: 'PAB',
    description: 'Panamanian Balboa',
  },
  {
    code: 'PEN',
    description: 'Peruvian Nuevo Sol',
  },
  {
    code: 'PGK',
    description: 'Papua New Guinean Kina',
  },
  {
    code: 'PHP',
    description: 'Philippine Peso',
  },
  {
    code: 'PKR',
    description: 'Pakistani Rupee',
  },
  {
    code: 'PLN',
    description: 'Polish Złoty',
  },
  {
    code: 'PYG',
    description: 'Paraguayan Guaraní',
  },
  {
    code: 'QAR',
    description: 'Qatari Riyal',
  },
  {
    code: 'RON',
    description: 'Romanian Leu',
  },
  {
    code: 'RSD',
    description: 'Serbian Dinar',
  },
  {
    code: 'RUB',
    description: 'Russian Ruble',
  },
  {
    code: 'RWF',
    description: 'Rwandan Franc',
  },
  {
    code: 'SAR',
    description: 'Saudi Riyal',
  },
  {
    code: 'SBD',
    description: 'Solomon Islands Dollar',
  },
  {
    code: 'SCR',
    description: 'Seychellois Rupee',
  },
  {
    code: 'SEK',
    description: 'Swedish Krona',
  },
  {
    code: 'SGD',
    description: 'Singapore Dollar',
  },
  {
    code: 'SHP',
    description: 'Saint Helenian Pound',
  },
  {
    code: 'SLL',
    description: 'Sierra Leonean Leone',
  },
  {
    code: 'SOS',
    description: 'Somali Shilling',
  },
  {
    code: 'SRD',
    description: 'Surinamese Dollar',
  },
  {
    code: 'STD',
    description: 'São Tomé and Príncipe Dobra',
  },
  {
    code: 'SVC',
    description: 'Salvadoran Colón',
  },
  {
    code: 'SZL',
    description: 'Swazi Lilangeni',
  },
  {
    code: 'THB',
    description: 'Thai Baht',
  },
  {
    code: 'TJS',
    description: 'Tajikistani Somoni',
  },
  {
    code: 'TOP',
    description: 'Tongan Paʻanga',
  },
  {
    code: 'TRY',
    description: 'Turkish Lira',
  },
  {
    code: 'TTD',
    description: 'Trinidad and Tobago Dollar',
  },
  {
    code: 'TWD',
    description: 'New Taiwan Dollar',
  },
  {
    code: 'TZS',
    description: 'Tanzanian Shilling',
  },
  {
    code: 'UAH',
    description: 'Ukrainian Hryvnia',
  },
  {
    code: 'UGX',
    description: 'Ugandan Shilling',
  },
  {
    code: 'USD',
    description: 'United States Dollar',
  },
  {
    code: 'UYU',
    description: 'Uruguayan Peso',
  },
  {
    code: 'UZS',
    description: 'Uzbekistani Som',
  },
  {
    code: 'VND',
    description: 'Vietnamese Đồng',
  },
  {
    code: 'VUV',
    description: 'Vanuatu Vatu',
  },
  {
    code: 'WST',
    description: 'Samoan Tala',
  },
  {
    code: 'XAF',
    description: 'Central African Cfa Franc',
  },
  {
    code: 'XCD',
    description: 'East Caribbean Dollar',
  },
  {
    code: 'XOF',
    description: 'West African Cfa Franc',
  },
  {
    code: 'XPF',
    description: 'Cfp Franc',
  },
  {
    code: 'YER',
    description: 'Yemeni Rial',
  },
  {
    code: 'ZAR',
    description: 'South African Rand',
  },
  {
    code: 'ZMW',
    description: 'Zambian Kwacha',
  },
].map((currency) => {
  return {
    ...currency,
    flag: currency.code
      ? codeToFlag[currency.code as keyof typeof codeToFlag] || codeToFlag.DEFAULT
      : codeToFlag.DEFAULT,
  };
});