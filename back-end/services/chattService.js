// services/chatService.js
/**
 * Chat Service
 * This file contains the business logic for chat functionality.
 * It includes methods for:
 * - Creating a new chat for a meeting
 * - Adding messages to an existing chat
 * - Retrieving chat history for a meeting
 */
const Chat = require('../models/Chat');

class ChatService {
    static async createChat(meetingId, participants) {
        const chat = new Chat({ meetingId, participants });
        return await chat.save();
    }

    static async addMessage(meetingId, sender, content) {
        const chat = await Chat.findOne({ meetingId });
        if (!chat) {
            throw new Error('Chat not found');
        }
        chat.messages.push({ sender, content });
        return await chat.save();
    }
    
    static async getChatHistory(meetingId) {
        const chat =  await Chat.findOne({ meetingId });
        return chat ? chat.messages : [];
    }
}

module.exports = ChatService;
