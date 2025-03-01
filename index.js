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

    // 如果使用者輸入 "開始" 或 "輸入生日"，引導他選擇日期
    if (userMessage === "開始" || userMessage === "輸入生日") {
        await client.replyMessage({
            replyToken: event.replyToken,
            messages: [{
                type: "text",
                text: "請選擇你的生日或手動輸入（格式 YYYY-MM-DD）：",
                quickReply: {
                    items: [
                        { type: "action", action: { type: "message", label: "2000-01-01", text: "2000-01-01" } },
                        { type: "action", action: { type: "message", label: "1995-05-20", text: "1995-05-20" } },
                        { type: "action", action: { type: "message", label: "1990-12-12", text: "1990-12-12" } }
                    ]
                }
            }]
        });
        return;
    }

    // 處理生日輸入
    const lifePathNumber = calculateLifePath(userMessage);
    if (lifePathNumber) {
        await client.replyMessage({
            replyToken: event.replyToken,
            messages: [{ type: "text", text: `你的生命靈數是：${lifePathNumber}` }]
        });
    } else {
        await client.replyMessage({
            replyToken: event.replyToken,
            messages: [{ type: "text", text: "請輸入你的生日（格式：YYYY-MM-DD），或點擊下方按鈕選擇。" }]
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
