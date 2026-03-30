<script setup lang="ts">
import { ref } from 'vue';
import { Users, Wrench, CreditCard, FileText } from 'lucide-vue-next';
import { Card, CardHeader, CardTitle, CardContent, Skeleton } from '@/components/ui';
import { api } from '@/services/api';
import { useAutoRefresh } from '@/composables/useAutoRefresh';

const recentUsers = ref<any[]>([]);
const recentInterventions = ref<any[]>([]);

const statsData = ref({ users: 0, artisans: 0, subscriptions: 0, interventions: 0 });
const isLoading = ref(true);

async function loadStats() {
  try {
    const [dashStats, usersRes] = await Promise.all([
      api.getAdminDashboardStats(),
      api.getAdminUsers({ limit: 5 }),
    ]);

    statsData.value = {
      users: dashStats.users?.total ?? 0,
      artisans: dashStats.users?.artisans ?? 0,
      subscriptions: dashStats.subscriptions?.active ?? 0,
      interventions: dashStats.interventions?.total ?? 0,
    };

    recentUsers.value = usersRes.users?.slice(0, 5) ?? [];
  } catch (e) {
    // ignore
  } finally {
    isLoading.value = false;
  }
}

useAutoRefresh(async () => {
  await loadStats();
  return statsData.value;
}, { interval: 30000, toastMessage: 'Tableau de bord mis à jour' });

const statCards = [
  { key: 'users' as const, label: 'Utilisateurs', icon: Users, iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  { key: 'artisans' as const, label: 'Artisans', icon: Wrench, iconBg: 'bg-success/10', iconColor: 'text-success' },
  { key: 'subscriptions' as const, label: 'Abonnements actifs', icon: CreditCard, iconBg: 'bg-accent/10', iconColor: 'text-accent' },
  { key: 'interventions' as const, label: 'Interventions ce mois', icon: FileText, iconBg: 'bg-cta/10', iconColor: 'text-cta' },
];
</script>

<template>
  <div class="animate-fade-in">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground">Tableau de bord</h1>
      <p class="text-muted-foreground mt-1">Bienvenue dans votre espace d'administration</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      <Card
        v-for="card in statCards"
        :key="card.key"
        class="hover:shadow-lg transition-shadow duration-200"
      >
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">{{ card.label }}</p>
              <template v-if="isLoading">
                <Skeleton class="h-8 w-16 mt-2" />
              </template>
              <template v-else>
                <p class="text-3xl font-bold text-foreground mt-1">{{ statsData[card.key] }}</p>
              </template>
            </div>
            <div
              :class="[
                'w-14 h-14 rounded-xl flex items-center justify-center',
                card.iconBg
              ]"
            >
              <component :is="card.icon" :class="['w-7 h-7', card.iconColor]" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Derniers utilisateurs inscrits</CardTitle>
        </CardHeader>
        <CardContent>
          <template v-if="isLoading">
            <div class="space-y-4">
              <div v-for="i in 3" :key="i" class="flex items-center gap-3">
                <Skeleton class="h-10 w-10 rounded-full" />
                <div class="flex-1">
                  <Skeleton class="h-4 w-32 mb-1" />
                  <Skeleton class="h-3 w-24" />
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="recentUsers.length === 0">
            <div class="text-center py-8">
              <Users class="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p class="text-muted-foreground">Aucun utilisateur récent</p>
            </div>
          </template>
          <template v-else>
            <div class="space-y-4">
              <div v-for="user in recentUsers" :key="user.id" class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {{ (user.firstname?.[0] || '').toUpperCase() }}{{ (user.lastname?.[0] || '').toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-foreground truncate">{{ user.firstname }} {{ user.lastname }}</p>
                  <p class="text-xs text-muted-foreground truncate">{{ user.email }}</p>
                </div>
              </div>
            </div>
          </template>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Dernières interventions</CardTitle>
        </CardHeader>
        <CardContent>
          <template v-if="isLoading">
            <div class="space-y-4">
              <div v-for="i in 3" :key="i" class="flex items-center gap-3">
                <Skeleton class="h-10 w-10 rounded-lg" />
                <div class="flex-1">
                  <Skeleton class="h-4 w-40 mb-1" />
                  <Skeleton class="h-3 w-28" />
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="recentInterventions.length === 0">
            <div class="text-center py-8">
              <FileText class="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p class="text-muted-foreground">Aucune intervention récente</p>
            </div>
          </template>
          <template v-else>
            <div class="space-y-4">
              <div v-for="intervention in recentInterventions" :key="intervention.id" class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-cta/10 flex items-center justify-center text-cta">
                  <FileText class="w-5 h-5" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-foreground truncate">{{ intervention.description }}</p>
                  <p class="text-xs text-muted-foreground">{{ intervention.status }}</p>
                </div>
              </div>
            </div>
          </template>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
