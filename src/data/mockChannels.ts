
export interface DemoChannel {
  id: string;
  name: string;
  type: string;
  status: boolean;
  integration: string;
}

export const mockChannels: DemoChannel[] = [
  {
    id: "1",
    name: "WhatsApp Business",
    type: "WhatsApp",
    status: true,
    integration: "Twilio"
  },
  {
    id: "2", 
    name: "Email Corporativo",
    type: "Email",
    status: true,
    integration: "SendGrid"
  },
  {
    id: "3",
    name: "Facebook Messenger",
    type: "Facebook", 
    status: false,
    integration: "Meta"
  },
  {
    id: "4",
    name: "Instagram Direct",
    type: "Instagram",
    status: true,
    integration: "Meta"
  },
  {
    id: "5",
    name: "Telegram Bot",
    type: "Telegram",
    status: true, 
    integration: "Telegram API"
  },
  {
    id: "6",
    name: "Chat do Site",
    type: "Website",
    status: true,
    integration: "Widget Próprio"
  }
];

// Function to get channels from localStorage or return default
export const getDemoChannels = (): DemoChannel[] => {
  const saved = localStorage.getItem('demo-channels');
  return saved ? JSON.parse(saved) : mockChannels;
};

// Function to save channels to localStorage
export const saveDemoChannels = (channels: DemoChannel[]): void => {
  localStorage.setItem('demo-channels', JSON.stringify(channels));
};

// Function to add new channel
export const addDemoChannel = (channel: Omit<DemoChannel, 'id'>): DemoChannel => {
  const channels = getDemoChannels();
  const newChannel: DemoChannel = {
    ...channel,
    id: Date.now().toString()
  };
  const updatedChannels = [...channels, newChannel];
  saveDemoChannels(updatedChannels);
  return newChannel;
};

// Function to update channel
export const updateDemoChannel = (channelId: string, updates: Partial<DemoChannel>): void => {
  const channels = getDemoChannels();
  const updatedChannels = channels.map(channel =>
    channel.id === channelId ? { ...channel, ...updates } : channel
  );
  saveDemoChannels(updatedChannels);
};

// Function to delete channel
export const deleteDemoChannel = (channelId: string): void => {
  const channels = getDemoChannels();
  const updatedChannels = channels.filter(channel => channel.id !== channelId);
  saveDemoChannels(updatedChannels);
};

// Function to toggle channel status
export const toggleDemoChannelStatus = (channelId: string): void => {
  const channels = getDemoChannels();
  const updatedChannels = channels.map(channel =>
    channel.id === channelId ? { ...channel, status: !channel.status } : channel
  );
  saveDemoChannels(updatedChannels);
};
