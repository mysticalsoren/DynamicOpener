# DynamicOpener
A dynamic scenario loader that **runs once** the very start of a new adventure.

This aims to solve the use of "they", "their" in scenario openings when genders are up to the user. This ambiguity is left to the AI even if the user has stated explicitly of the character's gender, so with a little bit of ***conditionals***, hopefully, it'll lessen the maintenance for the user.

<hr>

### Makes changes on
* Plot Essentials
* Author's Note
* StoryCards
* History*

\* See [Optional implementation](#optional-implementation)
<hr>


A note before getting started, I haven't tested this with a ongoing adventure so errors may occur.

# Implementation
In either [`input`](./src/input.js) or [`context`](./src/context.js):
```js
[...]
const data = DynamicOpener.initialize()
DynamicOpener.apply()
// subsequent libraries
[...]
```
where `data` is the parsed table of values from **Plot Essentials** *(which is discussed more on [Guide](#guide))*.

Any changes or updates made to `data` **will not** be reflected internally. It is a shallow copy of `state["DynamicOpener"]`.

### Optional implementation
In [`output`](./src/output.js):
```js
[...]
text = DynamicOpener.remakeOpening()
// subsequent libraries
[...]
```
This will redo the opening once on the start of a new adventure. It will **not overwrite** the preexisting one but if the opening has [reference variables](#referring-variables), it will refer to the variable's value. See below.
![Screenshot of a Scenario Opening.](./assets/image.png)
```
# Scenario Creator > Opening
You are ${name} and you live with your roommate, $friendName. $friendPronoun is currently at $friendPronoun2 desk, working on Heart&Roses.

# Adventure
You are Soren and you live with your roommate, $friendName. $friendPronoun is currently at $friendPronoun2 desk, working on Heart&Roses.

============ [remakeOpening() is ran] ============

You are Soren and you live with your roommate, $friendName. $friendPronoun is currently at $friendPronoun2 desk, working on Heart&Roses.

You are Soren and you live with your roommate, Chloe. She is currently at her desk, working on Heart&Roses.
```

# Guide
### Defining a variable:
Variables are defined in **Plot Essentials**. Generally, the format for defining variables is:

    {name}={value}

where `name` is a string of alphanumeric characters `a-zA-Z0-9_` and `value` can be any string of characters.

### Conditional Value Format
If you like to assign a conditional assignment:

    {condition1} {comparison operator} {condition2} ? {trueValue} : {falseValue}

`condition1` is a string of characters, not including `!=<>`

`comparison operator` is one of `!=`, `==`, `<=`, `>=`, `<`, `>`

`condition2` is a string of characters, not including `?`

`trueValue` is any string of characters, not including `:`

`falseValue` is any string of characters

`condition1`, `condition2`, `trueValue`, and `falseValue` can be a [reference variable](#referring-variables) or a user prompt.

### Referring Variables
To use your defined variables, simply prefix a `$` with its name.

    $variableName
Mind that the name must be **alphanumeric** as defined previously in [Defining a variable](#defining-a-variable).

### So all together...
This is what a full assignment looks like:

```
# Inside Plot Essentials
maleString = male
isHeOrShe = ${Are you a male or a female?} == $maleString ? he : she

${name} is a ${Are you a male or a female?} human. $isHeOrShe is known by others to be the life of the party.
```
First, `maleString` is assigned `male`.

Then `isHeOrShe` is evaluated as a conditional value. Meaning...

* `condition1` is `${Are you a male or female}` which assuming the user enters, with <u>exact casing</u>, `condition1` will be `male` or `female`

* `comparsion operator` is `==` which will use Javascript's `===` operator.

* `condition2` is `$maleString` which has the value `male`

And when evaluated, `isHeOrShe` will be `he` or `she`, respectively.

Final results:
```
# Inside Plot Essentials
Soren is a male human. He is known by others to be the life of the party.
```
Notes:

* Capitalization of `He`, *(internally, its `he`)*. DynamicOpener will automatically capitalize letters at the beginning of sentences.
* Variables are gone but not entirely. You can access them via scripting through `state["DynamicOpener"]`