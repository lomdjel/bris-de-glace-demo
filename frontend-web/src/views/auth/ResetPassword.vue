<template>
  <PublicLayout>
    <div class="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div class="bg-card rounded-lg border border-border w-full max-w-md p-8">
        <div class="text-center mb-8">
          <div class="mx-auto w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
            <KeyRound class="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 class="text-2xl font-bold">Nouveau mot de passe</h1>
          <p class="text-muted-foreground mt-2">Choisissez un nouveau mot de passe pour votre compte</p>
        </div>

        <!-- No token -->
        <div v-if="!token" class="text-center space-y-4">
          <div class="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p class="text-sm text-destructive">Lien invalide ou expire. Veuillez refaire une demande.</p>
          </div>
          <RouterLink to="/mot-de-passe-oublie" class="text-sm text-accent hover:underline">
            Demander un nouveau lien
          </RouterLink>
        </div>

        <!-- Success state -->
        <div v-else-if="success" class="text-center space-y-4">
          <div class="p-4 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle class="h-8 w-8 text-success mx-auto mb-2" />
            <p class="text-sm text-success font-medium">Mot de passe modifie !</p>
            <p class="text-sm text-muted-foreground mt-1">
              Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
          </div>
          <RouterLink to="/connexion" class="inline-block">
            <Button>Se connecter</Button>
          </RouterLink>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Nouveau mot de passe</label>
            <Input
              v-model="password"
              type="password"
              placeholder="********"
              required
              minlength="6"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Confirmer le mot de passe</label>
            <Input
              v-model="confirmPassword"
              type="password"
              placeholder="********"
              required
              minlength="6"
            />
          </div>

          <div v-if="error" class="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {{ error }}
          </div>

          <Button type="submit" class="w-full" :disabled="isLoading">
            <Spinner v-if="isLoading" class="mr-2 h-4 w-4" />
            Reinitialiser le mot de passe
          </Button>
        </form>
      </div>
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { KeyRound, CheckCircle } from 'lucide-vue-next'
import { api } from '@/services/api'
import PublicLayout from '@/layouts/PublicLayout.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Spinner from '@/components/ui/Spinner.vue'

const route = useRoute()
const token = computed(() => route.query.token as string || '')

const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const success = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Les mots de passe ne correspondent pas'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Le mot de passe doit contenir au moins 6 caracteres'
    return
  }

  isLoading.value = true
  try {
    await api.resetPassword(token.value, password.value)
    success.value = true
  } catch (e: any) {
    error.value = e.message || 'Une erreur est survenue'
  } finally {
    isLoading.value = false
  }
}
</script>
