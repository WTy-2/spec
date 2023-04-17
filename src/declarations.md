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
type MonadC[c: Type] {

    fun fmap[a: c, b: c](x: self(a), f: a -> b): self(b)

    fun pure[a: c](x: a): self(a)

    fun (>>=)[a: c, b: c](x: self(a), f: a -> self(b)): self(b)
} => c -> Any
```

[^note]

## Instance Declarations

## Data Declarations

Data declarations define "variants". These are simply constructors that create values.

## Function/Constant/Proof Declarations

[^note]: Note that with function contravariance, we could also have `f: c -> b` in `fmap`, and if `MonadC` itself was contravariant, `x: self(c)` and then no need for `a`. WTy2 currently does not support variance due to added complexity, but code like this shows places where it could be very useful.

Also note the the `a: c` and `b: c` constraints here are slightly tiresome. Arguably these could be inferred from their use as arguments to `self`. There has been some research in Haskell on doing this inference https://richarde.dev/papers/2020/partialdata/partialdata.pdf and it appears to be highly effective in practice (though it is unclear how well it will extend to a language with subtyping).
