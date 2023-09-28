# The Mono Mode

Full monomorphisation in general does not make sense with dependent types. Then again, neither does enforced linear types everywhere in a functional language focussed on ergonomics, but that hasn't stopped Haskell, OCAML, etc... managing to implement opt-in programmer-visible versions of such a feature. Therefore, I propose a mode axis for guarantees about constant folding/static dispatch - the polymorphism axis.

A variable can either be annoted with a `mono` or a `poly` mode with `mono <: poly` subtyping relation. Informally, `mono` represents that the value of a variable can be computed at compile-time.

As WTy2 is pure, so top-level variables inherently meet the condition of `mono`, but variables inside functions are more interesting.

Allowing function arguments to be `mono` _would_ provide the programmer a guarantee that it would always be called with constant value, but it is worth considering if such a guarantee is actually _useful_.

Instead, arguments can either be `poly`, or be generic over the polymorphism mode, written as `mono(<Variable>) x: <Type>`. The polymorphism of local variables and the return value of the function can then be given in terms of an intersection of these variables, separated with `&`.

When a function's return type is `poly` mode, this is desugared into `mono` but dependent on all arguments.

## Design Questions

- How does this interact with higher-order functions?
