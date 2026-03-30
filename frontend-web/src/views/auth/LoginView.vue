<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-vue-next';
import { Card, CardContent, Button, Input, Label, Spinner } from '@/components/ui';

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const showPassword = ref(false);

async function handleSubmit() {
  const success = await authStore.login(email.value, password.value);
  if (success) {
    router.push({ name: 'dashboard' });
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-hero py-12 px-4">
    <div class="max-w-md w-full animate-scale-in">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <Shield class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-foreground">Bris de Glace</h1>
        <p class="text-muted-foreground mt-2">Espace d'administration</p>
      </div>

      <!-- Login Card -->
      <Card class="shadow-xl">
        <CardContent class="p-8">
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div class="space-y-2">
              <Label for="email">Email</Label>
              <Input
                id="email"
                v-model="email"
                type="email"
                required
                placeholder="admin@brisdeglace.fr"
              />
            </div>

            <div class="space-y-2">
              <Label for="password">Mot de passe</Label>
              <div class="relative">
                <Input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  placeholder="••••••••"
                  class="pr-10"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <EyeOff v-if="showPassword" class="w-5 h-5" />
                  <Eye v-else class="w-5 h-5" />
                </button>
              </div>
            </div>

            <!-- Error message -->
            <div
              v-if="authStore.error"
              class="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
            >
              <AlertCircle class="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p class="text-sm text-destructive">{{ authStore.error }}</p>
            </div>

            <Button
              type="submit"
              :disabled="authStore.isLoading"
              variant="cta"
              class="w-full"
              size="lg"
            >
              <Spinner v-if="authStore.isLoading" size="sm" class="mr-2" />
              {{ authStore.isLoading ? 'Connexion...' : 'Se connecter' }}
            </Button>
          </form>
        </CardContent>
      </Card>

      <!-- Footer -->
      <p class="text-center text-sm text-muted-foreground mt-6">
        Plateforme de gestion Bris de Glace
      </p>
    </div>
  </div>
</template>
