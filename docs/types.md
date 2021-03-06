## Array



Initializes `Array` types

```js
const ProductType = new Schema({
  name: String,
  category: Array
})

const product = await ProductType.parse({
  name: 'Kombucha',
  category: ['Beverages', 'Tea', 'Health']
})

t.true(Array.isArray(product.category))
t.is(product.category.length, 3)
t.is(product.category[1], 'Tea')
```

Given an invalid `Array` it will throw a `ValidationError`

```js
const error = await t.throwsAsync(() => ProductType.parse({
  name: 'Kombucha',
  category: 'none' // < not an array
}))

t.is(error.message, 'Data is not valid')
t.is(error.errors[0].message, 'Invalid array')
t.is(error.errors[0].field.fullPath, 'category')
```

### arraySchema



The Array transformer can initialize the items in the array by passing them through the transformer specified in
the `arraySchema` setting.

```js
const Log = new Schema({
  user: String,
  lastAccess: {
    type: Array,
    arraySchema: {
      type: Date,
      autoCast: true
    }
  }
})

const tinLog = await Log.parse({
  user: 'tin',
  lastAccess: ['6/10/2019', 'Sat Jan 11 2020 17:06:31 GMT-0500 (Eastern Standard Time)']
})

t.true(Array.isArray(tinLog.lastAccess))
t.is(tinLog.lastAccess.length, 2)
t.true(tinLog.lastAccess[0] instanceof Date)
t.true(tinLog.lastAccess[1] instanceof Date)

const error = await t.throwsAsync(() => Log.parse({
  user: 'tin',
  lastAccess: ['11/11/1999', 'What is love?']
}))

t.is(error.message, 'Data is not valid')
t.is(error.errors[0].message, 'Invalid date')
t.is(error.errors[0].field.fullPath, 'lastAccess.1')
```

You can also use custom schemas

```js
const Email = new Schema({
  type: String,
  regex: [/^[a-z0-9._]+@[a-z0-9-.]+\.[a-z]{2,}$/i, 'Invalid e-mail address { value }']
})

const Contact = new Schema({
  name: String,
  emails: {
    type: Array,
    arraySchema: {
      type: Email
    }
  }
})

const error2 = await t.throwsAsync(() => Contact.parse({
  name: 'Martin',
  emails: ['tin@devtin.io', 'gmail.com']
}))

t.is(error2.message, 'Data is not valid')
t.is(error2.errors[0].message, 'Invalid e-mail address gmail.com')
t.is(error2.errors[0].field.fullPath, 'emails.1')

t.notThrows(() => Contact.parse({
  name: 'Martin',
  emails: ['tin@devtin.io', 'martin@gmail.com']
}))
```

## BigInt



Validates `BigInt`s.

```js
const UserSchema = new Schema({
  user: String,
  id: BigInt
})

const error = await t.throwsAsync(() => UserSchema.parse({
  user: 'tin',
  id: 1
}))

t.is(error.message, 'Data is not valid')
t.is(error.errors[0].message, 'Invalid bigint')
t.is(error.errors[0].field.fullPath, 'id')

let contact
await t.notThrowsAsync(async () => {
  contact = await UserSchema.parse({
    user: 'tin',
    id: 1n
  })
})

t.is(contact.user, 'tin')
t.is(contact.id, 1n)
```

### autoCast (default `false`)



