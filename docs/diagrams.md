# Diagrams

Write diagrams as `mermaid` fenced code blocks. Every diagram must carry an
`accTitle` (short name) and an `accDescr` (long description), because Mermaid
turns them into the SVG accessible name and description. `prepare-static`
fails the build when either is missing, with the file and line.

````md
```mermaid
flowchart TD
  accTitle: Parcours de connexion
  accDescr: Le visiteur clique sur connexion, passe par OAuth, puis le jeton est validé.
  A[Visiteur] --> B{Compte ?}
```
````

`accDescr` can span several lines with braces:

````md
```mermaid
sequenceDiagram
  accTitle: Échange client serveur
  accDescr {
    Le client envoie une requête.
    Le serveur répond avec un jeton.
  }
  Client->>Serveur: Requête
```
````

Describe the diagram in the surrounding text. See the
[WAI Complex Images tutorial](https://www.w3.org/WAI/tutorials/images/complex/).

Copies and exports are attributed: title, author, blog, date, CC BY 4.0.

Keep `mermaid` in `markdown.syntaxHighlight.excludeLangs` in
`astro.config.mjs`.
