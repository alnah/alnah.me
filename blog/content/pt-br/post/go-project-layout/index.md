---
title: "Estrutura de projeto Go: o que realmente funciona"
description: "Padrões práticos para estruturar projetos Go: biblioteca, CLI, servidor e layouts combinados baseados em projetos reais, não no 'padrão' não oficial."
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

A equipe Go recomenda explicitamente simplicidade em vez de estrutura. [Russ Cox](https://github.com/golang-standards/project-layout/issues/117), líder técnico do Go, criticou publicamente o popular repositório [golang-standards/project-layout](https://github.com/golang-standards/project-layout) (54k+ stars), afirmando que "não é um padrão Go" e que "repositórios Go tendem a ser muito mais simples."

O mínimo oficial: uma LICENSE, um go.mod e código Go organizado como você preferir. Este guia fornece recomendações para quatro tipos de projetos, baseadas em padrões de projetos em produção.

## A única regra que importa

Go impõe exatamente uma regra estrutural: pacotes em `internal/` não podem ser importados de fora do módulo. Isso é imposto pelo compilador, não por convenção.

A documentação oficial em [go.dev/doc/modules/layout](https://go.dev/doc/modules/layout) diz: comece simples. Um `main.go` e um `go.mod` são suficientes para projetos pequenos. Adicione estrutura quando precisar, não antes.

## Quatro padrões que funcionam

### Biblioteca apenas

Para projetos destinados a serem importados por outros. Coloque o código exportável na raiz do repositório para caminhos de import limpos.

```text
mylib/
├── go.mod
├── mylib.go            # API principal
├── option.go           # Opções funcionais
├── types.go            # Tipos públicos
└── internal/           # Implementação privada
    └── parse/
```

Usuários importam diretamente:

```go
import "github.com/user/mylib"

client := mylib.New(mylib.WithTimeout(5 * time.Second))
```

Exemplos: [Cobra](https://github.com/spf13/cobra), [Viper](https://github.com/spf13/viper), [goldmark](https://github.com/yuin/goldmark).

### CLI apenas

Para ferramentas não destinadas a serem importadas como bibliotecas. Colocar tudo em `internal/` sinaliza que é uma aplicação, não uma biblioteca.

```text
mytool/
├── go.mod
├── main.go
├── internal/
│   ├── cmd/            # Implementações de comandos
│   ├── config/         # Configuração
│   └── core/           # Lógica de negócio
└── testdata/
```

[Terraform](https://github.com/hashicorp/terraform) usa essa abordagem: 100% da implementação vive em `internal/`, sinalizando explicitamente que nenhuma API Go estável existe.

Para múltiplos binários relacionados, use `cmd/`:

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

### Servidor apenas

Para servidores HTTP/gRPC não destinados a serem importados. Organize por domínio, não por camada técnica.

```text
myserver/
├── go.mod
├── main.go
├── routes.go           # Todos os mapeamentos de endpoints
└── internal/
    ├── handlers/
    ├── middleware/
    └── storage/
```

[Prometheus](https://github.com/prometheus/prometheus) demonstra organização orientada a domínio com diretórios de primeiro nível como `promql/`, `tsdb/` e `scrape/` em vez de `controllers/`, `models/`, `services/`.

Padrões de layout de servidor merecem seu próprio artigo. O princípio chave: mantenha as rotas descobríveis em um único lugar, passe dependências explicitamente.

### Biblioteca + CLI (+ servidor)

Para projetos que oferecem tanto uma biblioteca quanto ferramentas de linha de comando. O CLI é uma camada fina em torno da biblioteca.

```text
myproject/
├── go.mod
├── service.go          # API pública
├── types.go            # Tipos públicos
├── internal/
│   ├── config/         # Parsing de config
│   └── transform/      # Conversão de dados
└── cmd/
    └── mytool/         # Binário CLI
        └── main.go
```

Usuários podem:

```bash
# Importar a biblioteca
go get github.com/user/myproject

# Instalar o CLI
go install github.com/user/myproject/cmd/mytool@latest
```

[Helm](https://github.com/helm/helm) documenta explicitamente essa fronteira: "código dentro de cmd/ não é projetado para reutilização como biblioteca."

Exemplos: [Hugo](https://github.com/gohugoio/hugo), [Prometheus](https://github.com/prometheus/prometheus).

## O debate pkg/

A equipe Go não recomenda `pkg/`. Isso adiciona um segmento de caminho sem benefício semântico:

```go
// Com pkg/
import "github.com/user/project/pkg/client"

// Sem pkg/
import "github.com/user/project/client"
```

[Brad Fitzpatrick](https://github.com/golang-standards/project-layout/issues/117#issuecomment-828503689) confirmou que a biblioteca padrão abandonou `pkg/` no Go 1.4, mas a comunidade copiou por cargo cult de projetos antigos como Kubernetes.

### Argumentos contra pkg/

- **Redundância**: todo código Go já é um "package"
- **Caminhos de import mais longos**: cada import em cada arquivo fica mais longo
- **Nenhum benefício para ferramentas**: o compilador trata como qualquer outro diretório

### Argumentos a favor de pkg/

- **Clareza visual**: quando sua raiz tem Makefile, Dockerfile, docker-compose.yml, .github/, terraform/ e configs de CI, `pkg/` cria separação entre código Go e configuração
- **Sinal explícito**: comunica "este código é projetado para uso externo"
- **Consistência com cmd/ e internal/**: alguns argumentam que `pkg/` ao lado de `cmd/` é mais consistente do que misturar pacotes com pontos de entrada

### Quem usa pkg/?

| Usa pkg/ | Não usa pkg/ |
| -------- | ------------ |
| [Kubernetes](https://github.com/kubernetes/kubernetes), [Helm](https://github.com/helm/helm), [CockroachDB](https://github.com/cockroachdb/cockroach), [etcd](https://github.com/etcd-io/etcd), [InfluxDB](https://github.com/influxdata/influxdb) | [Prometheus](https://github.com/prometheus/prometheus), [Hugo](https://github.com/gohugoio/hugo), [Terraform](https://github.com/hashicorp/terraform), [Consul](https://github.com/hashicorp/consul), [Cobra](https://github.com/spf13/cobra) |

O padrão: projetos que adotaram `pkg/` foram frequentemente criados antes do Go 1.4 (quando `internal/` foi introduzido). Projetos mais recentes cada vez mais o evitam.

**Recomendação**: evite `pkg/` para novos projetos a menos que você tenha muitos arquivos não-Go na raiz E queira sinalizar explicitamente reutilização como biblioteca.

## Quando internal/ agrega valor

Diferente de `pkg/`, o diretório `internal/` tem aplicação pelo compilador. Código em `internal/` só pode ser importado por código na mesma árvore de módulos.

### Os argumentos a favor de internal/

A [documentação oficial Go](https://go.dev/doc/modules/layout) recomenda: "é recomendado colocar tais pacotes em um diretório chamado internal; isso impede outros módulos de depender de pacotes que não necessariamente queremos expor."

[Dave Cheney](https://dave.cheney.net/2019/10/06/use-internal-packages-to-reduce-your-public-api-surface) enfatiza a natureza opt-in: "Você pode promover pacotes internos depois se quiser se comprometer a suportar essa API; basta movê-los um ou dois níveis de diretório acima. O essencial é que esse processo é opt-in."

Benefícios:

- Proteção contra exposição acidental de API
- Liberdade para refatorar sem quebrar usuários externos
- Fronteira clara entre contrato público e implementação

### O contra-argumento

[Laurent Demailly](https://laurentsv.com/blog/2024/10/19/no-nonsense-go-package-layout.html) argumenta que a maioria dos projetos não precisa de `internal/`: "não use internal/ a menos que você esteja entregando para muitos usuários terceiros com muito código compartilhado."

Sua alternativa: use semver 0.x para flexibilidade e documente mudanças claramente, "em vez de sub-publicar e forçar pessoas a fazer fork para acessar o que realmente precisam."

Isso é válido para aplicações e bibliotecas pequenas. Mas para bibliotecas com adoção significativa, `internal/` evita a dor de manter APIs que você nunca pretendeu suportar.

### A verdadeira questão

A decisão não é apenas "usuários externos devem importar isso?" mas "estou disposto a manter estabilidade de API para este código?"

Cada pacote fora de `internal/` carrega implicitamente expectativas de estabilidade. Se você espera refatorar frequentemente, use `internal/` independentemente de import externo ser provável ou não.

## Quando criar um pacote

Crie um pacote quando:

- Múltiplos arquivos compartilham uma responsabilidade distinta
- O código tem seus próprios tipos e funções que formam uma unidade coesa
- Você quer controlar visibilidade nas fronteiras do pacote

Não crie um pacote para:

- Um único arquivo com algumas funções helper
- "Organização" sem benefício funcional
- Copiar a estrutura de um projeto externo

O tamanho do arquivo não é o critério certo: coesão e testabilidade são. Um arquivo de 150 linhas misturando três responsabilidades distintas é pior que um pacote bem estruturado. A pergunta não é "quantas linhas tem este arquivo?" mas "consigo descrever o que este arquivo faz em uma frase?"

Um pacote `utils/` com três funções não relacionadas é over-engineering. Mas um arquivo único que força você a entender autenticação, cache e logging para modificar qualquer um deles também é.

## O processo de decisão

Ao adicionar código:

| Questão | Sim | Não |
| ------- | --- | --- |
| Usuários externos devem importar isso? | Raiz ou `pkg/` | `internal/` |
| Estou disposto a manter estabilidade de API? | Raiz ou `pkg/` | `internal/` |
| Isso é específico do CLI/servidor? | `cmd/appname/` ou `internal/` | Código de biblioteca |
| Isso precisa de seu próprio pacote? | Apenas se múltiplos arquivos com responsabilidade distinta | Manter no pacote existente |

## Organização de arquivos na raiz

Para projetos de biblioteca, divida por responsabilidade:

```text
mylib/
├── client.go           # Tipo Client e métodos
├── option.go           # Opções funcionais
├── types.go            # Tipos públicos
├── errors.go           # Erros sentinela
├── request.go          # Construção de requisições
├── response.go         # Parsing de respostas
└── mylib_test.go       # Testes
```

Cada arquivo tem uma única responsabilidade. Procurando definições de erro? Veja `errors.go`. Configuração? Veja `option.go`.

Evite:

- `util.go` (nomeie pelo que faz)
- `helpers.go` (mesmo problema)
- `misc.go` (onde código vai morrer)

## Organização de testes

Go oferece duas abordagens de teste com trade-offs diferentes:

### Testes no mesmo pacote (`foo_test.go`)

```go
package mylib

func TestParseInternal(t *testing.T) {
    // Pode acessar funções e tipos não exportados
    result := parse("input")
}
```

Use quando precisar testar funções não exportadas ou estado interno. O risco: testes acoplados a detalhes de implementação quebram durante refatoração.

### Testes em pacote separado (pacote `foo_test`)

```go
package mylib_test

import "github.com/user/mylib"

func TestParsePublic(t *testing.T) {
    // Apenas API pública disponível
    result := mylib.Parse("input")
}
```

Use para testes black-box da sua API pública. Esses testes documentam como usuários externos interagem com seu código e sobrevivem a refatorações internas.

**Na prática, combine ambas as abordagens**:

- Pacote `_test` para testes de integração da sua API pública: servem como documentação viva e forçam você a projetar uma interface usável
- Testes no mesmo pacote para testes unitários direcionados em lógica interna complexa (parsing, máquinas de estado, regras de validação)

```text
mylib/
├── parser.go
├── parser_test.go          # package mylib – testa parse() interno
├── mylib_test.go           # package mylib_test – testa API pública
└── transform/
    ├── transform.go
    └── transform_test.go   # package transform – testes de máquina de estados complexa
```

Os testes em pacote `_test` detectam problemas de design de API cedo: se seu teste é difícil de escrever, seus usuários terão as mesmas dificuldades.

### Fixtures de teste com testdata/

O diretório `testdata/` é ignorado pela toolchain Go e convencionalmente contém fixtures de teste:

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

Acesse fixtures com caminhos relativos nos testes:

```go
data, err := os.ReadFile("testdata/valid_input.json")
```

Para testes golden file (comparando saída com arquivos esperados), a convenção `testdata/golden/` ajuda a distinguir fixtures de entrada de saídas esperadas.

## Exemplos reais

| Projeto | Estrutura | Biblioteca importável? | Usa pkg/? |
| ------- | --------- | ---------------------- | --------- |
| [Cobra](https://github.com/spf13/cobra) | Pacote raiz | Sim | Não |
| [Helm](https://github.com/helm/helm) | `pkg/` + `cmd/` | Sim | Sim |
| [Hugo](https://github.com/gohugoio/hugo) | Raiz + pacotes de domínio | Sim | Não |
| [Prometheus](https://github.com/prometheus/prometheus) | Pacotes de domínio | Sim | Não |
| [Terraform](https://github.com/hashicorp/terraform) | Tudo em `internal/` | Não | Não |
| [Kubernetes](https://github.com/kubernetes/kubernetes) | `pkg/` + `cmd/` | Sim | Sim |

## Erros comuns

- **Estruturar demais cedo**: começar com `pkg/`, `internal/`, `cmd/`, `api/`, `web/` para um projeto de 500 linhas. Comece plano, adicione estrutura quando a dor aparecer.
- **Copiar golang-standards/project-layout**: esse repositório não é endossado pela equipe Go. Ele promove padrões que a maioria dos projetos Go não usa.
- **Pacotes vazios para "uso futuro"**: se um pacote tem um arquivo com duas funções, não é um pacote. É um arquivo.
- **Rejeitar internal/ para projetos pequenos**: o argumento "sem usuários externos = sem necessidade de internal/" confunde dois propósitos distintos. Sim, a proteção de import imposta pelo compilador é desnecessária para projetos solo. Mas `internal/` também serve como documentação arquitetural: um sinal para seu eu futuro sobre o que era pretendido como API estável versus implementação descartável. Quando você volta ao seu código seis meses depois, essa fronteira explícita ajuda a entender o que pode ser refatorado com segurança versus o que pode ter dependentes. Mesmo em projetos pessoais, `internal/` pode ser documentação valiosa.
- **Evitar pkg/ cegamente**: se sua raiz está cheia de configs e você está construindo uma biblioteca, `pkg/` pode melhorar a clareza. Avalie, não rejeite dogmaticamente.

## Resumo

- **Comece simples**: `main.go` + `go.mod` é válido
- **Código de biblioteca na raiz**: caminhos de import limpos
- **CLI/servidor em cmd/** ou main.go: camada fina em torno da biblioteca
- **Código privado em internal/**: quando você precisa de privacidade imposta pelo compilador
- **pkg/ é opcional**: evite a menos que tenha uma razão específica
- **Um único módulo**: evite complexidade multi-módulo (tema para outro artigo)

A melhor estrutura é aquela em que você não pensa. Se você está gastando tempo em estrutura em vez de código, está fazendo over-engineering.
