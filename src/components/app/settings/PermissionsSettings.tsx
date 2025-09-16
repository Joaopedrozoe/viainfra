import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/auth";
import { DEFAULT_PERMISSIONS, Permission } from "@/types/permissions";
import { toast } from "sonner";
import { Shield, Users, Settings, AlertTriangle, Save } from "lucide-react";

export const PermissionsSettings = () => {
  const { profile } = useAuth();
  const { userPermissions, updatePermissions, getAllPermissions } = usePermissions();
  
  // Direct admin check - same as Settings page
  const isAdmin = profile?.email === "elisabete.silva@viainfra.com.br" || profile?.email === "admin@sistema.com";
  
  // Debug logs
  console.log("PermissionsSettings Debug:", { 
    profileEmail: profile?.email, 
    isAdmin, 
    expectedEmail: "elisabete.silva@viainfra.com.br"
  });
  const [localPermissions, setLocalPermissions] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Load current permissions
  useEffect(() => {
    if (userPermissions && typeof userPermissions === 'object') {
      setLocalPermissions({ ...userPermissions });
    }
  }, [userPermissions]);

  // Check for changes
  useEffect(() => {
    if (userPermissions && typeof userPermissions === 'object') {
      const changed = Object.keys(localPermissions).some(
        key => localPermissions[key] !== userPermissions[key]
      );
      setHasChanges(changed);
    }
  }, [localPermissions, userPermissions]);

  const handlePermissionChange = (permissionId: string, enabled: boolean) => {
    setLocalPermissions(prev => ({
      ...prev,
      [permissionId]: enabled
    }));
  };

  const handleSaveChanges = () => {
    if (profile?.id) {
      updatePermissions(profile.id, localPermissions);
      setHasChanges(false);
      toast.success("Permissões atualizadas com sucesso!");
    }
  };

  const handleResetToDefaults = () => {
    const allPermissions = getAllPermissions();
    const defaultPermissions: Record<string, boolean> = {};
    
    allPermissions.forEach(permission => {
      defaultPermissions[permission.id] = permission.enabled && !permission.adminOnly;
    });
    
    setLocalPermissions(defaultPermissions);
    toast.info("Permissões restauradas para o padrão");
  };

  const getPermissionsByCategory = () => {
    return DEFAULT_PERMISSIONS.map(category => ({
      ...category,
      permissions: category.permissions.map(permission => ({
        ...permission,
        currentValue: localPermissions[permission.id] || false
      }))
    }));
  };

  if (!isAdmin) {
    console.log("Access denied - not admin:", { isAdmin, profileEmail: profile?.email });
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Apenas administradores podem acessar as configurações de permissões.
          <br />
          <small>Debug: Email atual: {profile?.email || "Não logado"}</small>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Controle de Permissões
              </CardTitle>
              <CardDescription>
                Gerencie o acesso às funcionalidades do sistema para diferentes usuários.
              </CardDescription>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Admin
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Info Alert */}
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Essas configurações afetam o acesso de todos os usuários do sistema. 
              Permissões marcadas como "Admin Only" só podem ser ativadas para administradores.
            </AlertDescription>
          </Alert>

          {/* Permission Categories */}
          {getPermissionsByCategory().map((category) => (
            <Card key={category.id} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.permissions.map((permission) => (
                    <div key={permission.id}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{permission.name}</h4>
                            {permission.adminOnly && (
                              <Badge variant="secondary" className="text-xs">
                                Admin Only
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {permission.description}
                          </p>
                        </div>
                            <Switch
                              checked={permission.currentValue}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(permission.id, checked)
                              }
                              // Admin can control all permissions - no disabled switches
                            />
                      </div>
                      {permission !== category.permissions[category.permissions.length - 1] && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
          >
            Restaurar Padrões
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={!hasChanges}
            variant="viainfra"
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {hasChanges ? "Salvar Alterações" : "Salvo"}
          </Button>
        </CardFooter>
      </Card>

      {/* Permission Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo de Permissões Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {getAllPermissions()
              .filter(permission => localPermissions[permission.id])
              .map(permission => (
                <Badge key={permission.id} variant="outline" className="justify-start">
                  {permission.name}
                </Badge>
              ))}
          </div>
          {getAllPermissions().filter(permission => localPermissions[permission.id]).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma permissão ativa
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};