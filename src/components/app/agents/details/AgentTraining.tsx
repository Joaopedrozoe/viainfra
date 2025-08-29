
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
import { 
  FileUp,
  FileText,
  Link as LinkIcon,
  Plus,
  Trash2
} from "lucide-react";
import { Agent } from "@/types/agent";

interface AgentTrainingProps {
  agent: Agent;
}

export const AgentTraining = ({ agent }: AgentTrainingProps) => {
  const [activeTab, setActiveTab] = useState("documents");
  const [newUrl, setNewUrl] = useState("");

  const handleAddUrl = () => {
    console.log("URL added:", newUrl);
    setNewUrl("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">Base de Conhecimento</h2>
        <Button className="bg-bonina hover:bg-bonina/90 text-white">
          <Plus size={16} className="mr-2" /> Adicionar Conhecimento
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="qa">Perguntas e Respostas</TabsTrigger>
          <TabsTrigger value="urls">URLs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
              <CardDescription>
                Documentos carregados para treinamento do agente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    className="flex-1"
                    multiple
                    accept=".pdf,.csv,.doc,.docx,.txt"
                  />
                  <Button variant="outline">
                    <FileUp size={16} className="mr-2" /> Enviar
                  </Button>
                </div>
                
                {agent.knowledgeFiles.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Arquivo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Data de Envio</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agent.knowledgeFiles.map((file, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <FileText size={16} className="mr-2 text-gray-500" />
                              {file}
                            </div>
                          </TableCell>
                          <TableCell>
                            {file.split('.').pop()?.toUpperCase()}
                          </TableCell>
                          <TableCell>
                            {new Date().toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText size={48} className="mx-auto mb-2 opacity-20" />
                    <p>Nenhum documento carregado.</p>
                    <p className="text-sm">Carregue documentos para treinar o agente.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="qa">
          <Card>
            <CardHeader>
              <CardTitle>Perguntas e Respostas</CardTitle>
              <CardDescription>
                Pares de perguntas e respostas para treinamento do agente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agent.knowledgeQA.length > 0 ? (
                <div className="space-y-6">
                  <Button className="flex items-center">
                    <Plus size={16} className="mr-2" /> Adicionar Par Q&A
                  </Button>
                  
                  {agent.knowledgeQA.map((qa, index) => (
                    <Card key={index} className="border border-gray-200">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Pergunta</h4>
                            <p className="mt-1">{qa.question}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Resposta</h4>
                            <p className="mt-1">{qa.answer}</p>
                          </div>
                          <div className="flex justify-end">
                            <Button variant="ghost" size="sm">
                              <Trash2 size={16} className="mr-2" /> Remover
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum par de pergunta e resposta adicionado.</p>
                  <p className="text-sm">Adicione perguntas e respostas para treinar o agente.</p>
                  <Button className="mt-4 flex items-center">
                    <Plus size={16} className="mr-2" /> Adicionar Par Q&A
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="urls">
          <Card>
            <CardHeader>
              <CardTitle>URLs de Referência</CardTitle>
              <CardDescription>
                Links para sites que contêm informações relevantes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://exemplo.com/artigo"
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleAddUrl}
                    disabled={!newUrl.trim()}
                  >
                    <Plus size={16} className="mr-2" /> Adicionar
                  </Button>
                </div>
                
                {agent.knowledgeURLs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>URL</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agent.knowledgeURLs.map((url, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <LinkIcon size={16} className="mr-2 text-gray-500" />
                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                {url}
                              </a>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Indexado
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <LinkIcon size={48} className="mx-auto mb-2 opacity-20" />
                    <p>Nenhuma URL adicionada.</p>
                    <p className="text-sm">Adicione URLs para treinar o agente com conteúdo online.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
