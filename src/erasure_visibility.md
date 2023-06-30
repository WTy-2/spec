# Erasure and Visibility

# Runtime Relevance of Types and Constraints

In Haskell, runtime relevance can effectively be summarised as: types are erased, constraints are not. Even equality constraints like `a ~ b` which don't contain any fields often do not get fully optimised away as `Constraint` is lifted and so could point to a bottoming value (see discussion at https://github.com/ghc-proposals/ghc-proposals/pull/547).

In WTy2, we take the opposite approach: constraints are erased but types are not. To perform dispatch, implementations will in all likelyhood need to implement some sort of runtime.

# Erasure and Visibility in Types and Values

Even though values and types must in general be kept around at runtime, in many specific cases, this is not necessary (consider a generic function which takes both a type `t :|=> Animal` and an argument `a: t` - `t` can be recovered entirely from `a`). The key observation made here is that arguments we would like the typechecker infer for convenience generally correspond with ones recover.

A type surrounded in parenthesis can be prefixed with something that looks similar to a record type but the bindings are placed inside brackets (`[]`) instead of parenthesis.

A variable can be bound in the erased elements of a record only if:

- It occurs by itself in a matchable function application (i.e: as an argument or the function itself) to the right of a member constraint and the type (i.e: RHS object of member constraint) is `Closed` (the `Closed` constraint is inferred if the use of `[]`s require it, similar to definedness constraints which arise from function applications in types). [^note]
- It is on the RHS of an equality constraint with a non-erased element (unclear if this is actually useful).

An example of erasure being useful is when working with length-indexed vectors:

```WTy2
vecLen[t: Type, n: Nat](v: Vec(t, n)): Nat <<= { it ~ n }

returnsVecOfUnknownLen(...): [n: Nat] Vec[Bool, n]
```

In `vecLen`, binding `t` and `n` in the `[]`s allows them to be inferred, and makes it so there is no runtime cost of having to pass the type or length. Note if we had to pass the length explicitly, then the function would be entirely useless: we would need to know the length to calculate it!

This combines nicely with functions like `returnsVecOfUnknownLen`. If we ever do actually need to know the length (perhaps to pattern match on it), then we can call `vecLen` on the result, and this all works out because we still have an erased `n: Nat` in scope.

To be concrete, a term being erased means that it cannot be pattern matched on, or passed as an argument to somewhere where a non-erased term is expected.

Unlike constraints in `<<=`, erased terms in records can be manually specified at construction or bound when matching.

```WTy2
[erasedLen=n] vec = returnsVecOfUnknownLen(...);
len = vecLen[Bool, erasedLen](vec);

// From the signature of 'vecLen', `erasedLen ~ len` is in the context
_: () <<= { erasedLen ~ len } = ();
```

## Bidirectional Type Inference

One unfortunate consequence of handling inference in this way is that setting up constraints based on the desired return type (bidirectional type inference) is not really possible. This can be a useful feature - for example, in languages like Haskell, numeric expressions can stay entirely in terms of `Num a => a` until finally being instantiated to a specific numeric type at call-site, but it also leads to many cases of potential ambiguity and arguably makes code harder to reason about.

[^note] Note this is less restrictive than it might initially sound. If we have `x: Animal` and a function `id[t: Type](x: t): t`, `id(x)` does indeed typecheck, with `t` instantiated to `x.head(Animal)`.
