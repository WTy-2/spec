# Syntax Debates

<https://wiki.haskell.org/Wadler's_Law>

Syntax is hard, and discussions about it generally go nowhere...

...so let's discuss syntax!

## Enforced Capitalisation Convention

In functional languages, it is often easy to have an ambiguity with infallible pattern matches vs function definitions. Consider in Haskell:

```hs
foo = ...
  where
    {- Something -} i = ...
```

Haskell gets around the ambiguity here by enforcing a simple capitalisation convention: constructors must start with a capital letter, and functions must start with a lowercase one.

```hs
foo = ...
  where
    Bar i = ... -- Pattern match
    bar i = ... -- Local function definition
```

WTy2 has a similar potential ambiguity, and it is even more prevalent, given the rule that `f: t -> u` can be written as `f(t): u` (so the ambiguity is possible even inside patterns).

One obvious solution is to copy Haskell's homework: data constructors are capitalised and variables are not. This rule fits well with WTy2's syntax in general: types should be capitalised, and this makes sense because types, like data constructors, are also matchable.

However, there are downsides. The most compelling from my perspective is how non-latin alphabets do not necessarily contain capital letters. I do not believe this is quite as significant of an issue as sometimes presented (a convention for code written in those alphabets could easily be created where data constructors/types must start with a latin-alphabet capital letter, say `M` for `matchable`) but even so, it is not ideal.

The alternative is to use some dedicated keyword/symbol to disambuate. Perhaps `fn` prefixing all functions written in `f(t): u`-style or `match` prefixing all infallible pattern matches.

Using `fn` keyword on functions

```WTy2
takesFunctionAndMatches(fn foo(Int): Int, Foo(x)) {
    fn bar(y: Int) = foo(y);
    Bar(z) = x;
    ...
}
```

Using `match` keyword on matches

```
takesFunctionAndMatches(foo(Int): Int, match Foo(x)) {
    bar(y: Int) = foo(y);
    match Bar(z) = x;
}
```

Perhaps some compromise is possible: capitalised = assume match, lowercase = assume function but then can use either keyword to override. This might be an overkill solution, but it seems promising.

## Binding/Constraint Operators

I have a few alternatives that I don't hate, but nothing I love:

### `(<:)` Instance Head Operator

| Binding  | Constraint                     | Meaning                        |
| -------- | ------------------------------ | ------------------------------ |
| `x  : t` | `x :: t`                       | `x` is of type `t`             |
| `t <: u` | <code>t <\| u</code>/`t <:: u` | `t` is an instance head of `u` |
| `x ~: y` | `x ~ y`                        | `x` reduces to `y`             |

### `(:=>)` Instance Head Operator

| Binding   | Constraint            | Meaning                        |
| --------- | --------------------- | ------------------------------ |
| `x :   t` | `x :: t`              | `x` is of type `t`             |
| `t :=> u` | <code>t \|=> u</code> | `t` is an instance head of `u` |
| `x :~  y` | `x ~ y`               | `x` reduces to `y`             |

`(<:)` has the advantage of already being a common symbol with a somewhat similar meaning (subtype vs instance head). On the other hand, it not being exactly the same, and WTy2 also having a notion of subtyping could get quite confusing (e.g: `Int <: Monoid` but we would never have `Semigroup <: Monoid`).
`(:=>)` in my opinion is also slightly confusing though. It looks very similar to implies.

Another option is to rely on keywords. Perhaps `x is t` instead of `x :: t` and `instance t for u` as the instance-head operator. Note `instance ... for` already has to be a keyword to actually write instances, but I don't love how this makes the syntax more inconsistent.
