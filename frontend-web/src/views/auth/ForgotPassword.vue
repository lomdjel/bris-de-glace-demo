<template>
  <PublicLayout>
    <div class="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div class="bg-card rounded-lg border border-border w-full max-w-md p-8">
        <div class="text-center mb-8">
          <div class="mx-auto w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
            <Mail class="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 class="text-2xl font-bold">Mot de passe oublie</h1>
          <p class="text-muted-foreground mt-2">Entrez votre email pour recevoir un lien de reinitialisation</p>
        </div>

        <!-- Success state -->
        <div v-if="sent" class="text-center space-y-4">
          <div class="p-4 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle class="h-8 w-8 text-success mx-auto mb-2" />
            <p class="text-sm text-success font-medium">Email envoye !</p>
            <p class="text-sm text-muted-foreground mt-1">
              Si un compte existe avec cette adresse, vous recevrez un lien de reinitialisation.
            </p>
          </div>
          <RouterLink to="/connexion" class="text-sm text-accent hover:underline">
            Retour a la connexion
          </RouterLink>
        </div>

        <!-- Form state -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Email</label>
            <Input
              v-model="email"
              type="email"
              placeholder="votre@email.fr"
              required
            />
          </div>

          <div v-if="error" class="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {{ error }}
          </div>

          <Button type="submit" class="w-full" :disabled="isLoading">
            <Spinner v-if="isLoading" class="mr-2 h-4 w-4" />
            Envoyer le lien
          </Button>
        </form>

        <div v-if="!sent" class="mt-6 text-center">
          <RouterLink to="/connexion" class="text-sm text-accent hover:underline">
            Retour a la connexion
          </RouterLink>
        </div>
      </div>
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Mail, CheckCircle } from 'lucide-vue-next'
import { api } from '@/services/api'
import PublicLayout from '@/layouts/PublicLayout.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Spinner from '@/components/ui/Spinner.vue'

const email = ref('')
const isLoading = ref(false)
const sent = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''
  isLoading.value = true
  try {
    await api.forgotPassword(email.value)
    sent.value = true
  } catch (e: any) {
    error.value = e.message || 'Une erreur est survenue'
  } finally {
    isLoading.value = false
  }
}
</script>
