export const ENABLED_PAYMENTS = {
  CREDIT_CARD: 'credit_card',
  GOPAY: 'gopay',
  SHOPEEPAY: 'shopeepay',
  QRIS: 'qris',
  PERMATA_VA: 'permata_va',
  BCA_VA: 'bca_va',
  BNI_VA: 'bni_va',
  BRI_VA: 'bri_va',
  INDOMARET: 'indomaret',
  ALFAMART: 'alfamart',
} as const;

export const ENABLED_PAYMENTS_VALUES = Object.values(ENABLED_PAYMENTS);

export const ENABLED_PAYMENTS_LABELS = {
  [ENABLED_PAYMENTS.CREDIT_CARD]: 'Credit Card',
  [ENABLED_PAYMENTS.GOPAY]: 'Gopay',
  [ENABLED_PAYMENTS.SHOPEEPAY]: 'ShopeePay',
  [ENABLED_PAYMENTS.QRIS]: 'QRIS',
  [ENABLED_PAYMENTS.PERMATA_VA]: 'Permata VA',
  [ENABLED_PAYMENTS.BCA_VA]: 'BCA VA',
  [ENABLED_PAYMENTS.BNI_VA]: 'BNI VA',
  [ENABLED_PAYMENTS.BRI_VA]: 'BRI VA',
  [ENABLED_PAYMENTS.INDOMARET]: 'Indomaret',
  [ENABLED_PAYMENTS.ALFAMART]: 'Alfamart',
};
