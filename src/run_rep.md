# Runtime Representation

WTy2 values are effectively just linked lists [^note] of tags, where every tag is 32 bits. Every value has an associated "full" representation, which is unique. In practice, though values are known to be members of types, which constrains the possible values, and so can be smaller.

How these lists of tags work is probably best illustrated with examples...

## Examples

```WTy2
datatype Bool = True | False;

datatype Nat = 0 | 1 | 2 | 3 | ...;

// Note this is probably not a great choice for representation of `Int` in
// WTy2 base given it means all 32-bit integers are now at least 64-bits in
// (and we have negative zero!!). It is just an example.
datatype Sign = Positive | Negative;

datatype Int = MkInt(Sign, Nat);

type Num where { ... };

instance Num for Int where { ... };

type C;

instance C for Int <<= { holds(it.between(2, 5)) }
instance C for Int <<= { holds(it < -1) }
```

| Variable       | Full Repr                           | Compact Repr         |
| -------------- | ----------------------------------- | -------------------- |
| x: Bool = True | `TBool, TTrue`                      | `TTrue`              |
| x: Nat = 3     | `TMkInt, T3`                        | `T3`                 |
| x: Int = 3     | `TMkInt, TSign, TPositive, TNat T3` | `TPositive, T3`      |
| x: Int = -3    | `TMkInt, TSign, TNegative, TNat T3` | `TNegative, T3`      |
| x: Num = 3     | `TNum, TNumIntDict, MkInt, T3`      | `TNum, MkInt, T3`    |
| x: C = 3       | `TC, TCIntDict0, MkInt, T3`         | `TC, TCIntDict0, T3` |

## Subtyping

There are two possible strategies I can think of for combining this scheme with subtyping:

- Make subtyping coercive by copying and adding/removing where necessary. This limits sharing significantly.

- Still point to the original data but ALSO include the type (recall types are first-class values). This makes pattern matching on values of these supertypes much more complicated.

[^note]:
    I think packing tags in memory might actually be possible if we added a special tag denoting a reference which could appear in any place in a value, but I need to think this over more.
    In any case, this packing definitely would make implementation much more complicated, and for an initial compiler I really want something easy and consistent, not necessarily fast.
