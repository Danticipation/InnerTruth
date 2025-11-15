import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, Plus, Mic, MicOff, Volume2, VolumeX, VolumeOff } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Message, Conversation } from "@shared/schema";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useToast } from "@/hooks/use-toast";

const suggestedPrompts = [
  "What's been on your mind lately?",
  "Tell me about a recent challenge you faced",
  "How do you handle stress?",
  "What are your current goals?"
];

export function ChatInterface() {
  const [conversationId, setConversationId] = useState<string | null>(() => {
    return sessionStorage.getItem("currentConversationId");
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("autoPlayEnabled");
    // Default to true if never set before
    return saved === null ? true : saved === "true";
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestAiMessageRef = useRef<string | null>(null);
  const { toast } = useToast();

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: isSpeechRecognitionSupported,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech({
    onStart: () => {
      // When playback actually starts, update the speaking message ID
      if (pendingMessageId) {
        setSpeakingMessageId(pendingMessageId);
        setPendingMessageId(null);
      }
      
      // Stop listening when playback starts to prevent feedback
      if (isListening) {
        stopListening();
      }
    },
    onEnd: () => {
      setSpeakingMessageId(null);
      setPendingMessageId(null);
    },
    onError: (error) => {
      toast({
        title: "Speech Error",
        description: "Failed to generate speech. Please try again.",
        variant: "destructive",
      });
      setSpeakingMessageId(null);
      setPendingMessageId(null);
    },
  });

  // Save auto-play preference to localStorage
  useEffect(() => {
    localStorage.setItem("autoPlayEnabled", String(autoPlayEnabled));
  }, [autoPlayEnabled]);

  // Show toast when speech recognition errors occur
  useEffect(() => {
    if (speechError) {
      const errorMessages: Record<string, string> = {
        'not-allowed': 'Microphone permission denied. Please allow microphone access.',
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'No microphone found. Please check your device.',
        'network': 'Network error. Please check your connection.',
      };
      
      toast({
        title: "Voice Input Error",
        description: errorMessages[speechError] || 'Speech recognition failed. Please try again.',
        variant: "destructive",
      });
    }
  }, [speechError, toast]);

  // Initialize latestAiMessageRef when messages load or auto-play is toggled on
  useEffect(() => {
    if (messages.length === 0) return;

    // Find the most recent assistant message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        // Update the ref when:
        // 1. It's not set yet (initial load)
        // 2. Auto-play is enabled (sync to latest when toggled on)
        // This prevents replaying old messages when loading or re-enabling auto-play
        if (!latestAiMessageRef.current || autoPlayEnabled) {
          latestAiMessageRef.current = messages[i].id;
        }
        break;
      }
    }
  }, [messages, autoPlayEnabled]);

  // Auto-play AI messages when enabled
  useEffect(() => {
    if (!autoPlayEnabled || messages.length === 0) return;

    // Find the latest message
    const latestMessage = messages[messages.length - 1];
    
    // Only auto-play if it's an AI message and we haven't played it yet
    if (
      latestMessage.role === "assistant" && 
      latestMessage.id !== latestAiMessageRef.current &&
      !isSpeaking &&
      !pendingMessageId
    ) {
      latestAiMessageRef.current = latestMessage.id;
      setPendingMessageId(latestMessage.id);
      speak(latestMessage.content);
    }
  }, [messages, autoPlayEnabled, isSpeaking, pendingMessageId, speak]);

  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"]
  });

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sendMessageMutation.isPending]);

  useEffect(() => {
    const loadOrCreateConversation = async () => {
      if (!conversations || isInitialized) return;

      // Priority 1: Check if we have a stored conversation ID that still exists
      const storedId = sessionStorage.getItem("currentConversationId");
      if (storedId && conversations.some(c => c.id === storedId)) {
        setConversationId(storedId);
        
        const messagesRes = await fetch(`/api/messages/${storedId}`);
        const loadedMessages: Message[] = await messagesRes.json();
        
        if (loadedMessages.length > 0) {
          setMessages(loadedMessages);
        } else {
          setMessages([{
            id: "welcome",
            conversationId: storedId,
            role: "assistant",
            content: "Hello! I'm here to help you explore your thoughts and feelings. What would you like to talk about today?",
            createdAt: new Date()
          }]);
        }
      } else if (conversations.length > 0) {
        // Priority 2: Load most recent conversation if no valid stored ID
        const mostRecent = conversations[0];
        setConversationId(mostRecent.id);
        sessionStorage.setItem("currentConversationId", mostRecent.id);
        
        const messagesRes = await fetch(`/api/messages/${mostRecent.id}`);
        const loadedMessages: Message[] = await messagesRes.json();
        
        if (loadedMessages.length > 0) {
          setMessages(loadedMessages);
        } else {
          setMessages([{
            id: "welcome",
            conversationId: mostRecent.id,
            role: "assistant",
            content: "Hello! I'm here to help you explore your thoughts and feelings. What would you like to talk about today?",
            createdAt: new Date()
          }]);
        }
      } else {
        // Priority 3: Create new conversation only if absolutely none exist
        const response = await fetch("/api/conversations", { method: "POST" });
        const data = await response.json();
        setConversationId(data.id);
        sessionStorage.setItem("currentConversationId", data.id);
        
        setMessages([{
          id: "welcome",
          conversationId: data.id,
          role: "assistant",
          content: "Hello! I'm here to help you explore your thoughts and feelings. What would you like to talk about today?",
          createdAt: new Date()
        }]);
      }
      
      setIsInitialized(true);
    };

    if (conversations !== undefined && !isInitialized) {
      loadOrCreateConversation();
    }
  }, [conversations, isInitialized]);

  useEffect(() => {
    if (isListening) {
      const fullTranscript = (transcript + ' ' + interimTranscript).trim();
      setInput(fullTranscript);
    }
  }, [transcript, interimTranscript, isListening]);

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
    if (isListening) {
      stopListening();
      resetTranscript();
    }
    sendMessageMutation.mutate(input);
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      if (!isSpeechRecognitionSupported) {
        toast({
          title: "Not Supported",
          description: "Speech recognition is not supported in your browser. Try Chrome or Edge.",
          variant: "destructive",
        });
        return;
      }
      resetTranscript();
      startListening();
    }
  };

  const handleSpeakMessage = async (messageId: string, content: string) => {
    // If clicking the same message that's currently speaking, stop it
    if (speakingMessageId === messageId || pendingMessageId === messageId) {
      stopSpeaking();
      setSpeakingMessageId(null);
      setPendingMessageId(null);
      return;
    }
    
    // Set pending ID and start playback
    // The actual speaking ID will be set in onStart callback when playback begins
    setPendingMessageId(messageId);
    speak(content);
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  const handleNewConversation = async () => {
    setIsInitialized(false);  // Reset to allow reinitialization with new conversation
    const response = await fetch("/api/conversations", { method: "POST" });
    const data = await response.json();
    setConversationId(data.id);
    sessionStorage.setItem("currentConversationId", data.id);
    
    setMessages([{
      id: "welcome",
      conversationId: data.id,
      role: "assistant",
      content: "Hello! I'm here to help you explore your thoughts and feelings. What would you like to talk about today?",
      createdAt: new Date()
    }]);
    setIsInitialized(true);  // Mark as initialized again
  };

  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card data-testid="card-chat-interface">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="hidden sm:inline">AI Conversation</span>
            <span className="sm:hidden">Chat</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={autoPlayEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
              data-testid="button-toggle-autoplay"
              className="shrink-0"
            >
              {autoPlayEnabled ? (
                <Volume2 className="h-4 w-4 sm:mr-1" />
              ) : (
                <VolumeOff className="h-4 w-4 sm:mr-1" />
              )}
              <span className="hidden sm:inline">
                {autoPlayEnabled ? "Auto-play On" : "Auto-play Off"}
              </span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNewConversation}
              data-testid="button-new-conversation"
            >
              <Plus className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">New Chat</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          <ScrollArea className="h-[300px] sm:h-[400px] pr-2 sm:pr-4" data-testid="scroll-messages">
            <div className="space-y-3 sm:space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${message.role}-${message.id}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-3 sm:p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                    <p className={`text-xs mt-1.5 sm:mt-2 ${
                      message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}>
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.role === "assistant" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0 h-8 w-8"
                      onClick={() => handleSpeakMessage(message.id, message.content)}
                      disabled={isListening}
                      data-testid={`button-speak-${message.id}`}
                    >
                      {(speakingMessageId === message.id || pendingMessageId === message.id) ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
              {sendMessageMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 sm:p-4">
                    <p className="text-sm text-muted-foreground">AI is typing...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Listening..." : "Share your thoughts..."}
                  className="resize-none text-sm sm:text-base"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  data-testid="input-chat-message"
                />
                {isListening && (
                  <Badge variant="destructive" className="absolute top-2 right-2 animate-pulse">
                    Recording
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  onClick={toggleVoiceInput}
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  data-testid="button-voice-input"
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || sendMessageMutation.isPending}
                  size="icon"
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card data-testid="card-suggested-prompts">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-sm sm:text-base">Conversation Starters</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover-elevate active-elevate-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
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
