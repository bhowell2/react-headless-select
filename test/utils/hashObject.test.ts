import { hashObject } from '../../src/ts/utils/hashObject'

test('object hashes the same way with different key ordering', () => {
  /* eslint-disable */
  const a: any = {
    one: 1,
    two: 'two',
    three: 3333,
    four: [1, 2, 3]
  }
  /* eslint-enable */
  const b = { ...a }
  delete b.four
  delete b.one
  b.four = [1, 2, 3]
  b.one = 1
  expect(hashObject(a)).toEqual(hashObject(b))

  // not same order. shouldn't be equal
  delete b.four
  delete b.one
  b.four = [3, 2, 1]
  b.one = 1
  expect(hashObject(a)).not.toEqual(hashObject(b))
})

test("ensure circular hash doesn't infinitely render", () => {
  const a: any = { one: 1, two: 'two' }
  a.a = a
  const b = a
  expect(hashObject(a)).toEqual(hashObject(b))
})
