<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Wrench, CheckCircle, AlertCircle, Loader2 } from 'lucide-vue-next';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import PublicLayout from '@/layouts/PublicLayout.vue';
import Input from '@/components/ui/Input.vue';
import Button from '@/components/ui/Button.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const token = computed(() => route.query.token as string || '');
const invitationEmail = ref('');
const isValidating = ref(true);
const tokenError = ref('');

const form = ref({
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  siret: '',
});

const isSubmitting = ref(false);
const error = ref('');

onMounted(async () => {
  if (!token.value) {
    tokenError.value = 'Aucun token d\'invitation fourni';
    isValidating.value = false;
    return;
  }

  try {
    const result = await api.validateInvitationToken(token.value);
    invitationEmail.value = result.email;
    form.value.email = result.email;
  } catch (e: any) {
    tokenError.value = e.message || 'Token d\'invitation invalide ou expire';
  } finally {
    isValidating.value = false;
  }
});

async function handleSubmit() {
  error.value = '';

  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Les mots de passe ne correspondent pas';
    return;
  }

  if (form.value.password.length < 6) {
    error.value = 'Le mot de passe doit contenir au moins 6 caracteres';
    return;
  }

  isSubmitting.value = true;
  try {
    const response = await api.registerArtisan({
      token: token.value,
      email: form.value.email,
      password: form.value.password,
      firstname: form.value.firstname,
      lastname: form.value.lastname,
      phone: form.value.phone || undefined,
      companyName: form.value.companyName,
      siret: form.value.siret || undefined,
    });

    // Auto-login with the returned token
    authStore.setAuthData(response.token, response.user);
    router.push({ name: 'artisan-dashboard' });
  } catch (e: any) {
    error.value = e.message || 'Erreur lors de l\'inscription';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <PublicLayout>
    <div class="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div class="w-full max-w-lg">
        <!-- Loading token validation -->
        <div v-if="isValidating" class="text-center py-12">
          <Loader2 class="w-8 h-8 mx-auto animate-spin text-primary mb-4" />
          <p class="text-muted-foreground">Verification de l'invitation...</p>
        </div>

        <!-- Token error -->
        <div v-else-if="tokenError" class="text-center py-12">
          <AlertCircle class="w-12 h-12 mx-auto text-destructive mb-4" />
          <h2 class="text-xl font-bold text-foreground mb-2">Invitation invalide</h2>
          <p class="text-muted-foreground mb-6">{{ tokenError }}</p>
          <router-link to="/connexion">
            <Button variant="outline">Retour a la connexion</Button>
          </router-link>
        </div>

        <!-- Registration form -->
        <template v-else>
          <div class="text-center mb-8">
            <div class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Wrench class="w-8 h-8 text-primary" />
            </div>
            <h1 class="text-2xl font-bold text-foreground">Creer votre compte artisan</h1>
            <p class="text-muted-foreground mt-2">Finalisez votre inscription sur Bris de Glace</p>
          </div>

          <div class="bg-card rounded-lg border border-border shadow-sm p-6">
            <div v-if="error" class="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {{ error }}
            </div>

            <form @submit.prevent="handleSubmit" class="space-y-4">
              <div>
                <Label class="text-sm font-medium text-foreground">Email</Label>
                <Input v-model="form.email" type="email" disabled class="mt-1 bg-muted" />
                <p class="text-xs text-muted-foreground mt-1">L'email est lie a votre invitation</p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <Label class="text-sm font-medium text-foreground">Prenom</Label>
                  <Input v-model="form.firstname" placeholder="Jean" required class="mt-1" />
                </div>
                <div>
                  <Label class="text-sm font-medium text-foreground">Nom</Label>
                  <Input v-model="form.lastname" placeholder="Dupont" required class="mt-1" />
                </div>
              </div>

              <div>
                <Label class="text-sm font-medium text-foreground">Telephone</Label>
                <Input v-model="form.phone" placeholder="+33 6 00 00 00 00" class="mt-1" />
              </div>

              <div>
                <Label class="text-sm font-medium text-foreground">Nom de l'entreprise</Label>
                <Input v-model="form.companyName" placeholder="Mon Entreprise SARL" required class="mt-1" />
              </div>

              <div>
                <Label class="text-sm font-medium text-foreground">SIRET (optionnel)</Label>
                <Input v-model="form.siret" placeholder="12345678901234" class="mt-1" />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <Label class="text-sm font-medium text-foreground">Mot de passe</Label>
                  <Input v-model="form.password" type="password" placeholder="Min. 6 caracteres" required class="mt-1" />
                </div>
                <div>
                  <Label class="text-sm font-medium text-foreground">Confirmer</Label>
                  <Input v-model="form.confirmPassword" type="password" placeholder="Confirmer" required class="mt-1" />
                </div>
              </div>

              <Button type="submit" variant="cta" class="w-full" :disabled="isSubmitting || !form.firstname || !form.lastname || !form.password || !form.companyName">
                {{ isSubmitting ? 'Inscription en cours...' : 'Creer mon compte' }}
              </Button>
            </form>
          </div>
        </template>
      </div>
    </div>
  </PublicLayout>
</template>

<script lang="ts">
import Label from '@/components/ui/Label.vue';
export default { components: { Label } };
</script>
