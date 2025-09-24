import Joi from "joi";

export interface CreatePaymentDTO {
    amount: number;
    currency: string;
    receipt: string;
}

const ISO4217 = [
  'AED','AFN','ALL','AMD','ANG','AOA','ARS','AUD','AWG','AZN',
  'BAM','BBD','BDT','BGN','BHD','BIF','BMD','BND','BOB','BRL',
  'BSD','BTN','BWP','BYN','BZD','CAD','CDF','CHF','CLP','CNY',
  'COP','CRC','CUP','CVE','CZK','DJF','DKK','DOP','DZD','EGP',
  'ERN','ETB','EUR','FJD','FKP','GBP','GEL','GHS','GIP','GMD',
  'GNF','GTQ','GYD','HKD','HNL','HRK','HTG','HUF','IDR','ILS',
  'INR','IQD','IRR','ISK','JMD','JOD','JPY','KES','KGS','KHR',
  'KMF','KPW','KRW','KWD','KYD','KZT','LAK','LBP','LKR','LRD',
  'LSL','LYD','MAD','MDL','MGA','MKD','MMK','MNT','MOP','MRU',
  'MUR','MVR','MWK','MXN','MYR','MZN','NAD','NGN','NIO','NOK',
  'NPR','NZD','OMR','PAB','PEN','PGK','PHP','PKR','PLN','PYG',
  'QAR','RON','RSD','RUB','RWF','SAR','SBD','SCR','SDG','SEK',
  'SGD','SHP','SLL','SOS','SRD','SSP','STN','SYP','SZL','THB',
  'TJS','TMT','TND','TOP','TRY','TTD','TWD','TZS','UAH','UGX',
  'USD','UYU','UZS','VES','VND','VUV','WST','XAF','XCD','XOF',
  'XPF','YER','ZAR','ZMW','ZWL'
];

export const createPaymentSchema = Joi.object<CreatePaymentDTO>({
    amount: Joi.number().integer().min(1).required(),

    currency: Joi.string()
        .valid(...Object.values(ISO4217))
        .required(),

    receipt: Joi.string()
        .trim()
        .min(1)
        .required(),
});

export function validateCreatePayment(data: unknown): {
    value: CreatePaymentDTO;
    error?: Joi.ValidationError;
} {
    return createPaymentSchema.validate(data, { abortEarly: false });
}

