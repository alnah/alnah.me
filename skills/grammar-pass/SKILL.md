---
name: grammar-pass
description: Corriger la grammaire, l’orthographe, la ponctuation et les petites erreurs de syntaxe dans les fichiers Markdown explicitement mentionnés, en créant d’abord une sauvegarde `.bak` fraîche avec une commande shell simple. À utiliser pour une passe stricte de correction qui préserve le sens, le style et la structure.
---

# Passe de grammaire (simple)

1. Travailler uniquement sur les fichiers Markdown explicitement nommés par l’utilisateur.
2. Avant de modifier chaque fichier, créer une sauvegarde fraîche :
   - `cp -f -- "file.md" "file.md.bak"`
3. Corriger toutes les erreurs de langue :
   - grammaire
   - orthographe
   - ponctuation
   - petites erreurs de syntaxe
4. Garder le texte stable :
   - préserver autant que possible le sens, le ton et les choix de formulation
   - conserver les clés et valeurs du frontmatter inchangées, sauf demande explicite
   - garder les titres, liens, blocs de code, listes et la structure du document intacts
5. Ne pas transformer cela en réécriture de style ou de formulation.
6. Une fois terminé, indiquer :
   - les fichiers modifiés
   - la confirmation que les fichiers `.bak` ont été créés
   - un bref résumé des corrections importantes

## Garde-fous

- Ne pas modifier des fichiers seulement suggérés par le contexte.
- Ne pas modifier des fichiers générés par les outils de build (par exemple `dist/`, `.astro/`, `public/raw/`).
- S’arrêter et le signaler si un fichier n’est pas du Markdown.
