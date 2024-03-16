# Dependent Pattern Matching, Without Green Slime

Disclaimer: This is basically a blog post. I should start hosting my own website so I can write real blog posts...

## Motivation

A classic pain point in proof assistants based on ITT is problems with "green slime" [^slime].

```agda
foo : (x y : ℕ) → Fin (x + y) → ⊤
foo x y fz = {!!}
foo x y (fs _) = {!!}

```

```
I'm not sure if there should be a case for the constructor fz,
because I get stuck when trying to solve the following unification
problems (inferred index ≟ expected index):
  suc n ≟ x + y
when checking that the pattern fz has type Fin (x + y)
```

These arise from how dependent pattern matching requires patterns to definitionally have the type of the scrutinee variable (so it is safe to substitute the variable for the pattern everywhere in the context).

As we'll see next, if the "inferred" (i.e. from the signature of the constructor) and "expected" (i.e. from the type of variable being matched on) indices can be unified to produce a single solution, we can easily elaborate this into a match where the indices coincide, and the pattern has the desired type (and if they anti-unify, we know the branch is impossible and can be elided); however, oftentimes, unification problems can yield multiple solutions, or worse, are undecidable.

Unification between patterns[^pattern] and _variables_ is easy: all we need to do is perform a substitution, which is what allows

```agda
foo : (x : ℕ) → Fin x → ⊤
foo x fz = {!!}
foo x (fs _) = {!!}
```

to be painlessly elaborated into

```agda
foo : (x : ℕ) → Fin x → ⊤
foo x@.(suc _) fz = {!!}
foo x@.(suc _) (fs \_) = {!!}
```

We _could_ attempt a similar translation for more complicated indices, using a `with`-abstraction[^with]

```agda
foo : (x y : ℕ) → Fin (x + y) → ⊤
foo x y n with x + y
foo x y fz | x+y = {!!}
foo x y (fs n) | x+y = {!!}
```

which, behind-the-scenes, can be elaborated into

```agda
foo : (x y : ℕ) → Fin (x + y) → ⊤
foo x y n with x + y
foo x y fz | x+y@.(suc _) = {!!}
foo x y (fs n) | x+y@.(suc _) = {!!}
```

This typechecks, but we have lost all connection between the index of the `Fin` and `x + y`. Such a `with` abstraction only works by indiscriminately replacing all occurences of `x + y` in the context with a new variable, so this is an inherent limitation.

Luckily, using Agda's `with ... in ...` syntax (or the `inspect` idiom) [^inspect] we can retain propositional evidence of this connection

```agda
foo : (x y : ℕ) → Fin (x + y) → ⊤
foo x y n with x + y in p
foo x y fz | .(suc _) = {!!} -- Here, p : x + y ≡ suc n
foo x y (fs n) | .(suc _) = {!!}
```

But this is still inconvenient in two ways:

1. Propositional equality forces the user to manually coerce when necessary. It would be nice to have all `x + y`s which arise later rewrite to `suc n` automatically.
2. We were forced to manually write out the index to abstract over it. If we wanted to pattern match on multiple Fins, would would have to abstract over the index of each. We are doing a program translation by hand.

There is also a third, more subtle issue:

3. Sometimes, `with`-abstractions in Agda become "ill-typed". In the case of `foo`, this can happen if some expression in the context relies on the `Fin` being indexed by `x + y` definitionally to typecheck.

```agda
Pred : ∀ x y → Fin (x + y) → Set

foo : (x y : ℕ) (n : Fin (x + y)) → Pred x y n → ⊤
foo x y n p with x + y
foo x y fz p | .(suc _) = {!!}
foo x y (fs n) p | .(suc _) = {!!}
```

```
w != x + y of type ℕ
when checking that the type
(x y w : ℕ) (n : Fin w) (p : Pred x y n) → ⊤ of the generated with
function is well-formed
(https://agda.readthedocs.io/en/v2.6.4.2/language/with-abstraction.html#ill-typed-with-abstractions)
```

## Solution 1: Transport-Patterns

To resolve these last two points, I propose a new syntax, which I call "transport-patterns". Simply put: we allow a built-in transport operator to appear in patterns, allowing us to match without fear of "green slime" while also binding propositional equality of the indices.

```agda
foo : (x y : ℕ) → Fin (x + y) → ⊤
-- I use a coercion operator inspired by Cubical Agda's transpX here because
-- ideally we would like to be able to refer to a transport operator specific to
-- the inductive family (so we can bind p to suc n ≡ x + y rather than
-- Fin (suc n) ≡ Fin (x + y))
foo x y (Fin.coeX p fz) = {!!} -- Here, p : suc n ≡ x + y
foo x y (Fin.coeX p (fs n)) = {!!}
```

