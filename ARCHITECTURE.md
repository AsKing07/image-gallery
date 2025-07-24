# Schéma d'Architecture - Galerie d'Images Personnelle

## Structure du Projet

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION NEXT.JS                      │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Client-Side)                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   AuthForm      │  │  ImageUpload    │  │ ImageGallery │ │
│  │  - Connexion    │  │  - Sélection    │  │ - Affichage  │ │
│  │  - Inscription  │  │  - Upload       │  │ - Grille     │ │
│  └─────────────────┘  └─────────────────┘  │ - Suppression│ │
│                                           └──────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 AuthContext                             │ │
│  │           (Gestion état authentification)               │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                               │
├─────────────────────────────────────────────────────────────┤
│  Authentication                                            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                auth.users                               │ │
│  │  - id (UUID)                                           │ │
│  │  - email                                               │ │
│  │  - encrypted_password                                   │ │
│  │  - created_at                                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  Database (PostgreSQL)                                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   images                                │ │
│  │  - id (UUID, PK)                                       │ │
│  │  - user_id (UUID, FK → auth.users.id)                 │ │
│  │  - url (TEXT)                                          │ │
│  │  - created_at (TIMESTAMP)                              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  Storage                                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 user-images/user_id                            │ │
│  │  ├── uuid1.jpg                                         │ │
│  │  ├── uuid2.png                                         │ │
│  │  ├── uuid3.jpeg                                        │ │
│  │  └── ...                                               │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Flux d'Interaction

### 1. Authentification

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ Utilisateur │───▶│ AuthForm     │───▶│ Supabase    │
│             │    │ - Email      │    │ Auth        │
│             │    │ - Password   │    │             │
└─────────────┘    └──────────────┘    └─────────────┘
                          │                    │
                          ▼                    ▼
                   ┌──────────────┐    ┌─────────────┐
                   │ AuthContext  │◀───│ Session     │
                   │ (État global)│    │ Utilisateur │
                   └──────────────┘    └─────────────┘
```

### 2. Upload d'Image

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ Utilisateur │───▶│ ImageUpload  │───▶│ Supabase    │
│ Sélectionne │    │ - Validation │    │ Storage     │
│ Image       │    │ - UUID Gen   │    │             │
└─────────────┘    └──────────────┘    └─────────────┘
                          │                    │
                          │                    ▼
                          │            ┌─────────────┐
                          │            │ Fichier     │
                          │            │ Stocké      │
                          │            └─────────────┘
                          ▼                    │
                   ┌──────────────┐            │
                   │ DB: images   │◀───────────┘
                   │ - url        │
                   │ - user_id    │
                   └──────────────┘
```

### 3. Affichage des Images

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ Page Load   │───▶│ ImageGallery │───▶│ Supabase    │
│             │    │              │    │ Database    │
└─────────────┘    └──────────────┘    └─────────────┘
                          ▲                    │
                          │                    ▼
                   ┌──────────────┐    ┌─────────────┐
                   │ Grille       │◀───│ Liste URLs  │
                   │ d'Images     │    │ + Metadata  │
                   └──────────────┘    └─────────────┘
```

### 4. Suppression d'Image

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ Clic        │───▶│ Confirmation │───▶│ Supabase    │
│ Supprimer   │    │              │    │ Storage     │
└─────────────┘    └──────────────┘    └─────────────┘
                          │                    │
                          │                    ▼
                          │            ┌─────────────┐
                          │            │ Suppression │
                          │            │ Fichier     │
                          │            └─────────────┘
                          ▼                    │
                   ┌──────────────┐            │
                   │ DB: images   │◀───────────┘
                   │ DELETE       │
                   └──────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ Mise à jour  │
                   │ Interface    │
                   └──────────────┘
```

## Sécurité et Politiques

### Row Level Security (RLS)

```
┌─────────────────────────────────────────┐
│             Table: images               │
├─────────────────────────────────────────┤
│ SELECT: auth.uid() = user_id           │
│ INSERT: auth.uid() = user_id           │
│ DELETE: auth.uid() = user_id           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          Storage: user-images           │
├─────────────────────────────────────────┤
│ INSERT: authenticated users only       │
│ SELECT: owner only                  │
│ DELETE: owner only                     │
└─────────────────────────────────────────┘
```

## Technologies

- **Frontend**: Next.js 15 + React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Déploiement**: Vercel (recommandé)
- **Autres**: UUID, Context API React
