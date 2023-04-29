# Utilities

WTy2's syntax is very flexible, which allows for functions to take the role of what are typically built-in language constructs in other languages. Below are a few examples:

## Do

Inspired by Haskell

```WTy2
do(f: () -> t): t = f()
```

## If-Else

```WTy2
if[t: Type](c: Bool, e: () -> t): Maybe(t) = match(c)
    case(False) = Nothing
    case(True)  = Just(e())
```

```WTy2
else[t: Type](x: Maybe(t), e: () -> t): t = match(x)
    case(Just(y)) = y
    case(Nothing) = e()
```

## Fun

Inspired by Kotlin

```WTy2
fun[r: Type](t: Type, f: t -> r): t -> r = f
```

## The

Inspired by Idris

```
the(t: Type, x: t): t = x
```

## With and Also

Inspired by Kotlin

```WTy2
with[t: Type, r: Type](x: t, f: t -> r): r = f(x)
```

```WTy2
also[t: Type](x: t, f: t -> ()): t = do {
    f(x);
    x
}
```

## Design Note: Loops

WTy2 is primarily a functional language and so higher order functions like `map` are recommended over loop constructs. In fact, the approach for handling side-effects in WTy2 is currently a WIP, and loops are only really useful if side-effects like mutability possible.