In contrast to with-abstractions, we don't try to replace the index expression in the context. Instead, we just replace the variable we matched on with a transported value.

Personally, I think this feature alone is already a huge ergonomic improvement on the status quo. Of course the user could always resort to doing their own fording transformations, but this often infects many other parts of the development with unnecessary clutter (passing and matching on `refl`s), i.e. in the cases where unification would have worked out.

<details>
<summary>Short Rant</summary>
More than the boilerplate, I think my frustration with the manual translations is that they force the user to put thought into what ought to be irrelevant, low-level, implementation details, distracting from their larger developments. i.e. in my opinion, time spent pondering question such as:

- "Can I abstract over the index here or will that be ill-typed?"
- "When a function matches on a datatype indexed by a neutral AND the constructor is _also_ indexed by a neutral, should I do a fording translation on the function or the constructor, or both?"
- and "What about if in some cases, the neutral ends up being unblocked and reduces to a value just in time for the match to work out? Does that change things?"

is a complete waste of effort. In general, I think there should be more focus in the PL community (especially in the area of dependent types) on building easier-to-use languages which don't force the user to do the work of an elaborator/compiler. i.e. rather than accepting that the status quo as how these languages must work and maintaining a folklore of "design patterns" to help bypass these problems, let's put in the work to make such expert knowledge unnecessary! Without this, how can we ever hope for dependent types to "go mainstream"?

</details>

Fixing the first bullet is harder - we must increase the power of definitional equality. Note this problem might sound less important (it certainly did to me at first), but in larger examples, having rewrites apply only once, immediately, can end up giving rise to so-called "`with`-jenga"[^jenga] where the order of `with` abstractions needs to be chosen extremely carefully to have the types work out (i.e. without resorting to copious amounts of manual coercing). Again, in my opinion, time spent finding solutions to puzzles like these is time wasted (even if solving puzzles can sometimes be fun).

