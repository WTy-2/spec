# Introduction

WTy2 is a dependently typed, functional programming language.

It was designed with a few goals in mind:

- Aim for there to be exactly one "best" way to design every abstraction. If there has to be multiple, the relative trade-offs for each should be obvious and small in number.
- Allow extremely strong compile-time guarantees (via dependent types), but optionally. It should be possible to start with a program that relies heavily on run-time assertions and bit-by-bit introduce more and more static checks without major refactoring.
- To support this, breaking from common philosophy on dependent types, WTy2 does NOT encourage creating many separate datatypes to maintain invariants (correct-by-construction). For example, the idiomatic WTy2 encoding a vector (length-indexed list) is to pass a list and a constraint holding a runtime irrelevant proof that it's length is equal to `n`, NOT to define a new inductive datatype. The style of invariant-capturing WTy2 encourages therefore is more similar to languages with refinement-type systems. To make this feasible in a dependently typed setting, WTy2 introduces a simple but powerful concept of "implicit proofs".
- WTy2 is also designed to be (eventually) **blazing fast**. Implementing the type system will be more than enough work for the forseable future, but to avoid shooting itself in the foot if/when focus shifts to performance, types are unboxed and linear-by-default and an initial design has been sketched out for "type-aware allocators" which would help support performant heterogeneous collections.
