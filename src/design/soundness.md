# Soundness

WTy2 is a programming language with dependent types first and foremost, NOT a theorem prover.

In fact, viewed as a logic, WTy2 as it currently exists is highly inconsistent. It is trivial to prove bottom and from there anything. The only guarantee making this somewhat palatable is that these are all cases where the program will loop or crash at runtime. WTy2 (when programs are ran in debug mode without optimisations) will never actually create values of bottom type.

This is useful for programming (proving termination is tiresome and sometimes even impossible) but makes WTy2 effectively useless for theorem proving. In the far future if these holes were to be closed (likely opt-in with some sort of compiler pragma or flag, `safe`), then this would no longer be the case, and hence these holes are documented below:

## Non-terminating Recursive Functions

```WTy2
foo() := foo()
```

## Type in Type

Similar to Haskell, WTy2 has the axiom `Type : Type`. Girard's paradox [^note] is almost certainly derivable from this.

## Russel's Paradox, Directly

WTy2's expressivity and subtyping allows for a much more direct encoding of Russel's paradox (treating types as sets).

```WTy2
type Russel = (t: Type) <<= { t :: t => Bottom };
```

The additional danger here is that a suffiently advanced constraint solver could derive bottom entirely on it's own just from this definition being in-scope.

An informal sketch of how this might happen is outlined is below:

Constraints are written in similar syntax to WTy2 source, but we elide types of `for` bound variables, instead prefering to write them as implications.

```WTy2CoSo
# From definition of Russel

[G1] for(t) { t :: Russel /\ t :: t => Bottom }
[G2] for(t) { (t :: t => Bottom) => t :: Russel }

[W1] Russel :: Russel

# Head of G2 matches, so instantiate t = Russel

[W2] Russel :: Russel => Bottom

# Need to show an implication, so assume LHS to reach RHS

[G3] Russel :: Russel
[W3] Bottom

# Head of G1 matches, so instantiate t = Russel

[W4] Russel :: Russel /\ Russel :: Russel

# Simplify

[W5] Russel :: Russel

# Solve with G3
```

And so we conclude by deriving `Russel :: Russel` (from which, we can trivially obtain `Bottom` via `G1`).

That this is a real danger is illustrated by how we can encode exactly problem with Haskell typeclasses:

```hs
main :: IO ()
main = case veryBad of MkDict -> no @(IO ())

class Bottom where
  no :: a

data Dict c where
  MkDict :: c => Dict c

data Set = Russel

type In :: Set -> Set -> Constraint
class ((a ~ b, In b Russel) => Bottom) => In a b

instance (In s s => Bottom) => In s Russel

bad :: Dict (In Russel Russel)
bad = MkDict

veryBad :: Dict Bottom
veryBad = case bad of MkDict -> MkDict
```

Indeed, Haskell runtime loops when executing this program, despite there being no explicit recursion in the code[^note].

IMO it is _pretty_ important we avoid this. Mathematicians might argue the cause of the problem here is the typeclass declaration itself, but ruling it out would require a drastic reduction of WTy2's expressivity (e.g: removing an entire feature, like the `(<<=)` operator) or adding type universes.

Luckily, there is a much easier fix: not giving the solver access to an implication-introduction rule. Instead implications should only be brought into scope via superclass constraints, instances and explicitly written `proof`s. We could of course write a `proof` of `Russel :: Russel => Bottom`, but that this would loop at runtime is fine - we at least have source code we can point to in a stack trace (`proof`s are not totality-checked in WTy2).

[^note] See http://liamoc.net/posts/2015-09-10-girards-paradox.html for a nice walkthrough of how to derive this in Agda.

[^note] Though do note that the loop in Haskell can be encoded much more simply (and arguably arises from using superclass constraints when checking instances):

```hs
class (ImpliesBottom => Bottom) => ImpliesBottom

instance ImpliesBottom
```
