# Type Aware Allocators

A goal of WTy2 is to allow for good performance (especially with regards to memory locality) without much additional work on the part of the programmer/enforcing closed-world assumptions on written code.

A major part of this is the concept of a type-aware-allocator. WTy2 makes extensive use of allocators (array based and recursive data structures in WTy2 should ideally be generic over the allocation scheme) so by providing tools to create good ones, almost all data structures should benefit.

As an example for the sort of properties we would like to achieve, suppose our program had a large list of `Int`s, this was then upcasted into a list of `Num`s and then many other opaque `Num`s got added to the list. We then calculate a total sum (note that this operation does not care about the order in which we iterate over the values). Ideally therefore (for cache and memory locality reasons) we should somehow keep all the `Int`s in their own region of memory and sum these first.

The rules for performing specialisation with these allocators should use similar (perhaps the same) rules as ordinary function specialisation. i.e: a good heuristic is if we allocate any value with known concrete type, we should specialise for that type.

It would be ideal if WTy2 could provide some sort of language interface to create custom type-aware alloactors. I do not currently have a good model for how to design this. Difficulties I can currently forsee include prevent the number of specialisations from being observable (to prevent UB - the compiler is free to specialise as much or as little as it wants), and more generally just challenges of writing low-level mutability-based code in a pure functional language.
