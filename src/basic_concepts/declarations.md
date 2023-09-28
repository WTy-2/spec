# Declarations

WTy2 supports top-level bindings in the form of "declarations".

All named declarations can be prefixed with visibility annotations.

## Type Declarations

Type declarations define "types". Note types in WTy2 are quite different from types in many other languages: for instance, types can be open, allowing instances for the type to be made apart from it's declaration.

Note "type"s in WTy2 were originally named "trait"s for this very reason. I have since decided it makes more sense to just call them "type"s because there is no other construct in the language which fits the same role.

Open types can have a number of associated functions that must be defined at instances of that type. In these functions, there is an implicit constant `self: Type` in scope which refers to the instance head.

Supertypes of the type are optionally explicitly declared after the `{}`s with `=>`.

As an example, here is the `MonadC` type, which is similar to a `Monad` in functional languages like `Haskell` but is not total (meaning it can support data structures like sets and hashmaps)

```WTy2
type MonadC(c: Type) {

    fmap[a: c, b: c](x: self(a), f: a -> b): self(b)

    pure[a: c](x: a): self(a)

    (>>=)[a: c, b: c](x: self(a), f: a -> self(b)): self(b)

} => c -> Any
```

[^note]

### Type Synonyms

Sometimes a type is desired that is simply a synonym for some other more elaborate type. As types are first class, this can be implemented in WTy2 just with ordinary functions; however, functions have slightly different semantics to distinct types (functions reduce, while types do not) which can impact typechecking and inference.

Type synonyms can be alternatively written by simply declaring a type with the appropriate supertype constraint and then writing a single instance:

```WTy2
type Alias {} => Foo

inst Alias for Foo
```

Because this pattern is so common, WTy2 provides syntax sugar for it:

```
type Alias = Foo
```

As coherence rules enforce that instances where the instance head is an open type prevent any other instances being written, it is suggested that ideal practice when writing an open-head instance is to instead write a type alias. Implementations may wish to warn the programmer in scenarios where this is not done.

## Instance Declarations

Instance declarations in WTy2 are denoted with the `inst` keyword followed by the open, inst-able type and the instance head (separated with `for`).

The instance head type must not have any stuck terms and must not overlap with other instance types (the conditions of overlap are given fully in [Coherence](./coherence.md)).

## Data Declarations

Data declarations define "variants". These appear similar to functions but instead of producing arbitrary values after executing some computation, they create tagged versions of whatever type they are declared to take as parameter.

The suggested implementation is for tags to all share the same 32-bit space of values. As an optimisation, it is suggested that this tag is elided in cases where it is known at compile-time.

I.e: In the below program

```WTy2
data Foo(Bar)

x: Bar = ...
y: Foo = Foo(x)
```

Both `Foo` and `Bar` should have equivalent runtime representations.

Handling variance while ensuring unnecessary tag information is not stored at runtime is not a trivial problem: for how this is solved specifically with regards to recursive types (which is the arguably most awkward one), see the dedicated section.

## Function/Constant Declarations

Ordinary terms like functions or constants can also be defined as top level bindings. They do not need to be prefixed with any keyword.

### Proof Declarations

However, functions can be optionally be prefixed with the `proof` keyword. This changes the semantics of the binding, allowing calls to the function to be inserted automatically to aid typechecking. `proof`s my also be anonymous. See the [dedicated section](../dependent_types/proofs.md) on `proof`s for more information.

[^note]: The the `a: c` and `b: c` constraints here are slightly tiresome. Arguably these could be inferred from their use as arguments to `self`. There has been some research in Haskell on doing this inference https://richarde.dev/papers/2020/partialdata/partialdata.pdf and it appears to be highly effective in practice. The downside of doing this in the general case (adding constraints implicitly to a type signature until the signature typechecks) is that more changes can become breaking (see [Rust FFC 2089](https://github.com/rust-lang/rfcs/blob/master/text/2089-implied-bounds.md))