import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Bot, Settings, Zap } from "lucide-react";
import { Channel } from "@/types/channels";

interface ChannelBotConfigProps {
  channel: Channel;
  onUpdateChannel: (channelId: string, updates: Partial<Channel>) => void;
}

// Mock dos bots disponíveis - em produção virá da API
const availableBots = [
  { id: "bot-1", name: "FLUXO-VIAINFRA", description: "Bot principal de atendimento", isActive: true },
  { id: "bot-2", name: "Bot Vendas", description: "Automação para vendas", isActive: false },
  { id: "bot-3", name: "Bot Suporte", description: "Suporte técnico automatizado", isActive: false },
];

export function ChannelBotConfig({ channel, onUpdateChannel }: ChannelBotConfigProps) {
  const [selectedBotId, setSelectedBotId] = useState<string>(
    channel.settings?.selectedBotId || ""
  );
  const [botEnabled, setBotEnabled] = useState<boolean>(
    channel.settings?.botEnabled || false
  );

  const selectedBot = availableBots.find(bot => bot.id === selectedBotId);

  const handleSaveConfig = () => {
    const updatedSettings = {
      ...channel.settings,
      selectedBotId,
      botEnabled,
    };

    onUpdateChannel(channel.id, {
      settings: updatedSettings
    });
  };

  const getChannelStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Configuração de Bot - {channel.name}
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${getChannelStatusColor(channel.status)}`} />
            {channel.status}
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure qual bot será acionado quando mensagens chegarem neste canal
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status do Canal */}
        <div className="p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Status da Conexão</span>
            <Badge variant={channel.status === 'connected' ? 'default' : 'destructive'}>
              {channel.status === 'connected' ? 'Conectado' : 'Desconectado'}
            </Badge>
          </div>
          {channel.type === 'whatsapp' && (
            <div className="text-sm text-gray-600">
              <div>Número: {channel.integration.phoneNumberId || 'Não configurado'}</div>
              <div>Instância: {channel.integration.configuration?.instanceId || 'N/A'}</div>
            </div>
          )}
        </div>

        {/* Configuração do Bot */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Ativar Bot Automático</h3>
              <p className="text-sm text-gray-600">
                Quando ativo, o bot responderá automaticamente às mensagens recebidas
              </p>
            </div>
            <Switch
              checked={botEnabled}
              onCheckedChange={setBotEnabled}
            />
          </div>

          {botEnabled && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Selecionar Bot</label>
                <Select value={selectedBotId} onValueChange={setSelectedBotId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Escolha um bot para este canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBots.map(bot => (
                      <SelectItem key={bot.id} value={bot.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${bot.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <div>
                            <div className="font-medium">{bot.name}</div>
                            <div className="text-sm text-gray-600">{bot.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedBot && (
                <div className="p-3 border rounded-lg bg-blue-50">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">{selectedBot.name}</span>
                    <Badge variant={selectedBot.isActive ? "default" : "secondary"}>
                      {selectedBot.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-700">{selectedBot.description}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configurações Avançadas */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações Avançadas
          </h3>
          
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Resposta Automática</div>
                <div className="text-sm text-gray-600">Responder automaticamente a novas conversas</div>
              </div>
              <Switch
                checked={channel.settings?.autoReply || false}
                onCheckedChange={(checked) => {
                  const updatedSettings = {
                    ...channel.settings,
                    autoReply: checked
                  };
                  onUpdateChannel(channel.id, { settings: updatedSettings });
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Horário Comercial</div>
                <div className="text-sm text-gray-600">Respeitar horário de funcionamento</div>
              </div>
              <Switch
                checked={channel.settings?.businessHours?.enabled || false}
                onCheckedChange={(checked) => {
                  const updatedSettings = {
                    ...channel.settings,
                    businessHours: {
                      ...channel.settings?.businessHours,
                      enabled: checked
                    }
                  };
                  onUpdateChannel(channel.id, { settings: updatedSettings });
                }}
              />
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleSaveConfig} className="flex-1">
            Salvar Configurações
          </Button>
          <Button variant="outline" onClick={() => {
            // Reset para valores originais
            setSelectedBotId(channel.settings?.selectedBotId || "");
            setBotEnabled(channel.settings?.botEnabled || false);
          }}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}