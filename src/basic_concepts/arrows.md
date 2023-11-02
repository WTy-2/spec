# Common Type Operators

WTy2 quite a few common type operators (mostly arrows), they are summarised here.

## Function (`->`)

```WTy2
(->): (t: Type) -> (t -> Type) -> Type
a -> b = (f: Fun) <<= { a <: arg(f) /\ res(f) <: b }
```

Dependent function arrow.

In the source language, braces are implicitly added around RHS if necessary.

## Such That (`<<=`)

```WTy2
(<<=): (t: Type) -> (t -> Constraint) -> Type
```

Narrows a type, requiring the constraint to be satisfiable for all member values. When pattern matching on values of the type, the constraint is brought into scope.

## Constructor (`~>`)

```WTy2
(~>): (t: Type) -> (t -> Type) -> Type
a ~> b = (a -> b) & Con
```

Similar to function arrow, but must be "matchable". i.e:

```WTy2
a ~> b = (f: a -> b) <<= {
    for(x: a, y: a, g: a ~> b) { f(x) ~ g(x) => f ~ g /\ x ~ y }
  }
```

In the source language, braces are implicitly added around RHS if necessary.

### Design Question: Is Generativity Necessary?

Haskell assumes type constructors are both injective, and generative, and the work on unsaturated type families still separates functions into those that are both injective and generative, and those that are not necessarily either. However, the benefit of injectivity (for unification) is generally much more useful than generativity, and furthermore, it could be argued that injectivity meshes better with a notion of constructing/matchability anyway (given pattern synonyms are clearly not generative!). Of course, an arbitrary function paired with a proof of injectivity does not provide a strategy to invert it (which is what is _really_ required for pattern matching) but perhaps that just justifies for two types: injective functions, and matchable constructors (the inference and checking of the latter being built-in to the compiler).

## Subtype (`<:`)

```WTy2
(<:): Type -> Type -> Constraint
t <: u = for(x: t) { x :: u }
```

Values of the LHS type can be upcast into ones of the RHS type.

## Implies (`=>`)

```WTy2
(=>): Constraint -> Constraint -> Constraint
```

The RHS constraint can be obtained from the LHS constraint.

## Forall (`for`) / Derivable (`|-`)

```WTy2
for : (t: Type, c: t -> Constraint) -> Constraint
(|-): (t: Type, c: t -> Constraint) -> Constraint
```

The constraint `c(t)` is derivable from the typing context `t` - i.e: quantified constraints. The operator version `(|-)` exists predominately to allow use of `(<<=)` on the quantified-over type without requiring additional parenthesis.

In the source language, braces are implicitly added around RHS of (`|-`) if necessary.
