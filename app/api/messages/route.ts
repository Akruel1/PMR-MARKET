import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { sendNewMessageTelegram } from '@/lib/telegram';

type BasicUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

const userSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
} as const;

const adSelect = {
  id: true,
  title: true,
  slug: true,
  images: {
    select: { url: true },
    orderBy: { order: 'asc' },
    take: 1,
  },
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const otherUserId = request.nextUrl.searchParams.get('withUserId');

    if (otherUserId) {
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { fromUserId: user.id, toUserId: otherUserId },
            { fromUserId: otherUserId, toUserId: user.id },
          ],
        },
        include: {
          fromUser: { select: userSelect },
          toUser: { select: userSelect },
          ad: { select: adSelect },
        },
        orderBy: { createdAt: 'asc' },
      });

      await prisma.message.updateMany({
        where: {
          fromUserId: otherUserId,
          toUserId: user.id,
          read: false,
        },
        data: { read: true },
      });

      return NextResponse.json(
        messages.map((msg) => ({
          ...msg,
          ad: msg.ad
            ? {
                id: msg.ad.id,
                title: msg.ad.title,
                slug: msg.ad.slug,
                images: msg.ad.images,
              }
            : undefined,
        }))
      );
    }

    const userMessages = await prisma.message.findMany({
      where: {
        OR: [{ fromUserId: user.id }, { toUserId: user.id }],
      },
      include: {
        fromUser: { select: userSelect },
        toUser: { select: userSelect },
        ad: { select: adSelect },
      },
      orderBy: { createdAt: 'desc' },
    });

    const conversationsMap = new Map<
      string,
      {
        id: string;
        otherUser: BasicUser;
        text: string;
        createdAt: Date;
        unreadCount: number;
        ad?: {
          id: string;
          title: string;
          slug: string;
          images: { url: string }[];
        };
      }
    >();

    for (const message of userMessages) {
      const isOwn = message.fromUserId === user.id;
      const otherUser = isOwn ? message.toUser : message.fromUser;
      if (!otherUser) continue;

      if (!conversationsMap.has(otherUser.id)) {
        conversationsMap.set(otherUser.id, {
          id: message.id,
          otherUser,
          text: message.text,
          createdAt: message.createdAt,
          unreadCount: 0,
          ad: message.ad
            ? {
                id: message.ad.id,
                title: message.ad.title,
                slug: message.ad.slug,
                images: message.ad.images,
              }
            : undefined,
        });
      }

      if (!isOwn && !message.read) {
        const convo = conversationsMap.get(otherUser.id);
        if (convo) {
          convo.unreadCount += 1;
        }
      }
    }

    return NextResponse.json(Array.from(conversationsMap.values()));
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { toUserId, text, adId, audioUrl } = await request.json();

    if (!toUserId || typeof toUserId !== 'string') {
      return NextResponse.json({ error: 'toUserId is required' }, { status: 400 });
    }
    // Allow empty text if audioUrl is provided
    if ((!text || typeof text !== 'string' || !text.trim()) && !audioUrl) {
      return NextResponse.json({ error: 'Message text or audio is required' }, { status: 400 });
    }
    if (toUserId === user.id) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    const recipient = await prisma.user.findUnique({
      where: { id: toUserId },
      select: {
        id: true,
        name: true,
        telegramChatId: true,
        telegramBotLicenseAccepted: true,
      },
    });
    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Build message text: combine audio and text if both are provided
    let messageText = '';
    if (audioUrl) {
      messageText = `[AUDIO:${audioUrl}]`;
      if (text && text.trim()) {
        messageText += ' ' + text.trim();
      }
    } else {
      messageText = text?.trim() || '';
    }

    const message = await prisma.message.create({
      data: {
        fromUserId: user.id,
        toUserId,
        text: messageText,
        adId,
      },
      include: {
        fromUser: { select: userSelect },
        toUser: { select: userSelect },
        ad: { select: adSelect },
      },
    });

    if (recipient.telegramChatId && recipient.telegramBotLicenseAccepted) {
      const senderName = user.name || user.email || 'Пользователь';
      const recipientName = recipient.name || 'Пользователь';
      await sendNewMessageTelegram(recipient.telegramChatId, recipientName, senderName, text.trim(), message.ad?.title);
    }

    return NextResponse.json(
      {
        ...message,
        ad: message.ad
          ? {
              id: message.ad.id,
              title: message.ad.title,
              slug: message.ad.slug,
              images: message.ad.images,
            }
          : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
