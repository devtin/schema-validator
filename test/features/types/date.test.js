import test from 'ava'
import { Schema } from '../../../.'

test('Date', async t => {
  /**
   * Validates `Date`'s
   */
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
})

test('autoCast (default `true`)', async t => {
  /**
   * Date transformer has a built-in cast function that transforms proper `String`-dates into `Date`'s.
   */
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

  /**
   * `String`'s that can not be guessed as `Date`'s would result in an error.
   */
  const error = await t.throwsAsync(() => dateValidator.parse({
    name: 'Martin',
    birthday: 'Somewhere in the 80s'
  }))

  t.is(error.message, 'Data is not valid')
  t.is(error.errors[0].message, 'Invalid date')
  t.is(error.errors[0].field.fullPath, 'birthday')

  /**
   * **Turning off autoCast**
   */
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
})
