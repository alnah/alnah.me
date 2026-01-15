---
title: 'Structure de projet Go : ce qui fonctionne vraiment'
description: "Patterns pratiques pour structurer vos projets Go : bibliothèque, CLI, serveur et layouts combinés basés sur des projets réels, pas sur le 'standard' non officiel."
date: 2026-01-14
lastmod: 2026-01-14
draft: false
image: cover.jpg
categories:
  - Best Practices
tags:
  - project-structure
  - modules
  - tooling
  - cli
  - api
---

L'équipe Go recommande explicitement la simplicité plutôt que la structure. [Russ Cox](https://github.com/golang-standards/project-layout/issues/117), le responsable technique de Go, a publiquement critiqué le célèbre dépôt [golang-standards/project-layout](https://github.com/golang-standards/project-layout) (54k+ stars), déclarant qu'il « n'est pas un standard Go » et que « les dépôts Go tendent à être bien plus simples ».

Le minimum officiel : une LICENSE, un go.mod, et du code Go organisé comme bon vous semble. Ce guide propose des recommandations pour quatre types de projets, basées sur des patterns de projets en production.

## La seule règle qui compte

Go impose exactement une règle structurelle : les packages dans `internal/` ne peuvent pas être importés depuis l'extérieur du module. C'est imposé par le compilateur, pas par convention.

