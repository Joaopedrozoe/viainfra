import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUsers } from "@/contexts/UsersContext";
import { useAuth } from "@/contexts/auth";
import { DEFAULT_PERMISSIONS } from "@/types/permissions";
import { User, CreateUserData } from "@/types/users";
import { toast } from "sonner";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  UserCheck,
  UserX,
  Settings as SettingsIcon
} from "lucide-react";

export const UsersManagement = () => {
  const { profile } = useAuth();
  const { users, isAdmin, createUser, updateUser, deleteUser, updateUserPermissions, toggleUserStatus } = useUsers();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  
  // Create user form
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "attendant" as "admin" | "attendant"
  });

  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      email: "",
      password: "",
      role: "attendant"
    });
  };

  const handleCreateUser = async () => {
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      // Set default permissions for new user
      const defaultPermissions: Record<string, boolean> = {};
      DEFAULT_PERMISSIONS.forEach(category => {
        category.permissions.forEach(permission => {
          if (createForm.role === "admin") {
            defaultPermissions[permission.id] = true;
          } else {
            // Attendant gets basic permissions only
            defaultPermissions[permission.id] = permission.enabled && !permission.adminOnly;
          }
        });
      });

      const userData: CreateUserData = {
        ...createForm,
        permissions: defaultPermissions
      };

      await createUser(userData);
      setShowCreateModal(false);
      resetCreateForm();
      toast.success("Usuário criado com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar usuário");
    }
  };

  const handleEditPermissions = (user: User) => {
    setSelectedUser(user);
    setUserPermissions({ ...user.permissions });
    setShowPermissionsModal(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    try {
      await updateUserPermissions(selectedUser.id, userPermissions);
      setShowPermissionsModal(false);
      setSelectedUser(null);
      toast.success("Permissões atualizadas com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar permissões");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja deletar este usuário?")) return;

    try {
      await deleteUser(userId);
      toast.success("Usuário deletado com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao deletar usuário");
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      await toggleUserStatus(userId);
      toast.success("Status do usuário atualizado!");
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const getPermissionsByCategory = () => {
    return DEFAULT_PERMISSIONS.map(category => ({
      ...category,
      permissions: category.permissions.map(permission => ({
        ...permission,
        currentValue: userPermissions[permission.id] || false
      }))
    }));
  };

  if (!isAdmin) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Apenas administradores podem gerenciar usuários.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gerenciamento de Usuários
              </CardTitle>
              <CardDescription>
                Gerencie atendentes e suas permissões no sistema.
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)} variant="viainfra">
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} className={!user.isActive ? "opacity-60" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                    user.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'
                  }`}>
                    {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{user.name}</h3>
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                        {user.role === 'admin' ? 'Admin' : 'Atendente'}
                      </Badge>
                      {!user.isActive && (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                      {user.email === profile?.email && (
                        <Badge variant="outline">Você</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Criado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      {user.lastLogin && (
                        <> • Último acesso: {new Date(user.lastLogin).toLocaleDateString('pt-BR')}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPermissions(user)}
                  >
                    <SettingsIcon className="h-4 w-4 mr-1" />
                    Permissões
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(user.id)}
                  >
                    {user.isActive ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        Ativar
                      </>
                    )}
                  </Button>
                  {user.email !== profile?.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create User Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="usuario@viainfra.com.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha Temporária *</Label>
              <Input
                id="password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select value={createForm.role} onValueChange={(value: "admin" | "attendant") => 
                setCreateForm(prev => ({ ...prev, role: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendant">Atendente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} variant="viainfra">
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Modal */}
      <Dialog open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
        <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Permissões - {selectedUser?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4 -mx-6 px-6">
            <div className="space-y-6 py-4">
              {getPermissionsByCategory().map((category) => (
                <Card key={category.id} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{category.name}</CardTitle>
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
                              onCheckedChange={(checked) => {
                                setUserPermissions(prev => ({
                                  ...prev,
                                  [permission.id]: checked
                                }));
                              }}
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
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionsModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePermissions} variant="viainfra">
              Salvar Permissões
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};