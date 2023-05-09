# Dependent Types

WTy2 features dependent record and function types.

## Constrained By `(<==)`

Often, in dependently typed languages, a dependent record only needs to carry evidence of a constraint as the second argument, for the purpose of bringing it into scope as evidence of a predicate. This pattern is made more convenient in WTy2 through the `<==` operator (read as "constrained by").

The `<==`operator has the following type signature:

```WTy2
(<==) : (a: Type, f: a -> Constraint) -> Type
```

To construct a value of type `a <== b` from a value `x` of type `a`, `b(x)` must be in the context. Matching on a value of type `(x: a) <== b` is similar to matching on a value of type `a`, but `b(x)` is added to the context.

In use, this operator has similarities to refinement types (i.e: in Liquid Haskell) (i.e: in that the constraint evidence is passed entirely implicitly).

An approximation of this operator in Idris (but for which construction and matching is not implicit) could be defined like so:

```idris
Proof : Bool -> Type
Proof p = p = True

data (<==) : (a: Type) -> (p: a -> Bool) -> Type where
  Mk : (x: a) -> (f: Proof (p x)) -> ((<==) a p)

infix 4 <==
```

Idris (as far as I am aware) does not have an equivalent of equality coercion constraints like WTy2 (or indeed Haskell) so we are forced to use `-> Bool` and propositional equality `=` to represent predicates instead.

An example use would be to restrict the integers received by a function:

```idris
total
foo : (Nat <== \x => 1 <= x && x <= 3) -> ()
test3 (Mk 1 {f=Refl}) = ()
test3 (Mk 2 {f=Refl}) = ()
test3 (Mk 3 {f=Refl}) = ()
```

We can see that although `foo` only matches on the natural number being `1`, `2` or `3`, the function is still correctly typechecked as `total`, as we must also pass a proof that the `Nat` is in the range `[1-3]`.

The equivalent WTy2 declaration of `foo` is:

```WTy2
foo(x: Nat) <== { 1 <= x && x <= 3 ~ True }
```

This sort of constraint is useful enough that defining a type synonym is probably a good idea.

```
type NatBetween(min: Nat, max: Nat)
    = Nat <== { min <= it && it <= max ~ True }

foo(x: NatBetween(1, 3))
```

As records can have multiple entries we can easily constrain arguments in terms of another. For example, we can define a function `bar` which takes two `Nat`s, `x` and `y`, where `y` must be greater than `x`:

```
bar(x: Nat, y: Nat) <== { y > x ~ True }
```

### Design Note: Equivalent Constraints

You may realise that as constraints can contain arbitrary expressions, we could formulate these constraints in many different ways. For example, we could write `{ contains([1, 2, 3], it) ~ True }`, or even `{ max(1, min(3, it)) ~ it }`. That these constraints do indeed imply each other though, is not always obvious (expecially to the typechecker).

This is arguably the main pain-point with dependent types - proving that one constraint implies another can be tiresome and clutter up code significantly. WTy2 attempts to make this slightly less painful through the ability to write implicit `proof`s.

## Dependent Function Arrow

WTy2 also supports dependent function arrows, through a similar mechanism. The argument record to a function is in scope in the return type (including the return constraint), as well as the function body.

Note this makes `<==` constraints on return types somewhat ambiguous in that if the return type of the function is a record with identically named fields (or simply the `it` keyword is used), this could refer to the argument record or the return. WTy2 disambiguates this by treating this case as shadowing. In general, the innermost `it` (and it's associated record names) shadow the outermost one.

Currently, there is no mechanism to forcefully disambiguate (though perhaps some syntax to specify de Bruijn indices or similar could work). The field names of the argument or return record must be changed to refer to the argument record fields in the return constraint.
