# CareerOptics WhatsApp → CRM lead bot (Baileys)

Every WhatsApp message to the counselling number becomes a CRM lead
(`source = whatsapp`), auto-assigned round-robin to an active counsellor, who
gets a CRM notification. A number that already has a lead gets the message
added to that lead's timeline instead. The bot only reads — it never replies.

> Baileys is an unofficial WhatsApp Web client. Use it on the business number
> you link, avoid bulk messaging from it, and keep a backup number — WhatsApp
> can restrict numbers it considers automated.

## Setup

1. Website env (Netlify and `.env.local`): `WHATSAPP_BOT_SECRET` — a long random string.
2. On an always-on machine (office PC, VPS, Railway/Render) with Node 20+:

```bash
cd whatsapp-bot
npm install
SITE_URL=https://careeroptics.netlify.app WHATSAPP_BOT_SECRET=<same secret> npm start
```

3. Scan the QR (terminal, or `qr.png`) from the business phone:
   WhatsApp → Linked devices → Link a device.
   The login is kept in `./auth` — keep that folder so restarts don't need a new scan.

Keep it running with `pm2 start index.js --name careeroptics-whatsapp`.
