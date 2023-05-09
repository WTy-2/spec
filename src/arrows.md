# Arrows

WTy2 has a lot of arrows, they are summarised here.

## Function (->)

```WTy2
(->): Type -> Type -> Type
```

Ordinary function arrow.

## Constructor (~>)

```WTy2
(~>): Type -> Type -> Type
```

Similar to function arrow, but must be "matchable" - i.e: `proof(f: a ~> b, g: a ~ b, x: a, y: a) <== f(x) ~ g(y) -> Proof(f ~ g, a ~ b)` is in scope.

## Constrained By (<==)

```WTy2
(<==): (t: Type) -> (t -> Constraint) -> Type
```

Narrows a type, requiring the constraint to be true on the value for it to a member of the new type. When pattern matching on members of the type, the constraint is brought into scope.

## Supertype (=>)

```WTy2
(=>): Type -> Type -> Constraint
```

A value being a member of the LHS type must be a member of the RHS type.

## Implies (==>)

```WTy2
(==>): Constraint -> Constraint -> Constraint
```

The RHS constraint can be obtained from the LHS constraint.
