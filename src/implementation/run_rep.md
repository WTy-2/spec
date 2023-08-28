# Runtime Representation

Note that there is likely a **ton** of flexibility here, and I know very little about writing efficient language runtimes/low-level performance optimisation. The design I layout here is just a suggestion, that will probably be changed significantly over time [^note].

WTy2 values are linked lists [^note] of tags, where each tag is 32-bits. The starting point for this idea is that these lists of tags are just the natural serialisations of the values (i.e: the `data` constructors). All tags are associated with some source-code identifier, and so to illustrate below, I will denote all tags as `T_<Ident>` where `<Ident>` is the associated identifier.

The first obvious issue with this is how to fit all the tags into 32-bits. For example, 32-bit integers alone would fill the space of tags. This is fixed by giving `datatype` declarations slightly unique semantics. A `datatype` defines one tag for the type, and then all variants are placed in a separate tag-space (and so are free to overlap with other tags in other `datatype`s).

To clarify, after the below two declarations:

```WTy2
datatype Bool0 where
  True  : Bool0
  False : Bool0

data True0
data False0
type Bool1 = True1 | False1
```

`x: Bool0 = True0` and `y: Bool1 = True1` (in the absense of other optimisations) will have differently lengthed tag lists at runtime - `x` will have a tag list of length two (`T_Bool0` and `T_True0`), while `y` will just be a single tag (`T_True1`).

In order to "be not stupid" [^note], tags which are known to be fixed at compile time really should be elided. Achieving this is subtle though. Consider that WTy2 allows writing extensional proofs about functions like `for(x: Int) { foo(x) :: Int }` - does this mean we must elide the `T_Int0` tag from `foo`-returned values? Achieving this consistently in general is catastrophically undecidable (for the same reason WTy2 bounds the number of automatic proof insertions to one per goal constraint).

TODO - Come up with some tag-elision system that actually works, and supports aliasing (HARD).



[^note]: FYI, for a while, I really was aiming to avoid dictionary passing in ,pst cases by having longer tag lists which retain enough information to do instance selection, and dispatching based on those - I still am not sure if this is a good idea or not, but it felt much messier than what I currently outline here.
[^note]:
    I think packing tags in memory might actually be possible if we added a special tag denoting a reference which could appear in any place in a value, but I need to think this over more.
    In any case, this packing definitely would make implementation more complicated, and for an initial compiler I really want something easy and consistent, not necessarily fast.

[^note]: https://youtu.be/BcC3KScZ-yA?t=2150
