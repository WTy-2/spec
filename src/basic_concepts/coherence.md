# Coherence

WTy2 has a number of rules on instance declarations to guarantee instances do not overlap. Note "overlap" has a slightly stronger meaning in WTy2 than in other languages with typeclasses given the ubiquity of subtyping: treated as sets, there should exist no value that is a member of both types.

Rules around instances and overlap can get tricky, and luckily, a lot of prior work has been done investigating them in languages such as Rust and Haskell. As such, I will repeatedly refer to the decisions those languages have taken to compare and contrast.

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

Following this rule doesn't just lead to a theoretically cleaner language, it has a direct practical benefit: adding new valid instances to a library can never be a breaking change and so does not require a semantic version bump.

## Outermost Constructors

Given WTy2 is dependently typed with types effectively modelling arbitrary sets, checking if an arbitrary two types overlap is obviously undecidable. We can trivially encode Fermat's last theorem as a type overlap problem.

```WTy2
type C { };
inst C for (x: Int, y: Int, z: Int) { };
inst C for [n: Int] (x: Int, y: Int, z: Int) <<= { x ^ n + y ^ n ~ z ^ n } { };
```

We take the conservative approach of only considering the outermost constructor(s)[^note]. For example, the two below instances will always be treated as overlapping (regardless of whether `Foo` and `Bar` overlap):

```
data Mk[a: Type](x: a);

type Foo : Type = ...

type Bar : Type = ...

type C { };

inst C for [x: Foo] 'Mk(x) { };
inst C for [x: Bar] 'Mk(x) { };
```

The check for overlap between closed types then becomes quite simple. The instance head types are reduced into form `[...] 'C0(...) | [...] 'C1(...) | ...` and the sets of outermost constructors are compared.

As well as making overlap rules MUCH simpler, this has a really poweful benefit for implementation. (I believe that) with it, we can fully erase constraints (instead keeping tags around at runtime, and dispatching based off the outer tag).

I further argue (though more loosely) that this has a further advantage in program reasoning, similar to parametricity. Consider defining a `Num` instance for lists. Haskell would allow defining a `Num` instance for `List Int` which operates with `zipWith` and `List SomethingElse` which concatenates lists with `(+)`, removes elements from the first list on `(-)` etc... I personally believe the solution mandated by WTy2 of defining a separate list datatype to correspond with each of the instances behaviours (or at the very least a newtype wrapper) leads to clearer code.

## Open/Closed Rules

Types can either be open or closed. These properties interact with the `(|)` and `(&)` type operators like so:

```WTy2
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
type T { } <<= { self <| impl(U) };
inst T for impl(U); // Or an instance for every value if `U` is not open.
```

So for type-alias syntax, the defined type is closed iff the RHS type is closed.

A type may have exactly one "open" instance, or many "closed" instances.

If the equivalent of a WTy2 "open" type in Rust is considered to be a blanket impl (as opposed to an impl for a concrete type), then the rules Rust uses are actually a bit more flexible. It allows:

```rs
struct S1;
struct S2;
struct S3;

trait T1 {}
trait T2 {}
trait T3 {}

impl <T: T2> T1 for T {}

impl T1 for S1 {}

impl T1 for S2 {}

// This impl, if uncommented, will cause an overlap with the blanket impl, but
// only indirectly - the error message will not point to this line!
//impl T2 for S2 {}
```

In my opinion, this is a mistake: the error message not highlighting the correct line is confusing to the programmer, the rules which allow this are necessarily more complicated and I would argue this pattern has very limited utility (OOP has proven that default instances for a type in terms of another are useful, but this can be achieved through much more principled means like Haskell's `deriving via`).

## Orphan Rules

To avoid overlap even when multiple modules are involved, WTy2 disallows "orphan instances". The gist is that, either the instance-d type and or every outer constructor of the instance head must be defined in the same module as the instance declaration.

Haskell only reports a warning on orphan instances rather than an outright error. I believe this is a mistake - orphan instances can trivially lead to overlap and overlap can lead to incoherence.

[^note]: This (perhaps not entirely coincidentally) closely mirrors the syntactic restriction on [Haskell 2010](https://www.haskell.org/onlinereport/haskell2010/haskellch4.html#x10-770004.3.2) instance heads (i.e: without `-XFlexibleInstances`).
