# Functions

Functions in WTy2 can be created with function declarations or lambda.

## Lambda-Blocks

In WTy2, braces (`{}`) are used to denote a lambda. Inside the braces, there can be:

- Just an expression. In this case the argument type is inferred, and can be referred to in the expression as `it`. The really powerful part here is that variables `varName` are attempted to be resolved as fields of `it` first (as in `it.varName`). This is similar to `this` being in scope allowing access to fields and methods of the class without needing to specify the receiver in OOP languages.
- A "`\`" followed by an irrefutable pattern which is bound to by the argument, an `->` and the return expression.
- Multiple `|`s, each followed by a pattern, a `->` and a return expression for if that match succeeds.

## Function Definitions

WTy2 is a functional programming language, meaning functions are first class and can be bound to variables. Using only existing introduced syntax, a function that adds three integers can be defined like so:

```wty2
addThree: (Int, Int, Int) -> Int = { \(x, y, z) -> x + y + z };
```

Using record syntax, we can achieve this in a slightly cleaner way as

```wty2
addThree: (x: Int, y: Int, z: Int) -> Int = { x + y + z };
```

WTy2 introduces an additional way to define functions, which looks closer to imperative programming languages:

```wty2
addThree(x: Int, y: Int, z: Int): Int = x + y + z;
```

In general `f(t): u` can be used anywhere `f: t -> u` would also fit, with one small difference. If it is the LHS of an assignment (like above, then the braces around the RHS expression are implicit).

## Recursion

In WTy2, the source syntax allows functions to recursively call themselves or others defined in the same scope freely, making this simple for the programmer.

Functions in WTy2 are both unboxed and capturing by default, so implementing recursion is not quite as simple as one might assume. Consider in Rust how closures cannot refer to themselves. This can be worked around with a few patterns, such as creating a non-capturing recursive `fn` item inside the closure and passing in the enviroment, but this is quite clunky.

```rs
let step = 1;
let foo = |x| {
    fn foo_rec(step: i32, x: i32) -> i32 {
        if (x <= 0) { 0 } else { x + foo_rec(step, x-step) }
    }
    foo_rec(step, x)
};
println!("{}", foo(10));
```

In WTy2, the source syntax allows functions to recursively call themselves or others defined in the same scope freely, making this simple for the programmer. The interesting part is the compilation strategy:

Functions that just call themselves are easy. As functions are compiled into structures with a `(->)` instance, the `call` method can just recursively call itself.

Mutually recursive functions are more challenging. A naive approach would be to include each

First, functions are placed into recursive groups by forming a graph of which call each other.

n the back-end

In principle, this

What is happening here is that

In WTy2 recursion is simple! Functions can refer to themselves or other functions in the same or above scope in their bodies. There is no dedicated `letrec` binding or similar: all function bindings are recursive. Variables that are not functions (RHS is not surrounded by - possibly implicit - braces)
