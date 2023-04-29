# Erasure and Visibility

In WTy2, erasure and visibility are intrinsically linked. WTy2 will only ever infer values that will be erased at runtime.

A type surrounded in parenthesis can be prefixed with something that looks similar to a record type but the bindings are placed inside brackets (`[]`) instead of parenthesis.

A term can be bound in the erased elements of a record only if it occurs (to the right of some constraint operator[^note]) or `:` in the non-erased elements.

An example of erasure being useful is when working with length-indexed vectors:

```WTy2
vecLen[t: Type, n: Nat](v: Vec(t, n)): Nat <== { it ~ n }

returnsVecOfUnknownLen(...): [n: Nat] Vec[Bool, n]
```

In `vecLen`, binding `t` and `n` in the `[]`s allows them to be inferred, and makes it so there is no runtime cost of having to pass the type or length. Note if we had to pass the length explicitly, then the function would be entirely useless: we would need to know the length to calculate it!

This combines nicely with functions like `returnsVecOfUnknownLen`. If we ever do actually need to know the length (perhaps to pattern match on it), then we can call `vecLen` on the result, and this all works out because we still have an erased `n: Nat` in scope.

To be concrete, a term being erased means that it cannot be pattern matched on, or passed as an argument to somewhere where a non-erased term is expected.

Unlike constraints in `<==`, erased terms in records can be manually specified at construction or bound when matching.

```WTy2
[erasedLen=n] vec = returnsVecOfUnknownLen(...);
len = vecLen[Bool, erasedLen](vec);

// From the signature of 'vecLen', `erasedLen ~ len` is in the context
_: () <== { erasedLen ~ len } = ();
```

## Infering From Return Type

One unfortunate consequence of handling inference in this way is that inference based on return type is not really possible. This can be a useful feature - for example, in languages like Haskell, all integer literals have type `Num a => a`, meaning they can appear in any numeric expression without a need to cast them to the correct numeric type.

[^note]
The exact condition with constraint operators which makes it legal for a variable to be erased and inferred is a work-in-progress. In theory we only want to allow erasure if there is a possibility that it can be inferred, but detecting this is potentially non-trivial.
