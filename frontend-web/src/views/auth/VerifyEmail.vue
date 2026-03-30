<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-vue-next';
import { api } from '@/services/api';

const route = useRoute();
const router = useRouter();

const status = ref<'loading' | 'success' | 'error'>('loading');
const message = ref('');

onMounted(async () => {
  const token = route.query.token as string;
  if (!token) {
    status.value = 'error';
    message.value = 'Token de v\u00e9rification manquant.';
    return;
  }

  try {
    await api.verifyEmail(token);
    status.value = 'success';
    message.value = 'Votre compte a \u00e9t\u00e9 v\u00e9rifi\u00e9 avec succ\u00e8s ! Vous pouvez maintenant vous connecter.';
  } catch (e: any) {
    status.value = 'error';
    message.value = e.message || 'Token invalide ou expir\u00e9.';
  }
});

function goToLogin() {
  router.push({ name: 'login' });
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background px-4">
    <div class="max-w-md w-full text-center">
      <div v-if="status === 'loading'" class="space-y-4">
        <Loader2 class="w-16 h-16 mx-auto text-primary animate-spin" />
        <h1 class="text-2xl font-bold text-foreground">V\u00e9rification en cours...</h1>
        <p class="text-muted-foreground">Veuillez patienter pendant que nous v\u00e9rifions votre compte.</p>
      </div>

      <div v-else-if="status === 'success'" class="space-y-4">
        <CheckCircle2 class="w-16 h-16 mx-auto text-success" />
        <h1 class="text-2xl font-bold text-foreground">Compte v\u00e9rifi\u00e9 !</h1>
        <p class="text-muted-foreground">{{ message }}</p>
        <button
          @click="goToLogin"
          class="mt-6 inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Se connecter
        </button>
      </div>

      <div v-else class="space-y-4">
        <XCircle class="w-16 h-16 mx-auto text-destructive" />
        <h1 class="text-2xl font-bold text-foreground">\u00c9chec de la v\u00e9rification</h1>
        <p class="text-muted-foreground">{{ message }}</p>
        <button
          @click="goToLogin"
          class="mt-6 inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Retour \u00e0 la connexion
        </button>
      </div>
    </div>
  </div>
</template>
