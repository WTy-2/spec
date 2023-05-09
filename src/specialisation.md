# Specialisation

WTy2 does NOT currently feature "specialisation" as a high-level language feature (à la Rust), being able to override typeclass instances for specific types. Instead, specialisation in the context of WTy2 refers to an optimisation strategy that is key to get highly polymorphic WTy2 programs to perform well.

Specialisation can be thought of a bit like a "lite" version of monomorphisation. Types can be infinitely large in WTy2, so full monomorphisation as a compilation strategy is infeasible; however, where possible, compiling separate versions of functions for specific argument values (or sets of argument values) and dispatching to those specialised versions can get most of the benefits (the main downside being the compiler now has to decide on a strategy for deciding when to specialise).

Some possible heuristics for deciding when specialisation might be a good idea are:

- A function is explicitly called somewhere in the program with an argument of more constrained type than the function accepts. For example, if a function takes an arbitrary `Num` and is called somewhere with and `Int`, a specialisation `Int`s should probably be generated. If the function is called with a constant `23`, then a specialisation for this exact integer could be generated (and likely later inlined, but more on that later).
- Note after one function is specialised, function calls in that function's body may now also become candidates for specialisation by the rule above. This transitive specialisation is very powerful, as it can eliminate would might otherwise by a large number of repeated switches.
- One of the function's arguments have a small set of inhabiting values. For example, if a function takes a boolean argument, specialisations for when the boolean is true and false might be a good idea.

Specialisation is similar to inlining, but generated specialised code can be reused, reducing executable bloat. Prioritising specialisation over inlining seems reasonable as an approach to not have overly long compilation times.

## Dispatching to Specialised Functions

Dispatching to specialised functions at runtime rather than compile time would greatly increase the power of this feature. i.e: suppose there is a function `foo: [n: Num](n) -> n` and with a specialisation for `n ~ Int`. We would like to ensure that even code like `x: Int = 0; y: Num = x; z = foo(y);` uses the specialiased version of `foo`, using the type information (in the form of variant tags) that is kept around at runtime to dispatch appropriately. With this guarantee, it would be feasible to actually allow the programmer to specify alternate code paths for specialisations of functions manually (without inconsistency where upcasting and calling results in different behaviour).

[^note]: À la Haskell - https://wiki.haskell.org/Inlining_and_Specialisation#What_is_specialisation.3F
