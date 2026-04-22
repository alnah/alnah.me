---
name: wording-pass
description: Améliorer la formulation dans les fichiers Markdown explicitement mentionnés avec une passe de style extrêmement conservatrice, en créant d’abord une sauvegarde `.bak` fraîche avec une commande shell simple. À utiliser quand la clarté demande de petites corrections sans réécrire la voix, le sens ni la structure.
---

# Passe de formulation (très conservatrice)

1. Travailler uniquement sur les fichiers Markdown explicitement nommés par l’utilisateur.
2. Avant de modifier chaque fichier, créer une sauvegarde fraîche :
   - `cp -f -- "file.md" "file.md.bak"`
3. Appliquer uniquement des corrections minimales de formulation :
   - clarifier une tournure maladroite seulement si nécessaire
   - réduire une répétition évidente seulement si elle nuit à la lisibilité
   - garder des modifications aussi petites que possible
4. Être très conservateur :
   - préserver la voix et le rythme de l’auteur
   - garder les idées, le ton et le périmètre inchangés
   - conserver le frontmatter, les titres, liens, blocs de code, listes et la structure intacts
   - ne pas ajouter ni supprimer de section
5. Corriger la grammaire ou la ponctuation seulement si nécessaire pour garder la modification propre.
6. Une fois terminé, indiquer :
   - les fichiers modifiés
   - la confirmation que les fichiers `.bak` ont été créés
   - un bref résumé des changements de formulation significatifs

## Garde-fous

- Ne pas modifier des fichiers seulement suggérés par le contexte.
- Ne pas modifier des fichiers générés par les outils de build (par exemple `dist/`, `.astro/`, `public/raw/`).
- S’arrêter et le signaler si un fichier n’est pas du Markdown.
