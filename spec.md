# The WTy2 Language Specification

## Type System

### Quantifiers

#### Existential Quantifiers

WTy2 features three different existential quantifiers with different uses. At a high level: `impl` is a reasonable default, `pure` is used for doing dependent type-level reasoning and `exis` is required for anything that interacts with the (scary) untyped outside world.

##### Transparency
- `pure` is fully transparent. This means that modifying the semantics of a function with a `pure`-quantified type, or changing the value of a `pure`-quantified constant is a breaking change.
- Both `impl` and `exis` are opaque.

##### Position Restrictions
- `pure` and `impl` can appear in any type in a WTy2 program. `exis`, on the other hand can only appear in return position of functions.

##### Convertion
- Quantifiers can be implicitly downcast in a hierarchy that goes: `pure` -> `impl` -> `exis`.
- `exis` quantified terms can be converted into `impl` quantified ones by performing an existential bind. An `impl` that depends on an `exis` cannot escape the scope and so must be implicitly converted back into `exis`.
- `impl` quantified terms can be used as arguments to functions expecting `pure` quantified terms, but the return type quantifier then likewise switches from `pure` to `impl`. Another way to think about this rule is that every time a `pure` function is defined, a second, overload of that function where all `pure`s are replaced with `impl`s is defined as well.

#### The Function Type

## Syntax

### Generalised Do Notation

WTy2 features a generalisation of do-notation often used in functional programming languages as syntax sugar for monadic computations. The generalisation means it can be useful when dealing with existentially quantified variables, or other scenarios where the programmer would otherwise be forced to write code in CPS style (perhaps asynchronous code, though the WTy2 language itself currently contains no async features.)

#### Anonymous Bind

WTy2 do-notation contains an additional bit of syntactic sugar on top of the ordinary bind. Often, code in do notation can end up looking something like:

```
x <- readInt();
printInt(x);
```

requiring the result of the producing function be bound. This can often be cumbersome, and so WTy2 also allows you to surround an expression with `||`s to perform an anonymous bind inline:

```
printInt(|readInt()|)
```

##### Unresolved Questions:

Is `||` ideal syntax for anonymous bind? Could it just be inferred?
