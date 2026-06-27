import webpush from 'web-push';
import twilio from 'twilio';

const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

if (publicKey && privateKey) {
  webpush.setVapidDetails('mailto:no-reply@safemap.local', publicKey, privateKey);
}

export const sendWebPush = async (subscription, payload) => {
  if (!publicKey || !privateKey) return;
  await webpush.sendNotification(subscription, JSON.stringify(payload));
};

export const sendAlertSms = async (to, body) => {
  if (!accountSid || !authToken || !fromNumber) return;
  const client = twilio(accountSid, authToken);
  return client.messages.create({ body, from: fromNumber, to });
};

export default { sendWebPush, sendAlertSms };
