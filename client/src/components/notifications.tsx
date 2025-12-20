"use client"

import { useState, useEffect, useRef } from "react"
import { BellIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import api from "@/lib/api"
import { formatTimeAgo } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

interface Notification {
  _id: string;
  conversation_id: {
    _id: string;
    last_message: string;
  };
  sender_id: {
    _id: string;
    username: string;
    userPhotoUrl?: string;
  };
  text: string;
  created_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const navigate = useNavigate();
  const unreadCount = notifications.length;
  // Use a ref to prevent spamming if we implement polling later
  const intervalRef = useRef<any>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/chat/notifications");
      if (res.data.status === 'success') {
        setNotifications(res.data.data.notifications);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    intervalRef.current = setInterval(fetchNotifications, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, []);

  const handleMarkAllAsRead = async () => {
    // Optimistically clear
    const allIds = notifications.map(n => n.conversation_id?._id).filter(Boolean);
    const uniqueConvIds = [...new Set(allIds)];

    setNotifications([]);

    // Send requests for each unique conversation
    uniqueConvIds.forEach(cid => {
      api.post("/chat/read", { conversationId: cid }).catch(e => console.error(e));
    });
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Navigate to chat
    navigate(`/chat?conversationId=${notification.conversation_id?._id}`);

    // Mark as read
    try {
      await api.post("/chat/read", { conversationId: notification.conversation_id?._id });
      setNotifications(prev => prev.filter(n => n.conversation_id?._id !== notification.conversation_id?._id));
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative inline-block">
          <Button
            size="icon"
            variant="ghost"
            className="relative text-muted-foreground hover:text-foreground"
            aria-label="Open notifications"
          >
            <BellIcon size={20} aria-hidden="true" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 min-w-4 h-4 p-0 flex items-center justify-center text-[10px] bg-red-500 hover:bg-red-600">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-semibold">Notifications</div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto p-1"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className="flex items-start gap-3 p-3 text-sm hover:bg-muted/50 cursor-pointer border-b last:border-0"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="mt-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium leading-none">
                    {notification.sender_id.username}
                    <span className="font-normal text-muted-foreground ml-1">
                      sent you a message
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.text}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatTimeAgo(notification.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
