# The WTy2 Language Specification

## IMPORTANT NOTE

As it turns out, designing a programming language without any sort of implementation with which to test out ideas is quite hard. Especially so when I don't even know any languages myself that operate under the same paradigm (dependent types). I think I have a lot of potentially interesting ideas, but playing the role of the programmer, compiler and CPU to evaluate if they are actually feasible/useful, and then crystallising them into concise (and precise) explanations is not easy.

Therefore, I am going to halt progress on writing this spec for a bit while I try and actually write an (extremely minimal) compiler for a tiny subset of the WTy2 language (also I should probably do some revision).

## Introduction

### Meta

#### Syntax Descriptions

Descriptions of syntax in this specification are written in `Haskell` using parser combinators. The motivation is twofold:

- Plain BNF can be quite clunky. There is no mechanism for abstracting cases where patterns could be substituted into others (for example, comma separated lists of tokens need to be redefined for every token).
- Parser combinators (especially when error-related stuff is removed) can lead to code appearing surprisingly clean. This also means I won't have to duplicate working writing the parsing code for WTy2 and syntax descriptions in this spec.

##### Common Combinators

Some common combinators that will be made use of in syntax descriptions in the following document are provided here:

```haskell
commaSep :: Parser a -> Parser [a]
commaSep x = sepBy x ","

commaSep1 :: Parser a -> Parser (NonEmpty a)
commaSep1 x = sepBy1 x ","

parens :: Parser a -> Parser a
parens = between "(" ")"

parensList :: Parser a -> Parser (NonEmpty a)
parensList = parens . commaSep1

brackets :: Parser a -> Parser a
brackets = between "[" "]"

braces :: Parser a -> Parser a
braces = between "{" "}"
```

## Type System

WTy2's type system is likely to be slightly unintuitive to programmers coming from other languages. It has been designed with a couple goals in mind:

- Aim for there to be exactly one "best" way to design every abstraction. If there has to be multiple, the relative trade-offs for each should be obvious and small in number.
- Have it be possible to ensure extremely strong compile-time guarantees (via dependent types), but optionally. It should be possible to start with a program that relies heavily on run-time assertions and bit-by-bit introduce more and more static checks without major refactoring.
- Possible to obtain really fast performance, without a language runtime. WTy2 is designed to eventually be a capable systems programming language, meaning abstractions should ideally be close to zero-cost. WTy2 features linear types, unboxed types (including unboxed closures), and a novel approach to monomorphisation, where the compiler falls back on runtime dispatch (meaning C++/Rust-level performance in the best case, without restrictions on the size of types).
- WTy2 collections are also built using a novel concept of "type-aware allocators", that provide insanely efficient `fmap` performance where order of traversal is unimportant.

In some ways, the WTy2's approach to types is actually closer to an OOP-based language like Java than it is to Haskell: it has subtyping, is strict and allows mutability. A short summary of differences between WTy2, Haskell and OOP languages is provided below.

### Differences from Haskell

- Concrete "types" as they exist in Haskell cannot be written out explicitly. If they could, they would define the runtime value completely (there is a maximum of one inhabiting value for every WTy2 "type"). For this reason, they are often not referred to as "types" but instead as "instance trees".
- If you want to constrain the set of values a term could hold, this should be done with constraints.
- A constraint applied to a term is known as a "binding". Bindings are first class (which allows for dependent types).
- Constraints can be "closed", which enables pattern matching.
- Like Haskell, constraints in WTy2 can imply other constraints. WTy2 also has variance with regards to constraints.
- Instead of typeclasses, WTy2 supports traits.
- ADTs do not exist in WTy2. `data` declarations can only define a single constructor, called a "variant".

### Differences from OOP Languages

- Types of terms are never erased. They can always be fully recovered from the value. This makes automatic monomorphisation feasible (specifically, we can dispatch to a monomorphised function from a generic one).
- WTy2 does not feature inheritance. Default supertrait implementations can be achieved via "named instances" (this is effectively a similar mechanism to `deriving via` in Haskell).
- WTy2 tags all terms that come from the outside world as `exis`. This provides a guaranteed way to see if something will be constant-folded.
- Traits can refer to a `Self` type, making traits like `Eq` and `Ord` much safer.
- WTy2 supports type-level functions in the form of functions that return `Proxy`s.

### Theory

#### Parametricity

A nice benefit of Haskell's type system being pure is that we can conserve "parametricity". An example consequence is how the only function in Haskell that can implement `forall a. a -> a` (without bottom or stuff like `unsafePerformIO`)

### Bindings

```haskell
patBind :: Parser PatBind
patBind = mk PatBind $ parensList singlePatBind
	where
		singlePatBind :: Parser SinglePatBind
		singlePatBind = mk SinglePatBind pat $ ":" >> constraint
```

