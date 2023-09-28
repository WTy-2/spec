# Common Type Operators

WTy2 quite a few common type operators (mostly arrows), they are summarised here.

## Function (`->`)

```WTy2
(->): (t: Ty) -> (t -> Ty) -> Type
a -> b = (f: Fun) <<= { a <: arg(f) /\ res(f) <: b }
```

Dependent function arrow.

In the source language, braces are implicitly added around RHS if necessary.

## Such That (`<<=`)

```WTy2
(<<=): (t: Ty) -> (t -> Constraint) -> Ty
```

Narrows a type, requiring the constraint to be satisfiable for all member values. When pattern matching on values of the type, the constraint is brought into scope.

## Constructor (`~>`)

```WTy2
(~>): (t: Ty) -> (t -> Ty) -> Ty
a ~> b = (a -> b) & Con
```

Similar to function arrow, but must be "matchable". i.e:

```WTy2
a ~> b = (f: a -> b) <<= {
    for(x: a, y: a, g: a ~> b) { f(x) ~ g(x) => f ~ g /\ x ~ y }
  }
```

In the source language, braces are implicitly added around RHS if necessary.

## Subtype (`<:`)

```WTy2
(<:): Ty -> Ty -> Co
t <: u = for(x: t) { x :: u }
```

Values of the LHS type can be upcast into ones of the RHS type.

## Implies (`=>`)

```WTy2
(=>): Co -> Co -> Co
```

The RHS constraint can be obtained from the LHS constraint.

## Forall (`for`) / Derivable (`|-`)

```WTy2
for : (t: Ty, c: t -> Co) -> Co
(|-): (t: Ty, c: t -> Co) -> Co
```

The constraint `c(t)` is derivable from the typing context `t` - i.e: quantified constraints. The operator version `(|-)` exists predominately to allow use of `(<<=)` on the quantified-over type without requiring additional parenthesis.

In the source language, braces are implicitly added around RHS of (`|-`) if necessary.
