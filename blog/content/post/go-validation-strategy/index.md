---
title: 'Go Validation Strategy: Boundaries, Trust, and Defense-in-Depth'
description: 'A three-layer approach to validation in Go: parse at boundaries, trust typed internals, add defense-in-depth for critical operations.'
date: 2026-02-03
draft: false
categories:
  - Best Practices
tags:
  - error-handling
  - validation
  - testing
  - api
image: cover.jpg
---

Go's standard library demonstrates a clear pattern: `url.Parse`, `time.Parse`, `net.ParseIP` all transform strings into typed values. Parse untrusted data into trusted types at system boundaries, then let the type system carry that trust inward.

But where exactly should validation live? "Validate everything" leads to redundant checks scattered everywhere. "Trust the caller" leads to bugs. The solution is a three-layer strategy.

## Validate at boundaries

Every system has entry points where untrusted data enters: HTTP handlers, CLI arguments, file parsers. These boundaries are where validation belongs.

Validation should produce typed evidence of validity, not just return an error.

```go
// Weak: validation returns error, data stays string
func ValidateEmail(s string) error {
    if !strings.Contains(s, "@") {
        return errors.New("invalid email")
    }
    return nil
}

// Strong: parsing produces a type that guarantees validity
type Email struct{ addr *mail.Address }

func ParseEmail(s string) (Email, error) {
    addr, err := mail.ParseAddress(s)
    if err != nil {
        return Email{}, fmt.Errorf("invalid email %q: %w", s, err)
    }
    return Email{addr: addr}, nil
}

func (e Email) String() string {
    if e.addr == nil {
        return ""
    }
    return e.addr.Address
}
```

