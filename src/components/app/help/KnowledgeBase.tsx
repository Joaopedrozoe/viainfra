
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";
import { knowledgeBaseContent } from "./knowledge-content";

export const KnowledgeBase = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible className="w-full">
        {knowledgeBaseContent.map((section) => (
          <AccordionItem key={section.id} value={section.id}>
            <AccordionTrigger className="text-base md:text-lg font-medium">
              {section.title}
            </AccordionTrigger>
            <AccordionContent className="text-sm md:text-base leading-relaxed">
              <div className="prose prose-sm md:prose-base max-w-none prose-headings:text-foreground prose-headings:font-semibold">
                {section.content}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="flex justify-start pt-4">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Voltar
        </Button>
      </div>
    </div>
  );
};
