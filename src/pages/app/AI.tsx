
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { WebhookForm } from "@/components/app/ai/WebhookForm";
import { TestResult } from "@/components/app/ai/TestResult";
import { ApiDocumentation } from "@/components/app/ai/ApiDocumentation";

const AI = () => {
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    response?: string;
    requestTime?: string;
  } | null>(null);
  
  const isMobile = useIsMobile();
  
  return (
    <div className="h-full">
      <main className="h-full overflow-auto">
      <div className={cn(
        "flex-1 p-4 pb-16 overflow-y-auto",
        isMobile ? "w-full" : ""
      )}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">Integração com IA</h1>
          
          <WebhookForm onTestComplete={setTestResult} />
          
          {testResult && <TestResult result={testResult} />}
          
          <ApiDocumentation />
        </div>
        </div>
      </main>
    </div>
  );
};

export default AI;
