# Functions

WTy2 is a functional programming language, and as such, functions are first-class. Any variable that implements `Fun` is a function.

## Lambda-Blocks

In WTy2, braces (`{}`) are used to denote a lambda. Inside the braces, there can be:

- Just an expression. In this case the argument type is inferred, and can be referred to in the expression as `it`. The really powerful part here is that variables `varName` are attempted to be resolved as fields of `it` first (as in `it.varName`). This is similar to `this` being in scope allowing access to fields and methods of the class without needing to specify the receiver in OOP languages.
- A "`\`" followed by an irrefutable pattern which is bound to by the argument, an `.`[^note] and the return expression.
- Multiple `|`s, each followed by a pattern, a `.` and a return expression for if that match succeeds.

## Function Definitions

WTy2 is a functional programming language, meaning functions are first class and can be bound to variables. Using only existing introduced syntax, a function that adds three integers can be defined like so:

```wty2
addThree: Tuple(Int, Int, Int) -> Int = { \(x, y, z). x + y + z };
```

Using record syntax, we can achieve this in a slightly cleaner way as

```wty2
addThree: (x: Int, y: Int, z: Int) -> Int = { x + y + z };
```

WTy2 introduces an additional way to define functions, which looks closer to imperative programming languages:

```wty2
addThree(x: Int, y: Int, z: Int): Int = x + y + z;
```

In general `f(t): u` can be thought of as equivalent to...

- If `t` is a type (including record types), `f: t -> u`
- If `t` is a list of types, `f: Tuple(t) -> u`

With one difference: if it is the LHS of an assignment (like above) then the braces around the RHS expression are implicit.

## Recursion

TODO

[^note]: A seemingly more natural (and more popular) choice here is to use an arrow like `->` or `=>` as the separator. WTy2 instead follows lambda calculus with `.` to avoid unnecessary punning (`(->)`/`(=>)` are already type operator used to construct function types/constraint implications). `.` on the other hand is never parsed as an operator, already being used for record field access and uniform calling syntax.
