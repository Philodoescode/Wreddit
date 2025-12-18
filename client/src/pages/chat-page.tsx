import { useState } from "react";
import { InboxSidebar } from "@/components/chat/inbox-sidebar";

export default function ChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >(undefined);

  return (
    <div className="flex h-screen">
      {/* Left: Inbox Sidebar */}
      <div className="w-80 shrink-0">
        <InboxSidebar
          selectedConversationId={selectedConversationId}
          onConversationSelect={setSelectedConversationId}
        />
      </div>

      {/* Right: Message Thread (Placeholder for Phase 3) */}
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        {selectedConversationId ? (
          <div className="text-center text-muted-foreground">
            <h3 className="text-lg font-medium mb-2">
              Conversation: {selectedConversationId}
            </h3>
            <p className="text-sm">Message thread will be implemented in Phase 3</p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
            <p className="text-sm">
              Choose a conversation from the sidebar to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
