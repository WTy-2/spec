# Core Language

Implementing a typechecker and compiler for the entire WTy2 language at once is likely to prove somewhat challenging. Here, a design for an intermediate, typed core language (inspired by efforts on GHC) is outlined.

Core-Lang Constructs:

- Lambda case expressions (covers lambdas, matches and let bindings)
- Telescopes: A single built-in datatype covering (dependent) tuples and lists
- Dependent function arrows
- Constraints (equality coercions, type membership, quantified constraints)
- Data declarations
- Type declarations, with associated methods and supertype constraints
- Default instance declarations

Desugaring:

- WTy2 core does not feature named tuples/records. These are instead desugared into telescopes like ordinary tuples and lists.
- In WTy2 core, all function arrows are dependent, meaning a function that takes and returns an integer would be represented as `Int -> { Int }`

Unanswered Questions:

- How to represent recursion? Could either use recursive binders or a dedicated fixpoint operator.
