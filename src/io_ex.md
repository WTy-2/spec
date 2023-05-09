# IO and the Ex Monad

WTy2 is an impure language. Side-effects like printing to the terminal can occur at any time without requiring monads.

However, if values are read from the outside world, they do need to be wrapped in the `Ex` monad.

The purpose of this is twofold: we make explicit the CPS conversion which allows for efficient monomorphisation, and we get some nice properties like parametricity.

As an explanation on the first point, imagine we have a function `readBool() -> Ex(Bool)` and then pass the returned integer to functions `f` and `g`.

```WTy2
x <- readBool();
f(x);
g(x);
```

This is transformed into

```WTy2
readBool() >>= { f(it); g(it); }
```

This allows the compiler to analyse the closure `{ f(it); g(it); }` and potentially specialise it for `True` and `False`. If both `f` and `g` switch on the boolean, we can compile this into a single switch (without relying on inlining, which while very useful, has limitations with regards to code bloat: if `f` and `g` are very large functions, and they were called in many places, it would be much more desirable to compile only two copies of `f` and `g` for the `True` and `False` cases, instead of a version for every single call).

The `Ex` monad is used to encourage code of this style, while making it obvious where extra closures are coming from. For example, if we did not have the `Ex` monad, then it would be very unclear if code like:

```
x = readBool();
f(x);
g(x);
```

was compiled into `x = readBool(); with(x) { f(it); g(it); }` or not.

## Parametricity

With `Ex`, WTy2 also obeys a weakened form a parametricity. In Haskell, a non-partial function with type signature `forall t. t -> t -> t` can (in the absense of hacks like `unsafePeformIO`) only have two implementations (return the first element, or return the second).

In WTy2, a function with type signature `[t: Type](a: t, b: t) -> t` also can only return the first element or the second, but it may perform other side-effects as well (the return value just cannot be influenced by those side-effects).

## Mutability

The path towards adding mutability into WTy2 is currently unclear. One potential option is to enforce that mutable variables are wrapped in the `Ex` monad, effectively meaning reading mutable variables is treated as an IO operation that could return any value.
