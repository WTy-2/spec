# Utilities

WTy2's syntax is designed for allowing defining functions that appear similar to built-in language constructsof other languages. Below are a few examples:

## Do

Inspired by Haskell

```WTy2
do(f: () -> t): t = f()
```

This is primarily useful when defining functions in `f(x: t): u = ...`-style where you still want to use a block to define locals or use `do`-notation sugar [^note]. E.g:

```WTy2
foo(x: Int, y: Int): Int = do {
    z := x * 3;
    w := y - 2;
    (z * z + w) / (x + w)
}
```

## If-Elif-Else

Inspired by oh-so-many programming languages, maybe Algol 60 was first?

```WTy2
if[t: Type](c: Bool, e: () -> t): Maybe(t) = with(c) {
| True  -> Just(e()),
| False -> Nothing
}
```

```
elif[t: Type](x: Maybe(t), c: Bool, e: () -> t): Maybe(t) = with(x, c) {
| (Just(y), _)     -> x,
| (Nothing, True)  -> Just(e()),
| (Nothing, False) -> Nothing,
}
```

```WTy2
else[t: Type](x: Maybe(t), e: () -> t): t = with(x) {
| Just(y) -> y,
| Nothing -> e()
}
```

E.g:

```WTy2
_ := if(True) {
    "Case one!"
}.elif(False) {
    "Case two!"
}.else {
    "Case three!"
}
```

## Fun

Inspired by Kotlin

```WTy2
fun[r: Type](t: Type, f: t -> r): t -> r = f
```

In WTy2, serves to annotate the argument type of a function without having to use arrow-lambda syntax.

## Lazy

Inspired by Scala

```WTy2
lazy[t: Type](f: () -> t): () -> t = f
```

Note this does not perform any memoisation (call-by-need). This would require some form of mutability to implement.

## The

Inspired by Idris

```
the(x: t, t: Type): t = x
```

Annotates the type of `x`.

## With and Also

Inspired by Kotlin

```WTy2
with[t: Type, r: Type](x: t, f: t -> r): r = f(x)
```

```WTy2
also[t: Type, m: Applicative](x: t, f: t -> m()): m(t) = f(x) $> x
```

`with` fits really well with lambda-case syntax as a way to pattern match on a variable. E.g:

```WTy2
_ := with(x) {
| 0 -> "Zero!",
| 1 -> "One!",
| _ -> "Other!"
}
```

[^note] Of course in WTy2, `do`-notation is not really related to the `do` utility defined here; it can be used in any block. "Braces-notation" doesn't quite roll of the tongue though...
