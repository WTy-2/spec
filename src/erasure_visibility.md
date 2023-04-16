# Erasure and Visibility

In WTy2, erasure and visibility are intrinsically linked. WTy2 will only ever infer values that will be erased at runtime.

There is a minor extension to record syntax to support erased/inferred arguments: they are contained in square brackets before the parenthesis.

```haskell
recTy :: Parser RecTy
recTy = mkRecTy (optional $ brackets $ commaSep1 bind) (parens $ commaSep0 bind)
```

A term can be bound in the erased elements of a record only if it occurs to the right of some constraint operator or `:` in the non-erased elements.

An example of erasure being useful is when working with length-indexed vectors:

```WTy2
fun vecLen[t: Type, n: Nat](v: Vec(t, n)): Nat <== { it ~ n }

fun returnsVecOfUnknownLen(...): [n: Nat](Vec[Bool, n])
```

In `vecLen`, binding `t` and `n` in the `[]`s allows them to be inferred, and makes it so there is no runtime cost of having to pass the type or length. Note if we had to pass the length explicitly, then the function would be entirely useless: we would need to know the length to calculate it!

This combines nicely with functions like `returnsVecOfUnknownLen`. If we ever do actually need to know the length (perhaps to pattern match on it), then we can call `vecLen` on the result, and this all works out because we still have an erased `n: Nat` in scope.

To be concrete, a term being erased means that it cannot be pattern matched on, or passed as an argument to somewhere where a non-erased term is expected.

Unlike constraints in `<==`, erased terms in records can be manually specified at construction or bound when matching.

```WTy2
[erasedLen=n](vec) = returnsVecOfUnknownLen(...);
len = vecLen[Bool, erasedLen](vec);

// From the signature of 'vecLen', `erasedLen ~ len` is in the context
_: () <== { erasedLen ~ len } = ();
```
