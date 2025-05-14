const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs"); // Import module untuk membaca file
const OWNER_NUMBER = "6285369437000@c.us"; // Ganti dengan nomor owner kamu

const { translate } = require("@vitalets/google-translate-api");
const { get } = require("http");

async function translateToIndonesian(text) {
  try {
    const res = await translate(text, { to: "id" });
    return res.text;
  } catch (err) {
    console.error("Gagal terjemahkan:", err);
    return text;
  }
}

function formatTanggalIndo(day, month) {
  const bulanIndo = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return `${day} ${bulanIndo[month - 1]}`;
}

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("Scan QR code dengan WhatsApp Anda");
});

client.on("ready", () => {
  console.log("Bot is ready!");
});

async function getFaktaHariIni() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.events && data.events.length > 0) {
      // ✨ Urutkan fakta berdasarkan "importance" atau panjang teks
      const sortedEvents = data.events.sort((a, b) => {
        return (b.text?.length || 0) - (a.text?.length || 0);
      });

      // Ambil yang paling "bermakna"
      const topEvent =
        sortedEvents.find((e) =>
          /independence|war|president|treaty|revolution|freedom|united|europe|earthquake|disaster|first|launch/i.test(
            e.text
          )
        ) || sortedEvents[0]; // fallback ke pertama jika tidak ada cocok

      const year = topEvent.year;
      const text = topEvent.text;

      const translated = await translateToIndonesian(text);

      const tanggalFormatted = formatTanggalIndo(day, month);
      return `📅 *Fakta sejarah (${tanggalFormatted}):*\n🗓️ Tahun ${year}: ${translated}`;
    } else {
      return "Tidak ada fakta menarik untuk hari ini.";
    }
  } catch (err) {
    console.error("Gagal ambil fakta dari Wikipedia:", err);
    return "Gagal mengambil fakta hari ini. Coba lagi nanti.";
  }
}

// Fungsi untuk ambil motivasi dari file motivasi.txt
async function getMotivasi() {
  try {
    const data = fs.readFileSync("motivasi.txt", "utf8");
    const motivasi = data
      .split("\n")
      .map((line) => line.trim()) // Hapus spasi di awal/akhir tiap baris
      .filter((line) => line.length > 0); // Hilangkan baris kosong jika ada

    const randomIndex = Math.floor(Math.random() * motivasi.length);
    return motivasi[randomIndex];
  } catch (error) {
    console.error("Error membaca file motivasi:", error);
    return "Tetap semangat! Besok pasti jadi lebih baik.";
  }
}
async function getMotivasiRandom() {
  try {
    // const res = await fetch("https://zenquotes.io/api/random");
    const res = await fetch(
      "https://api.viewbits.com/v1/zenquotes/?mode=random"
    );
    const data = await res.json();

    const original = data[0]?.q || "Keep going!";
    const author = data[0]?.a || "Mbah Rejeb";

    const translated = await translateToIndonesian(original);

    return `💬 *"${original}"*\n🇮🇩 _${translated}_\n— ${author}`;
  } catch (err) {
    console.error("Gagal ambil motivasi online:", err);
    return "Tetap semangat! Hari ini adalah kesempatan baru.";
  }
}

async function getMotivasiToday() {
  try {
    const res = await fetch(
      "https://api.viewbits.com/v1/zenquotes/?mode=today"
    );
    const data = await res.json();

    const original = data[0]?.q || "Keep going!";
    const author = data[0]?.a || "Mbah Rejeb";

    const translated = await translateToIndonesian(original);

    return `💬 *"${original}"*\n🇮🇩 _${translated}_\n— ${author}`;
  } catch (err) {
    console.error("Gagal ambil motivasi online:", err);
    return "Tetap semangat! Hari ini adalah kesempatan baru.";
  }
}

/*
async function getHeadlines() {
  try {
    const res = await fetch("https://api.viewbits.com/v1/headlines");
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return "Belum ada berita terbaru saat ini.";
    }

    // Ambil 5 berita teratas
    const top = data.slice(0, 5);
    const beritaList = top
      .map((item, index) => `📰 *${index + 1}.* ${item.title}\n🔗 ${item.url}`)
      .join("\n\n");

    return `🗞️ *Headlines Hari Ini:*\n\n${beritaList}`;
  } catch (err) {
    console.error("Gagal ambil headlines:", err);
    return "Gagal mengambil berita terbaru. Coba lagi nanti.";
  }
}
*/

client.on("message", async (msg) => {
  const text = msg.body.toLowerCase();
  const regex = /(\w+)[\s\/]?hadir[\s\/]?(\d+)/i;

  const match = text.match(regex);
  if (match) {
    const nama = match[1];
    const jumlah = parseInt(match[2]);

    if (text.includes("anti hadir")) {
      const motivasiOnline = await getMotivasiToday();
      client.sendMessage(msg.from, motivasiOnline);
    }

    if (jumlah === 30) {
      await msg.reply("cie ciee... wayae.. wayae..");
      const pesanOwner = `${nama} absensi 30, waktunya gajian`;
      client.sendMessage(OWNER_NUMBER, pesanOwner);
    } else if (jumlah === 29) {
      const motivasi = await getMotivasi(); // Ambil motivasi acak dari file
      await msg.reply(`Cieee ${nama}, besok Gajian.\n💡 _${motivasi}_`);
    } else if (jumlah === 28) {
      await msg.reply("Yook Bisa yook... 2 hari lagi !!!");
    }
  } else if (text.includes("dika hadir")) {
    const fakta = await getFaktaHariIni();
    await client.sendMessage(msg.from, fakta);
    // const berita = await getHeadlines();
    // client.sendMessage(msg.from, berita);
  } else if (text.includes("aji hadir")) {
    const motivasiOnline = await getMotivasiRandom();
    client.sendMessage(msg.from, motivasiOnline);
  }
});

client.initialize();
