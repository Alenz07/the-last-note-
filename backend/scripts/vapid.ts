import webpush from 'web-push';

/** Generate VAPID keys for Web Push. Paste into .env.local / production env. */
const k = webpush.generateVAPIDKeys();
console.log(`VAPID_PUBLIC_KEY=${k.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${k.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:you@example.com`);
