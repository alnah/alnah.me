---
title: À propos
description: Alexis Nahan - Développeur Go, apprenant perpétuel
date: '2026-01-14'
aliases:
  - a-propos
  - contact
menu:
  main:
    weight: -95
    params:
      icon: user
---

Je développe des systèmes backend et des outils CLI en Go, documentant mon parcours au fil de mon apprentissage.

## Parcours d'apprentissage

J'ai touché à Python 2 il y a plusieurs années, puis j'ai quitté la programmation. En 2024, je suis revenu via [Automate the Boring Stuff with Python](https://automatetheboringstuff.com/), [CS50](https://cs50.harvard.edu/x/), et [The Odin Project](https://www.theodinproject.com/). En 2025, j'ai terminé le parcours backend de [Boot.dev](https://www.boot.dev/) et j'ai commencé à construire en Go.

Livres qui ont façonné mon approche :

- [Learning Go](https://www.oreilly.com/library/view/learning-go-2nd/9781098139285/) de Jon Bodner
- [Learn Go with Tests](https://quii.gitbook.io/learn-go-with-tests) de Chris James
- [Dive Into Design Patterns](https://refactoring.guru/design-patterns/book) d'Alexander Shvets
- [A Philosophy of Software Design](https://web.stanford.edu/~ouster/cgi-bin/book.php) de John Ousterhout

## Projets actuels

[go-md2pdf](https://github.com/alnah/go-md2pdf) : un outil CLI qui convertit du Markdown en PDF. Construit avec un worker pool concurrent, une couverture de tests complète, et 8 thèmes CSS personnalisables.

Je travaille aussi sur un projet EdTech personnel.

## Contexte

Trilingue français, anglais et portugais. J'ai enseigné le français pendant des années : décomposer des règles complexes en étapes claires, comprendre pourquoi un apprenant bloque, adapter la méthode à sa façon de penser.

Aujourd'hui je construis des systèmes et outils en Go avec la même approche : structurer le code pour qu'il soit lisible, diagnostiquer ce qui coince, livrer des solutions propres plutôt que des prototypes qui marchent, concevoir pour les contraintes réelles, traquer les anti-patterns.

## Ce que j'écris ici

Ce blog traite du développement Go sous un angle pratique :

- Patterns de concurrence qui fonctionnent en production
- Stratégies de test au-delà des bases
- Conception et distribution d'outils CLI
- Leçons tirées de vrais projets

Pas de blabla, pas de hype. Juste ce que j'apprends en construisant.

## Contact

Freelancer, disponible pour des projets backend remote.

<form class="contact-form" action="https://formspree.io/f/meeeoaad" method="POST">
  <div class="form-group">
    <label for="name">Nom</label>
    <input type="text" id="name" name="name" required placeholder="Votre nom">
  </div>
  <div class="form-group">
    <label for="email">Email</label>
    <input type="email" id="email" name="email" required placeholder="votre@email.com">
  </div>
  <div class="form-group">
    <label for="message">Message</label>
    <textarea id="message" name="message" required placeholder="Votre message..."></textarea>
  </div>
  <input type="text" name="_gotcha" class="hp-field" tabindex="-1" autocomplete="off">
  <button type="submit">Envoyer</button>
</form>
