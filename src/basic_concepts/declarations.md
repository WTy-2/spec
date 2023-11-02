# Declarations

WTy2 supports top-level bindings in the form of "declarations".

All named declarations can be prefixed with visibility annotations.

## Type Declarations

Type declarations create new types or type constructors. Types formed with constructors declared via type declarations are irreducible terms of type `Type`.

Unlike many other formal type systems, user-defined types in WTy2 can be "open", meaning we can, in a distinct module, declare more sets of terms as members of the original type.

Open types can have a number of associated members (specifically, functions) that must be defined for all implementors of that type. The type signatures of these functions can refer to the implementor of the type: `self`. Indeed, each of these functions must take at least one explicit (i.e: runtime relevant) argument (the "receiver") of type `self`, `impl(self)` or `'self` (a practical limitation to make type inference and compiling to VTables possible).

Super-constraints that all implementors must obey can also be declared using `<<=` followed by an function of type `(self: DeclaredType) -> Constraint`. This introduces `for(self: DeclaredType) { f(self) }` (where `f` is the super-constraint function) into the context, which is applied eagerly during typechecking, so care must be taken by the user to avoid writing super-constraints that loop. Requiring laws without the eager-expansion behaviour can be done through requiring function members of appropriate type (e.g: `fmap_id(f: self): Proof(fmap?(f: id) ~ id)`)

As an example, here is the `ParMonad` type, which is similar to a `Monad` in functional languages like `Haskell` but does not require the type constructor to be total (meaning it can support data structures like sets and hashmaps).

```WTy2
type ParMonad where {

    fmap[a: arg(self), b: arg(self)](x: self(a), f: a -> b): self(b)

    pure[a: arg(self)](m: 'self, x: a): self(a)

    (>>=)[a: arg(self), b: arg(self)](x: self(a), f: a -> self(b)): self(b)

} <<= { [domain: Type] self :: domain ~> Type };
```

[^note]

### Type Synonyms

Sometimes a type is desired that is simply a synonym for some other more elaborate type. As types are first class, this can be implemented in WTy2 just with ordinary terms; however, term definitions have slightly different semantics to created types (terms reduce, while types do not) which can impact typechecking and inference.

Type synonyms can be alternatively written by declaring a type with the appropriate super-constraint and then writing instances to cover every value (if the type being aliased is open type, the instance head can be `impl(OpenType)`).

```WTy2
datatype Foo
  | MkFoo
  ;

type Alias {} <<= { self <| Foo };

inst Alias for MkFoo;
```

This pattern is quite clunky (especially for closed types with many constructors), so WTy2 provides syntax sugar for it:

```
type Alias = Foo;
```

As coherence rules enforce that instances where the instance head is an open type prevent any other instances being written, it is suggested that ideal practice when writing an open-head instance is to instead write a type alias. Implementations may wish to warn the programmer in when this is not done.

## Instance Declarations

Instance declarations in WTy2 are denoted with the `inst` keyword followed by the open, inst-able type and the instance head (separated with `for`). Every instance adds `Head :: InstableType` to the context.

The instance head type must not have any stuck terms and must not overlap with other instance types (the conditions of overlap are given fully in [Coherence](./coherence.md)).

## Data Declarations

Data declarations define "variants" or "tags". These are similar to functions but instead of producing arbitrary values after executing some computation, they create tagged versions of whatever type they are declared to take as parameter.

The suggested implementation is for tags to all share the same 32-bit space of values. As an optimisation, it is suggested that this tag is elided in cases where it is known at compile-time.

I.e: In the below program

```WTy2
data Foo(Bar)

x: Bar = ...
y: Foo = Foo(x)
```

Both `Foo` and `Bar` should have equivalent runtime representations.

Handling variance while ensuring unnecessary tag information is not stored at runtime is not a trivial problem: for how this is solved specifically with regards to recursive types, see the dedicated section.

## Datatype Declarations

Unfortunately, some types might need many variants that would quickly fill up a 32-bit space of values (for example: int32s). A datatype declaration looks a bit closer to an inductive type declaration in other functional languages, and is implemented by having an outer tag which takes one slot of the 32-bit space, then allowing the variants all make use of a separate space of values.

Datatype declarations are also just convenient in allowing the user to simultaneously define a type and set of variants.

```WTy2
datatype Bool
  | True
  | False
  ;
```

## Function/Constant Declarations

Ordinary terms like functions or constants can also be defined as top level bindings. They do not need to be prefixed with any keyword.

### Proof Declarations

However, functions can be optionally be prefixed with the `proof` keyword. This changes the semantics of the binding, allowing calls to the function to be inserted automatically to aid typechecking. `proof`s my also be anonymous. See the [dedicated section](../dependent_types/proofs.md) on `proof`s for more information.

[^note]: The the `a: arg(self)` and `b: arg(self)` constraints here are slightly tiresome. Arguably these could be inferred from their use as arguments to `self`. There has been some research in Haskell on doing this inference https://richarde.dev/papers/2020/partialdata/partialdata.pdf and it appears to be highly effective in practice. The downside of doing this in the general case (adding constraints implicitly to a type signature until the signature typechecks) is that more changes can become breaking (see [Rust FFC 2089](https://github.com/rust-lang/rfcs/blob/master/text/2089-implied-bounds.md))
