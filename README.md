# 🔧 Bris de Glace demo

> Plateforme de mise en relation géolocalisée entre particuliers ayant un **bris de glace automobile** et **artisans réparateurs** à 
proximité.

Application cross-platform (mobile Flutter + web Vue.js) avec un backend NestJS/GraphQL, conçue pour offrir une expérience fluide, rapide et 
géolocalisée aux deux types d'utilisateurs : le particulier en difficulté et l'artisan à la recherche de missions.

---

## 📱 Aperçu

| Recherche artisans | Détail artisan | Prise de rendez-vous |
|---|---|---|
| *(screenshot)* | *(screenshot)* | *(screenshot)* |

---

## 🧱 Stack technique

| Couche | Technologie |
|--------|-------------|
| Mobile | Flutter 3.x (iOS & Android) |
| Web | Vue.js 3, Vite, TypeScript |
| Backend | NestJS (Node.js / TypeScript) |
| API | GraphQL (Apollo Server + Hasura) |
| Base de données | PostgreSQL + PostGIS (géolocalisation) |
| Auth | Firebase Auth (JWT) |
| Temps réel | Hasura Subscriptions (WebSocket) |
| Infrastructure | Docker, Docker Compose |
| Cartographie | Google Maps API / Mapbox |

---

## ✨ Fonctionnalités principales

### 👤 Côté Particulier
- 📍 **Géolocalisation automatique** — détection de la position et recherche des artisans dans un rayon configurable
- 🔍 **Liste et carte des artisans** disponibles à proximité avec distance en temps réel
- ⭐ **Profils artisans** — avis, certifications, tarifs, disponibilités
- 📅 **Prise de rendez-vous** directement depuis l'application
- 💬 **Messagerie intégrée** entre particulier et artisan
- 🔔 **Notifications push** sur les mises à jour de statut d'intervention

### 🔨 Côté Artisan
- 📊 **Tableau de bord** des missions et demandes entrantes
- 🗺️ **Zone d'intervention** configurable (rayon, jours, horaires)
- 📋 **Gestion des devis** et acceptation/refus de missions
- 📈 **Suivi des interventions** et historique client
- 💳 **Gestion des abonnements** (modèle freemium / premium)

### ⚙️ Back-office Admin
- Validation et modération des comptes artisans
- Suivi des mises en relation et des transactions
- Tableaux de bord statistiques

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Clients                                        │
│   Flutter App (iOS/Android)    Vue.js 3 Web App                  │
│        Apollo Client                Apollo Client                 │
└──────────────┬───────────────────────────┬───────────────────────┘
               │ GraphQL / WebSocket        │ GraphQL / WebSocket
┌──────────────▼───────────────────────────▼───────────────────────┐
│                  Hasura GraphQL Engine                            │
│        Permissions · Subscriptions temps réel · REST              │
└──────────────────────────┬───────────────────────────────────────┘
                           │ Actions & Events
┌──────────────────────────▼───────────────────────────────────────┐
│                   NestJS Backend (TypeScript)                     │
│   Auth · Géolocalisation · Notifications · Paiement · Business    │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                      PostgreSQL + PostGIS                         │
│         Données relationnelles · Requêtes géospatiales            │
└──────────────────────────────────────────────────────────────────┘
```

### Flux de mise en relation

```
Particulier ouvre l'app
        │
        ▼
Géolocalisation GPS ──► Requête PostGIS ──► Artisans dans le rayon
        │
        ▼
Sélection artisan ──► Demande de devis ──► Notification push artisan
        │
        ▼
Acceptation artisan ──► Confirmation particulier ──► RDV planifié
        │
        ▼
