# Declarations

WTy2 supports top-level bindings in the form of "declarations".

All named declarations can be prefixed with visibility annotations.

## Type Declarations

Type declarations define "types". Note types in WTy2 are quite different from types in many other languages: for instance, types can be open, allowing instances for the type to be made apart from it's declaration.

Note "type"s in WTy2 were originally named "trait"s for this very reason. I have since decided it makes more sense to just call them "type"s because there is no other construct in the language which fits the role.

Open types can have a number of associated functions that must be defined at instances of that type. In these functions, there is an implicit constant `self: Type` in scope which refers to the intance head.

Supertypes of the type are optionally explicitly declared after the `{}`s with `=>`.

As an example, here is the `MonadC` type, which is similar to a `Monad` in functional languages like `Haskell` but is not total (meaning it can support data structures like sets and hashmaps)

```WTy2
type MonadC(c: Type) {

    fun fmap[a: c, b: c](x: self(a), f: a -> b): self(b)

    fun pure[a: c](x: a): self(a)

    fun (>>=)[a: c, b: c](x: self(a), f: a -> self(b)): self(b)

} => c -> Any
```

[^note]

### Type Synonyms

Sometimes a type is desired that is simply a synonym for some other more elaborate type. As types are first class, this can be implemented in WTy2 just with ordinary functions; however, functions have slightly different semantics to distinct types (functions reduce, while types do not) which can impact typechecking and inference.

Type synonyms can be alternatively written by simply declaring a type with the appropriate supertype constraint and then writing a single instance:

```WTy2
type Alias {} => Foo

default instance Alias for Foo
```

Because this pattern is so common, WTy2 provides syntax sugar for it:

```
type Alias = Foo
```

As coherence rules enforce that instances where the instance head is an open type prevent any other instances being written, it is suggested that ideal practice when writing an open-head instance is to instead write a type alias. Implementations may wish to warn the programmer in scenarios where this is not done.

## Instance Declarations

### Coherence and Orphan Rules

It is critical to soundess of the WTy2 language that instances do not overlap. The rules for avioding overlap can be summarised as:

- If the instance head is open, that instance must be in the same module as the type declaration and no other instances can be written.
- If the instance head is closed, either the instance must be in the same module as the type declaration, or all implementing patterns must contain at least one variant tag that was defined in the same module.

### Named Instances

WTy2 supports "named instances" as an alternative to the newtype pattern.

The exact semantics and syntax of this feature are WIP, but the goal is to have something at least as powerful as Haskell's "deriving via" extension: enabling overridable default superclass definitions.

## Data Declarations

Data declarations define "variants". These appear similar to functions but instead of producing arbitrary values after executing some computation, they create tagged versions of whatever type they are declared to take as parameter.

The suggested implementation is for tags to all share the same 32-bit space of values. If it is possible at compile-time (via types) to know the value of a tag, then it should not be present at runtime.

I.e: In the below program

```WTy2
data Foo(Bar)

x: Bar = ...
y: Foo = Foo(x)
```

Both `Foo` and `Bar` should have equivalent runtime representations.

## Function/Constant/Proof Declarations

Ordinary terms can also be defined as top level bindings. They must, however be prefixed with a keyword declaring their purpose.

### Fun/Const

Ignoring proofs for the moment, the `fun` keyword must prefix any top level binding which implements `Callable` (a built-in type for any function-like variable). The `const` keyword must prefix any top level binding that is not `Callable`. The purpose of these keywords is entirely for readability: they do not alter syntax or semantics of the binding.

### Design Note: Breaking Changes

This decision has an arguably non-ideal side effect: Writing new instances of `Callable` for any public type is now a breaking change as downstream modules must replace `const` with `fun`.

On one hand, this could perhaps be justified: making something a function that wasn't previously is quite a significant change; however, it might also turn out that being able to allow existing types be used as functions is very powerful.

Some alternatives might be to have `const`/`fun` be only a syntactic restriction (it matters if the annotated type actually contains an `->`/paramater syntax is used) rather than if an instance exists, or to do away with the `fun`/`const` keywords entirely (are they really necessary?).

### Proof

The `proof` keyword is more interesting. It changes the semantics of the binding, allowing calls to the function to be inserted to aid typechecking, and allows for eliding the function name. See the dedicated section on proofs for more information.

[^note]: Note that with function contravariance, we could also have `f: c -> b` in `fmap`, and if `MonadC` itself was contravariant, `x: self(c)` and then no need for `a`. WTy2 currently does not support variance due to added complexity, but code like this shows places where it could be very useful.

Also note the the `a: c` and `b: c` constraints here are slightly tiresome. Arguably these could be inferred from their use as arguments to `self`. There has been some research in Haskell on doing this inference https://richarde.dev/papers/2020/partialdata/partialdata.pdf and it appears to be highly effective in practice (though it is unclear how well it will extend to a language with subtyping).
