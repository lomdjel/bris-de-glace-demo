import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import { useAuthStore } from './stores/auth';
import './style.css';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Initialize auth store before mounting
const authStore = useAuthStore();
authStore.init();

app.mount('#app');
