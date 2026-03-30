<template>
  <PublicLayout>
    <div class="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div class="bg-card rounded-lg border border-border w-full max-w-md p-8">
        <div class="text-center mb-8">
          <div class="mx-auto w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
            <Car class="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 class="text-2xl font-bold">Connexion</h1>
          <p class="text-muted-foreground mt-2">Accedez a votre espace personnel</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Email</label>
            <Input
              v-model="email"
              type="email"
              placeholder="votre@email.fr"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Mot de passe</label>
            <Input
              v-model="password"
              type="password"
              placeholder="********"
              required
            />
          </div>

          <!-- Unverified account alert -->
          <div v-if="isUnverified" class="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-3">
            <p class="text-sm text-amber-800 font-medium">Votre compte n'est pas encore verifie.</p>
            <p class="text-sm text-amber-700">Verifiez votre boite email ou renvoyez l'email de verification.</p>
            <Button
              type="button"
              variant="outline"
              class="w-full"
              :disabled="resending"
              @click="resendVerification"
            >
              {{ resendSuccess ? 'Email envoye !' : resending ? 'Envoi...' : 'Renvoyer l\'email de verification' }}
            </Button>
          </div>

          <!-- Generic error -->
          <div v-else-if="authStore.error" class="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {{ authStore.error }}
          </div>

          <Button type="submit" class="w-full" :disabled="authStore.isLoading">
            <Spinner v-if="authStore.isLoading" class="mr-2 h-4 w-4" />
            Se connecter
          </Button>
        </form>

        <div class="mt-6 text-center">
          <RouterLink to="/mot-de-passe-oublie" class="text-sm text-accent hover:underline">Mot de passe oublie ?</RouterLink>
        </div>

        <div class="mt-6 pt-6 border-t border-border text-center">
          <p class="text-sm text-muted-foreground">
            Pas encore de compte ?
            <RouterLink to="/inscription" class="text-accent hover:underline font-medium">
              S'inscrire
            </RouterLink>
          </p>
        </div>

        <div class="mt-6 p-4 rounded-lg bg-muted text-sm">
          <p class="font-medium mb-2">Mode demo :</p>
          <p class="text-muted-foreground">User: user@brisdeglace.fr / user123</p>
          <p class="text-muted-foreground">Admin: admin@brisdeglace.fr / admin123</p>
        </div>
      </div>
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { Car } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import PublicLayout from '@/layouts/PublicLayout.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Spinner from '@/components/ui/Spinner.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const isUnverified = ref(false)
const resending = ref(false)
const resendSuccess = ref(false)

async function handleLogin() {
  authStore.clearError()
  isUnverified.value = false
  resendSuccess.value = false
  const success = await authStore.login(email.value, password.value)
  console.log('[Login] success:', success, 'isAdmin:', authStore.isAdmin, 'isArtisan:', authStore.isArtisan, 'user:', authStore.user)
  if (success) {
    const redirect = route.query.redirect as string
    if (redirect) {
      await router.push(redirect)
    } else if (authStore.isAdmin) {
      await router.push('/admin')
    } else if (authStore.isArtisan) {
      await router.push('/artisan')
    } else {
      await router.push('/')
    }
  } else if (authStore.error && authStore.error.toLowerCase().includes('not verified')) {
    isUnverified.value = true
  }
}

async function resendVerification() {
  resending.value = true
  try {
    await api.resendVerification(email.value)
    resendSuccess.value = true
  } catch (e: any) {
    console.error('Failed to resend verification:', e)
  } finally {
    resending.value = false
  }
}
</script>
