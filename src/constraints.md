# Constraints

Constraints in WTy2 are used to pass evidence of equality or type membership. As WTy2 retains full information on the constructors used to create a value via the tags, they can be entirely erased at runtime (i.e: Haskell-style dictionary-passing is unnecessary) but implementation strategy is still a work in progress.
Indeed given current design for overlap of instances, dispatch can reqire arbitrary computation, meaning dictionary-passing could turn out to be a major optimisation.

## Constraint Operators:

- `x :: t` = Dual to the binding operator `:`. Variable `x` is a member of the type `t`.
- `t <:: u` = Dual to the binding operator `<:`. Type `t` is an instance head of instanceable type `u`.
- `x ~ y` = Variable `x` is equal to `y`. Specifically, reduces to the same normal form, or if a function, is extensionally equal.
- `c /\ d` = A **constraint conjunction**. Both constraint `c` and constraint `d` are derivable.
- `c => d` = A **constraint implication**. Constraint `d` is derivable if constraint `c` is assumed.
- `for(t, f)` = A **quantified constraint**. Function taking argument of type `t` and returning a constraint, `f` returns a derivable constraint for every value of type `t`.

  Example usage: `for(x: Int, y: Int) { x + y ~ y + x }` represents the constraint that `(+)` on `Int`s is commutative.

- Constraints, like types, are first-class. The type of constraints is `Constraint` and so arbitrary expressions of this type can also appear inside constraints.

A constraint for subtyping (i.e: all values of one type are members of another) is intentionally omitted from the source syntax. Firstly, this can actually be defined manually with relative ease using quantified constraints:

```WTy2
subtype(t, u) = for(x: t) { x :: u }
```

But further, I am currently of the opinion that `(<:)`/`(<::)` should cover the VAST majority of subtyping needs, without introducing tons of ambiguity usually associated with such a feature.

## Constrained By `(<<=)`

WTy2 features a built-in dependent operator that places additional constraints on values of a type. When used on the argument and return type of a function, this has the interpretation of defining **requires** and **ensures** contracts, respectively.

The `<<=` operator has the following type signature:

```WTy2
(<<=) : (a: Type, f: a -> Constraint) -> Type
```

To construct a value of type `a <<= b` from a value `x` of type `a`, `b(x)` must be in the context. Matching on a value of type `(x: a) <<= b` is similar to matching on a value of type `a`, but `b(x)` is added to the context.

Another interpretation of this operator that might be more intuitive for programmers who have used languages with dependent types before is as a more limited version of a dependent pair, where the second element must be an erased constraint.

An approximation of this operator in Idris2 (but for which construction and matching is not implicit) could be defined like so (using boolean predicates lifted to the type level instead of Haskell-style constraints which Idris2 does not really have https://www.idris-lang.org/docs/idris2/current/base_docs/docs/Data.So.html):

```idris

data (<<=) : (a: Type) -> (p: a -> Bool) -> Type where
  Mk : (x: a) -> (f: So (p x)) -> ((<<=) a p)

infix 4 <<=
```

An example use would be to restrict the integers received by a function:

```idris
total
foo : (Nat <<= \x => 1 <= x && x <= 3) -> ()
foo (Mk 1 {f=Oh}) = ()
foo (Mk 2 {f=Oh}) = ()
foo (Mk 3 {f=Oh}) = ()
```

[^note]

We can see that although `foo` only matches on the natural number being `1`, `2` or `3`, the function is still correctly checked as `total`, as we must also pass a proof that the `Nat` is in the range `[1-3]`.

The equivalent WTy2 declaration of `foo` is:

```WTy2
foo(x: Nat) <<= { 1 <= x && x <= 3 ~ True }
```

Note in this signature, `foo` is declared as a function which takes an argument of type `(x: Nat) <<= { 1 <= x && x <= 3 ~ True }`. This idea extends, we could define a type synonym and use that instead:

```WTy2
type NatBetween(min: Nat, max: Nat)
    = Nat <<= { min <= it && it <= max ~ True }

foo(x: NatBetween(1, 3))
```

### Design Note: Equivalent Constraints

You may notice that as constraints can contain arbitrary expressions, we could formulate semantically-equivalent constraints in many different ways. For example, we could write `{ contains([1, 2, 3], it) ~ True }`, or even `{ max(1, min(3, it)) ~ it }`. That these constraints do indeed imply each other though, is not always obvious (expecially to the typechecker).

This is arguably the main pain-point with dependent types. Proving that one constraint implies another can be tiresome and clutter up code significantly. Refinement type systems solve this through restricting constraints to those that can be proved with an SMT solver, but this is often overly limiting. WTy2 attempts to provide some of the ergonomics of refinement types without the restrictions through the ability to write and use implicit `proof`s.

[^note] As a side note, on the current Idris2 version 0.6.0, if `x <= 3` is replaced with `x < 4`, the example breaks, saying case `foo (Mk (S (S (S (S _)))) _)` is not covered. This seems like a bug.
