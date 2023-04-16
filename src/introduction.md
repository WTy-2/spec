# Introduction

WTy2 is a dependently typed, functional and imperative programming language.

It was designed with a few goals in mind:

- Aim for there to be exactly one "best" way to design every abstraction. If there has to be multiple, the relative trade-offs for each should be obvious and small in number.
- Allow extremely strong compile-time guarantees (via dependent types), but optionally. It should be possible to start with a program that relies heavily on run-time assertions and bit-by-bit introduce more and more static checks without major refactoring.
- Possible to obtain really fast performance, without a language runtime. WTy2 is designed to eventually be a capable systems programming language, meaning abstractions should ideally be close to zero-cost. WTy2 features linear types, unboxed types (including unboxed closures), and a novel approach to monomorphisation, where the compiler falls back on runtime dispatch (meaning C++/Rust-level performance in the best case, without restrictions on the size of types).
- WTy2 collections are also built using a novel concept of "type-aware allocators", that provide **blazing fast** `fmap` performance where order of traversal is unimportant.
