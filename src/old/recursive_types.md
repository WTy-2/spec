# Recursive Data Types

Elsewhere in this spec (I may go back and fix it up later), I have been relatively loose with defining types like:

```WTy2
data Cons(head: t, tail: List(t))
data Nil

type List(t: Type) = [head: t, tail: List(t)]
                     Is(Cons(head, tail))
                   | Is(Nil)
```

Unfortunately, there is a bit of an issue with values of this type - they have unbounded size! Specifically, if a function takes a `List(Int)`, the actual list it could receive when called could contain any number of `Cons` nodes.

Furthermore, it is not clear how to implement variance for this type. If we have a `List(Int)`, then ideally at each node we would not store any information informing us that the item is indeed an `Int` (we can know that it could be nothing else from the type signature). However, we would like to be able to pass this into functions accepting say `List(Num)`. This would seemingly require creating an entirely new list with the `Int` tag attached to every node.

One potential solution is to simply not use recursive data types. An array list-based data structure would help to avoid these problems and would also provide great memory locality. In functional languages like Haskell and Closure, however, the utility of being able to create large linked structures that utilise sharing cannot really be understated. WTy2 should be able to achieve something similar.

The solution is references, but with perhaps a slightly different flavour to what you might imagine coming from languages like Rust.

```WTy2
data Cons[r: Ref](head: t, tail: List(r, t))
data Nil
type List(r: Ref, t: Type) = r(
    [head, tail: List(r, t)] Is(Cons(head, tail))
                           | Is(Nil)
    )
```

The main interesting thing about this definition is that `r`, the type variable that will be instantiated to some sort of reference that will break up the infinite structure, is generic. We could instantiate `r` to some owning reference type like `Box` and get a definition similar to what we would achieve in Rust, but we can also do better.

The problem with `Box` or any other global allocator is poor memory locality. If the elements are added to the list randomly over time, then they will be placed in effectively random locations in memory. What we would like is for every element of the same list (not just same type!) to be placed in more-or-less the same location (note this idea is similar to that of arenas in Rust).

```WTy2
type Alloc = ...
type RefTo(a: Alloc, t: Type) = ...

// Get the allocator of a reference
allocOf[a: Alloc, t: Type](r: RefTo(a, t)): Alloc <== { it ~ a }

// Would be a method of the 'Alloc' type
alloc(a: Alloc, t: Type): RefTo(a, t)

// Create a new allocator and allocate an expression using it
new[t](x: t): [a] RefTo(a, t)

// Function application, but wrap in the allocator at the end
build[a: Alloc, t: Type](x: RefTo(a, t), f: RefTo(a, t) -> t)
    : RefTo(a, t) = alloc(allocOf(x), f(x))

// We take advantage of partial signatures to not need to specify the allocator
// in the signatures of 'x' or 'y'
x: List(t=Int) = new(Nil)
y: List(t=Int) = build(x) { Cons(3, it) }


// Alternate style, arguably neater but requires some extra busywork

type ConsLike(r, t) = [head: t, tail: List(r, t)] Is(Cons(head, tail))

// Would likely be a method of some type
// '(,..)' denotes partial application
// (i.e: will fill in the other arguments later)
allocOfCons[a: Alloc, r: RefTo(a,..), t: Type]
    (x: ConsLike(r, t)): Alloc <== { it ~ a  }
    = match(x) case(Cons(_, tail)) -> allocOf(tail)


altBuild[a: Alloc, r: RefTo(a,..), t: Type]
    (x: ConsLike(r, t)): List(r, t)
    = alloc(allocOfCons(x), x)


z: List(t=Int) = altBuild(Cons(3, x))
```

There are some interesting consequences of enforcing code like this. For example, if you have two different lists, potentially created with different allocators, the elements from one allocator must be all copied into the other. Because of this, it is recommended that if an algorithm involves a lot of merging of linked data structures, there a single allocator is created at the start and all sub-structures are built up with it.

Note that having the allocator responsible for storing all nodes also helps with the variance problem as mentioned above. Allocators in WTy2 must provide a way of recovering full type information for every value that is stored by them, but to ensure memory is not wasted, a good allocator would store elements with common type prefixes together and avoid duplicating said prefix. The exact mechanism for how these prefixes are represented is WIP and would be dependent on the allocator in question, but one could imagine, for instance, a binary tree which is traversed based on the reference and stores the common prefixes at the leaves.

The main downside is arguably the unfortunate amount of syntactic noise (for instance, compared to similar linked data structures in Haskell). Still, this is somewhat to be expected in a more low-level programming language - with the clutter comes flexibility.

A very nice side-effect is that in simple cases, as `r` is not restricted to be matchable (it uses the ordinary function arrow), references can be omitted for known finitely sized structures.

```WTy2
x: List(r={it}, t=Int) = Cons(1, Cons(2, Cons(3, Nil)))
```

Note this works because the type of `x` is elaborated with the constraint `x ~ Cons(1, Cons(2, Cons(3, Nil)))` which fixes the size of `x`.

In theory, this means lists with constraints that ensure finite length should also be allowed. In practise, compilers may want to try and detect these cases by iterating through potential inhabiting values. If iterating through all potential inhabiting values takes too long, it is likely that the structure is large enough that it would benefit from being heap allocated anyway. Perhaps it could be made possible (via dependent types) to allow the programmer to write proofs that a constraint implies that the size of the type is bounded.
