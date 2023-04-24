# Recursive Types

Elsewhere in this spec (I may go back and fix it up later), I have been relatively loose with defining types like:

```WTy2
data Cons(head: t, tail: List(t))
data Nil

type List(t: Type) = [head: t, tail: List(t)]
                     Is(Cons(head, tail))
                   | Is(Nil)
```

Unfortunately, there is a bit of an issue with values of this type - they have unbounded size! Specifically, if a function takes a `List(Int)`, for example, the actual list it could receive could have any number of `Cons` nodes.

Furthermore, it is not clear how to implement variance for this type. If we have a `List(Int)`, then ideally at each node we would not store any information informing us that the item is an `Int` (we can know that it could be nothing else from the type signature). However, we would like to be able to pass this into functions accepting say `List(Num)`, this would seemingly require creating an entirely new list with the `Int` marker placed on every node.

One potential solution is to simply not use recursive types. WTy2 supplies a an array list type that is fast and provides great memory locality. In languages like Haskell and Closure, however, the utility of being able to create many large data structures that share data cannot really be understated. As a functional language with pattern matching, WTy2 really should be able to achieve something similar.

The way we can achieve this is through references, but perhaps in a slightly different way to what you might imagine coming from languages like Rust.

```
data Cons[r](head: t, tail: List(r, t))
data Nil
type List(r: Ref, t: Type) = [head, tail: List(r, t)]
                             Is(r(Cons(h, t)))
                           | Is(Nil)
```

The main interesting thing about this definition is that `r`, the type variable that will be instantiated to some sort of reference that will break up the infinite type, is generic. We could instantiate `r` to some owning reference type like `Box` and get a definition similar to what we would achieve in Rust, but we can do better.

The problem with `Box` or any other global allocator is that we lose locality. If the elements are added to the list randomly over time, then they will be placed in virtually random locations in memory. What we would like is for every element of the same list to be placed in more-or-less the same location.

```
type Alloc = ...
type RefTo(a: Alloc, t: Type) = ...

// Get the allocator of a reference
fun alloc[a: Alloc, t: Type](r: RefTo(a, t)): Alloc <== { it ~ a }

// Create a new allocator and allocate an expression using it
fun new[t](x: t): [a] RefTo(a, t)

// Allocate to an existing allocator
fun build(a: Alloc, x: t): RefTo(a, t)

// We take advantage of partial signatures to not need to specify the allocator
// in the signatures of 'x' or 'y'
x: List(t=Int) = new(Nil)
y: List(t=Int) = build(alloc(x), Cons(3, x))
```

There are some interesting interactions with enforcing code like this: for example, if you have two different lists, potentially created with different allocators, the elements from one allocator must be all copied into the other. Because of this, it is recommended that if an algorithm involves a lot of merging of linked data structures, there is a single allocator created once and all sub-structures are creates with it.

Note that using allocators like this also helps with the variance problem as mentioned above. Allocators in WTy2 are type-aware. Allocators must provide a way of recovering full type information for every value that is stored by them, but to ensure memory is not wasted, elements with common type prefixes are stored together. The exact mechanism for how to find the prefix is WIP but one could imagine, for instance, a binary tree which is traversed based on the reference and stores the common prefixes at the leaves.

The main downside is arguably the unfortunate amount of syntactic noise. It is hoped that as WTy2 matures, common patterns with this sort of code will be discovered and syntax sugar will be created that can abstract some of it away.
