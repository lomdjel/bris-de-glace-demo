<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useAutoRefresh } from '@/composables/useAutoRefresh';
import { Plus, Search, MoreVertical, CheckCircle2, XCircle, Pencil, Trash2, X, Users, Shield, UserIcon } from 'lucide-vue-next';
import {
  Card, CardContent,
  Button, Input, Select, Badge, Avatar, Label,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Skeleton
} from '@/components/ui';
import { api } from '@/services/api';

const searchQuery = ref('');
const roleFilter = ref('');
const users = ref<any[]>([]);
const isLoading = ref(false);

// Menu state
const openMenuId = ref<number | null>(null);

// Modal state
const showModal = ref(false);
const editingUser = ref<any | null>(null);
const isSaving = ref(false);
const form = reactive({
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  password: '',
  roleName: '',
  //roleName: 'user',
  isVerified: false,
});

function roleNameToId(name: string): number {
  switch (name) {
    case 'admin': return 1;
    case 'user': return 2;
    default: return 2;
  }
}

// Delete confirmation
const showDeleteModal = ref(false);
const userToDelete = ref<any | null>(null);

// Exclude artisans — they are managed on /admin/artisans
const nonArtisanUsers = computed(() => users.value.filter(u => u.role?.name !== 'artisan'));

// Stats (based on non-artisan users)
const totalUsers = computed(() => nonArtisanUsers.value.length);
const adminCount = computed(() => nonArtisanUsers.value.filter(u => u.role?.name === 'admin').length);
const userCount = computed(() => nonArtisanUsers.value.filter(u => u.role?.name === 'user').length);

const filteredUsers = computed(() => {
  let result = nonArtisanUsers.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(user =>
      user.firstname?.toLowerCase().includes(query) ||
      user.lastname?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  }

  if (roleFilter.value) {
    result = result.filter(user => user.role?.name === roleFilter.value);
  }

  return result;
});

async function loadUsers() {
  isLoading.value = true;
  try {
    const res = await api.getAdminUsers();
    users.value = res.users;
  } catch (e: any) {
    console.error('Erreur chargement utilisateurs:', e);
  } finally {
    isLoading.value = false;
  }
}

useAutoRefresh(async () => {
  await loadUsers();
  return users.value;
}, { interval: 30000, toastMessage: 'Liste des utilisateurs mise à jour' });

function getRoleBadgeVariant(role: string): 'default' | 'secondary' | 'success' | 'warning' {
  switch (role) {
    case 'admin': return 'default';
    case 'artisan': return 'success';
    default: return 'secondary';
  }
}

function toggleMenu(id: number) {
  openMenuId.value = openMenuId.value === id ? null : id;
}

function openCreate() {
  editingUser.value = null;
  form.firstname = '';
  form.lastname = '';
  form.email = '';
  form.phone = '';
  form.password = '';
  form.roleName = ''; //'user';
  form.isVerified = false;
  showModal.value = true;
}

function openEdit(user: any) {
  console.log(user.role?.name);
  openMenuId.value = null;
  editingUser.value = user;
  form.firstname = user.firstname;
  form.lastname = user.lastname;
  form.email = user.email;
  form.phone = user.phone;
  form.password = '';
  form.roleName = user.role.name; //|| 'user';
  form.isVerified = user.isVerified;
  showModal.value = true;
}

async function saveUser() {
  isSaving.value = true;
  try {
    if (editingUser.value) {
      await api.updateAdminUser(editingUser.value.id, {
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        phone: form.phone,
        roleId: roleNameToId(form.roleName),
        isVerified: form.isVerified,
      });
    } else {
      await api.createAdminUser({
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        password: form.password,
        phone: form.phone,
        roleId: roleNameToId(form.roleName),
        isVerified: form.isVerified,
      });
    }
    showModal.value = false;
    await loadUsers();
  } catch (e: any) {
    alert(e.message || 'Erreur lors de la sauvegarde');
  } finally {
    isSaving.value = false;
  }
}

function confirmDelete(user: any) {
  openMenuId.value = null;
  userToDelete.value = user;
  showDeleteModal.value = true;
}

async function deleteUser() {
  if (userToDelete.value) {
    try {
      await api.deleteAdminUser(userToDelete.value.id);
      await loadUsers();
    } catch (e: any) {
      alert(e.message || 'Erreur lors de la suppression');
    }
  }
  showDeleteModal.value = false;
  userToDelete.value = null;
}
</script>

