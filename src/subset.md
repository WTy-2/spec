# Core Subset

The WTy2 language has now grown to be pretty large. Luckily, many of the features, while they do make the language more expressive and powerful, can in theory be desugared into other constructs. The purpose of this section is to list some of the features that should be prioritised when starting development of a WTy2 compiler:

- Core types (records, tuples, functions, unit, never, any)
- Dependent types (dependent records and function arrows)
- Constraints (equality coercions, type relationships, constrained-by operator)
- Variant declarations
- Type declarations, with associated methods and supertypes
- Default instance declarations
- Match expressions
