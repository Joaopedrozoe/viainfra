import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDepartments } from "@/contexts/DepartmentsContext";
import { useUsers } from "@/contexts/UsersContext";
import { useAuth } from "@/contexts/auth";
import { Department, CreateDepartmentData } from "@/types/departments";
import { toast } from "sonner";
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Users as UsersIcon,
  UserPlus,
  UserMinus,
  AlertTriangle
} from "lucide-react";

export const DepartmentsManagement = () => {
  const { profile } = useAuth();
  const { users, isAdmin } = useUsers();
  const { 
    departments, 
    createDepartment, 
    updateDepartment, 
    deleteDepartment,
    addMemberToDepartment,
    removeMemberFromDepartment
  } = useDepartments();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  
  // Create department form
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    members: [] as string[]
  });

  // Edit department form
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    members: [] as string[]
  });

  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      description: "",
      members: []
    });
  };

  const resetEditForm = () => {
    setEditForm({
      name: "",
      description: "",
      members: []
    });
  };

  // Handle create department
  const handleCreate = async () => {
    try {
      if (!createForm.name.trim()) {
        toast.error("Nome do departamento é obrigatório");
        return;
      }

      await createDepartment({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        members: createForm.members
      });
      
      toast.success("Departamento criado com sucesso!");
      setShowCreateModal(false);
      resetCreateForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar departamento");
    }
  };

  // Handle edit department
  const handleEdit = async () => {
    if (!selectedDepartment) return;

    try {
      if (!editForm.name.trim()) {
        toast.error("Nome do departamento é obrigatório");
        return;
      }

      await updateDepartment(selectedDepartment.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        members: editForm.members
      });
      
      toast.success("Departamento atualizado com sucesso!");
      setShowEditModal(false);
      setSelectedDepartment(null);
      resetEditForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar departamento");
    }
  };

  // Handle delete department
  const handleDelete = async (departmentId: string) => {
    if (!window.confirm("Tem certeza que deseja deletar este departamento?")) {
      return;
    }

    try {
      await deleteDepartment(departmentId);
      toast.success("Departamento deletado com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao deletar departamento");
    }
  };

  // Open edit modal
  const openEditModal = (department: Department) => {
    setSelectedDepartment(department);
    setEditForm({
      name: department.name,
      description: department.description,
      members: [...department.members]
    });
    setShowEditModal(true);
  };

  // Get user name by ID
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : "Usuário não encontrado";
  };

  // Available users (not in current department for edit, all for create)
  const getAvailableUsers = (departmentMembers: string[] = []) => {
    return users.filter(user => !departmentMembers.includes(user.id));
  };

  if (!isAdmin) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Apenas administradores podem gerenciar departamentos.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Departamentos</h2>
          <p className="text-muted-foreground">
            Gerencie os departamentos e seus membros
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Departamento
        </Button>
      </div>

      <div className="grid gap-4">
        {departments.map((department) => (
          <Card key={department.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <CardTitle>{department.name}</CardTitle>
                  <Badge variant={department.isActive ? "default" : "secondary"}>
                    {department.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => openEditModal(department)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(department.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>{department.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <UsersIcon className="h-4 w-4" />
                <span>{department.members.length} membros</span>
              </div>
              {department.members.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {department.members.map((memberId) => (
                    <Badge key={memberId} variant="outline">
                      {getUserName(memberId)}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Department Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Departamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-name">Nome</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do departamento"
              />
            </div>
            <div>
              <Label htmlFor="create-description">Descrição</Label>
              <Textarea
                id="create-description"
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do departamento"
              />
            </div>
            <div>
              <Label>Membros</Label>
              <Select 
                onValueChange={(userId) => {
                  if (!createForm.members.includes(userId)) {
                    setCreateForm(prev => ({ ...prev, members: [...prev.members, userId] }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Adicionar membro" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableUsers(createForm.members).map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {createForm.members.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {createForm.members.map((memberId) => (
                    <Badge key={memberId} variant="outline" className="flex items-center gap-1">
                      {getUserName(memberId)}
                      <button
                        onClick={() => setCreateForm(prev => ({ 
                          ...prev, 
                          members: prev.members.filter(id => id !== memberId) 
                        }))}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateModal(false); resetCreateForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Departamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do departamento"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do departamento"
              />
            </div>
            <div>
              <Label>Membros</Label>
              <Select 
                onValueChange={(userId) => {
                  if (!editForm.members.includes(userId)) {
                    setEditForm(prev => ({ ...prev, members: [...prev.members, userId] }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Adicionar membro" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableUsers(editForm.members).map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editForm.members.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {editForm.members.map((memberId) => (
                    <Badge key={memberId} variant="outline" className="flex items-center gap-1">
                      {getUserName(memberId)}
                      <button
                        onClick={() => setEditForm(prev => ({ 
                          ...prev, 
                          members: prev.members.filter(id => id !== memberId) 
                        }))}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditModal(false); resetEditForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};