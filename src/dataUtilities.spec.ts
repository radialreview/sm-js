import { transformData } from './dataUtilities'

describe('smData.dataUtilities.transformData', () => {
  it('should extend the object if property value is nullish and defined in extensions', () => {
    const obj = {
      foo: null,
    }

    transformData({
      object: obj,
      extensions: {
        foo: 'default value',
      },
      overwrites: {},
    })

    expect(obj.foo).toBe('default value')
  })

  it('should not extend the object if property value is not nullish', () => {
    const obj = {
      foo: 'default value',
    }

    transformData({
      object: obj,
      extensions: {
        foo: 'new value',
      },
      overwrites: {},
    })

    expect(obj.foo).toBe('default value')
  })

  it('should overwrite the object if property value is defined in overwrites', () => {
    const obj = {
      foo: 'default value',
    }

    transformData({
      object: obj,
      extensions: {},
      overwrites: {
        foo: 'overwritten value',
      },
    })

    expect(obj.foo).toBe('overwritten value')
  })

  it('does not store direct references to extensions or overwrites to prevent mutating default data when an update is received', () => {
    const obj: Record<string, any> = { extension: null, overwrite: null }
    const defaultExtensions = { extension: { foo: 'bar' } }
    const defaultOverwrites = { overwrite: { foo: 'baz' } }

    transformData({
      object: obj,
      extensions: defaultExtensions,
      overwrites: defaultOverwrites,
    })

    expect(obj.extension.foo).toBe('bar')
    expect(obj.overwrite.foo).toBe('baz')

    obj.extension.foo = 'new value'
    expect(defaultExtensions.extension.foo).toBe('bar')

    obj.overwrite.foo = 'new value'
    expect(defaultOverwrites.overwrite.foo).toBe('baz')
  })

  it('should not extend nor overwrite the object if discardValuesNotInObject is true', () => {
    const obj = {
      foo: 'default value',
    }

    transformData({
      object: obj,
      extensions: {
        foo2: 'new value',
      },
      overwrites: {
        foo3: 'new value',
      },
      discardValuesNotInObject: true,
    })

    expect((obj as any).foo2).toBe(undefined)
    expect((obj as any).foo3).toBe(undefined)
  })
})
