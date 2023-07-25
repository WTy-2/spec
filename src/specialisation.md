# Specialisation

WTy2 does NOT currently feature "specialisation" as a high-level language feature (à la Rust [^note]), being able to override typeclass instances for specific types. Instead, specialisation in the context of WTy2 refers to an optimisation strategy that is key to get highly polymorphic WTy2 programs to perform well [^note].

Specialisation can be thought of a bit like a "lite" version of monomorphisation. Types can be arbitrarily large in WTy2, so full monomorphisation as a compilation strategy is infeasible; however, where possible, compiling separate versions of functions for specific argument values (or sets of argument values) and dispatching to those specialised versions can get most of the benefits (the main downside being the compiler now has to decide on a strategy for deciding when to specialise).

Some possible heuristics for deciding when specialisation might be a good idea are:

- One of the function's arguments has a small set of inhabiting values. For example, if a function takes a boolean argument, specialisations for when the boolean is true and false are probably a good idea.
- A function is explicitly called somewhere in the program with an argument of more constrained type than the function accepts. For example, if a function takes an arbitrary `Num` and is called somewhere with an `Int`, a specialisation for `Int`s should probably be generated. If the function is called with a constant `23`, then a specialisation for this exact integer could be generated (effectively constant-folding).
- Note after one function is specialised, function calls in that function's body may now also become candidates for specialisation by the rule above. This transitive specialisation is very powerful, as it can eliminate what might otherwise be a large number of repeated matches.

Specialisation is similar to inlining, but generated specialised code can be reused, reducing executable bloat. Prioritising specialisation over inlining seems like a reasonable goal.

## Dispatching to Specialised Functions

Dispatching to specialised functions at runtime rather than compile time would greatly increase the power of this optimisation. i.e: suppose there is a function `foo: [n <=: Num](n) -> n` and with a much faster specialisation for `n ~ Int`. We would like to ensure that even code like `x: Int = 0; y: Num = x; z = foo(y);` uses the specialiased version of `foo`, using the type information (in the form of variant tags) that is kept around at runtime to dispatch appropriately (assuming the savings from running the specialised version are worth it over the cost of dispatching appropriately).

Exactly how feasible this is will likely have to be reassessed after the design for open types/instances is finalised, but this potentially could be implemented very simply as just a compiler pass which adds seemingly redundant pattern matches before various function calls that appear to be good candidates for specialisation [^note].

[^note]: The writer of the specification personally considers this form of specialisation (sometimes called ad-hoc polymorphism) as a misfeature and so would be hesitent to work on it, even if there was a feasible implementation strategy for it in WTy2.
[^note]: À la Haskell - https://wiki.haskell.org/Inlining_and_Specialisation#What_is_specialisation.3F
[^note]: Of course, pattern matches on open types are not available as a feature in the source language, but when it comes to implementation, values of open types will still be tagged.
