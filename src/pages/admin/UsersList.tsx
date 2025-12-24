import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Shield, User as UserIcon, Mail, Calendar, Plus, Eye, Edit, UserPlus, Loader2, DollarSign, Ticket, Users, Link as LinkIcon, Trash2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const UsersList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<'vendedor' | 'portero'>('vendedor');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showEditRole, setShowEditRole] = useState(false);
  const [editRoleData, setEditRoleData] = useState({ userId: '', role: '' });
  const [showAssignEvent, setShowAssignEvent] = useState(false);
  const [assignEventData, setAssignEventData] = useState({ vendedorId: '', eventId: '', ticketLimit: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const [createFormData, setCreateFormData] = useState({
    email: '',
    password: '',
    name: '',
    dni: '',
    phone: '',
    commissionPercent: '10',
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', roleFilter, currentPage, search],
    queryFn: () => adminApi.getUsers({ 
      role: roleFilter !== 'all' ? roleFilter : undefined,
      assignedBy: currentUser?.role === 'ORGANIZER' ? currentUser.id : undefined,
      search: search || undefined,
      page: currentPage,
      limit: pageSize,
    }),
  });

  // Resetear página cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, search]);

  const { data: userDetails } = useQuery({
    queryKey: ['admin-user-details', selectedUser?.id],
    queryFn: () => adminApi.getUserById(selectedUser?.id),
    enabled: !!selectedUser && showUserDetails,
  });

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };

  // La búsqueda ahora se hace en el backend, no necesitamos filtrar aquí
  const filteredUsers = users;

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      toast({
        title: 'Usuario eliminado',
        description: 'El usuario ha sido eliminado exitosamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      if (currentPage > 1 && filteredUsers.length === 1) {
        setCurrentPage(currentPage - 1);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el usuario.',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteUser = (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${userName}"? Esta acción no se puede deshacer.`)) return;
    deleteUserMutation.mutate(userId);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'ORGANIZER':
        return 'default';
      case 'VALIDATOR':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'ORGANIZER':
        return 'Organizador';
      case 'VALIDATOR':
        return 'Validador';
      case 'VENDEDOR':
        return 'Vendedor';
      case 'PORTERO':
        return 'Portero';
      default:
        return 'Usuario';
    }
  };

  const createVendedorMutation = useMutation({
    mutationFn: (data: any) => adminApi.createVendedor(data),
    onSuccess: () => {
      toast({
        title: '✅ Vendedor creado',
        description: 'El vendedor ha sido creado exitosamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowCreateDialog(false);
      setCreateFormData({
        email: '',
        password: '',
        name: '',
        dni: '',
        phone: '',
        commissionPercent: '10',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el vendedor.',
        variant: 'destructive',
      });
    },
  });

  const createPorteroMutation = useMutation({
    mutationFn: (data: any) => adminApi.createPortero(data),
    onSuccess: () => {
      toast({
        title: '✅ Portero creado',
        description: 'El portero ha sido creado exitosamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowCreateDialog(false);
      setCreateFormData({
        email: '',
        password: '',
        name: '',
        dni: '',
        phone: '',
        commissionPercent: '10',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el portero.',
        variant: 'destructive',
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminApi.updateUser(userId, { role }),
    onSuccess: () => {
      toast({
        title: '✅ Rol actualizado',
        description: 'El rol del usuario ha sido actualizado exitosamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-details'] });
      setShowEditRole(false);
      setEditRoleData({ userId: '', role: '' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el rol.',
        variant: 'destructive',
      });
    },
  });

  const handleCreate = () => {
    if (!createFormData.email || !createFormData.password || !createFormData.name || !createFormData.dni) {
      toast({
        title: 'Error',
        description: 'Completá todos los campos requeridos.',
        variant: 'destructive',
      });
      return;
    }

    const data = {
      email: createFormData.email,
      password: createFormData.password,
      name: createFormData.name,
      dni: createFormData.dni,
      phone: createFormData.phone || undefined,
      ...(createType === 'vendedor' ? { commissionPercent: parseFloat(createFormData.commissionPercent) } : {}),
    };

    if (createType === 'vendedor') {
      createVendedorMutation.mutate(data);
    } else {
      createPorteroMutation.mutate(data);
    }
  };

  const handleViewDetails = async (user: any) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleEditRole = (user: any) => {
    setEditRoleData({ userId: user.id, role: user.role });
    setShowEditRole(true);
  };

  const handleUpdateRole = () => {
    if (!editRoleData.role) {
      toast({
        title: 'Error',
        description: 'Seleccioná un rol.',
        variant: 'destructive',
      });
      return;
    }
    updateRoleMutation.mutate(editRoleData);
  };

  const assignEventMutation = useMutation({
    mutationFn: (data: { vendedorId: string; eventId: string; ticketLimit?: number }) =>
      adminApi.assignEventToVendedor(data),
    onSuccess: () => {
      toast({
        title: '✅ Evento asignado',
        description: 'El evento ha sido asignado al vendedor exitosamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-user-details'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowAssignEvent(false);
      setAssignEventData({ vendedorId: '', eventId: '', ticketLimit: '' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo asignar el evento.',
        variant: 'destructive',
      });
    },
  });

  const handleAssignEvent = (vendedorId: string) => {
    setAssignEventData({ ...assignEventData, vendedorId });
    setShowAssignEvent(true);
  };

  const handleSaveAssignEvent = () => {
    if (!assignEventData.eventId) {
      toast({
        title: 'Error',
        description: 'Seleccioná un evento.',
        variant: 'destructive',
      });
      return;
    }
    assignEventMutation.mutate({
      vendedorId: assignEventData.vendedorId,
      eventId: assignEventData.eventId,
      ticketLimit: assignEventData.ticketLimit ? parseInt(assignEventData.ticketLimit) : undefined,
    });
  };

  // Obtener eventos para asignar
  const { data: eventsData } = useQuery({
    queryKey: ['admin-events-for-assign'],
    queryFn: () => adminApi.getEvents({ isActive: 'true', page: 1, limit: 100 }),
    enabled: showAssignEvent,
  });
  
  const eventsForAssign = eventsData?.data?.events || [];

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Gestión de Usuarios</h1>
              <p className="text-muted-foreground">Gestiona usuarios, roles y crea cuentas para vendedores/porteros</p>
            </div>
            <div className="flex gap-2">
              {currentUser?.role === 'ADMIN' && (
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      await adminApi.exportUsersToExcel();
                      toast({
                        title: '✅ Exportación exitosa',
                        description: 'El archivo Excel se está descargando.',
                      });
                    } catch (error: any) {
                      toast({
                        title: 'Error',
                        description: error.message || 'No se pudo exportar los usuarios.',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar a Excel
                </Button>
              )}
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Usuario
              </Button>
            </div>
          </div>

          {/* Estadísticas - AL PRINCIPIO */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pagination.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter((u: any) => u.role === 'ADMIN').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Organizadores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter((u: any) => u.role === 'ORGANIZER').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter((u: any) => u.role === 'USER').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Vendedores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter((u: any) => u.role === 'VENDEDOR').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Porteros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter((u: any) => u.role === 'PORTERO').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros y búsqueda */}
          <div className="mb-6 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o DNI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="USER">Usuario</SelectItem>
                <SelectItem value="ORGANIZER">Organizador</SelectItem>
                <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                <SelectItem value="PORTERO">Portero</SelectItem>
                <SelectItem value="VALIDATOR">Validador</SelectItem>
                {currentUser?.role === 'ADMIN' && <SelectItem value="ADMIN">Administrador</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de usuarios */}
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No se encontraron usuarios</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user: any) => (
                <Card key={user.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-secondary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{user.name}</h3>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {getRoleLabel(user.role)}
                            </Badge>
                            {user.vendedorProfile && (
                              <Badge variant="secondary" className="gap-1">
                                <DollarSign className="w-3 h-3" />
                                ${Number(user.vendedorProfile.totalEarnings).toLocaleString('es-AR')}
                              </Badge>
                            )}
                            {user.porteroProfile && (
                              <Badge variant="secondary" className="gap-1">
                                <Ticket className="w-3 h-3" />
                                {user._count?.validations || 0} escaneos
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              <span>DNI: {user.dni}</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4" />
                                <span>Tel: {user.phone}</span>
                              </div>
                            )}
                            {user.vendedorProfile && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                <span>Comisión: {user.vendedorProfile.commissionPercent}% | Eventos: {user.vendedorProfile._count?.events || 0}</span>
                              </div>
                            )}
                            {user.vendedorProfile?.assignedByUser && (
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>Asignado por: {user.vendedorProfile.assignedByUser.name}</span>
                              </div>
                            )}
                            {user.porteroProfile?.assignedByUser && (
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>Asignado por: {user.porteroProfile.assignedByUser.name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Registrado: {new Date(user.createdAt).toLocaleDateString('es-AR')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(user)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalles
                        </Button>
                        {user.role !== 'ADMIN' && currentUser?.role === 'ADMIN' && (
                          <Button variant="outline" size="sm" onClick={() => handleEditRole(user)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar Rol
                          </Button>
                        )}
                        {/* Botón eliminar - solo para usuarios creados por el admin/organizador actual */}
                        {(user.vendedorProfile?.assignedByUser?.id === currentUser?.id || 
                          user.porteroProfile?.assignedByUser?.id === currentUser?.id) && 
                          user.role !== 'ADMIN' && user.role !== 'ORGANIZER' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, pagination.total)} de {pagination.total} usuarios
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Dialog para crear usuario */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Creá una cuenta para un vendedor o portero
            </DialogDescription>
          </DialogHeader>
          <Tabs value={createType} onValueChange={(v) => setCreateType(v as 'vendedor' | 'portero')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="vendedor">Vendedor</TabsTrigger>
              <TabsTrigger value="portero">Portero</TabsTrigger>
            </TabsList>
            <TabsContent value={createType} className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <Input
                    id="name"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    placeholder="Juan Pérez"
                  />
                </div>
                <div>
                  <Label htmlFor="dni">DNI *</Label>
                  <Input
                    id="dni"
                    value={createFormData.dni}
                    onChange={(e) => setCreateFormData({ ...createFormData, dni: e.target.value })}
                    placeholder="12345678"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                    placeholder="+54 9 11 1234-5678"
                  />
                </div>
                {createType === 'vendedor' && (
                  <div>
                    <Label htmlFor="commissionPercent">Porcentaje de Comisión (%) *</Label>
                    <Input
                      id="commissionPercent"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={createFormData.commissionPercent}
                      onChange={(e) => setCreateFormData({ ...createFormData, commissionPercent: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={createVendedorMutation.isPending || createPorteroMutation.isPending}
                  >
                    {(createVendedorMutation.isPending || createPorteroMutation.isPending) ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Crear {createType === 'vendedor' ? 'Vendedor' : 'Portero'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver detalles de usuario */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
            <DialogDescription>
              Información completa y actividad del usuario
            </DialogDescription>
          </DialogHeader>
          {userDetails?.data && (
            <div className="space-y-6">
              {/* Información básica */}
              <Card>
                <CardHeader>
                  <CardTitle>Información Básica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Nombre</Label>
                      <p className="font-semibold">{userDetails.data.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-semibold">{userDetails.data.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">DNI</Label>
                      <p className="font-semibold">{userDetails.data.dni}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Teléfono</Label>
                      <p className="font-semibold">{userDetails.data.phone || 'No especificado'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Rol</Label>
                      <Badge variant={getRoleBadgeVariant(userDetails.data.role)}>
                        {getRoleLabel(userDetails.data.role)}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Fecha de Registro</Label>
                      <p className="font-semibold">
                        {new Date(userDetails.data.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información de Vendedor */}
              {userDetails.data.vendedorProfile && (
                <Card>
                  <CardHeader>
                    <CardTitle>Información de Vendedor</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Comisión</Label>
                        <p className="font-semibold">{userDetails.data.vendedorProfile.commissionPercent}%</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Ganancias Totales</Label>
                        <p className="font-semibold text-secondary">
                          ${Number(userDetails.data.vendedorProfile.totalEarnings).toLocaleString('es-AR')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Asignado por</Label>
                        <p className="font-semibold">
                          {userDetails.data.vendedorProfile.assignedByUser?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Estado</Label>
                        <Badge variant={userDetails.data.vendedorProfile.isActive ? 'default' : 'secondary'}>
                          {userDetails.data.vendedorProfile.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                    {userDetails.data.vendedorProfile.events && userDetails.data.vendedorProfile.events.length > 0 && (
                      <div className="mt-4">
                        <Label className="text-muted-foreground">Eventos Asignados</Label>
                        <div className="mt-2 space-y-2">
                          {userDetails.data.vendedorProfile.events.map((ve: any) => (
                            <div key={ve.id} className="flex justify-between p-2 bg-muted rounded">
                              <span>{ve.event.title}</span>
                              <span className="text-sm text-muted-foreground">
                                {ve.soldQty} vendidas {ve.ticketLimit && `/ ${ve.ticketLimit}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {userDetails.data.vendedorProfile.sales && userDetails.data.vendedorProfile.sales.length > 0 && (
                      <div className="mt-4">
                        <Label className="text-muted-foreground">Últimas Ventas</Label>
                        <div className="mt-2 space-y-2">
                          {userDetails.data.vendedorProfile.sales.slice(0, 5).map((sale: any) => (
                            <div key={sale.id} className="flex justify-between p-2 bg-muted rounded">
                              <div>
                                <span className="font-semibold">{sale.event.title}</span>
                                <p className="text-sm text-muted-foreground">{sale.user.name}</p>
                              </div>
                              <span className="text-sm font-semibold">
                                ${Number(sale.totalAmount).toLocaleString('es-AR')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Información de Portero */}
              {userDetails.data.porteroProfile && (
                <Card>
                  <CardHeader>
                    <CardTitle>Información de Portero</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Asignado por</Label>
                        <p className="font-semibold">
                          {userDetails.data.porteroProfile.assignedByUser?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Estado</Label>
                        <Badge variant={userDetails.data.porteroProfile.isActive ? 'default' : 'secondary'}>
                          {userDetails.data.porteroProfile.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Total de Escaneos</Label>
                        <p className="font-semibold">
                          {userDetails.data.validations?.length || 0}
                        </p>
                      </div>
                    </div>
                    {userDetails.data.validations && userDetails.data.validations.length > 0 && (
                      <div className="mt-4">
                        <Label className="text-muted-foreground">Últimos Escaneos</Label>
                        <div className="mt-2 space-y-2">
                          {userDetails.data.validations.slice(0, 5).map((scan: any) => (
                            <div key={scan.id} className="flex justify-between p-2 bg-muted rounded">
                              <div>
                                <span className="font-semibold">{scan.ticket.event.title}</span>
                                <p className="text-sm text-muted-foreground">
                                  {scan.ticket.owner.name} - {scan.isValid ? 'Válido' : 'Inválido'}
                                </p>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(scan.scannedAt).toLocaleDateString('es-AR')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Actividad del usuario */}
              <Card>
                <CardHeader>
                  <CardTitle>Actividad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Entradas Compradas</Label>
                      <p className="text-2xl font-bold">{userDetails.data._count?.ticketsPurchased || 0}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Órdenes</Label>
                      <p className="text-2xl font-bold">{userDetails.data._count?.orders || 0}</p>
                    </div>
                    {userDetails.data.role === 'ORGANIZER' && (
                      <div>
                        <Label className="text-muted-foreground">Eventos Creados</Label>
                        <p className="text-2xl font-bold">{userDetails.data._count?.eventsCreated || 0}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para editar rol */}
      <Dialog open={showEditRole} onOpenChange={setShowEditRole}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Rol de Usuario</DialogTitle>
            <DialogDescription>
              Cambiá el rol del usuario. Solo administradores pueden cambiar roles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select value={editRoleData.role} onValueChange={(value) => setEditRoleData({ ...editRoleData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Usuario</SelectItem>
                  <SelectItem value="ORGANIZER">Organizador</SelectItem>
                  <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                  <SelectItem value="PORTERO">Portero</SelectItem>
                  <SelectItem value="VALIDATOR">Validador</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditRole(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateRole}
                disabled={updateRoleMutation.isPending}
              >
                {updateRoleMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para asignar evento a vendedor */}
      <Dialog open={showAssignEvent} onOpenChange={setShowAssignEvent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Evento a Vendedor</DialogTitle>
            <DialogDescription>
              Seleccioná un evento para asignarlo a este vendedor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="eventId">Evento *</Label>
              <Select
                value={assignEventData.eventId}
                onValueChange={(value) => setAssignEventData({ ...assignEventData, eventId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar evento" />
                </SelectTrigger>
                <SelectContent>
                  {eventsForAssign.map((event: any) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title} - {new Date(event.date).toLocaleDateString('es-AR')}
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ticketLimit">Límite de Entradas (Opcional)</Label>
              <Input
                id="ticketLimit"
                type="number"
                min="1"
                value={assignEventData.ticketLimit}
                onChange={(e) => setAssignEventData({ ...assignEventData, ticketLimit: e.target.value })}
                placeholder="Dejar vacío para sin límite"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cantidad máxima de entradas que puede vender este vendedor para este evento
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAssignEvent(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveAssignEvent}
                disabled={assignEventMutation.isPending}
              >
                {assignEventMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Asignando...
                  </>
                ) : (
                  'Asignar Evento'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default UsersList;

