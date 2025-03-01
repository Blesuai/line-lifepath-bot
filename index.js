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

    // 如果使用者輸入 "開始" 或 "輸入生日"，顯示圖片 + 選擇生日按鈕
    if (userMessage === "開始" || userMessage === "輸入生日") {
        await client.replyMessage({
            replyToken: event.replyToken,
            messages: [{
                type: "flex",
                altText: "請選擇你的生日",
                contents: {
                    type: "bubble",
                    hero: {
                        type: "image",
                        url: "https://i.imgur.com/Iw1xuvp.jpg", // ⚠️ 你的圖片網址（請換成正確的）
                        size: "full",
                        aspectRatio: "20:13",
                        aspectMode: "cover"
                    },
                    body: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            { type: "text", text: "請點擊按鈕選擇你的生日 👇", weight: "bold", size: "lg" },
                            {
                                type: "button",
                                action: {
                                    type: "datetimepicker",
                                    label: "選擇生日",
                                    data: "action=birthdate",
                                    mode: "date",
                                    initial: "2000-01-01",  // 預設日期
                                    max: "2025-12-31",  // 可選擇的最大日期
                                    min: "1900-01-01"   // 可選擇的最小日期
                                },
                                style: "primary"
                            }
                        ]
                    }
                }
            }]
        });
        return;
    }

    // 如果收到生日選擇的回應
    if (event.type === "postback" && event.postback.data === "action=birthdate") {
        const selectedDate = event.postback.params.date;
        const lifePathNumber = calculateLifePath(selectedDate);

        await client.replyMessage({
            replyToken: event.replyToken,
            messages: [{ type: "text", text: `你的生命靈數是：${lifePathNumber}` }]
        });
        return;
    }

    // 處理手動輸入生日
    const lifePathNumber = calculateLifePath(userMessage);
    if (lifePathNumber) {
        await client.replyMessage({
            replyToken: event.replyToken,
            messages: [{ type: "text", text: `你的生命靈數是：${lifePathNumber}` }]
        });
    } else {
        await client.replyMessage({
            replyToken: event.replyToken,
            messages: [{ type: "text", text: "請點擊按鈕選擇生日，或手動輸入（格式：YYYY-MM-DD）" }]
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
