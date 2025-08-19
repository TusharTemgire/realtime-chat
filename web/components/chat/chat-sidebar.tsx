"use client"

import { useState } from "react"
import { useChatStore } from "@/lib/stores/chat-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Search, MessageCircle, Users } from "lucide-react"

export default function ChatSidebar() {
  const [searchQuery, setSearchQuery] = useState("")
  const { user, logout } = useAuthStore()
  const { users, conversations, openConversation, currentConversation } = useChatStore()

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredConversations = conversations.filter((c) =>
    c.partner.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleUserClick = (userId: number) => {
    openConversation(userId)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sidebar-foreground">{user?.username}</p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users or conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="conversations" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chats
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
        </TabsList>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs">Start a chat with someone!</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleUserClick(conversation.partner.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      currentConversation?.id === conversation.id
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-primary"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.partner.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>{conversation.partner.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {conversation.partner.is_online && (
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{conversation.partner.username}</p>
                          {conversation.lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(conversation.lastMessage.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage?.content || "No messages yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    className="p-3 rounded-lg cursor-pointer hover:bg-sidebar-primary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {user.is_online && (
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.username}</p>
                          {user.is_online ? (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              Online
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Offline
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