[BigInt](/api.md#Transformers.BigInt) transformer has a built-in auto-casting function that would convert any numeric
representation of a `String` or a `Number` into a proper `BigInt`. This feature is disabled by default.

```js
const UserSchema = new Schema({
  user: String,
  id: BigInt
})

await t.throwsAsync(() => UserSchema.parse({
  user: 'tin',
  id: '1'
}))
```

To enable it, just pass the setting `autoCast` equaled to `true`

```js
const UserSchema2 = new Schema({
  user: String,
  id: {
    type: BigInt,
    autoCast: true
  }
})

let contact
await t.notThrowsAsync(async () => {
  contact = await UserSchema2.parse({
    user: 'tin',
    id: '1' // < numeric string
  })
})

t.is(contact.user, 'tin')
t.is(contact.id, 1n)

const error = await t.throwsAsync(() => UserSchema2.parse({
  user: 'tin',
  id: 'some huge integer'
}))

t.is(error.message, 'Data is not valid')
t.is(error.errors[0].message, 'Invalid bigint')
t.is(error.errors[0].field.fullPath, 'id')
```

## Boolean



Validates `Boolean`s.

```js
const ProductSchema = new Schema({
  name: String,
  active: {
    type: Boolean,
    default: false
  }
})

const error = await t.throwsAsync(() => ProductSchema.parse({
  name: 'Kombucha',
  active: 'no'
}))

t.is(error.message, 'Data is not valid')
t.is(error.errors[0].message, 'Invalid boolean')

let product1
await t.notThrowsAsync(async () => {
  product1 = await ProductSchema.parse({
    name: 'Kombucha',
    active: true
  })
})

t.truthy(product1)
t.true(product1.active)

let product2
await t.notThrowsAsync(async () => {
  product2 = await ProductSchema.parse({
    name: 'tin'
  })
})

t.truthy(product2)
t.false(product2.active)
```

### autoCast (default `false`)



`Boolean`'s have a built-in auto-casting function that would transform any truthy value into `true`,
falsy values into `false`, when enabled. This setting is `false` by default.

```js
const ProductType = new Schema({
  name: String,
  active: {
    type: Boolean,
    default: false,
    autoCast: true, // has to be enabled
    cast (v) {
      if (typeof v === 'string' && /no/i.test(v)) {
        return false
      }
      return v
    }
  }
})

let product
await t.notThrowsAsync(async () => {
  product = await ProductType.parse({
    name: 'Kombucha',
    active: 'sure!'
  })
})

t.true(product.active)

t.false((await ProductType.parse({ name: 'kombucha', active: 'no' })).active)
```

## Date



Validates `Date`'s

```js
const dateValidator = new Schema({
  name: String,
  birthday: Date
})

await t.notThrowsAsync(() => dateValidator.parse({
  name: 'Martin',
  birthday: new Date('11/11/1999')
}))

const error = await t.throwsAsync(() => dateValidator.parse({
  name: 'Martin',
  birthday: 'Somewhere in the 80s'
}))

t.is(error.message, 'Data is not valid')
t.is(error.errors[0].message, 'Invalid date')
```

### autoCast (default `true`)



Date transformer has a built-in cast function that transforms proper `String`-dates into `Date`'s.

```js
const dateValidator = new Schema({
  name: String,
  birthday: Date
})

let contact
await t.notThrowsAsync(async () => {
  contact = await dateValidator.parse({
    name: 'Martin',
    birthday: '11/11/1999' // this is a string originally
  })
})

t.true(contact.birthday instanceof Date)
```

`String`'s that can not be guessed as `Date`'s would result in an error.

```js
const error = await t.throwsAsync(() => dateValidator.parse({
  name: 'Martin',
  birthday: 'Somewhere in the 80s'
}))

t.is(error.message, 'Data is not valid')
t.is(error.errors[0].message, 'Invalid date')
t.is(error.errors[0].field.fullPath, 'birthday')
```

**Turning off autoCast**

```js
const dateValidator2 = new Schema({
  name: String,
  birthday: {
    type: Date,
    autoCast: false
  }
})
const error2 = await t.throwsAsync(() => dateValidator2.parse({
  name: 'Martin',
  birthday: '11/11/1999'
}))

t.is(error2.message, 'Data is not valid')
t.is(error2.errors[0].message, 'Invalid date')
t.is(error2.errors[0].field.fullPath, 'birthday')
```

## Function

```js
const ProductType = new Schema({
  user: String,
  save: Function
})

const product = await ProductType.parse({
  user: 'tin',
  save () {
    return 'yeah!'
  }
})

t.true(typeof product.save === 'function')
t.is(product.save(), 'yeah!')

const error = await t.throwsAsync(() => ProductType.parse({
  user: 'tin',
  save: false
}))

t.is(error.message, 'Data is not valid')
t.is(error.errors.length, 1)
t.is(error.errors[0].message, 'Invalid function')
```

## Map



Validates [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) values

```js
const MapSchema = new Schema({
  type: Map,
  autoCast: false
})

const error = await t.throwsAsync(() => MapSchema.parse({ hello: true }))
t.is(error.message, 'Invalid map')
```

### autoCast (default `true`)

```js
const MapSchema = new Schema({
  type: Map
})

const parsed = await MapSchema.parse({ hello: true })
t.true(parsed instanceof Map)
t.true(parsed.get('hello'))
t.false(Object.hasOwnProperty.call(parsed, 'hello'))
```

## Number



Validates `Number`s.

```js
const ProductType = new Schema({
  user: String,
  age: Number
})

const error = await t.throwsAsync(() => ProductType.parse({
  user: 'tin',
  age: '36'
}))

t.is(error.message, 'Data is not valid')
t.is(error.errors[0].message, 'Invalid number')
t.is(error.errors[0].field.fullPath, 'age')

let contact
await t.notThrowsAsync(async () => {
  contact = await ProductType.parse({
    user: 'tin',
    age: 36
  })
})

t.is(contact.user, 'tin')
t.is(contact.age, 36)
```

### min (minimum value)

```js
const NewNumber = new Schema({
  type: Number,
  min: 0
})

const err = await t.throwsAsync(() => NewNumber.parse(-0.1))
t.is(err.message, 'minimum accepted value is 0')

t.is(await NewNumber.parse(0), 0)
```

### max (maximum value)

```js
const NewNumber = new Schema({
  type: Number,
  max: 100
})

const err = await t.throwsAsync(() => NewNumber.parse(100.1))
t.is(err.message, 'maximum accepted value is 100')
t.is(await NewNumber.parse(100), 100)
```

### decimalPlaces (maximum number of decimal places)

```js
const NewNumber = new Schema({
  type: Number,
  decimalPlaces: 2
})

t.is(await NewNumber.parse(11.123), 11.12)
t.is(await NewNumber.parse(12.345), 12.35)
```

### integer (accepts only integers)

```js
const NewNumber = new Schema({
  type: Number,
  integer: true
})

const error = await t.throwsAsync(() => NewNumber.parse(11.123))
t.is(error.message, 'Invalid integer')

t.is(await NewNumber.parse(11), 11)
```

### autoCast (default `false`)



`Number` transformer has a built-in auto-casting function that would convert any numeric representation
`String` into a proper `Number`. This feature is disabled by default.

```js
const UserSchema = new Schema({
  user: String,
  age: Number
})

await t.throwsAsync(() => UserSchema.parse({
  user: 'tin',
  age: '36'
}))
```

To enable it, just pass the setting `autoCast` equaled to `true`

```js
const UserSchema2 = new Schema({
  user: String,
  age: {
    type: Number,
    autoCast: true
  }
})

let contact
await t.notThrowsAsync(async () => {
  contact = await UserSchema2.parse({
    user: 'tin',
    age: '36' // < numeric string
  })
})

t.is(contact.user, 'tin')
t.is(contact.age, 36)

const error = await t.throwsAsync(() => UserSchema2.parse({
  user: 'tin',
  age: 'thirty six'
}))

t.is(error.message, 'Data is not valid')
t.is(error.errors[0].message, 'Invalid number')
t.is(error.errors[0].field.fullPath, 'age')
```

## Object

```js
const Transaction = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  payload: Object // this object could be anything with any props
})

const payload = {
  the: {
    object: {
      can: {
        have: {
          anything: true
        }
      }
    }
  }
}

const product = await Transaction.parse({
  payload
})

t.is(product.payload, payload) // remains untouched

const error = await t.throwsAsync(() => Transaction.parse({
  payload: 'none'
}))

t.is(error.message, 'Data is not valid') // => Data is not valid
t.is(error.errors[0].message, 'Invalid object') // => Invalid date
t.is(error.errors[0].field.fullPath, 'payload')
```

### mapSchema



We can optionally define the schema of the properties of an object.

```js
const ObjectWith = new Schema({
  type: Object,
  mapSchema: Number
})

const error = await t.throwsAsync(() => ObjectWith.parse({
  papo: 123,
  papilla: '123'
}))
t.is(error.message, 'Invalid number')
t.is(error.value, '123')
t.is(error.field.fullPath, 'papilla')
```

You can also use custom schemas

```js
const Email = new Schema({
  type: String,
  regex: [/^[a-z0-9._]+@[a-z0-9-.]+\.[a-z]{2,}$/i, 'Invalid e-mail address']
})

const Contact = new Schema({
  name: String,
  email: {
    type: Object,
    mapSchema: {
      type: Email
    }
  }
})

const error2 = await t.throwsAsync(() => Contact.parse({
  name: 'Martin',
  email: {
    work: 'tin@devtin.io',
    home: '@gmail.com'
  }
}))

t.is(error2.message, 'Data is not valid')
t.is(error2.errors[0].message, 'Invalid e-mail address')
t.is(error2.errors[0].field.fullPath, 'email.home')

await t.notThrowsAsync(() => Contact.parse({
  name: 'Martin',
  email: {
    work: 'tin@devtin.io',
    home: 'martin@gmail.com'
  }
}))
```

## Set

```js
const ProductType = new Schema({
  name: String,
  category: Set
})

const product = await ProductType.parse({
  name: 'Kombucha',
  category: ['Beverages', 'Health', 'Tea', 'Health']
})

t.false(Array.isArray(product.category))
t.is(product.category.size, 3)
t.true(product.category.has('Health'))

const error = await t.throwsAsync(() => ProductType.parse({
  name: 'Kombucha',
  category: 'none'
}))

t.is(error.message, 'Data is not valid')
t.is(error.errors[0].message, 'Invalid set')
t.is(error.errors[0].field.fullPath, 'category')
```

### autoCast (default `true`)

```js
const ProductType = new Schema({
  name: String,
  category: {
    type: Set,
    autoCast: false
  }
})

const product = await ProductType.parse({
  name: 'Kombucha',
  category: new Set(['Beverages', 'Health', 'Tea', 'Health'])
})

t.false(Array.isArray(product.category))
t.is(product.category.size, 3)
t.true(product.category.has('Health'))

const error = await t.throwsAsync(() => ProductType.parse({
  name: 'Kombucha',
  category: ['Beverages', 'Health', 'Tea', 'Health']
}))
t.is(error.message, 'Data is not valid')
t.is(error.errors[0].message, 'Invalid set')
t.is(error.errors[0].field.fullPath, 'category')
```

## String



Validates `String`'s.

```js
const stringSchema = new Schema({
  name: String
})

const error = await t.throwsAsync(() => stringSchema.parse({ name: 123 }))
t.is(error.message, 'Data is not valid')
t.is(error.errors[0].message, 'Invalid string')
t.is(error.errors[0].field.fullPath, 'name')
```

### autoCast (default `false`)



String transformer would call the method `toString` of any given object when `autoCast` equals `true` and would assign
returned value as long as it is different than `[object Object]`

```js
const nameSchema = new Schema({
  name: {
    type: String,
    autoCast: true
  }
})

const user = await nameSchema.parse({
  name: {
    toString () {
      return `Some name`
    }
  }
})
t.is(user.name, 'Some name')
```

### minlength



Setting `minlength` validates given `String` has a minimum length.

```js
const nameSchema = new Schema({
  name: {
    type: String,
    minlength: 6
    // minlength: [6, 'Looking for a custom error message?']
  }
})

const error = await t.throwsAsync(() => nameSchema.parse({ name: 'Tin' }))
t.is(error.message, 'Data is not valid')
t.is(error.errors[0].message, 'Invalid minlength')
// t.is(error.errors[0].message, `Looking for a custom error message?`)
t.is(error.errors[0].field.fullPath, 'name')

t.notThrows(() => nameSchema.parse({ name: 'Martin' }), 'Martin')
```

### maxlength



Setting `maxlength` validates given `String` has a maximum length of...

```js
const lastNameSchema = new Schema({
  lastName: {
    type: String,
    maxlength: 13
    // maxlength: [13, 'Looking for a custom error message?']
  }
})

const error = await t.throwsAsync(() => lastNameSchema.parse({ lastName: 'Schwarzenegger' }))
t.is(error.message, 'Data is not valid')
t.is(error.errors[0].message, 'Invalid maxlength')
// t.is(error.errors[0].message, `Looking for a custom error message?`)

await t.notThrowsAsync(() => lastNameSchema.parse({ lastName: 'Rafael' }))
```

### regex



Setting `regex` provides a validation via regular expression against given values.

```js
const nameSchema = new Schema({
  name: {
    type: String,
    regex: /^[a-z]+$/i
  }
})

const error = await t.throwsAsync(() => nameSchema.parse({ name: 'Tin Rafael' }))
t.is(error.message, 'Data is not valid')
t.is(error.errors[0].message, 'Invalid regex')

await t.notThrowsAsync(() => nameSchema.parse({ name: 'Martin' }))
```

Custom error

```js
const nameSchema2 = new Schema({
  name: {
    type: String,
    regex: [/^[a-z]+$/i, 'lowercase only']
  }
})

const error2 = await t.throwsAsync(() => nameSchema2.parse({ name: 'Tin Rafael' }))
t.is(error2.message, 'Data is not valid')
t.is(error2.errors[0].message, 'lowercase only')
```

### enum

```js
const mySchema = new Schema({
  topping: {
    type: String,
    enum: ['cheese', 'ham', 'tomatoes']
  }
})
const error = await t.throwsAsync(() => mySchema.parse({ topping: 'potatoes' }))
t.is(error.errors[0].message, 'Unknown enum option potatoes')
await t.notThrowsAsync(() => mySchema.parse({ topping: 'ham' }))
```

### lowercase



Optionally transforms input string into lowercase

```js
const mySchema = new Schema({
  type: String,
  lowercase: true
})
t.is(await mySchema.parse('ADMIN'), 'admin')
```

### uppercase



Optionally transforms input string into uppercase

```js
const mySchema = new Schema({
  type: String,
  uppercase: true
})
t.is(await mySchema.parse('en'), 'EN')
```

### allowEmpty (default `true`)



Optionally allow empty values

```js
const emptyString = new Schema({
  type: String
})
t.is(await emptyString.parse(''), '')

const nonEmptyString = new Schema({
  type: String,
  allowEmpty: false
})
const error = await t.throwsAsync(nonEmptyString.parse(''))

t.is(error.message, 'Value can not be empty')
```

## Custom



Custom transformers are great to implement custom logic that may be required by multiple entities of the ecosystem.

```js
const customTransformer = new Schema({
  name: {
    type: String,
    required: false
  },
  email: {
    type: 'Email',
    onlyGmail: true
  }
})

let error = await t.throwsAsync(() => customTransformer.parse({
  name: 'Martin',
  email: 'tin@devtin.io'
}))

t.is(error.message, 'Data is not valid')
t.is(error.errors[0].message, 'Don\'t know how to resolve Email in property email')
```

Creating a custom transformer is as simple as appending the logic into the Transformers object
found in `const { Transformers } = require('duckfficer')`.

Have a look at the [Transformer](/api.md#Transformer) object in the docs.

```js
Transformers.Email = {
  loaders: [
    {
      type: String,
      regex: [/^[a-z0-9._]+@[a-z0-9-]+\.[a-z]{2,}$/, 'Invalid e-mail address { value } for field { field.name }']
    }
  ], // pre-processes the value using this known-registered types
  validate (v) {
    t.true(this instanceof Schema)
    if (this.settings.onlyGmail && !/@gmail\.com$/.test(v)) {
      return this.throwError('Only gmail accounts')
    }
  }
}

error = await t.throwsAsync(() => customTransformer.parse({
  name: 'Martin',
  email: 123
}))

t.is(error.message, 'Data is not valid')
t.is(error.errors[0].message, 'Invalid string') // From the String transformer

error = await t.throwsAsync(() => customTransformer.parse({
  name: 'Martin',
  email: 'martin'
}))

t.is(error.message, 'Data is not valid')
t.is(error.errors[0].message, 'Invalid e-mail address martin for field email')

error = await t.throwsAsync(() => customTransformer.parse({
  name: 'Martin',
  email: 'tin@devtin.io'
}))

t.is(error.message, 'Data is not valid')
t.is(error.errors[0].message, 'Only gmail accounts')

await t.notThrowsAsync(() => customTransformer.parse({
  name: 'Martin',
  email: 'marting.dc@gmail.com'
}))
```