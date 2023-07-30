# Coherence

WTy2 has a number of rules to guarantee instances do not overlap. These can be broken into checking if known instances overlap and preventing overlap down-the-line.

## Detecting Errors Early

A goal of WTy2 is that adding a valid instance (i.e: no error is detected at the site of the instance) should never break existing code.

Note that Haskell does not actually meet this criteria due to overlap only being checked lazily (when trying to solve the constraint), see:

```hs
class C a

instance C (Char, a)

-- This instance appears to be fine, but causes an error at the
-- call to `bar` due to the instance of `C` becoming ambiguous
{-
instance C (a, Bool)
-}

foo :: ()
foo = bar ('a', True)

bar :: C a => a -> ()
bar _ = ()
```

Following this rule doesn't just lead to a theoretically cleaner language, it has a direct practical benefit: adding new valid instances to a library can never be a breaking change and so does not require a semantic version bump. This does make overlap checking more challenging though.

## Open/Closed Rules

Types can either be open or closed. These properties interact with the `(|)` and `(&)` type operators like so:

```
for(t: Closed, u: Closed) { t | u :: Closed }
for(t: Open, u: Type)     { t | u :: Open   }
for(t: Closed, u: Type)   { t & u :: Closed }
for(t: Open, u: Open)     { t & u :: Open   }
```

Types are closed iff their supertype is closed. Recall that

```WTy2
type T = U;
```

...is translated into:

```WTy2
type T { } <: U;
instance T for U;
```

So for type-alias syntax, the defined type is closed iff the RHS type is closed.

A type may have exactly one "open" instance, or many "closed" instances.

NOTE: This is not a good enough rule - how to handle `Vec(Any)` - i.e: the argument type is open.

## Detecting Overlap Between Two Closed Types

Given two known instances, WTy2 must check that the sets of values represented by the types do not overlap. This check must be inherently conservative because this condition in general reduces to proving Fermat's last theorem.

```WTy2
type C
instance C for (x: Int, y: Int, z: Int)
instance C for [n: Int] (x: Int, y: Int, z: Int) <<= { x ^ n + y ^ n ~ z ^ n }
```

Still, we would like to allow vaguely interesting instances (like what modern Haskell can support) and so cannot be super conservative like declaring overlap as soon as two types contain the same constructor:

```hs
class C a

instance C [Int]
instance C [Bool]
```

Of course, the problem is MUCH easier in Haskell because the type system is intrinsic, and so instance selection is driven by the type, not the value.

I have not worked out a specific algorithm yet, but my current idea is, for the duration of the check, to ignore many of WTy2's more advanced typing features (constraints, dependent types) and follow an algorithm similar to subtyping of equi-recursive types as described in TAPL.

## Orphan Rules

To avoid overlap even when multiple modules are involved, WTy2 uses a set of orphan rules, inspired by Rust.

Note Rust is a bit more general than this. It allows:

```rs
struct S1;
struct S2;
struct S3;

trait T1 {}
trait T2 {}
trait T3 {}

impl <T: T2> T1 for T {}

impl T1 for S1 {}

impl T2 for S2 {}

// impl T1 for S2 {}
```

as long as (TODO: CHECK EXACT CONDITION) are defined in the same module. In my opinion, this is a mistake: it makes the rules more complicated and has limited utility (OOP has proven that default instances for a type in terms of another are useful, but this can be achieved through much more principled means like Haskell's `deriving via`).
