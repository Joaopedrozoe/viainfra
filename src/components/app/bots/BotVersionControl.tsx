import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  GitBranch, 
  Play, 
  Settings,
  Plus,
  Clock,
  CheckCircle
} from "lucide-react";
import { BotVersion } from "@/pages/app/BotBuilder";

interface BotVersionControlProps {
  botVersions: BotVersion[];
  selectedBot: string;
  selectedVersion: string;
  onSelectBot: (botId: string) => void;
  onSelectVersion: (version: string) => void;
  onCreateNewVersion: () => void;
}

export function BotVersionControl({
  botVersions,
  selectedBot,
  selectedVersion,
  onSelectBot,
  onSelectVersion,
  onCreateNewVersion
}: BotVersionControlProps) {
  
  const currentBotVersions = botVersions.filter(bot => bot.id === selectedBot);
  const selectedBotData = botVersions.find(bot => 
    bot.id === selectedBot && bot.version === selectedVersion
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold mb-2">Bots Disponíveis</h3>
        <Card className="p-3 bg-background">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">FLUXO-VIAINFRA</p>
              <p className="text-xs text-muted-foreground">
                Bot principal de atendimento
              </p>
            </div>
            <Badge variant={selectedBotData?.status === 'published' ? 'default' : 'secondary'}>
              {selectedBotData?.status === 'published' ? 'Publicado' : 'Rascunho'}
            </Badge>
          </div>
        </Card>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm">Versões</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateNewVersion}
            className="h-8 px-2"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {currentBotVersions.map((version) => (
              <Card
                key={`${version.id}-${version.version}`}
                className={`p-3 cursor-pointer transition-colors hover:bg-accent ${
                  version.version === selectedVersion 
                    ? 'border-primary bg-primary/5' 
                    : ''
                }`}
                onClick={() => onSelectVersion(version.version)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-3 w-3" />
                    <span className="text-sm font-medium">{version.version}</span>
                  </div>
                  <Badge 
                    variant={version.status === 'published' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {version.status === 'published' ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    {version.status === 'published' ? 'Ativo' : 'Rascunho'}
                  </Badge>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p>Criado: {new Date(version.createdAt).toLocaleDateString('pt-BR')}</p>
                  <p>Atualizado: {new Date(version.updatedAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}