import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, KeyRound, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'email' | 'code' | 'success';

export const ForgotPasswordModal = ({ isOpen, onClose }: ForgotPasswordModalProps) => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>('email');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Digite seu e-mail");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email }
      });

      if (error) throw error;

      if (data?.success) {
        setStep('code');
        toast.success("Código enviado para seu e-mail!");
      } else {
        throw new Error(data?.error || 'Erro ao enviar código');
      }
    } catch (error: any) {
      console.error('Error sending reset code:', error);
      toast.error(error.message || "Erro ao enviar código. Verifique se o SMTP está configurado.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      toast.error("Digite o código de 6 dígitos");
      return;
    }

    if (!newPassword) {
      toast.error("Digite a nova senha");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não conferem");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-reset-code', {
        body: { email, code, newPassword }
      });

      if (error) throw error;

      if (data?.success) {
        setStep('success');
        toast.success("Senha alterada com sucesso!");
      } else {
        throw new Error(data?.error || 'Código inválido');
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      toast.error(error.message || "Código inválido ou expirado");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setStep('email');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'email' && <Mail className="h-5 w-5" />}
            {step === 'code' && <KeyRound className="h-5 w-5" />}
            {step === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {step === 'email' && 'Recuperar Senha'}
            {step === 'code' && 'Verificar Código'}
            {step === 'success' && 'Senha Alterada'}
          </DialogTitle>
        </DialogHeader>
        
        {step === 'email' && (
          <form onSubmit={handleSendCode}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">E-mail</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Digite seu e-mail e enviaremos um código para redefinir sua senha.
              </p>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} variant="viainfra">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Código"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerifyCode}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reset-code">Código de Verificação</Label>
                <Input
                  id="reset-code"
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Verifique seu e-mail ({email}) e digite o código de 6 dígitos.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirme a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep('email')}>
                Voltar
              </Button>
              <Button type="submit" disabled={isLoading} variant="viainfra">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Alterar Senha"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 'success' && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium">Senha Alterada!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Sua senha foi alterada com sucesso. Agora você pode fazer login com a nova senha.
              </p>
            </div>
            
            <DialogFooter>
              <Button onClick={handleClose} variant="viainfra" className="w-full">
                Fazer Login
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
