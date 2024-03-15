# Dependent Pattern Matching, Without Green Slime

Disclaimer: This is basically a blog post. I should start hosting my own website so I can write real blog posts...

TODO: Add footnotes/references

A classic pain point in proof assistants based on ITT is problems with "green slime".

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

These arise from how unification problems between neutrals and values are undecidable.

Unification between neutrals and variables is easy: all we need to do is perform a substitution, which is what allows

```agda
foo : (x : ℕ) → Fin x → ⊤
foo x fz = {!!}
foo x (fs _) = {!!}
```

to be elaborated into

```agda
foo : (x : ℕ) → Fin x → ⊤
foo x@.(suc _) fz = {!!}
foo x@.(suc _) (fs \_) = {!!}
```

We could attempt a similar translation for more complicated indices, using a `with`-abstraction

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

This typechecks, but we have lost all connection between the index of the `Fin` and `x + y`. Such a `with` abstraction only works by replacing all occurences of `x + y` in the context with a new variable, so this is an inherent limitation.

Luckily, using Agda's `with ... in ...` syntax (or the `inspect` idiom) we can retain propositional evidence of this connection

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

3. Sometimes, with abstractions in Agda become "ill-typed". In the case of `foo`, this can happen if some expression in the context relies on the `Fin` being indexed by `x + y` definitionally to typecheck.

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

To resolve these last two points, I propose a new syntax: "transport-patterns". Simply put: we allow a built-in transport operator to appear in patterns, allowing us to match without fear of "green slime" while also binding propositional equality of the indices.

```agda
foo : (x y : ℕ) → Fin (x + y) → ⊤
foo x y (coe p fz) = {!!}
foo x y (coe p (fs n)) = {!!}
```

In contrast to with-abstractions, we don't try to replace the index expression in the context. Instead, we just replace the variable we matched on with a transported value.

Personally, I think this feature alone is already a huge improvement on the status quo. Of course the user could always resort to doing their own fording transformations, but this often infects many other parts of the development with unnecessary clutter (passing and matching on `refl`s), i.e. in the cases where unification would have worked out.

More than this, I think my frustration with the manual translations is that they force the user to put thought into what ought to be irrelevant, low-level, implementation details, distracting from the larger developments. i.e. in my opinion, time spent pondering question such as:

- "Can I abstract over the index here or will that be ill-typed?"
- "When a function matches on a datatype indexed by a neutral AND the constructor is _also_ indexed by a neutral, should I do a fording translation of the function or the constructor?"
- and "What about if in some cases, one of the neutrals ends up being allowed to reduce to a value just in time for the matches to work out?"

is a complete waste of effort.

Fixing the first bullet is harder - we must increase the power of definitional equality. Note it might sound less important (it certainly did to me), but in larger examples, having rewrites apply only once, immediately, can end up giving rise to so-called `with`-jenga where the order of `with` abstractions needs to be chosen extremely carefully to have the types work out (i.e. without resorting to copious amounts of manual coercing). Again, in my opinion, time spent finding solutions to puzzles like these is time wasted (even if solving puzzles can sometimes be fun).

Before I proceed to the proposal, I must give credit where it is due. I originally heard this idea from Ollef on the r/ProgrammingLanguages Discord, and worked through a lot of the tricky details with Iurii - thanks for the interesting discussions!

Without further ado, the core idea is thus: Make it possible for the context to contain local rewrite rules (from neutrals to values), subject to an occurs check to prevent loops. We can then define dependent pattern matching as a process which adds such rewrite rules to the context (i.e. as opposed to the usual one-time-substitutions-of-variables-for-patterns).

An important note: the solution here is not "complete". I believe this is by necessity (a perfect solution would give arbitrary equality reflection and naturally make typechecking undecidable). It is simply designed to handle a majority of easy cases, with the fall-back of transport-patterns (or manual fording) always in reach.

TODO: Add paragraph on the occurs check and why it is necessary

Of course, the scrutinee of a pattern match will not always be a neutral. More severely, what might have started as a mapping from a neutral might become not so if some other pattern match causes the neutral to unblock. Our proposed scheme for handling such cases is as follows:

- First check if the RHS is a value.
- RHS is a neutral: Invert the direction of the rewrite rule and continue (TODO: justify why this shouldn't lead to loops)
- RHS is a value: Attempt to unify LHS and RHS
  - LHS and RHS unify: Safely discard the rewrite rule. It is redundant.
  - LHS and RHS anti-unify: Report the most recent match as impossible and refuse to typecheck the branch.
  - Typechecker cannot make a decision (e.g: LHS and RHS are functions): (\*)

The final case, (\*), is tricky situation. In the case that this was a new rewrite rule we just attempted to add, we are almost definitely screwed; however, if we have reached this case by reducing the LHS of a previously valid rewrite, then we might hope that applying the rewrite eagerly to everything in the context will mean we are allowed to now discard the rewrite rule and everything will continue to typecheck (even if previously definitionally equal things might now not be definitionally equal - which is odd, but not the end of the world).

However, recall the subtlety highlighted above as problem (3.). Conveniently, the neutral -> value mappings often can help us in these sorts of cases; one perspective on how is that `Pred x y : Fin (x + y) → Set`, so in the `fz` branch, we will check `fz` against `Fin (x + y)`. As long as we apply our `x + y -> suc n` rewrite to the goal type, this will succeed!

But of course `Pred x y` is not a variable, and therefore we cannot record the rewritten type in our context (hence why Agda's `with`-abstraction immediate one-off rewrites don't work here). Therefore, if we later match on `x` and `y` revealing them to both be `zero`, we will have a problem on our hands. Discarding the rewrite (which now would have the form `zero -> suc n`) will result in `Pred x y fz` no longer typechecking! Of course, `zero` and `suc _` anti-unify, so we can report an impossible much, but if the problem was more subtle (perhaps we used Church numerals instead of `ℕ`s) then we would be truly screwed.

So, how do we resolve these cases? I think this has to be some sort of type error, but exactly where to error and what to blame is somewhat debatable. I can think of three different reasonable-ish perspectives:

- The culprit was that the rewrite rule related values whos type can yield undecidable unification problems. Therefore error much earlier, at the original match.
- The culprit is that an expression in the context relied on the rewrite rule but the match made it invalid. Therefore blame the `Pred x y n` and the match on `x` and `y`.
- The culprit was that the match on `x` and `y` unblocked the LHS of the rewrite rule which forced it to be discarded (i.e. the problem is unrelated to whether such a rewrite rule was necessary validity for the context). Therefore blame the `x + y -> suc n` rewrite rule and the match on `x` and `y`.

I'll admit that I am partial to the latter here: I think erroring for any type that could possibly yield an undecidable unification puzzle is too conservative, given this must include any inductive datatype which might contain a function (and of course functions themselves), and also general QITs/HITs (which are pretty exotic constructions, but are also very exciting features which I would like a modern proof assistant to support), and I don't like the idea that adding stuff to your context could cause an error (typechecking being stable under weakening seems desirable).

Now to actually try and implement such a feature! (just kidding, I'm a type theorist, I would never write code)
