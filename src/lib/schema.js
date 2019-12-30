import { propertiesRestricted } from 'utils/properties-restricted'
import { castArray } from 'utils/cast-array'
import { obj2dot } from 'utils/obj-2-dot'
import { ValidationError } from './validation-error.js'
import { forEach } from 'utils/for-each.js'

export const Transformers = {
  /**
   * @return {String}
   */
  String: {
    /**
     * Maybe cast value could be async and there is where the beauty comes!
     * @return {String}
     * @throws {Error} when given value can not be casted
     */
    parse (v) {
      if (typeof v !== 'string') {
        if (!(typeof v === 'object' && v.hasOwnProperty('toString'))) {
          this.throwError(`Invalid string`, { value: v })
        }

        v = v.toString()
      }

      if (this.settings.minlength) {
        const [minlength, error] = Schema.castThrowable(this.settings.minlength, `Invalid minlength`)
        if (v.length < minlength) {
          this.throwError(error, { value: v })
        }
      }

      if (this.settings.maxlength) {
        const [maxlength, error] = Schema.castThrowable(this.settings.maxlength, `Invalid maxlength`)
        if (v.length > maxlength) {
          this.throwError(error, { value: v })
        }
      }

      if (this.settings.regex) {
        const [regex, error] = Schema.castThrowable(this.settings.regex, `Invalid regex`)

        if (!regex.test(v)) {
          this.throwError(error, { value: v })
        }
      }

      return v
    }
  },
  Number: {
    parse (v) {
      v = Number(v)
      if (isNaN(v)) {
        throw new Error(`Invalid number`)
      }
      return v
    }
  },
  Date: {
    parse (v) {
      v = new Date(Number.isInteger(v) ? v : Date.parse(v))
      if (!(v instanceof Date)) {
        throw new Error(`Invalid date`)
      }
      return v
    }
  },
  Function: {
    parse (v) {
      if (typeof v !== 'function') {
        throw new Error(`Invalid function`)
      }
      return v
    }
  }
}

/**
 * @typedef {Object} Schema~SchemaModel
 * @desc This object defines the desired structure of our schema. It must contain as many properties
 * as fields we want to validate. Each property must be either a {@link Field} or a {@link Schema} for
 * nested objects.
 * @property {SchemaModel} theFieldName - Add as many property schemas as you need in order to build your validation model
 */

/**
 * @classdesc Orchestrates the validation of a data schema
 */
export class Schema {
  /**
   * @constructor
   * @param {SchemaModel} schema
   * @param {Object} [options]
   * @param {String} [options.name] - Alternative name of the object
   * @param {Schema} [options.parent]
   */
  constructor (schema, { name, parent } = {}) {
    /**
     * @property {Object} settings - Additional settings for schema
     */
    this.settings = {}

    this.schema = schema

    /**
     * @property {Schema} [parent] - Nested objects will have a {@link Schema} in this property
     */
    this.parent = parent

    /**
     * @property {String} name - Nested objects will have the name of it's containing property
     */
    this.name = name || ''

    /**
     * @property {String} type - The schema type. Options vary according to available Transformers. Could be 'Schema'
     * for nested objects.
     * @property {Schema[]} [children] - For nested objects
     */

    if (Schema.isNested(schema)) {
      this.type = this.constructor.name
      this.children = this._parseSchema(schema)
    } else {
      // primitive
      this.type = Schema.guessType(schema)
      this.settings = typeof schema === 'object' ? Object.assign({}, schema) : {}
      delete this.settings.type
    }
  }

  static castThrowable (value, error) {
    if (Array.isArray(value) && value.length === 2) {
      return value
    }

    return [value, error]
  }

  _parseSchema (obj) {
    if (!Schema.isNested(obj)) {
      return []
    }
    return Object.keys(obj).map((prop) => {
      if (obj[prop] instanceof Schema) {
        const schemaClone = Object.assign(Object.create(Object.getPrototypeOf(obj[prop])), obj[prop], {
          name: prop,
          parent: this,
          settings: this.settings
        })
        schemaClone.name = prop
        schemaClone.parent = this
        // schemaClone.settings = this.settings
        return schemaClone
      }
      return new Schema(obj[prop], { name: prop, parent: this })
    })
  }

