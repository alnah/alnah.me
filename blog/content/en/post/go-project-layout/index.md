---
title: 'Go Project Layout: What Actually Works'
description: "Practical patterns for structuring Go projects: library, CLI, server, and combined layouts based on real projects, not the unofficial 'standard'."
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

The Go team explicitly recommends simplicity over structure. [Russ Cox](https://github.com/golang-standards/project-layout/issues/117), Go's tech lead, publicly criticized the popular [golang-standards/project-layout](https://github.com/golang-standards/project-layout) repository (54k+ stars), stating it "is not a Go standard" and that "Go repos tend to be much simpler."

The official minimum: a LICENSE, go.mod, and Go code organized as you see fit. This guide provides recommendations for four project types, based on patterns from production projects.

## The only rule that matters

Go enforces exactly one structural rule: packages in `internal/` cannot be imported from outside the module. This is compiler-enforced, not convention.

The official documentation at [go.dev/doc/modules/layout](https://go.dev/doc/modules/layout) says: start simple. A `main.go` and `go.mod` is enough for small projects. Add structure when you need it, not before.

## Four patterns that work

### Library only

For projects meant to be imported by others. Place exportable code at the repository root for clean import paths.

```text
mylib/
├── go.mod
├── mylib.go            # Primary API
├── option.go           # Functional options
├── types.go            # Public types
└── internal/           # Private implementation
    └── parse/
```

Users import directly:

```go
import "github.com/user/mylib"

client := mylib.New(mylib.WithTimeout(5 * time.Second))
```

Examples: [Cobra](https://github.com/spf13/cobra), [Viper](https://github.com/spf13/viper), [goldmark](https://github.com/yuin/goldmark).

### CLI only

For tools not meant to be imported as libraries. Everything in `internal/` signals this is an application, not a library.

```text
mytool/
├── go.mod
├── main.go
├── internal/
│   ├── cmd/            # Command implementations
│   ├── config/         # Configuration
│   └── core/           # Business logic
└── testdata/
```

[Terraform](https://github.com/hashicorp/terraform) uses this approach: 100% of implementation lives in `internal/`, explicitly signaling no stable Go API exists.

For multiple related binaries, use `cmd/`:

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

### Server only

For HTTP/gRPC servers not meant to be imported. Organize by domain, not by technical layer.

```text
myserver/
├── go.mod
├── main.go
├── routes.go           # All endpoint mappings
└── internal/
    ├── handlers/
    ├── middleware/
    └── storage/
```

[Prometheus](https://github.com/prometheus/prometheus) demonstrates domain-driven organization with top-level directories like `promql/`, `tsdb/`, and `scrape/` rather than `controllers/`, `models/`, `services/`.

Server layout patterns deserve their own article. The key principle: keep routes discoverable in one place, pass dependencies explicitly.

### Library + CLI (+ server)

For projects offering both a library and command-line tools. The CLI is a thin wrapper around the library.

```text
myproject/
├── go.mod
├── service.go          # Public API
├── types.go            # Public types
├── internal/
│   ├── config/         # Config parsing
│   └── transform/      # Data conversion
└── cmd/
    └── mytool/         # CLI binary
        └── main.go
```

Users can:

```bash
# Import the library
go get github.com/user/myproject

# Install the CLI
go install github.com/user/myproject/cmd/mytool@latest
```

[Helm](https://github.com/helm/helm) explicitly documents this boundary: "code inside of cmd/ is not designed for library re-use."

Examples: [Hugo](https://github.com/gohugoio/hugo), [Prometheus](https://github.com/prometheus/prometheus).

## The pkg/ debate

The Go team does not recommend `pkg/`. It adds a path segment without semantic benefit:

```go
// With pkg/
import "github.com/user/project/pkg/client"

// Without pkg/
import "github.com/user/project/client"
```

[Brad Fitzpatrick](https://github.com/golang-standards/project-layout/issues/117#issuecomment-828503689) confirmed the standard library dropped `pkg/` in Go 1.4, yet the community cargo-culted it from early projects like Kubernetes.

### Arguments against pkg/

- **Redundancy**: all Go code is already a "package"
- **Longer import paths**: every import in every file gets longer
- **No tooling benefit**: the compiler treats it like any other directory

### Arguments for pkg/

- **Visual clarity**: when your root has Makefile, Dockerfile, docker-compose.yml, .github/, terraform/, and CI configs, `pkg/` creates separation between Go code and configuration
- **Explicit signal**: communicates "this code is designed for external use"
- **Consistency with cmd/ and internal/**: some argue `pkg/` beside `cmd/` is more consistent than mixing packages with entry points

### Who uses pkg/?

| Uses pkg/                                                                                                                                                                                                                                          | Skips pkg/                                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Kubernetes](https://github.com/kubernetes/kubernetes), [Helm](https://github.com/helm/helm), [CockroachDB](https://github.com/cockroachdb/cockroach), [etcd](https://github.com/etcd-io/etcd), [InfluxDB](https://github.com/influxdata/influxdb) | [Prometheus](https://github.com/prometheus/prometheus), [Hugo](https://github.com/gohugoio/hugo), [Terraform](https://github.com/hashicorp/terraform), [Consul](https://github.com/hashicorp/consul), [Cobra](https://github.com/spf13/cobra) |

The pattern: projects that adopted `pkg/` were often created before Go 1.4 (when `internal/` was introduced). Newer projects increasingly skip it.

**Recommendation**: skip `pkg/` for new projects unless you have many non-Go files at root AND want to explicitly signal library reusability.

## When internal/ provides value

Unlike `pkg/`, the `internal/` directory has compiler enforcement. Code in `internal/` can only be imported by code in the same module tree.

### The case for internal/

The [official Go documentation](https://go.dev/doc/modules/layout) recommends it: "it's recommended placing such packages into a directory named internal; this prevents other modules from depending on packages we don't necessarily want to expose."

[Dave Cheney](https://dave.cheney.net/2019/10/06/use-internal-packages-to-reduce-your-public-api-surface) emphasizes the opt-in nature: "You can promote internal packages later if you want to commit to supporting that API; just move them up a directory level. The key is this process is opt-in."

Benefits:

- Protection against accidental API exposure
- Freedom to refactor without breaking external users
- Clear boundary between public contract and implementation

### The counter-argument

[Laurent Demailly](https://laurentsv.com/blog/2024/10/19/no-nonsense-go-package-layout.html) argues most projects don't need `internal/`: "don't use internal/ unless you're shipping to many third-party users with extensive shared code."

His alternative: use 0.x semver for flexibility and document changes clearly, "rather than under-publishing and forcing people to fork to access what they really need."

This is valid for applications and small libraries. But for libraries with significant adoption, `internal/` prevents the pain of maintaining APIs you never intended to support.

### The real question

The decision isn't just "should external users import this?" but "am I willing to maintain API stability for this code?"

Every package outside `internal/` implicitly carries stability expectations. If you expect to refactor frequently, use `internal/` regardless of whether external import is likely.

## When to create a package

Create a package when:

- Multiple files share a distinct responsibility
- The code has its own types and functions that form a cohesive unit
- You want to control visibility at package boundaries

Do not create a package for:

- A single file with a few helper functions
- "Organization" without functional benefit
- Matching some external project's structure

File size is not the right metric: cohesion and testability are. A 150-line file mixing three distinct responsibilities is worse than a well-structured package. The question isn't "how long is this file?" but "can I describe what this file does in one sentence?"

A `utils/` package with three unrelated functions is over-engineering. But so is a single file that forces you to understand authentication, caching, and logging to modify any one of them.

## The decision process

When adding code:

| Question                                | Yes                                                 | No                       |
| --------------------------------------- | --------------------------------------------------- | ------------------------ |
| Should external users import this?      | Root or `pkg/`                                      | `internal/`              |
| Am I willing to maintain API stability? | Root or `pkg/`                                      | `internal/`              |
| Is this CLI/server-specific?            | `cmd/appname/` or `internal/`                       | Library code             |
| Does this need its own package?         | Only if multiple files with distinct responsibility | Keep in existing package |

## File organization at root

For library projects, split by responsibility:

```text
mylib/
├── client.go           # Client type and methods
├── option.go           # Functional options
├── types.go            # Public types
├── errors.go           # Sentinel errors
├── request.go          # Request building
├── response.go         # Response parsing
└── mylib_test.go       # Tests
```

Each file has one job. Looking for error definitions? Check `errors.go`. Looking for configuration? Check `option.go`.

Avoid:

- `util.go` (name it by what it does)
- `helpers.go` (same problem)
- `misc.go` (where code goes to die)

## Test organization

Go offers two testing approaches with different trade-offs:

### Same-package tests (`foo_test.go`)

```go
package mylib

func TestParseInternal(t *testing.T) {
    // Can access unexported functions and types
    result := parse("input")
}
```

Use when you need to test unexported functions or internal state. The risk: tests coupled to implementation details break during refactoring.

### Separate-package tests (`foo_test` package)

```go
package mylib_test

import "github.com/user/mylib"

func TestParsePublic(t *testing.T) {
    // Only public API available
    result := mylib.Parse("input")
}
```

Use for black-box testing of your public API. These tests document how external users interact with your code and survive internal refactoring.

**In practice, combine both approaches**:

- `_test` package for integration tests of your public API: these serve as living documentation and force you to design a usable interface
- Same-package tests for targeted unit tests on complex internal logic (parsing, state machines, validation rules)

```text
mylib/
├── parser.go
├── parser_test.go          # package mylib – tests internal parse()
├── mylib_test.go           # package mylib_test – tests public API
└── transform/
    ├── transform.go
    └── transform_test.go   # package transform – complex state machine tests
```

The `_test` package tests catch API design problems early: if your test is awkward to write, your users will struggle too.

### Test fixtures with testdata/

The `testdata/` directory is ignored by the Go toolchain and conventionally holds test fixtures:

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

Access fixtures with relative paths from tests:

```go
data, err := os.ReadFile("testdata/valid_input.json")
```

For golden file testing (comparing output against expected files), the `testdata/golden/` convention helps distinguish input fixtures from expected outputs.

## Real examples

| Project                                                | Structure                 | Library importable? | Uses pkg/? |
| ------------------------------------------------------ | ------------------------- | ------------------- | ---------- |
| [Cobra](https://github.com/spf13/cobra)                | Root package              | Yes                 | No         |
| [Helm](https://github.com/helm/helm)                   | `pkg/` + `cmd/`           | Yes                 | Yes        |
| [Hugo](https://github.com/gohugoio/hugo)               | Root + domain packages    | Yes                 | No         |
| [Prometheus](https://github.com/prometheus/prometheus) | Domain packages           | Yes                 | No         |
| [Terraform](https://github.com/hashicorp/terraform)    | Everything in `internal/` | No                  | No         |
| [Kubernetes](https://github.com/kubernetes/kubernetes) | `pkg/` + `cmd/`           | Yes                 | Yes        |

## Common mistakes

- **Over-structuring early**: starting with `pkg/`, `internal/`, `cmd/`, `api/`, `web/` for a 500-line project. Start flat, add structure when pain appears.
- **Copying golang-standards/project-layout**: that repo is not endorsed by the Go team. It promotes patterns most Go projects don't use.
- **Empty packages for "future use"**: if a package has one file with two functions, it's not a package. It's a file.
- **Dismissing internal/ for small projects**: the argument "no external users means no need for internal/" conflates two distinct purposes. Yes, compiler-enforced import protection is unnecessary for solo projects. But `internal/` also serves as architectural documentation: a signal to your future self about what was intended as stable API versus throwaway implementation. When you return to your code six months later, that explicit boundary helps you understand what's safe to refactor versus what might have dependents. Even on personal projects, `internal/` can be valuable documentation.
- **Blindly avoiding pkg/**: if your root is cluttered with configs and you're building a library, `pkg/` might improve clarity. Evaluate, don't dogmatically reject.

## Summary

- **Start simple**: `main.go` + `go.mod` is valid
- **Library code at root**: clean import paths
- **CLI/server in cmd/** or main.go: thin wrapper around library
- **Private code in internal/**: when you need compiler-enforced privacy
- **pkg/ is optional**: skip it unless you have a specific reason
- **One module**: avoid multi-module complexity (topic for another article)

The best layout is the one you don't think about. If you're spending time on structure instead of code, you're over-engineering.
