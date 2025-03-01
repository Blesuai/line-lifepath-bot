require("dotenv").config();
const express = require("express");
const line = require("@line/bot-sdk");

const app = express();

// 設定 LINE Bot API 配置
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

// 建立 LINE 客戶端
const client = new line.messagingApi.MessagingApiClient({
    channelAccessToken: config.channelAccessToken,
});

// Webhook 接收來自 LINE 的訊息
app.post("/webhook", line.middleware(config), (req, res) => {
    Promise.all(req.body.events.map(handleEvent))
        .then(() => res.status(200).send("OK"))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});

// 處理使用者輸入
async function handleEvent(event) {
    if (event.type !== "message" || event.message.type !== "text") {
        return;
    }

    const userMessage = event.message.text;
    const lifePathNumber = calculateLifePath(userMessage);

    if (lifePathNumber) {
        await client.replyMessage({
            replyToken: event.replyToken,
            messages: [{ type: "text", text: `你的生命靈數是：${lifePathNumber}` }]
        });
    } else {
        await client.replyMessage({
            replyToken: event.replyToken,
            messages: [{ type: "text", text: "請輸入你的生日（格式：YYYY-MM-DD）" }]
        });
    }
}

// 生命靈數計算函式
function calculateLifePath(birthdate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) return null;

    let digits = birthdate.replace(/\D/g, "").split("").map(Number);
    while (digits.length > 1) {
        digits = digits.reduce((a, b) => a + b, 0).toString().split("").map(Number);
    }
    return digits[0];
}

// 啟動 Express 伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
