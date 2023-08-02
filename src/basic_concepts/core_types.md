# Core Types

WTy2 is a language with subtyping and with first-class types. This has an interesting consequence: instead of having a "kind" system, different language constructs are simply members of different types.

## Any

`Any` is the supertype of all types.

## Type

`Type` is the supertype of all "types". This includes anything which can appear on the RHS of a `:` binding.

An automatic instance of `Type` is derived for every type declaration.

## Constraint

`Constraint` represents "constraints". These can look syntactically similar to bindings (the constraint-versions of binding operators contain an extra `:` to disambiguate), but instead of bringing variables into scope, they constrain existing values.

Constraints can be created with the built-in `~`, `::` and `<::` operators.

## Functions

See [Core Type Operators](./arrows.md)

## Tuples/Records/Dependent Pairs/Lists and Telescopes

In WTy2, the built-in tuples, records, dependent pairs, lists etc... all desugar down to the same datatype - a dependent inductively-defined tuple:

```WTy2
datatype DepTup(tele: Tele) where
  (:.) : [ty, rest] (head: ty, tail: rest(head))
       -> DepTup(ty .- rest)
  Nil  : DepTup(NilTele);
```

Where `Tele` is another built-in datatype, a telescope:

```WTy2
datatype Tele
  = (.-)    : (ty: Type, rest: t -> Type) -> Tele
  | NilTele : Tele;
```

Ordinary lists and tuples can be defined from this pretty trivially:

```
type List(ty: Type)
  = [head: ty, tail: List(ty)]
    '(head :. tail)
  | 'Nil;

type Tuple(tys: List(ty))
  = [ty, rest, head: ty, tail: Tuple(rest)]
    '(head :. tail) <<= { tys ~ ty :. rest }
  | 'Nil;
```

More convenient to use list/tuple syntax and records are implemented as syntax-sugar on top of these datatypes (i.e: `(0, 1, 2)` becomes `0 :. 1 :. 2 :. Nil`). Following the structure of how `DepTup` is defined, fields in dependent records can only depend on fields to the left of them.

### Unit (`()`)

The unit type is also defined in terms of `DepTup`, with `()` being a valid identifier:

```
pattern () = Nil;
type Unit = '();
```

### Design Note: Singleton Tuples

WTy2 also supports singleton tuples. The parsing ambiguity of expression in parens vs a singleton tuple is resolved as follows:
`(E)` where `E` is an expression - parenthesised expression
`(E,)` where `E` is an expression - singleton tuple
`(i: E)` where `i` is an identifier and `E` is an expression - singleton named tuple

### Design Note: Bindings

In WTy2, the types of records look almost identical to `Bind`ings. However, `Bind`ings are NOT first-class. `return (x: Int)` returns a `Type` which is equal to the record type `(x: Int)`. `{x: Int}() = 4` is not a valid way to bring `x` into scope.

## Void

`Void` is the subtype of all types. It contains no inhabitants.
