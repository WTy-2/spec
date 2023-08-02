# Proofs

In many dependently typed language, an unfortunate side effect of needing to translate between different constraints is that code must be cluttered with calls to functions that do effectively nothing except prove that some constraint implies another.

WTy2 attempts to separate out the these "proof" functions from the code that requires them through the mechanism of implicit `proof`s.

## Syntax

```haskell
-- | 'proofDec' is a valid top-level LValue
{- Examples:

proof(x: Nat, y: Nat) <== { x ~ 2 * y }
    : () <== { even(x) }
    = ...

proof: (x: Nat, y: Nat)  <== { x ~ 2 * y }
    -> () <== { even(x) }
    = ...

proof mulTwoImplesEven(x: Nat, y: Nat) <== { x ~ 2 * y }
    : () <== { even(x) }
    = ...

proof mulTwoImplesEven: (x: Nat, y: Nat) <== { x ~ 2 * y }
    -> () <== { even(x) }
    = ...
-}
proofDec :: Parser ProofDec
proofDec = "proof" *> mkProofDec (optional termIdent)
```

As well as `fun`, WTy2 supports another keyword before top-level function declarations: `proof`. Named `proof`s can be called just like normal functions. However, their name can optionally be elided.

## Semantics

In WTy2, if at any point during typechecking, an expression fails to typecheck, then all in-scope `proof`s are iterated through. For every `proof`, all in-scope terms are compared against the arguments, and all compatible argument combinations to perform a call of this `proof` function are iterated through.

For every call of the proof function, immediately before the failing to typecheck expression, a call to the function is introduced, discarding the result, but matching on it to bring any constraints into scope. The expression is then re-typechecked, with these constraints in scope. If it fails again, that function call is removed, and the next one is tried.

If typechecking with any proof call succeeds, then that call to the proof is left in and typechecking proceeds as normal. If all proofs fail, then the type error is outputted as would be expected.

Importantly, proofs are limited to single function calls. If there is a proof that `A => B` and a proof that `B => C`, and a proof of `A => C` is required, the programmer must explicitly write a new proof of `A => C`. This is to prevent typechecking from looping.

```WTy2
proof(Proof(A)): Proof(B)

proof(Proof(B)): Proof(C)

proof(Proof(A)): Proof(C) = do {
    _: Proof(B) = QED;
    QED
}
```

## Design Note: Transitive Closure of Proofs

While needing to write transitive proofs might seem slightly painful, note it is NOT intended that every single possible valid proof function is written. First of all, this is likely impossible (for the same reason typechecking would loop: infinite valid proofs can be obtained starting from a finite number), but also, it is unnecessary! Why prove anything that isn't helpful?

Instead, it is hoped that the WTy2 programmer writes code assuming all obvious implications are known to the typechecker, and then if a type error is encountered, the programmer writes the proof required for that specific error. The nice side-benefit is that now all future times that same error would appear, the in-scope proof is implicitly called.

## Design Note: Provisional Definitions

Idris has a feature with a similar goal (that of splitting proofs and code relying on them) known as "Provisional Definitions" https://docs.idris-lang.org/en/latest/tutorial/provisional.html. The main disadvantage is that you do not get the reuse of proofs that comes from WTy2 (i.e: proofs must be specifically named based on the function they are required in).

The obvious benefit here is that the Idris compiler does not have to search through all possible implicit proofs, meaning the impact on typechecking performance is lessened significantly. Right now, it is somewhat unclear how often implicit proofs will be able to be reused, but it is hoped that this will be a quality-of-life benefit for simple programs will be near the scale of much more heavyweight features, say, tactics (the convenience of not needing any explicit user-interaction to satisfy properties like `m + n ~ n + m`, I think should not be understated).

## Implementation Note: Typechecking Performance

A naive implementation of the above algorithm will have a pretty devastating impact on typechecking performance. Hopefully some good method of pruning the search space can be found. It is also suggested that when proofs are successfully found, that information is cached somehow so on future compilation it does not need to be rediscovered.

Note the process of searching in-scope terms to find something that will allow the program to typecheck is not at all a new idea. Idris, for example, allows for writing explicit "holes" in programs https://docs.idris-lang.org/en/latest/elaboratorReflection/holes.html, where the compiler can automatically search for expressions that fit the desired type signature using functions labelled with `#hint` pragmas. Compared to this, WTy2 holes are relatively modest: the expressions are limited to single function calls.

## Implementation Note: Runtime Performance

WTy2 does not assume totality of functions. This includes proofs, and so it is entirely possible for a proof to typecheck, but then at runtime loop infinitely or crash.

For this reason, to preserve safety, running these proofs is unfortunately necessary. Running these proofs can have severe performance impacts however (to the point of changing the time complexity of many algorithms). It is therefore suggested that WTy2 implementations allow compiling with an option that skips over calls to `proof`s where the values are discarded, assuming totality. This has the result of turning infinite loops/runtime crashes into undefined behaviour.

## Compiler Warnings

Marking a function as a `proof`s is only useful if it returns proof of a constraint that mentions at least one of the arguments. It is suggested that this property should be checked for (possibly producing a warning) by implementations.

## Imports

Importing proofs operates similarly to importing type instances: they are implicitly imported from modules.

In fact, proofs can be thought of as somewhat similar to instances: they allow defining implications between one constraint and another. The main difference is arguably that `proof`s must be justified while `instance`s are taken as axioms, but for this reason are much more limited (to prevent unsoundness).
