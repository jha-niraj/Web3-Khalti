"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, User } from "lucide-react";
import { getUserWallets, signMessage, type Wallet } from "@/lib/userUtils";
import { getChatMessages, sendMessage as sendMessageAction } from "@/actions/chat.action";
import { toast } from "sonner";

interface Message {
    id: string;
    content: string;
    senderWallet: {
        id: string;
        name: string;
        publicKey: string;
    };
    signature: string;
    createdAt: Date;
    isFromMe: boolean;
}

export default function ChatPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [currentWallet, setCurrentWallet] = useState<Wallet | null>(null);
    const [recipientPublicKey, setRecipientPublicKey] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Get wallet and recipient from URL params
        const walletId = searchParams.get("wallet");
        const recipient = searchParams.get("recipient");

        if (!walletId || !recipient) {
            toast.error("Invalid chat parameters");
            router.push("/");
            return;
        }

        // Find the current wallet
        loadCurrentWallet(walletId);
        setRecipientPublicKey(decodeURIComponent(recipient));

        // Load messages for this chat room
        loadMessages();
    }, [searchParams, router]);

    const loadCurrentWallet = async (walletId: string) => {
        try {
            const wallets = await getUserWallets();
            const wallet = wallets.find(w => w.id === walletId);

            if (!wallet) {
                toast.error("Wallet not found");
                router.push("/");
                return;
            }

            setCurrentWallet(wallet);
        } catch (error) {
            console.error("Error loading wallet:", error);
            toast.error("Failed to load wallet");
            router.push("/");
        }
    };

    const loadMessages = async () => {
        try {
            const result = await getChatMessages(params.id);
            if (result.error) {
                console.error("Failed to load messages:", result.error);
                return;
            }

            const messagesWithFlag = result.messages!.map((msg: any) => ({
                ...msg,
                createdAt: new Date(msg.createdAt),
                isFromMe: msg.senderWallet.id === currentWallet?.id
            }));
            setMessages(messagesWithFlag);
        } catch (error) {
            console.error("Failed to load messages:", error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !currentWallet) return;

        setIsLoading(true);

        try {
            // Sign the message with the private key
            const signature = signMessage(newMessage, currentWallet.privateKey);

            const result = await sendMessageAction(
                params.id,
                newMessage,
                currentWallet.id,
                recipientPublicKey,
                signature
            );

            if (result.error) {
                toast.error(result.error);
                return;
            }

            setNewMessage("");
            loadMessages(); // Reload messages
            toast.success("Message sent!");
        } catch (error) {
            console.error("Failed to send message:", error);
            toast.error("Failed to send message");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (!currentWallet) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-4">Loading...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-neutral-900">
            {/* Header */}
            <div className="bg-gray-50 dark:bg-neutral-800 border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push("/")}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <div>
                                <h1 className="text-xl font-semibold">Secure Chat</h1>
                                <p className="text-sm text-gray-500">
                                    With: {recipientPublicKey.substring(0, 20)}...
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4" />
                                <span>{currentWallet.name}</span>
                                <span className={`px-2 py-1 rounded text-xs ${currentWallet.type === "ETHEREUM"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                        : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                    }`}>
                                    {currentWallet.type.toLowerCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Container */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg h-[70vh] flex flex-col">
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {messages.length === 0 ? (
                            <div className="text-center text-gray-500 mt-12">
                                <div className="mb-4">
                                    <div className="mx-auto h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                        <Send className="h-8 w-8 text-gray-400" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                                <p>Start the conversation by sending a secure message!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.isFromMe ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-lg px-4 py-3 ${message.isFromMe
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                                                }`}
                                        >
                                            <p className="text-sm mb-1">{message.content}</p>
                                            <div className="flex items-center justify-between text-xs opacity-70">
                                                <span>
                                                    {message.isFromMe ? "You" : message.senderWallet.name}
                                                </span>
                                                <span>{message.createdAt.toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Message Input */}
                    <div className="border-t bg-white dark:bg-neutral-900 p-4 rounded-b-lg">
                        <div className="flex gap-3">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your secure message..."
                                className="flex-1"
                                disabled={isLoading}
                            />
                            <Button
                                onClick={sendMessage}
                                disabled={!newMessage.trim() || isLoading}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Messages are signed with your private key for authenticity
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
