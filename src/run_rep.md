# Runtime Representation

Every WTy2 value has an associated "full" representation, which is unique. In practice, values are known to be members of types, which constrains the possible values, and so can be smaller.

Every tag is 32 bits.

## Examples

```WTy2
datatype Bool = True | False;

datatype Nat = 0 | 1 | 2 | 3 | ...;

// Note this is probably not a great choice for representation of `Int` in
// WTy2 base given it means all 32-bit integers are now 64-bits even in compact
// form (and we have negative zero!!). It is just an example.
datatype Sign = Positive | Negative;

datatype Int = MkInt(Sign, Nat);

type Num where { ... };

instance Num for Int where { ... };

type C;

instance C for Int <<= { holds(it.between(2, 5)) }
instance C for Int <<= { holds(it < -1) }
```

| Variable       | Full Repr                          | Compact Repr         |
| -------------- | ---------------------------------- | -------------------- |
| x: Bool = True | `TBool, TTrue`                     | `TTrue`              |
| x: Nat = 3     | `MkInt, T3`                        | `T3`                 |
| x: Int = 3     | `MkInt, TSign, TPositive, TNat T3` | `TPositive, T3`      |
| x: Int = -3    | `MkInt, TSign, TNegative, TNat T3` | `TNegative, T3`      |
| x: Num = 3     | `TNum, TNumIntDict, MkInt, T3`     | `TNum, MkInt, T3`    |
| x: C = 3       | `TC, TCIntDict0, MkInt, T3`        | `TC, TCIntDict0, T3` |

Subtyping

There are actually two possible strategies for combining this scheme with subtyping:

- Make subtyping coercive by adding/removing tags implicitly where necessary. This limits sharing significantly.

- Still point to the original data but ALSO include the type (recall types are first-class values). This makes pattern matching on values of these supertypes much more complicated.

## Comparison of Subtyping Approaches:

```WTy2
data Foo;
datatype B = Bar | Baz;
data Car;
data Coo;

type C = B | 'Foo | 'Car | 'Coo;

type C_Alias = C;
```

```WTy2
foo: C -> ...;

x: ??? = Baz;
foo(x); // How is x passed to foo?
```

`x` is a unique stack allocated `C` (`C : Sized` so this is possible)
`[TB, TBaz]`
`x` is a reference to a `C`
`[TRef, &[TB, TBaz]]`
`x` is a reference to a B (TRefCo = Covariant Reference)
`[TRefCo, &[TB], &[TBaz]]`
`x` is a reference to C_Alias (i.e: if can prove representation is same, then don't need to use TRefCo)
`[TRef, &[TBaz]]`

Costs (i.e: additional allocation on top of the referenced value):

1. None
2. One 8 byte stack allocation
3. One 4 byte heap allocation and one 12 byte stack allocation
4. One 8 byte stack allocation

x is a unique stack allocated C (C : Sized so this is possible)
`[TB, TBaz]`
x is a reference to a C
`[TB, TBaz]`
x is a reference to a B (TRefCo = Covariant Reference)
`[TB, TBaz], [TBaz]`
x is a reference to C_Alias (i.e: if can prove representation is same, then don't need to use TRefCo)
`[TBaz]`

Costs:

1. None
2. None
3. One `size(TBaz) + TB` stack allocation
4. None

Conclusions:

The important difference here is the third case: a heap allocation (of the type, which must be unsized) vs a copy of the value (which can be done on the stack).
