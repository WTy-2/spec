# Records

Records in WTy2 are internally compiled down to ordinary dependent tuples, but have a few extra features.

## Construction

Records in WTy2 can be constructed similarly tuples but with each expression prefixed the field name and an `=` symbol: `(field1=expr1, field2=expr2, ..., fieldN=exprN)` to create a record of type `(field1: type1, field2: type2, ..., type3)`.

## Subtyping

Records are covariant in types of fields.

There is also one subtyping rule between records and tuples to allow for passing functions that take named arguments to higher order functions cleanly (recall functions are contravariant in argument type).

```WTy2
(Ty1, Ty2, ..., TyN) <: (field1: Ty1, field2: Ty2, ..., fieldN, TyN);
```

## Shuffling

WTy2 defines a primitive `shuffle` to work with records with different orders of field names:

```WTy2
shuffle: [a](x: a, b: Type) <<= { a: permutation(b) } -> b;
```

Where `permutation` is a type family that produces a type containing all record types that are permuations of the fields of the argument record.

## Partial Application ("`?`")

WTy2 supports a _nominal_ [^note] partial application syntax based on records, which leverages yet another primitive:

```WTy2
partialise: (f: a -> b) -> [a1] a0 <<= { concat(a0, a1): permutation(b) }
           -> if(isUnit(a1)) { b }.else { a1 -> b };
```

Where `concat` is a type family which concatenates two records in the obvious way and `isUnit` is a function on (record) types which decides if the type is `()` (one implementation would be `isUnit(a: Rec) = a.size() == 0`).

One way to view this primitive is as a generalised `curry` which infers desired argument order based on record field names.

As syntax sugar, WTy2 allows `(?) = partialise` to be used a primitive operator which binds tighter than function application, allowing use like:

```WTy2
f: (x: Int, y: Char, z: Bool) -> Int;

g: (y: Char) -> Int = ?f(x=3, z=True);
```

In the case `a0: permutation(b)`, we have `a1 :: () => isUnit(a1) ~ True`. We special-case this situation in the type signature to allow for convenient passing of records with shuffled field order to functions:

```WTy2
w: Int = ?f(y='a', z=False, x=3);
```

It is likely inference for this primitive will need to be special-cased in the typechecker (i.e: to take advantage how `a1` can be inferred by removing fields of `b` that occur in `a0`).

[^note] As opposed to _positional_, which is the usual approach in languages supporting partial application, such as Haskell. For example, given the Haskell function `foo a b = a / b` we can easily partially apply `foo` to a numerator, `n`, with `foo n`, but partially applying to a denominator, `d`, requires more clunky syntax such as `` (`foo` a) `` or a combinator like `flip` or `(&)`. This problem gets worse as the arity of functions increases.
