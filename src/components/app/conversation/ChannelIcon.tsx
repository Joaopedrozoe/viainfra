
import { Channel } from "@/types/conversation";
import { cn } from "@/lib/utils";
import { Instagram, Facebook, Mail, MessageCircle, Phone } from "lucide-react";

interface ChannelIconProps {
  channel: Channel;
  hasBackground?: boolean;
}

const channelConfig = {
  whatsapp: {
    color: "#25D366",
    Icon: () => (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.6 6.31999C16.8 5.49999 15.8 4.84999 14.7 4.39999C13.6 3.94999 12.5 3.69999 11.3 3.69999C9.89998 3.69999 8.59998 3.99999 7.39998 4.59999C6.19998 5.19999 5.19998 5.99999 4.39998 6.99999C3.59998 7.99999 2.99998 9.19999 2.69998 10.5C2.39998 11.8 2.39998 13.1 2.69998 14.4C2.99998 15.7 3.49998 16.9 4.29998 17.9L2.69998 21.3L6.19998 19.7C7.09998 20.4 8.09998 20.9 9.19998 21.2C10.3 21.5 11.4 21.6 12.5 21.5C14.5 21.3 16.3 20.5 17.7 19.2C19.1 17.9 20.1 16.1 20.5 14.1C20.9 12.1 20.7 10.2 19.9 8.49999C19.1 6.89999 18 6.31999 17.6 6.31999Z" fill="currentColor"/>
      </svg>
    )
  },
  instagram: {
    color: "#E1306C",
    Icon: Instagram
  },
  messenger: {
    color: "#0088FF",
    Icon: Facebook
  },
  telegram: {
    color: "#0088cc",
    Icon: () => (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-3.11-8.83l.013-.007.87 2.87c.112.311.266.367.453.341.188-.025.287-.126.41-.244l1.188-1.148 2.55 1.888c.466.257.801.124.917-.432l1.657-7.822c.183-.728-.137-1.02-.702-.788l-9.733 3.76c-.664.266-.66.638-.12.8l2.497.98z" fill="currentColor"/>
      </svg>
    )
  },
  email: {
    color: "#6B7280",
    Icon: Mail
  },
  sms: {
    color: "#10B981",
    Icon: MessageCircle
  },
  phone: {
    color: "#8B5CF6",
    Icon: Phone
  }
};

export const ChannelIcon = ({ channel, hasBackground = false }: ChannelIconProps) => {
  const config = channelConfig[channel as keyof typeof channelConfig];
  
  // Fallback for unknown channels
  if (!config) {
    return (
      <div
        className={cn(
          "absolute -bottom-1 -right-1 w-4 h-4 flex items-center justify-center",
          hasBackground && "rounded-full p-1"
        )}
        style={hasBackground ? {
          background: "#6B7280"
        } : {}}
      >
        <MessageCircle 
          className="stroke-current"
          size={12}
          style={{ color: hasBackground ? "#fff" : "#6B7280" }}
        />
      </div>
    );
  }
  
  const IconComponent = config.Icon;
  
  return (
    <div
      className={cn(
        "absolute -bottom-1 -right-1 w-4 h-4 flex items-center justify-center",
        hasBackground && "rounded-full p-1"
      )}
      style={hasBackground ? {
        background: config.color
      } : {}}
    >
      <IconComponent 
        className="stroke-current"
        size={12}
        style={{ color: hasBackground ? "#fff" : config.color }}
      />
    </div>
  );
};

