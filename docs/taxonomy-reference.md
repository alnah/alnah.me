# Taxonomy Reference

Reference document for blog categories and tags organization.

## Categories

| Category         | Description                          | Status |
| ---------------- | ------------------------------------ | ------ |
| Tutorials        | Step-by-step guides                  | Now    |
| Best Practices   | Patterns and recommendations         | Now    |
| Deep Dives       | In-depth concept analysis            | Now    |
| Project Updates  | Announcements and releases           | Now    |
| Opinions         | Experience feedback, reflections     | Now    |
| Case Studies     | Real production problem solving      | Soon   |
| Code Review      | Code analysis (yours or open source) | Soon   |
| Tool Reviews     | Tools, libs, frameworks evaluation   | Future |
| Interviews       | Discussions with other Go devs       | Future |
| Conference Notes | Talk summaries (GopherCon, etc.)     | Future |
| Career           | Freelance, recruiting, remote work   | Future |

## Tags

### Core Go

| Tag            | Status         |
| -------------- | -------------- |
| go-basics      | Now            |
| concurrency    | Now            |
| goroutines     | Now            |
| channels       | Now            |
| context        | Now            |
| error-handling | Now            |
| generics       | Now            |
| interfaces     | Now            |
| testing        | Now            |
| benchmarking   | Now            |
| profiling      | Now            |
| reflection     | Future         |
| unsafe         | Future         |
| cgo            | Future         |
| assembly       | Future (niche) |

### Standard Library

| Tag           | Status |
| ------------- | ------ |
| stdlib        | Now    |
| net-http      | Now    |
| io            | Now    |
| encoding-json | Now    |
| text-template | Now    |
| database-sql  | Soon   |
| crypto        | Future |
| embed         | Future |
| slog          | Soon   |

### Ecosystem / Tools

| Tag               | Status |
| ----------------- | ------ |
| project-structure | Now    |
| modules           | Now    |
| tooling           | Now    |
| linting       | Now    |
| ci-cd         | Now    |
| docker        | Now    |
| makefiles     | Now    |
| golangci-lint | Soon   |
| go-releaser   | Soon   |
| air           | Future |
| delve         | Future |
| pprof         | Future |

### Frameworks / Popular Libs

| Tag     | Status |
| ------- | ------ |
| gin     | Future |
| echo    | Future |
| chi     | Future |
| fiber   | Future |
| grpc    | Future |
| sqlx    | Future |
| pgx     | Future |
| ent     | Future |
| gorm    | Future |
| cobra   | Soon   |
| viper   | Future |
| zap     | Future |
| zerolog | Future |
| testify | Soon   |
| gomock  | Future |
| wire    | Future |

### Application Domains

| Tag                 | Status |
| ------------------- | ------ |
| cli                 | Now    |
| pdf                 | Now    |
| web                 | Now    |
| api                 | Now    |
| rest                | Soon   |
| graphql             | Future |
| websockets          | Future |
| microservices       | Future |
| monolith            | Future |
| serverless          | Future |
| kubernetes          | Future |
| observability       | Future |
| distributed-systems | Future |
| event-driven        | Future |
| message-queues      | Future |

### Architecture / Patterns

| Tag                  | Status |
| -------------------- | ------ |
| clean-architecture   | Soon   |
| hexagonal            | Future |
| ddd                  | Future |
| tdd                  | Soon   |
| design-patterns      | Future |
| solid                | Future |
| dependency-injection | Soon   |
| repository-pattern   | Future |

### Performance

| Tag             | Status |
| --------------- | ------ |
| optimization    | Soon   |
| memory          | Future |
| gc              | Future |
| allocations     | Future |
| escape-analysis | Future |
| cpu-bound       | Future |
| io-bound        | Future |

### Security

| Tag            | Status |
| -------------- | ------ |
| security       | Future |
| authentication | Future |
| authorization  | Future |
| jwt            | Future |
| oauth          | Future |
| tls            | Future |
| owasp          | Future |

### DevOps / Infra

| Tag            | Status |
| -------------- | ------ |
| github-actions | Now    |
| gitlab-ci      | Future |
| terraform      | Future |
| ansible        | Future |
| prometheus     | Future |
| grafana        | Future |
| opentelemetry  | Future |

### Career / Soft Skills

| Tag               | Status |
| ----------------- | ------ |
| freelance         | Future |
| remote-work       | Future |
| open-source       | Now    |
| code-review       | Future |
| mentoring         | Future |
| technical-writing | Future |

### Projects

| Tag       | Status |
| --------- | ------ |
| go-md2pdf | Now    |

## Usage in Front Matter

```yaml
---
title: 'Article Title'
date: 2026-01-14
categories:
  - Tutorials
tags:
  - go-basics
  - testing
  - error-handling
---
```

## Guidelines

- **One category per article** - Choose the most relevant
- **Multiple tags allowed** - Be specific but not excessive (3-7 tags)
- **Use existing tags first** - Check this reference before creating new ones
- **Kebab-case for tags** - `error-handling` not `errorHandling`
- **Title case for categories** - `Deep Dives` not `deep-dives`