Intervention ──► Évaluation mutuelle ──► Clôture mission
```

---

## 📁 Structure du projet

```
bris-de-glace/
├── mobile/                          # Application Flutter
│   └── lib/
│       ├── features/
│       │   ├── auth/                # Authentification Firebase
│       │   ├── map/                 # Carte et géolocalisation
│       │   ├── artisan/             # Profils et recherche artisans
│       │   ├── booking/             # Prise de rendez-vous
│       │   ├── messaging/           # Chat en temps réel
│       │   └── dashboard/           # Tableau de bord artisan
│       ├── graphql/
│       │   ├── queries/
│       │   ├── mutations/
│       │   └── subscriptions/
│       └── core/
│           ├── theme/
│           ├── router/
│           └── di/                  # Injection de dépendances
│
├── web/                             # Application Vue.js 3
│   └── src/
│       ├── views/
│       ├── components/
│       ├── stores/                  # Pinia
│       ├── graphql/
│       └── composables/
│
├── backend/                         # NestJS API
│   └── src/
│       ├── modules/
│       │   ├── auth/
│       │   ├── artisan/
│       │   ├── booking/
│       │   ├── geolocation/         # Logique PostGIS
│       │   ├── notification/        # Firebase Cloud Messaging
│       │   └── subscription/        # Gestion abonnements
│       ├── graphql/
│       └── common/
│
├── hasura/                          # Config Hasura
│   ├── migrations/
│   └── metadata/
│
└── docker-compose.yml
```

---

## 💡 Extraits de code

### Requête géospatiale PostGIS — Artisans dans un rayon

```typescript
// backend/src/modules/geolocation/geolocation.service.ts
async findArtisansNearby(
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<Artisan[]> {
  return this.artisanRepository
    .createQueryBuilder('artisan')
    .where(
      `ST_DWithin(
        artisan.location::geography,
        ST_MakePoint(:lng, :lat)::geography,
        :radius
      )`,
      { lat, lng, radius: radiusKm * 1000 },
    )
    .orderBy(
      `ST_Distance(
        artisan.location::geography,
        ST_MakePoint(:lng, :lat)::geography
      )`,
    )
    .setParameters({ lat, lng })
    .getMany();
}
```

### Subscription GraphQL — Mises à jour en temps réel

```graphql
# Suivi temps réel du statut d'une intervention
subscription TrackIntervention($bookingId: uuid!) {
  booking_by_pk(id: $bookingId) {
    id
    status
    artisan {
      id
      name
      current_location
    }
    updated_at
  }
}
```

### Widget Flutter — Carte artisans géolocalisés

```dart
// mobile/lib/features/map/widgets/artisan_map_view.dart
class ArtisanMapView extends StatelessWidget {
  final List<Artisan> artisans;
  final LatLng userLocation;

  const ArtisanMapView({
    super.key,
    required this.artisans,
    required this.userLocation,
  });

  @override
  Widget build(BuildContext context) {
    return GoogleMap(
      initialCameraPosition: CameraPosition(
        target: userLocation,
        zoom: 13,
      ),
      markers: {
        // Marqueur utilisateur
        Marker(
          markerId: const MarkerId('user'),
          position: userLocation,
          icon: BitmapDescriptor.defaultMarkerWithHue(
            BitmapDescriptor.hueAzure,
          ),
        ),
        // Marqueurs artisans
        ...artisans.map(
          (artisan) => Marker(
            markerId: MarkerId(artisan.id),
            position: LatLng(artisan.lat, artisan.lng),
            infoWindow: InfoWindow(
              title: artisan.name,
              snippet: '${artisan.distanceKm.toStringAsFixed(1)} km',
            ),
            onTap: () => context.push('/artisan/${artisan.id}'),
          ),
        ),
      },
    );
  }
}
```

### Composant Vue.js — Carte artisans web

```vue
<!-- web/src/components/ArtisanMapView.vue -->
<template>
  <div class="map-container">
    <GoogleMap
      :api-key="googleMapsKey"
      :center="userLocation"
      :zoom="13"
      style="width: 100%; height: 500px"
    >
      <Marker
        v-for="artisan in artisans"
        :key="artisan.id"
        :options="{ position: { lat: artisan.lat, lng: artisan.lng } }"
        @click="selectArtisan(artisan)"
      />
    </GoogleMap>

    <ArtisanPanel
      v-if="selectedArtisan"
      :artisan="selectedArtisan"
      @book="openBookingModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGeolocation } from '@/composables/useGeolocation'
import { useArtisansQuery } from '@/graphql/queries'

const { userLocation } = useGeolocation()
const selectedArtisan = ref(null)

const { artisans } = useArtisansQuery({
  lat: userLocation.value.lat,
  lng: userLocation.value.lng,
  radiusKm: 10,
})

const selectArtisan = (artisan) => {
  selectedArtisan.value = artisan
}
</script>
```

---

## 🚀 Lancer le projet

### Prérequis
- Flutter SDK 3.x
- Node.js 18+
- Docker & Docker Compose
- Clé API Google Maps
- Projet Firebase configuré

### Démarrage rapide

```bash
# 1. Cloner le repo
git clone https://github.com/lomdjel/bris-de-glace-showcase.git
cd bris-de-glace-showcase

# 2. Démarrer l'infrastructure (PostgreSQL + Hasura)
docker-compose up -d

# 3. Backend NestJS
cd backend
cp .env.example .env   # Renseigner les variables
npm install
npm run start:dev

# 4. Application Flutter
cd ../mobile
flutter pub get
flutter run

# 5. Application Web
cd ../web
npm install
npm run dev
```

---

## 🔧 Variables d'environnement

```env
# Backend NestJS (.env)
DATABASE_URL=postgresql://user:password@localhost:5432/bris_de_glace
JWT_SECRET=your-jwt-secret
FIREBASE_PROJECT_ID=your-firebase-project
FCM_SERVER_KEY=your-fcm-key
GOOGLE_MAPS_API_KEY=your-google-maps-key
HASURA_ADMIN_SECRET=your-hasura-secret

# Hasura
HASURA_GRAPHQL_DATABASE_URL=postgresql://user:password@postgres:5432/bris_de_glace
HASURA_GRAPHQL_ADMIN_SECRET=your-hasura-secret
```

---

## 📐 Choix techniques

**Pourquoi PostGIS ?**
Les requêtes géospatiales (distance entre deux points, artisans dans un rayon) nécessitent une extension spatiale. PostGIS sur PostgreSQL 
offre des performances excellentes avec `ST_DWithin` et `ST_Distance` et s'intègre nativement avec NestJS via TypeORM.

**Pourquoi Flutter + Vue.js ?**
Flutter pour le mobile assure une expérience native iOS/Android avec une seule base de code. Vue.js 3 pour le web permet aux artisans de 
gérer leur activité depuis un navigateur sans installer d'app — deux cibles différentes, deux interfaces adaptées.

**Pourquoi Hasura ?**
Les subscriptions temps réel de Hasura permettent de suivre l'état d'une intervention sans polling. La mise en relation artisan/particulier 
bénéficie d'une réactivité immédiate dès qu'un statut change.

---

## 👤 Auteur

**Lomdjel Mawo** — Développeur Full Stack Senior
PHP/Symfony · Vue.js 3 · NestJS · Flutter · GraphQL

[![GitHub](https://img.shields.io/badge/GitHub-lomdjel-blue?logo=github)](https://github.com/lomdjel)

