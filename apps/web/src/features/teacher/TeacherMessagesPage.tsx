import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Search, Send, User, ShieldCheck, CheckCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Heading,
  Skeleton,
  Text,
  useToast,
} from '@/components/ui';
import { fetchTeacherMessages } from './teacherApi';
import type { TeacherMessageDto } from '@fsd-sdg4/contracts';

interface ThreadMessage {
  id: string;
  senderName: string;
  isMe: boolean;
  content: string;
  sentAt: string;
}

export function TeacherMessagesPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [localThreads, setLocalThreads] = useState<Record<string, ThreadMessage[]>>({});

  const messagesQuery = useQuery({
    queryKey: ['teacher', 'messages'],
    queryFn: ({ signal }) => fetchTeacherMessages(signal),
  });

  const rawMessages = messagesQuery.data ?? [];

  // Filter conversations
  const filteredMessages = rawMessages.filter(
    (msg: TeacherMessageDto) =>
      search === '' ||
      msg.senderName.toLowerCase().includes(search.toLowerCase()) ||
      msg.subject.toLowerCase().includes(search.toLowerCase()) ||
      msg.preview.toLowerCase().includes(search.toLowerCase()),
  );

  const activeMsg = rawMessages.find((m) => m.id === selectedRecipientId) ?? rawMessages[0];

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeMsg) return;

    const newMsg: ThreadMessage = {
      id: `reply-${Date.now()}`,
      senderName: 'You (Teacher)',
      isMe: true,
      content: replyText.trim(),
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setLocalThreads((prev) => ({
      ...prev,
      [activeMsg.id]: [...(prev[activeMsg.id] ?? []), newMsg],
    }));

    setReplyText('');
    showToast({
      title: 'Message Sent',
      description: `Dispatched communication to ${activeMsg.senderName}.`,
      variant: 'success',
    });
  };

  const currentThread: ThreadMessage[] = activeMsg
    ? [
        {
          id: `init-${activeMsg.id}`,
          senderName: activeMsg.senderName,
          isMe: false,
          content: activeMsg.preview,
          sentAt: new Date(activeMsg.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        ...(localThreads[activeMsg.id] ?? []),
      ]
    : [];

  return (
    <AppShell
      title="Communication & Messages"
      breadcrumbs={[{ label: 'Faculty Portal', to: '/teacher' }, { label: 'Messages' }]}
    >
      <div className="space-y-4">
        {/* Top Info Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-border/80 bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <Heading level={2} className="text-base font-semibold text-text">
                Direct Guardian & Faculty Communication
              </Heading>
              <Text className="text-xs text-text-muted">
                Zero-trust tenant isolated channel for progress check-ins and academic inquiries.
              </Text>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral" className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Verified Guardians Only
            </Badge>
          </div>
        </div>

        {/* 2-Column Messaging Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[650px] border border-border/80 rounded-xl bg-surface overflow-hidden shadow-sm">
          {/* Left Panel: Conversation List (4 columns) */}
          <div className="lg:col-span-4 border-r border-border/60 flex flex-col h-full bg-surface">
            {/* Search Box */}
            <div className="p-3 border-b border-border/60">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full rounded-lg border border-border bg-surface-muted pl-9 pr-3 py-1.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/40">
              {messagesQuery.isLoading && (
                <div className="p-4 space-y-3">
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                </div>
              )}

              {messagesQuery.isError && (
                <div className="p-4">
                  <ErrorState
                    title="Failed to load"
                    description="Could not load messages."
                    onRetry={() => messagesQuery.refetch()}
                  />
                </div>
              )}

              {messagesQuery.isSuccess && filteredMessages.length === 0 && (
                <div className="p-6 text-center text-xs text-text-muted">
                  No conversations matching criteria.
                </div>
              )}

              {filteredMessages.map((msg) => {
                const isSelected = activeMsg?.id === msg.id;
                return (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => setSelectedRecipientId(msg.id)}
                    className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 ${
                      isSelected
                        ? 'bg-brand/5 border-l-4 border-brand'
                        : 'hover:bg-surface-muted/60'
                    }`}
                  >
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted font-semibold text-xs text-text border border-border/80">
                      <User className="h-4 w-4 text-text-muted" />
                      {msg.unread && (
                        <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-surface" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-text truncate">
                          {msg.senderName}
                        </span>
                        <span className="text-[10px] text-text-muted shrink-0">
                          {new Date(msg.timestamp).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-text-muted truncate mt-0.5">
                        {msg.subject}
                      </p>
                      <p className="text-[11px] text-text-muted/80 truncate mt-0.5">
                        {msg.preview}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Active Thread (8 columns) */}
          <div className="lg:col-span-8 flex flex-col h-full bg-surface-muted/20">
            {activeMsg ? (
              <>
                {/* Thread Header */}
                <div className="p-4 border-b border-border/60 bg-surface flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 font-bold text-sm text-brand">
                      {activeMsg.senderName.charAt(0)}
                    </div>
                    <div>
                      <Heading level={3} className="text-sm font-semibold text-text">
                        {activeMsg.senderName}
                      </Heading>
                      <Text className="text-xs text-text-muted">Subject: {activeMsg.subject}</Text>
                    </div>
                  </div>
                  <Badge variant="brand">Active Thread</Badge>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {currentThread.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-1 px-1">
                        <span className="font-medium">{m.senderName}</span>
                        <span>•</span>
                        <span>{m.sentAt}</span>
                      </div>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                          m.isMe
                            ? 'bg-brand text-brand-foreground rounded-br-xs'
                            : 'bg-surface border border-border/80 text-text rounded-bl-xs'
                        }`}
                      >
                        {m.content}
                      </div>
                      {m.isMe && (
                        <div className="flex items-center gap-1 text-[10px] text-text-muted mt-1 px-1">
                          <CheckCheck className="h-3 w-3 text-brand" />
                          <span>Delivered</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Composition Input */}
                <div className="p-3 border-t border-border/60 bg-surface">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${activeMsg.senderName}...`}
                      className="flex-1 rounded-lg border border-border bg-surface px-4 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    <Button type="submit" size="sm" disabled={!replyText.trim()}>
                      <Send className="h-3.5 w-3.5 mr-1" />
                      Send
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center p-8">
                <EmptyState
                  title="No Conversation Selected"
                  description="Select a guardian or colleague from the left panel to begin communicating."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default TeacherMessagesPage;
