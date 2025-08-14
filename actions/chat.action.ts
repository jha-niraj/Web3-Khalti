"use server";

import { prisma } from "@/lib/prisma";

export async function getChatMessages(chatRoomId: string) {
  try {
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: {
        messages: {
          include: {
            senderWallet: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chatRoom) {
      return { error: "Chat room not found" };
    }

    return { messages: chatRoom.messages };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return { error: "Failed to fetch messages" };
  }
}

export async function sendMessage(
  chatRoomId: string,
  content: string,
  senderWalletId: string,
  recipientPublicKey: string,
  signature: string
) {
  try {
    // Validate required fields
    if (!content || !senderWalletId || !recipientPublicKey || !signature) {
      return { error: "Missing required fields" };
    }

    // Get sender wallet
    const senderWallet = await prisma.wallet.findUnique({
      where: { id: senderWalletId },
      include: { user: true },
    });

    if (!senderWallet) {
      return { error: "Sender wallet not found" };
    }

    // Find recipient user by public key
    const recipientWallet = await prisma.wallet.findFirst({
      where: { publicKey: recipientPublicKey },
      include: { user: true },
    });

    if (!recipientWallet) {
      return { error: "Recipient not found" };
    }

    // Find or create chat room
    let chatRoom = await prisma.chatRoom.findFirst({
      where: {
        OR: [
          {
            participant1Id: senderWallet.userId,
            participant2Id: recipientWallet.userId,
          },
          {
            participant1Id: recipientWallet.userId,
            participant2Id: senderWallet.userId,
          },
        ],
      },
    });

    if (!chatRoom) {
      chatRoom = await prisma.chatRoom.create({
        data: {
          id: chatRoomId,
          participant1Id: senderWallet.userId,
          participant2Id: recipientWallet.userId,
          participant1PublicKey: senderWallet.publicKey,
          participant2PublicKey: recipientWallet.publicKey,
        },
      });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        senderWalletId,
        signature,
        chatRoomId: chatRoom.id,
      },
      include: {
        senderWallet: true,
      },
    });

    return { message };
  } catch (error) {
    console.error("Error creating message:", error);
    return { error: "Failed to create message" };
  }
}

export async function createChatRoom(
  chatRoomId: string,
  participant1PublicKey: string,
  participant2PublicKey: string
) {
  try {
    // Find users by their public keys
    const participant1Wallet = await prisma.wallet.findFirst({
      where: { publicKey: participant1PublicKey },
      include: { user: true },
    });

    const participant2Wallet = await prisma.wallet.findFirst({
      where: { publicKey: participant2PublicKey },
      include: { user: true },
    });

    if (!participant1Wallet || !participant2Wallet) {
      return { error: "One or both participants not found" };
    }

    // Check if chat room already exists
    const existingChatRoom = await prisma.chatRoom.findFirst({
      where: {
        OR: [
          {
            participant1Id: participant1Wallet.userId,
            participant2Id: participant2Wallet.userId,
          },
          {
            participant1Id: participant2Wallet.userId,
            participant2Id: participant1Wallet.userId,
          },
        ],
      },
    });

    if (existingChatRoom) {
      return { chatRoom: existingChatRoom };
    }

    // Create new chat room
    const chatRoom = await prisma.chatRoom.create({
      data: {
        id: chatRoomId,
        participant1Id: participant1Wallet.userId,
        participant2Id: participant2Wallet.userId,
        participant1PublicKey,
        participant2PublicKey,
      },
    });

    return { chatRoom };
  } catch (error) {
    console.error("Error creating chat room:", error);
    return { error: "Failed to create chat room" };
  }
}
