<template>
  <PublicLayout>
    <div class="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div class="bg-card rounded-lg border border-border w-full max-w-md p-8">
        <div class="text-center mb-8">
          <div class="mx-auto w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
            <Car class="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 class="text-2xl font-bold">Creer un compte</h1>
          <p class="text-muted-foreground mt-2">Rejoignez Bris de Glace</p>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Email</label>
            <Input v-model="form.email" type="email" placeholder="votre@email.fr" required />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Telephone (optionnel)</label>
            <Input v-model="form.phone" type="tel" placeholder="+33 6 12 34 56 78" />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Mot de passe</label>
            <Input v-model="form.password" type="password" placeholder="********" required />
          </div>

          <div v-if="error" class="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {{ error }}
          </div>

          <Button type="submit" class="w-full" :disabled="isLoading">
            <Spinner v-if="isLoading" class="mr-2 h-4 w-4" />
            Creer mon compte
          </Button>
        </form>

        <div class="mt-6 pt-6 border-t border-border text-center">
          <p class="text-sm text-muted-foreground">
            Deja inscrit ?
            <RouterLink to="/connexion" class="text-accent hover:underline font-medium">
              Se connecter
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Car } from 'lucide-vue-next'
import PublicLayout from '@/layouts/PublicLayout.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Spinner from '@/components/ui/Spinner.vue'
import { api } from '@/services/api'

const router = useRouter()
const isLoading = ref(false)
const error = ref('')

const form = reactive({
  email: '',
  phone: '',
  password: '',
})

async function handleRegister() {
  error.value = ''

  if (form.password.length < 6) {
    error.value = 'Le mot de passe doit contenir au moins 6 caracteres'
    return
  }

  isLoading.value = true

  try {
    await api.register({
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
      role: 'user',
    })
    router.push('/connexion?registered=true')
  } catch (e: any) {
    error.value = e.message || 'Erreur lors de l\'inscription'
  } finally {
    isLoading.value = false
  }
}
</script>
