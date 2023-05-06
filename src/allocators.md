# Type Aware Allocators

A goal of WTy2 is to allow for good performance (especially with regards to memory locality) without much additional work on the part of the programmer/enforcing closed-world assumptions on your code.

A major part of this is the concept of a type-aware-allocator. WTy2 makes extensive use of allocators (array based and recursive data structures in WTy2 should ideally be generic over the allocation scheme) so by providing tools to create good ones, almost all data structures should benefit.

As an example for the sort of properties we would like to achieve, suppose our program had a large list of `Int`s, this was then upcasted into a list of `Num`s and then many other opaque `Num`s got added to the list. We then calculate a total sum. Note that this operation does not care about the order in which we iterate over the values - ideally (for cache and memory locality reasons) we should somehow keep all the `Int`s in their own region of memory and sum these first.

The rules for performing specialisation with these allocators should use similar (perhaps the same) rules as ordinary function specialisation. i.e: a good heuristic is if we allocate any value with known concrete type, we should specialise for that type.

A potential path for implementation is "indexed variables":
Syntax WIP, but perhaps something like:

```WTy2
strict foo(t :=> Monoid): List(t) = list(100) { mempty(t) }
```

Here, `foo` should be expanded into a number of variable declarations, using the same rules as function specialisation for how many variables to create.

i.e: one valid expansion would be

```WTy2
foo_Int: List(Int) = list(100) { mempty(t) };
foo_Monoid: List(Monoid) = list(100) { mempty(t) };
```

another is

```WTy2
foo_Monoid: List(Monoid) = list(100) { mempty(t) };
```

Programs should not rely on a specific number of instances being created.
