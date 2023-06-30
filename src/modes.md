# Modes

WTy2 is designed to be a language which can be implemented very efficiently, and give programmers control over optimisations. To help with this, WTy2 features ownership and borrowing.

The current design is to follow a strategy similar to the recent developments in OCAML (https://blog.janestreet.com/oxidizing-ocaml-locality/, https://blog.janestreet.com/oxidizing-ocaml-ownership/) avoiding lifetimes.

## Map

```WTy2
map[a, b](l: List(a), f: a -> b): List(b) = ...
```

This function maps over a list and creates a new one.
Ideally, we would like:

- If the list is unique (no other references)
  - If list is entirely unboxed (no pointers)
    - If `a` and `b` are same size
      - Update entire list in place
    - Otherwise create new list and destroy previous
  - If list is linked by boxing `cons` nodes
    - If `a` and `b` are same size
      - Update each cons node in place
    - Otherwise create new cons nodes and destroy previous

Note that if each element is boxed, this reduces to the case of `a` and `b` being the same size (assuming a reference is constant size).

The main conclusion from these cases is that we would like to track when something is unique. We would also like to be able to place a constraint that a variable is unique, to get the guarantee that we can perform the in-place map.

## Fold

```WTy2
foldl[a, b](l: List(a), u: b, f: (a, b) -> b): b = ...
```

Ideas:

Variables in WTy2 are by default owning, meaning if we pass `x: a`, `x` in unique.
References can be created by borrowing. Instead of lifetimes, borrows last until
Like Rust, copies are explicit, unless the variable has a `Clone` instance.