Bindings can appear as statements, or inside record constraints

### Initialised Bindings

```haskell
initBind :: Parser InitBind
initBind = mk Decl patBind . optional $ "=" >> expr
```

### Generalised Bindings

WTy2 also supports bindings where the LHS is an expression instead of a pattern. In this case, the binding does not bring into scope any variables that occur inside it, the binding instead acting only as a constraint on the result of the expression.

```haskell
genBind :: Parser GenBind
genBind = mk GenBind $ parensList singleGenBind
	where
		singleGenBind :: Pareser GenBind
		singleGenBind = mk SingleGenBind expr $ ":" >> constraint)
```

The "first-class" bindings in WTy2 are of the form of these generalised bindings.

### Traits

```haskell
traitDec :: Parser TraitDec
traitDec = "trait" >> mk TraitDec traitIdent (optional $ "=>" constraint) block

traitIdent :: Parser TraitIdent
traitIdent = mk TraitIdent upIdent tyParams

instanceIdent :: Parser InstanceIdent
instanceIdent = mk InstanceIdent upIndent tyParams

instanceDec :: Parser InstanceDec
instanceDec = mk InstanceDec ("default" >> "instance" >> Nothing <|> "instance" >> upIdent)
	traitIdent ("for" >> constraint) block
```

Named instances are inspired by [main-long.dvi (mpi-sws.org)](https://people.mpi-sws.org/~dreyer/papers/mtc/main-long.pdf) and Haskell's newtype pattern. Default instances can be picked/overidden on a per-module basis. Specific instances can also be selected at call-site:

```WTy2
data Foo(x: Int, y: Bool)

trait Semigroup { ... }

trait Monoid => Semigroup { ... }

instance PlusOr Semigroup for Foo {
	x <> y {
		match(x, y) {
			(Foo(a, b), Foo(c, d)) -> Foo(a + c, b || d)
		}
	}
}

instance MulAnd Semigroup for Foo {
	x <> y {
		match(x, y) {
			(Foo(a, b), Foo(c, d)) -> Foo(a * c, b && d)
		}
	}
}

instance PlusOr Monoid for Foo with PlusOr Semigroup {
	mempty = Foo(0, False)
}

// If the names match we can actually elide the `with`
instance MulAnd Monoid for Foo {
	mempty = Foo(1, True)
}

...

{
	x: Foo = mempty // Error - no default instance
	x: Foo with PlusOr Monoid = mempty // Works, but quite painful
	// Instead, we could specify `local default instance Monoid for Foo := PlusOr`
}
```

We provide some syntax sugar to make cases like:

```WTy2
trait Foo => p
default instance Foo for c
```

```WTy2
instance MonoidVia[x] Monoid for Into[x] <== x: Monoid {
	op x <> y {
		into(x) <> into(y)
	}
}
```

cleaner:

```
trait Foo => p := c
```

### Type Inference

This will be hard.

### Implementation and Performance

#### Intermediate Language

WTy2's type system is not simple. It might be worth investigating existing intermediate languages for other higher-order typed languages such as System FC to see if they might be applicable to WTy2.

#### Monomorphisation

WTy2 is unlike systems programming languages like C++ or Rust in that polymorphic terms cannot feasibly be implemented entirely via monomorphisation. There are a couple reasons for this (both effectively coming down to the fact that WTy2 has too gosh darn many types):

- There are so many "types" in WTy2. Remember every "type" has a maximum of one inhabiting value - this means every integer has different "type" and so functions like `add` would have to be monomorphised for every combination of integers that are summed together.
- WTy2 allows for taking untyped data from the outside world and binding it to terms with stronger types via `exis`. Wherever `exis` appears, all the info about the type that is left is the constraint, and so the resulting function must be monomorphised for every possible inhabiting type.

Still, monomorphisation is a neat trick that can have a profound impact on performance. In some ways, it is especially well-suited to WTy2 as with every different value having a different type - monomorphisation would allow say, a function that takes a boolean and makes multiple decisions based on it, to be compiled twice for the boolean being true or false, eliminating the runtime jumps.

It is therefore suggested that implementations of the WTy2 language consider writing code that detects when it might be appropriate to monomorphise a function, and ensure the runtime representation of types is lossless enough to allow dispatching to these monomorphised copies of functions.

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

### Dependent Types

WTy2 is a dependently typed language in the sense that terms can appear inside constraints.

WTy2 supports a pattern very similar to this, allowing where clauses to define additional constraints and allowing pure terms to appear inside constraints.

```
fun pred(x: Int) -> pure Bool {
	return 0 <= x && x <= 10
}

fun f(x: Int) -> ...
	where f(x): True
{
	...
}
```

An arguably even more idiomatic way to define this in WTy2 though, is to tighten the constraint on `x` directly:

```
trait Pred := Int
	where (0 <= self): True + (self <= 10): True

fun f(x: Pred) -> ... {
	...
}
```

By defining the predicate this way, we take advantage of WTy2's built in intersection type operator, which means we have `0 <= self` and `self <= 10` in scope immediately without having to write a separate proof.

### Return Quantifiers

Central to WTy2's type system are quantifiers. As explicit types themselves are impossible to write out, the programmer must use quantifiers to refer to types indirectly, as the set of types a term could take.

#### Existential Quantifiers

WTy2 features three different existential quantifiers with different purposes. At a high level: `impl` is a reasonable default, `pure` is used for doing dependent type-level reasoning and `exis` is required for anything that interacts with the (scary) untyped outside world.

##### Transparency

- `pure` is fully transparent. This means that modifying the semantics of a function with a `pure`-quantified type, or changing the value of a `pure`-quantified constant is a breaking change.
- Both `impl` and `exis` are opaque.

##### Placement Restrictions

- `pure` and `impl` can appear within any type signature in a WTy2 program. `exis`, on the other hand can only appear in function return types.

##### Convertion

- Quantifiers can be implicitly downcast in the following hierarchy: `pure` -> `impl` -> `exis`.
- `exis` quantified terms can be converted into `impl` quantified ones by performing an existential bind. An `impl` that depends on an `exis` cannot escape the local scope and so must be implicitly converted back into `exis`.
- `impl` quantified terms can be used as arguments to functions expecting `pure` quantified terms, but the return type quantifier then likewise switches from `pure` to `impl`. Another way to think about this rule is that every time a `pure` function is defined, an additional overload of that function where all `pure`s are replaced with `impl`s is defined as well.

#### Universal Quantification and Erased Existentials

WTy2 does not contain a universal quantifier like Haskell's `forall`. Instead, this is represented with function arrows.
Loosely, Haskell's `forall a. a -> a` becomes `[a](a) -> a` in WTy2.

WTy2 also supports erased existentials. For example, say we want to return a vector with an unknown length from a function. We could use a dependent pair:

```
fun returnsVecOfUnknownLength() -> (n: Nat, Vec[t=Int, n])
```

but if the length of vector is not needed by the caller, or the length could be retrieved from the vector itself with a method, then returning the length itself is reundant. Instead, we can write:

```
fun returnsVecOfUnknownLength() -> [n: Nat](Vec[t=Int, n])
```

This is also useful when returning values obeying indexed constraints where the index cannot be represented as a value. For example:

```
data Proxy[c: Constraint]

fun returnsUnknownProxy(args) -> [c]Proxy[c]
```

#### First-Class Functions

WTy2 contains a built-in constraint for functions, written:

```haskell
functionCo :: Parser FunctionCo
functionCo = mk FunctionCo erasedParams (params *> "->") erasedParams params
	where
		erasedParams = optional $ brackets binding
		params = binding
```

`<argument/record_or_tuple_constraint> -> <return/constraint>`

`Fun` contains a single method with no name, which takes a value obeying the argument constraint and returns a result obeying the return constraint.

##### Variance

Functions are contravariant in argument constraint and covariant in return constraint. Note that this, perhaps unintuitively, with the implicit convertion rules for records, allows for treating functions taking records (i.e: `Fun(x: Int, y: Int) -> Int`) as subtypes of functions taking matching tuples (i.e: `Fun(Int, Int) -> Int`). `(x: Int, y: Int)` is indeed not a subtype of `(Int, Int)`, but it is a supertype.

## Syntax

### Generalised Do Notation

WTy2 features a generalisation of do-notation often used in functional programming languages as syntax sugar for monadic computations. The generalisation means it can be useful when dealing with existentially quantified variables, or other scenarios where the programmer would otherwise be forced to write code in CPS style (perhaps asynchronous code, though the WTy2 language itself currently contains no async features.)

#### Inline Bind

WTy2 do-notation contains an additional bit of syntactic sugar on top of the ordinary bind. Often, code in do notation can end up looking something like:

```
x <- readInt();
printInt(x);
```

requiring the result of the producing function be bound. This can become cumbersome, and so WTy2 also allows the programmer to surround an expression with `||`s to perform a bind inline:

```
printInt(|readInt()|)
```

##### Unresolved Questions:

Is `||` ideal syntax for anonymous bind? Could it just be inferred?
Where should the bind be inserted? I just found out Idris supports similar syntax with `!`, and (if I understand correctly) it chooses to insert the bind as high up as possible. I would have thought the opposite (just above the line the bind occurs on), would lead to a more intuitive order of evaluation, but perhaps there is a good reason for this.

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
