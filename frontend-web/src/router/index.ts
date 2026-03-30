import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  // Public routes
  {
    path: '/',
    name: 'home',
    component: () => import('../views/public/Home.vue'),
  },
  {
    path: '/recherche',
    name: 'search',
    component: () => import('../views/public/Search.vue'),
  },
  {
    path: '/artisan/:id',
    name: 'artisan-detail',
    component: () => import('../views/public/ArtisanDetail.vue'),
  },

  // Auth routes
  {
    path: '/connexion',
    name: 'login',
    component: () => import('../views/auth/Login.vue'),
    meta: { guest: true },
  },
  {
    path: '/inscription',
    name: 'register',
    component: () => import('../views/auth/Register.vue'),
    meta: { guest: true },
  },
  {
    path: '/mot-de-passe-oublie',
    name: 'forgot-password',
    component: () => import('../views/auth/ForgotPassword.vue'),
    meta: { guest: true },
  },
  {
    path: '/auth/verify',
    name: 'verify-email',
    component: () => import('../views/auth/VerifyEmail.vue'),
  },
  {
    path: '/auth/reset-password',
    name: 'reset-password',
    component: () => import('../views/auth/ResetPassword.vue'),
  },
  {
    path: '/inscription-artisan',
    name: 'register-artisan',
    component: () => import('../views/auth/RegisterArtisan.vue'),
  },

  // User routes (auth required)
  {
    path: '/profil',
    name: 'profile',
    component: () => import('../views/user/Profile.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profil/adresses',
    name: 'addresses',
    component: () => import('../views/user/Addresses.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/declarer-sinistre',
    name: 'declarer-sinistre',
    component: () => import('../views/user/DeclarerSinistre.vue'),
  },
  {
    path: '/mes-interventions',
    name: 'interventions',
    component: () => import('../views/user/Interventions.vue'),
  },
  {
    path: '/mes-interventions/:id',
    name: 'intervention-detail',
    component: () => import('../views/user/InterventionDetail.vue'),
  },

  // Admin routes
  {
    path: '/admin',
    component: () => import('../components/layout/AppLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import('../views/dashboard/DashboardView.vue'),
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('../views/users/UsersView.vue'),
      },
      {
        path: 'artisans',
        name: 'admin-artisans',
        component: () => import('../views/artisans/ArtisansView.vue'),
      },
      {
        path: 'subscriptions',
        name: 'admin-subscriptions',
        component: () => import('../views/subscriptions/SubscriptionsView.vue'),
      },
      {
        path: 'formules',
        name: 'admin-formules',
        component: () => import('../views/formules/FormulesView.vue'),
      },
      {
        path: 'stats',
        name: 'admin-stats',
        component: () => import('../views/stats/StatsView.vue'),
      },
      {
        path: 'promotions',
        name: 'admin-promotions',
        component: () => import('../views/promotions/PromotionsView.vue'),
      },
      {
        path: 'addresses',
        name: 'admin-addresses',
        component: () => import('../views/addresses/AddressesView.vue'),
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('../views/settings/SettingsView.vue'),
      },
    ],
  },

  // Artisan routes
  {
    path: '/artisan',
    component: () => import('../components/layout/ArtisanLayout.vue'),
    meta: { requiresAuth: true, requiresArtisan: true },
    children: [
      {
        path: '',
        name: 'artisan-dashboard',
        component: () => import('../views/artisan/ArtisanDashboard.vue'),
      },
      {
        path: 'profil',
        name: 'artisan-profile',
        component: () => import('../views/artisan/ArtisanProfile.vue'),
      },
      {
        path: 'interventions',
        name: 'artisan-interventions',
        component: () => import('../views/artisan/ArtisanInterventions.vue'),
      },
      {
        path: 'interventions/:id',
        name: 'artisan-intervention-detail',
        component: () => import('../views/artisan/ArtisanInterventionDetail.vue'),
      },
      {
        path: 'adresses',
        name: 'artisan-addresses',
        component: () => import('../views/artisan/ArtisanAddresses.vue'),
      },
      {
        path: 'abonnement',
        name: 'artisan-subscription',
        component: () => import('../views/artisan/ArtisanSubscription.vue'),
      },
    ],
  },

  // Legacy admin login redirect
  {
    path: '/login',
    redirect: '/connexion',
  },

  // Catch all
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  console.log('[Router Guard]', to.path, 'auth:', authStore.isAuthenticated, 'admin:', authStore.isAdmin, 'artisan:', authStore.isArtisan, 'meta:', to.meta)

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('[Router Guard] → redirect to login (not authenticated)')
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    console.log('[Router Guard] → redirect to home (not admin)')
    next({ name: 'home' })
  } else if (to.meta.requiresArtisan && !authStore.isArtisan) {
    console.log('[Router Guard] → redirect to home (not artisan)')
    next({ name: 'home' })
  } else if (to.meta.guest && authStore.isAuthenticated) {
    console.log('[Router Guard] → redirect to home (guest page but authenticated)')
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
