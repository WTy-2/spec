# The WTy2 Language Specification

## Introduction

### BNF

In the below document, there are many uses of Backus-Naur form (BNF) to describe the syntax of the WTy2 language. Unfortunately, plain BNF has a few limitations which make some common patterns in syntax (such as comma-separated lists of tokens) impossible to abstract over. Therefore, the BNF in use in this document is extended with the concept of "macros".

An example of a BNF macro definition is:

`REPEAT_TWICE(<ARG>) := <ARG> <ARG>`

This can then be used in BNF such as

`REPEAT_TWICE('A' | 'B')`

which should be interpreted as equivalent to explicitly writing out:

`('A' | 'B') ('A' | 'B')`

For those who have previously encountered parser combinators, you might note similarities between many of the uses of these BNF macros used in this document and common combinators.

**Side Note:** After a quick bit of searching, I was unable to find much discussion about a similar extension BNF containing macros, which I find slightly odd, given these macros do not increase the power of BNF in any way but  do make it much more expressive (at the cost of sometimes obscuring the mechanics of a definition).

On consideration, I wonder if it might make more sense to just drop all pretenses and write actual Haskell Megaparsec code when describing syntax. As much I make fun of Jamie about it, he does have a bit of a point: when written well, Haskell/Scala code using parser combinators really is not that dissimilar to BNF.

### BNF Utilities

In the following document, the below common BNF constructs are made use of:

```
COMMA_SEP1(<X>) := <X> (',' <X>)*

COMMA_SEP0(<X>) := COMMA_SEP1(<X>)?

<ident> := TODO
```

## Type System

### Sums, Intersections and Products

Sum types in WTy2 can be expressed with the `|` constraint operator.

Intersection types in WTy2 can be expressed with the `+` constraint operator.

Product types in WTy2 can be expressed using `tuple` or `record` constraints.

### Tuples

In WTy2, the primitive product constraint is the `tuple`. The constraint signature of a tuple follows the form:

`<tuple_constraint> := '(' COMMA_SEP0(<constraint>) ')'`

Tuples are constructed via:

`<tuple_construction> := '(' COMMA_SEP0(<expr>) ')'`

...where the result of each expression must match the respective constraint.

The elements of a tuple can be pattern-matched out with the pattern:

`<tuple_pattern> := '(' COMMA_SEP0(<identifier>) ')'`

### Records

WTy2 also includes another way to express product types known as a "record". The constraint signature of a record follows the form:

```
<record_constraint> := '(' COMMA_SEP1(<field_name/ident> ':' <constraint>) ')' 
```

A record is effectively a tuple with names given to each element.

Record constraints in specific positions (currently just function arguments and variant constructors) can also contain defaults.

```
<record_constraint> := '(' COMMA_SEP1(<field_name/ident> ':' <constraint> ('=' <default/expr>)?) ')' 
```

To make working with records and tuples easier, WTy2 supports converting between different record and tuple types:

#### Tuple -> Record

Tuple-to-record conversions in WTy2 can be perfomed implicitly. Elements of the tuple are matched with fields of the record based on position (i.e: the first element of the tuple is attempted to be matched with the first field of the record and so on). If the tuple is larger than the record, the conversion fails. If the record is larger than the tuple, all remaining, unmatched fields must have defaults and are initialised with them.

#### Record -> Tuple

Record-to-tuple conversions in WTy2 are not implicit. Instead, all record traits contain a compiler-implemented method `toTuple()`, which converts the record into a tuple, retaining ordering of the fields.

#### Record -> Record

Let "A" be the record being converted from and "B" be the record being converted to. Then the process for matching the two records is as follows:

```
(1) Try to match all fields of B with same-named fields in A.
(2) Try to initialise any remaining fields in B with defaults.
(3) Fail if any fields in B remain unitialised
```

### Construction

Construction of records in WTy2 allows for combining positional (anonymous) and named fields.

```
<positional_arg> = <expr>
<named_arg> = <ident> '=' <expr>
<record_construction> = '(' COMMA_SEP0(<positional_arg>) COMMA_SEP0(<named_arg>) ')'
```

