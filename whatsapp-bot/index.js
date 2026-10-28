// CareerOptics WhatsApp bot — Baileys (open-source WhatsApp Web client).
//
// Keeps a WhatsApp Web session open on the counselling number and forwards
// every incoming one-to-one message to the website
// (POST /api/crm/whatsapp/incoming), which turns it into a CRM lead or adds
// it to the existing lead's timeline. Nothing is sent back to the student.
//
// Env:
//   SITE_URL            e.g. https://careeroptics.netlify.app
//   WHATSAPP_BOT_SECRET same value as the website's env var
//   AUTH_DIR            where the WhatsApp login is stored (default ./auth)

import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  isJidGroup,
  isJidNewsletter,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import qrcode from "qrcode-terminal";

const SITE_URL = (process.env.SITE_URL || "").replace(/\/$/, "");
const SECRET = process.env.WHATSAPP_BOT_SECRET;
const AUTH_DIR = process.env.AUTH_DIR || "./auth";

if (!SITE_URL || !SECRET) {
  console.error("Set SITE_URL and WHATSAPP_BOT_SECRET before starting the bot.");
  process.exit(1);
}

const logger = pino({ level: process.env.LOG_LEVEL || "warn" });

function textOf(message) {
  const m = message?.ephemeralMessage?.message ?? message?.viewOnceMessage?.message ?? message;
  return (
    m?.conversation ??
    m?.extendedTextMessage?.text ??
    m?.imageMessage?.caption ??
    m?.videoMessage?.caption ??
    m?.documentMessage?.caption ??
    m?.buttonsResponseMessage?.selectedDisplayText ??
    m?.listResponseMessage?.title ??
    null
  );
}

// WhatsApp may address a chat by a privacy "LID" instead of the phone number;
// prefer whichever JID actually carries the phone number.
function phoneJid(key) {
  const candidates = [key.remoteJid, key.remoteJidAlt, key.senderPn].filter(Boolean);
  return candidates.find((j) => j.endsWith("@s.whatsapp.net")) ?? null;
}

async function sendToCrm(payload) {
  const res = await fetch(`${SITE_URL}/api/crm/whatsapp/incoming`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-bot-secret": SECRET },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Site responded ${res.status}: ${await res.text()}`);
  return res.json();
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ version, auth: state, logger, markOnlineOnConnect: false });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("\nScan this QR in WhatsApp → Linked devices → Link a device:\n");
      qrcode.generate(qr, { small: true });
      await QRCode.toFile("qr.png", qr, { width: 400 }).catch(() => {});
      console.log("(The same QR is saved as whatsapp-bot/qr.png)\n");
    }
    if (connection === "open") console.log("✅ WhatsApp connected — incoming chats now go to the CRM");
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.error(`Logged out from WhatsApp. Delete ${AUTH_DIR} and restart to scan a new QR.`);
        process.exit(1);
      }
      console.warn(`Connection closed (${code ?? "unknown"}), reconnecting…`);
      setTimeout(start, 3000);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      const chat = msg.key.remoteJid;
      if (!chat || msg.key.fromMe) continue;
      if (isJidGroup(chat) || isJidBroadcast(chat) || isJidNewsletter(chat)) continue;
      if (!msg.message) continue;

      const jid = phoneJid(msg.key);
      try {
        const { created } = await sendToCrm({
          messageId: msg.key.id,
          chatId: chat,
          phone: jid ? jid.split("@")[0] : null,
          name: msg.pushName ?? null,
          text: textOf(msg.message),
        });
        console.log(`${created ? "🆕 New lead" : "↳ Added to lead"}: ${msg.pushName ?? chat}`);
      } catch (e) {
        console.error("Failed to send message to CRM:", e.message);
      }
    }
  });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
