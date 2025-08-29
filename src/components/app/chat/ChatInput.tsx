
import { useState, useCallback, memo, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatInputProps = {
  onSendMessage: (message: string) => void;
};

export const ChatInput = memo(({ onSendMessage }: ChatInputProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  // Optimize message handling with useCallback
  const handleSendMessage = useCallback(() => {
    if (newMessage.trim() === "") return;
    onSendMessage(newMessage);
    setNewMessage("");
  }, [newMessage, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const toggleRecording = useCallback(() => {
    setIsRecording(prev => !prev);
  }, []);

  const handleFileUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // TODO: Implement file upload logic
        console.log('File selected:', file.name);
      }
    };
    input.click();
  }, []);

  // Memoize input placeholder to avoid recreating on each render
  const inputPlaceholder = useMemo(() => {
    return isRecording ? "Gravando..." : "Digite uma mensagem...";
  }, [isRecording]);

  // Memoize button classes
  const recordingButtonClass = useMemo(() => {
    return cn(
      "p-2 rounded-full transition-colors",
      isRecording ? "text-red-500 hover:text-red-600" : "text-gray-500 hover:text-gray-700"
    );
  }, [isRecording]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:static">
      <div className="flex space-x-2 max-w-[100vw] md:max-w-full">
        <button
          className={recordingButtonClass}
          onClick={toggleRecording}
          aria-label={isRecording ? "Parar gravação" : "Iniciar gravação"}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <button
          className="p-2 text-gray-500 hover:text-gray-700 rounded-full transition-colors"
          onClick={handleFileUpload}
          aria-label="Enviar arquivo"
        >
          <FileUp size={20} />
        </button>
        <div className="flex-1">
          <Input
            placeholder={inputPlaceholder}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
            disabled={isRecording}
            aria-label="Digite uma mensagem"
          />
        </div>
        <Button 
          onClick={handleSendMessage} 
          className="bg-bonina hover:bg-bonina/90"
          disabled={!newMessage.trim() || isRecording}
          aria-label="Enviar mensagem"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13"></path>
            <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
          </svg>
        </Button>
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";
