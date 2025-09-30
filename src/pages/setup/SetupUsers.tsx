import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface UserResult {
  email: string;
  name: string;
  role: string;
  status: 'success' | 'error';
  error?: string;
}

interface SetupResult {
  company: {
    id: string;
    name: string;
  };
  users: UserResult[];
}

export default function SetupUsers() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SetupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const users = [
    {
      name: 'Elisabete Silva',
      email: 'elisabete.silva@viainfra.com.br',
      role: 'Admin Master',
      initials: 'ES',
      isAdmin: true,
    },
    {
      name: 'Joicy Souza',
      email: 'atendimento@viainfra.com.br',
      role: 'Atendente',
      initials: 'JS',
      isAdmin: false,
    },
    {
      name: 'Suelem Souza',
      email: 'manutencao@viainfra.com.br',
      role: 'Atendente',
      initials: 'SS',
      isAdmin: false,
    },
    {
      name: 'Giovanna Ferreira',
      email: 'gestaofinanceira@vianfra.com.br',
      role: 'Atendente',
      initials: 'GF',
      isAdmin: false,
    },
    {
      name: 'Sandra Romano',
      email: 'sandra.romano@vialogistic.com.br',
      role: 'Atendente',
      initials: 'SR',
      isAdmin: false,
    },
  ];

  const runSetup = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        'https://xxojpfhnkxpbznbmhmua.supabase.co/functions/v1/setup-users',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4b2pwZmhua3hwYnpuYm1obXVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzY4NTUsImV4cCI6MjA3NDgxMjg1NX0.K7pqFCShUgQWJgrHThPynEguIkS0_TjIOuKXvIEgNR4',
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        toast.success('Setup concluído com sucesso!');
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error('Erro ao executar setup');
    } finally {
      setLoading(false);
    }
  };

  const copyCompanyId = () => {
    if (result?.company.id) {
      navigator.clipboard.writeText(result.company.id);
      toast.success('Company ID copiado!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-secondary p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">🔧 Setup Inicial - Viainfra</CardTitle>
          <CardDescription>
            Criar empresa e usuários atendentes no sistema
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção!</strong> Esta função deve ser executada apenas{' '}
              <strong>UMA VEZ</strong> durante o setup inicial do sistema.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-semibold">👥 Usuários que serão criados:</h3>
            
            {users.map((user) => (
              <div
                key={user.email}
                className="flex items-center gap-3 p-3 bg-muted rounded-lg"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-semibold text-sm">
                  {user.initials}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
                <Badge variant={user.isAdmin ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </div>
            ))}
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm">🔑 Credenciais:</h4>
            <div className="text-sm space-y-1">
              <div>
                <strong>Senha padrão:</strong>{' '}
                <code className="bg-background px-2 py-1 rounded">atendimento@25</code>
              </div>
              <div>
                <strong>Empresa:</strong> Viainfra (Enterprise Plan)
              </div>
            </div>
          </div>

          {!result && (
            <Button
              onClick={runSetup}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando usuários...
                </>
              ) : (
                '🚀 Executar Setup'
              )}
            </Button>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Erro ao executar setup:</strong>
                <br />
                {error}
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>✅ Setup concluído com sucesso!</strong>
                
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between bg-white p-2 rounded">
                    <div>
                      <strong>Company ID:</strong>{' '}
                      <code className="text-xs">{result.company.id}</code>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyCompanyId}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="bg-white p-3 rounded space-y-2">
                    <strong className="text-sm">Usuários criados:</strong>
                    {result.users.map((user) => (
                      <div key={user.email} className="flex items-center gap-2 text-sm">
                        {user.status === 'success' ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-600" />
                        )}
                        <span>
                          {user.name} ({user.email}) - {user.role}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white p-3 rounded space-y-1 text-sm">
                    <strong>Próximos passos:</strong>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Faça login com qualquer um dos emails acima</li>
                      <li>Use a senha: <code>atendimento@25</code></li>
                      <li>Configure o COMPANY_ID no widget</li>
                      <li>Teste o fluxo completo</li>
                    </ol>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <Button
              onClick={() => window.location.href = '/login'}
              className="w-full"
              size="lg"
            >
              Ir para Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
