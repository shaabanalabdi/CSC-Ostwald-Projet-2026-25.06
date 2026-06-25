# Déploiement sur un VPS OVH

Guide pas-à-pas pour mettre le site CSC Ostwald en production sur un
serveur OVH unique, avec Docker.

**Temps total estimé**: ~2-3 heures pour la première installation.
Les déploiements suivants (`git push` + `./deploy.sh`) prennent ~2 minutes.

---

## Vue d'ensemble

Un seul VPS OVH (~4-5€/mois) qui exécute **4 containers Docker**:

```
┌─────────── VPS OVH (Strasbourg) ────────────┐
│                                              │
│  nginx ──┬── /         → React build         │
│          ├── /api/*    → api:3001            │
│          └── /uploads/* → api:3001           │
│                                              │
│  api (Node + Express) ── DB_HOST=mysql       │
│                                              │
│  mysql (MySQL 8 + volume persistant)         │
│                                              │
│  certbot (renouvellement SSL automatique)    │
│                                              │
└──────────────────────────────────────────────┘
```

Pas de service externe. Toutes les données restent sur le VPS, en France.

---

## 1. Préalables (à préparer avant de commencer)

- [ ] **Compte OVH** créé ([ovh.com](https://www.ovh.com/fr/))
- [ ] **Carte bancaire** ajoutée (le VPS est facturé au prorata)
- [ ] **Nom de domaine** (`csc-ostwald.fr` ou autre) — soit déjà acheté,
      soit à acheter pendant l'étape 4
- [ ] **Clé SSH** générée sur ton ordinateur (Mac/Linux: `ssh-keygen`;
      Windows: utilise WSL ou PuTTYgen)
- [ ] **Le code du projet** déjà poussé sur GitHub (ou prêt à être
      transféré via rsync depuis ton ordinateur)

---

## 2. Commander le VPS OVH (≈ 10 min)

1. Va sur **[ovh.com/fr/vps](https://www.ovh.com/fr/vps/)**
2. Sélectionne **VPS Starter** (3.99€/mois)
   - 2 GB RAM, 1 vCPU, 20 GB SSD — suffisant pour CSC Ostwald
3. **Datacenter**: choisis **Strasbourg (SBG)** — le plus proche d'Ostwald
4. **Système**: choisis **Ubuntu 24.04** (le plus récent stable)
5. **Options**:
   - Décoche tout sauf l'IP publique (incluse)
   - Option "Backup automatique" (+1€/mois) — recommandé si tu n'as
     pas confiance dans tes propres scripts
6. Valide la commande — le VPS est prêt en ~5 minutes
7. OVH t'envoie un email avec:
   - L'**IP publique** du VPS (à noter)
   - Le mot de passe `root` initial

---

## 3. Première connexion + sécurisation (≈ 20 min)

### 3.1 Se connecter en SSH

```bash
ssh root@<IP-DU-VPS>
# Mot de passe = celui envoyé par OVH
```

### 3.2 Changer le mot de passe root

```bash
passwd
# Tape un mot de passe long (16+ caractères) — note-le dans ton
# gestionnaire de mots de passe (Bitwarden, 1Password, KeePassXC...).
```

### 3.3 Créer un utilisateur non-root pour les déploiements

```bash
adduser csc
# Mot de passe + confirmation, le reste tu peux laisser vide (Enter)
usermod -aG sudo csc
# Copie ta clé SSH publique pour que csc puisse se connecter
mkdir -p /home/csc/.ssh
nano /home/csc/.ssh/authorized_keys
# Colle le contenu de ~/.ssh/id_ed25519.pub (sur TON ordinateur)
chown -R csc:csc /home/csc/.ssh
chmod 700 /home/csc/.ssh
chmod 600 /home/csc/.ssh/authorized_keys
```

### 3.4 Désactiver le login root SSH

```bash
nano /etc/ssh/sshd_config
# Modifie ces deux lignes:
#   PermitRootLogin no
#   PasswordAuthentication no
systemctl restart ssh
```

### 3.5 Activer le firewall (UFW)

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (pour ACME + redirection HTTPS)
ufw allow 443/tcp   # HTTPS
ufw enable
ufw status
```

### 3.6 Installer fail2ban (anti brute-force SSH)

```bash
apt update
apt install -y fail2ban
systemctl enable --now fail2ban
```

À ce stade, **ferme la session root** et reconnecte-toi en tant que `csc`:

```bash
exit
ssh csc@<IP-DU-VPS>
```

---

## 4. Configurer le nom de domaine (≈ 15 min)

### 4.1 Si tu n'as pas encore acheté le domaine

1. Va sur **[ovh.com/fr/domaines](https://www.ovh.com/fr/domaines/)**
2. Cherche `csc-ostwald.fr` (~7€/an)
3. Achète-le sans options (pas besoin de DNSSEC, mail pro, etc.)
4. Attends que le domaine apparaisse dans ton espace client (5-30 min)

### 4.2 Pointer le domaine vers le VPS

Dans l'espace client OVH:
1. **Domaines** → `csc-ostwald.fr` → **Zone DNS**
2. Modifier les enregistrements:

| Type | Sous-domaine | Cible |
|------|--------------|-------|
| `A` | `@` (apex) | `<IP-DU-VPS>` |
| `A` | `www` | `<IP-DU-VPS>` |
| `AAAA` | `@` | `<IPv6-DU-VPS>` *(optionnel, si OVH t'en donne une)* |

3. Valide. La propagation DNS prend généralement 5-30 min, parfois jusqu'à 24h.

Pour vérifier la propagation:

```bash
# Sur ton ordinateur:
dig csc-ostwald.fr
# Réponse attendue: ANSWER SECTION contient l'IP du VPS
```

---

## 5. Installer Docker sur le VPS (≈ 10 min)

Connecté en tant que `csc` sur le VPS:

```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Docker — méthode officielle
curl -fsSL https://get.docker.com | sudo sh

# Permet à l'utilisateur csc d'exécuter docker sans sudo
sudo usermod -aG docker csc
# Important: déconnecte-toi puis reconnecte-toi pour activer le groupe
exit
ssh csc@<IP-DU-VPS>
docker --version       # → Docker version 27.x
docker compose version # → Docker Compose version v2.x

# AWS CLI — uniquement si tu veux les backups off-VPS
sudo apt install -y awscli
```

---

## 6. Déposer le code sur le VPS (≈ 15 min)

### 6.1 Préparer la structure

```bash
sudo mkdir -p /srv/csc-ostwald
sudo chown -R csc:csc /srv/csc-ostwald
cd /srv/csc-ostwald
```

### 6.2 Cloner le repo (Git) OU rsync depuis ton ordinateur

**Option A — Git** (si le repo est sur GitHub):

```bash
# Sur le VPS:
git clone https://github.com/<TON-USERNAME>/<TON-REPO>.git .
```

**Option B — rsync** (depuis ton ordinateur):

```bash
# Sur ton ordinateur, à la racine du projet:
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='dist' \
  --exclude='client/dist' --exclude='api/uploads' \
  ./ csc@<IP-DU-VPS>:/srv/csc-ostwald/
```

### 6.3 Build du React frontend en LOCAL (sur ton ordinateur)

```bash
cd <projet>/client
npm ci
npm run build
# Génère client/dist/

# Envoie le build au VPS
rsync -avz --delete dist/ csc@<IP-DU-VPS>:/srv/csc-ostwald/deploy/client-build/
```

### 6.4 Créer le fichier .env

```bash
# Sur le VPS:
cd /srv/csc-ostwald/deploy
cp .env.example .env
nano .env
```

**Variables à remplir absolument**:

```bash
# MySQL: app user (used by the API) + root (used only by backup.sh).
DB_USER=csc_app
DB_PASSWORD=<openssl rand -base64 32>
DB_ROOT_PASSWORD=<openssl rand -base64 32>   # DIFFERENT from DB_PASSWORD
JWT_SECRET=<openssl rand -base64 64>
CORS_ORIGIN=https://csc-ostwald.fr,https://www.csc-ostwald.fr
# Required in production — the server refuses to boot if HELLOASSO_MODE
# is not "real". See api/src/config/helloasso.js for why.
HELLOASSO_MODE=real
HELLOASSO_CLIENT_ID=<from HelloAsso dashboard>
HELLOASSO_CLIENT_SECRET=<from HelloAsso dashboard>
HELLOASSO_ORG_SLUG=csc-ostwald
HELLOASSO_WEBHOOK_SECRET=<openssl rand -base64 32>
HELLOASSO_RETURN_URL=https://csc-ostwald.fr/jeunesse/inscription-confirmee
HELLOASSO_CANCEL_URL=https://csc-ostwald.fr/jeunesse
```

Génère les secrets avec OpenSSL (déjà installé sur Ubuntu):

```bash
openssl rand -base64 32     # → DB_PASSWORD
openssl rand -base64 32     # → DB_ROOT_PASSWORD (différent !)
openssl rand -base64 64     # → JWT_SECRET
openssl rand -base64 32     # → HELLOASSO_WEBHOOK_SECRET
```

**Pourquoi deux mots de passe MySQL ?** Le conteneur API se connecte avec
`DB_USER` (créé automatiquement par MySQL au premier démarrage, droits
limités à `csc_ostwald.*`). Le compte `root` n'est utilisé que par
`backup.sh` pour `mysqldump`. Garder les deux séparés évite qu'une fuite
des secrets de l'API ne donne aussi un accès superuser.

```bash
chmod 600 .env   # Personne d'autre que csc ne peut le lire
```

---

## 7. Premier démarrage + activation SSL (≈ 15 min)

```bash
cd /srv/csc-ostwald/deploy

# 1) Lance les containers MySQL + API en arrière-plan
docker compose -f docker-compose.prod.yml up -d mysql api

# 2) Vérifie que MySQL et l'API sont healthy (peut prendre ~30s)
docker compose -f docker-compose.prod.yml ps
# Attendu: mysql et api en "Up X (healthy)"

# 3) Lance le script d'init Let's Encrypt (HTTP-only nginx + cert + HTTPS)
./scripts/init-letsencrypt.sh csc-ostwald.fr admin@csc-ostwald.fr
```

Le script:
1. Génère la config nginx HTTP-only
2. Démarre nginx (port 80)
3. Demande le certificat SSL à Let's Encrypt
4. Bascule sur la config HTTPS finale
5. Recharge nginx

À la fin, tu dois voir:

```
✓ SSL cert issued and HTTPS enabled.
  Visit: https://csc-ostwald.fr
```

---

## 8. Créer le premier compte admin + seeder le contenu (≈ 5 min)

```bash
cd /srv/csc-ostwald/deploy

# 1. Premier compte admin (obligatoire — sans ça, /admin/* inaccessible)
docker compose -f docker-compose.prod.yml exec api \
  node scripts/create-admin.js admin@csc-ostwald.fr 'MotDePasseFort!2026'

# 2. Seed du contenu initial (tous idempotents — re-run = no-op)
docker compose -f docker-compose.prod.yml exec api npm run seed:team
docker compose -f docker-compose.prod.yml exec api npm run seed:partners
docker compose -f docker-compose.prod.yml exec api npm run seed:events
docker compose -f docker-compose.prod.yml exec api npm run seed:activities
docker compose -f docker-compose.prod.yml exec api npm run seed:projet-social
docker compose -f docker-compose.prod.yml exec api npm run seed:news
```

Vérifie:
- Va sur `https://csc-ostwald.fr/admin/login`
- Connecte-toi avec ces identifiants
- Tu dois voir le dashboard admin avec les 12 modules (Messages, Bénévoles,
  Newsletter, Inscriptions, Activités, Événements, Équipe, Partenaires,
  Projet Social, **Nos actualités**, etc.)
- Va sur `https://csc-ostwald.fr` — la section "Nos actualités" en bas de
  l'accueil doit afficher les 2 cartes seed.

---

## 9. Backup automatique quotidien (≈ 5 min)

```bash
# Sur le VPS, programmer un cron quotidien à 3h30 du matin:
sudo crontab -e
```

Ajoute la ligne:

```cron
30 3 * * * /srv/csc-ostwald/deploy/scripts/backup.sh >> /var/log/csc-backup.log 2>&1
```

Test immédiat:

```bash
sudo /srv/csc-ostwald/deploy/scripts/backup.sh
ls -lh /srv/csc-ostwald/backups/
```

(Optionnel) Pour un stockage off-VPS, crée un container Object Storage
sur OVH Public Cloud et remplis `BACKUP_S3_*` dans `.env`.

---

## 10. Tests fonctionnels (≈ 5 min)

Ouvre dans ton navigateur:

- [ ] `https://csc-ostwald.fr` → page d'accueil charge
- [ ] `https://csc-ostwald.fr/api/health` → `{"status":"ok",...}`
- [ ] `https://csc-ostwald.fr/famille` → page Famille charge
- [ ] `https://csc-ostwald.fr/admin/login` → page de login admin
- [ ] Connecte-toi → tu vois le dashboard
- [ ] Crée un membre d'équipe avec une photo → la photo apparaît sur `/a-propos/qui-sommes-nous`

---

## 11. Déploiements ultérieurs

Une fois tout en place, chaque mise à jour se fait depuis ton ordinateur:

```bash
# Sur ton ordinateur, à la racine du projet:
./deploy/scripts/deploy.sh csc@<IP-DU-VPS>
```

Le script:
1. Build React en local
2. Synchronise les fichiers vers le VPS
3. Reconstruit l'image API et redémarre les containers
4. Affiche le statut

**Durée typique**: ~2 minutes.

---

## 12. Maintenance courante

### Voir les logs

```bash
# Logs API
docker compose -f docker-compose.prod.yml logs -f api

# Logs nginx
docker compose -f docker-compose.prod.yml logs -f nginx

# Tous les services
docker compose -f docker-compose.prod.yml logs -f
```

### Redémarrer un service

```bash
docker compose -f docker-compose.prod.yml restart api
```

### Mettre à jour Ubuntu (1 fois par mois)

```bash
sudo apt update && sudo apt upgrade -y
sudo reboot   # si le noyau a été mis à jour
```

### Restaurer depuis un backup

```bash
cd /srv/csc-ostwald/deploy
./scripts/restore.sh /srv/csc-ostwald/backups/csc-ostwald-2026-05-19-0330.sql.gz
# Tape "YES" pour confirmer
```

### Voir l'utilisation disque

```bash
df -h                 # Espace disque libre
du -sh /srv/csc-ostwald/*
docker system df      # Espace utilisé par Docker
```

### Nettoyer les images Docker obsolètes

```bash
docker system prune -a --volumes
# ATTENTION: --volumes supprime les volumes non utilisés. Ne pas
# l'utiliser si tu as arrêté temporairement le stack — le volume
# mysql-data serait supprimé !
```

---

## 13. Tableau de bord rapide (à imprimer)

| Action | Commande |
|--------|----------|
| Connexion VPS | `ssh csc@<IP-DU-VPS>` |
| État des containers | `cd /srv/csc-ostwald/deploy && docker compose -f docker-compose.prod.yml ps` |
| Logs en direct | `docker compose -f docker-compose.prod.yml logs -f` |
| Redémarrer API | `docker compose -f docker-compose.prod.yml restart api` |
| Backup manuel | `./scripts/backup.sh` |
| Restaurer | `./scripts/restore.sh <fichier.sql.gz>` |
| Nouveau déploiement | (depuis le laptop) `./deploy/scripts/deploy.sh csc@<IP>` |
| Update OS | `sudo apt update && sudo apt upgrade -y` |

---

## 14. Coût récapitulatif

| Poste | Coût annuel |
|-------|-------------|
| VPS Starter OVH (3.99€/mois) | **47.88€** |
| Domaine `.fr` chez OVH | ~7€ |
| Backup OVH (optionnel, 1€/mois) | ~12€ |
| **Total**| **~55-67€/an** |

(À comparer aux ~228€/an pour Vercel + Render + Aiven.)

---

## 15. En cas de problème

| Symptôme | Diagnostic | Solution |
|----------|------------|----------|
| HTTPS ne fonctionne pas | `docker compose logs nginx` montre une erreur SSL | Re-lancer `./scripts/init-letsencrypt.sh` |
| API renvoie 502 | API container down | `docker compose restart api` + voir les logs |
| Disque plein | `df -h` montre 100% | `docker system prune -a` + supprimer vieux backups |
| Login admin échoue | JWT_SECRET changé | Re-créer le compte admin avec `create-admin.js` |
| Site lent | CPU à 100% | `docker stats` → identifier le container, redémarrer |
| Site inaccessible | UFW bloque ou OVH down | `sudo ufw status` + statut OVH ([status.ovh.com](https://status.ovh.com)) |

Pour tout problème grave: arrêter les services (`docker compose down`),
restaurer le dernier backup, redémarrer.

---

**Tu es prêt pour la production.** Si tu rencontres un blocage à une
étape précise, copie le message d'erreur et demande de l'aide.
