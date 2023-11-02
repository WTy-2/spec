# Constraints

Constraints (`Constraint`) in WTy2 are used to pass evidence of equality or type membership, inspired by Haskell's `Constraint` kind.
Unlike Haskell, WTy2 retaining tags at runtime means that dictionary-passing is not the only sensible implementation strategy (we can instead just dispatch on tags) but viewing `Constraint` as the set of types which are guaranteed to only have one value (i.e, if we were allowed to name members of constraints in WTy2, we would have `for(c: Constraint, x: c, y: c) { x ~ y }`), with appropriate inference rules, is still sensible.

## Constraint Operators:

- `x :: t` = Dual to the binding operator `:`. Variable `x` is a member of the type `t`.
- `t <| u` = Dual to the binding operator `<:`. Type `t` is a subtype of `u`.
  This is actually not built-in. We can define it as `t <| u := for(x: t) { x :: u }`
- `x ~ y` = Variable `x` is equal to `y`. Specifically, reduces to the same normal form, or if a function, is extensionally equal.
- `c /\ d` = A **constraint conjunction**. Both constraint `c` and constraint `d` are derivable.
- `c => d` = A **constraint implication**. Constraint `d` is derivable if constraint `c` is assumed.
- `for(t, f)` = A **quantified constraint**. Function taking argument of type `t` and returning a constraint, `f` returns a derivable constraint for every value of type `t`.
  Example usage: `for(x: Int, y: Int) { x + y ~ y + x }` represents the constraint that `(+)` on `Int`s is commutative.
- Constraints, like types, are first-class. The type of constraints is `Constraint` and so arbitrary expressions of this type can also appear inside constraints.

## Such That `(<<=)`

WTy2 features a built-in dependent operator that places additional constraints on values of a type. When used on the argument and return type of a function, this has the interpretation of defining **requires** and **ensures** contracts, respectively.

The `<<=` operator has the following type signature:

```WTy2
(<<=) : (a: Type, f: a -> Constraint) -> Type
```

To construct a value of type `a <<= b` from a value `x` of type `a`, `b(x)` must be in the context. Matching on a value of type `(x: a) <<= b` is equivalent in syntax to matching on a value of type `a`, but `b(x)` is implicitly added to the typing context.

Another interpretation of this operator that might be more intuitive for programmers who have used languages with dependent types before is as a dependent pair, where the second element must be a constraint dictionary.

An approximation of this operator in Idris2 could be defined like so (using boolean predicates lifted to the type level instead of Haskell-style constraints, which Idris2 does not really have https://www.idris-lang.org/docs/idris2/current/base_docs/docs/Data.So.html):

```idris
data (<<=) : (a: Type) -> (p: a -> Bool) -> Type where
  Mk : forall a, p. (x: a) -> { auto f: So (p x) } -> ((<<=) a p)

infix 4 <<=
```

An example use would be to restrict the integers received by a function: [^note]

```idris
total
foo : (Nat <<= \x => 1 <= x && x <= 3) -> ()
foo (Mk 1) = ()
foo (Mk 2) = ()
foo (Mk 3) = ()
```

We can see that although `foo` only matches on the natural number being `1`, `2` or `3`, the function is still correctly checked as `total`, as we must also pass a proof that the `Nat` is in the range `[1-3]`.

The equivalent WTy2 declaration of `foo` is:

```WTy2
foo(x: Nat) <<= { (1 <= x && x <= 3) ~ True }
```

Note in this signature, `foo` is declared as a function which takes an argument of type `(x: Nat) <<= { (1 <= x && x <= 3) ~ True }`. This idea extends, we could define a type synonym and use that instead:

```WTy2
type NatBetween(min: Nat, max: Nat)
    = Nat <<= { min <= it && it <= max ~ True }

foo(x: NatBetween(1, 3))
```

### Design Note: Equivalent Constraints

You may notice that given constraints can contain arbitrary expressions, we could formulate semantically-equivalent constraints in many different ways. For example, we could write `{ contains([1, 2, 3], it) ~ True }`, or even `{ max(1, min(3, it)) ~ it }`. That these constraints do indeed imply each other is not always obvious (especially to the typechecker).

This is arguably the main pain-point with dependent types. Proving that one constraint implies another can be tiresome and can clutter up code significantly. Refinement type systems solve this through restricting constraints to those that can be dispatched with an SMT solver, but this is often limiting. WTy2 attempts to provide some of the ergonomics of refinement types without the restrictions through the ability to write and use implicit `proof`s.

[^note] As a side note, on the current Idris2 version (0.6.0), if `x <= 3` is replaced with `x < 4`, the example breaks, with the compiler protesting that case `foo (Mk (S (S (S (S _)))) _)` is not covered. I suspect this is a bug.
