# Dependent Types

WTy2 features dependent record and function types.

## Dependent Function Arrow

WTy2 also supports dependent function arrows, through a similar mechanism. The argument record to a function is in scope in the return type (including the return constraint), as well as the function body.

Note this makes `<==` constraints on return types somewhat ambiguous in that if the return type of the function is a record with identically named fields (or simply the `it` keyword is used), this could refer to the argument record or the return. WTy2 disambiguates this by treating this case as shadowing. In general, the innermost `it` (and it's associated record names) shadow the outermost one.

Currently, there is no mechanism to forcefully disambiguate (though perhaps some syntax to specify de Bruijn indices or similar could work). The field names of the argument or return record must be changed to refer to the argument record fields in the return constraint.
