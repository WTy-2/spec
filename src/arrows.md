# Type Operators

WTy2 quite a few built-in type operators (mostly arrows), they are summarised here.

## Function (`->`)

```WTy2
(->): (t: Type, r: t -> Type) -> Type
```

Dependent function arrow.

In the source language, braces are implicitly added around RHS if necessary.

## Constrained By (`<<=`)

```WTy2
(<<=): (t: Type, p: t -> Constraint) -> Type
```

Narrows a type, requiring the constraint to be satisfiable for all member values. When pattern matching on values of the type, the constraint is brought into scope.

## Constructor (`~>`)

```WTy2
(~>): (t: Type, r: t -> Type) -> Type
```

Similar to function arrow, but must be "matchable". i.e:

```WTy2
a ~> b = (f: a -> b) <<= {
    (x: a, y: a, g: a ~> b) <<= { f(x) ~ g(x) } |- { f ~ g /\ x ~ y }
  }
```

In the source language, braces are implicitly added around RHS if necessary.

## Supertype (`<:`)

```WTy2
(<:): (Type, Type) -> Constraint
t <: u = for(x: t) { x :: u }
```

Values of the LHS type can be upcast into ones of the RHS type.

## Instance Head (`<=:`)

```WTy2
(<=:): (Type, Instanceable)
```

The LHS type is an instance head of the instanceable[^note] type on the RHS.

## Implies (`=>`)

```WTy2
(=>): (Constraint, Constraint) -> Constraint
```

The RHS constraint can be obtained from the LHS constraint.

## Forall (`for`) / Derivable (`|-`)

```WTy2
for : (t: Type, c: t -> Constraint) -> Constraint
(|-): (t: Type, c: t -> Constraint) -> Constraint
```

The constraint `c(t)` is derivable from the typing context `t` - i.e: quantified constraints. The operator version `(|-)` exists predominately to allow use of `(<<=)` on the quantified-over type without requiring additional parenthesis.

In the source language, braces are implicitly added around RHS of (`|-`) if necessary.

[^note]
`Instanceable` is not actually a type in WTy2 (and so `x :: Instanceable` is not a valid constraint). The reason for this is that it breaks some very intuitive and useful laws (e.g: `for(x <: t, y <: t) { x & y <: t }`). The suggested actual condition is to allow only identifiers which are resolved directly as open types (i.e: before performing any reduction). This keeps WTy2 in line with current-day Haskell, but there are other options - see [GHC Issue 13267](https://gitlab.haskell.org/ghc/ghc/-/issues/13267).
