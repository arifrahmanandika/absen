const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { log } = require("console");

const OWNER_NUMBER = "6285369437000@c.us"; // Ganti dengan nomor owner kamu

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  log("Scan QR code dengan WhatsApp Anda");
});

client.on("loading_screen", (percent, message) => {
  log(`Loading... ${percent}% ${message}`);
});

client.on("ready", () => {
  log("✅ Bot is ready! Let's party...");
});

client.on("message", async (msg) => {
  const text = msg.body.toLowerCase().trim();
  const hour = new Date().getHours();

  log("📩 Message received:", msg.body);
  log("🕒 Current hour:", hour);

  // Regex untuk menangkap format: [nama] hadir [jumlah]
  const match = text.match(/(\w+)[\s\/]?hadir[\s\/]?(\d+)/i);
  if (!match) return;

  const nama = match[1];
  const jumlah = parseInt(match[2]);

  // Validasi jumlah
  if (isNaN(jumlah)) return;

  // Reaksi waktu pagi
  if (text.includes("hadir") && hour >= 5 && hour <= 7) {
    msg.react("👍");
  }

  // Reaksi dan aksi berdasar jumlah kehadiran
  switch (jumlah) {
    case 30:
      await msg.react("🎉");
      await msg.reply("Cie ciee... wayae.. wayae.. 🤑");
      await client.sendMessage(
        OWNER_NUMBER,
        `${nama} absensi 30, waktunya gajian 💰`
      );
      break;
    case 28:
      await msg.react("🔥");
      await msg.reply("Yook Bisa yook... 2 hari lagi !!! 💪");
      break;
  }
});

client.initialize();
