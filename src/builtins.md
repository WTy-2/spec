# Builtins

(NOTE: Should superseed "Core Types")

## Dependent Functions

`(->): (a: Type, a -> Type) -> Type`

## Dependent Tuples

| Type   | Cons Operator | Dependent | Heterogeneous |
| ------ | ------------- | --------- | ------------- |
| DepTup | `(:;)`        | Yes       | Yes           |
| Tuple  | `(:,)`        | No        | Yes           |
| List   | `(:.)`        | No        | No            |

I am currently unsure whether to have the built-in version by right or left-nested.

`(:;): (h: f(t), t: DepTup(fs)) -> DepTup(f :. fs)`
