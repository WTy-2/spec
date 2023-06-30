# Soundness

WTy2 claims is a programming language with dependent types first and foremost, NOT a theorem prover.

In fact, WTy2 as it currently exists is highly inconsistent, it is easy to prove bottom and from there anything. The only guarantee making this somewhat palatable is that these are all cases where the program will loop at runtime. WTy2 (when programs are ran in debug mode) will never actually create values of bottom type.

This is useful for programming (proving termination is tiresome and sometimes even impossible) but makes WTy2 effectively useless for theorem proving. In the far future if these holes were to be closed (probably with some sort of compiler flag, `safe`), then this would no longer be the case, and hence these holes are documented below:

## Non-termination Recursion

```WTy2
foo() = foo()
```

## Russel's Paradox - DANGER!!

WTy2's type system implemented naively, due to subtyping, does not prevent
types being members of themselves. This can lead to Russel style paradoxes.

```WTy2
-- `t => Void` is equivalent to `t @ t ==> t @ Void`
type Russel = (t: Type) <== { t => Void }

ohDear(): Void {
    _: Proof(Russel: Russel) = QED;
    _: Proof(Russel: Void) = QED;
    Russel
}
```

The constraint solver would attempt to solve this like so:

```WTy2CoSo
[G1] (Russel(t), t(t)) ==> Void(t)
[G2] (t(t) ==> Void(t)) ==> Russel(t)

[W1] Russel : Russel

# Head of G2 matches, instantiate LHS with t=Russel

[W2] Russel(Russel) ==> Void(Russel)

# Wanted is an implication, so assume LHS

[G3] Russel(Russel)

[W3] Void(Russel)

# Head of G1 matches, instantiate LHS with t=Russel

[W4] (Russel(Russel), Russel(Russel))

# Solve trivially via G3
```

So can conclude `Russel : Russel`
Oh dear!
