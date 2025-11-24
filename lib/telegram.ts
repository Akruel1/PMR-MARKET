const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = process.env.NEXTAUTH_URL || 'https://pmrmarket.com';

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
  disable_web_page_preview?: boolean;
  reply_markup?: {
    inline_keyboard?: Array<Array<{
      text: string;
      callback_data: string;
    }>>;
  };
}

interface TelegramCallbackAnswer {
  callback_query_id: string;
  text?: string;
  show_alert?: boolean;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('📱 Telegram bot token not configured. Message would be sent:', { chatId, text });
    return false;
  }

  if (!chatId) {
    console.log('📱 No Telegram chat ID provided');
    return false;
  }

  try {
    const message: TelegramMessage = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    };

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Error sending Telegram message:', error);
      return false;
    }

    console.log(`✅ Telegram message sent to ${chatId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending Telegram message:', error);
    return false;
  }
}

// Send message with inline keyboard buttons
export async function sendTelegramMessageWithButtons(
  chatId: string,
  text: string,
  buttons: Array<Array<{ text: string; callback_data: string }>>
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('📱 Telegram bot token not configured. Message would be sent:', { chatId, text });
    return false;
  }

  if (!chatId) {
    console.log('📱 No Telegram chat ID provided');
    return false;
  }

  try {
    const message: TelegramMessage = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
      reply_markup: {
        inline_keyboard: buttons,
      },
    };

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Error sending Telegram message with buttons:', error);
      return false;
    }

    console.log(`✅ Telegram message with buttons sent to ${chatId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending Telegram message with buttons:', error);
    return false;
  }
}

// Answer callback query
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert: boolean = false
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    return false;
  }

  try {
    const answer: TelegramCallbackAnswer = {
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert,
    };

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(answer),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Error answering callback query:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error answering callback query:', error);
    return false;
  }
}

// Template for new message notification
export async function sendNewMessageTelegram(
  chatId: string,
  recipientName: string,
  senderName: string,
  messagePreview: string,
  adTitle?: string
): Promise<boolean> {
  const emoji = '💬';
  const title = adTitle 
    ? `${emoji} Новое сообщение о "${adTitle}"`
    : `${emoji} Новое сообщение от ${senderName}`;

  const message = `
<b>${title}</b>

Привет, ${recipientName}!

Вы получили новое сообщение от <b>${senderName}</b>:

<i>${messagePreview.substring(0, 200)}${messagePreview.length > 200 ? '...' : ''}</i>

${adTitle ? `\n📌 Объявление: <b>${adTitle}</b>` : ''}

<a href="${BASE_URL}/messages">Открыть сообщения</a>
  `.trim();

  return await sendTelegramMessage(chatId, message);
}

// Template for ad approval notification
export async function sendAdApprovedTelegram(
  chatId: string,
  userName: string,
  adTitle: string,
  adSlug: string
): Promise<boolean> {
  const adUrl = `${BASE_URL}/ads/${adSlug}`;

  const message = `
🎉 <b>Объявление одобрено!</b>

Привет, ${userName}!

Отличные новости! Ваше объявление <b>"${adTitle}"</b> было одобрено модератором и опубликовано.

Теперь ваше объявление видно всем пользователям, и они могут связаться с вами для покупки.

<a href="${adUrl}">Посмотреть объявление</a>
  `.trim();

  return await sendTelegramMessage(chatId, message);
}

// Template for ad rejection notification
export async function sendAdRejectedTelegram(
  chatId: string,
  userName: string,
  adTitle: string,
  reason?: string
): Promise<boolean> {
  const profileUrl = `${BASE_URL}/profile`;

  const message = `
⚠️ <b>Объявление отклонено</b>

Привет, ${userName}!

Ваше объявление <b>"${adTitle}"</b> было отклонено модератором.

${reason ? `\n<b>Причина:</b> ${reason}` : '\nПожалуйста, проверьте ваши сообщения для получения дополнительной информации от команды модерации.'}

Вы можете создать новое объявление, соответствующее нашим правилам, или связаться с поддержкой, если у вас есть вопросы.

<a href="${profileUrl}">Посмотреть мои объявления</a>
  `.trim();

  return await sendTelegramMessage(chatId, message);
}

