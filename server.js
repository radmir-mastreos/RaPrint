require("dotenv").config();

const express = require("express");
const multer = require("multer");
const TelegramBot = require("node-telegram-bot-api");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;

if (!BOT_TOKEN) {
    console.error("❌ Не найден BOT_TOKEN в .env");
    process.exit(1);
}

if (!ADMIN_ID) {
    console.error("❌ Не найден ADMIN_ID в .env");
    process.exit(1);
}


// ==========================================
// TELEGRAM
// ==========================================

const bot = new TelegramBot(BOT_TOKEN, {
    polling: true
});

console.log("🤖 Telegram-бот запущен");


// ==========================================
// UPLOADS
// ==========================================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}


// ==========================================
// MULTER
// ==========================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, uploadDir);

    },

    filename: function (req, file, cb) {

        const extension =
            path.extname(file.originalname);

        const filename =
            `${Date.now()}-${Math.round(Math.random() * 1000000000)}${extension}`;

        cb(null, filename);

    }

});


const upload = multer({

    storage: storage,

    limits: {
        fileSize: 20 * 1024 * 1024
    }

});


// ==========================================
// EXPRESS
// ==========================================

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);


// ==========================================
// САЙТ
// ==========================================

app.use(
    express.static(__dirname)
);


// ==========================================
// HTML ESCAPE
// ==========================================

function escapeHtml(value) {

    if (!value) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==========================================
// НОМЕР ЗАЯВКИ
// ==========================================

let orderNumber = 1;


function getOrderNumber() {

    const number =
        String(orderNumber).padStart(3, "0");

    orderNumber++;

    return number;

}


// ==========================================
// ПРИЁМ ЗАЯВКИ
// ==========================================

app.post(
    "/api/order",
    upload.single("file"),

    async (req, res) => {

        try {

            const {
                name,
                contact,
                description,
                model
            } = req.body;


            if (
                !name ||
                !contact ||
                !description
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Заполните обязательные поля."

                });

            }


            const number =
                getOrderNumber();


            const date =
                new Date().toLocaleString(
                    "ru-RU",
                    {
                        timeZone:
                            "Europe/Moscow"
                    }
                );


            const message = `

🆕 <b>НОВАЯ ЗАЯВКА RaPrint</b>

━━━━━━━━━━━━━━━━━━

📋 <b>Заявка №${number}</b>

👤 <b>Имя:</b>
${escapeHtml(name)}

📱 <b>Контакт:</b>
${escapeHtml(contact)}

🧩 <b>Что нужно:</b>
${escapeHtml(description)}

🔗 <b>Ссылка на модель:</b>
${escapeHtml(model || "Не указана")}

📎 <b>Файл:</b>
${req.file
    ? escapeHtml(req.file.originalname)
    : "Не прикреплён"
}

━━━━━━━━━━━━━━━━━━

🕐 ${date}

📍 <b>RaPrint</b>
Стерлитамак
`;


            // ==================================
            // ОТПРАВЛЯЕМ СООБЩЕНИЕ
            // ==================================

            await bot.sendMessage(
                ADMIN_ID,
                message,
                {
                    parse_mode: "HTML"
                }
            );


            // ==================================
            // ОТПРАВЛЯЕМ ФАЙЛ
            // ==================================

            if (req.file) {

                const filePath =
                    path.join(
                        uploadDir,
                        req.file.filename
                    );


                await bot.sendDocument(
                    ADMIN_ID,
                    filePath,
                    {
                        caption:
                            `📎 Файл заявки №${number}\n` +
                            `Клиент: ${name}`
                    }
                );

            }


            console.log(
                `✅ Заявка №${number} получена`
            );


            res.json({

                success: true,

                orderNumber: number,

                message:
                    "Заявка успешно отправлена!"

            });


        } catch (error) {

            console.error(
                "❌ Ошибка:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Не удалось отправить заявку."

            });

        }

    }
);


// ==========================================
// TELEGRAM /start
// ==========================================

bot.onText(
    /\/start/,

    async (msg) => {

        const chatId =
            msg.chat.id;


        await bot.sendMessage(

            chatId,

            `
🤖 <b>RaPrint Bot</b>

Бот подключён.

Заявки с сайта RaPrint
будут отправляться владельцу мастерской.
`,

            {
                parse_mode: "HTML"
            }

        );

    }

);


// ==========================================
// ЗАПУСК
// ==========================================

app.listen(
    PORT,

    () => {

        console.log("");
        console.log(
            "================================"
        );

        console.log(
            "🚀 RaPrint запущен"
        );

        console.log(
            `🌐 http://localhost:${PORT}`
        );

        console.log(
            "================================"
        );

        console.log("");

    }
);