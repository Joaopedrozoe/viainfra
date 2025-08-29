
import { useState } from "react";
import { 
  Input 
} from "@/components/ui/input";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Label 
} from "@/components/ui/label";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import { 
  Textarea 
} from "@/components/ui/textarea";
import { Agent } from "@/types/agent";
import { X } from "lucide-react";

interface AgentKnowledgeProps {
  agent: Partial<Agent>;
  updateAgent: (data: Partial<Agent>) => void;
}

export const AgentKnowledge = ({ agent, updateAgent }: AgentKnowledgeProps) => {
  const [newQA, setNewQA] = useState({ question: "", answer: "" });
  const [newURL, setNewURL] = useState("");

  const addFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => file.name);
      updateAgent({ 
        knowledgeFiles: [...(agent.knowledgeFiles || []), ...newFiles]
      });
    }
  };

  const removeFile = (fileName: string) => {
    updateAgent({
      knowledgeFiles: (agent.knowledgeFiles || []).filter(file => file !== fileName)
    });
  };

  const addQA = () => {
    if (newQA.question.trim() && newQA.answer.trim()) {
      updateAgent({
        knowledgeQA: [...(agent.knowledgeQA || []), { ...newQA }]
      });
      setNewQA({ question: "", answer: "" });
    }
  };

  const removeQA = (index: number) => {
    const updatedQA = [...(agent.knowledgeQA || [])];
    updatedQA.splice(index, 1);
    updateAgent({ knowledgeQA: updatedQA });
  };

  const addURL = () => {
    if (newURL.trim()) {
      updateAgent({
        knowledgeURLs: [...(agent.knowledgeURLs || []), newURL]
      });
      setNewURL("");
    }
  };

  const removeURL = (url: string) => {
    updateAgent({
      knowledgeURLs: (agent.knowledgeURLs || []).filter(u => u !== url)
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Base de Conhecimento</h2>
        <p className="text-sm text-gray-500 mb-6">
          Adicione documentos, perguntas e respostas, ou URLs para treinar seu agente.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label>Documentos</Label>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              onChange={addFile}
              className="flex-1"
              multiple
              accept=".pdf,.csv,.doc,.docx,.txt"
            />
          </div>

          {agent.knowledgeFiles && agent.knowledgeFiles.length > 0 && (
            <div className="grid gap-2 mt-2">
              {agent.knowledgeFiles.map((file, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between bg-gray-50 p-2 rounded"
                >
                  <span className="text-sm truncate">{file}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeFile(file)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Label>Perguntas e Respostas</Label>

          <Card className="border border-gray-200">
            <CardContent className="pt-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="question">Pergunta</Label>
                  <Input
                    id="question"
                    value={newQA.question}
                    onChange={(e) => setNewQA({...newQA, question: e.target.value})}
                    placeholder="Ex: Como faço para resetar minha senha?"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="answer">Resposta</Label>
                  <Textarea
                    id="answer"
                    value={newQA.answer}
                    onChange={(e) => setNewQA({...newQA, answer: e.target.value})}
                    placeholder="Ex: Para resetar sua senha, clique em 'Esqueci minha senha' na tela de login..."
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={addQA}
                  disabled={!newQA.question.trim() || !newQA.answer.trim()}
                  variant="outline"
                >
                  Adicionar Par Q&A
                </Button>
              </div>
            </CardContent>
          </Card>

          {agent.knowledgeQA && agent.knowledgeQA.length > 0 && (
            <div className="grid gap-2 mt-2">
              {agent.knowledgeQA.map((qa, index) => (
                <div 
                  key={index} 
                  className="bg-gray-50 p-3 rounded"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-2">
                      <p className="font-medium text-sm">{qa.question}</p>
                      <p className="text-sm text-gray-600 mt-1">{qa.answer}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeQA(index)}
                      className="mt-1"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Label>URLs de Referência</Label>
          <div className="flex items-center gap-2">
            <Input
              value={newURL}
              onChange={(e) => setNewURL(e.target.value)}
              placeholder="https://exemplo.com/artigo"
              className="flex-1"
            />
            <Button 
              onClick={addURL}
              disabled={!newURL.trim()}
              variant="outline"
            >
              Adicionar
            </Button>
          </div>

          {agent.knowledgeURLs && agent.knowledgeURLs.length > 0 && (
            <div className="grid gap-2 mt-2">
              {agent.knowledgeURLs.map((url, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between bg-gray-50 p-2 rounded"
                >
                  <span className="text-sm truncate">{url}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeURL(url)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
