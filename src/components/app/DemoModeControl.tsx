
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings, RotateCcw } from "lucide-react";
import { useDemoMode } from "@/hooks/useDemoMode";

export const DemoModeControl = () => {
  const { isDemoMode, toggleDemoMode, resetDemoData } = useDemoMode();

  // Don't render in production
  if (!isDemoMode) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge variant="outline" className="cursor-pointer text-xs">
          Demo
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium">Modo Demonstração</h4>
            <p className="text-sm text-muted-foreground">
              Você está usando dados de demonstração. Suas alterações não serão salvas permanentemente.
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetDemoData}
              className="justify-start"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar Dados Demo
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDemoMode}
              className="justify-start"
            >
              <Settings className="h-4 w-4 mr-2" />
              Sair do Modo Demo
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
