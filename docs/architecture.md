# Architecture du moteur

## Principe d'autorité

L'IA propose un récit et des conséquences. Le moteur JavaScript reste la seule autorité sur les statistiques, les dates, les identifiants de pays et les limites de variation.

`src/ai/schemas.js` définit les contrats Zod. `src/engine/turnEngine.js` filtre, borne et applique les propositions. Une réponse invalide est relancée une fois puis remplacée par le chemin local calme : elle ne peut pas corrompre une sauvegarde.

## Mémoire et récit

Le journal `newsFeed`, l'historique diplomatique et les projets persistés sont les faits canoniques. Les prochaines évolutions doivent construire un résumé compact des faits anciens et n'injecter que les faits liés au pays, au conflit et à la période demandée dans les prompts.

## Prompts et tests

Les prompts versionnés vivent dans `src/ai/prompts/`. Chaque changement de règle du moteur doit avoir un replay de test dans `src/engine/*.test.js` avant modification de l'interface.

## Données et licences

Avant toute redistribution de données géographiques ou de frontières historiques, ajouter leur source et leur licence dans `docs/`. Ne pas importer de contenu, visuels ou identité d'un autre jeu.
