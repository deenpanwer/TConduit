"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shimmer } from "@/components/ems/main/shared/Shimmer";
import { cn, getUserAvatar, isEmployeeOnline } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Users, Plus, History } from "lucide-react";

interface Employee {
  id: string;
  name?: string;
  photoUrl?: string;
  imageUrl?: string;
  role?: string;
}

interface GroupChat {
  id: string;
  name: string;
  createdBy: string;
  members: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  lastMessageSenderId?: string;
  photoUrl?: string;
}

interface EmployeeListProps {
  employees: Employee[];
  selectedEmployee: Employee | null;
  onSelectEmployee: (employee: Employee) => void;
  isLoading: boolean;
  
  // Group chat props
  groups?: GroupChat[];
  selectedGroup?: GroupChat | null;
  onSelectGroup?: (group: GroupChat) => void;
  isLeadership?: boolean;
  onCreateGroupClick?: () => void;
  onDeletedGroupsClick?: () => void;
  activeTab: "direct" | "group";
  setActiveTab: (tab: "direct" | "group") => void;
  
  // Unread badge props
  directChats?: any[];
  viewedTimes?: Record<string, number>;
  currentUserId?: string;
}

export function EmployeeList({
  employees,
  selectedEmployee,
  onSelectEmployee,
  isLoading,
  groups = [],
  selectedGroup = null,
  onSelectGroup,
  isLeadership = false,
  onCreateGroupClick,
  onDeletedGroupsClick,
  activeTab,
  setActiveTab,
  directChats = [],
  viewedTimes = {},
  currentUserId = "",
}: EmployeeListProps) {
  
  // Format last message preview for groups
  const getGroupLastMessage = (group: GroupChat) => {
    if (!group.lastMessage) return "No messages yet";
    return group.lastMessage;
  };

  // Format last message preview for direct chats
  const getDirectChatPreview = (employeeId: string) => {
    const directChat = directChats.find(chat => 
      chat.participants?.includes(employeeId) && chat.participants?.includes(currentUserId)
    );
    if (!directChat) return null;
    return directChat.lastMessage || null;
  };

  const getTimestampMs = (timestamp: any): number => {
    if (!timestamp) return 0;
    if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
    if (typeof timestamp.toDate === "function") return timestamp.toDate().getTime();
    if (typeof timestamp.seconds === "number") return timestamp.seconds * 1000;
    if (timestamp instanceof Date) return timestamp.getTime();
    if (typeof timestamp === "string") return new Date(timestamp).getTime();
    if (typeof timestamp === "number") return timestamp;
    return 0;
  };

  const isDirectChatUnread = (employeeId: string) => {
    const directChat = directChats.find(chat => 
      chat.participants?.includes(employeeId) && chat.participants?.includes(currentUserId)
    );
    if (!directChat) return false;

    // Check if the last message was sent by the current user
    if (directChat.lastMessageSenderId === currentUserId) return false;

    const lastMsgTime = getTimestampMs(directChat.lastMessageAt);
    const lastViewed = viewedTimes[directChat.id] || 0;
    return lastMsgTime > lastViewed;
  };

  const isGroupChatUnread = (group: GroupChat) => {
    if (group.lastMessageSenderId === currentUserId) return false;

    const lastMsgTime = getTimestampMs(group.lastMessageAt);
    const lastViewed = viewedTimes[group.id] || 0;
    return lastMsgTime > lastViewed;
  };

  const getDirectChatTimestamp = (employeeId: string) => {
    const directChat = directChats.find(chat => 
      chat.participants?.includes(employeeId) && chat.participants?.includes(currentUserId)
    );
    return directChat ? directChat.lastMessageAt : null;
  };

  const formatLastMessageDate = (timestamp: any) => {
    if (!timestamp) return "";
    const ms = getTimestampMs(timestamp);
    if (!ms) return "";
    const date = new Date(ms);
    const now = new Date();
    
    // Check if same day
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Check if Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    // Check if within last 7 days
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Older
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {/* Sidebar Header & Segmented Tab Switcher */}
      <div className="p-4 border-b border-border/40 bg-secondary/15 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/75">
            Inbox Hub
          </h3>
          {isLeadership && activeTab === "group" && (
            <div className="flex items-center gap-1.5">
              {onDeletedGroupsClick && (
                <Button
                  onClick={onDeletedGroupsClick}
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground border-border/40"
                  title="Deleted Groups History (Restore)"
                >
                  <History className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={onCreateGroupClick}
                size="icon"
                className="h-7 w-7 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow active:scale-95 transition-transform"
                title="Create Group Chat"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Tab Controls */}
        <div className="relative flex p-1 bg-secondary/30 rounded-xl border border-border/10">
          <button
            onClick={() => setActiveTab("direct")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all relative z-10",
              activeTab === "direct" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Direct
            {activeTab === "direct" && (
              <motion.div
                layoutId="active-sidebar-tab"
                className="absolute inset-0 bg-primary rounded-lg -z-10 shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("group")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all relative z-10",
              activeTab === "group" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            Groups
            {activeTab === "group" && (
              <motion.div
                layoutId="active-sidebar-tab"
                className="absolute inset-0 bg-primary rounded-lg -z-10 shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Scrollable Content Pane */}
      <ScrollArea className="flex-1">
        <div className="p-2.5">
          <AnimatePresence mode="wait">
            {activeTab === "direct" ? (
              // DIRECT MESSAGES VIEW
              <motion.nav
                key="direct-messages"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-1"
              >
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Shimmer className="h-9 w-9 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Shimmer className="h-3 w-1/2 rounded" />
                        <Shimmer className="h-2 w-3/4 rounded" />
                      </div>
                    </div>
                  ))
                ) : employees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <p className="text-xs font-medium text-muted-foreground/60 italic">No available staff members</p>
                  </div>
                ) : (
                  employees.map((emp) => {
                    const isSelected = selectedEmployee?.id === emp.id;
                    const previewText = getDirectChatPreview(emp.id);
                    const isUnread = isDirectChatUnread(emp.id);
                    const lastMsgTimestamp = getDirectChatTimestamp(emp.id);
                    const lastMsgTimeStr = formatLastMessageDate(lastMsgTimestamp);
                    return (
                      <Button
                        key={emp.id}
                        variant="ghost"
                        className={cn(
                          "h-14 w-full justify-start gap-4 px-3 rounded-xl transition-all duration-200 group relative border border-transparent",
                          isSelected ? "bg-primary/5 border-primary/10 shadow-sm" : "hover:bg-secondary/40"
                        )}
                        onClick={() => onSelectEmployee(emp)}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="active-chat-indicator"
                            className="absolute left-0 w-1.5 h-6 bg-primary rounded-r-full"
                          />
                        )}
                        <div className="relative shrink-0">
                          <Avatar className="h-9 w-9 border border-border/40 transition-transform group-hover:scale-105">
                            <AvatarImage src={getUserAvatar(emp)} alt={emp.name} />
                            <AvatarFallback className="text-xs font-bold">{emp.name?.charAt(0) || "?"}</AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-background rounded-full",
                            isEmployeeOnline(emp) ? "bg-green-500" : "bg-zinc-400"
                          )} />
                        </div>
                        <div className="flex-1 flex flex-col justify-center min-w-0 text-left">
                          <div className="flex items-baseline justify-between w-full">
                            <span className={cn(
                              "text-[13px] font-bold truncate transition-colors pr-2 flex-1",
                              isSelected ? "text-primary" : "text-foreground/80 group-hover:text-foreground"
                            )}>
                              {emp.name || "Unknown"}
                            </span>
                            {lastMsgTimeStr && (
                              <span className="text-[9px] text-muted-foreground/75 font-semibold shrink-0">
                                {lastMsgTimeStr}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between w-full mt-0.5">
                            <span className={cn(
                              "text-[10px] font-semibold truncate flex-1 leading-normal pr-2",
                              isUnread ? "text-foreground font-bold" : "text-muted-foreground/60"
                            )}>
                              {previewText || emp.role || "Employee"}
                            </span>
                            {isUnread && (
                              <span className="relative flex h-2 w-2 shrink-0 ml-2 animate-in zoom-in duration-200">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow shadow-red-500/50"></span>
                              </span>
                            )}
                          </div>
                        </div>
                      </Button>
                    );
                  })
                )}
              </motion.nav>
            ) : (
              // GROUP CHATS VIEW
              <motion.nav
                key="group-chats"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-1"
              >
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Shimmer className="h-9 w-9 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Shimmer className="h-3 w-2/3 rounded" />
                        <Shimmer className="h-2 w-1/2 rounded" />
                      </div>
                    </div>
                  ))
                ) : groups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <p className="text-xs font-medium text-muted-foreground/60 italic">No active groups yet</p>
                    {isLeadership && (
                      <Button
                        onClick={onCreateGroupClick}
                        variant="link"
                        className="text-xs font-bold mt-2 text-primary p-0"
                      >
                        Create your first group
                      </Button>
                    )}
                  </div>
                ) : (
                  groups.map((group) => {
                    const isSelected = selectedGroup?.id === group.id;
                    const isUnread = isGroupChatUnread(group);
                    const lastMsgTimeStr = formatLastMessageDate(group.lastMessageAt);
                    return (
                      <Button
                        key={group.id}
                        variant="ghost"
                        className={cn(
                          "h-16 w-full justify-start gap-4 px-3 rounded-xl transition-all duration-200 group relative border border-transparent",
                          isSelected ? "bg-primary/5 border-primary/10 shadow-sm" : "hover:bg-secondary/40"
                        )}
                        onClick={() => onSelectGroup?.(group)}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="active-chat-indicator"
                            className="absolute left-0 w-1.5 h-6 bg-primary rounded-r-full"
                          />
                        )}
                        
                        {/* Overlapping double-avatar look or custom group image */}
                        {group.photoUrl ? (
                          <Avatar className="h-9 w-9 border border-border/40 shrink-0 select-none">
                            <AvatarImage src={group.photoUrl} alt={group.name} className="object-cover" />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <Users className="h-4.5 w-4.5" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="relative shrink-0 w-9 h-9 flex items-center justify-center bg-primary/10 rounded-xl text-primary font-bold border border-primary/10 select-none">
                            <Users className="h-4.5 w-4.5" />
                          </div>
                        )}

                        <div className="flex-1 flex flex-col justify-center min-w-0 text-left">
                          <div className="flex items-baseline justify-between w-full">
                            <span className={cn(
                              "text-[13px] font-bold truncate transition-colors pr-2 flex-1",
                              isSelected ? "text-primary" : "text-foreground/80 group-hover:text-foreground"
                            )}>
                              {group.name}
                            </span>
                            {lastMsgTimeStr && (
                              <span className="text-[9px] text-muted-foreground/75 font-semibold shrink-0">
                                {lastMsgTimeStr}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between w-full mt-0.5">
                            <span className={cn(
                              "text-[10px] font-semibold truncate flex-1 leading-normal pr-2",
                              isUnread ? "text-foreground font-bold" : "text-muted-foreground/60"
                            )}>
                              {getGroupLastMessage(group)}
                            </span>
                            {isUnread && (
                              <span className="relative flex h-2 w-2 shrink-0 ml-2 animate-in zoom-in duration-200">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow shadow-red-500/50"></span>
                              </span>
                            )}
                          </div>
                        </div>
                      </Button>
                    );
                  })
                )}
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
