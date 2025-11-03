import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Message } from "@shared/schema";

const suggestedPrompts = [
  "What's been on your mind lately?",
  "Tell me about a recent challenge you faced",
  "How do you handle stress?",
  "What are your current goals?"
];

export function ChatInterface() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const createConversation = async () => {
      const response = await fetch("/api/conversations", { method: "POST" });
      const data = await response.json();
      setConversationId(data.id);
      
      setMessages([{
        id: "welcome",
        conversationId: data.id,
        role: "assistant",
        content: "Hello! I'm here to help you explore your thoughts and feelings. What would you like to talk about today?",
        createdAt: new Date()
      }]);
    };
    createConversation();
  }, []);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/messages", {
        conversationId,
        role: "user",
        content
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      setMessages(prev => [...prev, data.aiMessage]);
    }
  });

  const handleSend = () => {
    if (!input.trim() || !conversationId) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      conversationId,
      role: "user",
      content: input,
      createdAt: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    sendMessageMutation.mutate(input);
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="space-y-6">
      <Card data-testid="card-chat-interface">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Conversation
          </CardTitle>
          <Button variant="outline" size="sm" data-testid="button-save-conversation">
            Save Conversation
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[400px] pr-4" data-testid="scroll-messages">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${message.role}-${message.id}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}>
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {sendMessageMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">AI is typing...</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="space-y-3">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Share your thoughts..."
                className="resize-none"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || sendMessageMutation.isPending}
                size="icon"
                className="h-auto"
                data-testid="button-send-message"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card data-testid="card-suggested-prompts">
        <CardHeader>
          <CardTitle className="text-base">Conversation Starters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover-elevate active-elevate-2 px-3 py-2"
                onClick={() => handlePromptClick(prompt)}
                data-testid={`badge-prompt-${index}`}
              >
                {prompt}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
