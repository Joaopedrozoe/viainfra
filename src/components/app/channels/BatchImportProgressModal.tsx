import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, MessageSquare, Users, FolderArchive, Image, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BatchImportProgress } from '@/hooks/useWhatsAppInstances';

interface BatchImportProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: BatchImportProgress | null;
  instanceName: string;
  isRunning: boolean;
  onContinue: () => void;
  onPause: () => void;
}

const PHASE_LABELS: Record<string, string> = {
  starting: 'Iniciando...',
  messages: 'Importando mensagens',
  contacts: 'Importando contatos',
  history: 'Importando histórico',
  avatars: 'Sincronizando fotos',
  completed: 'Concluído!',
};

const PHASE_ORDER = ['messages', 'contacts', 'history', 'avatars', 'completed'];

export const BatchImportProgressModal = ({ 
  open, 
  onOpenChange, 
  progress,
  instanceName,
  isRunning,
  onContinue,
  onPause,
}: BatchImportProgressModalProps) => {
  const phase = progress?.phase || 'starting';
  const isComplete = progress?.completed || phase === 'completed';
  const currentPhaseIndex = PHASE_ORDER.indexOf(phase);
  
  const progressPercent = progress?.totalItems && progress.totalItems > 0 
    ? Math.round((progress.processedItems / progress.totalItems) * 100) 
    : 0;

  // Overall progress across all phases
  const overallProgress = isComplete 
    ? 100 
    : Math.round(((currentPhaseIndex + (progressPercent / 100)) / PHASE_ORDER.length) * 100);

  const getSummaryValue = (key: string): number => {
    if (!progress?.summary) return 0;
    return progress.summary[key] || 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : isRunning ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <Pause className="w-5 h-5 text-amber-500" />
            )}
            Importação de Histórico - {instanceName}
          </DialogTitle>
          <DialogDescription>
            {isComplete 
              ? 'Importação concluída com sucesso!' 
              : isRunning 
                ? PHASE_LABELS[phase] || 'Processando...'
                : 'Importação pausada. Clique em continuar para retomar.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Overall progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progresso Geral</span>
              <span className="text-muted-foreground">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>

          {/* Phase indicators */}
          <div className="flex justify-between text-xs px-1">
            {PHASE_ORDER.slice(0, -1).map((p, i) => {
              const isActive = p === phase;
              const isDone = currentPhaseIndex > i || isComplete;
              return (
                <div 
                  key={p} 
                  className={cn(
                    "flex flex-col items-center gap-1",
                    isActive && "text-primary font-medium",
                    isDone && "text-green-600",
                    !isActive && !isDone && "text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "w-3 h-3 rounded-full border-2",
                    isDone && "bg-green-500 border-green-500",
                    isActive && "border-primary bg-primary/20",
                    !isActive && !isDone && "border-muted-foreground/50"
                  )} />
                  <span className="capitalize">{p === 'messages' ? 'Msgs' : p === 'contacts' ? 'Contatos' : p === 'history' ? 'Histórico' : 'Fotos'}</span>
                </div>
              );
            })}
          </div>

          {/* Current phase progress */}
          {!isComplete && progress?.totalItems !== undefined && progress.totalItems > 0 && (
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-sm">
                <span>Fase atual: {PHASE_LABELS[phase]}</span>
                <span className="text-muted-foreground">
                  {progress.processedItems} / {progress.totalItems}
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <StatCard 
              icon={<MessageSquare className="w-4 h-4" />}
              label="Mensagens"
              value={getSummaryValue('messagesImported')}
              isComplete={isComplete}
            />
            <StatCard 
              icon={<Users className="w-4 h-4" />}
              label="Contatos"
              value={getSummaryValue('contactsCreated') + getSummaryValue('contactsUpdated')}
              subtext={getSummaryValue('contactsCreated') > 0 ? `${getSummaryValue('contactsCreated')} novos` : undefined}
              isComplete={isComplete}
            />
            <StatCard 
              icon={<FolderArchive className="w-4 h-4 text-amber-500" />}
              label="Históricos"
              value={getSummaryValue('historiesImported')}
              subtext={getSummaryValue('conversationsCreated') > 0 ? `${getSummaryValue('conversationsCreated')} convs` : undefined}
              isComplete={isComplete}
            />
            <StatCard 
              icon={<Image className="w-4 h-4 text-blue-500" />}
              label="Avatares"
              value={getSummaryValue('avatarsUpdated')}
              isComplete={isComplete}
            />
          </div>

          {/* Action buttons */}
          {!isComplete && (
            <div className="flex justify-center gap-2 pt-2">
              {isRunning ? (
                <Button variant="outline" onClick={onPause}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </Button>
              ) : (
                <Button onClick={onContinue}>
                  <Play className="w-4 h-4 mr-2" />
                  Continuar Importação
                </Button>
              )}
            </div>
          )}

          {/* Success message */}
          {isComplete && (
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
              <p className="text-sm text-green-700 dark:text-green-400">
                ✅ Importação completa! Todas as conversas e contatos foram sincronizados.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtext?: string;
  isComplete: boolean;
}

const StatCard = ({ icon, label, value, subtext, isComplete }: StatCardProps) => (
  <div className={cn(
    "flex items-center gap-3 p-3 rounded-lg border bg-muted/30",
    isComplete && value > 0 && "border-green-500/30 bg-green-500/5"
  )}>
    <div className="text-muted-foreground">{icon}</div>
    <div>
      <p className="text-lg font-semibold">
        {value.toLocaleString()}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {subtext && <p className="text-xs text-muted-foreground/70">{subtext}</p>}
    </div>
  </div>
);
