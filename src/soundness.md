# Soundness Holes

WTy2 claims is a programming language with dependent types first and foremost, NOT a theorem prover.

In fact, WTy2 as it currently exists is highly inconsistent, it is easy to prove bottom and from there anything. The only guarantee making this somewhat palatable is that these are all cases where the program will loop at runtime. WTy2 (when programs are ran in debug mode) will never actually create values of bottom type.

This is useful for programming (proving termination is tiresome and sometimes even impossible) but makes WTy2 effectively useless for theorem proving. In the far future if these holes were to be closed (probably with some sort of compiler flag, `safe`), then this would no longer be the case, and hence these holes are documented below:

## Non-termination Recursion

```WTy2
foo() = foo()
```

## Russel's Paradox - DANGER!!

The fact code like the below seems reasonable is _slightly_ worrying. Haskell can bypass this by it's typeclasses having type (`-> Constraint`) and so being parameterised by the type of values that inhabit it. In WTy2, this is currently not the case (and even doing this naively would not help - `Type(Any)` would have the same issue).

```WTy2
type Russel = (t: Type) <== { t => ! }

ohDear(): ! = do {
    _: Proof(Russel: Russel) = QED;
    x: ! = Russel;
    return x;
}
```

Luckily, I think a reasonable implementation of a WTy2 constraint solver (inspired by Haskell's) will loop infinitely in this case (see below).

Solver for first proof:

```
[G1] forall t: Type. (t: Russel) => (t => !) [from Russel's supertype constraint]
[G2] forall t: Type. (t => !) => (t: Russel) [from Russel's instance]

[W1] Russel: Russel
```

Head of G2 matches W1, so replace W1 with W2, instantiating `t` with `Russel`

```
[G1] forall t: Type. (t: Russel) => (t => !)
[G2] forall t: Type. (t => !) => (t: Russel)

[W2] Russel => !
```

Head of G1 matches W2, so replace W2 with W3, instantiating `t` with `Russel`

```
[G1] forall t: Type. (t: Russel) => (t => !)
[G2] forall t: Type. (t => !) => (t: Russel)

[W3] Russel: Russel
```

and so on...

Still, there is a danger here. If WTy2 was given an equivalent of the law of excluded middle, then `!` could be produced in both branches trivially.
