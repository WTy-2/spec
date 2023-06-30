# Functions

Functions in WTy2 can be created with function declarations or lambda.

## Lambda-Blocks

In WTy2, braces (`{}`) are used to denote a lambda. Inside the braces, there can be:

- Just an expression (in this case the argument type is inferred, and can be referred to in the expression as `it`)
- A "`\`" followed by an irrefutable pattern which is bound to by the argument, an `->` and the return expression.
- Multiple `|`s, each followed by a pattern, a `->` and a return expression for if that match succeeds.