<template>
  <div class="animate-fade-in" @click="openMenuId = null">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Utilisateurs</h1>
        <p class="text-muted-foreground mt-1">Gerez les utilisateurs de la plateforme</p>
      </div>
      <Button variant="cta" @click="openCreate">
        <Plus class="w-4 h-4 mr-2" />
        Ajouter
      </Button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent class="p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users class="w-5 h-5 text-primary" />
          </div>
          <div>
            <p class="text-2xl font-bold text-foreground">{{ totalUsers }}</p>
            <p class="text-sm text-muted-foreground">Total</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield class="w-5 h-5 text-primary" />
          </div>
          <div>
            <p class="text-2xl font-bold text-foreground">{{ adminCount }}</p>
            <p class="text-sm text-muted-foreground">Admins</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
            <UserIcon class="w-5 h-5 text-secondary" />
          </div>
          <div>
            <p class="text-2xl font-bold text-foreground">{{ userCount }}</p>
            <p class="text-sm text-muted-foreground">Utilisateurs</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Search and filters -->
    <Card class="mb-6">
      <CardContent class="p-4">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher un utilisateur..."
              class="pl-10"
            />
          </div>
          <Select v-model="roleFilter" class="w-full sm:w-48">
            <option value="">Tous les roles</option>
            <option value="user">Utilisateur</option>
            <option value="admin">Admin</option>
          </Select>
        </div>
      </CardContent>
    </Card>

    <!-- Table -->
    <Card>
      <div class="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telephone</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead class="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- Loading state -->
          <template v-if="isLoading">
            <TableRow v-for="i in 5" :key="i">
              <TableCell>
                <div class="flex items-center gap-3">
                  <Skeleton class="h-10 w-10 rounded-full" />
                  <Skeleton class="h-4 w-32" />
                </div>
              </TableCell>
              <TableCell><Skeleton class="h-4 w-40" /></TableCell>
              <TableCell><Skeleton class="h-4 w-32" /></TableCell>
              <TableCell><Skeleton class="h-6 w-20 rounded-full" /></TableCell>
              <TableCell><Skeleton class="h-6 w-24 rounded-full" /></TableCell>
              <TableCell><Skeleton class="h-8 w-8 rounded ml-auto" /></TableCell>
            </TableRow>
          </template>

          <!-- Empty state -->
          <TableRow v-else-if="filteredUsers.length === 0">
            <TableCell colspan="6" class="text-center py-12">
              <div class="text-muted-foreground">
                <p class="text-lg font-medium">Aucun utilisateur</p>
                <p class="text-sm mt-1">Les utilisateurs apparaitront ici</p>
              </div>
            </TableCell>
          </TableRow>

          <!-- User rows -->
          <TableRow v-for="user in filteredUsers" :key="user.id">
            <TableCell>
              <div class="flex items-center gap-3">
                <Avatar
                  size="md"
                  :alt="`${user.firstname} ${user.lastname}`"
                  class="bg-primary/10 text-primary"
                />
                <span class="font-medium text-foreground">
                  {{ user.firstname }} {{ user.lastname }}
                </span>
              </div>
            </TableCell>
            <TableCell class="text-muted-foreground">
              {{ user.email }}
            </TableCell>
            <TableCell class="text-muted-foreground">
              {{ user.phone }}
            </TableCell>
            <TableCell>
              <Badge :variant="getRoleBadgeVariant(user.role?.name)">
                {{ user.role?.name || 'user' }}
              </Badge>
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-1.5">
                <CheckCircle2
                  v-if="user.isVerified"
                  class="w-4 h-4 text-success"
                />
                <XCircle
                  v-else
                  class="w-4 h-4 text-destructive"
                />
                <span :class="user.isVerified ? 'text-success' : 'text-destructive'">
                  {{ user.isVerified ? 'Verifie' : 'Non verifie' }}
                </span>
              </div>
            </TableCell>
            <TableCell class="text-right">
              <div class="relative inline-block" @click.stop>
                <Button variant="ghost" size="icon" @click="toggleMenu(user.id)">
                  <MoreVertical class="w-4 h-4" />
                </Button>
                <div v-if="openMenuId === user.id" class="absolute right-0 top-full mt-1 w-48 bg-card rounded-md border border-border shadow-lg z-10 py-1">
                  <button @click="openEdit(user)" class="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2">
                    <Pencil class="w-4 h-4" /> Modifier
                  </button>
                  <button @click="confirmDelete(user)" class="w-full px-4 py-2 text-left text-sm hover:bg-muted text-destructive flex items-center gap-2">
                    <Trash2 class="w-4 h-4" /> Supprimer
                  </button>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      </div>
    </Card>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="fixed inset-0 bg-black/50" @click="showModal = false" />
      <div class="relative bg-card rounded-lg border border-border shadow-xl w-full max-w-lg mx-4 p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-foreground">
            {{ editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur' }}
          </h2>
          <Button variant="ghost" size="icon" @click="showModal = false">
            <X class="w-4 h-4" />
          </Button>
        </div>
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Prenom</Label>
              <Input v-model="form.firstname" placeholder="Prenom" class="mt-1" />
            </div>
            <div>
              <Label>Nom</Label>
              <Input v-model="form.lastname" placeholder="Nom" class="mt-1" />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input v-model="form.email" type="email" placeholder="email@exemple.com" class="mt-1" />
          </div>
          <div v-if="!editingUser">
            <Label>Mot de passe</Label>
            <Input v-model="form.password" type="password" placeholder="Mot de passe" class="mt-1" />
          </div>
          <div>
            <Label>Telephone</Label>
            <Input v-model="form.phone" placeholder="+33 6 00 00 00 00" class="mt-1" />
          </div>
          <div>
            <Label>Role</Label>
            <Select v-model="form.roleName" class="mt-1 w-full">
              <option value=""></option>
              <option value="user">Utilisateur</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" id="isVerified" v-model="form.isVerified" class="rounded border-border" />
            <Label for="isVerified">Verifie</Label>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <Button variant="outline" @click="showModal = false">Annuler</Button>
          <Button variant="cta" @click="saveUser" :disabled="isSaving">
            {{ isSaving ? 'Sauvegarde...' : (editingUser ? 'Enregistrer' : 'Ajouter') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="fixed inset-0 bg-black/50" @click="showDeleteModal = false" />
      <div class="relative bg-card rounded-lg border border-border shadow-xl w-full max-w-md mx-4 p-6">
        <h2 class="text-xl font-semibold text-foreground mb-2">Confirmer la suppression</h2>
        <p class="text-muted-foreground mb-6">
          Etes-vous sur de vouloir supprimer l'utilisateur
          <strong>{{ userToDelete?.firstname }} {{ userToDelete?.lastname }}</strong> ?
          Cette action est irreversible.
        </p>
        <div class="flex justify-end gap-3">
          <Button variant="outline" @click="showDeleteModal = false">Annuler</Button>
          <Button variant="destructive" @click="deleteUser">Supprimer</Button>
        </div>
      </div>
    </div>
  </div>
</template>
