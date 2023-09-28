# Proofs

In many dependently typed language, an unfortunate side effect of needing to translate between different constraints is that code must be cluttered with calls to functions that do effectively nothing except prove that some constraint implies another.

WTy2 attempts to separate out these "proof" functions from the code that requires them through the mechanism of implicit `proof`s.

## Syntax

The `proof` keyword can be written before a variable definition, with the name of the variable optionally elided. Named `proof`s can be called just like normal functions.

Variables annotated as `proof`s must be functions that return something of type `Proof(c)` for some `c: Co`.

## Semantics

During WTy2 typechecking, all constraints which could not be satisfied are collected (along with their associated local typing contexts). For each of these constraints, we iterate through every in-scope `proof` and attempt to apply it (i.e: trying to match result/head of the `proof`s up with the desired constraint, via a similar mechanism to how superclass constraints are applied).

If introducing a call to the proof function immediately before the offending expression (concretely, for expression `e` and proof function `p`, replacing `e` with `do { Refl := p(...); e }`) allows the expression to typecheck, then we are done, and move on to the next stuck constraint. If there is still an error, there might still be a more suitable `proof` in scope and so we undo changes (revert to just `e`), and try to apply the next `proof`. If all in-scope `proof`s are exhausted, then the type error is outputted as normal.

Importantly, inserted `proof`s are limited to single function calls. If there is a proof that `A => B` and a proof that `B => C`, and a proof of `A => C` is required, the programmer must explicitly write a new proof of `A => C`. This is to prevent typechecking from looping.

```WTy2
proof(Proof(A)): Proof(B)

proof(Proof(B)): Proof(C)

proof(Proof(A)): Proof(C) = do {
    _: Proof(B) = QED;
    QED
}
```

## Design Note: Transitive Closure of Proofs

While needing to write transitive proofs might seem slightly painful, note it is NOT intended that every single possible valid proof function is written. First of all, this is likely impossible (for the same reason typechecking would loop: infinite valid proofs can be obtained while starting from a finite number), but also, it is unnecessary! Why prove anything that isn't helpful?

Instead, it is hoped that the WTy2 programmer writes code assuming all obvious implications are known to the typechecker, and then if a type error is encountered, the programmer writes the `proof` that fixes that specific error. The benefit is that now all future times that same error would appear, the in-scope `proof` is implicitly reused.

## Design Note: Provisional Definitions

Idris has a feature with a similar goal (that of splitting proofs and code relying on them) known as "Provisional Definitions" https://docs.idris-lang.org/en/latest/tutorial/provisional.html. The main disadvantage is that you do not get the reuse of proofs that comes from WTy2 (i.e: proofs must be specifically named based on the function they are required in).

The obvious benefit here is that the Idris compiler does not have to search through all possible implicit proofs, meaning the impact on typechecking performance is lessened. Right now, it is somewhat unclear how often implicit proofs will be able to be reused, but it is hoped that this will be a significant quality-of-life benefit for ordinary programs, perhaps even near the scale of much more heavyweight features, say, tactics (the convenience of not needing any explicit user-interaction when relying on properties like `m + n ~ n + m`, I think should not be understated).

## Implementation Note: Typechecking Performance

A naive implementation of the implicit proof searching algorithm will have a pretty devastating impact on typechecking performance. Hopefully some good method of pruning the search space can be found. It is also suggested that when `proof`s are successfully found, that information is cached somehow so on future compilation it does not need to be rediscovered.

Note the process of searching in-scope terms to find something that will allow the program to typecheck is not at all a new idea. Idris, for example, allows for writing explicit "holes" in programs https://docs.idris-lang.org/en/latest/elaboratorReflection/holes.html, where the compiler can automatically search for expressions that fit the desired type signature using functions labelled with `#hint` pragmas. Compared to this, WTy2 holes are relatively modest: the expressions are limited to single function calls.

## Implementation Note: Runtime Performance

WTy2 does not assume totality of functions. This includes proofs, and so it is entirely possible for a proof to typecheck, but then at runtime loop infinitely or crash.

For this reason, to preserve safety, running these proofs is unfortunately necessary. Execution these proofs can have severe performance impacts however (to the point of changing the time complexity of many algorithms). It is therefore suggested that WTy2 implementations allow compiling with an option that skips over calls to `proof`s, assuming totality. This has the consequence of ,aking infinite loops/runtime crashes in `proof`s undefined behaviour.

## Modules/Imports

It would be nice if importing `proof`s operated similarly to importing instances: just having them always be implicitly imported from modules.

However, it is unfortunately possible to write buggy/even malicious proofs (given they are not checked for totality) and so users should probably have some control over which `proof`s are brought into scope.

Importing a function and it's `proof`-y nature separately might be desirable, and so importing a named `proof` can be done as if it was an ordinary function, while importing it as an unnamed `proof` can be done with the specific syntax: `proof(proofFun1, proofFun2)`. All `proof`s in a module can be imported as `proof(..)`.
