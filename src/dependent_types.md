# Dependent Types

## Constrained By `(<==)`

WTy2 features dependent types through desugaring to a single language construct, `<==` (read as "constrained by").

`<==` is a type operator (it cannot occur at the value level) and has the following type signature:

```WTy2
>>> :type (<==)
> (<==) : [a: Type](x: a, f: a -> Constraint) -> Type
```

To construct a value of type `a <== b` from a value of type `a`, `b(a)` must be in the context. Matching on a value of type `a <== b` is equivalent to matching on a value of type `a`, but `b(a)` is added to the context.

This operator has similarities to refinement types (i.e: in Liquid Haskell) and dependent pairs (i.e: in Agda/Idris/Coq/Lean) but is a somewhat unique construct, which is primarily enabled from WTy2's robust support for first-class `Constraint`s and subtyping.

An approximation of this operator in Idris could be defined like so:

```idris
Proof : Bool -> Type
Proof p = p = True

data (<==) : (a: Type) -> (p: a -> Bool) -> Type where
  Mk : (x: a) -> (f: Proof (p x)) -> ((<==) a p)

infix 4 <==
```

Idris (as far as I am aware) does not have robust support for first-class constraints like WTy2 so we use `-> Bool` (which can represent an arbitrary predicate) instead.

An example use would be to restrict the integers received by a function:

```idris
total
foo : (Nat <== \x => 1 <= x && x <= 3) -> ()
test3 (Mk 1 {f=Refl}) = ()
test3 (Mk 2 {f=Refl}) = ()
test3 (Mk 3 {f=Refl}) = ()
```

We can see that althought `foo` only matches on the natural number being `1`, `2` or `3`, the function is still correctly typechecked as `total`, as we must also pass a proof that the `Nat` is in the range `[1-3]`.

Unfortunately, because of the lack of subtyping, when used in Idris, we must always pattern match on the `Mk` to bring the constraint into scope. In WTy2, both construction and matching is done entirely implicitly.

The equivalent WTy2 declaration of `foo` is:

```WTy2
fun foo(x: Nat) <== { 1 <= x && x <= 3 ~ True }
```

This sort of constraint is useful enough that defining a type synonym is probably a good idea.

```
trait NatBetween(min: Nat, max: Nat)
    := Nat <== { min <= it && it <= max ~ True }

fun foo(x: NatBetween(1, 3))
```

### Design Note: Equivalent Constraints

You may realise that as constraints can contain arbitrary expressions, we could formulate these constraints in many different ways. For example, we could write `{ contains([1, 2, 3], it) }`, or even `{ max(1, min(3, it)) ~ it }`. That these constraints do indeed imply each other though, is not always obvious (expecially to the typechecker).

This is arguably the main pain-point with dependent types - proving that one constraint implies another can be tiresome and clutter up code significantly. WTy2 attempts to make this slightly less painful through the ability to write implicit `proof`s.

## Dependent Records / Scoping Rules

Where this gets more interesting is when wanting to describe constraints on one argument in terms of another.

For example, imagine we want to define function `bar` which takes two `Nat`s, `x` and `y`, where `y` must be greater than `x`.

One way to formulate this would be just:

```
fun bar(x: Nat, y: Nat) <== { y > x }
```

But another way to write this would be:

```
trait NatAbove(x: Nat) := Nat <== { it > x }

fun bar(x: Nat, y: NatAbove(x))
```

`x` is in scope when writing the type of `y`. Cyclic dependencies in these type signatures are also fine:

```
trait NatBelow(x: Nat) := Nat <== { it < x }

trait NatAbove(x: Nat) := Nat <== { it > x }

fun bar(x: NatBelow(y), y: NatAbove(x))
```

One way to view what is happening here is to move all types into a new `<==` constraint.

```
fun bar(x: ?, y: ?) <== { x: NatBelow(y), y: NatAbove(x) }
```

### Unresolved Question:

`NatBelow`/`NatAbove` require a `Nat` constraint on their argument. These `Nat` constraints can be obtained from looking at what `NatBelow`/`NatAbove` themselves imply, but this is quite a loopy typechecking case. If implementation for checking this proves too hard, or is there is a soundness hole discovered with these sorts of definitions, an alternative desugaring would be:

```
fun bar(x: Nat, y: Nat) <== { x: NatBelow(y), y: NatAbove(x) }
```

In which case the applications of `NatBelow` and `NatAbove` typecheck trivially.