  /**
   * Checks whether a given object is a nested object
   *
   * @param {Object} obj
   * @return {boolean}
   */
  static isNested (obj) {
    return typeof obj === 'object' && !obj.type
  }

  static guessType (value) {
    if (typeof value === 'function') {
      return value.name
    }

    if (typeof value === 'object' && value.type) {
      return Schema.guessType(value.type)
    }

    // serialized
    if (typeof value === 'string') {
      return value
    }

    // nested schema
    return 'Schema'
  }

  get fullPath () {
    return (this.parent && this.parent.fullPath ? `${ this.parent.fullPath }.` : '') + this.name
  }

  /**
   * @property {String[]} paths - Contains paths
   */
  get ownPaths () {
    return this.children.map(({ name }) => name)
  }

  /**
   * @property {String[]} paths - Contains paths
   */
  get paths () {
    const foundPaths = []

    if (this.children) {
      this.children.forEach(({ paths }) => {
        paths.forEach(path => {
          foundPaths.push((this.name ? `${ this.name }.` : '') + path)
        })
      })
    } else {
      foundPaths.push(this.name)
    }

    return foundPaths
  }

  schemaAtPath (pathName) {
    const [path] = pathName.split(/\./)
    let schema
    forEach(this.children, possibleSchema => {
      if (possibleSchema.name === path) {
        schema = possibleSchema
        return false
      }
    })

    return schema
  }

  /**
   * Checks whether the schema contains given fieldName
   * @param fieldName
   * @return {Boolean}
   */
  hasField (fieldName) {
    return this.paths.indexOf(fieldName) >= 0
  }

  /**
   * Validates if the given object have a structure valid for the schema in subject
   * @param {Object} obj - The object to evaluate
   * @throws {ValidationError}
   */
  structureValidation (obj) {
    if (!obj) {
      return true
    }
    if (!propertiesRestricted(obj, this.ownPaths)) {
      const unknownFields = []
      if (obj) {
        obj2dot(obj).forEach(field => {
          if (!this.hasField(field)) {
            unknownFields.push(new Error(`Unknown property ${ field }`))
          }
        })
      }
      throw new ValidationError(`Invalid object schema`, { errors: unknownFields, value: obj })
    }
  }

  /**
   * Validates schema structure and synchronous hooks of every field in the schema
   * @param {Object} v - The object to evaluate
   * @return {Object} The sanitized object
   * @throws {ValidationError}
   */
  parse (v) {
    if (this.children) {
      let res
      try {
        res = this._parseNested(v)
      } catch (err) {
        throw err
      }
      return res
    }

    // custom manipulators
    if (this.settings.default && !v) {
      v = typeof this.settings.default === 'function' ? this.settings.default(v) : this.settings.default
    }

    return this._run(this.type, v)
  }

  _run (type, v) {
    const transformer = Transformers[type]

    if (!transformer) {
      throw new Error(`Don't know how to resolve ${ type }`)
    }

    if (v === undefined && !this.settings.required) {
      return
    }

    if (!v && this.settings.required) {
      const [required, error] = Schema.castThrowable(this.settings.required, `Field ${ this.fullPath } is required`)
      required && this.throwError(error, { value: v })
    }

    // console.log({ transformer })

    if (transformer.loaders) {
      forEach(castArray(transformer.loaders), loader => {
        const type = Schema.guessType(loader)
        v = this._run(type, v)
      })
    }

    return transformer.parse.call(this, v)
  }

  _parseNested (obj) {
    this.structureValidation(obj)
    const resultingObject = {}
    const errors = []

    this.ownPaths.forEach(pathName => {
      const schema = this.schemaAtPath(pathName)

      try {
        const val = schema.parse(typeof obj === 'object' ? obj[schema.name] : undefined)
        if (val !== undefined) {
          Object.assign(resultingObject, { [schema.name]: val })
        }
      } catch (err) {
        if (err instanceof ValidationError && err.errors.length > 0) {
          errors.push(...err.errors)
        } else {
          errors.push(err)
        }
      }
    })

    if (errors.length > 0) {
      throw new ValidationError(`Data is not valid`, { errors })
    }

    return Object.keys(resultingObject).length > 0 ? resultingObject : undefined
  }

  throwError (message, { errors, value } = {}) {
    throw new ValidationError(message, { errors, value, field: this })
  }
}
