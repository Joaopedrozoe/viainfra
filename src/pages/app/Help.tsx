import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { KnowledgeBase } from "@/components/app/help/KnowledgeBase";
import { SupportChat } from "@/components/app/help/SupportChat";


const Help = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="p-4 md:p-6 min-h-full">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">Base de Conhecimento</h1>
        
        
        {/* Existing Knowledge Base */}
        <KnowledgeBase />
      </div>
      
      {/* Support Chat Float Button */}
      <SupportChat />
    </div>
  );
};

export default Help;
