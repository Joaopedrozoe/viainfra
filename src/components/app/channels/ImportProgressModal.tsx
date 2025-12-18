import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, MessageSquare, Users, FolderArchive, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImportProgress {
  status: 'idle' | 'fetching' | 'processing' | 'syncing' | 'complete' | 'error';
  totalChats: number;
  processedChats: number;
  importedConversations: number;
  importedContacts: number;
  importedMessages: number;
  archivedCount: number;
  skippedCount: number;
  errorMessage?: string;
}

interface ImportProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: ImportProgress;
  instanceName: string;
}

export const ImportProgressModal = ({ open, onOpenChange, progress, instanceName }: ImportProgressModalProps) => {
  const getStatusText = () => {
    switch (progress.status) {
      case 'fetching':
        return 'Buscando conversas do WhatsApp...';
      case 'processing':
        return `Processando ${progress.processedChats} de ${progress.totalChats} conversas...`;
      case 'syncing':
        return 'Sincronizando mensagens...';
      case 'complete':
        return 'Importação concluída!';
      case 'error':
        return 'Erro na importação';
      default:
        return 'Iniciando importação...';
    }
  };

  const progressPercent = progress.totalChats > 0 
    ? Math.round((progress.processedChats / progress.totalChats) * 100) 
    : 0;

  const isComplete = progress.status === 'complete';
  const isError = progress.status === 'error';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : isError ? (
              <AlertCircle className="w-5 h-5 text-destructive" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            )}
            Importação - {instanceName}
          </DialogTitle>
          <DialogDescription>
            {getStatusText()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress bar */}
          {!isComplete && !isError && (
            <div className="space-y-2">
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {progressPercent}% concluído
              </p>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard 
              icon={<MessageSquare className="w-4 h-4" />}
              label="Conversas"
              value={progress.importedConversations}
              total={progress.totalChats}
              isComplete={isComplete}
            />
            <StatCard 
              icon={<Users className="w-4 h-4" />}
              label="Contatos"
              value={progress.importedContacts}
              isComplete={isComplete}
            />
            <StatCard 
              icon={<MessageSquare className="w-4 h-4 text-blue-500" />}
              label="Mensagens"
              value={progress.importedMessages}
              isComplete={isComplete}
            />
            <StatCard 
              icon={<FolderArchive className="w-4 h-4 text-amber-500" />}
              label="Arquivadas"
              value={progress.archivedCount}
              isComplete={isComplete}
            />
          </div>

          {/* Skipped info */}
          {progress.skippedCount > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {progress.skippedCount} conversas ignoradas (grupos, inválidas, etc.)
            </p>
          )}

          {/* Error message */}
          {isError && progress.errorMessage && (
            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-sm text-destructive">{progress.errorMessage}</p>
            </div>
          )}

          {/* Success message */}
          {isComplete && (
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
              <p className="text-sm text-green-700 dark:text-green-400">
                Importação concluída com sucesso!
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
  total?: number;
  isComplete: boolean;
}

const StatCard = ({ icon, label, value, total, isComplete }: StatCardProps) => (
  <div className={cn(
    "flex items-center gap-3 p-3 rounded-lg border bg-muted/30",
    isComplete && value > 0 && "border-green-500/30 bg-green-500/5"
  )}>
    <div className="text-muted-foreground">{icon}</div>
    <div>
      <p className="text-lg font-semibold">
        {value}
        {total !== undefined && total > 0 && (
          <span className="text-xs text-muted-foreground font-normal"> / {total}</span>
        )}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </div>
);
