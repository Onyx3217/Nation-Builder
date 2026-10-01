# 🌍 NATION BUILDER 2.0 — Manuel Officiel de Souveraineté & Guide de Jeu

Bienvenue dans **Nation Builder 2.0**, le simulateur géopolitique et macroéconomique propulsé par l'intelligence artificielle générative (**Groq LPU**) et une base de données de plus de 100 puissances mondiales réelles.

Ce document rassemble l'ensemble des règles de jeu, des mécanismes macroéconomiques, du fonctionnement du Conseil Suprême IA et des instructions techniques du projet.

---

## 📑 Sommaire
1. [Vue d'ensemble & Philosophie](#1-vue-densemble--philosophie)
2. [Création de la Nation](#2-création-de-la-nation)
3. [Macroéconomie & Indicateurs Réels](#3-macroéconomie--indicateurs-réels)
4. [Le Conseil Suprême IA & Les 5 Directives Quotidiennes](#4-le-conseil-suprême-ia--les-5-directives-quotidiennes)
5. [Passerelle Temporelle & Frein d'Urgence (Crisis Brake)](#5-passerelle-temporelle--frein-durgence-crisis-brake)
6. [Conditions de Fin de Partie (Game Over)](#6-conditions-de-fin-de-partie-game-over)
7. [Diplomatie, Carte Mondiale & Presse Internationale](#7-diplomatie-carte-mondiale--presse-internationale)
8. [Configuration Musicale & Dossier Audio](#8-configuration-musicale--dossier-audio)
9. [Sauvegardes Locales & Cloud (Supabase)](#9-sauvegardes-locales--cloud-supabase)
10. [Architecture Technique & Modèles Groq IA](#10-architecture-technique--modèles-groq-ia)

---

## 1. Vue d'ensemble & Philosophie

Nation Builder est conçu pour immerger le joueur à la tête d'un État souverain. Chaque décision a un prix, chaque décret a des répercussions systémiques selon les lois réelles de l'économie mondiale et de la géopolitique internationale.

L'interface a été conçue pour être **épurée et autoritaire**, sans tutoriels intrusifs ni messages d'aide à l'écran : vous êtes le Chef d'État, vous disposez de tous les leviers du pouvoir.

---

## 2. Création de la Nation

L'assistant de fondation vous guide à travers 9 étapes souveraines :

1. **🏔️ Géographie** : Choisissez un continent et une superficie, placez votre nation sur la carte, ou sélectionnez un pays existant pour le jouer. Les nations du monde fictif se choisissent dans la liste associée à la carte régionale.
2. **👥 Démographie** : Population totale et taux d'urbanisation des métropoles.
3. **🏛️ Régime Constitutionnel** : Démocratie parlementaire, République présidentielle, Monarchie constitutionnelle, Fédération fédérale, Dictature autoritaire, Théocratie, Oligarchie financière, Junte militaire.
4. **💰 Macroéconomie** : Niveau de vie initial, chômage, inflation, endettement, indice de Gini (équité) et ressources stratégiques majeures.
5. **🛡️ Défense Nationale** : Puissance militaire de 1 (Pacifiste) à 10 (Superpuissance hégémonique).
6. **🎭 Culture & Identité** : Famille linguistique (Romane, Germanique, Slave, Sémitique, Sino-Tibétaine, etc.).
7. **🤝 Posture Diplomatique** : Neutralité pragmatique, Souverainisme isolationniste, Expansionnisme, Militarisme offensif ou Idéalisme multilatéral.
8. **✨ Finalisation** : Nom officiel de la nation, capitale, emblème/drapeau et scénario de départ (crise géopolitique, guerre totale, monde post-apocalyptique ou ordre classique). Vous pouvez également utiliser le bouton **Générateur IA** pour inventer automatiquement des noms immersifs et cohérents.

---

## 3. Macroéconomie & Indicateurs Réels

Le jeu simule fidèlement les grands équilibres économiques d'un État moderne :

| Indicateur | Définition & Rôle dans le Jeu | Risques Associés |
|---|---|---|
| **PIB Réel / Habitant** | Niveau de richesse moyen produit par chaque citoyen (USD). | Une chute sous 400$ entraîne la famine et la banqueroute. |
| **PIB Nominal** | Taille globale de l'économie en Milliards de dollars (`Population × PIB/hab`). | Mesure le poids économique mondial et la capacité d'emprunt. |
| **Taux de Chômage** | Pourcentage de la population active sans emploi. | Un chômage > 15% détériore rapidement la stabilité civile. |
| **Taux d'Inflation** | Hausse générale des prix annuels. | Une inflation > 25% détruit le pouvoir d'achat ; > 50% = hyperinflation dévastatrice. |
| **Dette Publique (% du PIB)** | Dette de l'État rapportée à sa richesse annuelle. | Une dette > 150% alourdit les taux d'intérêt ; > 250% = risque de défaut souverain. |
| **Indice de Gini (Équité)** | Mesure des inégalités (0% = égalité parfaite, 100% = inégalité totale). | Un Gini > 50% accentue les tensions entre classes sociales et les révoltes. |
| **Stabilité Civile (0-100%)** | Ordre constitutionnel, confiance dans les institutions et sécurité. | **À 0%, le gouvernement s'effondre (Game Over).** |
| **Crédit Diplomatique (0-100%)** | Réputation internationale, prestige et influence auprès des autres nations. | Une mauvaise réputation isole le pays et attire des sanctions. |
| **Tension Frontalière (0-100%)** | Niveau de danger militaire avec vos voisins et puissances hostiles. | **À 100%, une invasion ennemie peut anéantir la nation.** |

---

## 4. Le Conseil Suprême IA & Les 5 Directives par période

### Quota : 5 Directives par 30 jours
Le Chef d'État dispose de **5 décisions exécutives par période de 30 jours** (`⚡ 5/5`). Les consultations informatives ne consomment pas de décision. Le quota se recharge au passage du prochain cycle de 30 jours.

### Deux Types de Requêtes : Décision vs Consultation
Lorsque vous soumettez une requête au Conseil, l'IA procède à une analyse en deux temps :

1. **CONSULTATION & ANALYSE STRATÉGIQUE (isDecision: false)** :
   - *Exemples* : *"Comment se porte notre balance commerciale ?"*, *"Qui sont nos partenaires fiables ?"*, *"Quelle est la doctrine militaire de la Chine ?"*, *"Bonjour"*.
   - **Conséquence** : **Aucun impact statistique direct**. Le Conseil vous fournit un rapport d'intelligence complet sans modifier les indicateurs de l'État.

2. **DÉCISION EXÉCUTIVE VALIDÉE (isDecision: true)** :
   - *Exemples* : *"Augmenter les impôts sur le revenu de 15%"*, *"Mobiliser 100 000 réservistes aux frontières"*, *"Nationaliser le réseau électrique et les banques"*, *"Plan d'austérité drastique"*, *"Imprimer 50 milliards de monnaie"*.
   - **Conséquence** : L'IA agit en tant qu'**expert macroéconomiste mondial**. Elle évalue les effets directs et indirects selon la théorie économique réelle :
     - *Création monétaire excessive* → Hausse brutale de l'inflation, dévaluation de la monnaie, baisse du PIB réel.
     - *Hausses d'impôts soudaines* → Baisse du déficit mais ralentissement économique et grogne sociale.
     - *Mobilisation militaire agressive* → Bond des tensions frontalières, fuite des capitaux étrangers, risque de sanctions.
     - *Loi de justice sociale* → Baisse de l'indice de Gini mais hausse de la dette publique.
   - Les indicateurs sont **instantanément appliqués** à la nation et les conséquences sont transmises au fil de presse mondial.

---

## 5. Passerelle Temporelle & Frein d'Urgence (Crisis Brake)

### Accélération du Temps
En haut à droite de l'écran mondial, vous pouvez choisir la vitesse à laquelle le temps s'écoule :
- **+1 Jour** : Avancement classique d'une journée.
- **Timer automatique** : une semaine de jeu avance toutes les 7 minutes réelles. Le compte à rebours se met en pause pendant une interaction ou une fenêtre ouverte; le bouton permet aussi de le suspendre/reprendre.
- **+7 Jours (1 semaine)** : Chronique hebdomadaire.
- **+30 Jours (1 mois)** : Évolution macroéconomique mensuelle.
- **+90 Jours (1 trimestre)** : Bilan trimestriel complet.
- **+1, +5 ou +10 ans** : Sauts de long terme avec projets, tendances et diplomatie simulés sur la période.

Les journées courtes peuvent être calmes; elles avancent tout de même les projets. Les sauts d'une semaine ou plus simulent les tendances, les événements et les contacts diplomatiques reçus.

### 🚨 Le Frein d'Urgence (Crisis Brake)
Si, pendant un saut dans le temps (par exemple un saut de 30 jours), un événement critique survient et menace directement l'intégrité de la nation (émeutes de la faim au 12ème jour, provocation armée à la frontière au 8ème jour, panique bancaire...), **le simulateur interrompt immédiatement le saut dans le temps** !

- Une fenêtre rouge d'alerte maximale apparaît : **INTERRUPTION D'URGENCE : LA SITUATION A DÉRAPÉ**.
- L'IA vous explique exactement ce qui s'est produit au jour précis de l'incident.
- Le Conseil vous propose 3 mesures d'urgence pour reprendre immédiatement le contrôle de la situation.

---

## 6. Conditions de Fin de Partie (Game Over)

Nation Builder intègre des conditions d'effondrement d'État réalistes. Si votre gestion mène la nation à l'impasse, la partie se termine par un **Effondrement de la Nation** :

1. **💀 Insurrection Civile & Coup d'État (`Stabilité <= 0%`)** :
   Les institutions ont cédé sous les émeutes incontrôlables, la police refuse d'obéir et les forces armées renversent le gouvernement.

2. **📉 Banqueroute Souveraine & Famine (`PIB/hab <= 400$` ou `Dette >= 280% + Inflation >= 60%`)** :
   L'économie est totalement anéantie, la monnaie ne vaut plus rien, le Trésor est insolvable et les pénuries alimentaires disloquent le pays.

3. **⚔️ Capitulation & Annexion Militaire (`Tension frontalière >= 100%` avec `Puissance militaire < 4`)** :
   Une coalition ennemie envahit le territoire sans opposition majeure. La nation capitule sans condition.

*En cas de fin de partie, un bilan d'autopsie récapitule vos erreurs et vous pouvez soit recommencer une nation, soit charger une sauvegarde antérieure.*

---

## 7. Diplomatie, Carte Mondiale & Presse Internationale

- **Carte Interactive & Secteurs Océaniques** : Votre nation est positionnée sur des territoires maritimes protégés pour ne jamais écraser les puissances réelles. Les pays sont indiqués par des repères discrets et réagissent au survol.
- **Index Diplomatique Mondial** : Plus de 100 pays réels (France, États-Unis, Allemagne, Japon, Brésil, Inde, etc.) avec leurs caractéristiques exactes. Vous pouvez ouvrir un canal diplomatique direct avec n'importe quel pays pour négocier des traités, des accords commerciaux ou proférer des menaces.
- **Fil de Presse International (Press Wire)** : Présente les Unes sensationnelles de la presse internationale (The Global Herald, Le Monde Libre, Financial Times Echo, etc.) reflétant l'opinion publique mondiale sur vos actions.

---

## 8. Configuration Musicale & Dossier Audio

Nation Builder comprend un lecteur audio d'ambiance intégré et réactif.

### Emplacement des Fichiers
Placez vos pistes audio dans le dossier **`public/audio/`** à la racine du projet :
```
Chat/
├── audio/
│   └── README.md
├── public/
│   └── audio/
│       ├── theme.mp3       ← Piste musicale principale (ambiance mondiale)
│       └── .gitkeep
```

### Formats Supportés
- `.mp3` (recommandé, 128 à 192 kbps)
- `.ogg`, `.wav`, `.webm`

### Activation dans le Jeu
1. Ouvrez le panneau **Paramètres** (icône ⚙️ sur la page d'accueil ou en haut de la page Monde).
2. Activez le toggle **Musique d'ambiance**.
3. Réglez le volume sonore souhaité à l'aide du curseur.

*(Des banques de musiques libres de droits sont répertoriées dans `audio/README.md` : Pixabay Music, Free Music Archive, Incompetech, OpenGameArt).*
Le réglage de lecture, le volume et la position du morceau sont conservés localement et repris avec une sauvegarde cloud.

---

## 9. Sauvegardes Locales & Cloud (Supabase)

Nation Builder prend en charge deux systèmes de persistance :
- **Sauvegarde locale** : l'état de partie est enregistré dans le `localStorage` du navigateur.
- **Sauvegarde cloud (Supabase)** : le JSONB contient le pays, le roster, le calendrier, les projets, les événements, les relations, les historiques diplomatiques et les préférences audio. La modale estime la taille JSON avant l'envoi; un roster de base d'environ 97 pays représente près de 40 Ko avant historique.
- **Mise à jour** : une partie conserve le même identifiant lors de chaque sauvegarde et remplace sa sauvegarde cloud précédente. Une nouvelle partie reçoit un nouvel identifiant.
- **Confidentialité cloud** : les sauvegardes sont rattachées à une session invitée Supabase et protégées par `owner_id`/RLS. Dans le tableau de bord Supabase, activez **Authentication → Providers → Anonymous Sign-Ins**, puis exécutez le nouveau `supabase_schema.sql`. Le plan gratuit inclut actuellement 50 000 utilisateurs actifs mensuels; ses projets peuvent être mis en pause après une semaine d'inactivité.
- **Limite des sessions invitées** : elles sont persistées dans ce navigateur mais ne sont pas récupérables après effacement des données ou sur un autre appareil. Pour une identité récupérable, ajoutez OAuth ou un SMTP personnalisé; le SMTP d'essai Supabase est limité aux adresses de l'équipe et à 2 messages par heure.
- **Anciennes sauvegardes publiques** : les lignes créées avant l'ajout de `owner_id` restent en base mais ne sont plus accessibles aux clients, car aucun propriétaire fiable ne peut leur être attribué automatiquement. Migrez-les manuellement via le SQL Editor si elles doivent être conservées.

**Important :** Supabase Auth et les règles RLS protègent l'accès aux sauvegardes. La clé `anon` du client reste publique par conception; n'ajoutez jamais une clé `service_role` au navigateur.

---

## 10. Architecture Technique & Modèles Groq IA

- **Framework** : React 18, Vite 8, Tailwind CSS, Zustand avec middleware `persist`.
- **Animations & Graphismes** : Framer Motion, Lucide React Icons.
- **Moteur IA Groq LPU** : Système de basculement dynamique (*fallback loop*) testant automatiquement les modèles les plus performants disponibles sur votre compte :
  1. `openai/gpt-oss-120b` (Modèle phare 120 milliards de paramètres)
  2. `qwen/qwen3.8-27b` (Haute vélocité & précision macroéconomique)
  3. `openai/gpt-oss-20b` (Modèle instantané de secours)
- **Prompt Sans Limite** : Le moteur intègre la directive de narration sans restriction arbitraire ni censure sur les drames géopolitiques fictifs.

### Configuration de l'IA

La clé Groq est utilisée uniquement côté serveur par `/api/groq`. Configurez `GROQ_API_KEY` dans l'environnement Vercel; en local, placez-la dans `.env.local` (sans préfixe `VITE_`). Ne publiez jamais cette clé et révoquez toute clé qui aurait déjà été ajoutée à un bundle ou à un dépôt. Le proxy local de Vite utilise la même variable.

---

*Nation Builder v2.0 — Forgez votre nation. Façonnez le monde.*
