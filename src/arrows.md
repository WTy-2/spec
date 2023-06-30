# Arrows

WTy2 has a lot of arrows, they are summarised here.

## Function (->)

```WTy2
(->): (Type, Type) -> Type
```

Ordinary function arrow.

## Constructor (~>)

```WTy2
(~>): (Type, Type) -> Type
```

Similar to function arrow, but must be "matchable". i.e: `[x: a, y: a] Proof(f(x) ~ g(y) ==> f ~ g /\ a ~ b)` is in scope.

## Constrained By (<<=)

```WTy2
(<<=): (t: Type, p: t -> Constraint) -> Type
```

Narrows a type, requiring the constraint to be true on the value for it to a member of the new type. When pattern matching on members of the type, the constraint is brought into scope.

## Supertype (<:)

```WTy2
(<:): (Type, Type) -> Constraint
```

Values of the LHS type can be upcast into ones of the RHS type.

## Implies (=>)

```WTy2
(=>): (Constraint, Constraint) -> Constraint
```

The RHS constraint can be obtained from the LHS constraint.

## Entails (|-)

```WTy2
(|-): (Type, Constraint) -> Type
a |- r = a -> Proof(r)
```
