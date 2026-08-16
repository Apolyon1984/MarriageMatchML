/* SELECT — jeu de données de démonstration.
   Tous les profils, messages et statistiques ci-dessous sont fictifs et
   servent uniquement à illustrer le parcours. */

window.SELECT_DATA = (function () {
  "use strict";

  var INTENTIONS = [
    { id: "mariage", label: "Mariage", desc: "Je cherche à me marier" },
    {
      id: "serieux",
      label: "Relation sérieuse",
      desc: "Une histoire durable, sans précipitation"
    },
    {
      id: "connaissance",
      label: "Faire connaissance",
      desc: "Rencontrer, échanger, voir où cela mène"
    }
  ];

  var VALUES = [
    "Famille",
    "Foi",
    "Ambition",
    "Honnêteté",
    "Humour",
    "Éducation",
    "Voyages",
    "Cuisine",
    "Sport",
    "Musique",
    "Entrepreneuriat",
    "Bienveillance"
  ];

  var CITIES = [
    "Bamako",
    "Sikasso",
    "Ségou",
    "Mopti",
    "Kayes",
    "Abidjan",
    "Dakar",
    "Paris",
    "Montréal",
    "New York",
    "Dubaï"
  ];

  var women = [
    {
      id: "w1",
      name: "Aminata",
      age: 27,
      city: "Bamako",
      area: "ACI 2000",
      job: "Architecte",
      intention: "mariage",
      verified: true,
      score: 92,
      languages: ["Français", "Bambara", "Anglais"],
      tags: ["Famille", "Voyages", "Architecture"],
      bio:
        "Née à Ségou, installée à Bamako. J'aime les projets bien pensés, les longues discussions et le thé de fin de journée. Je cherche quelqu'un de posé, avec des intentions claires.",
      reasons: [
        "Vous cherchez tous les deux le mariage",
        "Même attachement à la famille",
        "À 8 minutes de votre quartier"
      ],
      active: "En ligne"
    },
    {
      id: "w2",
      name: "Fatoumata",
      age: 24,
      city: "Bamako",
      area: "Badalabougou",
      job: "Pharmacienne",
      intention: "serieux",
      verified: true,
      score: 88,
      languages: ["Français", "Bambara"],
      tags: ["Foi", "Lecture", "Cuisine"],
      bio:
        "Discrète mais pas timide. Je travaille beaucoup, je ris facilement, et je tiens à ce qu'on avance au bon rythme.",
      reasons: [
        "Valeurs communes : foi et famille",
        "Même tranche d'âge recherchée",
        "Répond en moyenne en 20 minutes"
      ],
      active: "Il y a 2 h"
    },
    {
      id: "w3",
      name: "Kadiatou",
      age: 31,
      city: "Paris",
      area: "12e",
      job: "Juriste",
      intention: "mariage",
      verified: true,
      score: 90,
      languages: ["Français", "Bambara", "Anglais"],
      tags: ["Diaspora", "Droit", "Famille"],
      bio:
        "Malienne de Paris, très attachée à Bamako où je rentre deux fois par an. Projet d'installation à moyen terme.",
      reasons: [
        "Ouverte à la distance, projet de retour au Mali",
        "Deux langues en commun",
        "Intentions identiques"
      ],
      active: "Il y a 1 j"
    },
    {
      id: "w4",
      name: "Oumou",
      age: 26,
      city: "Bamako",
      area: "Hamdallaye",
      job: "Enseignante",
      intention: "serieux",
      verified: false,
      score: 81,
      languages: ["Français", "Bambara"],
      tags: ["Éducation", "Musique", "Bienveillance"],
      bio:
        "Je crois beaucoup à la douceur et à la parole donnée. Passionnée de musique mandingue.",
      reasons: ["Centres d'intérêt proches", "Même ville", "Rythme de vie compatible"],
      active: "Il y a 3 h"
    },
    {
      id: "w5",
      name: "Djénéba",
      age: 29,
      city: "Ségou",
      area: "Centre",
      job: "Cheffe de projet",
      intention: "mariage",
      verified: true,
      score: 85,
      languages: ["Français", "Bambara"],
      tags: ["Ambition", "Famille", "Cuisine"],
      bio:
        "Organisée, franche, un peu têtue. Je cherche un partenaire, pas un spectateur.",
      reasons: ["Projet de vie compatible", "Même intention", "Profil vérifié"],
      active: "En ligne"
    },
    {
      id: "w6",
      name: "Rokia",
      age: 23,
      city: "Bamako",
      area: "Sotuba",
      job: "Étudiante en médecine",
      intention: "connaissance",
      verified: true,
      score: 76,
      languages: ["Français", "Anglais"],
      tags: ["Sport", "Humour", "Études"],
      bio:
        "Entre les gardes et les révisions, je garde du temps pour le rire et le basket.",
      reasons: ["Même quartier de sortie", "Humour en commun"],
      active: "Il y a 5 h"
    },
    {
      id: "w7",
      name: "Bintou",
      age: 34,
      city: "Montréal",
      area: "Villeray",
      job: "Infirmière",
      intention: "mariage",
      verified: true,
      score: 87,
      languages: ["Français", "Bambara", "Anglais"],
      tags: ["Diaspora", "Famille", "Foi"],
      bio:
        "Maman d'un garçon de 6 ans. Sérieuse dans mes démarches, chaleureuse dans la vie.",
      reasons: [
        "Ouverte à la distance",
        "Valeurs familiales très proches",
        "Intention affichée : mariage"
      ],
      active: "Il y a 1 j"
    },
    {
      id: "w8",
      name: "Assitan",
      age: 28,
      city: "Bamako",
      area: "Kalaban Coura",
      job: "Entrepreneuse",
      intention: "serieux",
      verified: true,
      score: 83,
      languages: ["Français", "Bambara"],
      tags: ["Entrepreneuriat", "Ambition", "Mode"],
      bio:
        "Je dirige un atelier de couture. Je cherche quelqu'un qui comprend qu'une femme puisse être occupée et disponible à la fois.",
      reasons: ["Deux entrepreneurs", "Même ville", "Rythme compatible"],
      active: "Il y a 30 min"
    },
    {
      id: "w9",
      name: "Mariam",
      age: 25,
      city: "Sikasso",
      area: "Centre",
      job: "Agronome",
      intention: "mariage",
      verified: false,
      score: 78,
      languages: ["Français", "Bambara"],
      tags: ["Nature", "Famille", "Calme"],
      bio: "La terre, la patience et les gens simples. Voilà ce qui me tient.",
      reasons: ["Intention identique", "Valeurs communes"],
      active: "Il y a 8 h"
    },
    {
      id: "w10",
      name: "Sira",
      age: 30,
      city: "Dakar",
      area: "Almadies",
      job: "Consultante",
      intention: "serieux",
      verified: true,
      score: 80,
      languages: ["Français", "Anglais", "Bambara"],
      tags: ["Voyages", "Ambition", "Musique"],
      bio:
        "Malienne basée à Dakar pour le travail. Bamako reste la maison.",
      reasons: ["Ouverte à la distance", "Trois langues en commun"],
      active: "Il y a 4 h"
    }
  ];

  var men = [
    {
      id: "m1",
      name: "Modibo",
      age: 31,
      city: "Paris",
      area: "15e",
      job: "Ingénieur",
      intention: "mariage",
      verified: true,
      score: 91,
      languages: ["Français", "Bambara", "Anglais"],
      tags: ["Diaspora", "Famille", "Sérieux"],
      bio:
        "Bamakois de naissance, ingénieur à Paris. Je rentre chaque année et j'envisage de m'installer définitivement d'ici trois ans.",
      reasons: [
        "Projet de retour au Mali",
        "Même intention : mariage",
        "Deux langues en commun"
      ],
      active: "En ligne"
    },
    {
      id: "m2",
      name: "Adama",
      age: 29,
      city: "Bamako",
      area: "ACI 2000",
      job: "Banquier",
      intention: "mariage",
      verified: true,
      score: 89,
      languages: ["Français", "Bambara"],
      tags: ["Ambition", "Famille", "Sport"],
      bio:
        "Structuré au travail, simple en dehors. Je crois qu'une belle histoire se construit avec du respect et de la constance.",
      reasons: [
        "Valeurs communes : famille et honnêteté",
        "À 10 minutes de chez vous",
        "Profil vérifié"
      ],
      active: "Il y a 1 h"
    },
    {
      id: "m3",
      name: "Ibrahim",
      age: 34,
      city: "Bamako",
      area: "Faladié",
      job: "Médecin",
      intention: "mariage",
      verified: true,
      score: 86,
      languages: ["Français", "Bambara", "Anglais"],
      tags: ["Foi", "Famille", "Lecture"],
      bio:
        "Le métier prend du temps, mais je sais aussi m'arrêter. Je cherche une compagne, pas une conquête.",
      reasons: ["Même intention", "Pratique religieuse proche", "Même ville"],
      active: "Il y a 3 h"
    },
    {
      id: "m4",
      name: "Boubacar",
      age: 27,
      city: "Bamako",
      area: "Magnambougou",
      job: "Développeur",
      intention: "serieux",
      verified: true,
      score: 84,
      languages: ["Français", "Bambara", "Anglais"],
      tags: ["Technologie", "Humour", "Musique"],
      bio:
        "Je code le jour, je joue du djembé le week-end. Curieux de tout, moqueur mais gentil.",
      reasons: ["Centres d'intérêt proches", "Même tranche d'âge"],
      active: "En ligne"
    },
    {
      id: "m5",
      name: "Cheick",
      age: 33,
      city: "Abidjan",
      area: "Cocody",
      job: "Commerçant",
      intention: "serieux",
      verified: false,
      score: 77,
      languages: ["Français", "Bambara"],
      tags: ["Entrepreneuriat", "Voyages", "Famille"],
      bio:
        "Entre Bamako et Abidjan pour les affaires. Franc, direct, fidèle en amitié.",
      reasons: ["Ouvert à la distance", "Valeurs proches"],
      active: "Il y a 6 h"
    },
    {
      id: "m6",
      name: "Souleymane",
      age: 26,
      city: "Ségou",
      area: "Pelengana",
      job: "Professeur",
      intention: "mariage",
      verified: true,
      score: 82,
      languages: ["Français", "Bambara"],
      tags: ["Éducation", "Calme", "Foi"],
      bio:
        "J'enseigne les mathématiques. J'aime les choses claires et les gens sincères.",
      reasons: ["Intention identique", "Valeurs communes : foi et éducation"],
      active: "Il y a 2 j"
    },
    {
      id: "m7",
      name: "Amadou",
      age: 30,
      city: "New York",
      area: "Harlem",
      job: "Comptable",
      intention: "mariage",
      verified: true,
      score: 85,
      languages: ["Français", "Anglais", "Bambara"],
      tags: ["Diaspora", "Famille", "Sport"],
      bio:
        "Dix ans aux États-Unis, la tête toujours à Bamako. Je souhaite fonder un foyer stable.",
      reasons: ["Ouvert à la distance", "Même intention", "Trois langues en commun"],
      active: "Il y a 12 h"
    },
    {
      id: "m8",
      name: "Seydou",
      age: 35,
      city: "Bamako",
      area: "Djélibougou",
      job: "Architecte d'intérieur",
      intention: "serieux",
      verified: true,
      score: 79,
      languages: ["Français", "Bambara"],
      tags: ["Art", "Cuisine", "Bienveillance"],
      bio:
        "Je dessine des maisons et je cuisine mal, mais avec conviction.",
      reasons: ["Humour en commun", "Même ville"],
      active: "Il y a 45 min"
    },
    {
      id: "m9",
      name: "Bakary",
      age: 28,
      city: "Kayes",
      area: "Centre",
      job: "Logisticien",
      intention: "connaissance",
      verified: false,
      score: 74,
      languages: ["Français", "Bambara"],
      tags: ["Voyages", "Sport", "Humour"],
      bio: "Toujours sur la route. Simple, ponctuel, bon vivant.",
      reasons: ["Centres d'intérêt proches"],
      active: "Il y a 1 j"
    },
    {
      id: "m10",
      name: "Oumar",
      age: 32,
      city: "Dubaï",
      area: "Deira",
      job: "Import-export",
      intention: "mariage",
      verified: true,
      score: 81,
      languages: ["Français", "Anglais", "Arabe"],
      tags: ["Entrepreneuriat", "Foi", "Famille"],
      bio:
        "Installé à Dubaï depuis six ans. Je cherche à construire quelque chose de sérieux, avec quelqu'un du pays.",
      reasons: ["Ouvert à la distance", "Intention affichée : mariage"],
      active: "Il y a 7 h"
    }
  ];

  /* Conversations pré-remplies pour illustrer la messagerie. */
  var threads = {
    w1: [
      { from: "them", text: "Bonsoir 🙂 Merci pour le coup de cœur, ça m'a fait sourire.", at: "18:42" },
      { from: "me", text: "Bonsoir Aminata ! Votre profil est très clair, ça change.", at: "18:47" },
      { from: "them", text: "C'est le but. Autant se dire les choses tout de suite.", at: "18:49" },
      { from: "them", text: "Vous êtes de Bamako depuis longtemps ?", at: "18:49" }
    ],
    m2: [
      { from: "them", text: "Bonjour ! J'ai vu qu'on partageait le même quartier.", at: "09:12" },
      { from: "me", text: "Bonjour Adama, oui, ACI 2000 c'est petit finalement 🙂", at: "09:30" },
      { from: "them", text: "Très petit. Un café un de ces jours, sans pression ?", at: "09:33" }
    ],
    w5: [
      { from: "them", text: "Bonjour, votre présentation m'a plu. Vous êtes de Ségou aussi ?", at: "Hier" },
      { from: "me", text: "Ma famille en vient. J'y retourne dès que je peux.", at: "Hier" }
    ],
    m1: [
      { from: "them", text: "Bonsoir, merci d'avoir accepté 🙏", at: "21:05" },
      { from: "them", text: "Je rentre à Bamako en décembre, si jamais.", at: "21:06" }
    ]
  };

  /* Réponses automatiques de la démonstration (rotation simple). */
  var replies = [
    "C'est noté 🙂 Et vous, votre semaine s'est bien passée ?",
    "J'aime bien votre façon de dire les choses.",
    "On pourrait en parler de vive voix un de ces jours, non ?",
    "Je suis assez d'accord avec vous.",
    "Ma famille dirait la même chose 😄",
    "Dites-m'en un peu plus, ça m'intéresse."
  ];

  return {
    intentions: INTENTIONS,
    values: VALUES,
    cities: CITIES,
    women: women,
    men: men,
    threads: threads,
    replies: replies
  };
})();