The steps to match a record construction with a record constraint are as follows:
```
Let N be the number of positional arguments, and M be the number of named arguments in the construction.
(1) Check if any of the named arguments in the construction match names with one of the first N fields in the constraint. Fail if so.
(2) Try to match the first N fields of the record constraint with the positional arguments.
(3) Try to match all of the named arguments in the construction with remaining arguments in the constraint.
(4) Try to initialise any remaining fields in the constraint with defaults.
(5) Fail if any fields in the constraint remain uninitialised.
```

Note an interesting consequence of these rules is that any number of additional named fields can be specified in a constructor that do not appear in the resulting record constraint:
`
```
r: (x: Int, y: Int) = (x: 3, y: 1, z: 5)
```

One way to read this is as constructing a record that obeys the constraint `(x: Int, y: Int, z: Int)` and then implicitly converting that into `(x: Int, y: Int)`. Implementations of WTy2 may want to warn the programmer in such cases.

#### Design Note: Transitivity

Transitivity of implicit conversions between types in WTy2 is a very useful property to try and retain, both for making the language intuitive to the programmer and for making implementation of type checking and inference easier. Decisions with regards to where types of record constraints can appear and which convertions can be done implicitly should be made carefully to ensure transitivity is not broken.

Note if defaults could appear simply in the constraints of local variables, it would be possible to have:

```
r1: (x: Int, y: Int) = (2, 3)
r2: (x: Int, z: Int = 4) = r1
r3: (x: Int, z: Int) = r2
```

But clearly the assignment `r3 = r1` should not be allowed directly.

Similarly, if `toTuple` could be done implicitly, a programmer could write:

```
r1: (x: Int, y: Int) = (2, 3)
p: (Int, Int) = r1
r2: (a: Int, y: Int) = p
```

But `r2 = r1` should be disallowed.

#### Unresolved Questions

- Should records support row polymorphism, or should convertion just throw away unmatched fields?
	- Row polymorphism would be quite a powerful feature, but it is unclear how it would operate with data declations (would the constructors also be polymorphic?)
- Could record constraints containing default expressions appear in more places?
- At what point should the default expression be evaluated? It is part of a signature, so compile-time seems most natural, but WTy2's advanced typing features could make something even more ambitious here possible if there is a good use-case.

### Variants

Data declarations in WTy2 allow for defining variants, which are effectively tagged records/tuples. Definitions follow the BNF:

```
<record_or_tuple_constraint> := <record_constraint> | <tuple_constraint>
<data_dec> := 'data' <tag_name/identifier> <contents/record_or_tuple_constraint>?
```

One data declaration defines both a closed trait and a constructor which can create values satisfying the trait, both sharing the tag name.

#### Design Note: The Set of Tags

Defining constructors independently of the sum types they are used in (and allowing them to be used in multiple sum types) is similar in principle to polymorphic variants in OCAML (see: [OCaml - Polymorphic variants](https://v2.ocaml.org/manual/polyvariant.html)).

All tags must share the same space of values given they can be combined in arbitrary disjunction constraints. This means the arguably most natural implementation is to simply prefix any variant with an integer, with every tag given a unique integer value. While this does have the advantage that no convertion work needs to be done when passing a value satisfying `A` to a function that expects `A | B`, it does mean zero-cost newtype wrappers as often used in Haskell are impossible. Luckily, WTy2 provides features to try and avoid this idiom (see named instances).

### Quantifiers

Central to WTy2's type system are quantifiers. As explicit types themselves are impossible to write out, the programmer must use quantifiers to refer to types indirectly, as the set of types a term could take.

WTy2 currently includes one universal quantifiers, that quantifies over constraints, and three existential quantifiers, that quantify over types. It might be interesting to investigate allowing existential quantification over constraints and/or universal quantification over types as future features.

#### The Universal Quantifier

In WTy2, the universal quantifier is `for`. As mentioned above, `for`, quantifies over **constraints**, not types, which means that types that are polymorphic over constraints can be represented by it. Using it, we can express the type of the identity function:

`id: for a: Type. Fun(a) -> a`

The quantification can also be moved to the left of the constraint signature:

`id[a: Type]: Fun(a) -> a`

The latter intended as preferred style, but there are places where writing out the quantifier explicitly is necessary (i.e: when nested inside some other constraint).

#### Existential Quantifiers

WTy2 features three different existential quantifiers with different purposes. At a high level: `impl` is a reasonable default, `pure` is used for doing dependent type-level reasoning and `exis` is required for anything that interacts with the (scary) untyped outside world.

##### Transparency

-   `pure` is fully transparent. This means that modifying the semantics of a function with a `pure`-quantified type, or changing the value of a `pure`-quantified constant is a breaking change.
-   Both `impl` and `exis` are opaque.

##### Placement Restrictions

-   `pure` and `impl` can appear within any type signature in a WTy2 program. `exis`, on the other hand can only appear in function return types.

##### Convertion

-   Quantifiers can be implicitly downcast in the following hierarchy: `pure` -> `impl` -> `exis`.
-   `exis` quantified terms can be converted into `impl` quantified ones by performing an existential bind. An `impl` that depends on an `exis` cannot escape the local scope and so must be implicitly converted back into `exis`.
-   `impl` quantified terms can be used as arguments to functions expecting `pure` quantified terms, but the return type quantifier then likewise switches from `pure` to `impl`. Another way to think about this rule is that every time a `pure` function is defined, an additional overload of that function where all `pure`s are replaced with `impl`s is defined as well.

#### First-Class Functions

WTy2 contains a built-in constraint for functions, written: 

`'Fun' <argument/record_or_tuple_constraint> -> <return/constraint>`

`Fun` contains a single method with no name, which takes a value obeying the argument constraint and returns a result obeying the return constraint.

##### Variance

Functions are contravariant in argument constraint and covariant in return constraint. Note that this, perhaps unintuitively, with the implicit convertion rules for records, allows for treating functions taking records (i.e: `Fun(x: Int, y: Int) -> Int`) as subtypes of functions taking matching tuples (i.e: `Fun(Int, Int) -> Int`). `(x: Int, y: Int)` is indeed not a subtype of `(Int, Int)`, but it is a supertype.

## Syntax

### Generalised Do Notation

WTy2 features a generalisation of do-notation often used in functional programming languages as syntax sugar for monadic computations. The generalisation means it can be useful when dealing with existentially quantified variables, or other scenarios where the programmer would otherwise be forced to write code in CPS style (perhaps asynchronous code, though the WTy2 language itself currently contains no async features.)

#### Anonymous Bind

WTy2 do-notation contains an additional bit of syntactic sugar on top of the ordinary bind. Often, code in do notation can end up looking something like:

```
x <- readInt();
printInt(x);
```

requiring the result of the producing function be bound. This can become cumbersome, and so WTy2 also allows the programmer to surround an expression with `||`s to perform an anonymous bind inline:

```
printInt(|readInt()|)
```

##### Unresolved Questions:

Is `||` ideal syntax for anonymous bind? Could it just be inferred?

### Partial Application

WTy2 is a functional programming language, so convenient partial application is quite important for writing clean, ergonomic code. Unlike many other functional programming languages however, WTy2 does not encourage currying functions, which means the traditional FP approach of partially applying using combinators is not exactly idiomatic. At the same time, introducing lambdas for every partial application is quite clunky.

WTy2 therefore provides a bit of syntax sugar to help here. Between the function and the record constructor, a `~` can be inserted. In this case this, fields are matched up like normal, but any remaining unmatched fields are placed, retaining order, into a new record constraint. This constraint is used as the argument constraint for a new closure which performs the full application.

#### Example Usage

```
fun addThree(x: Int, y: Int, z: Int) -> pure Int {
	return x + y + z
}

// All below expressions perform the same function call
addThree(1, 2, 3)
fun(y: Int){ addThree(1, y, 3) }(2)
addThree~(x: 1, z: 3)(2)
addThree~(1)~(2)~(3)()
```

#### Unresolved Questions

Is prefix `~` the best choice of syntax? Looking at just the end of the application, it is not obvious whether a function is being called or closure has been created. A potential alternative is to use `<>`s instead of `()`s, but this would potentially run into the parsing issues other languages encounter when treating `<>`s as a type of brackets (i.e: disambiguating with comparison operators).
