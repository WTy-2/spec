# Modes

As outlined in [Low-level Semantics](../implementation/low_level.md), current design for WTy2 does not focus on performance. Still, this is a hobby project, and sometimes I just find myself thinking about linear types. So this thought is not wasted, I will outline a partial design for some typing-esque features designed with the intention providing guarantees to the programmer about how some WTy2 code will actually be executed.

My current favourite point in the (quite large) design space is Jane Street's proposal of "modes" in OCAML [Oxidising OCAML](https://blog.janestreet.com/oxidizing-ocaml-ownership/) and so my current suggestion is to do something similar in WTy2, splitting different optimisation guarantees into different mode "axis".

## Design Questions:

- Polymorphism over modes via "mode variables" is possible, leading to corresponding mode expressions. For anyone well-accustomed to dependent types, this should set off alarm bells: a separate expression syntax within a language is exactly what types are in most programming languages, and this limits their expresivity significantly. Could these modes instead be made first-class? Would this be useful?
