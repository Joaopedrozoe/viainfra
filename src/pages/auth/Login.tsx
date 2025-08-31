
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth";
import { useDemoMode } from "@/hooks/useDemoMode";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
// import viainfraLogo from "@/assets/viainfra-logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, isAuthenticated } = useAuth();
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      {/* Demo Mode Toggle - Only visible in Lovable environment */}
      {window.location.hostname.includes('sandbox.lovable.dev') && (
        <div className="fixed top-4 right-4 flex items-center space-x-2 bg-white p-2 rounded shadow-lg border">
          <span className="text-sm font-medium">Demo Mode</span>
          <Switch 
            checked={isDemoMode} 
            onCheckedChange={toggleDemoMode}
          />
        </div>
      )}
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/c4694f21-258b-4986-8611-4b1b7fb7a727.png" 
            alt="ViaInfra" 
            className="h-20 mx-auto"
          />
        </div>
        
        <Card className="backdrop-blur-sm bg-white shadow-2xl border border-gray-100">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-800">Bem-vindo</CardTitle>
            <CardDescription>
              {isDemoMode ? 'Entre com suas credenciais de demonstração' : 'Entre para acessar sua conta'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button 
                type="submit" 
                className="w-full bg-gray-800 hover:bg-gray-700 text-white shadow-lg" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
              
              {isDemoMode && (
                <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800 text-center">
                  <strong>Modo Demo:</strong> Use qualquer email/senha para entrar<br/>
                  <span className="text-xs">Sugestão: atendimento@viainfra.com.br / atendimento@25</span>
                </div>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
