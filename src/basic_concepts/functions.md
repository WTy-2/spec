# Functions

WTy2 is a functional programming language, and as such, functions are first-class. Any variable that implements `Fun` is a function.

## Lambda-Blocks

In WTy2, braces (`{}`) are used to denote a lambda. Inside the braces, there can be:

- Just an expression. In this case the argument type is inferred, and can be referred to in the expression as `it`. The really powerful part here is that variables `varName` are attempted to be resolved as fields of `it` first (as in `it.varName`). This is similar to `this` being in scope allowing access to fields and methods of the class without needing to specify the receiver in OOP languages.
- A "`\`" followed by an irrefutable pattern which is bound to by the argument, a "`|->`", and the return expression.
- Multiple `|`s, each followed by a pattern, a `|->` and a return expression for if that match succeeds.

## Function Definitions

WTy2 is a functional programming language, meaning functions are first class and can be bound to variables. Using only existing introduced syntax, a function that adds three integers can be defined like so:

```wty2
addTriple: Tuple(Int, Int, Int) -> Int = { \(x, y, z) |-> x + y + z };
```

Using record syntax (and implicit `it` scoping), we can achieve this in a slightly cleaner way as

```wty2
addTriple: (x: Int, y: Int, z: Int) -> Int = { x + y + z };
```

WTy2 introduces an additional way to define functions, which looks closer to imperative programming languages:

```wty2
addTriple(x: Int, y: Int, z: Int): Int = x + y + z;
```

In general `f(t): u` can be thought of as equivalent to...

- If `t` is a type (including record types), `f: t -> u`
- If `t` is a list of types, `f: Tuple(t) -> u` [^note]

With one extra special case: if the syntax is used as the LHS of an assignment (like above) then the braces around the RHS expression are implicit.

## Recursion

TODO

[^note] This rule is specifically intended to make signatures of higher-order functions easier to write.
