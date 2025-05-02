import { describe, it } from "node:test";

describe('outer', () => {
  describe('middle', function () {
    describe('inner', () => {
      it('should do a thing', (t) => {
        t.assert.equal('hello', 'hello');
      });
      it("this has a '", (t) => {
        t.assert.equal('hello', 'hello');
      });
    });
  })
});
