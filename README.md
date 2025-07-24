# Galerie d'Images Personnelle

Une mini-application web développée avec Next.js et Supabase permettant aux utilisateurs de gérer leur galerie d'images personnelle.

## Fonctionnalités

- ✅ Authentification (inscription/connexion) via Supabase
- ✅ Upload d'images dans une galerie personnelle
- ✅ Affichage des images sous forme de miniatures en grille
- ✅ Suppression d'images de la galerie
- ✅ Interface responsive et minimaliste

## Technologies utilisées

- **Frontend** : Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend** : Supabase (authentification, base de données, stockage)
- **Autres** : UUID pour la génération d'identifiants uniques

## Architecture

### Structure du projet
```
image-gallery/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Layout principal avec AuthProvider
│   │   ├── page.tsx            # Page d'accueil
│   │   └── globals.css         # Styles globaux
│   ├── components/
│   │   ├── AuthForm.tsx        # Formulaire de connexion/inscription
│   │   ├── ImageUpload.tsx     # Composant d'upload d'images
│   │   └── ImageGallery.tsx    # Grille d'affichage des images
│   │   └── ImageModal.tsx      # Modal pour voir une image
│   ├── contexts/
│   │   └── AuthContext.tsx     # Context pour la gestion d'authentification
│   └── lib/
│       └── supabase.ts         # Configuration du client Supabase
├── public/                     # Fichiers statiques
├── .env.local                  # Variables d'environnement
├── .env.local.example          # Exemple de variables d'environnement
└── package.json                # Dépendances du projet
```

### Base de données (Supabase)
**Table : `images`**
- `id` (UUID, Clé primaire) - Identifiant unique de l'image
- `user_id` (UUID, Référence à auth.users) - ID de l'utilisateur propriétaire
- `url` (TEXT) - URL publique de l'image stockée
- `created_at` (TIMESTAMP) - Date de création

### Stockage de fichiers (Supabase Storage)
- **Bucket** : `user-images/user_id` (Chaque utilisateur n'a accès qu'à ses propres images)
- **Structure** : Chaque image est nommée avec un UUID unique
- **Permissions** : Accès en lecture/écriture pour les utilisateurs authentifiés

## Flux d'interaction

### 1. Authentification
```
Utilisateur → Formulaire de connexion/inscription → Supabase Auth → Session utilisateur
```

### 2. Upload d'image
```
Utilisateur → Sélection fichier → Upload vers Supabase Storage → 
Enregistrement métadonnées en DB → Rafraîchissement de la galerie
```

### 3. Affichage des images
```
Chargement de la page → Récupération des images de l'utilisateur depuis la DB → 
Affichage en grille avec URLs du Storage
```

### 4. Suppression d'image
```
Clic sur "Supprimer" → Confirmation → Suppression du Storage → 
Suppression de la DB → Mise à jour de l'interface
```

## Installation et configuration

### Prérequis
- Node.js 18+ installé
- Un compte Supabase (gratuit)

### Étapes d'installation

1. **Cloner le projet**
   ```bash
   git clone [url-du-repo]
   cd image-gallery
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer Supabase**
   
   a. Créer un nouveau projet sur [supabase.com](https://supabase.com)
   
   b. Dans l'onglet "SQL Editor", exécuter cette requête pour créer la table :
   ```sql
   -- Créer la table images
   CREATE TABLE images (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     url TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Activer RLS (Row Level Security)
   ALTER TABLE images ENABLE ROW LEVEL SECURITY;

   -- Politique pour que les utilisateurs ne voient que leurs images
   CREATE POLICY "Users can view own images" ON images
     FOR SELECT USING (auth.uid() = user_id);

   -- Politique pour que les utilisateurs puissent insérer leurs images
   CREATE POLICY "Users can insert own images" ON images
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   -- Politique pour que les utilisateurs puissent supprimer leurs images
   CREATE POLICY "Users can delete own images" ON images
     FOR DELETE USING (auth.uid() = user_id);
   ```

   c. Dans l'onglet "Storage", créer un bucket nommé `user-images` :
   - Cliquer sur "New bucket"
   - Nom : `user-images`
   - Public bucket : ✅ Coché (pour permettre l'accès aux URLs publiques)

   d. Configurer les politiques du bucket `user-images` :
   ```sql
   -- Politique pour permettre l'upload d'images dans leurs propres dossiers
   CREATE POLICY "Users can upload images to own folder" ON storage.objects
     FOR INSERT WITH CHECK (
       bucket_id = 'user-images' 
       AND auth.role() = 'authenticated'
       AND auth.uid()::text = (storage.foldername(name))[1]
     );

   -- Politique pour permettre la lecture d'images
   CREATE POLICY "Users can read their own images" ON storage.objects
     FOR SELECT USING ((bucket_id = 'user-images'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1]));

   -- Politique pour permettre la suppression d'images
   CREATE POLICY "Users can delete own images" ON storage.objects
     FOR DELETE USING ((bucket_id = 'user-images'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1]));
   ```

4. **Configurer les variables d'environnement**
   
   Copier le fichier `.env.local` et remplir avec vos données Supabase :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_publique_anon
   ```
   
   Ces informations se trouvent dans les Settings > API de votre projet Supabase.

5. **Lancer l'application en développement**
   ```bash
   npm run dev
   ```

6. **Accéder à l'application**
   Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### Déploiement

Pour déployer l'application :

1. **Build de production**
   ```bash
   npm run build
   ```

2. **Déploiement sur Vercel** (recommandé)
   - Connecter votre repo Git à Vercel
   - Ajouter les variables d'environnement dans les settings Vercel
   - Le déploiement se fait automatiquement

## Utilisation

1. **Inscription/Connexion**
   - Créer un compte avec email et mot de passe
   - Se connecter avec ses identifiants

2. **Upload d'images**
   - Cliquer sur le bouton de sélection de fichier
   - Choisir une image (formats supportés : JPG, PNG, GIF, etc.)
   - L'image est automatiquement uploadée et apparaît dans la galerie

3. **Gestion des images**
   - Voir toutes ses images en grille
   - Cliquer sur "Supprimer" pour enlever une image
   - Les images sont triées par date d'ajout (plus récentes en premier)

## Structure technique détaillée

### Authentification
- Utilisation de Supabase Auth avec email/password
- Context React pour gérer l'état d'authentification global
- Protection automatique des routes selon l'état de connexion

### Gestion des images
- Upload direct vers Supabase Storage avec génération d'UUID
- Sauvegarde des métadonnées en base pour un accès rapide
- Suppression cascadée (storage + database)

### Interface utilisateur
- Design responsive avec Tailwind CSS
- Composants réutilisables et modulaires
- Gestion des états de chargement et d'erreur

## Dépendances principales

```json
{
  "@supabase/supabase-js": "^2.x.x",
  "next": "15.x.x",
  "react": "18.x.x",
  "typescript": "^5.x.x",
  "tailwindcss": "^3.x.x",
  "uuid": "^10.x.x"
}
```

## Support

Pour toute question ou problème :
1. Vérifier que Supabase est correctement configuré
2. S'assurer que les variables d'environnement sont correctes
3. Vérifier les politiques RLS de la base de données
