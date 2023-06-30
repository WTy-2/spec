# Core Types

WTy2 is a language with subtyping and with first-class types. This has an interesting consequence: instead of having some sort of "kind" system, the key language constructs in WTy2 simply implement various built-in types.

## Any

`Any` is the supertype of all types.

## Type

`Type` is the supertype of all "types". This includes anything which can appear on the RHS of a `:` binding.

An automatic instance of `Type` is derived for every type declaration.

## Constraint

`Constraint` represents "constraints". These can look syntactically similar to bindings (the constraint-versions of binding operators contain an extra `:` to disambiguate), but instead of bringing variables into scope, they constrain existing values.

Constraints can be created with the built-in `~`, `::` and `<::` operators.

## Functions

`a -> b` is the generic function type. Function arrows in WTy2 are dependent, but to avoid always having to write non-dependent arrows as `a -> { b }`, WTy2 features some syntax sugar which automatically inserts braces.

## Tuples/Records/Dependent Pairs/Lists/Telescopes

Yep, Tuples, Records, Dependent Pairs, Lists and Telescopes in WTy2 are all supported via the same built-in datatype (somewhat similarly to how TypeScript supports tuple-like syntax with it's arrays, but in a dependent setting). This datatype and associated sugar in WTy2 becomes a little complicated, and so it has it's own dedicated section in the spec.

### Unit ("()")

`()` is the unit tuple. It implements `Type`, `Constraint` AND `()` (i.e: itself)

### Design Note: Singleton Tuples

WTy2 also supports singleton tuples. The parsing ambiguity of expression in parens vs a singleton tuple is resolved as follows:
`(E)` where `E` is an expression - parenthesised expression
`(E,)` where `E` is an expression - singleton tuple
`(i: E)` where `i` is an identifier and `E` is an expression - singleton named tuple

### Design Note: Bindings

In WTy2, the types of records look almost identical to `Bind`ings. However, `Bind`ings are NOT first-class. `return (x: Int)` returns a `Type` which is equal to the record type `(x: Int)`. `{x: Int}() = 4` is not a valid way to bring `x` into scope.

## Void

`Void` is the subtype of all types. It contains no inhabitants.
