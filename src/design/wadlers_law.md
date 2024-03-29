# Syntax Debates

<https://wiki.haskell.org/Wadler's_Law>

Syntax is hard, and discussions about it tends to go nowhere...

...so let's discuss syntax!

## Enforced Capitalisation Convention

In functional languages, it is easy to have an ambiguity with irrefutable pattern matches vs variable bindings. Consider in Haskell:

```hs
foo = ...
  where
    {- Function or Constructor -} i = ...
```

Haskell gets around the ambiguity here by enforcing a simple capitalisation convention: constructors must start with a capital letter, and variables must start with a lowercase one.

```hs
foo = ...
  where
    Bar i = ... -- Pattern match
    bar i = ... -- Local function definition
```

As long as, the language allows nullary data constructors data constructors this does not just apply to functions, and the ambiguity in WTy2 specifically is even more prevalent, given the rule that `f: t -> u` can be written as `f(t): u`.

One obvious solution is to copy Haskell's homework: data constructors are capitalised and variables are not. This rule fits well with WTy2's style in general: types should be capitalised, and this makes sense because types, like data constructors, are matchable.

However, there are downsides. The most compelling from my perspective is how non-latin alphabets do not necessarily contain capital letters. I do not believe this is quite as significant of an issue as sometimes presented (a convention for code written in those alphabets could easily be created where data constructors/types must start with a latin-alphabet capital letter, say `M` for `matchable`) but even so, it is not ideal.

The alternative is to use some dedicated keyword/symbol to disambuate. Perhaps `def` prefixing all variable bindings or `match` prefixing all irrefutable pattern matches.

Using `def` keyword on functions

```WTy2
def takesFunctionAndMatches(def foo(Int): Int, MkFoo(x): Foo) := do {
    def bar(y: Int) := foo(y);
    MkBar(z) := x;
}
```

Using `match` keyword on matches

```
takesFunctionAndMatches(foo(Int): Int, match MkFoo(x): Foo) := do {
    bar(y: Int) := foo(y);
    match MkBar(z) := x;
}
```

Neither alternative feels great though coming from Haskell. There is no reward for following the capitalisation convention! My current plan is therefore a compromise: capitalised = assume match, lowercase = assume variable, but the programmer can also use either keyword to override. This might be an overkill solution, but it seems promising (and actually quite easy to parse!).

## Binding/Constraint Operators

Currently, I am liking:

| Binding  | Constraint          | Meaning                               |
| -------- | ------------------- | ------------------------------------- |
| `x : t`  | `x :: t`            | `x` has type `t`                      |
| `t <: u` | <code>t <\| </code> | `t` is a subtype of `u`               |
| `x : 'y` | `x ~ y`             | `x` and `y` are propositionally equal |

But there are a few possible alternatives and questions:

- Use keywords/infix functions instead of operators. E.g: `x is t`/`x in t` instead of `x :: t`.
- Make the common pattern for constraint (except for `(~)`) be to add a second colon. E.g: `(<::)` instead of `(<|)`.
- Add a dedicated binding operator for `(~)`, such as `(~:)`.
- Instead of `(::)`, all types could implement `Any -> Constraint` so instead of `x :: Int` you would write `Int(x)` (a bit Verse-like).
- With `(:)`, `(::)`, and `(<:)` taken, what should cons be? `(:>)` could very easily be misinterpreted as a flipped version of `(<:)`. Perhaps `(:;)` or `(:.)`?

## Implicit Braces

WTy2 contains a few built-in dependent type operators (`(->)`, `(~>)`) which automatically add braces to the RHS if the type expression does not type-check without. The advantage is obvious: cleaner syntax. All non-dependent functions requiring braces around the result type (e.g: `Int -> { Int }`) (or using a different arrow) is ugly.

That said, this is clearly a special case, and special cases generally do not lead to a cleaner and easier-to-learn language. It might be worth considering if this implicit lambda-abstraction functionality is something that should be possible to opt into with other operators.

## Unicode

TODO

- `∀` should be parsed as a letter to allow `∀ := for`.

## Lambda/Pattern Match Syntax

Currently, for lambdas that bind variables, I like the look of the following syntax: `{ \Pat -> ...}` for irrefutable patterns and `{ | Pat1 -> ..., | Pat2 -> ... }` for lambda-case expressions.

However, this does overload the meaning of `->` somewhat. Lambda-calculus gives us an alternative separator `.` as in `{ \Pat. ... }` which I don't hate, but I find `{ | Pat1. ..., | Pat2. ... }` very ugly. `{ \Pat1. ..., \Pat2. ... }` is better but now no longer really looks like a pattern match.

Yet another alternative is to use an arrow with a bar `|->`. This is justified via numerous FP papers which use the LaTeX equivalent of this symbol, but of course transliterated into ASCII, it does look somewhat ugly.

## "Such That" Operator

There appears to not really be a standard operator for "such that" in mathematics (except in set comprehensions, but `(:)` and `(|)` are already taken), and the most common, (`∋`)[^note], does not have a reasonable ASCII approximation (at least that I can think of).

`(<<=)` I think has some advantages in that it is very clearly not symmetrical (IMO symmetrical-looking glyphs as operators should really only identify associative, if not commutative operations) and it is vaguely reminiscent of `(=>)` which in Haskell is used to represent the curried version of a similar concept. On the other hand, it (surprisingly) doesn't appear to have a unicode equivalent (there are double-headed arrows, and double-lined arrows, but apparently no double-headed-double-lined arrows...).

On the other hand, a very common operator being three-characters long is a bit unfortunate. `(-<)` is IMO quite aesthetically nice and I do also quite like `($)` given how (if you squint) it looks a bit like an `S` and a `T` overlaid.

[^note]: A few examples of various "such that" operators can be found at https://math.stackexchange.com/a/2777911
