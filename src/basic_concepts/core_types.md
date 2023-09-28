# Core Types

WTy2 is a language with subtyping and with first-class types. This has an interesting consequence: instead of having a "kind" system, different language constructs are simply members of different types.

## Any

`Any` is the supertype of all types.

## Type (`Ty`)

`Type` is the supertype of all "types". This includes anything which can appear on the RHS of a `:` binding.

An automatic instance of `Type` is derived for every type declaration.

## Constraint (`Co`)

`Co` represents "constraints". These can look syntactically similar to bindings (the constraint-versions of binding operators contain an extra `:` to disambiguate), but instead of bringing variables into scope, they constrain existing values.

Constraints can be created with the built-in `~`, `::` and `<::` operators.

## Functions (`Fun`)

In WTy2, functions are defined as variables which implement the (`Open`) `Fun` type, which includes methods `arg` and `res` (which return the argument and return types of the function respectively).

Normally, functions in WTy2 are uncurried. The exception is operators, which are always of the form `a -> b -> c`.

See [Core Type Operators](./arrows.md) for the definition of the `(->)` type operator in terms of the built-in `Fun` type.

## Tuples/Records/Dependent Pairs/Lists and Telescopes

In WTy2, the built-in tuples, records, dependent pairs, lists etc... all desugar down to the same datatype - a dependent inductively-defined tuple:

```WTy2
datatype DepTup(tele: Tele) where
  (:.) : [ty, rest] (head: ty) -> (tail: rest(head))
       -> DepTup(ty .- rest)
  Nil  : DepTup(NilTele);
```

Where `Tele` is another built-in datatype, a telescope:

```WTy2
datatype Tele
  = (.-)    : (ty: Type) -> (rest: t -> Type) -> Tele
  | NilTele : Tele;
```

Ordinary lists and tuples can be defined from `DepTup` pretty trivially:

```WTy2
type List(ty: Type)
  = [head: ty, tail: List(ty)]
    '(head :. tail)
  | 'Nil;

type Tuple(tys: List(ty))
  = [ty, rest, head: ty, tail: Tuple(rest)]
    '(head :. tail) <<= { tys ~ ty :. rest }
  | 'Nil;
```

More convenient list/tuple syntax and records are implemented as syntax-sugar on top of these datatypes (i.e: `(0, 1, 2)` becomes `0 :. 1 :. 2 :. Nil`). Following the structure of how `DepTup` is defined, fields in dependent records can only depend on fields to the left of them.

### Unit (`()`)

The unit type is also defined in terms of `DepTup`, with `()` parsed as an ordinary identifier:

```
() = Nil;
type Unit = '();
```

### Design Note: Singleton Tuples

WTy2 also supports singleton tuples. The parsing ambiguity of expression in parens vs a singleton tuple is resolved as follows:
`(E)` where `E` is an expression - parenthesised expression
`(E,)` where `E` is an expression - singleton tuple
`(i: E)` where `i` is an identifer and `E` is an expression - named value (`t <: (i: t)`)
`(i: E,)` where `i` is an identifier and `E` is an expression - named singleton tuple/singleton record

### Design Note: Bindings

In WTy2, the types of records can look syntactically identical to bindings (LHS of assignments). However, bindings are NOT first-class. `return (x: Int)` returns a `Ty` which is equal to the record type `(x: Int)`. `do {x: Int} = 4` (perhaps intending the LHS expression to reduce down to `x: Int`) is nonsense.

## Void

`Void` is the subtype of all types. It contains no inhabitants.
