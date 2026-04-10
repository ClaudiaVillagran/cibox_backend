import pkg from "transbank-sdk";

const {
  Options,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
  Environment,
} = pkg;

export const webpayOptions = new Options(
  IntegrationCommerceCodes.WEBPAY_PLUS,
  IntegrationApiKeys.WEBPAY,
  Environment.Integration
);