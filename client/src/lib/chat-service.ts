import api from "./api";
import type { Conversation, UserSearchResult, ApiResponse, MessagesResponse } from "@/types/chat.types";

/**
 * Chat Service
 * API calls for chat functionality
 */
export const chatService = {
  /**
   * Fetch user's conversation inbox
   * GET /api/chat/conversations
   */
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get<ApiResponse<{ conversations: Conversation[] }>>("/chat/conversations");
    return response.data.data?.conversations || [];
  },

  /**
   * Fetch messages for a conversation with cursor-based pagination
   * GET /api/chat/messages/:conversationId
   */
  getMessages: async (conversationId: string, before?: string): Promise<MessagesResponse> => {
    const params = new URLSearchParams();
    if (before) {
      params.set("before", before);
    }
    const queryString = params.toString();
    const url = `/chat/messages/${conversationId}${queryString ? `?${queryString}` : ""}`;
    const response = await api.get<ApiResponse<MessagesResponse>>(url);
    return response.data.data || { messages: [], hasMore: false, nextCursor: null };
  },

  /**
   * Search for users by username/name
   * GET /api/search?q=<query>
   * Returns both users and communities, we extract users
   */
  searchUsers: async (query: string): Promise<UserSearchResult[]> => {
    if (!query.trim()) return [];
    const response = await api.get<ApiResponse<{ users: UserSearchResult[] }>>(
      `/search?q=${encodeURIComponent(query)}`
    );
    return response.data.data?.users || [];
  },
};

