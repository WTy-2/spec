# Modules

WTy2 programs are organised into modules, similar to Haskell (so modules are not first-class/intended as a method of abstraction - open `type`s suit that purpose well already).

## Imports/Exports

The public exports of a module are written in parens after the module declaration. Imports of a module are written in parens after the name of the imported module. Publically exported members are considered part of the public API of a module and breaking changes to them reflect semantic version changes for the module.

If and only if the exact version of the dependended-upon module is specified in the package file is the programmer given the freedom to import members that are not publically exported (still with a warning).

Requirement: Non-semantic version changes of upstream modules should never cause compile errors in downstream modules.

## Module Members

Module members include top-level variables, types, tags, instances and `proof`s.

- Variables, `v : t = e`, and their types (`v : t`) can be exported/imported via their identifer. The RHS of their definition (`v ~ e`) can be exported/imported with `(..)`.
- Closed types, `type t = u`, can be exported/imported via their identifiers. The RHS (`t <: u /\ u <: t`) can be exported/imported with `(..)`.
- Open types, `type t { m0: t0; m1: t1; }`, can be exported/imported via their identifiers. Members of the type can be exported/imported in parens. Instances can only be made if all members are in scope via `(..)`.
- Instances,`impl t for u { m0 := e0; m1 := e1; }` , are exported/imported implicitly. How to signal intent for whether to export the definition of members of the instance (`m0 ~ e0`) can be done by writing the special syntax `m0(..) for u`.
- Tags can be exported via their identifers. Modifying the type of arguments to a tag is always a breaking change.
- `proof`s `proof p := e` are exported/imported as functions via their identifiers and imported as unnamed `proof`s with `proof(p)` (they are always exported as unnamed `proof`s). A named `proof` can be imported as both a function and an unnamed `proof` by a downstream module. All proofs can be imported as unnamed at once with `proof(..)`.
