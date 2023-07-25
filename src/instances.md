# Instances and Overlap

A goal of WTy2 is that adding a valid instance (i.e: no error is detected at the site of the instance) can never break existing code.

Note that Haskell does not actually meet this criteria due to overlap only being checked lazily (when trying to solve the constraint), see:

```hs
class C a

instance C (Char, a)

-- This instance appears to be fine, but causes an error at the
-- call to `bar` due to the instance of `C` becoming ambiguous
{-
instance C (a, Bool)
-}

foo :: ()
foo = bar ('a', True)

bar :: C a => a -> ()
bar _ = ()
```

Following this rule doesn't just lead to a theoretically cleaner language, it has a direct practical benefit: adding instances to a library can never be a breaking change and so does not require a semantic version bump.
