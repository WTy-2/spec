# The WTy2 Language Specification

## Type System

### Sums, Intersections and Products

Sum constraints in WTy2 can be expressed with the `|` constraint operator.

Intersection constraints in WTy2 can be expressed with the `+` constraint operator.

Product constraints in WTy2 can be expressed using `record` constraints.

### Records

In WTy2, the primitive product type is the `record`. The constraint signature of a record follows the form:
`'(' (<field_name/identifier> ':' <constraint> '=' <default/expr>? ',')* ')'

WTy2 supports implicit convertion between records with matching field names/constraints. In the case where a record being converted into contains a field that does not exist in the record being converted from, the value of the default expression is used (only if there is no default expression for that field does )

#### Unresolved Questions

- Should records support row polymorphism, or should convertion just throw away unmatched fields?
	- Row polymorphism would be quite a powerful feature, but it is unclear how it would operate with data declations (would the constructors also be polymorphic?)
- At what point should the default expression be evaluated? It is part of a signature, so compile-time seems most natural, but WTy2's advanced typing features could make something even more ambitious here possible if there is a good use-case.

#### Tuples/Anonymous Fields

A potential extension to this record syntax left for future work is suport for tuples with anonymous fields (i.e: tuples). The semantics for how these should integrate with existing records both syntax and semantics-wise is left for future work.

### Tagged Records/Variants

Data declarations in WTy2 allow for defining tagged records. They follow the BNF:

`'data' <tag_name/identifier> <contents/record_type>?`

One data declaration defines both a closed trait and a constructor which can create values satisfying the trait, both sharing the tag name.

#### Additional Notes

Defining constructors independently of the sum types they are used in (and allowing them to be used in multiple sum types) is similar in principle to polymorphic variants in OCAML (see: [OCaml - Polymorphic variants](https://v2.ocaml.org/manual/polyvariant.html)).

All tags must share the same space of values given they can be combined in arbitrary disjunction constraints. This means the arguably most natural implementation is to simply prefix any tagged record with an integer, with every tag given a unique integer value. While this does have the advantage that no convertion work needs to be done when passing a value satisfying `A` to a function that expects `A | B`, it does mean zero-cost newtype wrappers as often used in Haskell are impossible. Luckily, WTy2 provides features to try and avoid this idiom (see named instances).

### Quantifiers

#### Existential Quantifiers

WTy2 features three different existential quantifiers with different uses. At a high level: `impl` is a reasonable default, `pure` is used for doing dependent type-level reasoning and `exis` is required for anything that interacts with the (scary) untyped outside world.

##### Transparency

-   `pure` is fully transparent. This means that modifying the semantics of a function with a `pure`-quantified type, or changing the value of a `pure`-quantified constant is a breaking change.
-   Both `impl` and `exis` are opaque.

##### Placement Restrictions

-   `pure` and `impl` can appear within any type signature in a WTy2 program. `exis`, on the other hand can only appear in function return types.

##### Convertion

-   Quantifiers can be implicitly downcast in the following hierarchy: `pure` -> `impl` -> `exis`.
-   `exis` quantified terms can be converted into `impl` quantified ones by performing an existential bind. An `impl` that depends on an `exis` cannot escape the local scope and so must be implicitly converted back into `exis`.
-   `impl` quantified terms can be used as arguments to functions expecting `pure` quantified terms, but the return type quantifier then likewise switches from `pure` to `impl`. Another way to think about this rule is that every time a `pure` function is defined, an additional overload of that function where all `pure`s are replaced with `impl`s is defined as well.

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

requiring the result of the producing function be bound. This can often be cumbersome, and so WTy2 also allows the programmer to surround an expression with `||`s to perform an anonymous bind inline:

```
printInt(|readInt()|)
```

##### Unresolved Questions:

Is `||` ideal syntax for anonymous bind? Could it just be inferred?

### Partial Application

WTy2 is a functional programming language, so convenient partial application is quite important for writing clean, ergonomic code. Unlike many other functional programming languages however, WTy2 does not encourage currying functions, which the traditional FP approach of partially applying using combinators is not idiomatic. At the same time, introducing lambdas for every partial application is very clunky.

WTy2 therefore provides a bit of syntax sugar to help here. Between the expression that evaluates to a function and the parenthesis containing the arguments, a `~` can be added. With this, fields are matched up like normal, but any remaining fields are packed into a new record type, and a closure is returned that takes this record, and then calls the function with the combination of all fields.

#### Example Usage

```
fun addThree(x: Int, y: Int, z: Int) -> pure Int {
	return x + y + z
}

// All below are equivalent
addThree(1, 2, 3)
addThree~(x: 1, z: 3)(2)
addThree~(1)~(2)~(3)()
```

#### Unresolved Questions

Is prefix `~` the best choice of syntax? Looking at just the end of the application, it is not obvious whether a function is being called or closure has been created. A potential alternative is to use `<>`s instead of `()`s, but this would potentially run into the parsing issues other languages encounter when treating `<>`s as a type of brackets (i.e: disambiguating with comparison operators).
