# Soundness

WTy2 is a programming language with dependent types first and foremost, NOT a theorem prover.

In fact, viewed as a logic, WTy2 as it currently exists is highly inconsistent. It is triviall to prove bottom and from there anything. The only guarantee making this somewhat palatable is that these are all cases where the program will loop or crash at runtime. WTy2 (when programs are ran in debug mode without optimisations) will never actually create values of bottom type.

This is useful for programming (proving termination is tiresome and sometimes even impossible) but makes WTy2 effectively useless for theorem proving. In the far future if these holes were to be closed (likely opt-in with some sort of compiler pragma or flag, `safe`), then this would no longer be the case, and hence these holes are documented below:

## Non-terminating Recursive Functions

```WTy2
foo() = foo()
```

## Type in Type

Similar to Haskell, WTy2 has the axiom `Type : Type`. Girard's paradox [^note] is almost certainly derivable from this.

## Russel's Paradox - DANGER!!

Unfortunately, WTy2 as currently designed has a much larger soundness hole than either of the above problems (both of which, while limiting its capabilities as a theorem prover, still _probably_ still have the guarantee that if the program manages to execute the assignment of a variable, it's value is of the correct type - i.e: the program will either loop infinitely or produce crash before executing any unsound code).

Due to the way subtyping and constraints work however, Russel's paradox can be encoded surprisingly easily, with bottom appearing to be derivable without the program even _doing_ anything.

```WTy2
type Russel = (t: Type) <<= { t :: t => t :: Void };

ohDear: Void = Russel;
```

An informal sketch of how a constraint solver might check (and approve!) this is outlined below:

Constraints are written in almost identical syntax to ordinary WTy2 source, but we elide types of `for` bound variables, instead prefering to write them as implications where necessary.

```WTy2CoSo
# From definition of Russel

[G1] for(t) { t :: Russel /\ t :: t => t :: Void }
[G2] for(t) { (t :: t => t :: Void) => t :: Russel }

[W1] Russel :: Void

# Head of G1 matches, instantiate with t = Russel

[W2] Russel :: Russel /\ Russel :: Russel

# Simplify

[W3] Russel :: Russel

# Head of G2 matches, instantiate LHS with t = Russel

[W4] Russel :: Russel => Russel :: Void

# Wanted is an implication, so assume LHS and try to reach RHS
# This is arguably the point where everything goes wrong!!

[G3] Russel :: Russel

[W5] Russel :: Void

# Interesting to note we have reached the same wanted that we
# started with, but we have made progress: we now have G3!

# Head of G1 matches, again, so instantiate LHS with t = Russel

[W6] Russel :: Russel /\ Russel :: Russel

# Solve with G3
```

And so we conclude by deriving `Russel :: Void`, which is clearly unsound.

I am currently unsure how to resolve this...

[^note] See http://liamoc.net/posts/2015-09-10-girards-paradox.html for a nice walkthrough of how to derive this in Agda.
