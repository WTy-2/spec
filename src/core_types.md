# Core Types

WTy2 is a language with subtyping and with first-class types. This has an interesting consequence: instead of having some sort of "kind" system, the key language constructs in WTy2 simply implement various built-in types.

## Any ("?")

`?` is the supertype of all types.

## Type

`Type` is the supertype of all "types". This includes anything which can appear on the RHS of a `:` binding.

An automatic instance of `Type` is derived for every type declaration.

## Constraint

`Constraint` represents "constraints". These sometimes look syntactically similar to bindings, but instead of bringing variables into scope, they constrain existing values.

Constraints can be created with the built-in `~` and `=>` operators. Every type `a` also implements `a -> Constraint`, which is the constraint that there exists an instance of the type for that term. i.e: you can imagine for every type `Foo`:

```WTy2
instance Foo -> Constraint for Foo {
    ...
}
```

## Functions

`a -> b` is the generic function type.

## Tuples/Records/Dependent Pairs

Tuples/records/dependent pairs in WTy2 are surprisingly complicated, and so they have their own dedicated section in the spec.

It's worth noting though, that combining the above constructs in tuples typically gives back something that implements the same type.

- Tuple of `Type`s => `Type` (anonymous tuple type)
- Tuple of `Constraint`s => `Constraint` (conjunction)

However...

- Tuple of `Bind`ings => `Type` (record type)

### Unit ("()")

`()` is the unit tuple. It implements `Type`, `Term` AND `Constraint`.

### Design Note: Singleton Tuples

WTy2 does not contain a built-in singleton tuple (but does contain singleton records). Instead `(X)` where `X` does not contain commas is parsed as a parenthesised expression.

### Design Note: Bindings

In WTy2, the types of records look almost identical to `Bind`ings. However, `Bind`ings are NOT first-class. `return (x: Int)` returns a `Type` which is equal to the record type `(x: Int)`. `{x : Int}() = 4` is not a valid way to bring `x` into scope.

## Void ("!")

`!` is the subtype of all types. It contains no inhabitants.
