import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage, sendTelegramMessageWithButtons, answerCallbackQuery } from '@/lib/telegram';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = process.env.NEXTAUTH_URL || 'https://pmrmarket.com';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    date: number;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    message: {
      message_id: number;
      chat: {
        id: number;
        type: string;
      };
    };
    data: string;
  };
}

// License agreement text
const LICENSE_AGREEMENT = `
📋 <b>ЛИЦЕНЗИОННОЕ СОГЛАШЕНИЕ</b>

Используя данного бота, вы соглашаетесь со следующими условиями:

1. <b>Сбор и использование данных</b>
   - Бот собирает и обрабатывает ваши данные для предоставления услуг уведомлений
   - Ваш Telegram Chat ID связывается с вашим аккаунтом на сайте

2. <b>Уведомления</b>
   - Вы будете получать уведомления о новых сообщениях
   - Вы будете получать уведомления об изменении статуса ваших объявлений

3. <b>РЕКЛАМНАЯ РАССЫЛКА</b>
   ⚠️ Принимая данное соглашение, вы <b>соглашаетесь на получение рекламной рассылки</b> от PMR Market через Telegram бота.

4. <b>Отказ от ответственности</b>
   - Бот предоставляется "как есть"
   - Мы не несем ответственности за возможные сбои в работе бота

5. <b>Отключение уведомлений</b>
   - Вы можете отключить уведомления в любое время, удалив связь с ботом

Принимая данное соглашение, вы подтверждаете, что прочитали и согласны со всеми условиями, включая согласие на рекламную рассылку.
`.trim();

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if needed
    const secret = request.headers.get('x-telegram-bot-api-secret-token');
    if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    const update: TelegramUpdate = await request.json();

    // Log update for debugging
    console.log('📱 Telegram update received:', {
      update_id: update.update_id,
      has_message: !!update.message,
      has_callback_query: !!update.callback_query,
      message_text: update.message?.text,
    });

    // Handle callback query first (if present) - it has priority
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const chatId = callbackQuery.message.chat.id.toString();
      const callbackData = callbackQuery.data;
      const callbackQueryId = callbackQuery.id;

      console.log('🔘 Processing callback query:', { chatId, callbackData });

      // Handle license acceptance
      if (callbackData === 'accept_license') {
        try {
          // Find user by chat ID (using findFirst because telegramChatId is not unique)
          const user = await prisma.user.findFirst({
            where: { telegramChatId: chatId },
            select: {
              id: true,
              telegramBotLicenseAccepted: true,
            },
          });

          if (!user) {
            await answerCallbackQuery(callbackQueryId, '❌ Аккаунт не найден. Пожалуйста, сначала отправьте код аккаунта.', true);
            await sendTelegramMessage(
              chatId,
              `❌ Аккаунт не найден. Пожалуйста, сначала отправьте код аккаунта.\n\nИспользуйте /start для начала работы.`
            );
            return NextResponse.json({ ok: true });
          }

          if (user.telegramBotLicenseAccepted) {
            await answerCallbackQuery(callbackQueryId, '✅ Лицензионное соглашение уже принято!');
            await sendTelegramMessage(
              chatId,
              `✅ Лицензионное соглашение уже принято!\n\nВы будете получать уведомления о:\n• Новых сообщениях\n• Изменении статуса объявлений\n\nИспользуйте /help для списка команд.`
            );
            return NextResponse.json({ ok: true });
          }

          // Accept license
          console.log('Updating user license acceptance:', user.id);
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
              telegramBotLicenseAccepted: true,
              telegramBotLicenseAcceptedAt: new Date(),
            },
          });
          console.log('✅ License updated successfully:', updatedUser.id);

          // Answer callback query
          await answerCallbackQuery(callbackQueryId, '✅ Лицензионное соглашение принято!');

          // Send confirmation message
          await sendTelegramMessage(
            chatId,
            `✅ <b>Лицензионное соглашение принято!</b>\n\nТеперь вы будете получать уведомления о:\n• 💬 Новых сообщениях\n• 📢 Изменении статуса ваших объявлений\n• 🔔 Других важных событиях\n\nИспользуйте /help для списка команд.`
          );

          return NextResponse.json({ ok: true });
        } catch (error: any) {
          console.error('❌ Error handling accept_license callback:', error);
          console.error('Error details:', {
            message: error?.message,
            code: error?.code,
            meta: error?.meta,
            stack: error?.stack,
          });
          
          // Try to answer callback query even if there's an error
          try {
            await answerCallbackQuery(callbackQueryId, '❌ Произошла ошибка. Попробуйте позже.', true);
          } catch (e) {
            console.error('Failed to answer callback query:', e);
          }
          
          // Try to send error message
          try {
            await sendTelegramMessage(
              chatId,
              `❌ Произошла ошибка при принятии лицензии.\n\nПожалуйста, попробуйте позже или обратитесь в поддержку.\n\nОшибка: ${error?.message || 'Unknown error'}`
            );
          } catch (e) {
            console.error('Failed to send error message:', e);
          }
          
          return NextResponse.json({ ok: true });
        }
      }

      // Handle license rejection
      if (callbackData === 'reject_license') {
        await answerCallbackQuery(callbackQueryId, '❌ Лицензионное соглашение отклонено');
        await sendTelegramMessage(
          chatId,
          `❌ Лицензионное соглашение отклонено.\n\nДля использования бота необходимо принять лицензионное соглашение.\n\nВы можете связать аккаунт позже, отправив команду /start и ваш код аккаунта.`
        );
        return NextResponse.json({ ok: true });
      }

      // Unknown callback data
      await answerCallbackQuery(callbackQueryId, '❓ Неизвестная команда');
      return NextResponse.json({ ok: true });
    }

    // Handle message
    if (update.message) {
      const chatId = update.message.chat.id.toString();
      const text = update.message.text || '';
      const userId = update.message.from.id;

      console.log('📨 Processing message:', { chatId, text, userId });

      // Handle /start command
      if (text.startsWith('/start')) {
        console.log('✅ /start command received');
        try {
          await sendTelegramMessage(
            chatId,
            `👋 Привет! Добро пожаловать в бот PMR Market!\n\nДля начала работы укажите код вашего аккаунта.\n\n💡 <b>Где найти код?</b>\nПерейдите на сайт ${BASE_URL}, войдите в свой профиль - там вы найдете уникальный код аккаунта, который виден только вам.\n\n📝 Отправьте ваш код аккаунта:`
          );
          console.log('✅ /start response sent');
        } catch (error) {
          console.error('❌ Error sending /start response:', error);
        }
        return NextResponse.json({ ok: true });
      }

      // Handle /help command
      if (text.startsWith('/help')) {
        await sendTelegramMessage(
          chatId,
          `ℹ️ <b>Помощь</b>\n\n<b>Команды:</b>\n/start - Начать работу с ботом\n/help - Показать эту справку\n/code - Узнать, где найти код аккаунта\n\n<b>Где найти код аккаунта?</b>\n1. Перейдите на сайт ${BASE_URL}\n2. Войдите в свой аккаунт\n3. Откройте страницу профиля\n4. Там вы найдете уникальный код аккаунта\n\n<b>Что делать после получения кода?</b>\nОтправьте код боту, и он свяжет ваш Telegram с аккаунтом на сайте.`
        );
        return NextResponse.json({ ok: true });
      }

      // Handle /code command
      if (text.startsWith('/code')) {
        await sendTelegramMessage(
          chatId,
          `🔑 <b>Где найти код аккаунта?</b>\n\n1. Перейдите на сайт: ${BASE_URL}\n2. Войдите в свой аккаунт\n3. Откройте страницу профиля (кнопка "Profile" в меню)\n4. В разделе "Код аккаунта" вы найдете уникальный код\n\nКод виден только вам и используется для связи Telegram бота с вашим аккаунтом на сайте.`
        );
        return NextResponse.json({ ok: true });
      }

      // Handle account code input (6 characters, alphanumeric)
      const codePattern = /^[A-Z0-9]{6}$/i;
      if (codePattern.test(text.trim())) {
        const code = text.trim().toUpperCase();
        
        try {
          // Find user by account code
          const user = await prisma.user.findUnique({
            where: { accountCode: code },
            select: {
              id: true,
              telegramChatId: true,
              telegramBotLicenseAccepted: true,
            },
          });

          if (!user) {
            await sendTelegramMessage(
              chatId,
              `❌ Код не найден. Пожалуйста, проверьте правильность кода и попробуйте снова.\n\n💡 Используйте команду /code чтобы узнать, где найти код аккаунта.`
            );
            return NextResponse.json({ ok: true });
          }

          // Check if already linked
          if (user.telegramChatId === chatId) {
            if (user.telegramBotLicenseAccepted) {
              await sendTelegramMessage(
                chatId,
                `✅ Ваш аккаунт уже связан с этим Telegram!\n\nВы будете получать уведомления о:\n• Новых сообщениях\n• Изменении статуса объявлений\n\nИспользуйте /help для списка команд.`
              );
            } else {
              // License not accepted yet - send with buttons
              await sendTelegramMessageWithButtons(
                chatId,
                LICENSE_AGREEMENT + '\n\nДля продолжения работы с ботом необходимо принять лицензионное соглашение.',
                [
                  [
                    { text: '✅ Принимаю', callback_data: 'accept_license' },
                    { text: '❌ Отклоняю', callback_data: 'reject_license' },
                  ],
                ]
              );
            }
            return NextResponse.json({ ok: true });
          }

          // Link account
          await prisma.user.update({
            where: { id: user.id },
            data: { telegramChatId: chatId },
          });

          // Send license agreement with buttons
          await sendTelegramMessage(
            chatId,
            `✅ Аккаунт успешно связан!\n\nДля продолжения работы с ботом необходимо принять лицензионное соглашение.`
          );
          await sendTelegramMessageWithButtons(
            chatId,
            LICENSE_AGREEMENT + '\n\nДля продолжения работы с ботом необходимо принять лицензионное соглашение.',
            [
              [
                { text: '✅ Принимаю', callback_data: 'accept_license' },
                { text: '❌ Отклоняю', callback_data: 'reject_license' },
              ],
            ]
          );

          return NextResponse.json({ ok: true });
        } catch (error: any) {
          console.error('❌ Error processing account code:', error);
          await sendTelegramMessage(
            chatId,
            `❌ Произошла ошибка при обработке кода. Пожалуйста, попробуйте позже или обратитесь в поддержку.`
          );
          return NextResponse.json({ ok: true });
        }
      }

      // Handle license acceptance via text (backward compatibility)
      // Note: Now using inline buttons, but keeping text support for compatibility
      const acceptPattern = /^(принимаю|согласен|accept|agree|да|yes)$/i;
      if (acceptPattern.test(text.trim())) {
        try {
          // Find user by chat ID (using findFirst because telegramChatId is not unique)
          const user = await prisma.user.findFirst({
            where: { telegramChatId: chatId },
            select: {
              id: true,
              telegramBotLicenseAccepted: true,
            },
          });

          if (!user) {
            await sendTelegramMessage(
              chatId,
              `❌ Аккаунт не найден. Пожалуйста, сначала отправьте код аккаунта.\n\nИспользуйте /start для начала работы.`
            );
            return NextResponse.json({ ok: true });
          }

          if (user.telegramBotLicenseAccepted) {
            await sendTelegramMessage(
              chatId,
              `✅ Лицензионное соглашение уже принято!\n\nВы будете получать уведомления о:\n• Новых сообщениях\n• Изменении статуса объявлений\n\nИспользуйте /help для списка команд.`
            );
            return NextResponse.json({ ok: true });
          }

          // Accept license
          await prisma.user.update({
            where: { id: user.id },
            data: {
              telegramBotLicenseAccepted: true,
              telegramBotLicenseAcceptedAt: new Date(),
            },
          });

          await sendTelegramMessage(
            chatId,
            `✅ <b>Лицензионное соглашение принято!</b>\n\nТеперь вы будете получать уведомления о:\n• 💬 Новых сообщениях\n• 📢 Изменении статуса ваших объявлений\n• 🔔 Других важных событиях\n\nИспользуйте /help для списка команд.`
          );

          return NextResponse.json({ ok: true });
        } catch (error: any) {
          console.error('❌ Error handling text license acceptance:', error);
          await sendTelegramMessage(
            chatId,
            `❌ Произошла ошибка. Попробуйте позже или используйте кнопки для принятия соглашения.`
          );
          return NextResponse.json({ ok: true });
        }
      }

      // Unknown message
      console.log('❓ Unknown message:', text);
      await sendTelegramMessage(
        chatId,
        `❓ Неизвестная команда.\n\nИспользуйте /help для списка доступных команд.\n\nЕсли вы хотите связать аккаунт, отправьте код аккаунта (6 символов).`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('❌ Error handling Telegram webhook:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    
    // Try to send error notification to admin if possible
    // But don't fail the request
    
    return NextResponse.json(
      { 
        ok: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

