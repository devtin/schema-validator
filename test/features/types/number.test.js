import test from 'ava'
import { Schema, ValidationError } from '../../../.'

test('Number', async t => {
  /**
   * Validates `Number`s.
   */
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
})

test('min (minimum value)', async t => {
  const NewNumber = new Schema({
    type: Number,
    min: 0
  })

  const err = await t.throwsAsync(() => NewNumber.parse(-0.1))
  t.is(err.message, 'minimum accepted value is 0')

  t.is(await NewNumber.parse(0), 0)
})

test('max (maximum value)', async t => {
  const NewNumber = new Schema({
    type: Number,
    max: 100
  })

  const err = await t.throwsAsync(() => NewNumber.parse(100.1))
  t.is(err.message, 'maximum accepted value is 100')
  t.is(await NewNumber.parse(100), 100)
})

test('decimalPlaces (maximum number of decimal places)', async t => {
  const NewNumber = new Schema({
    type: Number,
    decimalPlaces: 2
  })

  t.is(await NewNumber.parse(11.123), 11.12)
  t.is(await NewNumber.parse(12.345), 12.35)
})

test('integer (accepts only integers)', async t => {
  const NewNumber = new Schema({
    type: Number,
    integer: true
  })

  const error = await t.throwsAsync(() => NewNumber.parse(11.123))
  t.is(error.message, 'Invalid integer')

  t.is(await NewNumber.parse(11), 11)
})

test('autoCast (default `false`)', async t => {
  /**
   * `Number` transformer has a built-in auto-casting function that would convert any numeric representation
   * `String` into a proper `Number`. This feature is disabled by default.
   */
  const UserSchema = new Schema({
    user: String,
    age: Number
  })

  await t.throwsAsync(() => UserSchema.parse({
    user: 'tin',
    age: '36'
  }))

  /**
   * To enable it, just pass the setting `autoCast` equaled to `true`
   */

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
})
