# SELECT

Plateforme de rencontres pensée pour le **Mali et sa diaspora**. Ce dépôt
contient la **maquette de démonstration** : une vitrine publique et un
prototype interactif de l'application, entièrement fonctionnels côté
navigateur.

## Contenu

| Fichier | Rôle |
| --- | --- |
| `index.html` | Site vitrine : positionnement, découverte hybride, confiance, formules, FAQ |
| `app.html` | Démonstration interactive de l'application |
| `assets/css/base.css` | Jetons de design (couleurs, typographie, boutons, badges) |
| `assets/css/landing.css` | Mise en page de la vitrine |
| `assets/css/app.css` | Interface de l'application |
| `assets/js/data.js` | Jeu de données fictif (20 profils, conversations) |
| `assets/js/app.js` | Logique de la démonstration |
| `assets/js/portrait.js` | Générateur de portraits de substitution |

Aucune dépendance, aucun outil de construction : il suffit d'ouvrir
`index.html` dans un navigateur. Pour un test au plus proche du réel :

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

## Cadrage retenu

- **Public** : 18–45 ans, Mali et diaspora, milieu urbain.
- **Objectifs** : mariage, relation sérieuse, faire connaissance.
- **Périmètre** : rencontres femme-homme.
- **Langue** : français au lancement ; bambara envisagé ensuite.
- **Modèle économique** : gratuit à l'usage, options payantes
  (Premium 5 000 FCFA/mois, Prestige 12 000 FCFA/mois, options ponctuelles),
  publicité volontairement écartée à ce stade pour préserver le positionnement.

## Ce que la démonstration couvre

1. **Inscription guidée** en six étapes : identité, genre, intention,
   valeurs, photos, vérification.
2. **Vérification simulée** : selfie analysé, badge doré activé.
3. **Découverte hybride**
   - *Choix SELECT* : sélection quotidienne avec score d'affinité et raison
     explicite du rapprochement ;
   - *Explorer* : pile de cartes avec geste de glissement, passer, aimer,
     coup de cœur, retour en arrière (réservé au Premium).
4. **Fiche profil** détaillée : affinité expliquée, intention, valeurs,
   langues, mention diaspora.
5. **Matchs et messagerie** : conversation ouverte uniquement sur intérêt
   réciproque, réponses automatiques pour illustrer l'échange.
6. **Admirateurs** floutés, déverrouillés par le Premium.
7. **Formules et paiement** : Orange Money, Moov Money, Wave, carte.
8. **Filtres** : âge, ville, intention, profils vérifiés, diaspora.
9. **Réglages de discrétion** : photos floutées, mode discret, alerte
   capture d'écran.

L'état est conservé dans `localStorage`. Le bouton **Recommencer** remet la
démonstration à zéro.

## Direction artistique

Ivoire chaud, noir profond, or mat et bordeaux. Typographie éditoriale à
empattements pour les titres, sans-serif système pour l'interface. Interfaces
très aérées, animations discrètes, respect de `prefers-reduced-motion`.

## Portraits

La maquette n'utilise **aucune photo de personne réelle**. Chaque profil est
représenté par une composition générée (dégradé, motif inspiré du bogolan,
monogramme) au format 4/5. En production, `assets/js/portrait.js` est remplacé
par les photos vérifiées des membres, au même format.

## Limites connues

- Profils, messages, scores d'affinité et statistiques sont **fictifs**.
- Aucun serveur, aucune authentification, aucun paiement réel.
- Le score d'affinité est une valeur figée par profil : la logique de
  correspondance reste à construire.

## Suites possibles

- Back-end (comptes, modération, vérification réelle, messagerie temps réel).
- Moteur d'affinité s'appuyant sur intentions, valeurs, localisation et
  activité.
- Intégration des paiements mobiles.
- Application mobile et version bambara.