La documentation officielle sur [go.dev/doc/modules/layout](https://go.dev/doc/modules/layout) dit : commencez simple. Un `main.go` et un `go.mod` suffisent pour les petits projets. Ajoutez de la structure quand vous en avez besoin, pas avant.

## Quatre patterns qui fonctionnent

### Bibliothèque uniquement

Pour les projets destinés à être importés par d'autres. Placez le code exportable à la racine du dépôt pour des chemins d'import propres.

```text
mylib/
├── go.mod
├── mylib.go            # API principale
├── option.go           # Options fonctionnelles
├── types.go            # Types publics
└── internal/           # Implémentation privée
    └── parse/
```

Les utilisateurs importent directement :

```go
import "github.com/user/mylib"

client := mylib.New(mylib.WithTimeout(5 * time.Second))
```

Exemples : [Cobra](https://github.com/spf13/cobra), [Viper](https://github.com/spf13/viper), [goldmark](https://github.com/yuin/goldmark).

### CLI uniquement

Pour les outils qui ne sont pas destinés à être importés comme bibliothèques. Tout mettre dans `internal/` signale que c'est une application, pas une bibliothèque.

```text
mytool/
├── go.mod
├── main.go
├── internal/
│   ├── cmd/            # Implémentations des commandes
│   ├── config/         # Configuration
│   └── core/           # Logique métier
└── testdata/
```

[Terraform](https://github.com/hashicorp/terraform) utilise cette approche : 100% de l'implémentation vit dans `internal/`, signalant explicitement qu'aucune API Go stable n'existe.

Pour plusieurs binaires liés, utilisez `cmd/` :

```text
mytools/
├── go.mod
├── cmd/
│   ├── tool1/
│   │   └── main.go
│   └── tool2/
│       └── main.go
└── internal/
    └── shared/
```

### Serveur uniquement

Pour les serveurs HTTP/gRPC non destinés à être importés. Organisez par domaine, pas par couche technique.

```text
myserver/
├── go.mod
├── main.go
├── routes.go           # Tous les mappings d'endpoints
└── internal/
    ├── handlers/
    ├── middleware/
    └── storage/
```

[Prometheus](https://github.com/prometheus/prometheus) démontre l'organisation par domaine avec des répertoires de premier niveau comme `promql/`, `tsdb/`, et `scrape/` plutôt que `controllers/`, `models/`, `services/`.

Les patterns de layout serveur méritent leur propre article. Le principe clé : gardez les routes découvrables en un seul endroit, passez les dépendances explicitement.

### Bibliothèque + CLI (+ serveur)

Pour les projets offrant à la fois une bibliothèque et des outils en ligne de commande. Le CLI est une fine couche autour de la bibliothèque.

```text
myproject/
├── go.mod
├── service.go          # API publique
├── types.go            # Types publics
├── internal/
│   ├── config/         # Parsing de config
│   └── transform/      # Conversion de données
└── cmd/
    └── mytool/         # Binaire CLI
        └── main.go
```

Les utilisateurs peuvent :

```bash
# Importer la bibliothèque
go get github.com/user/myproject

# Installer le CLI
go install github.com/user/myproject/cmd/mytool@latest
```

[Helm](https://github.com/helm/helm) documente explicitement cette frontière : « le code dans cmd/ n'est pas conçu pour être réutilisé comme bibliothèque ».

Exemples : [Hugo](https://github.com/gohugoio/hugo), [Prometheus](https://github.com/prometheus/prometheus).

## Le débat pkg/

L'équipe Go ne recommande pas `pkg/`. Cela ajoute un segment de chemin sans bénéfice sémantique :

```go
// Avec pkg/
import "github.com/user/project/pkg/client"

// Sans pkg/
import "github.com/user/project/client"
```

[Brad Fitzpatrick](https://github.com/golang-standards/project-layout/issues/117#issuecomment-828503689) a confirmé que la bibliothèque standard a abandonné `pkg/` dans Go 1.4, pourtant la communauté l'a copié par cargo cult depuis les premiers projets comme Kubernetes.

### Arguments contre pkg/

- **Redondance** : tout code Go est déjà un « package »
- **Chemins d'import plus longs** : chaque import dans chaque fichier s'allonge
- **Aucun bénéfice pour l'outillage** : le compilateur le traite comme n'importe quel autre répertoire

### Arguments pour pkg/

- **Clarté visuelle** : quand votre racine contient Makefile, Dockerfile, docker-compose.yml, .github/, terraform/, et des configs CI, `pkg/` crée une séparation entre le code Go et la configuration
- **Signal explicite** : communique « ce code est conçu pour un usage externe »
- **Cohérence avec cmd/ et internal/** : certains arguent que `pkg/` à côté de `cmd/` est plus cohérent que de mélanger packages et points d'entrée

### Qui utilise pkg/ ?

| Utilise pkg/                                                                                                                                                                                                                                       | N'utilise pas pkg/                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Kubernetes](https://github.com/kubernetes/kubernetes), [Helm](https://github.com/helm/helm), [CockroachDB](https://github.com/cockroachdb/cockroach), [etcd](https://github.com/etcd-io/etcd), [InfluxDB](https://github.com/influxdata/influxdb) | [Prometheus](https://github.com/prometheus/prometheus), [Hugo](https://github.com/gohugoio/hugo), [Terraform](https://github.com/hashicorp/terraform), [Consul](https://github.com/hashicorp/consul), [Cobra](https://github.com/spf13/cobra) |

Le pattern : les projets qui ont adopté `pkg/` ont souvent été créés avant Go 1.4 (quand `internal/` a été introduit). Les projets plus récents l'évitent de plus en plus.

**Recommandation** : évitez `pkg/` pour les nouveaux projets sauf si vous avez beaucoup de fichiers non-Go à la racine ET voulez explicitement signaler la réutilisabilité comme bibliothèque.

## Quand internal/ apporte de la valeur

Contrairement à `pkg/`, le répertoire `internal/` bénéficie d'une application par le compilateur. Le code dans `internal/` ne peut être importé que par du code dans le même arbre de modules.

### Les arguments pour internal/

La [documentation officielle Go](https://go.dev/doc/modules/layout) le recommande : « il est recommandé de placer ces packages dans un répertoire nommé internal ; cela empêche d'autres modules de dépendre de packages que nous ne voulons pas nécessairement exposer ».

[Dave Cheney](https://dave.cheney.net/2019/10/06/use-internal-packages-to-reduce-your-public-api-surface) souligne la nature opt-in : « Vous pouvez promouvoir les packages internes plus tard si vous voulez vous engager à supporter cette API ; il suffit de les remonter d'un ou deux niveaux de répertoire. L'essentiel est que ce processus est opt-in ».

Bénéfices :

- Protection contre l'exposition accidentelle d'API
- Liberté de refactorer sans casser les utilisateurs externes
- Frontière claire entre contrat public et implémentation

### Le contre-argument

[Laurent Demailly](https://laurentsv.com/blog/2024/10/19/no-nonsense-go-package-layout.html) argue que la plupart des projets n'ont pas besoin d'`internal/` : « n'utilisez pas internal/ sauf si vous livrez à de nombreux utilisateurs tiers avec beaucoup de code partagé ».

Son alternative : utilisez le semver 0.x pour la flexibilité et documentez clairement les changements, « plutôt que de sous-publier et forcer les gens à forker pour accéder à ce dont ils ont vraiment besoin ».

C'est valide pour les applications et les petites bibliothèques. Mais pour les bibliothèques avec une adoption significative, `internal/` évite la douleur de maintenir des APIs que vous n'avez jamais eu l'intention de supporter.

### La vraie question

La décision n'est pas seulement « les utilisateurs externes devraient-ils importer ceci ? » mais « suis-je prêt à maintenir la stabilité de l'API pour ce code ? »

Chaque package en dehors d'`internal/` porte implicitement des attentes de stabilité. Si vous prévoyez de refactorer fréquemment, utilisez `internal/` que l'import externe soit probable ou non.

## Quand créer un package

Créez un package quand :

- Plusieurs fichiers partagent une responsabilité distincte
- Le code a ses propres types et fonctions qui forment une unité cohésive
- Vous voulez contrôler la visibilité aux frontières du package

Ne créez pas de package pour :

- Un seul fichier avec quelques fonctions helper
- De l'« organisation » sans bénéfice fonctionnel
- Copier la structure d'un projet externe

La taille du fichier n'est pas le bon critère : c'est la cohésion et la testabilité qui comptent. Un fichier de 150 lignes mélangeant trois responsabilités distinctes est pire qu'un package bien structuré. La question n'est pas « combien de lignes fait ce fichier ? » mais « puis-je décrire ce que fait ce fichier en une phrase ? »

Un package `utils/` avec trois fonctions non liées, c'est de la sur-ingénierie. Mais un fichier unique qui vous force à comprendre l'authentification, le cache et le logging pour modifier l'un d'entre eux, c'est pareil.

## Le processus de décision

Quand vous ajoutez du code :

| Question                                              | Oui                                                           | Non                             |
| ----------------------------------------------------- | ------------------------------------------------------------- | ------------------------------- |
| Les utilisateurs externes doivent-ils importer ceci ? | Racine ou `pkg/`                                              | `internal/`                     |
| Suis-je prêt à maintenir la stabilité de l'API ?      | Racine ou `pkg/`                                              | `internal/`                     |
| Est-ce spécifique au CLI/serveur ?                    | `cmd/appname/` ou `internal/`                                 | Code bibliothèque               |
| Cela nécessite-t-il son propre package ?              | Seulement si plusieurs fichiers avec responsabilité distincte | Garder dans le package existant |

## Organisation des fichiers à la racine

Pour les projets bibliothèque, découpez par responsabilité :

```text
mylib/
├── client.go           # Type Client et méthodes
├── option.go           # Options fonctionnelles
├── types.go            # Types publics
├── errors.go           # Erreurs sentinelles
├── request.go          # Construction de requêtes
├── response.go         # Parsing de réponses
└── mylib_test.go       # Tests
```

Chaque fichier a une seule responsabilité. Vous cherchez les définitions d'erreurs ? Regardez `errors.go`. La configuration ? Regardez `option.go`.

Évitez :

- `util.go` (nommez-le selon ce qu'il fait)
- `helpers.go` (même problème)
- `misc.go` (là où le code va mourir)

## Organisation des tests

Go offre deux approches de test avec des compromis différents :

### Tests dans le même package (`foo_test.go`)

```go
package mylib

func TestParseInternal(t *testing.T) {
    // Peut accéder aux fonctions et types non exportés
    result := parse("input")
}
```

À utiliser quand vous devez tester des fonctions non exportées ou un état interne. Le risque : les tests couplés aux détails d'implémentation cassent pendant le refactoring.

### Tests dans un package séparé (package `foo_test`)

```go
package mylib_test

import "github.com/user/mylib"

func TestParsePublic(t *testing.T) {
    // Seule l'API publique est disponible
    result := mylib.Parse("input")
}
```

À utiliser pour tester votre API publique en boîte noire. Ces tests documentent comment les utilisateurs externes interagissent avec votre code et survivent au refactoring interne.

**En pratique, combinez les deux approches** :

- Package `_test` pour les tests d'intégration de votre API publique : ils servent de documentation vivante et vous forcent à concevoir une interface utilisable
- Tests dans le même package pour des tests unitaires ciblés sur de la logique interne complexe (parsing, machines à états, règles de validation)

```text
mylib/
├── parser.go
├── parser_test.go          # package mylib – teste parse() interne
├── mylib_test.go           # package mylib_test – teste l'API publique
└── transform/
    ├── transform.go
    └── transform_test.go   # package transform – tests de machine à états complexe
```

Les tests en package `_test` détectent tôt les problèmes de conception d'API : si votre test est pénible à écrire, vos utilisateurs auront les mêmes difficultés.

### Fixtures de test avec testdata/

Le répertoire `testdata/` est ignoré par la toolchain Go et contient conventionnellement les fixtures de test :

```text
mylib/
├── parser.go
├── parser_test.go
└── testdata/
    ├── valid_input.json
    ├── malformed.json
    └── golden/
        └── expected_output.json
```

Accédez aux fixtures avec des chemins relatifs depuis les tests :

```go
data, err := os.ReadFile("testdata/valid_input.json")
```

Pour les tests golden file (comparaison de la sortie avec des fichiers attendus), la convention `testdata/golden/` aide à distinguer les fixtures d'entrée des sorties attendues.

## Exemples réels

| Projet                                                 | Structure                 | Bibliothèque importable ? | Utilise pkg/ ? |
| ------------------------------------------------------ | ------------------------- | ------------------------- | -------------- |
| [Cobra](https://github.com/spf13/cobra)                | Package racine            | Oui                       | Non            |
| [Helm](https://github.com/helm/helm)                   | `pkg/` + `cmd/`           | Oui                       | Oui            |
| [Hugo](https://github.com/gohugoio/hugo)               | Racine + packages domaine | Oui                       | Non            |
| [Prometheus](https://github.com/prometheus/prometheus) | Packages domaine          | Oui                       | Non            |
| [Terraform](https://github.com/hashicorp/terraform)    | Tout dans `internal/`     | Non                       | Non            |
| [Kubernetes](https://github.com/kubernetes/kubernetes) | `pkg/` + `cmd/`           | Oui                       | Oui            |

## Erreurs courantes

- **Sur-structurer trop tôt** : commencer avec `pkg/`, `internal/`, `cmd/`, `api/`, `web/` pour un projet de 500 lignes. Commencez à plat, ajoutez de la structure quand la douleur apparaît.
- **Copier golang-standards/project-layout** : ce dépôt n'est pas approuvé par l'équipe Go. Il promeut des patterns que la plupart des projets Go n'utilisent pas.
- **Packages vides pour « usage futur »** : si un package a un fichier avec deux fonctions, ce n'est pas un package. C'est un fichier.
- **Rejeter internal/ pour les petits projets** : l'argument « pas d'utilisateurs externes = pas besoin d'internal/ » confond deux usages distincts. Certes, la protection d'import imposée par le compilateur est inutile en solo. Mais `internal/` sert aussi de documentation architecturale : un signal pour votre futur vous sur ce qui était prévu comme API stable versus implémentation jetable. Quand vous revenez sur votre code six mois plus tard, cette frontière explicite aide à comprendre ce qui peut être refactoré sans risque versus ce qui pourrait avoir des dépendants. Même sur des projets personnels, `internal/` peut être une documentation précieuse.
- **Éviter pkg/ aveuglément** : si votre racine est encombrée de configs et que vous construisez une bibliothèque, `pkg/` pourrait améliorer la clarté. Évaluez, ne rejetez pas dogmatiquement.

## Résumé

- **Commencez simple** : `main.go` + `go.mod` est valide
- **Code bibliothèque à la racine** : chemins d'import propres
- **CLI/serveur dans cmd/** ou main.go : fine couche autour de la bibliothèque
- **Code privé dans internal/** : quand vous avez besoin de confidentialité imposée par le compilateur
- **pkg/ est optionnel** : évitez-le sauf raison spécifique
- **Un seul module** : évitez la complexité multi-module (sujet pour un autre article)

La meilleure structure est celle à laquelle vous ne pensez pas. Si vous passez du temps sur la structure plutôt que sur le code, vous sur-ingéniez.