Before I proceed to the proposal, I must give credit where it is due. I originally heard this idea from [Ollef](https://github.com/ollef) on the r/ProgrammingLanguages Discord, and worked through a lot of the tricky details with [Iurii](https://github.com/RiscInside) - thanks for the interesting discussions!

## Solution 2: Neutral -> Value Mappings

Without further ado, the core idea is thus: Make it possible for the context to contain local rewrite rules (from neutrals to values), subject to an occurs check to prevent loops. We can then define dependent pattern matching where the scrutinee is a neutral as a process which adds such rewrite rules to the context (i.e. as opposed to the usual one-time-substitutions-of-variables-for-patterns).

An important note: the solution here is not "complete". I believe this is by necessity (a perfect solution would give arbitrary equality reflection and naturally make typechecking undecidable). It is simply designed to handle a majority of easy cases, with the fall-back of transport-patterns (or manual fording I suppose) always in reach.

TODO: Add paragraph on the occurs check and why it is necessary

Of course, the scrutinee of a pattern match may not always be a neutral or variable. It could be a _canonical value_. More severely, what might have started as a mapping from a neutral might become not so if some later pattern match causes the neutral to unblock. Our proposed scheme for handling such cases is as follows:

- First check if the RHS is a value.
- RHS is a neutral: Invert the direction of the rewrite rule and continue (TODO: justify why this shouldn't lead to loops)
- RHS is a value: Attempt to unify LHS and RHS
  - LHS and RHS unify: Safely discard the rewrite rule. It is redundant.
  - LHS and RHS anti-unify: Report the most recent match as impossible and refuse to typecheck the branch.
  - Typechecker cannot make a decision (e.g: LHS and RHS are functions): (\*)

The final case, (\*), is tricky situation. In the case that this was a new rewrite rule which we just attempted to add, we are probably screwed (the context is very likely reliant on this rewrite to typecheck, but adding a definitional rewrite between potentially not-equal values is BAD [^bad]).

However, if we have reached this case by reducing the LHS of a previously valid rewrite, then we might hope that applying the rewrite eagerly to everything in the context will mean that we might discard the rewrite rule and everything will continue to typecheck (even if prior definitional equalities might no longer hold equal - which is odd, but not the end of the world).

However, recall the subtlety highlighted above as problem (3.):

```agda
Pred : ∀ x y → Fin (x + y) → Set

foo : (x y : ℕ) (n : Fin (x + y)) → Pred x y n → ⊤
foo x y n p with x + y
foo x y fz p | .(suc _) = {!!}
foo x y (fs n) p | .(suc _) = {!!}
```

```
w != x + y of type ℕ
when checking that the type
(x y w : ℕ) (n : Fin w) (p : Pred x y n) → ⊤ of the generated with
function is well-formed
(https://agda.readthedocs.io/en/v2.6.4.2/language/with-abstraction.html#ill-typed-with-abstractions)
```

The `neutral -> value` mapping idea is powerful enough to resolve _many_ of these sorts of cases. To see how, note that `Pred x y : Fin (x + y) → Set`, so in the `fz` branch, we will check `fz` against `Fin (x + y)`. As long as we apply our `x + y -> suc n` rewrite to the goal type, this will succeed!

But of course `Pred x y` is not a variable, and therefore we cannot _record_ the rewritten type in our context (hence why Agda's `with`-abstraction immediate one-off rewrites don't work here). Therefore, if we later match on `x` and `y`, revealing them to both be `zero`, we will have a problem on our hands. Discarding the rewrite (which now would have the form `zero -> suc n`) will result in `Pred x y fz` no longer typechecking! Of course, checking `zero` and `suc _` anti-unify is trivial, so we can report an impossible match, BUT if the problem was just slightly more subtle (perhaps we used Church numerals instead of `ℕ`s) then we would be truly screwed.

So, how do we resolve these cases? I think this has to be some sort of type error, but exactly where to error and what to blame is somewhat debatable. I can think of three different reasonable-ish perspectives:

- The culprit was that the rewrite rule related values whos type can yield undecidable unification problems. Therefore error much earlier, at the original match which introduced the rewrite.
- The culprit is that an expression in the context relied on the rewrite rule but the match made it invalid. Therefore blame the `p : Pred x y n` and the match on `x` and `y`.
- The culprit was that the match on `x` and `y` unblocked the LHS of the rewrite rule which forced it to be discarded (i.e. the problem is _unrelated_ to whether such a rewrite rule was _necessary_ for validity for the context). Therefore blame the `x + y -> suc n` rewrite rule and the match on `x` and `y`.

I'll admit that I am partial to the latter here: I think erroring for any type that could possibly yield an undecidable unification puzzle is too conservative, given this must include not just functions, but also any inductive datatype which might contain a function, and also general QITs/HITs (which are pretty exotic constructions, but are also very exciting features which I would like a modern proof assistant to support well). I also don't like the idea that adding stuff to your context could trigger an error when there was none previously (validity of typechecking being stable under weakening seems highly desirable).

Now to actually try and implement such a feature! (just kidding, I'm a type theorist, I would never write code)

[^slime]: [A polynomial testing principle](https://personal.cis.strath.ac.uk/conor.mcbride/PolyTest.pdf)
[^pattern]: Note that the concept of a "pattern" in dependently typed languages is much more flexible than in mainstream PLs: constructors of inductive families are allowed to be indexed by arbitrary expressions, and so "inaccessible patterns" can take the form of such arbitrary expressions. There are a ton of great papers on the topic of dependent matching, but I don't think you could go wrong with [Eliminating Dependent Pattern Matching](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/99.pdf) as an introduction.
[^with]: [With-Abstraction | Agda Docs](https://agda.readthedocs.io/en/v2.6.4.3/language/with-abstraction.html)
[^inspect]: [With-Abstraction Equality | Agda Docs](https://agda.readthedocs.io/en/v2.6.4.3/language/with-abstraction.html#with-abstraction-equality) [README.Inspect | Agda standard library](https://agda.github.io/agda-stdlib/README.Inspect.html)
[^jenga]: Coined (as far as I know) by Connor McBride, see https://types.pl/@pigworker/112005915524041848, and some discussion of some (IMO very clunky) solutions https://types.pl/@pigworker/112006024839462007, https://types.pl/@pigworker/112016097261103609
[^bad]: Whether such a rule would lead to subject reduction failure or undecidable typechecking probably depends on niche implementation details of conversion checking and evaluation order, but for a sample of the problems, consider the rewrite rule `(λ x y → x) -> (λ x y → y) : Set → Set → Set`. I would argue that a complete implementation of definitional equality should then give us `(λ x y → x) ⊤ (⊤ → ⊤) ≡ ⊤ ≡ ⊤ → ⊤`, at which point we can type self-application and write a fixpoint combinator. Oh dear...