The stdlib's [`mail.ParseAddress`](https://pkg.go.dev/net/mail#ParseAddress) handles RFC 5322 parsing. Don't reinvent it. Functions accepting `Email` no longer need validation: the type guarantees the address was parsed successfully. The zero value `Email{}` has a nil pointer: `String()` returns `""` rather than panicking. This is [Alexis King's "parse, don't validate"](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/) principle applied to Go.

The standard library's [`url.Parse`](https://pkg.go.dev/net/url#Parse) returns `*url.URL`, [`net.ParseIP`](https://pkg.go.dev/net#ParseIP) returns `net.IP`, [`time.Parse`](https://pkg.go.dev/time#Parse) returns `time.Time`. Raw strings become rich types that downstream code can trust.

### Boundary validation in practice

HTTP handlers are natural boundaries. Parse all incoming data into domain types before calling business logic.

```go
func CreateOrderHandler(w http.ResponseWriter, r *http.Request) {
    var req CreateOrderRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        respondError(w, http.StatusBadRequest, "invalid JSON")
        return
    }

    // Parse into domain types at the boundary
    customerID, err := ParseCustomerID(req.CustomerID)
    if err != nil {
        respondError(w, http.StatusUnprocessableEntity, err.Error())
        return
    }

    items, err := parseOrderItems(req.Items)
    if err != nil {
        respondError(w, http.StatusUnprocessableEntity, err.Error())
        return
    }

    // Business logic receives validated types
    order, err := orderService.Create(r.Context(), customerID, items)
    if err != nil {
        handleServiceError(w, err)
        return
    }

    respondJSON(w, http.StatusCreated, order)
}
```

The handler does one thing: transform untrusted JSON into trusted domain types. If parsing fails, the request is rejected. If it succeeds, `orderService.Create` receives types that cannot represent invalid states.

## Trust internals

Once data crosses a boundary as a validated type, internal code should trust it. Re-validating defeats the purpose of parsing at boundaries.

```go
// Service layer trusts domain types
func (s *OrderService) Create(ctx context.Context, customerID CustomerID, items []OrderItem) (*Order, error) {
    // No validation: CustomerID and OrderItem are valid by construction

    // Business rules that need external data
    customer, err := s.repo.GetCustomer(ctx, customerID)
    if err != nil {
        return nil, fmt.Errorf("customer lookup: %w", err)
    }

    if customer.Status != StatusActive {
        return nil, fmt.Errorf("customer %s is not active", customerID)
    }

    return s.repo.SaveOrder(ctx, NewOrder(customerID, items))
}
```

The service checks business rules (is the customer active?) but doesn't re-validate that `customerID` is well-formed. That was handled at the boundary.

This requires discipline. When you see a validated type, trust it. Examples:

| Type         | What you can trust                                  |
| ------------ | --------------------------------------------------- |
| `Email`      | RFC 5322 compliant, parsed successfully             |
| `CustomerID` | Non-empty, matches expected format                  |
| `Money`      | Valid currency, non-negative (or explicitly signed) |
| `*Order`     | All fields valid, constructed via `NewOrder`        |

### Enforcing trust with unexported fields

Go's visibility rules reinforce this discipline. Unexported struct fields can only be set within the package, preventing external code from constructing invalid values directly.

```go
package customer

type ID struct {
    value string // unexported: only this package can set it
}

func ParseID(s string) (ID, error) {
    if s == "" {
        return ID{}, errors.New("customer ID cannot be empty")
    }
    if len(s) > 36 {
        return ID{}, fmt.Errorf("customer ID too long: %d chars", len(s))
    }
    return ID{value: s}, nil
}

func (id ID) String() string { return id.value }

func (id ID) IsZero() bool { return id.value == "" }
```

External packages cannot construct an invalid `customer.ID` via struct literal because `value` is unexported. They must use `ParseID`, which enforces the rules.

One caveat: `customer.ID{}` is still constructible from any package. The zero value has an empty `value` field. Two ways to handle this:

**Option 1: Make zero value detectable.** Add an `IsZero()` method and check it where needed. This is the simplest approach and follows Go's convention of useful zero values.

**Option 2: Use a pointer to signal required construction.** Return `*ID` from the parser, making `nil` the only way to have "no ID":

```go
func ParseID(s string) (*ID, error) {
    if s == "" {
        return nil, errors.New("customer ID cannot be empty")
    }
    return &ID{value: s}, nil
}
```

Functions accepting `*ID` can check for `nil`. The trade-off is pointer semantics and potential nil panics if callers forget to check.

## Defense-in-depth

Some operations are too critical to trust a single validation layer. Authentication, financial transactions, data deletion, cryptographic operations: these need redundant checks because silent failure is catastrophic.

```go
func (s *AccountService) Transfer(ctx context.Context, from, to AccountID, amount Money) error {
    // Defense-in-depth: re-validate even though types are "trusted"
    if amount.IsZero() {
        return errors.New("transfer amount cannot be zero")
    }
    if amount.IsNegative() {
        return errors.New("transfer amount cannot be negative")
    }
    if from == to {
        return errors.New("cannot transfer to same account")
    }

    // Critical section with additional checks
    return s.repo.WithTransaction(ctx, func(tx *Repository) error {
        fromAccount, err := tx.GetAccountForUpdate(ctx, from)
        if err != nil {
            return fmt.Errorf("lock source account: %w", err)
        }

        // Defense-in-depth: verify sufficient balance even if caller checked
        if fromAccount.Balance.LessThan(amount) {
            return fmt.Errorf("insufficient balance: have %s, need %s",
                fromAccount.Balance, amount)
        }

        toAccount, err := tx.GetAccountForUpdate(ctx, to)
        if err != nil {
            return fmt.Errorf("lock target account: %w", err)
        }

        // Defense-in-depth: verify accounts are active
        if fromAccount.Status != StatusActive {
            return fmt.Errorf("source account %s is not active", from)
        }
        if toAccount.Status != StatusActive {
            return fmt.Errorf("target account %s is not active", to)
        }

        return tx.ExecuteTransfer(ctx, from, to, amount)
    })
}
```

This looks like it violates "trust internals." It doesn't. Defense-in-depth is not about re-validating what parsing already guaranteed. Three distinct concerns require checks here:

- **Format validation** (already done): `AccountID` and `Money` are parsed types. We trust their format. Re-checking "is this a valid account ID string?" would be noise.
- **State verification** (required): Balance, account status, and other mutable state may have changed since the boundary parsed the request. Another request could have withdrawn funds. These checks belong in the transaction.
- **Invariant enforcement** (belt-and-suspenders): Invariants are conditions that should always be true by design. "Cannot transfer to same account" and "amount must be positive" should never occur if the system works correctly. The caller *should* enforce these, but we check anyway because silent violation is catastrophic.

The balance check inside the transaction isn't redundant with boundary validation: it's checking current state under a lock, which only this code can do.

### When to apply defense-in-depth

Reserve it for operations where silent failure is catastrophic. Examples:

| Operation             | Defense-in-depth? | Reason              |
| --------------------- | ----------------- | ------------------- |
| Display user name     | No                | Low cost of failure |
| Update preferences    | No                | User can retry      |
| Search                | No                | Empty results ok    |
| Financial transfer    | Yes               | Money at risk       |
| Delete account        | Yes               | Irreversible        |
| Auth token validation | Yes               | Security boundary   |

## The three layers in practice

Here's how the layers compose:

```text
Untrusted Input
    │
    ▼
┌─────────────────────────────────┐
│  BOUNDARY                       │
│  - Parse raw input              │
│  - Transform to typed values    │
│  - Reject invalid input         │
└─────────────────────────────────┘
    │
Typed values
    │
    ▼
┌─────────────────────────────────┐
│  CORE LOGIC                     │
│  - Trust received types         │
│  - Apply business rules         │
│  ┌────────────────────────────┐ │
│  │ DEFENSE-IN-DEPTH (inline)  │◀── For critical operations
│  │ - Verify current state     │ │
│  │ - Enforce invariants       │ │
│  └────────────────────────────┘ │
└─────────────────────────────────┘
    │
Result
    │
    ▼
┌─────────────────────────────────┐
│  STORAGE/OUTPUT                 │
│  - Trust received types         │
│  - Persist or return            │
└─────────────────────────────────┘
```

Defense-in-depth is not a separate layer in the call stack. It's additional checks embedded within core logic for specific critical operations. Most operations flow straight through without it.

## Testing parsed types

Parsed types simplify testing. Instead of testing validation logic scattered across handlers and services, you test the parser once:

```go
func TestParseEmail(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        want    string
        wantErr bool
    }{
        {name: "valid simple", input: "user@example.com", want: "user@example.com"},
        {name: "valid with name", input: "User <user@example.com>", want: "user@example.com"},
        {name: "valid plus tag", input: "user+tag@example.com", want: "user+tag@example.com"},
        {name: "missing at", input: "userexample.com", wantErr: true},
        {name: "empty", input: "", wantErr: true},
        {name: "spaces only", input: "   ", wantErr: true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := ParseEmail(tt.input)
            if (err != nil) != tt.wantErr {
                t.Errorf("ParseEmail(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
                return
            }
            if !tt.wantErr && got.String() != tt.want {
                t.Errorf("ParseEmail(%q) = %q, want %q", tt.input, got.String(), tt.want)
            }
        })
    }
}
```

Downstream code that accepts `Email` doesn't need validation tests: the type guarantees validity. Your service tests focus on business logic, not input checking.

## JSON serialization with unexported fields

Types with unexported fields don't serialize by default. This is a drawback of the approach: you need custom marshalers:

```go
type Email struct{ addr *mail.Address }

func (e Email) MarshalJSON() ([]byte, error) {
    if e.addr == nil {
        return []byte("null"), nil
    }
    return json.Marshal(e.addr.Address)
}

func (e *Email) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return err
    }
    if s == "" {
        *e = Email{}
        return nil
    }
    parsed, err := ParseEmail(s)
    if err != nil {
        return err
    }
    *e = parsed
    return nil
}
```

`UnmarshalJSON` calls `ParseEmail`, so JSON decoding enforces the same validation as explicit parsing. Invalid JSON input fails at decode time, not later.

For types used in API responses, this is unavoidable boilerplate. The trade-off is worth it: validation happens exactly once, whether data comes from JSON, form fields, or function calls.

## Where boundaries sit

The pattern is application-agnostic. What changes is where boundaries sit:

- **HTTP handlers**: Request body, query params, path params, headers
- **CLI tools**: `os.Args`, flags, stdin, config files, environment variables
- **Libraries**: The public API is the boundary. Most Go libs accept primitives and validate internally (`sql.Open`, `http.NewRequest`), but you can export parsers for callers who want type safety
- **Message consumers**: Queue messages, webhook payloads, event streams

The principle holds: parse at entry, trust inside, defend critical paths.

## What you pay

This strategy has costs:

- **More types to maintain**: Every validated concept needs a type with constructor, methods, and tests. For simple CRUD apps, this may be overkill. That said, for longer-lived projects, the upfront cost pays off in maintainability. I've skipped parsing in projects I didn't expect to grow, and now regret it: retrofitting typed values would break the public API.
- **Parsing overhead**: Converting strings to typed values has CPU cost, but it's almost always negligible compared to network I/O and database access. If you're paranoid, benchmark hot loops processing millions of items.

## When to skip it

Internal tools, scripts, and prototypes have a small blast radius. When you don't yet understand the full domain, locking in strict types prematurely can force rework as requirements clarify. If the worst consequence of invalid data is starting over, the overhead of rigorous parsing isn't justified.

## Summary

- **Validate at boundaries**: Parse untrusted input into types that cannot represent invalid states
- **Trust internals**: Functions receiving validated types don't re-check format or constraints
- **Defense-in-depth**: Add redundant validation for critical operations where failure cost is high

The goal is exactly one validation per trust boundary, producing typed evidence that propagates inward. Internal code trusts types. Critical paths verify anyway.
