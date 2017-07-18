(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const Oligophony = require('../src/Oligophony'),
      Viewer     = require('../src/viewer/Viewer'),
      Player     = require('../src/Player');

var o_options = {
    'transpose': 3 // the original chords are in A-, transpose up to C-.
  };
window.oligophony = new Oligophony(o_options);

var viewer_options = {
    'width': 950,
    'topMargin': 60,
    'rowHeight': 60,
    'rowYMargin': 10,
    'fontSize': 50
  };
// a Viewer displays an Oligophony as an SVG.
window.viewer = new Viewer(oligophony, viewer_options);
// add the SVG to the document.
viewer.appendTo(document.querySelector('#oligophonyContainer'));

var player_options = {
  'tempo': 120
};
// a Player plays an Oligophony as audio.
window.player = new Player(oligophony, player_options);
// setup play and stop buttons
oligophony.onEvent('Player.ready', () => {
  document.querySelector('#play').addEventListener('click', player.play);
  document.querySelector('#stop').addEventListener('click', player.stop);
});

flyMeToTheMoon = {
  'title': 'Fly Me To The Moon',
  'composer': 'Bart Howard',
  'timeSignature': [4,4],
  'chords': [
    // Each array is a measure, and each item in an array is a beat.
    // null inside a measure means there's no chord set for that beat.
    ['A-7', null, 'A7', null], ['D-7', null, null, null], ['G7', null, null, null], ['CM9', null, 'C7', null],
    null, // newline.
    ['FM7', null, null, null], ['Bdim7', null, null, null], ['E7b9', null, null, null], ['A-7', null, 'A7', null],
    null,
    ['D-7', null, null, null], ['G7', null, null, null], ['CM7', null, 'F7', null], ['Ey', null, 'A7', null],
    null,
    ['D-7', null, null, null], ['G7', null, null, null], ['CM7', null, null, null], ['Bdim7', null, 'E7b9', null]
  ]
};
oligophony.import(flyMeToTheMoon)

},{"../src/Oligophony":45,"../src/Player":46,"../src/viewer/Viewer":49}],2:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return (b64.length * 3 / 4) - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr((len * 3 / 4) - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0; i < l; i += 4) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],3:[function(require,module,exports){

},{}],4:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('Invalid typed array length')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (value instanceof ArrayBuffer) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return fromObject(value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj) {
    if (isArrayBufferView(obj) || 'length' in obj) {
      if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
        return createBuffer(0)
      }
      return fromArrayLike(obj)
    }

    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return fromArrayLike(obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (isArrayBufferView(string) || string instanceof ArrayBuffer) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : new Buffer(val, encoding)
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// Node 0.10 supports `ArrayBuffer` but lacks `ArrayBuffer.isView`
function isArrayBufferView (obj) {
  return (typeof ArrayBuffer.isView === 'function') && ArrayBuffer.isView(obj)
}

function numberIsNaN (obj) {
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":2,"ieee754":19}],5:[function(require,module,exports){
'use strict';

module.exports = {
  Add9: ["add9", "2"],
  Add11: ["add11", "4"],
  Major6: ["6","maj6","major6", "M6"],
  SixNine: ["6/9"],
  PowerChord: ["5"] // duh duh DUH, duh duh DUH-duh, duh duh DUH, duh duh ((c) Deep Purple)
};
},{}],6:[function(require,module,exports){
'use strict';

module.exports = {
  // sevenths
  Major7: ['Major', ["maj7", "Maj7", "M7", "+7"]],
  Minor7: ['Minor', ["m7", "Min7", "min7", "minor7"]],
  Dominant7: ['Major', ["7", "dom7", "dominant7"]],
  Diminished7: ['Diminished', ["dim7", "diminished7"]],

  // true extended
  Major9: ['Major', ["maj9", "M9", "9"]],
  Major11: ['Major', ["maj11", "M11", "11"]],
  Major13: ['Major', ["maj13", "M13", "13"]],

  // weird ones
  AugmentedDominant7: ['Major', ["7#5", "7(#5]"]],
  AugmentedMajor7: ['Major', ["maj7#5", "maj7(#5]"]],

  // TODO: I don't know what this one is - can't find it on wikipedia
  Minor9: ['Minor', ["min9", "m9", "minor9"]]
  
};
},{}],7:[function(require,module,exports){
'use strict';

module.exports = {
  Major:  ["", "major", "maj", "M"],
  Minor:  ["m", "minor", "min"],
  Augmented: ["aug", "augmented", "+"],
  Diminished: ["dim", "diminished"]
};
},{}],8:[function(require,module,exports){
'use strict';

var noteNamings = require('./note-namings');
var chordAddeds = require('./chord-addeds');
var chordSuspendeds = require('./chord-suspendeds');
var chordQualities = require('./chord-qualities');
var chordExtendeds = require('./chord-extendeds');

var chordRegexes = initializeChordRegexes();

module.exports = chordRegexes;

function initializeChordRegexes() {
  var map = {};

  Object.keys(noteNamings).forEach(function (noteNaming) {
    map[noteNaming] = initializeChordRegex(noteNamings[noteNaming]);
  });
  return map;
}

function initializeChordRegex(noteNaming) {
  var chordRegex = {};

  var regexString = createRegexString(noteNaming);
  var regexStringWithParens = createRegexStringWithParens(regexStringWithParens);

  chordRegex.regexString = regexString;
  chordRegex.regexStringWithParens = regexStringWithParens;
  chordRegex.pattern = new RegExp(regexString);
  chordRegex.patternWithParens = new RegExp(regexStringWithParens);

  return chordRegex;
}

function optional(pattern) {
  return "(" + pattern + "?)";
}

function concatenateAllValues(map) {
  var res = [];
  Object.keys(map).forEach(function (key) {
    res = res.concat(map[key]);
  });
  return res;
}

// extendeds are different; their values are an array of
// [type, names]
function concatenateAllValuesForExtendeds(map) {
  var res = [];
  Object.keys(map).forEach(function (key) {
    res = res.concat(map[key][1]);
  });
  return res;
}

function createRegexString(noteNaming) {
  return greedyDisjunction(concatenateAllValues(noteNaming), true) + // root note
    optional(greedyDisjunction(
      concatenateAllValues(chordQualities).concat(
        concatenateAllValuesForExtendeds(chordExtendeds)))) + // quality OR seventh
    optional(greedyDisjunction(concatenateAllValues(chordAddeds))) + // add
    optional(greedyDisjunction(concatenateAllValues(chordSuspendeds))) + // sus

    // overridden root note ("over")
    optional("(?:/" + greedyDisjunction(concatenateAllValues(noteNaming)) +
      ")");
}

function createRegexStringWithParens(regexString) {
  return "[\\(\\[]" + regexString + "[\\)\\]]";
}

function quote(str) {
  // stolen from http://stackoverflow.com/a/3614500/680742
  var regexpSpecialChars = /([\[\]\^\$\|\(\)\\\+\*\?\{\}\=\!])/gi;

  return str.replace(regexpSpecialChars, '\\$1');
}

/**
 * Take an array of strings and make a greedy disjunction regex pattern out of it,
 * with the longest strings first, e.g. ["sus4","sus","sus2"] -->
 *
 * (sus4|sus2|sus)
 * @param allAliases
 * @return
 */
function greedyDisjunction(aliases, matchingGroup) {

  aliases = aliases.slice(); // copy

  // sort by longest string first
  aliases.sort(function (a, b) {
    var lenCompare = b.length - a.length;
    if (lenCompare !== 0) {
      return lenCompare < 0 ? -1 : 1;
    }
    // else sort by normal string comparison
    return a < b ? -1 : 1;
  });

  var res = '(';

  if (!matchingGroup) {
    res +=  '?:'; //  non-matching group
  }

  aliases.forEach(function (alias, i) {
    if (!alias) {
      return; // e.g. the "major" quality can be expressed as an empty string, so skip in the regex
    }
    if (i > 0) {
      res += '|';
    }
    res += quote(alias);
  });

  return res + ')';
}

initializeChordRegexes();
},{"./chord-addeds":5,"./chord-extendeds":6,"./chord-qualities":7,"./chord-suspendeds":10,"./note-namings":12}],9:[function(require,module,exports){
'use strict';

module.exports = [
  'A',
  'Bb',
  'B',
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab'
];
},{}],10:[function(require,module,exports){
'use strict';

module.exports = {
  Sus4: ["sus4", "suspended", "sus"],
  Sus2: ["sus2", "suspended2"]
};
},{}],11:[function(require,module,exports){
'use strict';

exports.parse = require('./parse');
exports.prettyPrint = require('./pretty-print');
exports.transpose = require('./transpose');
},{"./parse":13,"./pretty-print":14,"./transpose":16}],12:[function(require,module,exports){
'use strict';

var English = {};
English['A'] = ['A'];
English['Bb'] = ['Bb', 'A#', 'Asharp', 'Bflat'];
English['B'] = ['B'];
English['C'] = ['C'];
English['Db'] = ['Db', 'C#', 'Dflat', 'Csharp'];
English['D'] = ['D'];
English['Eb'] = ['Eb', 'D#', 'Eflat', 'Dsharp'];
English['E'] = ['E'];
English['F'] = ['F'];
English['Gb'] = ['Gb', 'F#', 'Gflat', 'Gsharp'];
English['G'] = ['G'];
English['Ab'] = ['Ab', 'G#', 'Aflat', 'Gsharp'];

var NorthernEuropean = {};
NorthernEuropean['A'] = ['A'];
NorthernEuropean['Bb'] = ['B', 'A#', 'Asharp'];
NorthernEuropean['B'] = ['H'];
NorthernEuropean['C'] = ['C'];
NorthernEuropean['Db'] = ['Db', 'C#', 'Dflat', 'Csharp'];
NorthernEuropean['D'] = ['D'];
NorthernEuropean['Eb'] = ['Eb', 'D#', 'Eflat', 'Dsharp'];
NorthernEuropean['E'] = ['E'];
NorthernEuropean['F'] = ['F'];
NorthernEuropean['Gb'] = ['Gb', 'F#', 'Gflat', 'Gsharp'];
NorthernEuropean['G'] = ['G'];
NorthernEuropean['Ab'] = ['Ab', 'G#', 'Aflat', 'Gsharp'];

var SouthernEuropean = {};
SouthernEuropean['A'] = ['La'];
SouthernEuropean['Bb'] = ['Tib', 'La#'];
SouthernEuropean['B'] = ['Ti'];
SouthernEuropean['C'] = ['Do'];
SouthernEuropean['Db'] = ['Reb', 'Réb', 'Do#'];
SouthernEuropean['D'] = ['Re', 'Ré'];
SouthernEuropean['Eb'] = ['Mib', 'Re#'];
SouthernEuropean['E'] = ['Mi'];
SouthernEuropean['F'] = ['Fa'];
SouthernEuropean['Gb'] = ['Solb', 'Sob', 'Fa#'];
SouthernEuropean['G'] = ['Sol', 'So'];
SouthernEuropean['Ab'] = ['Lab', 'So#', 'Sol#'];

module.exports = {
  English: English,
  NorthernEuropean: NorthernEuropean,
  SouthernEuropean: SouthernEuropean
};
},{}],13:[function(require,module,exports){
'use strict';

var chordRegexes = require('./chord-regexes');
var reverseLookups = require('./reverse-lookups');

module.exports = function parse(str, opts) {
  opts = opts || {};
  var noteNaming = opts.naming || 'English';

  var match = str.match(chordRegexes[noteNaming].pattern);

  return match && parseObject(match, noteNaming);
};

function parseObject(match, noteNaming) {

  // match objects is 6 elements:
  // full string, root, quality or extended, added, suspended, overriding root
  // e.g. ["Cmaj7", "C", "maj7", "", "", ""]

  var res = {};

  res.root = reverseLookups.roots[noteNaming][match[1]];

  var foundExtended = reverseLookups.extendeds[match[2]];
  if (foundExtended) {
    res.quality = foundExtended.quality;
    res.extended = foundExtended.extended;
  } else { // normal quality without extended
    res.quality = reverseLookups.qualities[match[2]];
  }

  if (match[3]) {
    res.added = reverseLookups.addeds[match[3]];
  }

  if (match[4]) {
    res.suspended = reverseLookups.suspendeds[match[4]];
  }

  if (match[5]) {
    // substring(1) to cut off the slash, because it's e.g. "/F"
    res.overridingRoot = reverseLookups.roots[noteNaming][match[5].substring(1)];
  }

  return res;
}
},{"./chord-regexes":8,"./reverse-lookups":15}],14:[function(require,module,exports){
'use strict';

var noteNamings = require('./note-namings');
var chordQualities = require('./chord-qualities');
var chordExtendeds = require('./chord-extendeds');
var chordAddeds = require('./chord-addeds');
var chordSuspendeds = require('./chord-suspendeds');

module.exports = function prettyPrint(chord, opts) {
  opts = opts || {};
  var naming = opts.naming || 'English';
  // just use the first name for now, but later we may want to add options
  // to allow people to choose how to express chord. e.g. to prefer flats
  // instead of sharps, or prefer certain flats to certain sharps, etc.
  // (e.g. 'Bb' seems to be more common than 'A#', but 'F#' is more common than 'Ab')

  var str = noteNamings[naming][chord.root][0];
  if (chord.extended) {
    str += chordExtendeds[chord.extended][1][0];
  } else {
    str += chordQualities[chord.quality][0];
  }

  if (chord.added) {
    str += chordAddeds[chord.added][0];
  }

  if (chord.suspended) {
    str += chordSuspendeds[chord.suspended][0];
  }

  if (chord.overridingRoot) {
    str += '/' + noteNamings[naming][chord.overridingRoot][0];
  }
  return str;
};
},{"./chord-addeds":5,"./chord-extendeds":6,"./chord-qualities":7,"./chord-suspendeds":10,"./note-namings":12}],15:[function(require,module,exports){
'use strict';

// given a string and a note naming, return the structured version of it.

var rootLookups = {};

var noteNamings = require('./note-namings');
var chordQualities = require('./chord-qualities');
var chordExtendeds = require('./chord-extendeds');
var chordAddeds = require('./chord-addeds');
var chordSuspendeds = require('./chord-suspendeds');

Object.keys(noteNamings).forEach(function (noteNaming) {
  rootLookups[noteNaming] = {};
  addReverseLookups(rootLookups[noteNaming], noteNamings[noteNaming]);
});

var chordQualitiesLookups = {};

addReverseLookups(chordQualitiesLookups, chordQualities);

var chordExtendedsLookups = {};

addReverseLookupsForExtendeds(chordExtendedsLookups, chordExtendeds);

var chordSuspendedsLookups = {};

addReverseLookups(chordSuspendedsLookups, chordSuspendeds);

var chordAddedsLookups = {};

addReverseLookups(chordAddedsLookups, chordAddeds);

function addReverseLookups(reverseDict, dict) {
  Object.keys(dict).forEach(function (key) {
    var arr = dict[key];
    arr.forEach(function (element) {
      reverseDict[element] = key;
    });
  });
}

// extendeds are a little different, because they contain both the quality
// and the extendeds
function addReverseLookupsForExtendeds(reverseDict, dict) {
  Object.keys(dict).forEach(function (key) {
    var pair = dict[key];
    var quality = pair[0];
    var extendedsArr = pair[1];
    extendedsArr.forEach(function (element) {
      reverseDict[element] = {
        quality: quality,
        extended: key
      };
    });
  });
}

module.exports = {
  roots: rootLookups,
  qualities: chordQualitiesLookups,
  extendeds: chordExtendedsLookups,
  addeds: chordAddedsLookups,
  suspendeds: chordSuspendedsLookups
};
},{"./chord-addeds":5,"./chord-extendeds":6,"./chord-qualities":7,"./chord-suspendeds":10,"./note-namings":12}],16:[function(require,module,exports){
'use strict';

var chordRoots = require('./chord-roots');
var clone = require('./utils').clone;

function transposeNote(note, num) {

  var idx = chordRoots.indexOf(note);

  if (idx === -1) {
    throw new Error('unknown note: ' + note);
  }

  idx += num;

  if (idx > 0) {
    idx = idx % chordRoots.length;
  } else {
    idx = (chordRoots.length + idx) % chordRoots.length;
  }

  return chordRoots[idx];
}

module.exports = function transpose(chord, num) {
  if (typeof num !== 'number') {
    throw new Error('you need to provide a number');
  }

  var transposedChord = clone(chord);

  transposedChord.root = transposeNote(chord.root, num);

  if (chord.overridingRoot) {
    transposedChord.overridingRoot = transposeNote(chord.overridingRoot, num);
  }

  return transposedChord;
};
},{"./chord-roots":9,"./utils":17}],17:[function(require,module,exports){
'use strict';

var extend = require('extend');

exports.extend = extend;

exports.clone = function (obj) {
  return extend(true, {}, obj);
};
},{"extend":18}],18:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;
var undefined;

var isPlainObject = function isPlainObject(obj) {
	"use strict";
	if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval) {
		return false;
	}

	var has_own_constructor = hasOwn.call(obj, 'constructor');
	var has_is_property_of_method = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !has_own_constructor && !has_is_property_of_method) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) {}

	return key === undefined || hasOwn.call(obj, key);
};

module.exports = function extend() {
	"use strict";
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0],
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof target === "boolean") {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	} else if (typeof target !== "object" && typeof target !== "function" || target == undefined) {
			target = {};
	}

	for (; i < length; ++i) {
		// Only deal with non-null/undefined values
		if ((options = arguments[i]) != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target === copy) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
					if (copyIsArray) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];
					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[name] = extend(deep, clone, copy);

				// Don't bring in undefined values
				} else if (copy !== undefined) {
					target[name] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};


},{}],19:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],20:[function(require,module,exports){
!function(t,n){"object"==typeof exports&&"undefined"!=typeof module?n(exports):"function"==typeof define&&define.amd?define(["exports"],n):n(t.IntervalNotation=t.IntervalNotation||{})}(this,function(t){"use strict";function n(t,n){if("string"!=typeof t)return null;var e=d.exec(t);if(!e)return null;var r={num:+(e[3]||e[8]),q:e[4]||e[6]};r.dir="-"===(e[2]||e[7])?-1:1;var u=(r.num-1)%7;return r.simple=u+1,r.type=p[u],r.alt=f(r.type,r.q),r.oct=Math.floor((r.num-1)/7),r.size=r.dir*(c[u]+r.alt+12*r.oct),!1!==n&&"M"===r.type&&"P"===r.q?null:r}function e(t){return p[(t-1)%7]}function r(t){return-1===t?"-":""}function u(t,n){return t+7*n}function o(t,n,e,o){return a(t,n)+r(o)+u(t,e)}function i(t,n,e,o){return r(o)+u(t,e)+a(t,n)}function f(t,n){var r="number"==typeof t?e(t):t;return"M"===n&&"M"===r?0:"P"===n&&"P"===r?0:"m"===n&&"M"===r?-1:/^A+$/.test(n)?n.length:/^d+$/.test(n)?"P"===r?-n.length:-n.length-1:null}function l(t,n){return Array(Math.abs(n)+1).join(t)}function a(t,n){var r="number"==typeof t?e(Math.abs(t)):t;return 0===n?"M"===r?"M":"P":-1===n&&"M"===r?"m":n>0?l("A",n):n<0?l("d","P"===r?n:n+1):null}var d=new RegExp("^(?:(([-+]?)(\\d+)(d{1,4}|m|M|P|A{1,4}))|((AA|A|P|M|m|d|dd)([-+]?)(\\d+)))$"),c=[0,2,4,5,7,9,11],p="PMMPPMM";t.parse=n,t.type=e,t.shorthand=o,t.build=i,t.qToAlt=f,t.altToQ=a});


},{}],21:[function(require,module,exports){
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("MIDI", [], factory);
	else if(typeof exports === 'object')
		exports["MIDI"] = factory();
	else
		root["MIDI"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _root = __webpack_require__(2);
	
	var _root2 = _interopRequireDefault(_root);
	
	__webpack_require__(3);
	
	__webpack_require__(8);
	
	__webpack_require__(9);
	
	__webpack_require__(14);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	window.MIDI = _root2.default;
	exports.default = _root2.default;
	module.exports = exports['default'];

/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = {};
	module.exports = exports["default"];

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /*
	                                                                                                                                                                                                                                                                                ----------------------------------------------------------
	                                                                                                                                                                                                                                                                                root.Plugin : 0.3.4 : 2015-03-26
	                                                                                                                                                                                                                                                                                ----------------------------------------------------------
	                                                                                                                                                                                                                                                                                https://github.com/mudcube/root.js
	                                                                                                                                                                                                                                                                                ----------------------------------------------------------
	                                                                                                                                                                                                                                                                                Inspired by javax.sound.midi (albeit a super simple version):
	                                                                                                                                                                                                                                                                                  http://docs.oracle.com/javase/6/docs/api/javax/sound/midi/package-summary.html
	                                                                                                                                                                                                                                                                                ----------------------------------------------------------
	                                                                                                                                                                                                                                                                                Technologies
	                                                                                                                                                                                                                                                                                ----------------------------------------------------------
	                                                                                                                                                                                                                                                                                  Web MIDI API - no native support yet (jazzplugin)
	                                                                                                                                                                                                                                                                                  Web Audio API - firefox 25+, chrome 10+, safari 6+, opera 15+
	                                                                                                                                                                                                                                                                                  HTML5 Audio Tag - ie 9+, firefox 3.5+, chrome 4+, safari 4+, opera 9.5+, ios 4+, android 2.3+
	                                                                                                                                                                                                                                                                                ----------------------------------------------------------
	                                                                                                                                                                                                                                                                              */
	
	var _utils = __webpack_require__(4);
	
	var _root = __webpack_require__(2);
	
	var _root2 = _interopRequireDefault(_root);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	_root2.default.Soundfont = {};
	_root2.default.DEBUG = true;
	_root2.default.USE_XHR = true;
	_root2.default.soundfontUrl = './soundfont/';
	
	/*
	  root.loadPlugin({
	    onsuccess: function() { },
	    onprogress: function(state, percent) { },
	    targetFormat: 'mp3', // optionally can force to use MP3 (for instance on mobile networks)
	    instrument: 'acoustic_grand_piano', // or 1 (default)
	    instruments: [ 'acoustic_grand_piano', 'acoustic_guitar_nylon' ] // or multiple instruments
	  })
	*/
	
	_root2.default.loadPlugin = function (opts) {
	  if (typeof opts === 'function') {
	    opts = { onsuccess: opts };
	  }
	
	  _root2.default.soundfontUrl = opts.soundfontUrl || _root2.default.soundfontUrl;
	
	  // / Detect the best type of audio to use
	  (0, _utils.audioDetect)(function (supports) {
	    var hash = window.location.hash;
	    var api = '';
	
	    // / use the most appropriate plugin if not specified
	    if (supports[opts.api]) {
	      api = opts.api;
	    } else if (supports[hash.substr(1)]) {
	      api = hash.substr(1);
	    } else if (supports.webmidi) {
	      api = 'webmidi';
	    } else if (window.AudioContext) {
	      // Chrome
	      api = 'webaudio';
	    } else if (window.Audio) {
	      // Firefox
	      api = 'audiotag';
	    }
	
	    if (connect[api]) {
	      // / use audio/ogg when supported
	      var audioFormat = void 0;
	      if (opts.targetFormat) {
	        audioFormat = opts.targetFormat;
	      } else {
	        // use best quality
	        audioFormat = supports['audio/ogg'] ? 'ogg' : 'mp3';
	      }
	
	      // / load the specified plugin
	      _root2.default.__api = api;
	      _root2.default.__audioFormat = audioFormat;
	      _root2.default.supports = supports;
	      _root2.default.loadResource(opts);
	    }
	  });
	};
	
	/*
	  root.loadResource({
	    onsuccess: function() { },
	    onprogress: function(state, percent) { },
	    instrument: 'banjo'
	  })
	*/
	
	_root2.default.loadResource = function (opts) {
	  var instruments = opts.instruments || opts.instrument || 'acoustic_grand_piano';
	  // /
	  if ((typeof instruments === 'undefined' ? 'undefined' : _typeof(instruments)) !== 'object') {
	    if (instruments || instruments === 0) {
	      instruments = [instruments];
	    } else {
	      instruments = [];
	    }
	  }
	  // / convert numeric ids into strings
	  for (var i = 0; i < instruments.length; i++) {
	    var instrument = instruments[i];
	    if (instrument === +instrument) {
	      // is numeric
	      if (_root2.default.GM.byId[instrument]) {
	        instruments[i] = _root2.default.GM.byId[instrument].id;
	      }
	    }
	  }
	  // /
	  opts.format = _root2.default.__audioFormat;
	  opts.instruments = instruments;
	  // /
	  connect[_root2.default.__api](opts);
	};
	
	var connect = {
	  webmidi: function webmidi(opts) {
	    // cant wait for this to be standardized!
	    _root2.default.WebMIDI.connect(opts);
	  },
	  audiotag: function audiotag(opts) {
	    // works ok, kinda like a drunken tuna fish, across the board
	    // http://caniuse.com/audio
	    requestQueue(opts, 'AudioTag');
	  },
	  webaudio: function webaudio(opts) {
	    // works awesome! safari, chrome and firefox support
	    // http://caniuse.com/web-audio
	    requestQueue(opts, 'WebAudio');
	  }
	};
	
	var requestQueue = function requestQueue(opts, context) {
	  var audioFormat = opts.format;
	  var instruments = opts.instruments;
	  var onprogress = opts.onprogress;
	  var onerror = opts.onerror;
	  // /
	  var length = instruments.length;
	  var pending = length;
	  var waitForEnd = function waitForEnd() {
	    if (! --pending) {
	      onprogress && onprogress('load', 1.0);
	      _root2.default[context].connect(opts);
	    }
	  };
	  // /
	  for (var i = 0; i < length; i++) {
	    var instrumentId = instruments[i];
	    if (_root2.default.Soundfont[instrumentId]) {
	      // already loaded
	      waitForEnd();
	    } else {
	      // needs to be requested
	      sendRequest(instruments[i], audioFormat, function (evt, progress) {
	        var fileProgress = progress / length;
	        var queueProgress = (length - pending) / length;
	        onprogress && onprogress('load', fileProgress + queueProgress, instrumentId);
	      }, function () {
	        waitForEnd();
	      }, onerror);
	    }
	  }
	};
	
	var sendRequest = function sendRequest(instrumentId, audioFormat, onprogress, _onsuccess, onerror) {
	  var soundfontPath = _root2.default.soundfontUrl + instrumentId + '-' + audioFormat + '.js';
	  if (_root2.default.USE_XHR) {
	    (0, _utils.request)({
	      url: soundfontPath,
	      format: 'text',
	      onerror: onerror,
	      onprogress: onprogress,
	      onsuccess: function onsuccess(event, responseText) {
	        var script = document.createElement('script');
	        script.language = 'javascript';
	        script.type = 'text/javascript';
	        script.text = responseText;
	        document.body.appendChild(script);
	        _onsuccess();
	      }
	    });
	  } else {
	    _utils.loadScript.add({
	      url: soundfontPath,
	      verify: 'root.Soundfont["' + instrumentId + '"]',
	      onerror: onerror,
	      onsuccess: function onsuccess() {
	        _onsuccess();
	      }
	    });
	  }
	};
	
	_root2.default.setDefaultPlugin = function (midi) {
	  for (var key in midi) {
	    _root2.default[key] = midi[key];
	  }
	};

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _audioDetect = __webpack_require__(5);
	
	Object.keys(_audioDetect).forEach(function (key) {
	  if (key === "default" || key === "__esModule") return;
	  Object.defineProperty(exports, key, {
	    enumerable: true,
	    get: function get() {
	      return _audioDetect[key];
	    }
	  });
	});
	
	var _loadScript = __webpack_require__(6);
	
	Object.keys(_loadScript).forEach(function (key) {
	  if (key === "default" || key === "__esModule") return;
	  Object.defineProperty(exports, key, {
	    enumerable: true,
	    get: function get() {
	      return _loadScript[key];
	    }
	  });
	});
	
	var _request = __webpack_require__(7);
	
	Object.keys(_request).forEach(function (key) {
	  if (key === "default" || key === "__esModule") return;
	  Object.defineProperty(exports, key, {
	    enumerable: true,
	    get: function get() {
	      return _request[key];
	    }
	  });
	});

/***/ },
/* 5 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	/*
	  ----------------------------------------------------------
	  midi.audioDetect : 0.3.2 : 2015-03-26
	  ----------------------------------------------------------
	  https://github.com/mudcube/midi.js
	  ----------------------------------------------------------
	  Probably, Maybe, No... Absolutely!
	  Test to see what types of <audio> MIME types are playable by the browser.
	  ----------------------------------------------------------
	*/
	
	var supports = {}; // object of supported file types
	var pending = 0; // pending file types to process
	var canPlayThrough = function canPlayThrough(src) {
	  // check whether format plays through
	  pending++;
	  var body = document.body;
	  var audio = new window.Audio();
	  var mime = src.split(';')[0];
	  audio.id = 'audio';
	  audio.setAttribute('preload', 'auto');
	  audio.setAttribute('audiobuffer', true);
	  audio.addEventListener('error', function () {
	    body.removeChild(audio);
	    supports[mime] = false;
	    pending--;
	  }, false);
	  audio.addEventListener('canplaythrough', function () {
	    body.removeChild(audio);
	    supports[mime] = true;
	    pending--;
	  }, false);
	  audio.src = 'data:' + src;
	  body.appendChild(audio);
	};
	
	var audioDetect = exports.audioDetect = function audioDetect(onsuccess) {
	  // / detect jazz-midi plugin
	  if (navigator.requestMIDIAccess) {
	    var isNative = Function.prototype.toString.call(navigator.requestMIDIAccess).indexOf('[native code]');
	    if (isNative) {
	      // has native midiapi support
	      supports['webmidi'] = true;
	    } else {
	      // check for jazz plugin midiapi support
	      for (var n = 0; navigator.plugins.length > n; n++) {
	        var plugin = navigator.plugins[n];
	        if (plugin.name.indexOf('Jazz-Plugin') >= 0) {
	          supports['webmidi'] = true;
	        }
	      }
	    }
	  }
	
	  // / check whether <audio> tag is supported
	  if (typeof window.Audio === 'undefined') {
	    return onsuccess({});
	  } else {
	    supports['audiotag'] = true;
	  }
	
	  // / check for webaudio api support
	  if (window.AudioContext || window.webkitAudioContext) {
	    supports['webaudio'] = true;
	  }
	
	  // / check whether canPlayType is supported
	  var audio = new window.Audio();
	  if (typeof audio.canPlayType === 'undefined') {
	    return onsuccess(supports);
	  }
	
	  // / see what we can learn from the browser
	  var vorbis = audio.canPlayType('audio/ogg; codecs="vorbis"');
	  vorbis = vorbis === 'probably' || vorbis === 'maybe';
	  var mpeg = audio.canPlayType('audio/mpeg');
	  mpeg = mpeg === 'probably' || mpeg === 'maybe';
	  // maybe nothing is supported
	  if (!vorbis && !mpeg) {
	    onsuccess(supports);
	    return;
	  }
	
	  // / or maybe something is supported
	  if (vorbis) canPlayThrough('audio/ogg;base64,T2dnUwACAAAAAAAAAADqnjMlAAAAAOyyzPIBHgF2b3JiaXMAAAAAAUAfAABAHwAAQB8AAEAfAACZAU9nZ1MAAAAAAAAAAAAA6p4zJQEAAAANJGeqCj3//////////5ADdm9yYmlzLQAAAFhpcGguT3JnIGxpYlZvcmJpcyBJIDIwMTAxMTAxIChTY2hhdWZlbnVnZ2V0KQAAAAABBXZvcmJpcw9CQ1YBAAABAAxSFCElGVNKYwiVUlIpBR1jUFtHHWPUOUYhZBBTiEkZpXtPKpVYSsgRUlgpRR1TTFNJlVKWKUUdYxRTSCFT1jFloXMUS4ZJCSVsTa50FkvomWOWMUYdY85aSp1j1jFFHWNSUkmhcxg6ZiVkFDpGxehifDA6laJCKL7H3lLpLYWKW4q91xpT6y2EGEtpwQhhc+211dxKasUYY4wxxsXiUyiC0JBVAAABAABABAFCQ1YBAAoAAMJQDEVRgNCQVQBABgCAABRFcRTHcRxHkiTLAkJDVgEAQAAAAgAAKI7hKJIjSZJkWZZlWZameZaouaov+64u667t6roOhIasBACAAAAYRqF1TCqDEEPKQ4QUY9AzoxBDDEzGHGNONKQMMogzxZAyiFssLqgQBKEhKwKAKAAAwBjEGGIMOeekZFIi55iUTkoDnaPUUcoolRRLjBmlEluJMYLOUeooZZRCjKXFjFKJscRUAABAgAMAQICFUGjIigAgCgCAMAYphZRCjCnmFHOIMeUcgwwxxiBkzinoGJNOSuWck85JiRhjzjEHlXNOSuekctBJyaQTAAAQ4AAAEGAhFBqyIgCIEwAwSJKmWZomipamiaJniqrqiaKqWp5nmp5pqqpnmqpqqqrrmqrqypbnmaZnmqrqmaaqiqbquqaquq6nqrZsuqoum65q267s+rZru77uqapsm6or66bqyrrqyrbuurbtS56nqqKquq5nqq6ruq5uq65r25pqyq6purJtuq4tu7Js664s67pmqq5suqotm64s667s2rYqy7ovuq5uq7Ks+6os+75s67ru2rrwi65r66os674qy74x27bwy7ouHJMnqqqnqq7rmarrqq5r26rr2rqmmq5suq4tm6or26os67Yry7aumaosm64r26bryrIqy77vyrJui67r66Ys67oqy8Lu6roxzLat+6Lr6roqy7qvyrKuu7ru+7JuC7umqrpuyrKvm7Ks+7auC8us27oxuq7vq7It/KosC7+u+8Iy6z5jdF1fV21ZGFbZ9n3d95Vj1nVhWW1b+V1bZ7y+bgy7bvzKrQvLstq2scy6rSyvrxvDLux8W/iVmqratum6um7Ksq/Lui60dd1XRtf1fdW2fV+VZd+3hV9pG8OwjK6r+6os68Jry8ov67qw7MIvLKttK7+r68ow27qw3L6wLL/uC8uq277v6rrStXVluX2fsSu38QsAABhwAAAIMKEMFBqyIgCIEwBAEHIOKQahYgpCCKGkEEIqFWNSMuakZM5JKaWUFEpJrWJMSuaclMwxKaGUlkopqYRSWiqlxBRKaS2l1mJKqcVQSmulpNZKSa2llGJMrcUYMSYlc05K5pyUklJrJZXWMucoZQ5K6iCklEoqraTUYuacpA46Kx2E1EoqMZWUYgupxFZKaq2kFGMrMdXUWo4hpRhLSrGVlFptMdXWWqs1YkxK5pyUzDkqJaXWSiqtZc5J6iC01DkoqaTUYiopxco5SR2ElDLIqJSUWiupxBJSia20FGMpqcXUYq4pxRZDSS2WlFosqcTWYoy1tVRTJ6XFklKMJZUYW6y5ttZqDKXEVkqLsaSUW2sx1xZjjqGkFksrsZWUWmy15dhayzW1VGNKrdYWY40x5ZRrrT2n1mJNMdXaWqy51ZZbzLXnTkprpZQWS0oxttZijTHmHEppraQUWykpxtZara3FXEMpsZXSWiypxNhirLXFVmNqrcYWW62ltVprrb3GVlsurdXcYqw9tZRrrLXmWFNtBQAADDgAAASYUAYKDVkJAEQBAADGMMYYhEYpx5yT0ijlnHNSKucghJBS5hyEEFLKnINQSkuZcxBKSSmUklJqrYVSUmqttQIAAAocAAACbNCUWByg0JCVAEAqAIDBcTRNFFXVdX1fsSxRVFXXlW3jVyxNFFVVdm1b+DVRVFXXtW3bFn5NFFVVdmXZtoWiqrqybduybgvDqKqua9uybeuorqvbuq3bui9UXVmWbVu3dR3XtnXd9nVd+Bmzbeu2buu+8CMMR9/4IeTj+3RCCAAAT3AAACqwYXWEk6KxwEJDVgIAGQAAgDFKGYUYM0gxphhjTDHGmAAAgAEHAIAAE8pAoSErAoAoAADAOeecc84555xzzjnnnHPOOeecc44xxhhjjDHGGGOMMcYYY4wxxhhjjDHGGGOMMcYYY0wAwE6EA8BOhIVQaMhKACAcAABACCEpKaWUUkoRU85BSSmllFKqFIOMSkoppZRSpBR1lFJKKaWUIqWgpJJSSimllElJKaWUUkoppYw6SimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaVUSimllFJKKaWUUkoppRQAYPLgAACVYOMMK0lnhaPBhYasBAByAwAAhRiDEEJpraRUUkolVc5BKCWUlEpKKZWUUqqYgxBKKqmlklJKKbXSQSihlFBKKSWUUkooJYQQSgmhlFRCK6mEUkoHoYQSQimhhFRKKSWUzkEoIYUOQkmllNRCSB10VFIpIZVSSiklpZQ6CKGUklJLLZVSWkqpdBJSKamV1FJqqbWSUgmhpFZKSSWl0lpJJbUSSkklpZRSSymFVFJJJYSSUioltZZaSqm11lJIqZWUUkqppdRSSiWlkEpKqZSSUmollZRSaiGVlEpJKaTUSimlpFRCSamlUlpKLbWUSkmptFRSSaWUlEpJKaVSSksppRJKSqmllFpJKYWSUkoplZJSSyW1VEoKJaWUUkmptJRSSymVklIBAEAHDgAAAUZUWoidZlx5BI4oZJiAAgAAQABAgAkgMEBQMApBgDACAQAAAADAAAAfAABHARAR0ZzBAUKCwgJDg8MDAAAAAAAAAAAAAACAT2dnUwAEAAAAAAAAAADqnjMlAgAAADzQPmcBAQA=');
	  if (mpeg) canPlayThrough('audio/mpeg;base64,/+MYxAAAAANIAUAAAASEEB/jwOFM/0MM/90b/+RhST//w4NFwOjf///PZu////9lns5GFDv//l9GlUIEEIAAAgIg8Ir/JGq3/+MYxDsLIj5QMYcoAP0dv9HIjUcH//yYSg+CIbkGP//8w0bLVjUP///3Z0x5QCAv/yLjwtGKTEFNRTMuOTeqqqqqqqqqqqqq/+MYxEkNmdJkUYc4AKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq');
	
	  // / lets find out!
	  var time = new Date().getTime();
	  var interval = window.setInterval(function () {
	    var now = new Date().getTime();
	    var maxExecution = now - time > 5000;
	    if (!pending || maxExecution) {
	      window.clearInterval(interval);
	      onsuccess(supports);
	    }
	  }, 1);
	};

/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	/*
	  -----------------------------------------------------------
	  loadScript.js : 0.1.4 : 2014/02/12 : http://mudcu.be
	  -----------------------------------------------------------
	  Copyright 2011-2014 Mudcube. All rights reserved.
	  -----------------------------------------------------------
	  /// No verification
	  loadScript.add("../js/jszip/jszip.js")
	  /// Strict loading order and verification.
	  loadScript.add({
	    strictOrder: true,
	    urls: [
	      {
	        url: "../js/jszip/jszip.js",
	        verify: "JSZip",
	        onsuccess: function() {
	          console.log(1)
	        }
	      },
	      {
	        url: "../inc/downloadify/js/swfobject.js",
	        verify: "swfobject",
	        onsuccess: function() {
	          console.log(2)
	        }
	      }
	    ],
	    onsuccess: function() {
	      console.log(3)
	    }
	  })
	  /// Just verification.
	  loadScript.add({
	    url: "../js/jszip/jszip.js",
	    verify: "JSZip",
	    onsuccess: function() {
	      console.log(1)
	    }
	  })
	*/
	
	var _globalExists = function _globalExists(path, root) {
	  try {
	    path = path.split('"').join('').split("'").join('').split(']').join('').split('[').join('.');
	    var parts = path.split('.');
	    var length = parts.length;
	    var object = root || window;
	    for (var n = 0; n < length; n++) {
	      var key = parts[n];
	      if (object[key] == null) {
	        return false;
	      } else {
	        //
	        object = object[key];
	      }
	    }
	    return true;
	  } catch (e) {
	    return false;
	  }
	};
	
	var LoadScript = function LoadScript() {
	  this.loaded = {};
	  this.loading = {};
	  return this;
	};
	
	LoadScript.prototype.add = function (config) {
	  var that = this;
	  if (typeof config === 'string') {
	    config = { url: config };
	  }
	  var urls = config.urls;
	  if (typeof urls === 'undefined') {
	    urls = [{
	      url: config.url,
	      verify: config.verify
	    }];
	  }
	  // / adding the elements to the head
	  var doc = document.getElementsByTagName('head')[0];
	  // /
	  var testElement = function testElement(element, test) {
	    if (that.loaded[element.url]) return;
	    if (test && _globalExists(test) === false) return;
	    that.loaded[element.url] = true;
	    //
	    if (that.loading[element.url]) that.loading[element.url]();
	    delete that.loading[element.url];
	    //
	    if (element.onsuccess) element.onsuccess();
	    if (typeof getNext !== 'undefined') getNext();
	  };
	  // /
	  var hasError = false;
	  var batchTest = [];
	  var addElement = function addElement(element) {
	    if (typeof element === 'string') {
	      element = {
	        url: element,
	        verify: config.verify
	      };
	    }
	    if (/([\w\d.\[\]'"])$/.test(element.verify)) {
	      // check whether its a variable reference
	      var verify = element.test = element.verify;
	      if ((typeof verify === 'undefined' ? 'undefined' : _typeof(verify)) === 'object') {
	        for (var n = 0; n < verify.length; n++) {
	          batchTest.push(verify[n]);
	        }
	      } else {
	        batchTest.push(verify);
	      }
	    }
	    if (that.loaded[element.url]) return;
	    var script = document.createElement('script');
	    script.onreadystatechange = function () {
	      if (this.readyState !== 'loaded' && this.readyState !== 'complete') return;
	      testElement(element);
	    };
	    script.onload = function () {
	      testElement(element);
	    };
	    script.onerror = function () {
	      hasError = true;
	      delete that.loading[element.url];
	      if (_typeof(element.test) === 'object') {
	        for (var key in element.test) {
	          removeTest(element.test[key]);
	        }
	      } else {
	        removeTest(element.test);
	      }
	    };
	    script.setAttribute('type', 'text/javascript');
	    script.setAttribute('src', element.url);
	    doc.appendChild(script);
	    that.loading[element.url] = function () {};
	  };
	  // / checking to see whether everything loaded properly
	  var removeTest = function removeTest(test) {
	    var ret = [];
	    for (var n = 0; n < batchTest.length; n++) {
	      if (batchTest[n] === test) continue;
	      ret.push(batchTest[n]);
	    }
	    batchTest = ret;
	  };
	  var onLoad = function onLoad(element) {
	    if (element) {
	      testElement(element, element.test);
	    } else {
	      for (var n = 0; n < urls.length; n++) {
	        testElement(urls[n], urls[n].test);
	      }
	    }
	    var istrue = true;
	    for (var _n = 0; _n < batchTest.length; _n++) {
	      if (_globalExists(batchTest[_n]) === false) {
	        istrue = false;
	      }
	    }
	    if (!config.strictOrder && istrue) {
	      // finished loading all the requested scripts
	      if (hasError) {
	        if (config.error) {
	          config.error();
	        }
	      } else if (config.onsuccess) {
	        config.onsuccess();
	      }
	    } else {
	      // keep calling back the function
	      setTimeout(function () {
	        // - should get slower over time?
	        onLoad(element);
	      }, 10);
	    }
	  };
	  // / loading methods;  strict ordering or loose ordering
	  if (config.strictOrder) {
	    var ID = -1;
	    var getNext = function getNext() {
	      ID++;
	      if (!urls[ID]) {
	        // all elements are loaded
	        if (hasError) {
	          if (config.error) {
	            config.error();
	          }
	        } else if (config.onsuccess) {
	          config.onsuccess();
	        }
	      } else {
	        // loading new script
	        var element = urls[ID];
	        var url = element.url;
	        if (that.loading[url]) {
	          // already loading from another call (attach to event)
	          that.loading[url] = function () {
	            if (element.onsuccess) element.onsuccess();
	            getNext();
	          };
	        } else if (!that.loaded[url]) {
	          // create script element
	          addElement(element);
	          onLoad(element);
	        } else {
	          // it's already been successfully loaded
	          getNext();
	        }
	      }
	    };
	    getNext();
	  } else {
	    // loose ordering
	    for (var _ID = 0; _ID < urls.length; _ID++) {
	      addElement(urls[_ID]);
	      onLoad(urls[_ID]);
	    }
	  }
	};
	
	var loadScript = exports.loadScript = new LoadScript();

/***/ },
/* 7 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.request = request;
	/*
	  ----------------------------------------------------------
	  Request : 0.1.1 : 2015-03-26
	  ----------------------------------------------------------
	  request({
	    url: './dir/something.extension',
	    data: 'test!',
	    format: 'text', // text | xml | json | binary
	    responseType: 'text', // arraybuffer | blob | document | json | text
	    headers: {},
	    withCredentials: true, // true | false
	    ///
	    onerror: function(evt, percent) {
	      console.log(evt)
	    },
	    onsuccess: function(evt, responseText) {
	      console.log(responseText)
	    },
	    onprogress: function(evt, percent) {
	      percent = Math.round(percent * 100)
	      loader.create('thread', 'loading... ', percent)
	    }
	  })
	*/
	
	function request(opts, onsuccess, onerror, onprogress) {
	  if (typeof opts === 'string') opts = { url: opts };
	  var data = opts.data;
	  var url = opts.url;
	  var method = opts.method || (opts.data ? 'POST' : 'GET');
	  var format = opts.format;
	  var headers = opts.headers;
	  var responseType = opts.responseType;
	  var withCredentials = opts.withCredentials || false;
	  var xhr = new window.XMLHttpRequest();
	  onsuccess = onsuccess || opts.onsuccess;
	  onerror = onerror || opts.onerror;
	  onprogress = onprogress || opts.onprogress;
	  xhr.open(method, url, true);
	  if (headers) {
	    for (var type in headers) {
	      xhr.setRequestHeader(type, headers[type]);
	    }
	  } else if (data) {
	    // set the default headers for POST
	    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	  }
	  if (format === 'binary') {
	    // - default to responseType="blob" when supported
	    if (xhr.overrideMimeType) {
	      xhr.overrideMimeType('text/plain; charset=x-user-defined');
	    }
	  }
	  if (responseType) {
	    xhr.responseType = responseType;
	  }
	  if (withCredentials) {
	    xhr.withCredentials = 'true';
	  }
	  if (onerror && 'onerror' in xhr) {
	    xhr.onerror = onerror;
	  }
	  if (onprogress && xhr.upload && 'onprogress' in xhr.upload) {
	    if (data) {
	      xhr.upload.onprogress = function (evt) {
	        onprogress.call(xhr, evt, evt.loaded / evt.total);
	      };
	    } else {
	      xhr.addEventListener('progress', function (evt) {
	        var totalBytes = 0;
	        if (evt.lengthComputable) {
	          totalBytes = evt.total;
	        } else if (xhr.totalBytes) {
	          totalBytes = xhr.totalBytes;
	        } else {
	          var rawBytes = parseInt(xhr.getResponseHeader('Content-Length-Raw'));
	          if (isFinite(rawBytes)) {
	            xhr.totalBytes = totalBytes = rawBytes;
	          } else {
	            return;
	          }
	        }
	        onprogress.call(xhr, evt, evt.loaded / totalBytes);
	      });
	    }
	  }
	  // /
	  xhr.onreadystatechange = function (evt) {
	    if (xhr.readyState === 4) {
	      // The request is complete
	      if (xhr.status === 200 || // Response OK
	      xhr.status === 304 || // Not Modified
	      xhr.status === 308 // Permanent Redirect
	      ) {
	          if (onsuccess) {
	            var res;
	            if (format === 'xml') {
	              res = evt.target.responseXML;
	            } else if (format === 'text') {
	              res = evt.target.responseText;
	            } else if (format === 'json') {
	              try {
	                res = JSON.parse(evt.target.response);
	              } catch (err) {
	                onerror && onerror.call(xhr, evt);
	              }
	            }
	            onsuccess.call(xhr, evt, res);
	          }
	        } else {
	        onerror && onerror.call(xhr, evt);
	      }
	    }
	  };
	  xhr.send(data);
	  return xhr;
	}

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _root = __webpack_require__(2);
	
	var _root2 = _interopRequireDefault(_root);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	_root2.default.GM = function (map) {
	  var clean = function clean(name) {
	    return name.replace(/[^a-z0-9 ]/gi, '').replace(/[ ]/g, '_').toLowerCase();
	  };
	  var res = {
	    byName: {},
	    byId: {},
	    byCategory: {}
	  };
	  for (var key in map) {
	    var list = map[key];
	    for (var n = 0, length = list.length; n < length; n++) {
	      var instrument = list[n];
	      if (!instrument) continue;
	      var num = parseInt(instrument.substr(0, instrument.indexOf(' ')), 10);
	      instrument = instrument.replace(num + ' ', '');
	      res.byId[--num] = res.byName[clean(instrument)] = res.byCategory[clean(key)] = {
	        id: clean(instrument),
	        instrument: instrument,
	        number: num,
	        category: key
	      };
	    }
	  }
	  return res;
	}({
	  'Piano': ['1 Acoustic Grand Piano', '2 Bright Acoustic Piano', '3 Electric Grand Piano', '4 Honky-tonk Piano', '5 Electric Piano 1', '6 Electric Piano 2', '7 Harpsichord', '8 Clavinet'],
	  'Chromatic Percussion': ['9 Celesta', '10 Glockenspiel', '11 Music Box', '12 Vibraphone', '13 Marimba', '14 Xylophone', '15 Tubular Bells', '16 Dulcimer'],
	  'Organ': ['17 Drawbar Organ', '18 Percussive Organ', '19 Rock Organ', '20 Church Organ', '21 Reed Organ', '22 Accordion', '23 Harmonica', '24 Tango Accordion'],
	  'Guitar': ['25 Acoustic Guitar (nylon)', '26 Acoustic Guitar (steel)', '27 Electric Guitar (jazz)', '28 Electric Guitar (clean)', '29 Electric Guitar (muted)', '30 Overdriven Guitar', '31 Distortion Guitar', '32 Guitar Harmonics'],
	  'Bass': ['33 Acoustic Bass', '34 Electric Bass (finger)', '35 Electric Bass (pick)', '36 Fretless Bass', '37 Slap Bass 1', '38 Slap Bass 2', '39 Synth Bass 1', '40 Synth Bass 2'],
	  'Strings': ['41 Violin', '42 Viola', '43 Cello', '44 Contrabass', '45 Tremolo Strings', '46 Pizzicato Strings', '47 Orchestral Harp', '48 Timpani'],
	  'Ensemble': ['49 String Ensemble 1', '50 String Ensemble 2', '51 Synth Strings 1', '52 Synth Strings 2', '53 Choir Aahs', '54 Voice Oohs', '55 Synth Choir', '56 Orchestra Hit'],
	  'Brass': ['57 Trumpet', '58 Trombone', '59 Tuba', '60 Muted Trumpet', '61 French Horn', '62 Brass Section', '63 Synth Brass 1', '64 Synth Brass 2'],
	  'Reed': ['65 Soprano Sax', '66 Alto Sax', '67 Tenor Sax', '68 Baritone Sax', '69 Oboe', '70 English Horn', '71 Bassoon', '72 Clarinet'],
	  'Pipe': ['73 Piccolo', '74 Flute', '75 Recorder', '76 Pan Flute', '77 Blown Bottle', '78 Shakuhachi', '79 Whistle', '80 Ocarina'],
	  'Synth Lead': ['81 Lead 1 (square)', '82 Lead 2 (sawtooth)', '83 Lead 3 (calliope)', '84 Lead 4 (chiff)', '85 Lead 5 (charang)', '86 Lead 6 (voice)', '87 Lead 7 (fifths)', '88 Lead 8 (bass + lead)'],
	  'Synth Pad': ['89 Pad 1 (new age)', '90 Pad 2 (warm)', '91 Pad 3 (polysynth)', '92 Pad 4 (choir)', '93 Pad 5 (bowed)', '94 Pad 6 (metallic)', '95 Pad 7 (halo)', '96 Pad 8 (sweep)'],
	  'Synth Effects': ['97 FX 1 (rain)', '98 FX 2 (soundtrack)', '99 FX 3 (crystal)', '100 FX 4 (atmosphere)', '101 FX 5 (brightness)', '102 FX 6 (goblins)', '103 FX 7 (echoes)', '104 FX 8 (sci-fi)'],
	  'Ethnic': ['105 Sitar', '106 Banjo', '107 Shamisen', '108 Koto', '109 Kalimba', '110 Bagpipe', '111 Fiddle', '112 Shanai'],
	  'Percussive': ['113 Tinkle Bell', '114 Agogo', '115 Steel Drums', '116 Woodblock', '117 Taiko Drum', '118 Melodic Tom', '119 Synth Drum'],
	  'Sound effects': ['120 Reverse Cymbal', '121 Guitar Fret Noise', '122 Breath Noise', '123 Seashore', '124 Bird Tweet', '125 Telephone Ring', '126 Helicopter', '127 Applause', '128 Gunshot']
	});
	
	/* get/setInstrument
	--------------------------------------------------- */
	/*
	  ----------------------------------------------------------
	  GeneralMIDI
	  ----------------------------------------------------------
	*/
	
	_root2.default.getInstrument = function (channelId) {
	  var channel = _root2.default.channels[channelId];
	  return channel && channel.instrument;
	};
	
	_root2.default.setInstrument = function (channelId, program, delay) {
	  var channel = _root2.default.channels[channelId];
	  if (delay) {
	    return setTimeout(function () {
	      channel.instrument = program;
	    }, delay);
	  } else {
	    channel.instrument = program;
	  }
	};
	
	/* get/setMono
	--------------------------------------------------- */
	_root2.default.getMono = function (channelId) {
	  var channel = _root2.default.channels[channelId];
	  return channel && channel.mono;
	};
	
	_root2.default.setMono = function (channelId, truthy, delay) {
	  var channel = _root2.default.channels[channelId];
	  if (delay) {
	    return setTimeout(function () {
	      channel.mono = truthy;
	    }, delay);
	  } else {
	    channel.mono = truthy;
	  }
	};
	
	/* get/setOmni
	--------------------------------------------------- */
	_root2.default.getOmni = function (channelId) {
	  var channel = _root2.default.channels[channelId];
	  return channel && channel.omni;
	};
	
	_root2.default.setOmni = function (channelId, truthy, delay) {
	  var channel = _root2.default.channels[channelId];
	  if (delay) {
	    return setTimeout(function () {
	      channel.omni = truthy;
	    }, delay);
	  } else {
	    channel.omni = truthy;
	  }
	};
	
	/* get/setSolo
	--------------------------------------------------- */
	_root2.default.getSolo = function (channelId) {
	  var channel = _root2.default.channels[channelId];
	  return channel && channel.solo;
	};
	
	_root2.default.setSolo = function (channelId, truthy, delay) {
	  var channel = _root2.default.channels[channelId];
	  if (delay) {
	    return setTimeout(function () {
	      channel.solo = truthy;
	    }, delay);
	  } else {
	    channel.solo = truthy;
	  }
	};
	
	/* channels
	--------------------------------------------------- */
	_root2.default.channels = function () {
	  // 0 - 15 channels
	  var channels = {};
	  for (var i = 0; i < 16; i++) {
	    channels[i] = { // default values
	      instrument: i,
	      pitchBend: 0,
	      mute: false,
	      mono: false,
	      omni: false,
	      solo: false
	    };
	  }
	  return channels;
	}();
	
	/* note conversions
	--------------------------------------------------- */
	_root2.default.keyToNote = {}; // C8  == 108
	_root2.default.noteToKey = {}; // 108 ==  C8
	
	~function () {
	  var A0 = 0x15; // first note
	  var C8 = 0x6C; // last note
	  var number2key = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
	  for (var n = A0; n <= C8; n++) {
	    var octave = (n - 12) / 12 >> 0;
	    var name = number2key[n % 12] + octave;
	    _root2.default.keyToNote[name] = n;
	    _root2.default.noteToKey[n] = name;
	  }
	}();

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _jasmid = __webpack_require__(10);
	
	var _root = __webpack_require__(2);
	
	var _root2 = _interopRequireDefault(_root);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/*
	  ----------------------------------------------------------
	  midi.Player : 0.3.1 : 2015-03-26
	  ----------------------------------------------------------
	  https://github.com/mudcube/midi.js
	  ----------------------------------------------------------
	*/
	
	(function () {
	  _root2.default.Player = {};
	  var player = _root2.default.Player;
	  player.currentTime = 0;
	  player.endTime = 0;
	  player.restart = 0;
	  player.playing = false;
	  player.timeWarp = 1;
	  player.startDelay = 0;
	  player.BPM = 120;
	
	  player.start = player.resume = function (onsuccess) {
	    if (player.currentTime < -1) {
	      player.currentTime = -1;
	    }
	    startAudio(player.currentTime, null, onsuccess);
	  };
	
	  player.pause = function () {
	    var tmp = player.restart;
	    stopAudio();
	    player.restart = tmp;
	  };
	
	  player.stop = function () {
	    stopAudio();
	    player.restart = 0;
	    player.currentTime = 0;
	  };
	
	  player.addListener = function (onsuccess) {
	    onMidiEvent = onsuccess;
	  };
	
	  player.removeListener = function () {
	    onMidiEvent = undefined;
	  };
	
	  player.clearAnimation = function () {
	    if (player.animationFrameId) {
	      window.cancelAnimationFrame(player.animationFrameId);
	    }
	  };
	
	  player.setAnimation = function (callback) {
	    var currentTime = 0;
	    var tOurTime = 0;
	    var tTheirTime = 0;
	    //
	    player.clearAnimation();
	    // /
	    var frame = function frame() {
	      player.animationFrameId = window.requestAnimationFrame(frame);
	      // /
	      if (player.endTime === 0) {
	        return;
	      }
	      if (player.playing) {
	        currentTime = tTheirTime === player.currentTime ? tOurTime - Date.now() : 0;
	        if (player.currentTime === 0) {
	          currentTime = 0;
	        } else {
	          currentTime = player.currentTime - currentTime;
	        }
	        if (tTheirTime !== player.currentTime) {
	          tOurTime = Date.now();
	          tTheirTime = player.currentTime;
	        }
	      } else {
	        // paused
	        currentTime = player.currentTime;
	      }
	      // /
	      var endTime = player.endTime;
	      // var percent = currentTime / endTime
	      var total = currentTime / 1000;
	      var minutes = total / 60;
	      var seconds = total - minutes * 60;
	      var t1 = minutes * 60 + seconds;
	      var t2 = endTime / 1000;
	      // /
	      if (t2 - t1 < -1.0) {
	        return;
	      } else {
	        callback({
	          now: t1,
	          end: t2,
	          events: noteRegistrar
	        });
	      }
	    };
	    // /
	    window.requestAnimationFrame(frame);
	  };
	
	  // helpers
	
	  player.loadMidiFile = function (onsuccess, onprogress, onerror) {
	    try {
	      // console.log(MidiFile(player.currentData), new Replayer(MidiFile(player.currentData), player.timeWarp, null, player.BPM))
	      player.replayer = new _jasmid.Replayer((0, _jasmid.MidiFile)(player.currentData), player.timeWarp, null, player.BPM);
	      player.data = player.replayer.getData();
	      player.endTime = getLength();
	      // /
	      _root2.default.loadPlugin({
	        // instruments: player.getFileInstruments(),
	        onsuccess: onsuccess,
	        onprogress: onprogress,
	        onerror: onerror
	      });
	    } catch (event) {
	      console.error(event);
	      onerror && onerror(event);
	    }
	  };
	
	  player.loadFile = function (file, onsuccess, onprogress, onerror) {
	    player.stop();
	    if (file.indexOf('base64,') !== -1) {
	      var data = window.atob(file.split(',')[1]);
	      player.currentData = data;
	      player.loadMidiFile(onsuccess, onprogress, onerror);
	    } else {
	      var fetch = new window.XMLHttpRequest();
	      fetch.open('GET', file);
	      fetch.overrideMimeType('text/plain; charset=x-user-defined');
	      fetch.onreadystatechange = function () {
	        if (this.readyState === 4) {
	          if (this.status === 200) {
	            var t = this.responseText || '';
	            var ff = [];
	            var mx = t.length;
	            var scc = String.fromCharCode;
	            for (var z = 0; z < mx; z++) {
	              ff[z] = scc(t.charCodeAt(z) & 255);
	            }
	            // /
	            var data = ff.join('');
	            player.currentData = data;
	            player.loadMidiFile(onsuccess, onprogress, onerror);
	          } else {
	            onerror && onerror('Unable to load MIDI file');
	          }
	        }
	      };
	      fetch.send();
	    }
	  };
	
	  player.getFileInstruments = function () {
	    var instruments = {};
	    var programs = {};
	    for (var n = 0; n < player.data.length; n++) {
	      var event = player.data[n][0].event;
	      if (event.type !== 'channel') {
	        continue;
	      }
	      var channel = event.channel;
	      switch (event.subtype) {
	        case 'controller':
	          //        console.log(event.channel, root.defineControl[event.controllerType], event.value)
	          break;
	        case 'programChange':
	          programs[channel] = event.programNumber;
	          break;
	        case 'noteOn':
	          var program = programs[channel];
	          var gm = _root2.default.GM.byId[isFinite(program) ? program : channel];
	          instruments[gm.id] = true;
	          break;
	      }
	    }
	    var ret = [];
	    for (var key in instruments) {
	      ret.push(key);
	    }
	    return ret;
	  };
	
	  // Playing the audio
	
	  var eventQueue = []; // hold events to be triggered
	  var queuedTime; //
	  var startTime = 0; // to measure time elapse
	  var noteRegistrar = {}; // get event for requested note
	  var onMidiEvent; // listener
	  var scheduleTracking = function scheduleTracking(channel, note, currentTime, offset, message, velocity, time) {
	    return setTimeout(function () {
	      var data = {
	        channel: channel,
	        note: note,
	        now: currentTime,
	        end: player.endTime,
	        message: message,
	        velocity: velocity
	      };
	      //
	      if (message === 128) {
	        delete noteRegistrar[note];
	      } else {
	        noteRegistrar[note] = data;
	      }
	      if (onMidiEvent) {
	        onMidiEvent(data);
	      }
	      player.currentTime = currentTime;
	      // /
	      eventQueue.shift();
	      // /
	      if (eventQueue.length < 1000) {
	        startAudio(queuedTime, true);
	      } else if (player.currentTime === queuedTime && queuedTime < player.endTime) {
	        // grab next sequence
	        startAudio(queuedTime, true);
	      }
	    }, currentTime - offset);
	  };
	
	  var getContext = function getContext() {
	    if (_root2.default.api === 'webaudio') {
	      return _root2.default.WebAudio.getContext();
	    } else {
	      player.ctx = { currentTime: 0 };
	    }
	    return player.ctx;
	  };
	
	  var getLength = function getLength() {
	    var data = player.data;
	    var length = data.length;
	    var totalTime = 0.5;
	    for (var n = 0; n < length; n++) {
	      totalTime += data[n][1];
	    }
	    return totalTime;
	  };
	
	  var __now;
	  var getNow = function getNow() {
	    if (window.performance && window.performance.now) {
	      return window.performance.now();
	    } else {
	      return Date.now();
	    }
	  };
	
	  var startAudio = function startAudio(currentTime, fromCache, onsuccess) {
	    if (!player.replayer) {
	      return;
	    }
	    if (!fromCache) {
	      if (typeof currentTime === 'undefined') {
	        currentTime = player.restart;
	      }
	      // /
	      player.playing && stopAudio();
	      player.playing = true;
	      player.data = player.replayer.getData();
	      player.endTime = getLength();
	    }
	    // /
	    var note;
	    var offset = 0;
	    var messages = 0;
	    var data = player.data;
	    var ctx = getContext();
	    var length = data.length;
	    //
	    queuedTime = 0.5;
	    // /
	    // var interval = eventQueue[0] && eventQueue[0].interval || 0
	    var foffset = currentTime - player.currentTime;
	    // /
	    if (_root2.default.api !== 'webaudio') {
	      // set currentTime on ctx
	      var now = getNow();
	      __now = __now || now;
	      ctx.currentTime = (now - __now) / 1000;
	    }
	    // /
	    startTime = ctx.currentTime;
	    // /
	    for (var n = 0; n < length && messages < 100; n++) {
	      var obj = data[n];
	      if ((queuedTime += obj[1]) <= currentTime) {
	        offset = queuedTime;
	        continue;
	      }
	      // /
	      currentTime = queuedTime - offset;
	      // /
	      var event = obj[0].event;
	      if (event.type !== 'channel') {
	        continue;
	      }
	      // /
	      var channelId = event.channel;
	      var channel = _root2.default.channels[channelId];
	      var delay = ctx.currentTime + (currentTime + foffset + player.startDelay) / 1000;
	      var queueTime = queuedTime - offset + player.startDelay;
	      switch (event.subtype) {
	        case 'controller':
	          _root2.default.setController(channelId, event.controllerType, event.value, delay);
	          break;
	        case 'programChange':
	          _root2.default.programChange(channelId, event.programNumber, delay);
	          break;
	        case 'pitchBend':
	          _root2.default.pitchBend(channelId, event.value, delay);
	          break;
	        case 'noteOn':
	          if (channel.mute) break;
	          note = event.noteNumber - (player.MIDIOffset || 0);
	          eventQueue.push({
	            event: event,
	            time: queueTime,
	            source: _root2.default.noteOn(channelId, event.noteNumber, event.velocity, delay),
	            interval: scheduleTracking(channelId, note, queuedTime + player.startDelay, offset - foffset, 144, event.velocity)
	          });
	          messages++;
	          break;
	        case 'noteOff':
	          if (channel.mute) break;
	          note = event.noteNumber - (player.MIDIOffset || 0);
	          eventQueue.push({
	            event: event,
	            time: queueTime,
	            source: _root2.default.noteOff(channelId, event.noteNumber, delay),
	            interval: scheduleTracking(channelId, note, queuedTime, offset - foffset, 128, 0)
	          });
	          break;
	        default:
	          break;
	      }
	    }
	    // /
	    onsuccess && onsuccess(eventQueue);
	  };
	
	  var stopAudio = function stopAudio() {
	    var ctx = getContext();
	    player.playing = false;
	    player.restart += (ctx.currentTime - startTime) * 1000;
	    // stop the audio, and intervals
	    while (eventQueue.length) {
	      var o = eventQueue.pop();
	      window.clearInterval(o.interval);
	      if (!o.source) continue; // is not webaudio
	      if (typeof o.source === 'number') {
	        window.clearTimeout(o.source);
	      } else {
	        // webaudio
	        o.source.disconnect(0);
	      }
	    }
	    // run callback to cancel any notes still playing
	    for (var key in noteRegistrar) {
	      var _o = noteRegistrar[key];
	      if (noteRegistrar[key].message === 144 && onMidiEvent) {
	        onMidiEvent({
	          channel: _o.channel,
	          note: _o.note,
	          now: _o.now,
	          end: _o.end,
	          message: 128,
	          velocity: _o.velocity
	        });
	      }
	    }
	    // reset noteRegistrar
	    noteRegistrar = {};
	  };
	})();

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _midifile = __webpack_require__(11);
	
	Object.keys(_midifile).forEach(function (key) {
	  if (key === "default" || key === "__esModule") return;
	  Object.defineProperty(exports, key, {
	    enumerable: true,
	    get: function get() {
	      return _midifile[key];
	    }
	  });
	});
	
	var _replayer = __webpack_require__(13);
	
	Object.keys(_replayer).forEach(function (key) {
	  if (key === "default" || key === "__esModule") return;
	  Object.defineProperty(exports, key, {
	    enumerable: true,
	    get: function get() {
	      return _replayer[key];
	    }
	  });
	});

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.MidiFile = MidiFile;
	
	var _stream = __webpack_require__(12);
	
	var _stream2 = _interopRequireDefault(_stream);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function MidiFile(data) {
	  var lastEventTypeByte;
	
	  function readChunk(stream) {
	    var id = stream.read(4);
	    var length = stream.readInt32();
	    return {
	      'id': id,
	      'length': length,
	      'data': stream.read(length)
	    };
	  }
	
	  function readEvent(stream) {
	    var event = {};
	    event.deltaTime = stream.readVarInt();
	    var eventTypeByte = stream.readInt8();
	    if ((eventTypeByte & 0xf0) === 0xf0) {
	      /* system / meta event */
	      if (eventTypeByte === 0xff) {
	        /* meta event */
	        event.type = 'meta';
	        var subtypeByte = stream.readInt8();
	        var length = stream.readVarInt();
	        switch (subtypeByte) {
	          case 0x00:
	            event.subtype = 'sequenceNumber';
	            if (length !== 2) throw new Error('Expected length for sequenceNumber event is 2, got ' + length);
	            event.number = stream.readInt16();
	            return event;
	          case 0x01:
	            event.subtype = 'text';
	            event.text = stream.read(length);
	            return event;
	          case 0x02:
	            event.subtype = 'copyrightNotice';
	            event.text = stream.read(length);
	            return event;
	          case 0x03:
	            event.subtype = 'trackName';
	            event.text = stream.read(length);
	            return event;
	          case 0x04:
	            event.subtype = 'instrumentName';
	            event.text = stream.read(length);
	            return event;
	          case 0x05:
	            event.subtype = 'lyrics';
	            event.text = stream.read(length);
	            return event;
	          case 0x06:
	            event.subtype = 'marker';
	            event.text = stream.read(length);
	            return event;
	          case 0x07:
	            event.subtype = 'cuePoint';
	            event.text = stream.read(length);
	            return event;
	          case 0x20:
	            event.subtype = 'midiChannelPrefix';
	            if (length !== 1) throw new Error('Expected length for midiChannelPrefix event is 1, got ' + length);
	            event.channel = stream.readInt8();
	            return event;
	          case 0x2f:
	            event.subtype = 'endOfTrack';
	            if (length !== 0) throw new Error('Expected length for endOfTrack event is 0, got ' + length);
	            return event;
	          case 0x51:
	            event.subtype = 'setTempo';
	            if (length !== 3) throw new Error('Expected length for setTempo event is 3, got ' + length);
	            event.microsecondsPerBeat = (stream.readInt8() << 16) + (stream.readInt8() << 8) + stream.readInt8();
	            return event;
	          case 0x54:
	            event.subtype = 'smpteOffset';
	            if (length !== 5) throw new Error('Expected length for smpteOffset event is 5, got ' + length);
	            var hourByte = stream.readInt8();
	            event.frameRate = {
	              0x00: 24, 0x20: 25, 0x40: 29, 0x60: 30
	            }[hourByte & 0x60];
	            event.hour = hourByte & 0x1f;
	            event.min = stream.readInt8();
	            event.sec = stream.readInt8();
	            event.frame = stream.readInt8();
	            event.subframe = stream.readInt8();
	            return event;
	          case 0x58:
	            event.subtype = 'timeSignature';
	            if (length !== 4) throw new Error('Expected length for timeSignature event is 4, got ' + length);
	            event.numerator = stream.readInt8();
	            event.denominator = Math.pow(2, stream.readInt8());
	            event.metronome = stream.readInt8();
	            event.thirtyseconds = stream.readInt8();
	            return event;
	          case 0x59:
	            event.subtype = 'keySignature';
	            if (length !== 2) throw new Error('Expected length for keySignature event is 2, got ' + length);
	            event.key = stream.readInt8(true);
	            event.scale = stream.readInt8();
	            return event;
	          case 0x7f:
	            event.subtype = 'sequencerSpecific';
	            event.data = stream.read(length);
	            return event;
	          default:
	            // console.log("Unrecognised meta event subtype: " + subtypeByte)
	            event.subtype = 'unknown';
	            event.data = stream.read(length);
	            return event;
	        }
	        // event.data = stream.read(length)
	        // return event
	      } else if (eventTypeByte === 0xf0) {
	        event.type = 'sysEx';
	        var _length = stream.readVarInt();
	        event.data = stream.read(_length);
	        return event;
	      } else if (eventTypeByte === 0xf7) {
	        event.type = 'dividedSysEx';
	        var _length2 = stream.readVarInt();
	        event.data = stream.read(_length2);
	        return event;
	      } else {
	        throw new Error('Unrecognised MIDI event type byte: ' + eventTypeByte);
	      }
	    } else {
	      /* channel event */
	      var param1;
	      if ((eventTypeByte & 0x80) === 0) {
	        /* running status - reuse lastEventTypeByte as the event type.
	          eventTypeByte is actually the first parameter
	        */
	        param1 = eventTypeByte;
	        eventTypeByte = lastEventTypeByte;
	      } else {
	        param1 = stream.readInt8();
	        lastEventTypeByte = eventTypeByte;
	      }
	      var eventType = eventTypeByte >> 4;
	      event.channel = eventTypeByte & 0x0f;
	      event.type = 'channel';
	      switch (eventType) {
	        case 0x08:
	          event.subtype = 'noteOff';
	          event.noteNumber = param1;
	          event.velocity = stream.readInt8();
	          return event;
	        case 0x09:
	          event.noteNumber = param1;
	          event.velocity = stream.readInt8();
	          if (event.velocity === 0) {
	            event.subtype = 'noteOff';
	          } else {
	            event.subtype = 'noteOn';
	          }
	          return event;
	        case 0x0a:
	          event.subtype = 'noteAftertouch';
	          event.noteNumber = param1;
	          event.amount = stream.readInt8();
	          return event;
	        case 0x0b:
	          event.subtype = 'controller';
	          event.controllerType = param1;
	          event.value = stream.readInt8();
	          return event;
	        case 0x0c:
	          event.subtype = 'programChange';
	          event.programNumber = param1;
	          return event;
	        case 0x0d:
	          event.subtype = 'channelAftertouch';
	          event.amount = param1;
	          return event;
	        case 0x0e:
	          event.subtype = 'pitchBend';
	          event.value = param1 + (stream.readInt8() << 7);
	          return event;
	        default:
	          throw new Error('Unrecognised MIDI event type: ' + eventType);
	        /*
	        console.log("Unrecognised MIDI event type: " + eventType)
	        stream.readInt8()
	        event.subtype = 'unknown'
	        return event
	        */
	      }
	    }
	  }
	
	  var stream = (0, _stream2.default)(data);
	  var headerChunk = readChunk(stream);
	  if (headerChunk.id !== 'MThd' || headerChunk.length !== 6) {
	    throw new Error('Bad .mid file - header not found');
	  }
	  var headerStream = (0, _stream2.default)(headerChunk.data);
	  var formatType = headerStream.readInt16();
	  var trackCount = headerStream.readInt16();
	  var timeDivision = headerStream.readInt16();
	  var ticksPerBeat;
	
	  if (timeDivision & 0x8000) {
	    throw new Error('Expressing time division in SMTPE frames is not supported yet');
	  } else {
	    ticksPerBeat = timeDivision;
	  }
	
	  var header = {
	    'formatType': formatType,
	    'trackCount': trackCount,
	    'ticksPerBeat': ticksPerBeat
	  };
	  var tracks = [];
	  for (var i = 0; i < header.trackCount; i++) {
	    tracks[i] = [];
	    var trackChunk = readChunk(stream);
	    if (trackChunk.id !== 'MTrk') {
	      throw new Error('Unexpected chunk - expected MTrk, got ' + trackChunk.id);
	    }
	    var trackStream = (0, _stream2.default)(trackChunk.data);
	    while (!trackStream.eof()) {
	      var event = readEvent(trackStream);
	      tracks[i].push(event);
	      // console.log(event)
	    }
	  }
	
	  return {
	    'header': header,
	    'tracks': tracks
	  };
	} /**
	   * class to parse the .mid file format
	   * (depends on _stream.js)
	   */

/***/ },
/* 12 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	exports.default = function (str) {
	  var position = 0;
	
	  function read(length) {
	    var result = str.substr(position, length);
	    position += length;
	    return result;
	  }
	
	  /* read a big-endian 32-bit integer */
	  function readInt32() {
	    var result = (str.charCodeAt(position) << 24) + (str.charCodeAt(position + 1) << 16) + (str.charCodeAt(position + 2) << 8) + str.charCodeAt(position + 3);
	    position += 4;
	    return result;
	  }
	
	  /* read a big-endian 16-bit integer */
	  function readInt16() {
	    var result = (str.charCodeAt(position) << 8) + str.charCodeAt(position + 1);
	    position += 2;
	    return result;
	  }
	
	  /* read an 8-bit integer */
	  function readInt8(signed) {
	    var result = str.charCodeAt(position);
	    if (signed && result > 127) result -= 256;
	    position += 1;
	    return result;
	  }
	
	  function eof() {
	    return position >= str.length;
	  }
	
	  /* read a MIDI-style variable-length integer
	    (big-endian value in groups of 7 bits,
	    with top bit set to signify that another byte follows)
	  */
	  function readVarInt() {
	    var result = 0;
	    while (true) {
	      var b = readInt8();
	      if (b & 0x80) {
	        result += b & 0x7f;
	        result <<= 7;
	      } else {
	        /* b is the last byte */
	        return result + b;
	      }
	    }
	  }
	
	  return {
	    'eof': eof,
	    'read': read,
	    'readInt32': readInt32,
	    'readInt16': readInt16,
	    'readInt8': readInt8,
	    'readVarInt': readVarInt
	  };
	};
	
	module.exports = exports['default']; /* Wrapper for accessing strings through sequential reads */

/***/ },
/* 13 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	exports.Replayer = Replayer;
	var clone = function clone(o) {
	  if ((typeof o === 'undefined' ? 'undefined' : _typeof(o)) !== 'object') return o;
	  if (o === null) return o;
	  var ret = typeof o.length === 'number' ? [] : {};
	  for (var key in o) {
	    ret[key] = clone(o[key]);
	  }return ret;
	};
	
	function Replayer(midiFile, timeWarp, eventProcessor, bpm) {
	  var trackStates = [];
	  var beatsPerMinute = bpm || 120;
	  var bpmOverride = !!bpm;
	  var ticksPerBeat = midiFile.header.ticksPerBeat;
	
	  for (var i = 0; i < midiFile.tracks.length; i++) {
	    trackStates[i] = {
	      'nextEventIndex': 0,
	      'ticksToNextEvent': midiFile.tracks[i].length ? midiFile.tracks[i][0].deltaTime : null
	    };
	  }
	
	  function getNextEvent() {
	    var ticksToNextEvent = null;
	    var nextEventTrack = null;
	    var nextEventIndex = null;
	
	    for (var _i = 0; _i < trackStates.length; _i++) {
	      if (trackStates[_i].ticksToNextEvent != null && (ticksToNextEvent == null || trackStates[_i].ticksToNextEvent < ticksToNextEvent)) {
	        ticksToNextEvent = trackStates[_i].ticksToNextEvent;
	        nextEventTrack = _i;
	        nextEventIndex = trackStates[_i].nextEventIndex;
	      }
	    }
	    if (nextEventTrack != null) {
	      /* consume event from that track */
	      var nextEvent = midiFile.tracks[nextEventTrack][nextEventIndex];
	      if (midiFile.tracks[nextEventTrack][nextEventIndex + 1]) {
	        trackStates[nextEventTrack].ticksToNextEvent += midiFile.tracks[nextEventTrack][nextEventIndex + 1].deltaTime;
	      } else {
	        trackStates[nextEventTrack].ticksToNextEvent = null;
	      }
	      trackStates[nextEventTrack].nextEventIndex += 1;
	      /* advance timings on all tracks by ticksToNextEvent */
	      for (var _i2 = 0; _i2 < trackStates.length; _i2++) {
	        if (trackStates[_i2].ticksToNextEvent != null) {
	          trackStates[_i2].ticksToNextEvent -= ticksToNextEvent;
	        }
	      }
	      return {
	        'ticksToEvent': ticksToNextEvent,
	        'event': nextEvent,
	        'track': nextEventTrack
	      };
	    } else {
	      return null;
	    }
	  }
	  //
	  var midiEvent;
	  var temporal = [];
	  ~function processEvents() {
	    function processNext() {
	      if (!bpmOverride && midiEvent.event.type === 'meta' && midiEvent.event.subtype === 'setTempo') {
	        // tempo change events can occur anywhere in the middle and affect events that follow
	        beatsPerMinute = 60000000 / midiEvent.event.microsecondsPerBeat;
	      }
	      // /
	      var beatsToGenerate = 0;
	      var secondsToGenerate = 0;
	      if (midiEvent.ticksToEvent > 0) {
	        beatsToGenerate = midiEvent.ticksToEvent / ticksPerBeat;
	        secondsToGenerate = beatsToGenerate / (beatsPerMinute / 60);
	      }
	      // /
	      var time = secondsToGenerate * 1000 * timeWarp || 0;
	      temporal.push([midiEvent, time]);
	      midiEvent = getNextEvent();
	    }
	    // /
	    midiEvent = getNextEvent();
	    if (midiEvent) {
	      while (midiEvent) {
	        processNext(true);
	      }
	    }
	  }();
	
	  return {
	    getData: function getData() {
	      return clone(temporal);
	    }
	  };
	}

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	__webpack_require__(15);
	
	__webpack_require__(16);
	
	__webpack_require__(17);

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _root = __webpack_require__(2);
	
	var _root2 = _interopRequireDefault(_root);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	window.Audio && function () {
	  var midi = _root2.default.AudioTag = { api: 'audiotag' };
	  var noteToKey = {};
	  var volume = 127; // floating point
	  var bufferNid = -1; // current channel
	  var audioBuffers = []; // the audio channels
	  var notesOn = []; // instrumentId + noteId that is currently playing in each 'channel', for routing noteOff/chordOff calls
	  var notes = {}; // the piano keys
	  for (var nid = 0; nid < 12; nid++) {
	    audioBuffers[nid] = new window.Audio();
	  }
	
	  var playChannel = function playChannel(channel, note) {
	    if (!_root2.default.channels[channel]) return;
	    var instrument = _root2.default.channels[channel].instrument;
	    var instrumentId = _root2.default.GM.byId[instrument].id;
	    note = notes[note];
	    if (note) {
	      var instrumentNoteId = instrumentId + '' + note.id;
	      var nid = (bufferNid + 1) % audioBuffers.length;
	      var audio = audioBuffers[nid];
	      notesOn[nid] = instrumentNoteId;
	      if (!_root2.default.Soundfont[instrumentId]) {
	        if (_root2.default.DEBUG) {
	          console.log('404', instrumentId);
	        }
	        return;
	      }
	      audio.src = _root2.default.Soundfont[instrumentId][note.id];
	      audio.volume = volume / 127;
	      audio.play();
	      bufferNid = nid;
	    }
	  };
	
	  var stopChannel = function stopChannel(channel, note) {
	    if (!_root2.default.channels[channel]) return;
	    var instrument = _root2.default.channels[channel].instrument;
	    var instrumentId = _root2.default.GM.byId[instrument].id;
	    note = notes[note];
	    if (note) {
	      var instrumentNoteId = instrumentId + '' + note.id;
	      for (var i = 0, len = audioBuffers.length; i < len; i++) {
	        var nid = (i + bufferNid + 1) % len;
	        var cId = notesOn[nid];
	        if (cId && cId === instrumentNoteId) {
	          audioBuffers[nid].pause();
	          notesOn[nid] = null;
	          return;
	        }
	      }
	    }
	  };
	
	  midi.audioBuffers = audioBuffers;
	  midi.send = function (data, delay) {};
	  midi.setController = function (channel, type, value, delay) {};
	  midi.setVolume = function (channel, n) {
	    volume = n; // - should be channel specific volume
	  };
	
	  midi.programChange = function (channel, program) {
	    _root2.default.channels[channel].instrument = program;
	  };
	
	  midi.pitchBend = function (channel, program, delay) {};
	
	  midi.noteOn = function (channel, note, velocity, delay) {
	    var id = noteToKey[note];
	    if (!notes[id]) return;
	    if (delay) {
	      return setTimeout(function () {
	        playChannel(channel, id);
	      }, delay * 1000);
	    } else {
	      playChannel(channel, id);
	    }
	  };
	
	  midi.noteOff = function (channel, note, delay) {
	    //      var id = noteToKey[note]
	    //      if (!notes[id]) return
	    //      if (delay) {
	    //        return setTimeout(function() {
	    //          stopChannel(channel, id)
	    //        }, delay * 1000)
	    //      } else {
	    //        stopChannel(channel, id)
	    //      }
	  };
	
	  midi.chordOn = function (channel, chord, velocity, delay) {
	    for (var idx = 0; idx < chord.length; idx++) {
	      var n = chord[idx];
	      var id = noteToKey[n];
	      if (!notes[id]) continue;
	      if (delay) {
	        return setTimeout(function () {
	          playChannel(channel, id);
	        }, delay * 1000);
	      } else {
	        playChannel(channel, id);
	      }
	    }
	  };
	
	  midi.chordOff = function (channel, chord, delay) {
	    for (var idx = 0; idx < chord.length; idx++) {
	      var n = chord[idx];
	      var id = noteToKey[n];
	      if (!notes[id]) continue;
	      if (delay) {
	        return setTimeout(function () {
	          stopChannel(channel, id);
	        }, delay * 1000);
	      } else {
	        stopChannel(channel, id);
	      }
	    }
	  };
	
	  midi.stopAllNotes = function () {
	    for (var nid = 0, length = audioBuffers.length; nid < length; nid++) {
	      audioBuffers[nid].pause();
	    }
	  };
	
	  midi.connect = function (opts) {
	    _root2.default.setDefaultPlugin(midi);
	    // /
	    for (var key in _root2.default.keyToNote) {
	      noteToKey[_root2.default.keyToNote[key]] = key;
	      notes[key] = { id: key };
	    }
	    // /
	    opts.onsuccess && opts.onsuccess();
	  };
	}(); /*
	       ----------------------------------------------------------------------
	       AudioTag <audio> - OGG or MPEG Soundbank
	       ----------------------------------------------------------------------
	       http://dev.w3.org/html5/spec/Overview.html#the-audio-element
	       ----------------------------------------------------------------------
	     */

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _root = __webpack_require__(2);
	
	var _root2 = _interopRequireDefault(_root);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	// REF: http://stackoverflow.com/questions/21797299/convert-base64-string-to-arraybuffer
	function base64ToArrayBuffer(base64) {
	  var binaryString = window.atob(base64);
	  var len = binaryString.length;
	  var bytes = new Uint8Array(len);
	  for (var i = 0; i < len; i++) {
	    bytes[i] = binaryString.charCodeAt(i);
	  }
	  return bytes.buffer;
	} /*
	    ----------------------------------------------------------
	    Web Audio API - OGG or MPEG Soundbank
	    ----------------------------------------------------------
	    http://webaudio.github.io/web-audio-api/
	    ----------------------------------------------------------
	  */
	
	
	window.AudioContext && function () {
	  // var audioContext = null // new AudioContext()
	  var useStreamingBuffer = false; // !!audioContext.createMediaElementSource
	  var midi = _root2.default.WebAudio = { api: 'webaudio' };
	  var ctx; // audio context
	  var sources = {};
	  var effects = {};
	  var masterVolume = 127;
	  var audioBuffers = {};
	  // /
	  midi.audioBuffers = audioBuffers;
	  midi.send = function (data, delay) {};
	  midi.setController = function (channelId, type, value, delay) {};
	
	  midi.setVolume = function (channelId, volume, delay) {
	    if (delay) {
	      setTimeout(function () {
	        masterVolume = volume;
	      }, delay * 1000);
	    } else {
	      masterVolume = volume;
	    }
	  };
	
	  midi.programChange = function (channelId, program, delay) {
	    //      if (delay) {
	    //        return setTimeout(function() {
	    //          var channel = root.channels[channelId]
	    //          channel.instrument = program
	    //        }, delay)
	    //      } else {
	    var channel = _root2.default.channels[channelId];
	    channel.instrument = program;
	    //      }
	  };
	
	  midi.pitchBend = function (channelId, program, delay) {
	    //      if (delay) {
	    //        setTimeout(function() {
	    //          var channel = root.channels[channelId]
	    //          channel.pitchBend = program
	    //        }, delay)
	    //      } else {
	    var channel = _root2.default.channels[channelId];
	    channel.pitchBend = program;
	    //      }
	  };
	
	  midi.noteOn = function (channelId, noteId, velocity, delay) {
	    delay = delay || 0;
	
	    // / check whether the note exists
	    var channel = _root2.default.channels[channelId];
	    var instrument = channel.instrument;
	    var bufferId = instrument + '' + noteId;
	    var buffer = audioBuffers[bufferId];
	    if (!buffer) {
	      //        console.log(midi.GM.byId[instrument].id, instrument, channelId)
	      return;
	    }
	
	    // / convert relative delay to absolute delay
	    if (delay < ctx.currentTime) {
	      delay += ctx.currentTime;
	    }
	
	    // / create audio buffer
	    var source;
	    if (useStreamingBuffer) {
	      source = ctx.createMediaElementSource(buffer);
	    } else {
	      // XMLHTTP buffer
	      source = ctx.createBufferSource();
	      source.buffer = buffer;
	    }
	
	    // / add effects to buffer
	    if (effects) {
	      var chain = source;
	      for (var key in effects) {
	        chain.connect(effects[key].input);
	        chain = effects[key];
	      }
	    }
	
	    // / add gain + pitchShift
	    var gain = velocity / 127 * (masterVolume / 127) * 2 - 1;
	    source.connect(ctx.destination);
	    source.playbackRate.value = 1; // pitch shift
	    source.gainNode = ctx.createGain(); // gain
	    source.gainNode.connect(ctx.destination);
	    source.gainNode.gain.value = Math.min(1.0, Math.max(-1.0, gain));
	    source.connect(source.gainNode);
	    // /
	    if (useStreamingBuffer) {
	      if (delay) {
	        return setTimeout(function () {
	          buffer.currentTime = 0;
	          buffer.play();
	        }, delay * 1000);
	      } else {
	        buffer.currentTime = 0;
	        buffer.play();
	      }
	    } else {
	      source.start(delay || 0);
	    }
	    // /
	    sources[channelId + '' + noteId] = source;
	    // /
	    return source;
	  };
	
	  midi.noteOff = function (channelId, noteId, delay) {
	    delay = delay || 0;
	
	    // / check whether the note exists
	    var channel = _root2.default.channels[channelId];
	    var instrument = channel.instrument;
	    var bufferId = instrument + '' + noteId;
	    var buffer = audioBuffers[bufferId];
	    if (buffer) {
	      if (delay < ctx.currentTime) {
	        delay += ctx.currentTime;
	      }
	      // /
	      var source = sources[channelId + '' + noteId];
	      if (source) {
	        if (source.gainNode) {
	          // @Miranet: 'the values of 0.2 and 0.3 could of course be used as
	          // a 'release' parameter for ADSR like time settings.'
	          // add { 'metadata': { release: 0.3 } } to soundfont files
	          var gain = source.gainNode.gain;
	          gain.linearRampToValueAtTime(gain.value, delay);
	          gain.linearRampToValueAtTime(-1.0, delay + 0.3);
	        }
	        // /
	        if (useStreamingBuffer) {
	          if (delay) {
	            setTimeout(function () {
	              buffer.pause();
	            }, delay * 1000);
	          } else {
	            buffer.pause();
	          }
	        } else {
	          if (source.noteOff) {
	            source.noteOff(delay + 0.5);
	          } else {
	            source.stop(delay + 0.5);
	          }
	        }
	        // /
	        delete sources[channelId + '' + noteId];
	        // /
	        return source;
	      }
	    }
	  };
	
	  midi.chordOn = function (channel, chord, velocity, delay) {
	    var res = {};
	    for (var n = 0, note, len = chord.length; n < len; n++) {
	      res[note = chord[n]] = midi.noteOn(channel, note, velocity, delay);
	    }
	    return res;
	  };
	
	  midi.chordOff = function (channel, chord, delay) {
	    var res = {};
	    for (var n = 0, note, len = chord.length; n < len; n++) {
	      res[note = chord[n]] = midi.noteOff(channel, note, delay);
	    }
	    return res;
	  };
	
	  midi.stopAllNotes = function () {
	    for (var sid in sources) {
	      var delay = 0;
	      if (delay < ctx.currentTime) {
	        delay += ctx.currentTime;
	      }
	      var source = sources[sid];
	      source.gain.linearRampToValueAtTime(1, delay);
	      source.gain.linearRampToValueAtTime(0, delay + 0.3);
	      if (source.noteOff) {
	        // old api
	        source.noteOff(delay + 0.3);
	      } else {
	        // new api
	        source.stop(delay + 0.3);
	      }
	      delete sources[sid];
	    }
	  };
	
	  midi.setEffects = function (list) {
	    if (ctx.tunajs) {
	      for (var n = 0; n < list.length; n++) {
	        var data = list[n];
	        var effect = new ctx.tunajs[data.type](data);
	        effect.connect(ctx.destination);
	        effects[data.type] = effect;
	      }
	    } else {
	      return console.log('Effects module not installed.');
	    }
	  };
	
	  midi.connect = function (opts) {
	    _root2.default.setDefaultPlugin(midi);
	    midi.setContext(ctx || createAudioContext(), opts.onsuccess);
	  };
	
	  midi.getContext = function () {
	    return ctx;
	  };
	
	  midi.setContext = function (newCtx, onload, onprogress, onerror) {
	    ctx = newCtx;
	
	    // / tuna.js effects module - https://github.com/Dinahmoe/tuna
	    if (typeof window.Tuna !== 'undefined' && !ctx.tunajs) {
	      ctx.tunajs = new window.Tuna(ctx);
	    }
	
	    // / loading audio files
	    var urls = [];
	    var notes = _root2.default.keyToNote;
	    for (var key in notes) {
	      urls.push(key);
	    } // /
	    var waitForEnd = function waitForEnd(instrument) {
	      for (var _key in bufferPending) {
	        // has pending items
	        if (bufferPending[_key]) return;
	      }
	      // /
	      if (onload) {
	        // run onload once
	        onload();
	        onload = null;
	      }
	    };
	    // /
	    var requestAudio = function requestAudio(soundfont, instrumentId, index, key) {
	      var url = soundfont[key];
	      if (url) {
	        bufferPending[instrumentId]++;
	        loadAudio(url, function (buffer) {
	          buffer.id = key;
	          var noteId = _root2.default.keyToNote[key];
	          audioBuffers[instrumentId + '' + noteId] = buffer;
	          // /
	          if (--bufferPending[instrumentId] === 0) {
	            // var percent = index / 87
	            //              console.log(midi.GM.byId[instrumentId], 'processing: ', percent)
	            soundfont.isLoaded = true;
	            waitForEnd(instrument);
	          }
	        }, function (err) {
	          console.error(err);
	        });
	      }
	    };
	    // /
	    var bufferPending = {};
	    for (var instrument in _root2.default.Soundfont) {
	      var soundfont = _root2.default.Soundfont[instrument];
	      if (soundfont.isLoaded) {
	        continue;
	      }
	      // /
	      var synth = _root2.default.GM.byName[instrument];
	      var instrumentId = synth.number;
	      // /
	      bufferPending[instrumentId] = 0;
	      // /
	      for (var index = 0; index < urls.length; index++) {
	        var _key2 = urls[index];
	        requestAudio(soundfont, instrumentId, index, _key2);
	      }
	    }
	    // /
	    setTimeout(waitForEnd, 1);
	  };
	
	  /* Load audio file: streaming | base64 | arraybuffer
	  ---------------------------------------------------------------------- */
	  function loadAudio(url, onload, onerror) {
	    if (useStreamingBuffer) {
	      var audio = new window.Audio();
	      audio.src = url;
	      audio.controls = false;
	      audio.autoplay = false;
	      audio.preload = false;
	      audio.addEventListener('canplay', function () {
	        onload && onload(audio);
	      });
	      audio.addEventListener('error', function (err) {
	        onerror && onerror(err);
	      });
	      document.body.appendChild(audio);
	    } else if (url.indexOf('data:audio') === 0) {
	      // Base64 string
	      var base64 = url.split(',')[1];
	      var buffer = base64ToArrayBuffer(base64);
	      ctx.decodeAudioData(buffer, onload, onerror);
	    } else {
	      // XMLHTTP buffer
	      var request = new window.XMLHttpRequest();
	      request.open('GET', url, true);
	      request.responseType = 'arraybuffer';
	      request.onload = function () {
	        ctx.decodeAudioData(request.response, onload, onerror);
	      };
	      request.send();
	    }
	  }
	
	  function createAudioContext() {
	    return new (window.AudioContext || window.webkitAudioContext)();
	  }
	}();

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _root = __webpack_require__(2);
	
	var _root2 = _interopRequireDefault(_root);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	(function () {
	  var plugin = null;
	  var output = null;
	  var midi = _root2.default.WebMIDI = { api: 'webmidi' };
	  midi.send = function (data, delay) {
	    // set channel volume
	    output.send(data, delay * 1000);
	  };
	
	  midi.setController = function (channel, type, value, delay) {
	    output.send([channel, type, value], delay * 1000);
	  };
	
	  midi.setVolume = function (channel, volume, delay) {
	    // set channel volume
	    output.send([0xB0 + channel, 0x07, volume], delay * 1000);
	  };
	
	  midi.programChange = function (channel, program, delay) {
	    // change patch (instrument)
	    output.send([0xC0 + channel, program], delay * 1000);
	  };
	
	  midi.pitchBend = function (channel, program, delay) {
	    // pitch bend
	    output.send([0xE0 + channel, program], delay * 1000);
	  };
	
	  midi.noteOn = function (channel, note, velocity, delay) {
	    output.send([0x90 + channel, note, velocity], delay * 1000);
	  };
	
	  midi.noteOff = function (channel, note, delay) {
	    output.send([0x80 + channel, note, 0], delay * 1000);
	  };
	
	  midi.chordOn = function (channel, chord, velocity, delay) {
	    for (var n = 0; n < chord.length; n++) {
	      var note = chord[n];
	      output.send([0x90 + channel, note, velocity], delay * 1000);
	    }
	  };
	
	  midi.chordOff = function (channel, chord, delay) {
	    for (var n = 0; n < chord.length; n++) {
	      var note = chord[n];
	      output.send([0x80 + channel, note, 0], delay * 1000);
	    }
	  };
	
	  midi.stopAllNotes = function () {
	    output.cancel();
	    for (var channel = 0; channel < 16; channel++) {
	      output.send([0xB0 + channel, 0x7B, 0]);
	    }
	  };
	
	  midi.connect = function (opts) {
	    _root2.default.setDefaultPlugin(midi);
	    var errFunction = function errFunction(err) {
	      // well at least we tried!
	      if (window.AudioContext) {
	        // Chrome
	        opts.api = 'webaudio';
	      } else if (window.Audio) {
	        // Firefox
	        opts.api = 'audiotag';
	      } else {
	        // no support
	        return err;
	      }
	      _root2.default.loadPlugin(opts);
	    };
	    // /
	    navigator.requestMIDIAccess().then(function (access) {
	      plugin = access;
	      var pluginOutputs = plugin.outputs;
	      if (typeof pluginOutputs === 'function') {
	        // Chrome pre-43
	        output = pluginOutputs()[0];
	      } else {
	        // Chrome post-43
	        output = pluginOutputs[0];
	      }
	      if (output === undefined) {
	        // nothing there...
	        errFunction();
	      } else {
	        opts.onsuccess && opts.onsuccess();
	      }
	    }, errFunction);
	  };
	})(); /*
	        ----------------------------------------------------------------------
	        Web MIDI API - Native Soundbanks
	        ----------------------------------------------------------------------
	        http://webaudio.github.io/web-midi-api/
	        ----------------------------------------------------------------------
	      */

/***/ }
/******/ ])
});
;

},{}],22:[function(require,module,exports){
!function(t,n){"object"==typeof exports&&"undefined"!=typeof module?n(exports):"function"==typeof define&&define.amd?define(["exports"],n):n(t.NoteParser=t.NoteParser||{})}(this,function(t){"use strict";function n(t,n){return Array(n+1).join(t)}function r(t){return"number"==typeof t}function e(t){return"string"==typeof t}function u(t){return void 0!==t}function c(t,n){return Math.pow(2,(t-69)/12)*(n||440)}function o(){return b}function i(t,n,r){if("string"!=typeof t)return null;var e=b.exec(t);if(!e||!n&&e[4])return null;var u={letter:e[1].toUpperCase(),acc:e[2].replace(/x/g,"##")};u.pc=u.letter+u.acc,u.step=(u.letter.charCodeAt(0)+3)%7,u.alt="b"===u.acc[0]?-u.acc.length:u.acc.length;var o=A[u.step]+u.alt;return u.chroma=o<0?12+o:o%12,e[3]&&(u.oct=+e[3],u.midi=o+12*(u.oct+1),u.freq=c(u.midi,r)),n&&(u.tonicOf=e[4]),u}function f(t){return r(t)?t<0?n("b",-t):n("#",t):""}function a(t){return r(t)?""+t:""}function l(t,n,r){return null===t||void 0===t?null:t.step?l(t.step,t.alt,t.oct):t<0||t>6?null:C.charAt(t)+f(n)+a(r)}function p(t){if((r(t)||e(t))&&t>=0&&t<128)return+t;var n=i(t);return n&&u(n.midi)?n.midi:null}function s(t,n){var r=p(t);return null===r?null:c(r,n)}function d(t){return(i(t)||{}).letter}function m(t){return(i(t)||{}).acc}function h(t){return(i(t)||{}).pc}function v(t){return(i(t)||{}).step}function g(t){return(i(t)||{}).alt}function x(t){return(i(t)||{}).chroma}function y(t){return(i(t)||{}).oct}var b=/^([a-gA-G])(#{1,}|b{1,}|x{1,}|)(-?\d*)\s*(.*)\s*$/,A=[0,2,4,5,7,9,11],C="CDEFGAB";t.regex=o,t.parse=i,t.build=l,t.midi=p,t.freq=s,t.letter=d,t.acc=m,t.pc=h,t.step=v,t.alt=g,t.chroma=x,t.oct=y});


},{}],23:[function(require,module,exports){
(function (Buffer){
/**
 * https://opentype.js.org v0.7.1 | (c) Frederik De Bleser and other contributors | MIT License | Uses tiny-inflate by Devon Govett
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.opentype = global.opentype || {})));
}(this, (function (exports) { 'use strict';

var TINF_OK = 0;
var TINF_DATA_ERROR = -3;

function Tree() {
  this.table = new Uint16Array(16);   /* table of code length counts */
  this.trans = new Uint16Array(288);  /* code -> symbol translation table */
}

function Data(source, dest) {
  this.source = source;
  this.sourceIndex = 0;
  this.tag = 0;
  this.bitcount = 0;
  
  this.dest = dest;
  this.destLen = 0;
  
  this.ltree = new Tree();  /* dynamic length/symbol tree */
  this.dtree = new Tree();  /* dynamic distance tree */
}

/* --------------------------------------------------- *
 * -- uninitialized global data (static structures) -- *
 * --------------------------------------------------- */

var sltree = new Tree();
var sdtree = new Tree();

/* extra bits and base tables for length codes */
var length_bits = new Uint8Array(30);
var length_base = new Uint16Array(30);

/* extra bits and base tables for distance codes */
var dist_bits = new Uint8Array(30);
var dist_base = new Uint16Array(30);

/* special ordering of code length codes */
var clcidx = new Uint8Array([
  16, 17, 18, 0, 8, 7, 9, 6,
  10, 5, 11, 4, 12, 3, 13, 2,
  14, 1, 15
]);

/* used by tinf_decode_trees, avoids allocations every call */
var code_tree = new Tree();
var lengths = new Uint8Array(288 + 32);

/* ----------------------- *
 * -- utility functions -- *
 * ----------------------- */

/* build extra bits and base tables */
function tinf_build_bits_base(bits, base, delta, first) {
  var i, sum;

  /* build bits table */
  for (i = 0; i < delta; ++i) { bits[i] = 0; }
  for (i = 0; i < 30 - delta; ++i) { bits[i + delta] = i / delta | 0; }

  /* build base table */
  for (sum = first, i = 0; i < 30; ++i) {
    base[i] = sum;
    sum += 1 << bits[i];
  }
}

/* build the fixed huffman trees */
function tinf_build_fixed_trees(lt, dt) {
  var i;

  /* build fixed length tree */
  for (i = 0; i < 7; ++i) { lt.table[i] = 0; }

  lt.table[7] = 24;
  lt.table[8] = 152;
  lt.table[9] = 112;

  for (i = 0; i < 24; ++i) { lt.trans[i] = 256 + i; }
  for (i = 0; i < 144; ++i) { lt.trans[24 + i] = i; }
  for (i = 0; i < 8; ++i) { lt.trans[24 + 144 + i] = 280 + i; }
  for (i = 0; i < 112; ++i) { lt.trans[24 + 144 + 8 + i] = 144 + i; }

  /* build fixed distance tree */
  for (i = 0; i < 5; ++i) { dt.table[i] = 0; }

  dt.table[5] = 32;

  for (i = 0; i < 32; ++i) { dt.trans[i] = i; }
}

/* given an array of code lengths, build a tree */
var offs = new Uint16Array(16);

function tinf_build_tree(t, lengths, off, num) {
  var i, sum;

  /* clear code length count table */
  for (i = 0; i < 16; ++i) { t.table[i] = 0; }

  /* scan symbol lengths, and sum code length counts */
  for (i = 0; i < num; ++i) { t.table[lengths[off + i]]++; }

  t.table[0] = 0;

  /* compute offset table for distribution sort */
  for (sum = 0, i = 0; i < 16; ++i) {
    offs[i] = sum;
    sum += t.table[i];
  }

  /* create code->symbol translation table (symbols sorted by code) */
  for (i = 0; i < num; ++i) {
    if (lengths[off + i]) { t.trans[offs[lengths[off + i]]++] = i; }
  }
}

/* ---------------------- *
 * -- decode functions -- *
 * ---------------------- */

/* get one bit from source stream */
function tinf_getbit(d) {
  /* check if tag is empty */
  if (!d.bitcount--) {
    /* load next tag */
    d.tag = d.source[d.sourceIndex++];
    d.bitcount = 7;
  }

  /* shift bit out of tag */
  var bit = d.tag & 1;
  d.tag >>>= 1;

  return bit;
}

/* read a num bit value from a stream and add base */
function tinf_read_bits(d, num, base) {
  if (!num)
    { return base; }

  while (d.bitcount < 24) {
    d.tag |= d.source[d.sourceIndex++] << d.bitcount;
    d.bitcount += 8;
  }

  var val = d.tag & (0xffff >>> (16 - num));
  d.tag >>>= num;
  d.bitcount -= num;
  return val + base;
}

/* given a data stream and a tree, decode a symbol */
function tinf_decode_symbol(d, t) {
  while (d.bitcount < 24) {
    d.tag |= d.source[d.sourceIndex++] << d.bitcount;
    d.bitcount += 8;
  }
  
  var sum = 0, cur = 0, len = 0;
  var tag = d.tag;

  /* get more bits while code value is above sum */
  do {
    cur = 2 * cur + (tag & 1);
    tag >>>= 1;
    ++len;

    sum += t.table[len];
    cur -= t.table[len];
  } while (cur >= 0);
  
  d.tag = tag;
  d.bitcount -= len;

  return t.trans[sum + cur];
}

/* given a data stream, decode dynamic trees from it */
function tinf_decode_trees(d, lt, dt) {
  var hlit, hdist, hclen;
  var i, num, length;

  /* get 5 bits HLIT (257-286) */
  hlit = tinf_read_bits(d, 5, 257);

  /* get 5 bits HDIST (1-32) */
  hdist = tinf_read_bits(d, 5, 1);

  /* get 4 bits HCLEN (4-19) */
  hclen = tinf_read_bits(d, 4, 4);

  for (i = 0; i < 19; ++i) { lengths[i] = 0; }

  /* read code lengths for code length alphabet */
  for (i = 0; i < hclen; ++i) {
    /* get 3 bits code length (0-7) */
    var clen = tinf_read_bits(d, 3, 0);
    lengths[clcidx[i]] = clen;
  }

  /* build code length tree */
  tinf_build_tree(code_tree, lengths, 0, 19);

  /* decode code lengths for the dynamic trees */
  for (num = 0; num < hlit + hdist;) {
    var sym = tinf_decode_symbol(d, code_tree);

    switch (sym) {
      case 16:
        /* copy previous code length 3-6 times (read 2 bits) */
        var prev = lengths[num - 1];
        for (length = tinf_read_bits(d, 2, 3); length; --length) {
          lengths[num++] = prev;
        }
        break;
      case 17:
        /* repeat code length 0 for 3-10 times (read 3 bits) */
        for (length = tinf_read_bits(d, 3, 3); length; --length) {
          lengths[num++] = 0;
        }
        break;
      case 18:
        /* repeat code length 0 for 11-138 times (read 7 bits) */
        for (length = tinf_read_bits(d, 7, 11); length; --length) {
          lengths[num++] = 0;
        }
        break;
      default:
        /* values 0-15 represent the actual code lengths */
        lengths[num++] = sym;
        break;
    }
  }

  /* build dynamic trees */
  tinf_build_tree(lt, lengths, 0, hlit);
  tinf_build_tree(dt, lengths, hlit, hdist);
}

/* ----------------------------- *
 * -- block inflate functions -- *
 * ----------------------------- */

/* given a stream and two trees, inflate a block of data */
function tinf_inflate_block_data(d, lt, dt) {
  while (1) {
    var sym = tinf_decode_symbol(d, lt);

    /* check for end of block */
    if (sym === 256) {
      return TINF_OK;
    }

    if (sym < 256) {
      d.dest[d.destLen++] = sym;
    } else {
      var length, dist, offs;
      var i;

      sym -= 257;

      /* possibly get more bits from length code */
      length = tinf_read_bits(d, length_bits[sym], length_base[sym]);

      dist = tinf_decode_symbol(d, dt);

      /* possibly get more bits from distance code */
      offs = d.destLen - tinf_read_bits(d, dist_bits[dist], dist_base[dist]);

      /* copy match */
      for (i = offs; i < offs + length; ++i) {
        d.dest[d.destLen++] = d.dest[i];
      }
    }
  }
}

/* inflate an uncompressed block of data */
function tinf_inflate_uncompressed_block(d) {
  var length, invlength;
  var i;
  
  /* unread from bitbuffer */
  while (d.bitcount > 8) {
    d.sourceIndex--;
    d.bitcount -= 8;
  }

  /* get length */
  length = d.source[d.sourceIndex + 1];
  length = 256 * length + d.source[d.sourceIndex];

  /* get one's complement of length */
  invlength = d.source[d.sourceIndex + 3];
  invlength = 256 * invlength + d.source[d.sourceIndex + 2];

  /* check length */
  if (length !== (~invlength & 0x0000ffff))
    { return TINF_DATA_ERROR; }

  d.sourceIndex += 4;

  /* copy block */
  for (i = length; i; --i)
    { d.dest[d.destLen++] = d.source[d.sourceIndex++]; }

  /* make sure we start next block on a byte boundary */
  d.bitcount = 0;

  return TINF_OK;
}

/* inflate stream from source to dest */
function tinf_uncompress(source, dest) {
  var d = new Data(source, dest);
  var bfinal, btype, res;

  do {
    /* read final block flag */
    bfinal = tinf_getbit(d);

    /* read block type (2 bits) */
    btype = tinf_read_bits(d, 2, 0);

    /* decompress block */
    switch (btype) {
      case 0:
        /* decompress uncompressed block */
        res = tinf_inflate_uncompressed_block(d);
        break;
      case 1:
        /* decompress block with fixed huffman trees */
        res = tinf_inflate_block_data(d, sltree, sdtree);
        break;
      case 2:
        /* decompress block with dynamic huffman trees */
        tinf_decode_trees(d, d.ltree, d.dtree);
        res = tinf_inflate_block_data(d, d.ltree, d.dtree);
        break;
      default:
        res = TINF_DATA_ERROR;
    }

    if (res !== TINF_OK)
      { throw new Error('Data error'); }

  } while (!bfinal);

  if (d.destLen < d.dest.length) {
    if (typeof d.dest.slice === 'function')
      { return d.dest.slice(0, d.destLen); }
    else
      { return d.dest.subarray(0, d.destLen); }
  }
  
  return d.dest;
}

/* -------------------- *
 * -- initialization -- *
 * -------------------- */

/* build fixed huffman trees */
tinf_build_fixed_trees(sltree, sdtree);

/* build extra bits and base tables */
tinf_build_bits_base(length_bits, length_base, 4, 3);
tinf_build_bits_base(dist_bits, dist_base, 2, 1);

/* fix a special case */
length_bits[28] = 0;
length_base[28] = 258;

var index = tinf_uncompress;

// The Bounding Box object

function derive(v0, v1, v2, v3, t) {
    return Math.pow(1 - t, 3) * v0 +
        3 * Math.pow(1 - t, 2) * t * v1 +
        3 * (1 - t) * Math.pow(t, 2) * v2 +
        Math.pow(t, 3) * v3;
}
/**
 * A bounding box is an enclosing box that describes the smallest measure within which all the points lie.
 * It is used to calculate the bounding box of a glyph or text path.
 *
 * On initialization, x1/y1/x2/y2 will be NaN. Check if the bounding box is empty using `isEmpty()`.
 *
 * @exports opentype.BoundingBox
 * @class
 * @constructor
 */
function BoundingBox() {
    this.x1 = Number.NaN;
    this.y1 = Number.NaN;
    this.x2 = Number.NaN;
    this.y2 = Number.NaN;
}

/**
 * Returns true if the bounding box is empty, that is, no points have been added to the box yet.
 */
BoundingBox.prototype.isEmpty = function() {
    return isNaN(this.x1) || isNaN(this.y1) || isNaN(this.x2) || isNaN(this.y2);
};

/**
 * Add the point to the bounding box.
 * The x1/y1/x2/y2 coordinates of the bounding box will now encompass the given point.
 * @param {number} x - The X coordinate of the point.
 * @param {number} y - The Y coordinate of the point.
 */
BoundingBox.prototype.addPoint = function(x, y) {
    if (typeof x === 'number') {
        if (isNaN(this.x1) || isNaN(this.x2)) {
            this.x1 = x;
            this.x2 = x;
        }
        if (x < this.x1) {
            this.x1 = x;
        }
        if (x > this.x2) {
            this.x2 = x;
        }
    }
    if (typeof y === 'number') {
        if (isNaN(this.y1) || isNaN(this.y2)) {
            this.y1 = y;
            this.y2 = y;
        }
        if (y < this.y1) {
            this.y1 = y;
        }
        if (y > this.y2) {
            this.y2 = y;
        }
    }
};

/**
 * Add a X coordinate to the bounding box.
 * This extends the bounding box to include the X coordinate.
 * This function is used internally inside of addBezier.
 * @param {number} x - The X coordinate of the point.
 */
BoundingBox.prototype.addX = function(x) {
    this.addPoint(x, null);
};

/**
 * Add a Y coordinate to the bounding box.
 * This extends the bounding box to include the Y coordinate.
 * This function is used internally inside of addBezier.
 * @param {number} y - The Y coordinate of the point.
 */
BoundingBox.prototype.addY = function(y) {
    this.addPoint(null, y);
};

/**
 * Add a Bézier curve to the bounding box.
 * This extends the bounding box to include the entire Bézier.
 * @param {number} x0 - The starting X coordinate.
 * @param {number} y0 - The starting Y coordinate.
 * @param {number} x1 - The X coordinate of the first control point.
 * @param {number} y1 - The Y coordinate of the first control point.
 * @param {number} x2 - The X coordinate of the second control point.
 * @param {number} y2 - The Y coordinate of the second control point.
 * @param {number} x - The ending X coordinate.
 * @param {number} y - The ending Y coordinate.
 */
BoundingBox.prototype.addBezier = function(x0, y0, x1, y1, x2, y2, x, y) {
    var this$1 = this;

    // This code is based on http://nishiohirokazu.blogspot.com/2009/06/how-to-calculate-bezier-curves-bounding.html
    // and https://github.com/icons8/svg-path-bounding-box

    var p0 = [x0, y0];
    var p1 = [x1, y1];
    var p2 = [x2, y2];
    var p3 = [x, y];

    this.addPoint(x0, y0);
    this.addPoint(x, y);

    for (var i = 0; i <= 1; i++) {
        var b = 6 * p0[i] - 12 * p1[i] + 6 * p2[i];
        var a = -3 * p0[i] + 9 * p1[i] - 9 * p2[i] + 3 * p3[i];
        var c = 3 * p1[i] - 3 * p0[i];

        if (a === 0) {
            if (b === 0) { continue; }
            var t = -c / b;
            if (0 < t && t < 1) {
                if (i === 0) { this$1.addX(derive(p0[i], p1[i], p2[i], p3[i], t)); }
                if (i === 1) { this$1.addY(derive(p0[i], p1[i], p2[i], p3[i], t)); }
            }
            continue;
        }

        var b2ac = Math.pow(b, 2) - 4 * c * a;
        if (b2ac < 0) { continue; }
        var t1 = (-b + Math.sqrt(b2ac)) / (2 * a);
        if (0 < t1 && t1 < 1) {
            if (i === 0) { this$1.addX(derive(p0[i], p1[i], p2[i], p3[i], t1)); }
            if (i === 1) { this$1.addY(derive(p0[i], p1[i], p2[i], p3[i], t1)); }
        }
        var t2 = (-b - Math.sqrt(b2ac)) / (2 * a);
        if (0 < t2 && t2 < 1) {
            if (i === 0) { this$1.addX(derive(p0[i], p1[i], p2[i], p3[i], t2)); }
            if (i === 1) { this$1.addY(derive(p0[i], p1[i], p2[i], p3[i], t2)); }
        }
    }
};

/**
 * Add a quadratic curve to the bounding box.
 * This extends the bounding box to include the entire quadratic curve.
 * @param {number} x0 - The starting X coordinate.
 * @param {number} y0 - The starting Y coordinate.
 * @param {number} x1 - The X coordinate of the control point.
 * @param {number} y1 - The Y coordinate of the control point.
 * @param {number} x - The ending X coordinate.
 * @param {number} y - The ending Y coordinate.
 */
BoundingBox.prototype.addQuad = function(x0, y0, x1, y1, x, y) {
    var cp1x = x0 + 2 / 3 * (x1 - x0);
    var cp1y = y0 + 2 / 3 * (y1 - y0);
    var cp2x = cp1x + 1 / 3 * (x - x0);
    var cp2y = cp1y + 1 / 3 * (y - y0);
    this.addBezier(x0, y0, cp1x, cp1y, cp2x, cp2y, x, y);
};

// Geometric objects

/**
 * A bézier path containing a set of path commands similar to a SVG path.
 * Paths can be drawn on a context using `draw`.
 * @exports opentype.Path
 * @class
 * @constructor
 */
function Path() {
    this.commands = [];
    this.fill = 'black';
    this.stroke = null;
    this.strokeWidth = 1;
}

/**
 * @param  {number} x
 * @param  {number} y
 */
Path.prototype.moveTo = function(x, y) {
    this.commands.push({
        type: 'M',
        x: x,
        y: y
    });
};

/**
 * @param  {number} x
 * @param  {number} y
 */
Path.prototype.lineTo = function(x, y) {
    this.commands.push({
        type: 'L',
        x: x,
        y: y
    });
};

/**
 * Draws cubic curve
 * @function
 * curveTo
 * @memberof opentype.Path.prototype
 * @param  {number} x1 - x of control 1
 * @param  {number} y1 - y of control 1
 * @param  {number} x2 - x of control 2
 * @param  {number} y2 - y of control 2
 * @param  {number} x - x of path point
 * @param  {number} y - y of path point
 */

/**
 * Draws cubic curve
 * @function
 * bezierCurveTo
 * @memberof opentype.Path.prototype
 * @param  {number} x1 - x of control 1
 * @param  {number} y1 - y of control 1
 * @param  {number} x2 - x of control 2
 * @param  {number} y2 - y of control 2
 * @param  {number} x - x of path point
 * @param  {number} y - y of path point
 * @see curveTo
 */
Path.prototype.curveTo = Path.prototype.bezierCurveTo = function(x1, y1, x2, y2, x, y) {
    this.commands.push({
        type: 'C',
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        x: x,
        y: y
    });
};

/**
 * Draws quadratic curve
 * @function
 * quadraticCurveTo
 * @memberof opentype.Path.prototype
 * @param  {number} x1 - x of control
 * @param  {number} y1 - y of control
 * @param  {number} x - x of path point
 * @param  {number} y - y of path point
 */

/**
 * Draws quadratic curve
 * @function
 * quadTo
 * @memberof opentype.Path.prototype
 * @param  {number} x1 - x of control
 * @param  {number} y1 - y of control
 * @param  {number} x - x of path point
 * @param  {number} y - y of path point
 */
Path.prototype.quadTo = Path.prototype.quadraticCurveTo = function(x1, y1, x, y) {
    this.commands.push({
        type: 'Q',
        x1: x1,
        y1: y1,
        x: x,
        y: y
    });
};

/**
 * Closes the path
 * @function closePath
 * @memberof opentype.Path.prototype
 */

/**
 * Close the path
 * @function close
 * @memberof opentype.Path.prototype
 */
Path.prototype.close = Path.prototype.closePath = function() {
    this.commands.push({
        type: 'Z'
    });
};

/**
 * Add the given path or list of commands to the commands of this path.
 * @param  {Array} pathOrCommands - another opentype.Path, an opentype.BoundingBox, or an array of commands.
 */
Path.prototype.extend = function(pathOrCommands) {
    if (pathOrCommands.commands) {
        pathOrCommands = pathOrCommands.commands;
    } else if (pathOrCommands instanceof BoundingBox) {
        var box = pathOrCommands;
        this.moveTo(box.x1, box.y1);
        this.lineTo(box.x2, box.y1);
        this.lineTo(box.x2, box.y2);
        this.lineTo(box.x1, box.y2);
        this.close();
        return;
    }

    Array.prototype.push.apply(this.commands, pathOrCommands);
};

/**
 * Calculate the bounding box of the path.
 * @returns {opentype.BoundingBox}
 */
Path.prototype.getBoundingBox = function() {
    var this$1 = this;

    var box = new BoundingBox();

    var startX = 0;
    var startY = 0;
    var prevX = 0;
    var prevY = 0;
    for (var i = 0; i < this.commands.length; i++) {
        var cmd = this$1.commands[i];
        switch (cmd.type) {
            case 'M':
                box.addPoint(cmd.x, cmd.y);
                startX = prevX = cmd.x;
                startY = prevY = cmd.y;
                break;
            case 'L':
                box.addPoint(cmd.x, cmd.y);
                prevX = cmd.x;
                prevY = cmd.y;
                break;
            case 'Q':
                box.addQuad(prevX, prevY, cmd.x1, cmd.y1, cmd.x, cmd.y);
                prevX = cmd.x;
                prevY = cmd.y;
                break;
            case 'C':
                box.addBezier(prevX, prevY, cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
                prevX = cmd.x;
                prevY = cmd.y;
                break;
            case 'Z':
                prevX = startX;
                prevY = startY;
                break;
            default:
                throw new Error('Unexpected path command ' + cmd.type);
        }
    }
    if (box.isEmpty()) {
        box.addPoint(0, 0);
    }
    return box;
};

/**
 * Draw the path to a 2D context.
 * @param {CanvasRenderingContext2D} ctx - A 2D drawing context.
 */
Path.prototype.draw = function(ctx) {
    var this$1 = this;

    ctx.beginPath();
    for (var i = 0; i < this.commands.length; i += 1) {
        var cmd = this$1.commands[i];
        if (cmd.type === 'M') {
            ctx.moveTo(cmd.x, cmd.y);
        } else if (cmd.type === 'L') {
            ctx.lineTo(cmd.x, cmd.y);
        } else if (cmd.type === 'C') {
            ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
        } else if (cmd.type === 'Q') {
            ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
        } else if (cmd.type === 'Z') {
            ctx.closePath();
        }
    }

    if (this.fill) {
        ctx.fillStyle = this.fill;
        ctx.fill();
    }

    if (this.stroke) {
        ctx.strokeStyle = this.stroke;
        ctx.lineWidth = this.strokeWidth;
        ctx.stroke();
    }
};

/**
 * Convert the Path to a string of path data instructions
 * See http://www.w3.org/TR/SVG/paths.html#PathData
 * @param  {number} [decimalPlaces=2] - The amount of decimal places for floating-point values
 * @return {string}
 */
Path.prototype.toPathData = function(decimalPlaces) {
    var this$1 = this;

    decimalPlaces = decimalPlaces !== undefined ? decimalPlaces : 2;

    function floatToString(v) {
        if (Math.round(v) === v) {
            return '' + Math.round(v);
        } else {
            return v.toFixed(decimalPlaces);
        }
    }

    function packValues() {
        var arguments$1 = arguments;

        var s = '';
        for (var i = 0; i < arguments.length; i += 1) {
            var v = arguments$1[i];
            if (v >= 0 && i > 0) {
                s += ' ';
            }

            s += floatToString(v);
        }

        return s;
    }

    var d = '';
    for (var i = 0; i < this.commands.length; i += 1) {
        var cmd = this$1.commands[i];
        if (cmd.type === 'M') {
            d += 'M' + packValues(cmd.x, cmd.y);
        } else if (cmd.type === 'L') {
            d += 'L' + packValues(cmd.x, cmd.y);
        } else if (cmd.type === 'C') {
            d += 'C' + packValues(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
        } else if (cmd.type === 'Q') {
            d += 'Q' + packValues(cmd.x1, cmd.y1, cmd.x, cmd.y);
        } else if (cmd.type === 'Z') {
            d += 'Z';
        }
    }

    return d;
};

/**
 * Convert the path to an SVG <path> element, as a string.
 * @param  {number} [decimalPlaces=2] - The amount of decimal places for floating-point values
 * @return {string}
 */
Path.prototype.toSVG = function(decimalPlaces) {
    var svg = '<path d="';
    svg += this.toPathData(decimalPlaces);
    svg += '"';
    if (this.fill && this.fill !== 'black') {
        if (this.fill === null) {
            svg += ' fill="none"';
        } else {
            svg += ' fill="' + this.fill + '"';
        }
    }

    if (this.stroke) {
        svg += ' stroke="' + this.stroke + '" stroke-width="' + this.strokeWidth + '"';
    }

    svg += '/>';
    return svg;
};

/**
 * Convert the path to a DOM element.
 * @param  {number} [decimalPlaces=2] - The amount of decimal places for floating-point values
 * @return {SVGPathElement}
 */
Path.prototype.toDOMElement = function(decimalPlaces) {
    var temporaryPath = this.toPathData(decimalPlaces);
    var newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    newPath.setAttribute('d', temporaryPath);

    return newPath;
};

// Run-time checking of preconditions.

function fail(message) {
    throw new Error(message);
}

// Precondition function that checks if the given predicate is true.
// If not, it will throw an error.
function argument(predicate, message) {
    if (!predicate) {
        fail(message);
    }
}

var check = { fail: fail, argument: argument, assert: argument };

// Data types used in the OpenType font file.
// All OpenType fonts use Motorola-style byte ordering (Big Endian)

var LIMIT16 = 32768; // The limit at which a 16-bit number switches signs == 2^15
var LIMIT32 = 2147483648; // The limit at which a 32-bit number switches signs == 2 ^ 31

/**
 * @exports opentype.decode
 * @class
 */
var decode = {};
/**
 * @exports opentype.encode
 * @class
 */
var encode = {};
/**
 * @exports opentype.sizeOf
 * @class
 */
var sizeOf = {};

// Return a function that always returns the same value.
function constant(v) {
    return function() {
        return v;
    };
}

// OpenType data types //////////////////////////////////////////////////////

/**
 * Convert an 8-bit unsigned integer to a list of 1 byte.
 * @param {number}
 * @returns {Array}
 */
encode.BYTE = function(v) {
    check.argument(v >= 0 && v <= 255, 'Byte value should be between 0 and 255.');
    return [v];
};
/**
 * @constant
 * @type {number}
 */
sizeOf.BYTE = constant(1);

/**
 * Convert a 8-bit signed integer to a list of 1 byte.
 * @param {string}
 * @returns {Array}
 */
encode.CHAR = function(v) {
    return [v.charCodeAt(0)];
};

/**
 * @constant
 * @type {number}
 */
sizeOf.CHAR = constant(1);

/**
 * Convert an ASCII string to a list of bytes.
 * @param {string}
 * @returns {Array}
 */
encode.CHARARRAY = function(v) {
    var b = [];
    for (var i = 0; i < v.length; i += 1) {
        b[i] = v.charCodeAt(i);
    }

    return b;
};

/**
 * @param {Array}
 * @returns {number}
 */
sizeOf.CHARARRAY = function(v) {
    return v.length;
};

/**
 * Convert a 16-bit unsigned integer to a list of 2 bytes.
 * @param {number}
 * @returns {Array}
 */
encode.USHORT = function(v) {
    return [(v >> 8) & 0xFF, v & 0xFF];
};

/**
 * @constant
 * @type {number}
 */
sizeOf.USHORT = constant(2);

/**
 * Convert a 16-bit signed integer to a list of 2 bytes.
 * @param {number}
 * @returns {Array}
 */
encode.SHORT = function(v) {
    // Two's complement
    if (v >= LIMIT16) {
        v = -(2 * LIMIT16 - v);
    }

    return [(v >> 8) & 0xFF, v & 0xFF];
};

/**
 * @constant
 * @type {number}
 */
sizeOf.SHORT = constant(2);

/**
 * Convert a 24-bit unsigned integer to a list of 3 bytes.
 * @param {number}
 * @returns {Array}
 */
encode.UINT24 = function(v) {
    return [(v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
};

/**
 * @constant
 * @type {number}
 */
sizeOf.UINT24 = constant(3);

/**
 * Convert a 32-bit unsigned integer to a list of 4 bytes.
 * @param {number}
 * @returns {Array}
 */
encode.ULONG = function(v) {
    return [(v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
};

/**
 * @constant
 * @type {number}
 */
sizeOf.ULONG = constant(4);

/**
 * Convert a 32-bit unsigned integer to a list of 4 bytes.
 * @param {number}
 * @returns {Array}
 */
encode.LONG = function(v) {
    // Two's complement
    if (v >= LIMIT32) {
        v = -(2 * LIMIT32 - v);
    }

    return [(v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
};

/**
 * @constant
 * @type {number}
 */
sizeOf.LONG = constant(4);

encode.FIXED = encode.ULONG;
sizeOf.FIXED = sizeOf.ULONG;

encode.FWORD = encode.SHORT;
sizeOf.FWORD = sizeOf.SHORT;

encode.UFWORD = encode.USHORT;
sizeOf.UFWORD = sizeOf.USHORT;

/**
 * Convert a 32-bit Apple Mac timestamp integer to a list of 8 bytes, 64-bit timestamp.
 * @param {number}
 * @returns {Array}
 */
encode.LONGDATETIME = function(v) {
    return [0, 0, 0, 0, (v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
};

/**
 * @constant
 * @type {number}
 */
sizeOf.LONGDATETIME = constant(8);

/**
 * Convert a 4-char tag to a list of 4 bytes.
 * @param {string}
 * @returns {Array}
 */
encode.TAG = function(v) {
    check.argument(v.length === 4, 'Tag should be exactly 4 ASCII characters.');
    return [v.charCodeAt(0),
            v.charCodeAt(1),
            v.charCodeAt(2),
            v.charCodeAt(3)];
};

/**
 * @constant
 * @type {number}
 */
sizeOf.TAG = constant(4);

// CFF data types ///////////////////////////////////////////////////////////

encode.Card8 = encode.BYTE;
sizeOf.Card8 = sizeOf.BYTE;

encode.Card16 = encode.USHORT;
sizeOf.Card16 = sizeOf.USHORT;

encode.OffSize = encode.BYTE;
sizeOf.OffSize = sizeOf.BYTE;

encode.SID = encode.USHORT;
sizeOf.SID = sizeOf.USHORT;

// Convert a numeric operand or charstring number to a variable-size list of bytes.
/**
 * Convert a numeric operand or charstring number to a variable-size list of bytes.
 * @param {number}
 * @returns {Array}
 */
encode.NUMBER = function(v) {
    if (v >= -107 && v <= 107) {
        return [v + 139];
    } else if (v >= 108 && v <= 1131) {
        v = v - 108;
        return [(v >> 8) + 247, v & 0xFF];
    } else if (v >= -1131 && v <= -108) {
        v = -v - 108;
        return [(v >> 8) + 251, v & 0xFF];
    } else if (v >= -32768 && v <= 32767) {
        return encode.NUMBER16(v);
    } else {
        return encode.NUMBER32(v);
    }
};

/**
 * @param {number}
 * @returns {number}
 */
sizeOf.NUMBER = function(v) {
    return encode.NUMBER(v).length;
};

/**
 * Convert a signed number between -32768 and +32767 to a three-byte value.
 * This ensures we always use three bytes, but is not the most compact format.
 * @param {number}
 * @returns {Array}
 */
encode.NUMBER16 = function(v) {
    return [28, (v >> 8) & 0xFF, v & 0xFF];
};

/**
 * @constant
 * @type {number}
 */
sizeOf.NUMBER16 = constant(3);

/**
 * Convert a signed number between -(2^31) and +(2^31-1) to a five-byte value.
 * This is useful if you want to be sure you always use four bytes,
 * at the expense of wasting a few bytes for smaller numbers.
 * @param {number}
 * @returns {Array}
 */
encode.NUMBER32 = function(v) {
    return [29, (v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
};

/**
 * @constant
 * @type {number}
 */
sizeOf.NUMBER32 = constant(5);

/**
 * @param {number}
 * @returns {Array}
 */
encode.REAL = function(v) {
    var value = v.toString();

    // Some numbers use an epsilon to encode the value. (e.g. JavaScript will store 0.0000001 as 1e-7)
    // This code converts it back to a number without the epsilon.
    var m = /\.(\d*?)(?:9{5,20}|0{5,20})\d{0,2}(?:e(.+)|$)/.exec(value);
    if (m) {
        var epsilon = parseFloat('1e' + ((m[2] ? +m[2] : 0) + m[1].length));
        value = (Math.round(v * epsilon) / epsilon).toString();
    }

    var nibbles = '';
    for (var i = 0, ii = value.length; i < ii; i += 1) {
        var c = value[i];
        if (c === 'e') {
            nibbles += value[++i] === '-' ? 'c' : 'b';
        } else if (c === '.') {
            nibbles += 'a';
        } else if (c === '-') {
            nibbles += 'e';
        } else {
            nibbles += c;
        }
    }

    nibbles += (nibbles.length & 1) ? 'f' : 'ff';
    var out = [30];
    for (var i$1 = 0, ii$1 = nibbles.length; i$1 < ii$1; i$1 += 2) {
        out.push(parseInt(nibbles.substr(i$1, 2), 16));
    }

    return out;
};

/**
 * @param {number}
 * @returns {number}
 */
sizeOf.REAL = function(v) {
    return encode.REAL(v).length;
};

encode.NAME = encode.CHARARRAY;
sizeOf.NAME = sizeOf.CHARARRAY;

encode.STRING = encode.CHARARRAY;
sizeOf.STRING = sizeOf.CHARARRAY;

/**
 * @param {DataView} data
 * @param {number} offset
 * @param {number} numBytes
 * @returns {string}
 */
decode.UTF8 = function(data, offset, numBytes) {
    var codePoints = [];
    var numChars = numBytes;
    for (var j = 0; j < numChars; j++, offset += 1) {
        codePoints[j] = data.getUint8(offset);
    }

    return String.fromCharCode.apply(null, codePoints);
};

/**
 * @param {DataView} data
 * @param {number} offset
 * @param {number} numBytes
 * @returns {string}
 */
decode.UTF16 = function(data, offset, numBytes) {
    var codePoints = [];
    var numChars = numBytes / 2;
    for (var j = 0; j < numChars; j++, offset += 2) {
        codePoints[j] = data.getUint16(offset);
    }

    return String.fromCharCode.apply(null, codePoints);
};

/**
 * Convert a JavaScript string to UTF16-BE.
 * @param {string}
 * @returns {Array}
 */
encode.UTF16 = function(v) {
    var b = [];
    for (var i = 0; i < v.length; i += 1) {
        var codepoint = v.charCodeAt(i);
        b[b.length] = (codepoint >> 8) & 0xFF;
        b[b.length] = codepoint & 0xFF;
    }

    return b;
};

/**
 * @param {string}
 * @returns {number}
 */
sizeOf.UTF16 = function(v) {
    return v.length * 2;
};

// Data for converting old eight-bit Macintosh encodings to Unicode.
// This representation is optimized for decoding; encoding is slower
// and needs more memory. The assumption is that all opentype.js users
// want to open fonts, but saving a font will be comparatively rare
// so it can be more expensive. Keyed by IANA character set name.
//
// Python script for generating these strings:
//
//     s = u''.join([chr(c).decode('mac_greek') for c in range(128, 256)])
//     print(s.encode('utf-8'))
/**
 * @private
 */
var eightBitMacEncodings = {
    'x-mac-croatian':  // Python: 'mac_croatian'
    'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®Š™´¨≠ŽØ∞±≤≥∆µ∂∑∏š∫ªºΩžø' +
    '¿¡¬√ƒ≈Ć«Č… ÀÃÕŒœĐ—“”‘’÷◊©⁄€‹›Æ»–·‚„‰ÂćÁčÈÍÎÏÌÓÔđÒÚÛÙıˆ˜¯πË˚¸Êæˇ',
    'x-mac-cyrillic':  // Python: 'mac_cyrillic'
    'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ†°Ґ£§•¶І®©™Ђђ≠Ѓѓ∞±≤≥іµґЈЄєЇїЉљЊњ' +
    'јЅ¬√ƒ≈∆«»… ЋћЌќѕ–—“”‘’÷„ЎўЏџ№Ёёяабвгдежзийклмнопрстуфхцчшщъыьэю',
    'x-mac-gaelic': // http://unicode.org/Public/MAPPINGS/VENDORS/APPLE/GAELIC.TXT
    'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØḂ±≤≥ḃĊċḊḋḞḟĠġṀæø' +
    'ṁṖṗɼƒſṠ«»… ÀÃÕŒœ–—“”‘’ṡẛÿŸṪ€‹›Ŷŷṫ·Ỳỳ⁊ÂÊÁËÈÍÎÏÌÓÔ♣ÒÚÛÙıÝýŴŵẄẅẀẁẂẃ',
    'x-mac-greek':  // Python: 'mac_greek'
    'Ä¹²É³ÖÜ΅àâä΄¨çéèêë£™îï•½‰ôö¦€ùûü†ΓΔΘΛΞΠß®©ΣΪ§≠°·Α±≤≥¥ΒΕΖΗΙΚΜΦΫΨΩ' +
    'άΝ¬ΟΡ≈Τ«»… ΥΧΆΈœ–―“”‘’÷ΉΊΌΎέήίόΏύαβψδεφγηιξκλμνοπώρστθωςχυζϊϋΐΰ\u00AD',
    'x-mac-icelandic':  // Python: 'mac_iceland'
    'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûüÝ°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø' +
    '¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€ÐðÞþý·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ',
    'x-mac-inuit': // http://unicode.org/Public/MAPPINGS/VENDORS/APPLE/INUIT.TXT
    'ᐃᐄᐅᐆᐊᐋᐱᐲᐳᐴᐸᐹᑉᑎᑏᑐᑑᑕᑖᑦᑭᑮᑯᑰᑲᑳᒃᒋᒌᒍᒎᒐᒑ°ᒡᒥᒦ•¶ᒧ®©™ᒨᒪᒫᒻᓂᓃᓄᓅᓇᓈᓐᓯᓰᓱᓲᓴᓵᔅᓕᓖᓗ' +
    'ᓘᓚᓛᓪᔨᔩᔪᔫᔭ… ᔮᔾᕕᕖᕗ–—“”‘’ᕘᕙᕚᕝᕆᕇᕈᕉᕋᕌᕐᕿᖀᖁᖂᖃᖄᖅᖏᖐᖑᖒᖓᖔᖕᙱᙲᙳᙴᙵᙶᖖᖠᖡᖢᖣᖤᖥᖦᕼŁł',
    'x-mac-ce':  // Python: 'mac_latin2'
    'ÄĀāÉĄÖÜáąČäčĆćéŹźĎíďĒēĖóėôöõúĚěü†°Ę£§•¶ß®©™ę¨≠ģĮįĪ≤≥īĶ∂∑łĻļĽľĹĺŅ' +
    'ņŃ¬√ńŇ∆«»… ňŐÕőŌ–—“”‘’÷◊ōŔŕŘ‹›řŖŗŠ‚„šŚśÁŤťÍŽžŪÓÔūŮÚůŰűŲųÝýķŻŁżĢˇ',
    macintosh:  // Python: 'mac_roman'
    'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø' +
    '¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ',
    'x-mac-romanian':  // Python: 'mac_romanian'
    'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ĂȘ∞±≤≥¥µ∂∑∏π∫ªºΩăș' +
    '¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›Țț‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ',
    'x-mac-turkish':  // Python: 'mac_turkish'
    'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø' +
    '¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸĞğİıŞş‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙˆ˜¯˘˙˚¸˝˛ˇ'
};

/**
 * Decodes an old-style Macintosh string. Returns either a Unicode JavaScript
 * string, or 'undefined' if the encoding is unsupported. For example, we do
 * not support Chinese, Japanese or Korean because these would need large
 * mapping tables.
 * @param {DataView} dataView
 * @param {number} offset
 * @param {number} dataLength
 * @param {string} encoding
 * @returns {string}
 */
decode.MACSTRING = function(dataView, offset, dataLength, encoding) {
    var table = eightBitMacEncodings[encoding];
    if (table === undefined) {
        return undefined;
    }

    var result = '';
    for (var i = 0; i < dataLength; i++) {
        var c = dataView.getUint8(offset + i);
        // In all eight-bit Mac encodings, the characters 0x00..0x7F are
        // mapped to U+0000..U+007F; we only need to look up the others.
        if (c <= 0x7F) {
            result += String.fromCharCode(c);
        } else {
            result += table[c & 0x7F];
        }
    }

    return result;
};

// Helper function for encode.MACSTRING. Returns a dictionary for mapping
// Unicode character codes to their 8-bit MacOS equivalent. This table
// is not exactly a super cheap data structure, but we do not care because
// encoding Macintosh strings is only rarely needed in typical applications.
var macEncodingTableCache = typeof WeakMap === 'function' && new WeakMap();
var macEncodingCacheKeys;
var getMacEncodingTable = function (encoding) {
    // Since we use encoding as a cache key for WeakMap, it has to be
    // a String object and not a literal. And at least on NodeJS 2.10.1,
    // WeakMap requires that the same String instance is passed for cache hits.
    if (!macEncodingCacheKeys) {
        macEncodingCacheKeys = {};
        for (var e in eightBitMacEncodings) {
            /*jshint -W053 */  // Suppress "Do not use String as a constructor."
            macEncodingCacheKeys[e] = new String(e);
        }
    }

    var cacheKey = macEncodingCacheKeys[encoding];
    if (cacheKey === undefined) {
        return undefined;
    }

    // We can't do "if (cache.has(key)) {return cache.get(key)}" here:
    // since garbage collection may run at any time, it could also kick in
    // between the calls to cache.has() and cache.get(). In that case,
    // we would return 'undefined' even though we do support the encoding.
    if (macEncodingTableCache) {
        var cachedTable = macEncodingTableCache.get(cacheKey);
        if (cachedTable !== undefined) {
            return cachedTable;
        }
    }

    var decodingTable = eightBitMacEncodings[encoding];
    if (decodingTable === undefined) {
        return undefined;
    }

    var encodingTable = {};
    for (var i = 0; i < decodingTable.length; i++) {
        encodingTable[decodingTable.charCodeAt(i)] = i + 0x80;
    }

    if (macEncodingTableCache) {
        macEncodingTableCache.set(cacheKey, encodingTable);
    }

    return encodingTable;
};

/**
 * Encodes an old-style Macintosh string. Returns a byte array upon success.
 * If the requested encoding is unsupported, or if the input string contains
 * a character that cannot be expressed in the encoding, the function returns
 * 'undefined'.
 * @param {string} str
 * @param {string} encoding
 * @returns {Array}
 */
encode.MACSTRING = function(str, encoding) {
    var table = getMacEncodingTable(encoding);
    if (table === undefined) {
        return undefined;
    }

    var result = [];
    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);

        // In all eight-bit Mac encodings, the characters 0x00..0x7F are
        // mapped to U+0000..U+007F; we only need to look up the others.
        if (c >= 0x80) {
            c = table[c];
            if (c === undefined) {
                // str contains a Unicode character that cannot be encoded
                // in the requested encoding.
                return undefined;
            }
        }
        result[i] = c;
        // result.push(c);
    }

    return result;
};

/**
 * @param {string} str
 * @param {string} encoding
 * @returns {number}
 */
sizeOf.MACSTRING = function(str, encoding) {
    var b = encode.MACSTRING(str, encoding);
    if (b !== undefined) {
        return b.length;
    } else {
        return 0;
    }
};

// Helper for encode.VARDELTAS
function isByteEncodable(value) {
    return value >= -128 && value <= 127;
}

// Helper for encode.VARDELTAS
function encodeVarDeltaRunAsZeroes(deltas, pos, result) {
    var runLength = 0;
    var numDeltas = deltas.length;
    while (pos < numDeltas && runLength < 64 && deltas[pos] === 0) {
        ++pos;
        ++runLength;
    }
    result.push(0x80 | (runLength - 1));
    return pos;
}

// Helper for encode.VARDELTAS
function encodeVarDeltaRunAsBytes(deltas, offset, result) {
    var runLength = 0;
    var numDeltas = deltas.length;
    var pos = offset;
    while (pos < numDeltas && runLength < 64) {
        var value = deltas[pos];
        if (!isByteEncodable(value)) {
            break;
        }

        // Within a byte-encoded run of deltas, a single zero is best
        // stored literally as 0x00 value. However, if we have two or
        // more zeroes in a sequence, it is better to start a new run.
        // Fore example, the sequence of deltas [15, 15, 0, 15, 15]
        // becomes 6 bytes (04 0F 0F 00 0F 0F) when storing the zero
        // within the current run, but 7 bytes (01 0F 0F 80 01 0F 0F)
        // when starting a new run.
        if (value === 0 && pos + 1 < numDeltas && deltas[pos + 1] === 0) {
            break;
        }

        ++pos;
        ++runLength;
    }
    result.push(runLength - 1);
    for (var i = offset; i < pos; ++i) {
        result.push((deltas[i] + 256) & 0xff);
    }
    return pos;
}

// Helper for encode.VARDELTAS
function encodeVarDeltaRunAsWords(deltas, offset, result) {
    var runLength = 0;
    var numDeltas = deltas.length;
    var pos = offset;
    while (pos < numDeltas && runLength < 64) {
        var value = deltas[pos];

        // Within a word-encoded run of deltas, it is easiest to start
        // a new run (with a different encoding) whenever we encounter
        // a zero value. For example, the sequence [0x6666, 0, 0x7777]
        // needs 7 bytes when storing the zero inside the current run
        // (42 66 66 00 00 77 77), and equally 7 bytes when starting a
        // new run (40 66 66 80 40 77 77).
        if (value === 0) {
            break;
        }

        // Within a word-encoded run of deltas, a single value in the
        // range (-128..127) should be encoded within the current run
        // because it is more compact. For example, the sequence
        // [0x6666, 2, 0x7777] becomes 7 bytes when storing the value
        // literally (42 66 66 00 02 77 77), but 8 bytes when starting
        // a new run (40 66 66 00 02 40 77 77).
        if (isByteEncodable(value) && pos + 1 < numDeltas && isByteEncodable(deltas[pos + 1])) {
            break;
        }

        ++pos;
        ++runLength;
    }
    result.push(0x40 | (runLength - 1));
    for (var i = offset; i < pos; ++i) {
        var val = deltas[i];
        result.push(((val + 0x10000) >> 8) & 0xff, (val + 0x100) & 0xff);
    }
    return pos;
}

/**
 * Encode a list of variation adjustment deltas.
 *
 * Variation adjustment deltas are used in ‘gvar’ and ‘cvar’ tables.
 * They indicate how points (in ‘gvar’) or values (in ‘cvar’) get adjusted
 * when generating instances of variation fonts.
 *
 * @see https://www.microsoft.com/typography/otspec/gvar.htm
 * @see https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6gvar.html
 * @param {Array}
 * @return {Array}
 */
encode.VARDELTAS = function(deltas) {
    var pos = 0;
    var result = [];
    while (pos < deltas.length) {
        var value = deltas[pos];
        if (value === 0) {
            pos = encodeVarDeltaRunAsZeroes(deltas, pos, result);
        } else if (value >= -128 && value <= 127) {
            pos = encodeVarDeltaRunAsBytes(deltas, pos, result);
        } else {
            pos = encodeVarDeltaRunAsWords(deltas, pos, result);
        }
    }
    return result;
};

// Convert a list of values to a CFF INDEX structure.
// The values should be objects containing name / type / value.
/**
 * @param {Array} l
 * @returns {Array}
 */
encode.INDEX = function(l) {
    //var offset, offsets, offsetEncoder, encodedOffsets, encodedOffset, data,
    //    i, v;
    // Because we have to know which data type to use to encode the offsets,
    // we have to go through the values twice: once to encode the data and
    // calculate the offsets, then again to encode the offsets using the fitting data type.
    var offset = 1; // First offset is always 1.
    var offsets = [offset];
    var data = [];
    for (var i = 0; i < l.length; i += 1) {
        var v = encode.OBJECT(l[i]);
        Array.prototype.push.apply(data, v);
        offset += v.length;
        offsets.push(offset);
    }

    if (data.length === 0) {
        return [0, 0];
    }

    var encodedOffsets = [];
    var offSize = (1 + Math.floor(Math.log(offset) / Math.log(2)) / 8) | 0;
    var offsetEncoder = [undefined, encode.BYTE, encode.USHORT, encode.UINT24, encode.ULONG][offSize];
    for (var i$1 = 0; i$1 < offsets.length; i$1 += 1) {
        var encodedOffset = offsetEncoder(offsets[i$1]);
        Array.prototype.push.apply(encodedOffsets, encodedOffset);
    }

    return Array.prototype.concat(encode.Card16(l.length),
                           encode.OffSize(offSize),
                           encodedOffsets,
                           data);
};

/**
 * @param {Array}
 * @returns {number}
 */
sizeOf.INDEX = function(v) {
    return encode.INDEX(v).length;
};

/**
 * Convert an object to a CFF DICT structure.
 * The keys should be numeric.
 * The values should be objects containing name / type / value.
 * @param {Object} m
 * @returns {Array}
 */
encode.DICT = function(m) {
    var d = [];
    var keys = Object.keys(m);
    var length = keys.length;

    for (var i = 0; i < length; i += 1) {
        // Object.keys() return string keys, but our keys are always numeric.
        var k = parseInt(keys[i], 0);
        var v = m[k];
        // Value comes before the key.
        d = d.concat(encode.OPERAND(v.value, v.type));
        d = d.concat(encode.OPERATOR(k));
    }

    return d;
};

/**
 * @param {Object}
 * @returns {number}
 */
sizeOf.DICT = function(m) {
    return encode.DICT(m).length;
};

/**
 * @param {number}
 * @returns {Array}
 */
encode.OPERATOR = function(v) {
    if (v < 1200) {
        return [v];
    } else {
        return [12, v - 1200];
    }
};

/**
 * @param {Array} v
 * @param {string}
 * @returns {Array}
 */
encode.OPERAND = function(v, type) {
    var d = [];
    if (Array.isArray(type)) {
        for (var i = 0; i < type.length; i += 1) {
            check.argument(v.length === type.length, 'Not enough arguments given for type' + type);
            d = d.concat(encode.OPERAND(v[i], type[i]));
        }
    } else {
        if (type === 'SID') {
            d = d.concat(encode.NUMBER(v));
        } else if (type === 'offset') {
            // We make it easy for ourselves and always encode offsets as
            // 4 bytes. This makes offset calculation for the top dict easier.
            d = d.concat(encode.NUMBER32(v));
        } else if (type === 'number') {
            d = d.concat(encode.NUMBER(v));
        } else if (type === 'real') {
            d = d.concat(encode.REAL(v));
        } else {
            throw new Error('Unknown operand type ' + type);
            // FIXME Add support for booleans
        }
    }

    return d;
};

encode.OP = encode.BYTE;
sizeOf.OP = sizeOf.BYTE;

// memoize charstring encoding using WeakMap if available
var wmm = typeof WeakMap === 'function' && new WeakMap();

/**
 * Convert a list of CharString operations to bytes.
 * @param {Array}
 * @returns {Array}
 */
encode.CHARSTRING = function(ops) {
    // See encode.MACSTRING for why we don't do "if (wmm && wmm.has(ops))".
    if (wmm) {
        var cachedValue = wmm.get(ops);
        if (cachedValue !== undefined) {
            return cachedValue;
        }
    }

    var d = [];
    var length = ops.length;

    for (var i = 0; i < length; i += 1) {
        var op = ops[i];
        d = d.concat(encode[op.type](op.value));
    }

    if (wmm) {
        wmm.set(ops, d);
    }

    return d;
};

/**
 * @param {Array}
 * @returns {number}
 */
sizeOf.CHARSTRING = function(ops) {
    return encode.CHARSTRING(ops).length;
};

// Utility functions ////////////////////////////////////////////////////////

/**
 * Convert an object containing name / type / value to bytes.
 * @param {Object}
 * @returns {Array}
 */
encode.OBJECT = function(v) {
    var encodingFunction = encode[v.type];
    check.argument(encodingFunction !== undefined, 'No encoding function for type ' + v.type);
    return encodingFunction(v.value);
};

/**
 * @param {Object}
 * @returns {number}
 */
sizeOf.OBJECT = function(v) {
    var sizeOfFunction = sizeOf[v.type];
    check.argument(sizeOfFunction !== undefined, 'No sizeOf function for type ' + v.type);
    return sizeOfFunction(v.value);
};

/**
 * Convert a table object to bytes.
 * A table contains a list of fields containing the metadata (name, type and default value).
 * The table itself has the field values set as attributes.
 * @param {opentype.Table}
 * @returns {Array}
 */
encode.TABLE = function(table) {
    var d = [];
    var length = table.fields.length;
    var subtables = [];
    var subtableOffsets = [];

    for (var i = 0; i < length; i += 1) {
        var field = table.fields[i];
        var encodingFunction = encode[field.type];
        check.argument(encodingFunction !== undefined, 'No encoding function for field type ' + field.type + ' (' + field.name + ')');
        var value = table[field.name];
        if (value === undefined) {
            value = field.value;
        }

        var bytes = encodingFunction(value);

        if (field.type === 'TABLE') {
            subtableOffsets.push(d.length);
            d = d.concat([0, 0]);
            subtables.push(bytes);
        } else {
            d = d.concat(bytes);
        }
    }

    for (var i$1 = 0; i$1 < subtables.length; i$1 += 1) {
        var o = subtableOffsets[i$1];
        var offset = d.length;
        check.argument(offset < 65536, 'Table ' + table.tableName + ' too big.');
        d[o] = offset >> 8;
        d[o + 1] = offset & 0xff;
        d = d.concat(subtables[i$1]);
    }

    return d;
};

/**
 * @param {opentype.Table}
 * @returns {number}
 */
sizeOf.TABLE = function(table) {
    var numBytes = 0;
    var length = table.fields.length;

    for (var i = 0; i < length; i += 1) {
        var field = table.fields[i];
        var sizeOfFunction = sizeOf[field.type];
        check.argument(sizeOfFunction !== undefined, 'No sizeOf function for field type ' + field.type + ' (' + field.name + ')');
        var value = table[field.name];
        if (value === undefined) {
            value = field.value;
        }

        numBytes += sizeOfFunction(value);

        // Subtables take 2 more bytes for offsets.
        if (field.type === 'TABLE') {
            numBytes += 2;
        }
    }

    return numBytes;
};

encode.RECORD = encode.TABLE;
sizeOf.RECORD = sizeOf.TABLE;

// Merge in a list of bytes.
encode.LITERAL = function(v) {
    return v;
};

sizeOf.LITERAL = function(v) {
    return v.length;
};

// Table metadata

/**
 * @exports opentype.Table
 * @class
 * @param {string} tableName
 * @param {Array} fields
 * @param {Object} options
 * @constructor
 */
function Table(tableName, fields, options) {
    var this$1 = this;

    for (var i = 0; i < fields.length; i += 1) {
        var field = fields[i];
        this$1[field.name] = field.value;
    }

    this.tableName = tableName;
    this.fields = fields;
    if (options) {
        var optionKeys = Object.keys(options);
        for (var i$1 = 0; i$1 < optionKeys.length; i$1 += 1) {
            var k = optionKeys[i$1];
            var v = options[k];
            if (this$1[k] !== undefined) {
                this$1[k] = v;
            }
        }
    }
}

/**
 * Encodes the table and returns an array of bytes
 * @return {Array}
 */
Table.prototype.encode = function() {
    return encode.TABLE(this);
};

/**
 * Get the size of the table.
 * @return {number}
 */
Table.prototype.sizeOf = function() {
    return sizeOf.TABLE(this);
};

/**
 * @private
 */
function ushortList(itemName, list, count) {
    if (count === undefined) {
        count = list.length;
    }
    var fields = new Array(list.length + 1);
    fields[0] = {name: itemName + 'Count', type: 'USHORT', value: count};
    for (var i = 0; i < list.length; i++) {
        fields[i + 1] = {name: itemName + i, type: 'USHORT', value: list[i]};
    }
    return fields;
}

/**
 * @private
 */
function tableList(itemName, records, itemCallback) {
    var count = records.length;
    var fields = new Array(count + 1);
    fields[0] = {name: itemName + 'Count', type: 'USHORT', value: count};
    for (var i = 0; i < count; i++) {
        fields[i + 1] = {name: itemName + i, type: 'TABLE', value: itemCallback(records[i], i)};
    }
    return fields;
}

/**
 * @private
 */
function recordList(itemName, records, itemCallback) {
    var count = records.length;
    var fields = [];
    fields[0] = {name: itemName + 'Count', type: 'USHORT', value: count};
    for (var i = 0; i < count; i++) {
        fields = fields.concat(itemCallback(records[i], i));
    }
    return fields;
}

// Common Layout Tables

/**
 * @exports opentype.Coverage
 * @class
 * @param {opentype.Table}
 * @constructor
 * @extends opentype.Table
 */
function Coverage(coverageTable) {
    if (coverageTable.format === 1) {
        Table.call(this, 'coverageTable',
            [{name: 'coverageFormat', type: 'USHORT', value: 1}]
            .concat(ushortList('glyph', coverageTable.glyphs))
        );
    } else {
        check.assert(false, 'Can\'t create coverage table format 2 yet.');
    }
}
Coverage.prototype = Object.create(Table.prototype);
Coverage.prototype.constructor = Coverage;

function ScriptList(scriptListTable) {
    Table.call(this, 'scriptListTable',
        recordList('scriptRecord', scriptListTable, function(scriptRecord, i) {
            var script = scriptRecord.script;
            var defaultLangSys = script.defaultLangSys;
            check.assert(!!defaultLangSys, 'Unable to write GSUB: script ' + scriptRecord.tag + ' has no default language system.');
            return [
                {name: 'scriptTag' + i, type: 'TAG', value: scriptRecord.tag},
                {name: 'script' + i, type: 'TABLE', value: new Table('scriptTable', [
                    {name: 'defaultLangSys', type: 'TABLE', value: new Table('defaultLangSys', [
                        {name: 'lookupOrder', type: 'USHORT', value: 0},
                        {name: 'reqFeatureIndex', type: 'USHORT', value: defaultLangSys.reqFeatureIndex}]
                        .concat(ushortList('featureIndex', defaultLangSys.featureIndexes)))}
                    ].concat(recordList('langSys', script.langSysRecords, function(langSysRecord, i) {
                        var langSys = langSysRecord.langSys;
                        return [
                            {name: 'langSysTag' + i, type: 'TAG', value: langSysRecord.tag},
                            {name: 'langSys' + i, type: 'TABLE', value: new Table('langSys', [
                                {name: 'lookupOrder', type: 'USHORT', value: 0},
                                {name: 'reqFeatureIndex', type: 'USHORT', value: langSys.reqFeatureIndex}
                                ].concat(ushortList('featureIndex', langSys.featureIndexes)))}
                        ];
                    })))}
            ];
        })
    );
}
ScriptList.prototype = Object.create(Table.prototype);
ScriptList.prototype.constructor = ScriptList;

/**
 * @exports opentype.FeatureList
 * @class
 * @param {opentype.Table}
 * @constructor
 * @extends opentype.Table
 */
function FeatureList(featureListTable) {
    Table.call(this, 'featureListTable',
        recordList('featureRecord', featureListTable, function(featureRecord, i) {
            var feature = featureRecord.feature;
            return [
                {name: 'featureTag' + i, type: 'TAG', value: featureRecord.tag},
                {name: 'feature' + i, type: 'TABLE', value: new Table('featureTable', [
                    {name: 'featureParams', type: 'USHORT', value: feature.featureParams} ].concat(ushortList('lookupListIndex', feature.lookupListIndexes)))}
            ];
        })
    );
}
FeatureList.prototype = Object.create(Table.prototype);
FeatureList.prototype.constructor = FeatureList;

/**
 * @exports opentype.LookupList
 * @class
 * @param {opentype.Table}
 * @param {Object}
 * @constructor
 * @extends opentype.Table
 */
function LookupList(lookupListTable, subtableMakers) {
    Table.call(this, 'lookupListTable', tableList('lookup', lookupListTable, function(lookupTable) {
        var subtableCallback = subtableMakers[lookupTable.lookupType];
        check.assert(!!subtableCallback, 'Unable to write GSUB lookup type ' + lookupTable.lookupType + ' tables.');
        return new Table('lookupTable', [
            {name: 'lookupType', type: 'USHORT', value: lookupTable.lookupType},
            {name: 'lookupFlag', type: 'USHORT', value: lookupTable.lookupFlag}
        ].concat(tableList('subtable', lookupTable.subtables, subtableCallback)));
    }));
}
LookupList.prototype = Object.create(Table.prototype);
LookupList.prototype.constructor = LookupList;

// Record = same as Table, but inlined (a Table has an offset and its data is further in the stream)
// Don't use offsets inside Records (probable bug), only in Tables.
var table = {
    Table: Table,
    Record: Table,
    Coverage: Coverage,
    ScriptList: ScriptList,
    FeatureList: FeatureList,
    LookupList: LookupList,
    ushortList: ushortList,
    tableList: tableList,
    recordList: recordList,
};

// Parsing utility functions

// Retrieve an unsigned byte from the DataView.
function getByte(dataView, offset) {
    return dataView.getUint8(offset);
}

// Retrieve an unsigned 16-bit short from the DataView.
// The value is stored in big endian.
function getUShort(dataView, offset) {
    return dataView.getUint16(offset, false);
}

// Retrieve a signed 16-bit short from the DataView.
// The value is stored in big endian.
function getShort(dataView, offset) {
    return dataView.getInt16(offset, false);
}

// Retrieve an unsigned 32-bit long from the DataView.
// The value is stored in big endian.
function getULong(dataView, offset) {
    return dataView.getUint32(offset, false);
}

// Retrieve a 32-bit signed fixed-point number (16.16) from the DataView.
// The value is stored in big endian.
function getFixed(dataView, offset) {
    var decimal = dataView.getInt16(offset, false);
    var fraction = dataView.getUint16(offset + 2, false);
    return decimal + fraction / 65535;
}

// Retrieve a 4-character tag from the DataView.
// Tags are used to identify tables.
function getTag(dataView, offset) {
    var tag = '';
    for (var i = offset; i < offset + 4; i += 1) {
        tag += String.fromCharCode(dataView.getInt8(i));
    }

    return tag;
}

// Retrieve an offset from the DataView.
// Offsets are 1 to 4 bytes in length, depending on the offSize argument.
function getOffset(dataView, offset, offSize) {
    var v = 0;
    for (var i = 0; i < offSize; i += 1) {
        v <<= 8;
        v += dataView.getUint8(offset + i);
    }

    return v;
}

// Retrieve a number of bytes from start offset to the end offset from the DataView.
function getBytes(dataView, startOffset, endOffset) {
    var bytes = [];
    for (var i = startOffset; i < endOffset; i += 1) {
        bytes.push(dataView.getUint8(i));
    }

    return bytes;
}

// Convert the list of bytes to a string.
function bytesToString(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i += 1) {
        s += String.fromCharCode(bytes[i]);
    }

    return s;
}

var typeOffsets = {
    byte: 1,
    uShort: 2,
    short: 2,
    uLong: 4,
    fixed: 4,
    longDateTime: 8,
    tag: 4
};

// A stateful parser that changes the offset whenever a value is retrieved.
// The data is a DataView.
function Parser(data, offset) {
    this.data = data;
    this.offset = offset;
    this.relativeOffset = 0;
}

Parser.prototype.parseByte = function() {
    var v = this.data.getUint8(this.offset + this.relativeOffset);
    this.relativeOffset += 1;
    return v;
};

Parser.prototype.parseChar = function() {
    var v = this.data.getInt8(this.offset + this.relativeOffset);
    this.relativeOffset += 1;
    return v;
};

Parser.prototype.parseCard8 = Parser.prototype.parseByte;

Parser.prototype.parseUShort = function() {
    var v = this.data.getUint16(this.offset + this.relativeOffset);
    this.relativeOffset += 2;
    return v;
};

Parser.prototype.parseCard16 = Parser.prototype.parseUShort;
Parser.prototype.parseSID = Parser.prototype.parseUShort;
Parser.prototype.parseOffset16 = Parser.prototype.parseUShort;

Parser.prototype.parseShort = function() {
    var v = this.data.getInt16(this.offset + this.relativeOffset);
    this.relativeOffset += 2;
    return v;
};

Parser.prototype.parseF2Dot14 = function() {
    var v = this.data.getInt16(this.offset + this.relativeOffset) / 16384;
    this.relativeOffset += 2;
    return v;
};

Parser.prototype.parseULong = function() {
    var v = getULong(this.data, this.offset + this.relativeOffset);
    this.relativeOffset += 4;
    return v;
};

Parser.prototype.parseFixed = function() {
    var v = getFixed(this.data, this.offset + this.relativeOffset);
    this.relativeOffset += 4;
    return v;
};

Parser.prototype.parseString = function(length) {
    var dataView = this.data;
    var offset = this.offset + this.relativeOffset;
    var string = '';
    this.relativeOffset += length;
    for (var i = 0; i < length; i++) {
        string += String.fromCharCode(dataView.getUint8(offset + i));
    }

    return string;
};

Parser.prototype.parseTag = function() {
    return this.parseString(4);
};

// LONGDATETIME is a 64-bit integer.
// JavaScript and unix timestamps traditionally use 32 bits, so we
// only take the last 32 bits.
// + Since until 2038 those bits will be filled by zeros we can ignore them.
Parser.prototype.parseLongDateTime = function() {
    var v = getULong(this.data, this.offset + this.relativeOffset + 4);
    // Subtract seconds between 01/01/1904 and 01/01/1970
    // to convert Apple Mac timestamp to Standard Unix timestamp
    v -= 2082844800;
    this.relativeOffset += 8;
    return v;
};

Parser.prototype.parseVersion = function() {
    var major = getUShort(this.data, this.offset + this.relativeOffset);

    // How to interpret the minor version is very vague in the spec. 0x5000 is 5, 0x1000 is 1
    // This returns the correct number if minor = 0xN000 where N is 0-9
    var minor = getUShort(this.data, this.offset + this.relativeOffset + 2);
    this.relativeOffset += 4;
    return major + minor / 0x1000 / 10;
};

Parser.prototype.skip = function(type, amount) {
    if (amount === undefined) {
        amount = 1;
    }

    this.relativeOffset += typeOffsets[type] * amount;
};

///// Parsing lists and records ///////////////////////////////

// Parse a list of 16 bit unsigned integers. The length of the list can be read on the stream
// or provided as an argument.
Parser.prototype.parseOffset16List =
Parser.prototype.parseUShortList = function(count) {
    if (count === undefined) { count = this.parseUShort(); }
    var offsets = new Array(count);
    var dataView = this.data;
    var offset = this.offset + this.relativeOffset;
    for (var i = 0; i < count; i++) {
        offsets[i] = dataView.getUint16(offset);
        offset += 2;
    }

    this.relativeOffset += count * 2;
    return offsets;
};

// Parses a list of 16 bit signed integers.
Parser.prototype.parseShortList = function(count) {
    var list = new Array(count);
    var dataView = this.data;
    var offset = this.offset + this.relativeOffset;
    for (var i = 0; i < count; i++) {
        list[i] = dataView.getInt16(offset);
        offset += 2;
    }

    this.relativeOffset += count * 2;
    return list;
};

// Parses a list of bytes.
Parser.prototype.parseByteList = function(count) {
    var list = new Array(count);
    var dataView = this.data;
    var offset = this.offset + this.relativeOffset;
    for (var i = 0; i < count; i++) {
        list[i] = dataView.getUint8(offset++);
    }

    this.relativeOffset += count;
    return list;
};

/**
 * Parse a list of items.
 * Record count is optional, if omitted it is read from the stream.
 * itemCallback is one of the Parser methods.
 */
Parser.prototype.parseList = function(count, itemCallback) {
    var this$1 = this;

    if (!itemCallback) {
        itemCallback = count;
        count = this.parseUShort();
    }
    var list = new Array(count);
    for (var i = 0; i < count; i++) {
        list[i] = itemCallback.call(this$1);
    }
    return list;
};

/**
 * Parse a list of records.
 * Record count is optional, if omitted it is read from the stream.
 * Example of recordDescription: { sequenceIndex: Parser.uShort, lookupListIndex: Parser.uShort }
 */
Parser.prototype.parseRecordList = function(count, recordDescription) {
    var this$1 = this;

    // If the count argument is absent, read it in the stream.
    if (!recordDescription) {
        recordDescription = count;
        count = this.parseUShort();
    }
    var records = new Array(count);
    var fields = Object.keys(recordDescription);
    for (var i = 0; i < count; i++) {
        var rec = {};
        for (var j = 0; j < fields.length; j++) {
            var fieldName = fields[j];
            var fieldType = recordDescription[fieldName];
            rec[fieldName] = fieldType.call(this$1);
        }
        records[i] = rec;
    }
    return records;
};

// Parse a data structure into an object
// Example of description: { sequenceIndex: Parser.uShort, lookupListIndex: Parser.uShort }
Parser.prototype.parseStruct = function(description) {
    var this$1 = this;

    if (typeof description === 'function') {
        return description.call(this);
    } else {
        var fields = Object.keys(description);
        var struct = {};
        for (var j = 0; j < fields.length; j++) {
            var fieldName = fields[j];
            var fieldType = description[fieldName];
            struct[fieldName] = fieldType.call(this$1);
        }
        return struct;
    }
};

Parser.prototype.parsePointer = function(description) {
    var structOffset = this.parseOffset16();
    if (structOffset > 0) {                         // NULL offset => return undefined
        return new Parser(this.data, this.offset + structOffset).parseStruct(description);
    }
    return undefined;
};

/**
 * Parse a list of offsets to lists of 16-bit integers,
 * or a list of offsets to lists of offsets to any kind of items.
 * If itemCallback is not provided, a list of list of UShort is assumed.
 * If provided, itemCallback is called on each item and must parse the item.
 * See examples in tables/gsub.js
 */
Parser.prototype.parseListOfLists = function(itemCallback) {
    var this$1 = this;

    var offsets = this.parseOffset16List();
    var count = offsets.length;
    var relativeOffset = this.relativeOffset;
    var list = new Array(count);
    for (var i = 0; i < count; i++) {
        var start = offsets[i];
        if (start === 0) {                  // NULL offset
            list[i] = undefined;            // Add i as owned property to list. Convenient with assert.
            continue;
        }
        this$1.relativeOffset = start;
        if (itemCallback) {
            var subOffsets = this$1.parseOffset16List();
            var subList = new Array(subOffsets.length);
            for (var j = 0; j < subOffsets.length; j++) {
                this$1.relativeOffset = start + subOffsets[j];
                subList[j] = itemCallback.call(this$1);
            }
            list[i] = subList;
        } else {
            list[i] = this$1.parseUShortList();
        }
    }
    this.relativeOffset = relativeOffset;
    return list;
};

///// Complex tables parsing //////////////////////////////////

// Parse a coverage table in a GSUB, GPOS or GDEF table.
// https://www.microsoft.com/typography/OTSPEC/chapter2.htm
// parser.offset must point to the start of the table containing the coverage.
Parser.prototype.parseCoverage = function() {
    var this$1 = this;

    var startOffset = this.offset + this.relativeOffset;
    var format = this.parseUShort();
    var count = this.parseUShort();
    if (format === 1) {
        return {
            format: 1,
            glyphs: this.parseUShortList(count)
        };
    } else if (format === 2) {
        var ranges = new Array(count);
        for (var i = 0; i < count; i++) {
            ranges[i] = {
                start: this$1.parseUShort(),
                end: this$1.parseUShort(),
                index: this$1.parseUShort()
            };
        }
        return {
            format: 2,
            ranges: ranges
        };
    }
    throw new Error('0x' + startOffset.toString(16) + ': Coverage format must be 1 or 2.');
};

// Parse a Class Definition Table in a GSUB, GPOS or GDEF table.
// https://www.microsoft.com/typography/OTSPEC/chapter2.htm
Parser.prototype.parseClassDef = function() {
    var startOffset = this.offset + this.relativeOffset;
    var format = this.parseUShort();
    if (format === 1) {
        return {
            format: 1,
            startGlyph: this.parseUShort(),
            classes: this.parseUShortList()
        };
    } else if (format === 2) {
        return {
            format: 2,
            ranges: this.parseRecordList({
                start: Parser.uShort,
                end: Parser.uShort,
                classId: Parser.uShort
            })
        };
    }
    throw new Error('0x' + startOffset.toString(16) + ': ClassDef format must be 1 or 2.');
};

///// Static methods ///////////////////////////////////
// These convenience methods can be used as callbacks and should be called with "this" context set to a Parser instance.

Parser.list = function(count, itemCallback) {
    return function() {
        return this.parseList(count, itemCallback);
    };
};

Parser.recordList = function(count, recordDescription) {
    return function() {
        return this.parseRecordList(count, recordDescription);
    };
};

Parser.pointer = function(description) {
    return function() {
        return this.parsePointer(description);
    };
};

Parser.tag = Parser.prototype.parseTag;
Parser.byte = Parser.prototype.parseByte;
Parser.uShort = Parser.offset16 = Parser.prototype.parseUShort;
Parser.uShortList = Parser.prototype.parseUShortList;
Parser.struct = Parser.prototype.parseStruct;
Parser.coverage = Parser.prototype.parseCoverage;
Parser.classDef = Parser.prototype.parseClassDef;

///// Script, Feature, Lookup lists ///////////////////////////////////////////////
// https://www.microsoft.com/typography/OTSPEC/chapter2.htm

var langSysTable = {
    reserved: Parser.uShort,
    reqFeatureIndex: Parser.uShort,
    featureIndexes: Parser.uShortList
};

Parser.prototype.parseScriptList = function() {
    return this.parsePointer(Parser.recordList({
        tag: Parser.tag,
        script: Parser.pointer({
            defaultLangSys: Parser.pointer(langSysTable),
            langSysRecords: Parser.recordList({
                tag: Parser.tag,
                langSys: Parser.pointer(langSysTable)
            })
        })
    }));
};

Parser.prototype.parseFeatureList = function() {
    return this.parsePointer(Parser.recordList({
        tag: Parser.tag,
        feature: Parser.pointer({
            featureParams: Parser.offset16,
            lookupListIndexes: Parser.uShortList
        })
    }));
};

Parser.prototype.parseLookupList = function(lookupTableParsers) {
    return this.parsePointer(Parser.list(Parser.pointer(function() {
        var lookupType = this.parseUShort();
        check.argument(1 <= lookupType && lookupType <= 8, 'GSUB lookup type ' + lookupType + ' unknown.');
        var lookupFlag = this.parseUShort();
        var useMarkFilteringSet = lookupFlag & 0x10;
        return {
            lookupType: lookupType,
            lookupFlag: lookupFlag,
            subtables: this.parseList(Parser.pointer(lookupTableParsers[lookupType])),
            markFilteringSet: useMarkFilteringSet ? this.parseUShort() : undefined
        };
    })));
};

var parse = {
    getByte: getByte,
    getCard8: getByte,
    getUShort: getUShort,
    getCard16: getUShort,
    getShort: getShort,
    getULong: getULong,
    getFixed: getFixed,
    getTag: getTag,
    getOffset: getOffset,
    getBytes: getBytes,
    bytesToString: bytesToString,
    Parser: Parser,
};

// The `cmap` table stores the mappings from characters to glyphs.
// https://www.microsoft.com/typography/OTSPEC/cmap.htm

function parseCmapTableFormat12(cmap, p) {
    //Skip reserved.
    p.parseUShort();

    // Length in bytes of the sub-tables.
    cmap.length = p.parseULong();
    cmap.language = p.parseULong();

    var groupCount;
    cmap.groupCount = groupCount = p.parseULong();
    cmap.glyphIndexMap = {};

    for (var i = 0; i < groupCount; i += 1) {
        var startCharCode = p.parseULong();
        var endCharCode = p.parseULong();
        var startGlyphId = p.parseULong();

        for (var c = startCharCode; c <= endCharCode; c += 1) {
            cmap.glyphIndexMap[c] = startGlyphId;
            startGlyphId++;
        }
    }
}

function parseCmapTableFormat4(cmap, p, data, start, offset) {
    // Length in bytes of the sub-tables.
    cmap.length = p.parseUShort();
    cmap.language = p.parseUShort();

    // segCount is stored x 2.
    var segCount;
    cmap.segCount = segCount = p.parseUShort() >> 1;

    // Skip searchRange, entrySelector, rangeShift.
    p.skip('uShort', 3);

    // The "unrolled" mapping from character codes to glyph indices.
    cmap.glyphIndexMap = {};
    var endCountParser = new parse.Parser(data, start + offset + 14);
    var startCountParser = new parse.Parser(data, start + offset + 16 + segCount * 2);
    var idDeltaParser = new parse.Parser(data, start + offset + 16 + segCount * 4);
    var idRangeOffsetParser = new parse.Parser(data, start + offset + 16 + segCount * 6);
    var glyphIndexOffset = start + offset + 16 + segCount * 8;
    for (var i = 0; i < segCount - 1; i += 1) {
        var glyphIndex = (void 0);
        var endCount = endCountParser.parseUShort();
        var startCount = startCountParser.parseUShort();
        var idDelta = idDeltaParser.parseShort();
        var idRangeOffset = idRangeOffsetParser.parseUShort();
        for (var c = startCount; c <= endCount; c += 1) {
            if (idRangeOffset !== 0) {
                // The idRangeOffset is relative to the current position in the idRangeOffset array.
                // Take the current offset in the idRangeOffset array.
                glyphIndexOffset = (idRangeOffsetParser.offset + idRangeOffsetParser.relativeOffset - 2);

                // Add the value of the idRangeOffset, which will move us into the glyphIndex array.
                glyphIndexOffset += idRangeOffset;

                // Then add the character index of the current segment, multiplied by 2 for USHORTs.
                glyphIndexOffset += (c - startCount) * 2;
                glyphIndex = parse.getUShort(data, glyphIndexOffset);
                if (glyphIndex !== 0) {
                    glyphIndex = (glyphIndex + idDelta) & 0xFFFF;
                }
            } else {
                glyphIndex = (c + idDelta) & 0xFFFF;
            }

            cmap.glyphIndexMap[c] = glyphIndex;
        }
    }
}

// Parse the `cmap` table. This table stores the mappings from characters to glyphs.
// There are many available formats, but we only support the Windows format 4 and 12.
// This function returns a `CmapEncoding` object or null if no supported format could be found.
function parseCmapTable(data, start) {
    var cmap = {};
    cmap.version = parse.getUShort(data, start);
    check.argument(cmap.version === 0, 'cmap table version should be 0.');

    // The cmap table can contain many sub-tables, each with their own format.
    // We're only interested in a "platform 3" table. This is a Windows format.
    cmap.numTables = parse.getUShort(data, start + 2);
    var offset = -1;
    for (var i = cmap.numTables - 1; i >= 0; i -= 1) {
        var platformId = parse.getUShort(data, start + 4 + (i * 8));
        var encodingId = parse.getUShort(data, start + 4 + (i * 8) + 2);
        if (platformId === 3 && (encodingId === 0 || encodingId === 1 || encodingId === 10)) {
            offset = parse.getULong(data, start + 4 + (i * 8) + 4);
            break;
        }
    }

    if (offset === -1) {
        // There is no cmap table in the font that we support.
        throw new Error('No valid cmap sub-tables found.');
    }

    var p = new parse.Parser(data, start + offset);
    cmap.format = p.parseUShort();

    if (cmap.format === 12) {
        parseCmapTableFormat12(cmap, p);
    } else if (cmap.format === 4) {
        parseCmapTableFormat4(cmap, p, data, start, offset);
    } else {
        throw new Error('Only format 4 and 12 cmap tables are supported (found format ' + cmap.format + ').');
    }

    return cmap;
}

function addSegment(t, code, glyphIndex) {
    t.segments.push({
        end: code,
        start: code,
        delta: -(code - glyphIndex),
        offset: 0
    });
}

function addTerminatorSegment(t) {
    t.segments.push({
        end: 0xFFFF,
        start: 0xFFFF,
        delta: 1,
        offset: 0
    });
}

function makeCmapTable(glyphs) {
    var t = new table.Table('cmap', [
        {name: 'version', type: 'USHORT', value: 0},
        {name: 'numTables', type: 'USHORT', value: 1},
        {name: 'platformID', type: 'USHORT', value: 3},
        {name: 'encodingID', type: 'USHORT', value: 1},
        {name: 'offset', type: 'ULONG', value: 12},
        {name: 'format', type: 'USHORT', value: 4},
        {name: 'length', type: 'USHORT', value: 0},
        {name: 'language', type: 'USHORT', value: 0},
        {name: 'segCountX2', type: 'USHORT', value: 0},
        {name: 'searchRange', type: 'USHORT', value: 0},
        {name: 'entrySelector', type: 'USHORT', value: 0},
        {name: 'rangeShift', type: 'USHORT', value: 0}
    ]);

    t.segments = [];
    for (var i = 0; i < glyphs.length; i += 1) {
        var glyph = glyphs.get(i);
        for (var j = 0; j < glyph.unicodes.length; j += 1) {
            addSegment(t, glyph.unicodes[j], i);
        }

        t.segments = t.segments.sort(function(a, b) {
            return a.start - b.start;
        });
    }

    addTerminatorSegment(t);

    var segCount;
    segCount = t.segments.length;
    t.segCountX2 = segCount * 2;
    t.searchRange = Math.pow(2, Math.floor(Math.log(segCount) / Math.log(2))) * 2;
    t.entrySelector = Math.log(t.searchRange / 2) / Math.log(2);
    t.rangeShift = t.segCountX2 - t.searchRange;

    // Set up parallel segment arrays.
    var endCounts = [];
    var startCounts = [];
    var idDeltas = [];
    var idRangeOffsets = [];
    var glyphIds = [];

    for (var i$1 = 0; i$1 < segCount; i$1 += 1) {
        var segment = t.segments[i$1];
        endCounts = endCounts.concat({name: 'end_' + i$1, type: 'USHORT', value: segment.end});
        startCounts = startCounts.concat({name: 'start_' + i$1, type: 'USHORT', value: segment.start});
        idDeltas = idDeltas.concat({name: 'idDelta_' + i$1, type: 'SHORT', value: segment.delta});
        idRangeOffsets = idRangeOffsets.concat({name: 'idRangeOffset_' + i$1, type: 'USHORT', value: segment.offset});
        if (segment.glyphId !== undefined) {
            glyphIds = glyphIds.concat({name: 'glyph_' + i$1, type: 'USHORT', value: segment.glyphId});
        }
    }

    t.fields = t.fields.concat(endCounts);
    t.fields.push({name: 'reservedPad', type: 'USHORT', value: 0});
    t.fields = t.fields.concat(startCounts);
    t.fields = t.fields.concat(idDeltas);
    t.fields = t.fields.concat(idRangeOffsets);
    t.fields = t.fields.concat(glyphIds);

    t.length = 14 + // Subtable header
        endCounts.length * 2 +
        2 + // reservedPad
        startCounts.length * 2 +
        idDeltas.length * 2 +
        idRangeOffsets.length * 2 +
        glyphIds.length * 2;

    return t;
}

var cmap = { parse: parseCmapTable, make: makeCmapTable };

// Glyph encoding

var cffStandardStrings = [
    '.notdef', 'space', 'exclam', 'quotedbl', 'numbersign', 'dollar', 'percent', 'ampersand', 'quoteright',
    'parenleft', 'parenright', 'asterisk', 'plus', 'comma', 'hyphen', 'period', 'slash', 'zero', 'one', 'two',
    'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'colon', 'semicolon', 'less', 'equal', 'greater',
    'question', 'at', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S',
    'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'bracketleft', 'backslash', 'bracketright', 'asciicircum', 'underscore',
    'quoteleft', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
    'u', 'v', 'w', 'x', 'y', 'z', 'braceleft', 'bar', 'braceright', 'asciitilde', 'exclamdown', 'cent', 'sterling',
    'fraction', 'yen', 'florin', 'section', 'currency', 'quotesingle', 'quotedblleft', 'guillemotleft',
    'guilsinglleft', 'guilsinglright', 'fi', 'fl', 'endash', 'dagger', 'daggerdbl', 'periodcentered', 'paragraph',
    'bullet', 'quotesinglbase', 'quotedblbase', 'quotedblright', 'guillemotright', 'ellipsis', 'perthousand',
    'questiondown', 'grave', 'acute', 'circumflex', 'tilde', 'macron', 'breve', 'dotaccent', 'dieresis', 'ring',
    'cedilla', 'hungarumlaut', 'ogonek', 'caron', 'emdash', 'AE', 'ordfeminine', 'Lslash', 'Oslash', 'OE',
    'ordmasculine', 'ae', 'dotlessi', 'lslash', 'oslash', 'oe', 'germandbls', 'onesuperior', 'logicalnot', 'mu',
    'trademark', 'Eth', 'onehalf', 'plusminus', 'Thorn', 'onequarter', 'divide', 'brokenbar', 'degree', 'thorn',
    'threequarters', 'twosuperior', 'registered', 'minus', 'eth', 'multiply', 'threesuperior', 'copyright',
    'Aacute', 'Acircumflex', 'Adieresis', 'Agrave', 'Aring', 'Atilde', 'Ccedilla', 'Eacute', 'Ecircumflex',
    'Edieresis', 'Egrave', 'Iacute', 'Icircumflex', 'Idieresis', 'Igrave', 'Ntilde', 'Oacute', 'Ocircumflex',
    'Odieresis', 'Ograve', 'Otilde', 'Scaron', 'Uacute', 'Ucircumflex', 'Udieresis', 'Ugrave', 'Yacute',
    'Ydieresis', 'Zcaron', 'aacute', 'acircumflex', 'adieresis', 'agrave', 'aring', 'atilde', 'ccedilla', 'eacute',
    'ecircumflex', 'edieresis', 'egrave', 'iacute', 'icircumflex', 'idieresis', 'igrave', 'ntilde', 'oacute',
    'ocircumflex', 'odieresis', 'ograve', 'otilde', 'scaron', 'uacute', 'ucircumflex', 'udieresis', 'ugrave',
    'yacute', 'ydieresis', 'zcaron', 'exclamsmall', 'Hungarumlautsmall', 'dollaroldstyle', 'dollarsuperior',
    'ampersandsmall', 'Acutesmall', 'parenleftsuperior', 'parenrightsuperior', '266 ff', 'onedotenleader',
    'zerooldstyle', 'oneoldstyle', 'twooldstyle', 'threeoldstyle', 'fouroldstyle', 'fiveoldstyle', 'sixoldstyle',
    'sevenoldstyle', 'eightoldstyle', 'nineoldstyle', 'commasuperior', 'threequartersemdash', 'periodsuperior',
    'questionsmall', 'asuperior', 'bsuperior', 'centsuperior', 'dsuperior', 'esuperior', 'isuperior', 'lsuperior',
    'msuperior', 'nsuperior', 'osuperior', 'rsuperior', 'ssuperior', 'tsuperior', 'ff', 'ffi', 'ffl',
    'parenleftinferior', 'parenrightinferior', 'Circumflexsmall', 'hyphensuperior', 'Gravesmall', 'Asmall',
    'Bsmall', 'Csmall', 'Dsmall', 'Esmall', 'Fsmall', 'Gsmall', 'Hsmall', 'Ismall', 'Jsmall', 'Ksmall', 'Lsmall',
    'Msmall', 'Nsmall', 'Osmall', 'Psmall', 'Qsmall', 'Rsmall', 'Ssmall', 'Tsmall', 'Usmall', 'Vsmall', 'Wsmall',
    'Xsmall', 'Ysmall', 'Zsmall', 'colonmonetary', 'onefitted', 'rupiah', 'Tildesmall', 'exclamdownsmall',
    'centoldstyle', 'Lslashsmall', 'Scaronsmall', 'Zcaronsmall', 'Dieresissmall', 'Brevesmall', 'Caronsmall',
    'Dotaccentsmall', 'Macronsmall', 'figuredash', 'hypheninferior', 'Ogoneksmall', 'Ringsmall', 'Cedillasmall',
    'questiondownsmall', 'oneeighth', 'threeeighths', 'fiveeighths', 'seveneighths', 'onethird', 'twothirds',
    'zerosuperior', 'foursuperior', 'fivesuperior', 'sixsuperior', 'sevensuperior', 'eightsuperior', 'ninesuperior',
    'zeroinferior', 'oneinferior', 'twoinferior', 'threeinferior', 'fourinferior', 'fiveinferior', 'sixinferior',
    'seveninferior', 'eightinferior', 'nineinferior', 'centinferior', 'dollarinferior', 'periodinferior',
    'commainferior', 'Agravesmall', 'Aacutesmall', 'Acircumflexsmall', 'Atildesmall', 'Adieresissmall',
    'Aringsmall', 'AEsmall', 'Ccedillasmall', 'Egravesmall', 'Eacutesmall', 'Ecircumflexsmall', 'Edieresissmall',
    'Igravesmall', 'Iacutesmall', 'Icircumflexsmall', 'Idieresissmall', 'Ethsmall', 'Ntildesmall', 'Ogravesmall',
    'Oacutesmall', 'Ocircumflexsmall', 'Otildesmall', 'Odieresissmall', 'OEsmall', 'Oslashsmall', 'Ugravesmall',
    'Uacutesmall', 'Ucircumflexsmall', 'Udieresissmall', 'Yacutesmall', 'Thornsmall', 'Ydieresissmall', '001.000',
    '001.001', '001.002', '001.003', 'Black', 'Bold', 'Book', 'Light', 'Medium', 'Regular', 'Roman', 'Semibold'];

var cffStandardEncoding = [
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    '', '', '', '', 'space', 'exclam', 'quotedbl', 'numbersign', 'dollar', 'percent', 'ampersand', 'quoteright',
    'parenleft', 'parenright', 'asterisk', 'plus', 'comma', 'hyphen', 'period', 'slash', 'zero', 'one', 'two',
    'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'colon', 'semicolon', 'less', 'equal', 'greater',
    'question', 'at', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S',
    'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'bracketleft', 'backslash', 'bracketright', 'asciicircum', 'underscore',
    'quoteleft', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
    'u', 'v', 'w', 'x', 'y', 'z', 'braceleft', 'bar', 'braceright', 'asciitilde', '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    'exclamdown', 'cent', 'sterling', 'fraction', 'yen', 'florin', 'section', 'currency', 'quotesingle',
    'quotedblleft', 'guillemotleft', 'guilsinglleft', 'guilsinglright', 'fi', 'fl', '', 'endash', 'dagger',
    'daggerdbl', 'periodcentered', '', 'paragraph', 'bullet', 'quotesinglbase', 'quotedblbase', 'quotedblright',
    'guillemotright', 'ellipsis', 'perthousand', '', 'questiondown', '', 'grave', 'acute', 'circumflex', 'tilde',
    'macron', 'breve', 'dotaccent', 'dieresis', '', 'ring', 'cedilla', '', 'hungarumlaut', 'ogonek', 'caron',
    'emdash', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'AE', '', 'ordfeminine', '', '', '',
    '', 'Lslash', 'Oslash', 'OE', 'ordmasculine', '', '', '', '', '', 'ae', '', '', '', 'dotlessi', '', '',
    'lslash', 'oslash', 'oe', 'germandbls'];

var cffExpertEncoding = [
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    '', '', '', '', 'space', 'exclamsmall', 'Hungarumlautsmall', '', 'dollaroldstyle', 'dollarsuperior',
    'ampersandsmall', 'Acutesmall', 'parenleftsuperior', 'parenrightsuperior', 'twodotenleader', 'onedotenleader',
    'comma', 'hyphen', 'period', 'fraction', 'zerooldstyle', 'oneoldstyle', 'twooldstyle', 'threeoldstyle',
    'fouroldstyle', 'fiveoldstyle', 'sixoldstyle', 'sevenoldstyle', 'eightoldstyle', 'nineoldstyle', 'colon',
    'semicolon', 'commasuperior', 'threequartersemdash', 'periodsuperior', 'questionsmall', '', 'asuperior',
    'bsuperior', 'centsuperior', 'dsuperior', 'esuperior', '', '', 'isuperior', '', '', 'lsuperior', 'msuperior',
    'nsuperior', 'osuperior', '', '', 'rsuperior', 'ssuperior', 'tsuperior', '', 'ff', 'fi', 'fl', 'ffi', 'ffl',
    'parenleftinferior', '', 'parenrightinferior', 'Circumflexsmall', 'hyphensuperior', 'Gravesmall', 'Asmall',
    'Bsmall', 'Csmall', 'Dsmall', 'Esmall', 'Fsmall', 'Gsmall', 'Hsmall', 'Ismall', 'Jsmall', 'Ksmall', 'Lsmall',
    'Msmall', 'Nsmall', 'Osmall', 'Psmall', 'Qsmall', 'Rsmall', 'Ssmall', 'Tsmall', 'Usmall', 'Vsmall', 'Wsmall',
    'Xsmall', 'Ysmall', 'Zsmall', 'colonmonetary', 'onefitted', 'rupiah', 'Tildesmall', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    'exclamdownsmall', 'centoldstyle', 'Lslashsmall', '', '', 'Scaronsmall', 'Zcaronsmall', 'Dieresissmall',
    'Brevesmall', 'Caronsmall', '', 'Dotaccentsmall', '', '', 'Macronsmall', '', '', 'figuredash', 'hypheninferior',
    '', '', 'Ogoneksmall', 'Ringsmall', 'Cedillasmall', '', '', '', 'onequarter', 'onehalf', 'threequarters',
    'questiondownsmall', 'oneeighth', 'threeeighths', 'fiveeighths', 'seveneighths', 'onethird', 'twothirds', '',
    '', 'zerosuperior', 'onesuperior', 'twosuperior', 'threesuperior', 'foursuperior', 'fivesuperior',
    'sixsuperior', 'sevensuperior', 'eightsuperior', 'ninesuperior', 'zeroinferior', 'oneinferior', 'twoinferior',
    'threeinferior', 'fourinferior', 'fiveinferior', 'sixinferior', 'seveninferior', 'eightinferior',
    'nineinferior', 'centinferior', 'dollarinferior', 'periodinferior', 'commainferior', 'Agravesmall',
    'Aacutesmall', 'Acircumflexsmall', 'Atildesmall', 'Adieresissmall', 'Aringsmall', 'AEsmall', 'Ccedillasmall',
    'Egravesmall', 'Eacutesmall', 'Ecircumflexsmall', 'Edieresissmall', 'Igravesmall', 'Iacutesmall',
    'Icircumflexsmall', 'Idieresissmall', 'Ethsmall', 'Ntildesmall', 'Ogravesmall', 'Oacutesmall',
    'Ocircumflexsmall', 'Otildesmall', 'Odieresissmall', 'OEsmall', 'Oslashsmall', 'Ugravesmall', 'Uacutesmall',
    'Ucircumflexsmall', 'Udieresissmall', 'Yacutesmall', 'Thornsmall', 'Ydieresissmall'];

var standardNames = [
    '.notdef', '.null', 'nonmarkingreturn', 'space', 'exclam', 'quotedbl', 'numbersign', 'dollar', 'percent',
    'ampersand', 'quotesingle', 'parenleft', 'parenright', 'asterisk', 'plus', 'comma', 'hyphen', 'period', 'slash',
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'colon', 'semicolon', 'less',
    'equal', 'greater', 'question', 'at', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
    'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'bracketleft', 'backslash', 'bracketright',
    'asciicircum', 'underscore', 'grave', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
    'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'braceleft', 'bar', 'braceright', 'asciitilde',
    'Adieresis', 'Aring', 'Ccedilla', 'Eacute', 'Ntilde', 'Odieresis', 'Udieresis', 'aacute', 'agrave',
    'acircumflex', 'adieresis', 'atilde', 'aring', 'ccedilla', 'eacute', 'egrave', 'ecircumflex', 'edieresis',
    'iacute', 'igrave', 'icircumflex', 'idieresis', 'ntilde', 'oacute', 'ograve', 'ocircumflex', 'odieresis',
    'otilde', 'uacute', 'ugrave', 'ucircumflex', 'udieresis', 'dagger', 'degree', 'cent', 'sterling', 'section',
    'bullet', 'paragraph', 'germandbls', 'registered', 'copyright', 'trademark', 'acute', 'dieresis', 'notequal',
    'AE', 'Oslash', 'infinity', 'plusminus', 'lessequal', 'greaterequal', 'yen', 'mu', 'partialdiff', 'summation',
    'product', 'pi', 'integral', 'ordfeminine', 'ordmasculine', 'Omega', 'ae', 'oslash', 'questiondown',
    'exclamdown', 'logicalnot', 'radical', 'florin', 'approxequal', 'Delta', 'guillemotleft', 'guillemotright',
    'ellipsis', 'nonbreakingspace', 'Agrave', 'Atilde', 'Otilde', 'OE', 'oe', 'endash', 'emdash', 'quotedblleft',
    'quotedblright', 'quoteleft', 'quoteright', 'divide', 'lozenge', 'ydieresis', 'Ydieresis', 'fraction',
    'currency', 'guilsinglleft', 'guilsinglright', 'fi', 'fl', 'daggerdbl', 'periodcentered', 'quotesinglbase',
    'quotedblbase', 'perthousand', 'Acircumflex', 'Ecircumflex', 'Aacute', 'Edieresis', 'Egrave', 'Iacute',
    'Icircumflex', 'Idieresis', 'Igrave', 'Oacute', 'Ocircumflex', 'apple', 'Ograve', 'Uacute', 'Ucircumflex',
    'Ugrave', 'dotlessi', 'circumflex', 'tilde', 'macron', 'breve', 'dotaccent', 'ring', 'cedilla', 'hungarumlaut',
    'ogonek', 'caron', 'Lslash', 'lslash', 'Scaron', 'scaron', 'Zcaron', 'zcaron', 'brokenbar', 'Eth', 'eth',
    'Yacute', 'yacute', 'Thorn', 'thorn', 'minus', 'multiply', 'onesuperior', 'twosuperior', 'threesuperior',
    'onehalf', 'onequarter', 'threequarters', 'franc', 'Gbreve', 'gbreve', 'Idotaccent', 'Scedilla', 'scedilla',
    'Cacute', 'cacute', 'Ccaron', 'ccaron', 'dcroat'];

/**
 * This is the encoding used for fonts created from scratch.
 * It loops through all glyphs and finds the appropriate unicode value.
 * Since it's linear time, other encodings will be faster.
 * @exports opentype.DefaultEncoding
 * @class
 * @constructor
 * @param {opentype.Font}
 */
function DefaultEncoding(font) {
    this.font = font;
}

DefaultEncoding.prototype.charToGlyphIndex = function(c) {
    var code = c.charCodeAt(0);
    var glyphs = this.font.glyphs;
    if (glyphs) {
        for (var i = 0; i < glyphs.length; i += 1) {
            var glyph = glyphs.get(i);
            for (var j = 0; j < glyph.unicodes.length; j += 1) {
                if (glyph.unicodes[j] === code) {
                    return i;
                }
            }
        }
    }
    return null;
};

/**
 * @exports opentype.CmapEncoding
 * @class
 * @constructor
 * @param {Object} cmap - a object with the cmap encoded data
 */
function CmapEncoding(cmap) {
    this.cmap = cmap;
}

/**
 * @param  {string} c - the character
 * @return {number} The glyph index.
 */
CmapEncoding.prototype.charToGlyphIndex = function(c) {
    return this.cmap.glyphIndexMap[c.charCodeAt(0)] || 0;
};

/**
 * @exports opentype.CffEncoding
 * @class
 * @constructor
 * @param {string} encoding - The encoding
 * @param {Array} charset - The character set.
 */
function CffEncoding(encoding, charset) {
    this.encoding = encoding;
    this.charset = charset;
}

/**
 * @param  {string} s - The character
 * @return {number} The index.
 */
CffEncoding.prototype.charToGlyphIndex = function(s) {
    var code = s.charCodeAt(0);
    var charName = this.encoding[code];
    return this.charset.indexOf(charName);
};

/**
 * @exports opentype.GlyphNames
 * @class
 * @constructor
 * @param {Object} post
 */
function GlyphNames(post) {
    var this$1 = this;

    switch (post.version) {
        case 1:
            this.names = standardNames.slice();
            break;
        case 2:
            this.names = new Array(post.numberOfGlyphs);
            for (var i = 0; i < post.numberOfGlyphs; i++) {
                if (post.glyphNameIndex[i] < standardNames.length) {
                    this$1.names[i] = standardNames[post.glyphNameIndex[i]];
                } else {
                    this$1.names[i] = post.names[post.glyphNameIndex[i] - standardNames.length];
                }
            }

            break;
        case 2.5:
            this.names = new Array(post.numberOfGlyphs);
            for (var i$1 = 0; i$1 < post.numberOfGlyphs; i$1++) {
                this$1.names[i$1] = standardNames[i$1 + post.glyphNameIndex[i$1]];
            }

            break;
        case 3:
            this.names = [];
            break;
        default:
            this.names = [];
            break;
    }
}

/**
 * Gets the index of a glyph by name.
 * @param  {string} name - The glyph name
 * @return {number} The index
 */
GlyphNames.prototype.nameToGlyphIndex = function(name) {
    return this.names.indexOf(name);
};

/**
 * @param  {number} gid
 * @return {string}
 */
GlyphNames.prototype.glyphIndexToName = function(gid) {
    return this.names[gid];
};

/**
 * @alias opentype.addGlyphNames
 * @param {opentype.Font}
 */
function addGlyphNames(font) {
    var glyph;
    var glyphIndexMap = font.tables.cmap.glyphIndexMap;
    var charCodes = Object.keys(glyphIndexMap);

    for (var i = 0; i < charCodes.length; i += 1) {
        var c = charCodes[i];
        var glyphIndex = glyphIndexMap[c];
        glyph = font.glyphs.get(glyphIndex);
        glyph.addUnicode(parseInt(c));
    }

    for (var i$1 = 0; i$1 < font.glyphs.length; i$1 += 1) {
        glyph = font.glyphs.get(i$1);
        if (font.cffEncoding) {
            if (font.isCIDFont) {
                glyph.name = 'gid' + i$1;
            } else {
                glyph.name = font.cffEncoding.charset[i$1];
            }
        } else if (font.glyphNames.names) {
            glyph.name = font.glyphNames.glyphIndexToName(i$1);
        }
    }
}

// Drawing utility functions.

// Draw a line on the given context from point `x1,y1` to point `x2,y2`.
function line(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

var draw = { line: line };

// The `glyf` table describes the glyphs in TrueType outline format.
// http://www.microsoft.com/typography/otspec/glyf.htm

// Parse the coordinate data for a glyph.
function parseGlyphCoordinate(p, flag, previousValue, shortVectorBitMask, sameBitMask) {
    var v;
    if ((flag & shortVectorBitMask) > 0) {
        // The coordinate is 1 byte long.
        v = p.parseByte();
        // The `same` bit is re-used for short values to signify the sign of the value.
        if ((flag & sameBitMask) === 0) {
            v = -v;
        }

        v = previousValue + v;
    } else {
        //  The coordinate is 2 bytes long.
        // If the `same` bit is set, the coordinate is the same as the previous coordinate.
        if ((flag & sameBitMask) > 0) {
            v = previousValue;
        } else {
            // Parse the coordinate as a signed 16-bit delta value.
            v = previousValue + p.parseShort();
        }
    }

    return v;
}

// Parse a TrueType glyph.
function parseGlyph(glyph, data, start) {
    var p = new parse.Parser(data, start);
    glyph.numberOfContours = p.parseShort();
    glyph._xMin = p.parseShort();
    glyph._yMin = p.parseShort();
    glyph._xMax = p.parseShort();
    glyph._yMax = p.parseShort();
    var flags;
    var flag;

    if (glyph.numberOfContours > 0) {
        // This glyph is not a composite.
        var endPointIndices = glyph.endPointIndices = [];
        for (var i = 0; i < glyph.numberOfContours; i += 1) {
            endPointIndices.push(p.parseUShort());
        }

        glyph.instructionLength = p.parseUShort();
        glyph.instructions = [];
        for (var i$1 = 0; i$1 < glyph.instructionLength; i$1 += 1) {
            glyph.instructions.push(p.parseByte());
        }

        var numberOfCoordinates = endPointIndices[endPointIndices.length - 1] + 1;
        flags = [];
        for (var i$2 = 0; i$2 < numberOfCoordinates; i$2 += 1) {
            flag = p.parseByte();
            flags.push(flag);
            // If bit 3 is set, we repeat this flag n times, where n is the next byte.
            if ((flag & 8) > 0) {
                var repeatCount = p.parseByte();
                for (var j = 0; j < repeatCount; j += 1) {
                    flags.push(flag);
                    i$2 += 1;
                }
            }
        }

        check.argument(flags.length === numberOfCoordinates, 'Bad flags.');

        if (endPointIndices.length > 0) {
            var points = [];
            var point;
            // X/Y coordinates are relative to the previous point, except for the first point which is relative to 0,0.
            if (numberOfCoordinates > 0) {
                for (var i$3 = 0; i$3 < numberOfCoordinates; i$3 += 1) {
                    flag = flags[i$3];
                    point = {};
                    point.onCurve = !!(flag & 1);
                    point.lastPointOfContour = endPointIndices.indexOf(i$3) >= 0;
                    points.push(point);
                }

                var px = 0;
                for (var i$4 = 0; i$4 < numberOfCoordinates; i$4 += 1) {
                    flag = flags[i$4];
                    point = points[i$4];
                    point.x = parseGlyphCoordinate(p, flag, px, 2, 16);
                    px = point.x;
                }

                var py = 0;
                for (var i$5 = 0; i$5 < numberOfCoordinates; i$5 += 1) {
                    flag = flags[i$5];
                    point = points[i$5];
                    point.y = parseGlyphCoordinate(p, flag, py, 4, 32);
                    py = point.y;
                }
            }

            glyph.points = points;
        } else {
            glyph.points = [];
        }
    } else if (glyph.numberOfContours === 0) {
        glyph.points = [];
    } else {
        glyph.isComposite = true;
        glyph.points = [];
        glyph.components = [];
        var moreComponents = true;
        while (moreComponents) {
            flags = p.parseUShort();
            var component = {
                glyphIndex: p.parseUShort(),
                xScale: 1,
                scale01: 0,
                scale10: 0,
                yScale: 1,
                dx: 0,
                dy: 0
            };
            if ((flags & 1) > 0) {
                // The arguments are words
                if ((flags & 2) > 0) {
                    // values are offset
                    component.dx = p.parseShort();
                    component.dy = p.parseShort();
                } else {
                    // values are matched points
                    component.matchedPoints = [p.parseUShort(), p.parseUShort()];
                }

            } else {
                // The arguments are bytes
                if ((flags & 2) > 0) {
                    // values are offset
                    component.dx = p.parseChar();
                    component.dy = p.parseChar();
                } else {
                    // values are matched points
                    component.matchedPoints = [p.parseByte(), p.parseByte()];
                }
            }

            if ((flags & 8) > 0) {
                // We have a scale
                component.xScale = component.yScale = p.parseF2Dot14();
            } else if ((flags & 64) > 0) {
                // We have an X / Y scale
                component.xScale = p.parseF2Dot14();
                component.yScale = p.parseF2Dot14();
            } else if ((flags & 128) > 0) {
                // We have a 2x2 transformation
                component.xScale = p.parseF2Dot14();
                component.scale01 = p.parseF2Dot14();
                component.scale10 = p.parseF2Dot14();
                component.yScale = p.parseF2Dot14();
            }

            glyph.components.push(component);
            moreComponents = !!(flags & 32);
        }
        if (flags & 0x100) {
            // We have instructions
            glyph.instructionLength = p.parseUShort();
            glyph.instructions = [];
            for (var i$6 = 0; i$6 < glyph.instructionLength; i$6 += 1) {
                glyph.instructions.push(p.parseByte());
            }
        }
    }
}

// Transform an array of points and return a new array.
function transformPoints(points, transform) {
    var newPoints = [];
    for (var i = 0; i < points.length; i += 1) {
        var pt = points[i];
        var newPt = {
            x: transform.xScale * pt.x + transform.scale01 * pt.y + transform.dx,
            y: transform.scale10 * pt.x + transform.yScale * pt.y + transform.dy,
            onCurve: pt.onCurve,
            lastPointOfContour: pt.lastPointOfContour
        };
        newPoints.push(newPt);
    }

    return newPoints;
}

function getContours(points) {
    var contours = [];
    var currentContour = [];
    for (var i = 0; i < points.length; i += 1) {
        var pt = points[i];
        currentContour.push(pt);
        if (pt.lastPointOfContour) {
            contours.push(currentContour);
            currentContour = [];
        }
    }

    check.argument(currentContour.length === 0, 'There are still points left in the current contour.');
    return contours;
}

// Convert the TrueType glyph outline to a Path.
function getPath(points) {
    var p = new Path();
    if (!points) {
        return p;
    }

    var contours = getContours(points);

    for (var contourIndex = 0; contourIndex < contours.length; ++contourIndex) {
        var contour = contours[contourIndex];

        var prev = null;
        var curr = contour[contour.length - 1];
        var next = contour[0];

        if (curr.onCurve) {
            p.moveTo(curr.x, curr.y);
        } else {
            if (next.onCurve) {
                p.moveTo(next.x, next.y);
            } else {
                // If both first and last points are off-curve, start at their middle.
                var start = {x: (curr.x + next.x) * 0.5, y: (curr.y + next.y) * 0.5};
                p.moveTo(start.x, start.y);
            }
        }

        for (var i = 0; i < contour.length; ++i) {
            prev = curr;
            curr = next;
            next = contour[(i + 1) % contour.length];

            if (curr.onCurve) {
                // This is a straight line.
                p.lineTo(curr.x, curr.y);
            } else {
                var prev2 = prev;
                var next2 = next;

                if (!prev.onCurve) {
                    prev2 = { x: (curr.x + prev.x) * 0.5, y: (curr.y + prev.y) * 0.5 };
                    p.lineTo(prev2.x, prev2.y);
                }

                if (!next.onCurve) {
                    next2 = { x: (curr.x + next.x) * 0.5, y: (curr.y + next.y) * 0.5 };
                }

                p.lineTo(prev2.x, prev2.y);
                p.quadraticCurveTo(curr.x, curr.y, next2.x, next2.y);
            }
        }

        p.closePath();
    }
    return p;
}

function buildPath(glyphs, glyph) {
    if (glyph.isComposite) {
        for (var j = 0; j < glyph.components.length; j += 1) {
            var component = glyph.components[j];
            var componentGlyph = glyphs.get(component.glyphIndex);
            // Force the ttfGlyphLoader to parse the glyph.
            componentGlyph.getPath();
            if (componentGlyph.points) {
                var transformedPoints = (void 0);
                if (component.matchedPoints === undefined) {
                    // component positioned by offset
                    transformedPoints = transformPoints(componentGlyph.points, component);
                } else {
                    // component positioned by matched points
                    if ((component.matchedPoints[0] > glyph.points.length - 1) ||
                        (component.matchedPoints[1] > componentGlyph.points.length - 1)) {
                        throw Error('Matched points out of range in ' + glyph.name);
                    }
                    var firstPt = glyph.points[component.matchedPoints[0]];
                    var secondPt = componentGlyph.points[component.matchedPoints[1]];
                    var transform = {
                        xScale: component.xScale, scale01: component.scale01,
                        scale10: component.scale10, yScale: component.yScale,
                        dx: 0, dy: 0
                    };
                    secondPt = transformPoints([secondPt], transform)[0];
                    transform.dx = firstPt.x - secondPt.x;
                    transform.dy = firstPt.y - secondPt.y;
                    transformedPoints = transformPoints(componentGlyph.points, transform);
                }
                glyph.points = glyph.points.concat(transformedPoints);
            }
        }
    }

    return getPath(glyph.points);
}

// Parse all the glyphs according to the offsets from the `loca` table.
function parseGlyfTable(data, start, loca, font) {
    var glyphs = new glyphset.GlyphSet(font);

    // The last element of the loca table is invalid.
    for (var i = 0; i < loca.length - 1; i += 1) {
        var offset = loca[i];
        var nextOffset = loca[i + 1];
        if (offset !== nextOffset) {
            glyphs.push(i, glyphset.ttfGlyphLoader(font, i, parseGlyph, data, start + offset, buildPath));
        } else {
            glyphs.push(i, glyphset.glyphLoader(font, i));
        }
    }

    return glyphs;
}

var glyf = { getPath: getPath, parse: parseGlyfTable };

// The Glyph object

function getPathDefinition(glyph, path) {
    var _path = path || {commands: []};
    return {
        configurable: true,

        get: function() {
            if (typeof _path === 'function') {
                _path = _path();
            }

            return _path;
        },

        set: function(p) {
            _path = p;
        }
    };
}
/**
 * @typedef GlyphOptions
 * @type Object
 * @property {string} [name] - The glyph name
 * @property {number} [unicode]
 * @property {Array} [unicodes]
 * @property {number} [xMin]
 * @property {number} [yMin]
 * @property {number} [xMax]
 * @property {number} [yMax]
 * @property {number} [advanceWidth]
 */

// A Glyph is an individual mark that often corresponds to a character.
// Some glyphs, such as ligatures, are a combination of many characters.
// Glyphs are the basic building blocks of a font.
//
// The `Glyph` class contains utility methods for drawing the path and its points.
/**
 * @exports opentype.Glyph
 * @class
 * @param {GlyphOptions}
 * @constructor
 */
function Glyph(options) {
    // By putting all the code on a prototype function (which is only declared once)
    // we reduce the memory requirements for larger fonts by some 2%
    this.bindConstructorValues(options);
}

/**
 * @param  {GlyphOptions}
 */
Glyph.prototype.bindConstructorValues = function(options) {
    this.index = options.index || 0;

    // These three values cannot be deferred for memory optimization:
    this.name = options.name || null;
    this.unicode = options.unicode || undefined;
    this.unicodes = options.unicodes || options.unicode !== undefined ? [options.unicode] : [];

    // But by binding these values only when necessary, we reduce can
    // the memory requirements by almost 3% for larger fonts.
    if (options.xMin) {
        this.xMin = options.xMin;
    }

    if (options.yMin) {
        this.yMin = options.yMin;
    }

    if (options.xMax) {
        this.xMax = options.xMax;
    }

    if (options.yMax) {
        this.yMax = options.yMax;
    }

    if (options.advanceWidth) {
        this.advanceWidth = options.advanceWidth;
    }

    // The path for a glyph is the most memory intensive, and is bound as a value
    // with a getter/setter to ensure we actually do path parsing only once the
    // path is actually needed by anything.
    Object.defineProperty(this, 'path', getPathDefinition(this, options.path));
};

/**
 * @param {number}
 */
Glyph.prototype.addUnicode = function(unicode) {
    if (this.unicodes.length === 0) {
        this.unicode = unicode;
    }

    this.unicodes.push(unicode);
};

/**
 * Calculate the minimum bounding box for this glyph.
 * @return {opentype.BoundingBox}
 */
Glyph.prototype.getBoundingBox = function() {
    return this.path.getBoundingBox();
};

/**
 * Convert the glyph to a Path we can draw on a drawing context.
 * @param  {number} [x=0] - Horizontal position of the beginning of the text.
 * @param  {number} [y=0] - Vertical position of the *baseline* of the text.
 * @param  {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 * @param  {Object=} options - xScale, yScale to stretch the glyph.
 * @param  {opentype.Font} if hinting is to be used, the font
 * @return {opentype.Path}
 */
Glyph.prototype.getPath = function(x, y, fontSize, options, font) {
    x = x !== undefined ? x : 0;
    y = y !== undefined ? y : 0;
    fontSize = fontSize !== undefined ? fontSize : 72;
    var commands;
    var hPoints;
    if (!options) { options = { }; }
    var xScale = options.xScale;
    var yScale = options.yScale;

    if (options.hinting && font && font.hinting) {
        // in case of hinting, the hinting engine takes care
        // of scaling the points (not the path) before hinting.
        hPoints = this.path && font.hinting.exec(this, fontSize);
        // in case the hinting engine failed hPoints is undefined
        // and thus reverts to plain rending
    }

    if (hPoints) {
        commands = glyf.getPath(hPoints).commands;
        x = Math.round(x);
        y = Math.round(y);
        // TODO in case of hinting xyScaling is not yet supported
        xScale = yScale = 1;
    } else {
        commands = this.path.commands;
        var scale = 1 / this.path.unitsPerEm * fontSize;
        if (xScale === undefined) { xScale = scale; }
        if (yScale === undefined) { yScale = scale; }
    }

    var p = new Path();
    for (var i = 0; i < commands.length; i += 1) {
        var cmd = commands[i];
        if (cmd.type === 'M') {
            p.moveTo(x + (cmd.x * xScale), y + (-cmd.y * yScale));
        } else if (cmd.type === 'L') {
            p.lineTo(x + (cmd.x * xScale), y + (-cmd.y * yScale));
        } else if (cmd.type === 'Q') {
            p.quadraticCurveTo(x + (cmd.x1 * xScale), y + (-cmd.y1 * yScale),
                               x + (cmd.x * xScale), y + (-cmd.y * yScale));
        } else if (cmd.type === 'C') {
            p.curveTo(x + (cmd.x1 * xScale), y + (-cmd.y1 * yScale),
                      x + (cmd.x2 * xScale), y + (-cmd.y2 * yScale),
                      x + (cmd.x * xScale), y + (-cmd.y * yScale));
        } else if (cmd.type === 'Z') {
            p.closePath();
        }
    }

    return p;
};

/**
 * Split the glyph into contours.
 * This function is here for backwards compatibility, and to
 * provide raw access to the TrueType glyph outlines.
 * @return {Array}
 */
Glyph.prototype.getContours = function() {
    var this$1 = this;

    if (this.points === undefined) {
        return [];
    }

    var contours = [];
    var currentContour = [];
    for (var i = 0; i < this.points.length; i += 1) {
        var pt = this$1.points[i];
        currentContour.push(pt);
        if (pt.lastPointOfContour) {
            contours.push(currentContour);
            currentContour = [];
        }
    }

    check.argument(currentContour.length === 0, 'There are still points left in the current contour.');
    return contours;
};

/**
 * Calculate the xMin/yMin/xMax/yMax/lsb/rsb for a Glyph.
 * @return {Object}
 */
Glyph.prototype.getMetrics = function() {
    var commands = this.path.commands;
    var xCoords = [];
    var yCoords = [];
    for (var i = 0; i < commands.length; i += 1) {
        var cmd = commands[i];
        if (cmd.type !== 'Z') {
            xCoords.push(cmd.x);
            yCoords.push(cmd.y);
        }

        if (cmd.type === 'Q' || cmd.type === 'C') {
            xCoords.push(cmd.x1);
            yCoords.push(cmd.y1);
        }

        if (cmd.type === 'C') {
            xCoords.push(cmd.x2);
            yCoords.push(cmd.y2);
        }
    }

    var metrics = {
        xMin: Math.min.apply(null, xCoords),
        yMin: Math.min.apply(null, yCoords),
        xMax: Math.max.apply(null, xCoords),
        yMax: Math.max.apply(null, yCoords),
        leftSideBearing: this.leftSideBearing
    };

    if (!isFinite(metrics.xMin)) {
        metrics.xMin = 0;
    }

    if (!isFinite(metrics.xMax)) {
        metrics.xMax = this.advanceWidth;
    }

    if (!isFinite(metrics.yMin)) {
        metrics.yMin = 0;
    }

    if (!isFinite(metrics.yMax)) {
        metrics.yMax = 0;
    }

    metrics.rightSideBearing = this.advanceWidth - metrics.leftSideBearing - (metrics.xMax - metrics.xMin);
    return metrics;
};

/**
 * Draw the glyph on the given context.
 * @param  {CanvasRenderingContext2D} ctx - A 2D drawing context, like Canvas.
 * @param  {number} [x=0] - Horizontal position of the beginning of the text.
 * @param  {number} [y=0] - Vertical position of the *baseline* of the text.
 * @param  {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 * @param  {Object=} options - xScale, yScale to stretch the glyph.
 */
Glyph.prototype.draw = function(ctx, x, y, fontSize, options) {
    this.getPath(x, y, fontSize, options).draw(ctx);
};

/**
 * Draw the points of the glyph.
 * On-curve points will be drawn in blue, off-curve points will be drawn in red.
 * @param  {CanvasRenderingContext2D} ctx - A 2D drawing context, like Canvas.
 * @param  {number} [x=0] - Horizontal position of the beginning of the text.
 * @param  {number} [y=0] - Vertical position of the *baseline* of the text.
 * @param  {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 */
Glyph.prototype.drawPoints = function(ctx, x, y, fontSize) {
    function drawCircles(l, x, y, scale) {
        var PI_SQ = Math.PI * 2;
        ctx.beginPath();
        for (var j = 0; j < l.length; j += 1) {
            ctx.moveTo(x + (l[j].x * scale), y + (l[j].y * scale));
            ctx.arc(x + (l[j].x * scale), y + (l[j].y * scale), 2, 0, PI_SQ, false);
        }

        ctx.closePath();
        ctx.fill();
    }

    x = x !== undefined ? x : 0;
    y = y !== undefined ? y : 0;
    fontSize = fontSize !== undefined ? fontSize : 24;
    var scale = 1 / this.path.unitsPerEm * fontSize;

    var blueCircles = [];
    var redCircles = [];
    var path = this.path;
    for (var i = 0; i < path.commands.length; i += 1) {
        var cmd = path.commands[i];
        if (cmd.x !== undefined) {
            blueCircles.push({x: cmd.x, y: -cmd.y});
        }

        if (cmd.x1 !== undefined) {
            redCircles.push({x: cmd.x1, y: -cmd.y1});
        }

        if (cmd.x2 !== undefined) {
            redCircles.push({x: cmd.x2, y: -cmd.y2});
        }
    }

    ctx.fillStyle = 'blue';
    drawCircles(blueCircles, x, y, scale);
    ctx.fillStyle = 'red';
    drawCircles(redCircles, x, y, scale);
};

/**
 * Draw lines indicating important font measurements.
 * Black lines indicate the origin of the coordinate system (point 0,0).
 * Blue lines indicate the glyph bounding box.
 * Green line indicates the advance width of the glyph.
 * @param  {CanvasRenderingContext2D} ctx - A 2D drawing context, like Canvas.
 * @param  {number} [x=0] - Horizontal position of the beginning of the text.
 * @param  {number} [y=0] - Vertical position of the *baseline* of the text.
 * @param  {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 */
Glyph.prototype.drawMetrics = function(ctx, x, y, fontSize) {
    var scale;
    x = x !== undefined ? x : 0;
    y = y !== undefined ? y : 0;
    fontSize = fontSize !== undefined ? fontSize : 24;
    scale = 1 / this.path.unitsPerEm * fontSize;
    ctx.lineWidth = 1;

    // Draw the origin
    ctx.strokeStyle = 'black';
    draw.line(ctx, x, -10000, x, 10000);
    draw.line(ctx, -10000, y, 10000, y);

    // This code is here due to memory optimization: by not using
    // defaults in the constructor, we save a notable amount of memory.
    var xMin = this.xMin || 0;
    var yMin = this.yMin || 0;
    var xMax = this.xMax || 0;
    var yMax = this.yMax || 0;
    var advanceWidth = this.advanceWidth || 0;

    // Draw the glyph box
    ctx.strokeStyle = 'blue';
    draw.line(ctx, x + (xMin * scale), -10000, x + (xMin * scale), 10000);
    draw.line(ctx, x + (xMax * scale), -10000, x + (xMax * scale), 10000);
    draw.line(ctx, -10000, y + (-yMin * scale), 10000, y + (-yMin * scale));
    draw.line(ctx, -10000, y + (-yMax * scale), 10000, y + (-yMax * scale));

    // Draw the advance width
    ctx.strokeStyle = 'green';
    draw.line(ctx, x + (advanceWidth * scale), -10000, x + (advanceWidth * scale), 10000);
};

// The GlyphSet object

// Define a property on the glyph that depends on the path being loaded.
function defineDependentProperty(glyph, externalName, internalName) {
    Object.defineProperty(glyph, externalName, {
        get: function() {
            // Request the path property to make sure the path is loaded.
            glyph.path; // jshint ignore:line
            return glyph[internalName];
        },
        set: function(newValue) {
            glyph[internalName] = newValue;
        },
        enumerable: true,
        configurable: true
    });
}

/**
 * A GlyphSet represents all glyphs available in the font, but modelled using
 * a deferred glyph loader, for retrieving glyphs only once they are absolutely
 * necessary, to keep the memory footprint down.
 * @exports opentype.GlyphSet
 * @class
 * @param {opentype.Font}
 * @param {Array}
 */
function GlyphSet(font, glyphs) {
    var this$1 = this;

    this.font = font;
    this.glyphs = {};
    if (Array.isArray(glyphs)) {
        for (var i = 0; i < glyphs.length; i++) {
            this$1.glyphs[i] = glyphs[i];
        }
    }

    this.length = (glyphs && glyphs.length) || 0;
}

/**
 * @param  {number} index
 * @return {opentype.Glyph}
 */
GlyphSet.prototype.get = function(index) {
    if (typeof this.glyphs[index] === 'function') {
        this.glyphs[index] = this.glyphs[index]();
    }

    return this.glyphs[index];
};

/**
 * @param  {number} index
 * @param  {Object}
 */
GlyphSet.prototype.push = function(index, loader) {
    this.glyphs[index] = loader;
    this.length++;
};

/**
 * @alias opentype.glyphLoader
 * @param  {opentype.Font} font
 * @param  {number} index
 * @return {opentype.Glyph}
 */
function glyphLoader(font, index) {
    return new Glyph({index: index, font: font});
}

/**
 * Generate a stub glyph that can be filled with all metadata *except*
 * the "points" and "path" properties, which must be loaded only once
 * the glyph's path is actually requested for text shaping.
 * @alias opentype.ttfGlyphLoader
 * @param  {opentype.Font} font
 * @param  {number} index
 * @param  {Function} parseGlyph
 * @param  {Object} data
 * @param  {number} position
 * @param  {Function} buildPath
 * @return {opentype.Glyph}
 */
function ttfGlyphLoader(font, index, parseGlyph, data, position, buildPath) {
    return function() {
        var glyph = new Glyph({index: index, font: font});

        glyph.path = function() {
            parseGlyph(glyph, data, position);
            var path = buildPath(font.glyphs, glyph);
            path.unitsPerEm = font.unitsPerEm;
            return path;
        };

        defineDependentProperty(glyph, 'xMin', '_xMin');
        defineDependentProperty(glyph, 'xMax', '_xMax');
        defineDependentProperty(glyph, 'yMin', '_yMin');
        defineDependentProperty(glyph, 'yMax', '_yMax');

        return glyph;
    };
}
/**
 * @alias opentype.cffGlyphLoader
 * @param  {opentype.Font} font
 * @param  {number} index
 * @param  {Function} parseCFFCharstring
 * @param  {string} charstring
 * @return {opentype.Glyph}
 */
function cffGlyphLoader(font, index, parseCFFCharstring, charstring) {
    return function() {
        var glyph = new Glyph({index: index, font: font});

        glyph.path = function() {
            var path = parseCFFCharstring(font, glyph, charstring);
            path.unitsPerEm = font.unitsPerEm;
            return path;
        };

        return glyph;
    };
}

var glyphset = { GlyphSet: GlyphSet, glyphLoader: glyphLoader, ttfGlyphLoader: ttfGlyphLoader, cffGlyphLoader: cffGlyphLoader };

// The `CFF` table contains the glyph outlines in PostScript format.
// https://www.microsoft.com/typography/OTSPEC/cff.htm
// http://download.microsoft.com/download/8/0/1/801a191c-029d-4af3-9642-555f6fe514ee/cff.pdf
// http://download.microsoft.com/download/8/0/1/801a191c-029d-4af3-9642-555f6fe514ee/type2.pdf

// Custom equals function that can also check lists.
function equals(a, b) {
    if (a === b) {
        return true;
    } else if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false;
        }

        for (var i = 0; i < a.length; i += 1) {
            if (!equals(a[i], b[i])) {
                return false;
            }
        }

        return true;
    } else {
        return false;
    }
}

// Subroutines are encoded using the negative half of the number space.
// See type 2 chapter 4.7 "Subroutine operators".
function calcCFFSubroutineBias(subrs) {
    var bias;
    if (subrs.length < 1240) {
        bias = 107;
    } else if (subrs.length < 33900) {
        bias = 1131;
    } else {
        bias = 32768;
    }

    return bias;
}

// Parse a `CFF` INDEX array.
// An index array consists of a list of offsets, then a list of objects at those offsets.
function parseCFFIndex(data, start, conversionFn) {
    var offsets = [];
    var objects = [];
    var count = parse.getCard16(data, start);
    var objectOffset;
    var endOffset;
    if (count !== 0) {
        var offsetSize = parse.getByte(data, start + 2);
        objectOffset = start + ((count + 1) * offsetSize) + 2;
        var pos = start + 3;
        for (var i = 0; i < count + 1; i += 1) {
            offsets.push(parse.getOffset(data, pos, offsetSize));
            pos += offsetSize;
        }

        // The total size of the index array is 4 header bytes + the value of the last offset.
        endOffset = objectOffset + offsets[count];
    } else {
        endOffset = start + 2;
    }

    for (var i$1 = 0; i$1 < offsets.length - 1; i$1 += 1) {
        var value = parse.getBytes(data, objectOffset + offsets[i$1], objectOffset + offsets[i$1 + 1]);
        if (conversionFn) {
            value = conversionFn(value);
        }

        objects.push(value);
    }

    return {objects: objects, startOffset: start, endOffset: endOffset};
}

// Parse a `CFF` DICT real value.
function parseFloatOperand(parser) {
    var s = '';
    var eof = 15;
    var lookup = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', 'E', 'E-', null, '-'];
    while (true) {
        var b = parser.parseByte();
        var n1 = b >> 4;
        var n2 = b & 15;

        if (n1 === eof) {
            break;
        }

        s += lookup[n1];

        if (n2 === eof) {
            break;
        }

        s += lookup[n2];
    }

    return parseFloat(s);
}

// Parse a `CFF` DICT operand.
function parseOperand(parser, b0) {
    var b1;
    var b2;
    var b3;
    var b4;
    if (b0 === 28) {
        b1 = parser.parseByte();
        b2 = parser.parseByte();
        return b1 << 8 | b2;
    }

    if (b0 === 29) {
        b1 = parser.parseByte();
        b2 = parser.parseByte();
        b3 = parser.parseByte();
        b4 = parser.parseByte();
        return b1 << 24 | b2 << 16 | b3 << 8 | b4;
    }

    if (b0 === 30) {
        return parseFloatOperand(parser);
    }

    if (b0 >= 32 && b0 <= 246) {
        return b0 - 139;
    }

    if (b0 >= 247 && b0 <= 250) {
        b1 = parser.parseByte();
        return (b0 - 247) * 256 + b1 + 108;
    }

    if (b0 >= 251 && b0 <= 254) {
        b1 = parser.parseByte();
        return -(b0 - 251) * 256 - b1 - 108;
    }

    throw new Error('Invalid b0 ' + b0);
}

// Convert the entries returned by `parseDict` to a proper dictionary.
// If a value is a list of one, it is unpacked.
function entriesToObject(entries) {
    var o = {};
    for (var i = 0; i < entries.length; i += 1) {
        var key = entries[i][0];
        var values = entries[i][1];
        var value = (void 0);
        if (values.length === 1) {
            value = values[0];
        } else {
            value = values;
        }

        if (o.hasOwnProperty(key)) {
            throw new Error('Object ' + o + ' already has key ' + key);
        }

        o[key] = value;
    }

    return o;
}

// Parse a `CFF` DICT object.
// A dictionary contains key-value pairs in a compact tokenized format.
function parseCFFDict(data, start, size) {
    start = start !== undefined ? start : 0;
    var parser = new parse.Parser(data, start);
    var entries = [];
    var operands = [];
    size = size !== undefined ? size : data.length;

    while (parser.relativeOffset < size) {
        var op = parser.parseByte();

        // The first byte for each dict item distinguishes between operator (key) and operand (value).
        // Values <= 21 are operators.
        if (op <= 21) {
            // Two-byte operators have an initial escape byte of 12.
            if (op === 12) {
                op = 1200 + parser.parseByte();
            }

            entries.push([op, operands]);
            operands = [];
        } else {
            // Since the operands (values) come before the operators (keys), we store all operands in a list
            // until we encounter an operator.
            operands.push(parseOperand(parser, op));
        }
    }

    return entriesToObject(entries);
}

// Given a String Index (SID), return the value of the string.
// Strings below index 392 are standard CFF strings and are not encoded in the font.
function getCFFString(strings, index) {
    if (index <= 390) {
        index = cffStandardStrings[index];
    } else {
        index = strings[index - 391];
    }

    return index;
}

// Interpret a dictionary and return a new dictionary with readable keys and values for missing entries.
// This function takes `meta` which is a list of objects containing `operand`, `name` and `default`.
function interpretDict(dict, meta, strings) {
    var newDict = {};
    var value;

    // Because we also want to include missing values, we start out from the meta list
    // and lookup values in the dict.
    for (var i = 0; i < meta.length; i += 1) {
        var m = meta[i];

        if (Array.isArray(m.type)) {
            var values = [];
            values.length = m.type.length;
            for (var j = 0; j < m.type.length; j++) {
                value = dict[m.op] !== undefined ? dict[m.op][j] : undefined;
                if (value === undefined) {
                    value = m.value !== undefined && m.value[j] !== undefined ? m.value[j] : null;
                }
                if (m.type[j] === 'SID') {
                    value = getCFFString(strings, value);
                }
                values[j] = value;
            }
            newDict[m.name] = values;
        } else {
            value = dict[m.op];
            if (value === undefined) {
                value = m.value !== undefined ? m.value : null;
            }

            if (m.type === 'SID') {
                value = getCFFString(strings, value);
            }
            newDict[m.name] = value;
        }
    }

    return newDict;
}

// Parse the CFF header.
function parseCFFHeader(data, start) {
    var header = {};
    header.formatMajor = parse.getCard8(data, start);
    header.formatMinor = parse.getCard8(data, start + 1);
    header.size = parse.getCard8(data, start + 2);
    header.offsetSize = parse.getCard8(data, start + 3);
    header.startOffset = start;
    header.endOffset = start + 4;
    return header;
}

var TOP_DICT_META = [
    {name: 'version', op: 0, type: 'SID'},
    {name: 'notice', op: 1, type: 'SID'},
    {name: 'copyright', op: 1200, type: 'SID'},
    {name: 'fullName', op: 2, type: 'SID'},
    {name: 'familyName', op: 3, type: 'SID'},
    {name: 'weight', op: 4, type: 'SID'},
    {name: 'isFixedPitch', op: 1201, type: 'number', value: 0},
    {name: 'italicAngle', op: 1202, type: 'number', value: 0},
    {name: 'underlinePosition', op: 1203, type: 'number', value: -100},
    {name: 'underlineThickness', op: 1204, type: 'number', value: 50},
    {name: 'paintType', op: 1205, type: 'number', value: 0},
    {name: 'charstringType', op: 1206, type: 'number', value: 2},
    {
        name: 'fontMatrix',
        op: 1207,
        type: ['real', 'real', 'real', 'real', 'real', 'real'],
        value: [0.001, 0, 0, 0.001, 0, 0]
    },
    {name: 'uniqueId', op: 13, type: 'number'},
    {name: 'fontBBox', op: 5, type: ['number', 'number', 'number', 'number'], value: [0, 0, 0, 0]},
    {name: 'strokeWidth', op: 1208, type: 'number', value: 0},
    {name: 'xuid', op: 14, type: [], value: null},
    {name: 'charset', op: 15, type: 'offset', value: 0},
    {name: 'encoding', op: 16, type: 'offset', value: 0},
    {name: 'charStrings', op: 17, type: 'offset', value: 0},
    {name: 'private', op: 18, type: ['number', 'offset'], value: [0, 0]},
    {name: 'ros', op: 1230, type: ['SID', 'SID', 'number']},
    {name: 'cidFontVersion', op: 1231, type: 'number', value: 0},
    {name: 'cidFontRevision', op: 1232, type: 'number', value: 0},
    {name: 'cidFontType', op: 1233, type: 'number', value: 0},
    {name: 'cidCount', op: 1234, type: 'number', value: 8720},
    {name: 'uidBase', op: 1235, type: 'number'},
    {name: 'fdArray', op: 1236, type: 'offset'},
    {name: 'fdSelect', op: 1237, type: 'offset'},
    {name: 'fontName', op: 1238, type: 'SID'}
];

var PRIVATE_DICT_META = [
    {name: 'subrs', op: 19, type: 'offset', value: 0},
    {name: 'defaultWidthX', op: 20, type: 'number', value: 0},
    {name: 'nominalWidthX', op: 21, type: 'number', value: 0}
];

// Parse the CFF top dictionary. A CFF table can contain multiple fonts, each with their own top dictionary.
// The top dictionary contains the essential metadata for the font, together with the private dictionary.
function parseCFFTopDict(data, strings) {
    var dict = parseCFFDict(data, 0, data.byteLength);
    return interpretDict(dict, TOP_DICT_META, strings);
}

// Parse the CFF private dictionary. We don't fully parse out all the values, only the ones we need.
function parseCFFPrivateDict(data, start, size, strings) {
    var dict = parseCFFDict(data, start, size);
    return interpretDict(dict, PRIVATE_DICT_META, strings);
}

// Returns a list of "Top DICT"s found using an INDEX list.
// Used to read both the usual high-level Top DICTs and also the FDArray
// discovered inside CID-keyed fonts.  When a Top DICT has a reference to
// a Private DICT that is read and saved into the Top DICT.
//
// In addition to the expected/optional values as outlined in TOP_DICT_META
// the following values might be saved into the Top DICT.
//
//    _subrs []        array of local CFF subroutines from Private DICT
//    _subrsBias       bias value computed from number of subroutines
//                      (see calcCFFSubroutineBias() and parseCFFCharstring())
//    _defaultWidthX   default widths for CFF characters
//    _nominalWidthX   bias added to width embedded within glyph description
//
//    _privateDict     saved copy of parsed Private DICT from Top DICT
function gatherCFFTopDicts(data, start, cffIndex, strings) {
    var topDictArray = [];
    for (var iTopDict = 0; iTopDict < cffIndex.length; iTopDict += 1) {
        var topDictData = new DataView(new Uint8Array(cffIndex[iTopDict]).buffer);
        var topDict = parseCFFTopDict(topDictData, strings);
        topDict._subrs = [];
        topDict._subrsBias = 0;
        var privateSize = topDict.private[0];
        var privateOffset = topDict.private[1];
        if (privateSize !== 0 && privateOffset !== 0) {
            var privateDict = parseCFFPrivateDict(data, privateOffset + start, privateSize, strings);
            topDict._defaultWidthX = privateDict.defaultWidthX;
            topDict._nominalWidthX = privateDict.nominalWidthX;
            if (privateDict.subrs !== 0) {
                var subrOffset = privateOffset + privateDict.subrs;
                var subrIndex = parseCFFIndex(data, subrOffset + start);
                topDict._subrs = subrIndex.objects;
                topDict._subrsBias = calcCFFSubroutineBias(topDict._subrs);
            }
            topDict._privateDict = privateDict;
        }
        topDictArray.push(topDict);
    }
    return topDictArray;
}

// Parse the CFF charset table, which contains internal names for all the glyphs.
// This function will return a list of glyph names.
// See Adobe TN #5176 chapter 13, "Charsets".
function parseCFFCharset(data, start, nGlyphs, strings) {
    var sid;
    var count;
    var parser = new parse.Parser(data, start);

    // The .notdef glyph is not included, so subtract 1.
    nGlyphs -= 1;
    var charset = ['.notdef'];

    var format = parser.parseCard8();
    if (format === 0) {
        for (var i = 0; i < nGlyphs; i += 1) {
            sid = parser.parseSID();
            charset.push(getCFFString(strings, sid));
        }
    } else if (format === 1) {
        while (charset.length <= nGlyphs) {
            sid = parser.parseSID();
            count = parser.parseCard8();
            for (var i$1 = 0; i$1 <= count; i$1 += 1) {
                charset.push(getCFFString(strings, sid));
                sid += 1;
            }
        }
    } else if (format === 2) {
        while (charset.length <= nGlyphs) {
            sid = parser.parseSID();
            count = parser.parseCard16();
            for (var i$2 = 0; i$2 <= count; i$2 += 1) {
                charset.push(getCFFString(strings, sid));
                sid += 1;
            }
        }
    } else {
        throw new Error('Unknown charset format ' + format);
    }

    return charset;
}

// Parse the CFF encoding data. Only one encoding can be specified per font.
// See Adobe TN #5176 chapter 12, "Encodings".
function parseCFFEncoding(data, start, charset) {
    var code;
    var enc = {};
    var parser = new parse.Parser(data, start);
    var format = parser.parseCard8();
    if (format === 0) {
        var nCodes = parser.parseCard8();
        for (var i = 0; i < nCodes; i += 1) {
            code = parser.parseCard8();
            enc[code] = i;
        }
    } else if (format === 1) {
        var nRanges = parser.parseCard8();
        code = 1;
        for (var i$1 = 0; i$1 < nRanges; i$1 += 1) {
            var first = parser.parseCard8();
            var nLeft = parser.parseCard8();
            for (var j = first; j <= first + nLeft; j += 1) {
                enc[j] = code;
                code += 1;
            }
        }
    } else {
        throw new Error('Unknown encoding format ' + format);
    }

    return new CffEncoding(enc, charset);
}

// Take in charstring code and return a Glyph object.
// The encoding is described in the Type 2 Charstring Format
// https://www.microsoft.com/typography/OTSPEC/charstr2.htm
function parseCFFCharstring(font, glyph, code) {
    var c1x;
    var c1y;
    var c2x;
    var c2y;
    var p = new Path();
    var stack = [];
    var nStems = 0;
    var haveWidth = false;
    var open = false;
    var x = 0;
    var y = 0;
    var subrs;
    var subrsBias;
    var defaultWidthX;
    var nominalWidthX;
    if (font.isCIDFont) {
        var fdIndex = font.tables.cff.topDict._fdSelect[glyph.index];
        var fdDict = font.tables.cff.topDict._fdArray[fdIndex];
        subrs = fdDict._subrs;
        subrsBias = fdDict._subrsBias;
        defaultWidthX = fdDict._defaultWidthX;
        nominalWidthX = fdDict._nominalWidthX;
    } else {
        subrs = font.tables.cff.topDict._subrs;
        subrsBias = font.tables.cff.topDict._subrsBias;
        defaultWidthX = font.tables.cff.topDict._defaultWidthX;
        nominalWidthX = font.tables.cff.topDict._nominalWidthX;
    }
    var width = defaultWidthX;

    function newContour(x, y) {
        if (open) {
            p.closePath();
        }

        p.moveTo(x, y);
        open = true;
    }

    function parseStems() {
        var hasWidthArg;

        // The number of stem operators on the stack is always even.
        // If the value is uneven, that means a width is specified.
        hasWidthArg = stack.length % 2 !== 0;
        if (hasWidthArg && !haveWidth) {
            width = stack.shift() + nominalWidthX;
        }

        nStems += stack.length >> 1;
        stack.length = 0;
        haveWidth = true;
    }

    function parse$$1(code) {
        var b1;
        var b2;
        var b3;
        var b4;
        var codeIndex;
        var subrCode;
        var jpx;
        var jpy;
        var c3x;
        var c3y;
        var c4x;
        var c4y;

        var i = 0;
        while (i < code.length) {
            var v = code[i];
            i += 1;
            switch (v) {
                case 1: // hstem
                    parseStems();
                    break;
                case 3: // vstem
                    parseStems();
                    break;
                case 4: // vmoveto
                    if (stack.length > 1 && !haveWidth) {
                        width = stack.shift() + nominalWidthX;
                        haveWidth = true;
                    }

                    y += stack.pop();
                    newContour(x, y);
                    break;
                case 5: // rlineto
                    while (stack.length > 0) {
                        x += stack.shift();
                        y += stack.shift();
                        p.lineTo(x, y);
                    }

                    break;
                case 6: // hlineto
                    while (stack.length > 0) {
                        x += stack.shift();
                        p.lineTo(x, y);
                        if (stack.length === 0) {
                            break;
                        }

                        y += stack.shift();
                        p.lineTo(x, y);
                    }

                    break;
                case 7: // vlineto
                    while (stack.length > 0) {
                        y += stack.shift();
                        p.lineTo(x, y);
                        if (stack.length === 0) {
                            break;
                        }

                        x += stack.shift();
                        p.lineTo(x, y);
                    }

                    break;
                case 8: // rrcurveto
                    while (stack.length > 0) {
                        c1x = x + stack.shift();
                        c1y = y + stack.shift();
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        x = c2x + stack.shift();
                        y = c2y + stack.shift();
                        p.curveTo(c1x, c1y, c2x, c2y, x, y);
                    }

                    break;
                case 10: // callsubr
                    codeIndex = stack.pop() + subrsBias;
                    subrCode = subrs[codeIndex];
                    if (subrCode) {
                        parse$$1(subrCode);
                    }

                    break;
                case 11: // return
                    return;
                case 12: // flex operators
                    v = code[i];
                    i += 1;
                    switch (v) {
                        case 35: // flex
                            // |- dx1 dy1 dx2 dy2 dx3 dy3 dx4 dy4 dx5 dy5 dx6 dy6 fd flex (12 35) |-
                            c1x = x   + stack.shift();    // dx1
                            c1y = y   + stack.shift();    // dy1
                            c2x = c1x + stack.shift();    // dx2
                            c2y = c1y + stack.shift();    // dy2
                            jpx = c2x + stack.shift();    // dx3
                            jpy = c2y + stack.shift();    // dy3
                            c3x = jpx + stack.shift();    // dx4
                            c3y = jpy + stack.shift();    // dy4
                            c4x = c3x + stack.shift();    // dx5
                            c4y = c3y + stack.shift();    // dy5
                            x = c4x   + stack.shift();    // dx6
                            y = c4y   + stack.shift();    // dy6
                            stack.shift();                // flex depth
                            p.curveTo(c1x, c1y, c2x, c2y, jpx, jpy);
                            p.curveTo(c3x, c3y, c4x, c4y, x, y);
                            break;
                        case 34: // hflex
                            // |- dx1 dx2 dy2 dx3 dx4 dx5 dx6 hflex (12 34) |-
                            c1x = x   + stack.shift();    // dx1
                            c1y = y;                      // dy1
                            c2x = c1x + stack.shift();    // dx2
                            c2y = c1y + stack.shift();    // dy2
                            jpx = c2x + stack.shift();    // dx3
                            jpy = c2y;                    // dy3
                            c3x = jpx + stack.shift();    // dx4
                            c3y = c2y;                    // dy4
                            c4x = c3x + stack.shift();    // dx5
                            c4y = y;                      // dy5
                            x = c4x + stack.shift();      // dx6
                            p.curveTo(c1x, c1y, c2x, c2y, jpx, jpy);
                            p.curveTo(c3x, c3y, c4x, c4y, x, y);
                            break;
                        case 36: // hflex1
                            // |- dx1 dy1 dx2 dy2 dx3 dx4 dx5 dy5 dx6 hflex1 (12 36) |-
                            c1x = x   + stack.shift();    // dx1
                            c1y = y   + stack.shift();    // dy1
                            c2x = c1x + stack.shift();    // dx2
                            c2y = c1y + stack.shift();    // dy2
                            jpx = c2x + stack.shift();    // dx3
                            jpy = c2y;                    // dy3
                            c3x = jpx + stack.shift();    // dx4
                            c3y = c2y;                    // dy4
                            c4x = c3x + stack.shift();    // dx5
                            c4y = c3y + stack.shift();    // dy5
                            x = c4x + stack.shift();      // dx6
                            p.curveTo(c1x, c1y, c2x, c2y, jpx, jpy);
                            p.curveTo(c3x, c3y, c4x, c4y, x, y);
                            break;
                        case 37: // flex1
                            // |- dx1 dy1 dx2 dy2 dx3 dy3 dx4 dy4 dx5 dy5 d6 flex1 (12 37) |-
                            c1x = x   + stack.shift();    // dx1
                            c1y = y   + stack.shift();    // dy1
                            c2x = c1x + stack.shift();    // dx2
                            c2y = c1y + stack.shift();    // dy2
                            jpx = c2x + stack.shift();    // dx3
                            jpy = c2y + stack.shift();    // dy3
                            c3x = jpx + stack.shift();    // dx4
                            c3y = jpy + stack.shift();    // dy4
                            c4x = c3x + stack.shift();    // dx5
                            c4y = c3y + stack.shift();    // dy5
                            if (Math.abs(c4x - x) > Math.abs(c4y - y)) {
                                x = c4x + stack.shift();
                            } else {
                                y = c4y + stack.shift();
                            }

                            p.curveTo(c1x, c1y, c2x, c2y, jpx, jpy);
                            p.curveTo(c3x, c3y, c4x, c4y, x, y);
                            break;
                        default:
                            console.log('Glyph ' + glyph.index + ': unknown operator ' + 1200 + v);
                            stack.length = 0;
                    }
                    break;
                case 14: // endchar
                    if (stack.length > 0 && !haveWidth) {
                        width = stack.shift() + nominalWidthX;
                        haveWidth = true;
                    }

                    if (open) {
                        p.closePath();
                        open = false;
                    }

                    break;
                case 18: // hstemhm
                    parseStems();
                    break;
                case 19: // hintmask
                case 20: // cntrmask
                    parseStems();
                    i += (nStems + 7) >> 3;
                    break;
                case 21: // rmoveto
                    if (stack.length > 2 && !haveWidth) {
                        width = stack.shift() + nominalWidthX;
                        haveWidth = true;
                    }

                    y += stack.pop();
                    x += stack.pop();
                    newContour(x, y);
                    break;
                case 22: // hmoveto
                    if (stack.length > 1 && !haveWidth) {
                        width = stack.shift() + nominalWidthX;
                        haveWidth = true;
                    }

                    x += stack.pop();
                    newContour(x, y);
                    break;
                case 23: // vstemhm
                    parseStems();
                    break;
                case 24: // rcurveline
                    while (stack.length > 2) {
                        c1x = x + stack.shift();
                        c1y = y + stack.shift();
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        x = c2x + stack.shift();
                        y = c2y + stack.shift();
                        p.curveTo(c1x, c1y, c2x, c2y, x, y);
                    }

                    x += stack.shift();
                    y += stack.shift();
                    p.lineTo(x, y);
                    break;
                case 25: // rlinecurve
                    while (stack.length > 6) {
                        x += stack.shift();
                        y += stack.shift();
                        p.lineTo(x, y);
                    }

                    c1x = x + stack.shift();
                    c1y = y + stack.shift();
                    c2x = c1x + stack.shift();
                    c2y = c1y + stack.shift();
                    x = c2x + stack.shift();
                    y = c2y + stack.shift();
                    p.curveTo(c1x, c1y, c2x, c2y, x, y);
                    break;
                case 26: // vvcurveto
                    if (stack.length % 2) {
                        x += stack.shift();
                    }

                    while (stack.length > 0) {
                        c1x = x;
                        c1y = y + stack.shift();
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        x = c2x;
                        y = c2y + stack.shift();
                        p.curveTo(c1x, c1y, c2x, c2y, x, y);
                    }

                    break;
                case 27: // hhcurveto
                    if (stack.length % 2) {
                        y += stack.shift();
                    }

                    while (stack.length > 0) {
                        c1x = x + stack.shift();
                        c1y = y;
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        x = c2x + stack.shift();
                        y = c2y;
                        p.curveTo(c1x, c1y, c2x, c2y, x, y);
                    }

                    break;
                case 28: // shortint
                    b1 = code[i];
                    b2 = code[i + 1];
                    stack.push(((b1 << 24) | (b2 << 16)) >> 16);
                    i += 2;
                    break;
                case 29: // callgsubr
                    codeIndex = stack.pop() + font.gsubrsBias;
                    subrCode = font.gsubrs[codeIndex];
                    if (subrCode) {
                        parse$$1(subrCode);
                    }

                    break;
                case 30: // vhcurveto
                    while (stack.length > 0) {
                        c1x = x;
                        c1y = y + stack.shift();
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        x = c2x + stack.shift();
                        y = c2y + (stack.length === 1 ? stack.shift() : 0);
                        p.curveTo(c1x, c1y, c2x, c2y, x, y);
                        if (stack.length === 0) {
                            break;
                        }

                        c1x = x + stack.shift();
                        c1y = y;
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        y = c2y + stack.shift();
                        x = c2x + (stack.length === 1 ? stack.shift() : 0);
                        p.curveTo(c1x, c1y, c2x, c2y, x, y);
                    }

                    break;
                case 31: // hvcurveto
                    while (stack.length > 0) {
                        c1x = x + stack.shift();
                        c1y = y;
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        y = c2y + stack.shift();
                        x = c2x + (stack.length === 1 ? stack.shift() : 0);
                        p.curveTo(c1x, c1y, c2x, c2y, x, y);
                        if (stack.length === 0) {
                            break;
                        }

                        c1x = x;
                        c1y = y + stack.shift();
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        x = c2x + stack.shift();
                        y = c2y + (stack.length === 1 ? stack.shift() : 0);
                        p.curveTo(c1x, c1y, c2x, c2y, x, y);
                    }

                    break;
                default:
                    if (v < 32) {
                        console.log('Glyph ' + glyph.index + ': unknown operator ' + v);
                    } else if (v < 247) {
                        stack.push(v - 139);
                    } else if (v < 251) {
                        b1 = code[i];
                        i += 1;
                        stack.push((v - 247) * 256 + b1 + 108);
                    } else if (v < 255) {
                        b1 = code[i];
                        i += 1;
                        stack.push(-(v - 251) * 256 - b1 - 108);
                    } else {
                        b1 = code[i];
                        b2 = code[i + 1];
                        b3 = code[i + 2];
                        b4 = code[i + 3];
                        i += 4;
                        stack.push(((b1 << 24) | (b2 << 16) | (b3 << 8) | b4) / 65536);
                    }
            }
        }
    }

    parse$$1(code);

    glyph.advanceWidth = width;
    return p;
}

function parseCFFFDSelect(data, start, nGlyphs, fdArrayCount) {
    var fdSelect = [];
    var fdIndex;
    var parser = new parse.Parser(data, start);
    var format = parser.parseCard8();
    if (format === 0) {
        // Simple list of nGlyphs elements
        for (var iGid = 0; iGid < nGlyphs; iGid++) {
            fdIndex = parser.parseCard8();
            if (fdIndex >= fdArrayCount) {
                throw new Error('CFF table CID Font FDSelect has bad FD index value ' + fdIndex + ' (FD count ' + fdArrayCount + ')');
            }
            fdSelect.push(fdIndex);
        }
    } else if (format === 3) {
        // Ranges
        var nRanges = parser.parseCard16();
        var first = parser.parseCard16();
        if (first !== 0) {
            throw new Error('CFF Table CID Font FDSelect format 3 range has bad initial GID ' + first);
        }
        var next;
        for (var iRange = 0; iRange < nRanges; iRange++) {
            fdIndex = parser.parseCard8();
            next = parser.parseCard16();
            if (fdIndex >= fdArrayCount) {
                throw new Error('CFF table CID Font FDSelect has bad FD index value ' + fdIndex + ' (FD count ' + fdArrayCount + ')');
            }
            if (next > nGlyphs) {
                throw new Error('CFF Table CID Font FDSelect format 3 range has bad GID ' + next);
            }
            for (; first < next; first++) {
                fdSelect.push(fdIndex);
            }
            first = next;
        }
        if (next !== nGlyphs) {
            throw new Error('CFF Table CID Font FDSelect format 3 range has bad final GID ' + next);
        }
    } else {
        throw new Error('CFF Table CID Font FDSelect table has unsupported format ' + format);
    }
    return fdSelect;
}

// Parse the `CFF` table, which contains the glyph outlines in PostScript format.
function parseCFFTable(data, start, font) {
    font.tables.cff = {};
    var header = parseCFFHeader(data, start);
    var nameIndex = parseCFFIndex(data, header.endOffset, parse.bytesToString);
    var topDictIndex = parseCFFIndex(data, nameIndex.endOffset);
    var stringIndex = parseCFFIndex(data, topDictIndex.endOffset, parse.bytesToString);
    var globalSubrIndex = parseCFFIndex(data, stringIndex.endOffset);
    font.gsubrs = globalSubrIndex.objects;
    font.gsubrsBias = calcCFFSubroutineBias(font.gsubrs);

    var topDictArray = gatherCFFTopDicts(data, start, topDictIndex.objects, stringIndex.objects);
    if (topDictArray.length !== 1) {
        throw new Error('CFF table has too many fonts in \'FontSet\' - count of fonts NameIndex.length = ' + topDictArray.length);
    }

    var topDict = topDictArray[0];
    font.tables.cff.topDict = topDict;

    if (topDict._privateDict) {
        font.defaultWidthX = topDict._privateDict.defaultWidthX;
        font.nominalWidthX = topDict._privateDict.nominalWidthX;
    }

    if (topDict.ros[0] !== undefined && topDict.ros[1] !== undefined) {
        font.isCIDFont = true;
    }

    if (font.isCIDFont) {
        var fdArrayOffset = topDict.fdArray;
        var fdSelectOffset = topDict.fdSelect;
        if (fdArrayOffset === 0 || fdSelectOffset === 0) {
            throw new Error('Font is marked as a CID font, but FDArray and/or FDSelect information is missing');
        }
        fdArrayOffset += start;
        var fdArrayIndex = parseCFFIndex(data, fdArrayOffset);
        var fdArray = gatherCFFTopDicts(data, start, fdArrayIndex.objects, stringIndex.objects);
        topDict._fdArray = fdArray;
        fdSelectOffset += start;
        topDict._fdSelect = parseCFFFDSelect(data, fdSelectOffset, font.numGlyphs, fdArray.length);
    }

    var privateDictOffset = start + topDict.private[1];
    var privateDict = parseCFFPrivateDict(data, privateDictOffset, topDict.private[0], stringIndex.objects);
    font.defaultWidthX = privateDict.defaultWidthX;
    font.nominalWidthX = privateDict.nominalWidthX;

    if (privateDict.subrs !== 0) {
        var subrOffset = privateDictOffset + privateDict.subrs;
        var subrIndex = parseCFFIndex(data, subrOffset);
        font.subrs = subrIndex.objects;
        font.subrsBias = calcCFFSubroutineBias(font.subrs);
    } else {
        font.subrs = [];
        font.subrsBias = 0;
    }

    // Offsets in the top dict are relative to the beginning of the CFF data, so add the CFF start offset.
    var charStringsIndex = parseCFFIndex(data, start + topDict.charStrings);
    font.nGlyphs = charStringsIndex.objects.length;

    var charset = parseCFFCharset(data, start + topDict.charset, font.nGlyphs, stringIndex.objects);
    if (topDict.encoding === 0) { // Standard encoding
        font.cffEncoding = new CffEncoding(cffStandardEncoding, charset);
    } else if (topDict.encoding === 1) { // Expert encoding
        font.cffEncoding = new CffEncoding(cffExpertEncoding, charset);
    } else {
        font.cffEncoding = parseCFFEncoding(data, start + topDict.encoding, charset);
    }

    // Prefer the CMAP encoding to the CFF encoding.
    font.encoding = font.encoding || font.cffEncoding;

    font.glyphs = new glyphset.GlyphSet(font);
    for (var i = 0; i < font.nGlyphs; i += 1) {
        var charString = charStringsIndex.objects[i];
        font.glyphs.push(i, glyphset.cffGlyphLoader(font, i, parseCFFCharstring, charString));
    }
}

// Convert a string to a String ID (SID).
// The list of strings is modified in place.
function encodeString(s, strings) {
    var sid;

    // Is the string in the CFF standard strings?
    var i = cffStandardStrings.indexOf(s);
    if (i >= 0) {
        sid = i;
    }

    // Is the string already in the string index?
    i = strings.indexOf(s);
    if (i >= 0) {
        sid = i + cffStandardStrings.length;
    } else {
        sid = cffStandardStrings.length + strings.length;
        strings.push(s);
    }

    return sid;
}

function makeHeader() {
    return new table.Record('Header', [
        {name: 'major', type: 'Card8', value: 1},
        {name: 'minor', type: 'Card8', value: 0},
        {name: 'hdrSize', type: 'Card8', value: 4},
        {name: 'major', type: 'Card8', value: 1}
    ]);
}

function makeNameIndex(fontNames) {
    var t = new table.Record('Name INDEX', [
        {name: 'names', type: 'INDEX', value: []}
    ]);
    t.names = [];
    for (var i = 0; i < fontNames.length; i += 1) {
        t.names.push({name: 'name_' + i, type: 'NAME', value: fontNames[i]});
    }

    return t;
}

// Given a dictionary's metadata, create a DICT structure.
function makeDict(meta, attrs, strings) {
    var m = {};
    for (var i = 0; i < meta.length; i += 1) {
        var entry = meta[i];
        var value = attrs[entry.name];
        if (value !== undefined && !equals(value, entry.value)) {
            if (entry.type === 'SID') {
                value = encodeString(value, strings);
            }

            m[entry.op] = {name: entry.name, type: entry.type, value: value};
        }
    }

    return m;
}

// The Top DICT houses the global font attributes.
function makeTopDict(attrs, strings) {
    var t = new table.Record('Top DICT', [
        {name: 'dict', type: 'DICT', value: {}}
    ]);
    t.dict = makeDict(TOP_DICT_META, attrs, strings);
    return t;
}

function makeTopDictIndex(topDict) {
    var t = new table.Record('Top DICT INDEX', [
        {name: 'topDicts', type: 'INDEX', value: []}
    ]);
    t.topDicts = [{name: 'topDict_0', type: 'TABLE', value: topDict}];
    return t;
}

function makeStringIndex(strings) {
    var t = new table.Record('String INDEX', [
        {name: 'strings', type: 'INDEX', value: []}
    ]);
    t.strings = [];
    for (var i = 0; i < strings.length; i += 1) {
        t.strings.push({name: 'string_' + i, type: 'STRING', value: strings[i]});
    }

    return t;
}

function makeGlobalSubrIndex() {
    // Currently we don't use subroutines.
    return new table.Record('Global Subr INDEX', [
        {name: 'subrs', type: 'INDEX', value: []}
    ]);
}

function makeCharsets(glyphNames, strings) {
    var t = new table.Record('Charsets', [
        {name: 'format', type: 'Card8', value: 0}
    ]);
    for (var i = 0; i < glyphNames.length; i += 1) {
        var glyphName = glyphNames[i];
        var glyphSID = encodeString(glyphName, strings);
        t.fields.push({name: 'glyph_' + i, type: 'SID', value: glyphSID});
    }

    return t;
}

function glyphToOps(glyph) {
    var ops = [];
    var path = glyph.path;
    ops.push({name: 'width', type: 'NUMBER', value: glyph.advanceWidth});
    var x = 0;
    var y = 0;
    for (var i = 0; i < path.commands.length; i += 1) {
        var dx = (void 0);
        var dy = (void 0);
        var cmd = path.commands[i];
        if (cmd.type === 'Q') {
            // CFF only supports bézier curves, so convert the quad to a bézier.
            var _13 = 1 / 3;
            var _23 = 2 / 3;

            // We're going to create a new command so we don't change the original path.
            cmd = {
                type: 'C',
                x: cmd.x,
                y: cmd.y,
                x1: _13 * x + _23 * cmd.x1,
                y1: _13 * y + _23 * cmd.y1,
                x2: _13 * cmd.x + _23 * cmd.x1,
                y2: _13 * cmd.y + _23 * cmd.y1
            };
        }

        if (cmd.type === 'M') {
            dx = Math.round(cmd.x - x);
            dy = Math.round(cmd.y - y);
            ops.push({name: 'dx', type: 'NUMBER', value: dx});
            ops.push({name: 'dy', type: 'NUMBER', value: dy});
            ops.push({name: 'rmoveto', type: 'OP', value: 21});
            x = Math.round(cmd.x);
            y = Math.round(cmd.y);
        } else if (cmd.type === 'L') {
            dx = Math.round(cmd.x - x);
            dy = Math.round(cmd.y - y);
            ops.push({name: 'dx', type: 'NUMBER', value: dx});
            ops.push({name: 'dy', type: 'NUMBER', value: dy});
            ops.push({name: 'rlineto', type: 'OP', value: 5});
            x = Math.round(cmd.x);
            y = Math.round(cmd.y);
        } else if (cmd.type === 'C') {
            var dx1 = Math.round(cmd.x1 - x);
            var dy1 = Math.round(cmd.y1 - y);
            var dx2 = Math.round(cmd.x2 - cmd.x1);
            var dy2 = Math.round(cmd.y2 - cmd.y1);
            dx = Math.round(cmd.x - cmd.x2);
            dy = Math.round(cmd.y - cmd.y2);
            ops.push({name: 'dx1', type: 'NUMBER', value: dx1});
            ops.push({name: 'dy1', type: 'NUMBER', value: dy1});
            ops.push({name: 'dx2', type: 'NUMBER', value: dx2});
            ops.push({name: 'dy2', type: 'NUMBER', value: dy2});
            ops.push({name: 'dx', type: 'NUMBER', value: dx});
            ops.push({name: 'dy', type: 'NUMBER', value: dy});
            ops.push({name: 'rrcurveto', type: 'OP', value: 8});
            x = Math.round(cmd.x);
            y = Math.round(cmd.y);
        }

        // Contours are closed automatically.
    }

    ops.push({name: 'endchar', type: 'OP', value: 14});
    return ops;
}

function makeCharStringsIndex(glyphs) {
    var t = new table.Record('CharStrings INDEX', [
        {name: 'charStrings', type: 'INDEX', value: []}
    ]);

    for (var i = 0; i < glyphs.length; i += 1) {
        var glyph = glyphs.get(i);
        var ops = glyphToOps(glyph);
        t.charStrings.push({name: glyph.name, type: 'CHARSTRING', value: ops});
    }

    return t;
}

function makePrivateDict(attrs, strings) {
    var t = new table.Record('Private DICT', [
        {name: 'dict', type: 'DICT', value: {}}
    ]);
    t.dict = makeDict(PRIVATE_DICT_META, attrs, strings);
    return t;
}

function makeCFFTable(glyphs, options) {
    var t = new table.Table('CFF ', [
        {name: 'header', type: 'RECORD'},
        {name: 'nameIndex', type: 'RECORD'},
        {name: 'topDictIndex', type: 'RECORD'},
        {name: 'stringIndex', type: 'RECORD'},
        {name: 'globalSubrIndex', type: 'RECORD'},
        {name: 'charsets', type: 'RECORD'},
        {name: 'charStringsIndex', type: 'RECORD'},
        {name: 'privateDict', type: 'RECORD'}
    ]);

    var fontScale = 1 / options.unitsPerEm;
    // We use non-zero values for the offsets so that the DICT encodes them.
    // This is important because the size of the Top DICT plays a role in offset calculation,
    // and the size shouldn't change after we've written correct offsets.
    var attrs = {
        version: options.version,
        fullName: options.fullName,
        familyName: options.familyName,
        weight: options.weightName,
        fontBBox: options.fontBBox || [0, 0, 0, 0],
        fontMatrix: [fontScale, 0, 0, fontScale, 0, 0],
        charset: 999,
        encoding: 0,
        charStrings: 999,
        private: [0, 999]
    };

    var privateAttrs = {};

    var glyphNames = [];
    var glyph;

    // Skip first glyph (.notdef)
    for (var i = 1; i < glyphs.length; i += 1) {
        glyph = glyphs.get(i);
        glyphNames.push(glyph.name);
    }

    var strings = [];

    t.header = makeHeader();
    t.nameIndex = makeNameIndex([options.postScriptName]);
    var topDict = makeTopDict(attrs, strings);
    t.topDictIndex = makeTopDictIndex(topDict);
    t.globalSubrIndex = makeGlobalSubrIndex();
    t.charsets = makeCharsets(glyphNames, strings);
    t.charStringsIndex = makeCharStringsIndex(glyphs);
    t.privateDict = makePrivateDict(privateAttrs, strings);

    // Needs to come at the end, to encode all custom strings used in the font.
    t.stringIndex = makeStringIndex(strings);

    var startOffset = t.header.sizeOf() +
        t.nameIndex.sizeOf() +
        t.topDictIndex.sizeOf() +
        t.stringIndex.sizeOf() +
        t.globalSubrIndex.sizeOf();
    attrs.charset = startOffset;

    // We use the CFF standard encoding; proper encoding will be handled in cmap.
    attrs.encoding = 0;
    attrs.charStrings = attrs.charset + t.charsets.sizeOf();
    attrs.private[1] = attrs.charStrings + t.charStringsIndex.sizeOf();

    // Recreate the Top DICT INDEX with the correct offsets.
    topDict = makeTopDict(attrs, strings);
    t.topDictIndex = makeTopDictIndex(topDict);

    return t;
}

var cff = { parse: parseCFFTable, make: makeCFFTable };

// The `head` table contains global information about the font.
// https://www.microsoft.com/typography/OTSPEC/head.htm

// Parse the header `head` table
function parseHeadTable(data, start) {
    var head = {};
    var p = new parse.Parser(data, start);
    head.version = p.parseVersion();
    head.fontRevision = Math.round(p.parseFixed() * 1000) / 1000;
    head.checkSumAdjustment = p.parseULong();
    head.magicNumber = p.parseULong();
    check.argument(head.magicNumber === 0x5F0F3CF5, 'Font header has wrong magic number.');
    head.flags = p.parseUShort();
    head.unitsPerEm = p.parseUShort();
    head.created = p.parseLongDateTime();
    head.modified = p.parseLongDateTime();
    head.xMin = p.parseShort();
    head.yMin = p.parseShort();
    head.xMax = p.parseShort();
    head.yMax = p.parseShort();
    head.macStyle = p.parseUShort();
    head.lowestRecPPEM = p.parseUShort();
    head.fontDirectionHint = p.parseShort();
    head.indexToLocFormat = p.parseShort();
    head.glyphDataFormat = p.parseShort();
    return head;
}

function makeHeadTable(options) {
    // Apple Mac timestamp epoch is 01/01/1904 not 01/01/1970
    var timestamp = Math.round(new Date().getTime() / 1000) + 2082844800;
    var createdTimestamp = timestamp;

    if (options.createdTimestamp) {
        createdTimestamp = options.createdTimestamp + 2082844800;
    }

    return new table.Table('head', [
        {name: 'version', type: 'FIXED', value: 0x00010000},
        {name: 'fontRevision', type: 'FIXED', value: 0x00010000},
        {name: 'checkSumAdjustment', type: 'ULONG', value: 0},
        {name: 'magicNumber', type: 'ULONG', value: 0x5F0F3CF5},
        {name: 'flags', type: 'USHORT', value: 0},
        {name: 'unitsPerEm', type: 'USHORT', value: 1000},
        {name: 'created', type: 'LONGDATETIME', value: createdTimestamp},
        {name: 'modified', type: 'LONGDATETIME', value: timestamp},
        {name: 'xMin', type: 'SHORT', value: 0},
        {name: 'yMin', type: 'SHORT', value: 0},
        {name: 'xMax', type: 'SHORT', value: 0},
        {name: 'yMax', type: 'SHORT', value: 0},
        {name: 'macStyle', type: 'USHORT', value: 0},
        {name: 'lowestRecPPEM', type: 'USHORT', value: 0},
        {name: 'fontDirectionHint', type: 'SHORT', value: 2},
        {name: 'indexToLocFormat', type: 'SHORT', value: 0},
        {name: 'glyphDataFormat', type: 'SHORT', value: 0}
    ], options);
}

var head = { parse: parseHeadTable, make: makeHeadTable };

// The `hhea` table contains information for horizontal layout.
// https://www.microsoft.com/typography/OTSPEC/hhea.htm

// Parse the horizontal header `hhea` table
function parseHheaTable(data, start) {
    var hhea = {};
    var p = new parse.Parser(data, start);
    hhea.version = p.parseVersion();
    hhea.ascender = p.parseShort();
    hhea.descender = p.parseShort();
    hhea.lineGap = p.parseShort();
    hhea.advanceWidthMax = p.parseUShort();
    hhea.minLeftSideBearing = p.parseShort();
    hhea.minRightSideBearing = p.parseShort();
    hhea.xMaxExtent = p.parseShort();
    hhea.caretSlopeRise = p.parseShort();
    hhea.caretSlopeRun = p.parseShort();
    hhea.caretOffset = p.parseShort();
    p.relativeOffset += 8;
    hhea.metricDataFormat = p.parseShort();
    hhea.numberOfHMetrics = p.parseUShort();
    return hhea;
}

function makeHheaTable(options) {
    return new table.Table('hhea', [
        {name: 'version', type: 'FIXED', value: 0x00010000},
        {name: 'ascender', type: 'FWORD', value: 0},
        {name: 'descender', type: 'FWORD', value: 0},
        {name: 'lineGap', type: 'FWORD', value: 0},
        {name: 'advanceWidthMax', type: 'UFWORD', value: 0},
        {name: 'minLeftSideBearing', type: 'FWORD', value: 0},
        {name: 'minRightSideBearing', type: 'FWORD', value: 0},
        {name: 'xMaxExtent', type: 'FWORD', value: 0},
        {name: 'caretSlopeRise', type: 'SHORT', value: 1},
        {name: 'caretSlopeRun', type: 'SHORT', value: 0},
        {name: 'caretOffset', type: 'SHORT', value: 0},
        {name: 'reserved1', type: 'SHORT', value: 0},
        {name: 'reserved2', type: 'SHORT', value: 0},
        {name: 'reserved3', type: 'SHORT', value: 0},
        {name: 'reserved4', type: 'SHORT', value: 0},
        {name: 'metricDataFormat', type: 'SHORT', value: 0},
        {name: 'numberOfHMetrics', type: 'USHORT', value: 0}
    ], options);
}

var hhea = { parse: parseHheaTable, make: makeHheaTable };

// The `hmtx` table contains the horizontal metrics for all glyphs.
// https://www.microsoft.com/typography/OTSPEC/hmtx.htm

// Parse the `hmtx` table, which contains the horizontal metrics for all glyphs.
// This function augments the glyph array, adding the advanceWidth and leftSideBearing to each glyph.
function parseHmtxTable(data, start, numMetrics, numGlyphs, glyphs) {
    var advanceWidth;
    var leftSideBearing;
    var p = new parse.Parser(data, start);
    for (var i = 0; i < numGlyphs; i += 1) {
        // If the font is monospaced, only one entry is needed. This last entry applies to all subsequent glyphs.
        if (i < numMetrics) {
            advanceWidth = p.parseUShort();
            leftSideBearing = p.parseShort();
        }

        var glyph = glyphs.get(i);
        glyph.advanceWidth = advanceWidth;
        glyph.leftSideBearing = leftSideBearing;
    }
}

function makeHmtxTable(glyphs) {
    var t = new table.Table('hmtx', []);
    for (var i = 0; i < glyphs.length; i += 1) {
        var glyph = glyphs.get(i);
        var advanceWidth = glyph.advanceWidth || 0;
        var leftSideBearing = glyph.leftSideBearing || 0;
        t.fields.push({name: 'advanceWidth_' + i, type: 'USHORT', value: advanceWidth});
        t.fields.push({name: 'leftSideBearing_' + i, type: 'SHORT', value: leftSideBearing});
    }

    return t;
}

var hmtx = { parse: parseHmtxTable, make: makeHmtxTable };

// The `ltag` table stores IETF BCP-47 language tags. It allows supporting
// languages for which TrueType does not assign a numeric code.
// https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6ltag.html
// http://www.w3.org/International/articles/language-tags/
// http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry

function makeLtagTable(tags) {
    var result = new table.Table('ltag', [
        {name: 'version', type: 'ULONG', value: 1},
        {name: 'flags', type: 'ULONG', value: 0},
        {name: 'numTags', type: 'ULONG', value: tags.length}
    ]);

    var stringPool = '';
    var stringPoolOffset = 12 + tags.length * 4;
    for (var i = 0; i < tags.length; ++i) {
        var pos = stringPool.indexOf(tags[i]);
        if (pos < 0) {
            pos = stringPool.length;
            stringPool += tags[i];
        }

        result.fields.push({name: 'offset ' + i, type: 'USHORT', value: stringPoolOffset + pos});
        result.fields.push({name: 'length ' + i, type: 'USHORT', value: tags[i].length});
    }

    result.fields.push({name: 'stringPool', type: 'CHARARRAY', value: stringPool});
    return result;
}

function parseLtagTable(data, start) {
    var p = new parse.Parser(data, start);
    var tableVersion = p.parseULong();
    check.argument(tableVersion === 1, 'Unsupported ltag table version.');
    // The 'ltag' specification does not define any flags; skip the field.
    p.skip('uLong', 1);
    var numTags = p.parseULong();

    var tags = [];
    for (var i = 0; i < numTags; i++) {
        var tag = '';
        var offset = start + p.parseUShort();
        var length = p.parseUShort();
        for (var j = offset; j < offset + length; ++j) {
            tag += String.fromCharCode(data.getInt8(j));
        }

        tags.push(tag);
    }

    return tags;
}

var ltag = { make: makeLtagTable, parse: parseLtagTable };

// The `maxp` table establishes the memory requirements for the font.
// We need it just to get the number of glyphs in the font.
// https://www.microsoft.com/typography/OTSPEC/maxp.htm

// Parse the maximum profile `maxp` table.
function parseMaxpTable(data, start) {
    var maxp = {};
    var p = new parse.Parser(data, start);
    maxp.version = p.parseVersion();
    maxp.numGlyphs = p.parseUShort();
    if (maxp.version === 1.0) {
        maxp.maxPoints = p.parseUShort();
        maxp.maxContours = p.parseUShort();
        maxp.maxCompositePoints = p.parseUShort();
        maxp.maxCompositeContours = p.parseUShort();
        maxp.maxZones = p.parseUShort();
        maxp.maxTwilightPoints = p.parseUShort();
        maxp.maxStorage = p.parseUShort();
        maxp.maxFunctionDefs = p.parseUShort();
        maxp.maxInstructionDefs = p.parseUShort();
        maxp.maxStackElements = p.parseUShort();
        maxp.maxSizeOfInstructions = p.parseUShort();
        maxp.maxComponentElements = p.parseUShort();
        maxp.maxComponentDepth = p.parseUShort();
    }

    return maxp;
}

function makeMaxpTable(numGlyphs) {
    return new table.Table('maxp', [
        {name: 'version', type: 'FIXED', value: 0x00005000},
        {name: 'numGlyphs', type: 'USHORT', value: numGlyphs}
    ]);
}

var maxp = { parse: parseMaxpTable, make: makeMaxpTable };

// The `name` naming table.
// https://www.microsoft.com/typography/OTSPEC/name.htm

// NameIDs for the name table.
var nameTableNames = [
    'copyright',              // 0
    'fontFamily',             // 1
    'fontSubfamily',          // 2
    'uniqueID',               // 3
    'fullName',               // 4
    'version',                // 5
    'postScriptName',         // 6
    'trademark',              // 7
    'manufacturer',           // 8
    'designer',               // 9
    'description',            // 10
    'manufacturerURL',        // 11
    'designerURL',            // 12
    'license',                // 13
    'licenseURL',             // 14
    'reserved',               // 15
    'preferredFamily',        // 16
    'preferredSubfamily',     // 17
    'compatibleFullName',     // 18
    'sampleText',             // 19
    'postScriptFindFontName', // 20
    'wwsFamily',              // 21
    'wwsSubfamily'            // 22
];

var macLanguages = {
    0: 'en',
    1: 'fr',
    2: 'de',
    3: 'it',
    4: 'nl',
    5: 'sv',
    6: 'es',
    7: 'da',
    8: 'pt',
    9: 'no',
    10: 'he',
    11: 'ja',
    12: 'ar',
    13: 'fi',
    14: 'el',
    15: 'is',
    16: 'mt',
    17: 'tr',
    18: 'hr',
    19: 'zh-Hant',
    20: 'ur',
    21: 'hi',
    22: 'th',
    23: 'ko',
    24: 'lt',
    25: 'pl',
    26: 'hu',
    27: 'es',
    28: 'lv',
    29: 'se',
    30: 'fo',
    31: 'fa',
    32: 'ru',
    33: 'zh',
    34: 'nl-BE',
    35: 'ga',
    36: 'sq',
    37: 'ro',
    38: 'cz',
    39: 'sk',
    40: 'si',
    41: 'yi',
    42: 'sr',
    43: 'mk',
    44: 'bg',
    45: 'uk',
    46: 'be',
    47: 'uz',
    48: 'kk',
    49: 'az-Cyrl',
    50: 'az-Arab',
    51: 'hy',
    52: 'ka',
    53: 'mo',
    54: 'ky',
    55: 'tg',
    56: 'tk',
    57: 'mn-CN',
    58: 'mn',
    59: 'ps',
    60: 'ks',
    61: 'ku',
    62: 'sd',
    63: 'bo',
    64: 'ne',
    65: 'sa',
    66: 'mr',
    67: 'bn',
    68: 'as',
    69: 'gu',
    70: 'pa',
    71: 'or',
    72: 'ml',
    73: 'kn',
    74: 'ta',
    75: 'te',
    76: 'si',
    77: 'my',
    78: 'km',
    79: 'lo',
    80: 'vi',
    81: 'id',
    82: 'tl',
    83: 'ms',
    84: 'ms-Arab',
    85: 'am',
    86: 'ti',
    87: 'om',
    88: 'so',
    89: 'sw',
    90: 'rw',
    91: 'rn',
    92: 'ny',
    93: 'mg',
    94: 'eo',
    128: 'cy',
    129: 'eu',
    130: 'ca',
    131: 'la',
    132: 'qu',
    133: 'gn',
    134: 'ay',
    135: 'tt',
    136: 'ug',
    137: 'dz',
    138: 'jv',
    139: 'su',
    140: 'gl',
    141: 'af',
    142: 'br',
    143: 'iu',
    144: 'gd',
    145: 'gv',
    146: 'ga',
    147: 'to',
    148: 'el-polyton',
    149: 'kl',
    150: 'az',
    151: 'nn'
};

// MacOS language ID → MacOS script ID
//
// Note that the script ID is not sufficient to determine what encoding
// to use in TrueType files. For some languages, MacOS used a modification
// of a mainstream script. For example, an Icelandic name would be stored
// with smRoman in the TrueType naming table, but the actual encoding
// is a special Icelandic version of the normal Macintosh Roman encoding.
// As another example, Inuktitut uses an 8-bit encoding for Canadian Aboriginal
// Syllables but MacOS had run out of available script codes, so this was
// done as a (pretty radical) "modification" of Ethiopic.
//
// http://unicode.org/Public/MAPPINGS/VENDORS/APPLE/Readme.txt
var macLanguageToScript = {
    0: 0,  // langEnglish → smRoman
    1: 0,  // langFrench → smRoman
    2: 0,  // langGerman → smRoman
    3: 0,  // langItalian → smRoman
    4: 0,  // langDutch → smRoman
    5: 0,  // langSwedish → smRoman
    6: 0,  // langSpanish → smRoman
    7: 0,  // langDanish → smRoman
    8: 0,  // langPortuguese → smRoman
    9: 0,  // langNorwegian → smRoman
    10: 5,  // langHebrew → smHebrew
    11: 1,  // langJapanese → smJapanese
    12: 4,  // langArabic → smArabic
    13: 0,  // langFinnish → smRoman
    14: 6,  // langGreek → smGreek
    15: 0,  // langIcelandic → smRoman (modified)
    16: 0,  // langMaltese → smRoman
    17: 0,  // langTurkish → smRoman (modified)
    18: 0,  // langCroatian → smRoman (modified)
    19: 2,  // langTradChinese → smTradChinese
    20: 4,  // langUrdu → smArabic
    21: 9,  // langHindi → smDevanagari
    22: 21,  // langThai → smThai
    23: 3,  // langKorean → smKorean
    24: 29,  // langLithuanian → smCentralEuroRoman
    25: 29,  // langPolish → smCentralEuroRoman
    26: 29,  // langHungarian → smCentralEuroRoman
    27: 29,  // langEstonian → smCentralEuroRoman
    28: 29,  // langLatvian → smCentralEuroRoman
    29: 0,  // langSami → smRoman
    30: 0,  // langFaroese → smRoman (modified)
    31: 4,  // langFarsi → smArabic (modified)
    32: 7,  // langRussian → smCyrillic
    33: 25,  // langSimpChinese → smSimpChinese
    34: 0,  // langFlemish → smRoman
    35: 0,  // langIrishGaelic → smRoman (modified)
    36: 0,  // langAlbanian → smRoman
    37: 0,  // langRomanian → smRoman (modified)
    38: 29,  // langCzech → smCentralEuroRoman
    39: 29,  // langSlovak → smCentralEuroRoman
    40: 0,  // langSlovenian → smRoman (modified)
    41: 5,  // langYiddish → smHebrew
    42: 7,  // langSerbian → smCyrillic
    43: 7,  // langMacedonian → smCyrillic
    44: 7,  // langBulgarian → smCyrillic
    45: 7,  // langUkrainian → smCyrillic (modified)
    46: 7,  // langByelorussian → smCyrillic
    47: 7,  // langUzbek → smCyrillic
    48: 7,  // langKazakh → smCyrillic
    49: 7,  // langAzerbaijani → smCyrillic
    50: 4,  // langAzerbaijanAr → smArabic
    51: 24,  // langArmenian → smArmenian
    52: 23,  // langGeorgian → smGeorgian
    53: 7,  // langMoldavian → smCyrillic
    54: 7,  // langKirghiz → smCyrillic
    55: 7,  // langTajiki → smCyrillic
    56: 7,  // langTurkmen → smCyrillic
    57: 27,  // langMongolian → smMongolian
    58: 7,  // langMongolianCyr → smCyrillic
    59: 4,  // langPashto → smArabic
    60: 4,  // langKurdish → smArabic
    61: 4,  // langKashmiri → smArabic
    62: 4,  // langSindhi → smArabic
    63: 26,  // langTibetan → smTibetan
    64: 9,  // langNepali → smDevanagari
    65: 9,  // langSanskrit → smDevanagari
    66: 9,  // langMarathi → smDevanagari
    67: 13,  // langBengali → smBengali
    68: 13,  // langAssamese → smBengali
    69: 11,  // langGujarati → smGujarati
    70: 10,  // langPunjabi → smGurmukhi
    71: 12,  // langOriya → smOriya
    72: 17,  // langMalayalam → smMalayalam
    73: 16,  // langKannada → smKannada
    74: 14,  // langTamil → smTamil
    75: 15,  // langTelugu → smTelugu
    76: 18,  // langSinhalese → smSinhalese
    77: 19,  // langBurmese → smBurmese
    78: 20,  // langKhmer → smKhmer
    79: 22,  // langLao → smLao
    80: 30,  // langVietnamese → smVietnamese
    81: 0,  // langIndonesian → smRoman
    82: 0,  // langTagalog → smRoman
    83: 0,  // langMalayRoman → smRoman
    84: 4,  // langMalayArabic → smArabic
    85: 28,  // langAmharic → smEthiopic
    86: 28,  // langTigrinya → smEthiopic
    87: 28,  // langOromo → smEthiopic
    88: 0,  // langSomali → smRoman
    89: 0,  // langSwahili → smRoman
    90: 0,  // langKinyarwanda → smRoman
    91: 0,  // langRundi → smRoman
    92: 0,  // langNyanja → smRoman
    93: 0,  // langMalagasy → smRoman
    94: 0,  // langEsperanto → smRoman
    128: 0,  // langWelsh → smRoman (modified)
    129: 0,  // langBasque → smRoman
    130: 0,  // langCatalan → smRoman
    131: 0,  // langLatin → smRoman
    132: 0,  // langQuechua → smRoman
    133: 0,  // langGuarani → smRoman
    134: 0,  // langAymara → smRoman
    135: 7,  // langTatar → smCyrillic
    136: 4,  // langUighur → smArabic
    137: 26,  // langDzongkha → smTibetan
    138: 0,  // langJavaneseRom → smRoman
    139: 0,  // langSundaneseRom → smRoman
    140: 0,  // langGalician → smRoman
    141: 0,  // langAfrikaans → smRoman
    142: 0,  // langBreton → smRoman (modified)
    143: 28,  // langInuktitut → smEthiopic (modified)
    144: 0,  // langScottishGaelic → smRoman (modified)
    145: 0,  // langManxGaelic → smRoman (modified)
    146: 0,  // langIrishGaelicScript → smRoman (modified)
    147: 0,  // langTongan → smRoman
    148: 6,  // langGreekAncient → smRoman
    149: 0,  // langGreenlandic → smRoman
    150: 0,  // langAzerbaijanRoman → smRoman
    151: 0   // langNynorsk → smRoman
};

// While Microsoft indicates a region/country for all its language
// IDs, we omit the region code if it's equal to the "most likely
// region subtag" according to Unicode CLDR. For scripts, we omit
// the subtag if it is equal to the Suppress-Script entry in the
// IANA language subtag registry for IETF BCP 47.
//
// For example, Microsoft states that its language code 0x041A is
// Croatian in Croatia. We transform this to the BCP 47 language code 'hr'
// and not 'hr-HR' because Croatia is the default country for Croatian,
// according to Unicode CLDR. As another example, Microsoft states
// that 0x101A is Croatian (Latin) in Bosnia-Herzegovina. We transform
// this to 'hr-BA' and not 'hr-Latn-BA' because Latin is the default script
// for the Croatian language, according to IANA.
//
// http://www.unicode.org/cldr/charts/latest/supplemental/likely_subtags.html
// http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
var windowsLanguages = {
    0x0436: 'af',
    0x041C: 'sq',
    0x0484: 'gsw',
    0x045E: 'am',
    0x1401: 'ar-DZ',
    0x3C01: 'ar-BH',
    0x0C01: 'ar',
    0x0801: 'ar-IQ',
    0x2C01: 'ar-JO',
    0x3401: 'ar-KW',
    0x3001: 'ar-LB',
    0x1001: 'ar-LY',
    0x1801: 'ary',
    0x2001: 'ar-OM',
    0x4001: 'ar-QA',
    0x0401: 'ar-SA',
    0x2801: 'ar-SY',
    0x1C01: 'aeb',
    0x3801: 'ar-AE',
    0x2401: 'ar-YE',
    0x042B: 'hy',
    0x044D: 'as',
    0x082C: 'az-Cyrl',
    0x042C: 'az',
    0x046D: 'ba',
    0x042D: 'eu',
    0x0423: 'be',
    0x0845: 'bn',
    0x0445: 'bn-IN',
    0x201A: 'bs-Cyrl',
    0x141A: 'bs',
    0x047E: 'br',
    0x0402: 'bg',
    0x0403: 'ca',
    0x0C04: 'zh-HK',
    0x1404: 'zh-MO',
    0x0804: 'zh',
    0x1004: 'zh-SG',
    0x0404: 'zh-TW',
    0x0483: 'co',
    0x041A: 'hr',
    0x101A: 'hr-BA',
    0x0405: 'cs',
    0x0406: 'da',
    0x048C: 'prs',
    0x0465: 'dv',
    0x0813: 'nl-BE',
    0x0413: 'nl',
    0x0C09: 'en-AU',
    0x2809: 'en-BZ',
    0x1009: 'en-CA',
    0x2409: 'en-029',
    0x4009: 'en-IN',
    0x1809: 'en-IE',
    0x2009: 'en-JM',
    0x4409: 'en-MY',
    0x1409: 'en-NZ',
    0x3409: 'en-PH',
    0x4809: 'en-SG',
    0x1C09: 'en-ZA',
    0x2C09: 'en-TT',
    0x0809: 'en-GB',
    0x0409: 'en',
    0x3009: 'en-ZW',
    0x0425: 'et',
    0x0438: 'fo',
    0x0464: 'fil',
    0x040B: 'fi',
    0x080C: 'fr-BE',
    0x0C0C: 'fr-CA',
    0x040C: 'fr',
    0x140C: 'fr-LU',
    0x180C: 'fr-MC',
    0x100C: 'fr-CH',
    0x0462: 'fy',
    0x0456: 'gl',
    0x0437: 'ka',
    0x0C07: 'de-AT',
    0x0407: 'de',
    0x1407: 'de-LI',
    0x1007: 'de-LU',
    0x0807: 'de-CH',
    0x0408: 'el',
    0x046F: 'kl',
    0x0447: 'gu',
    0x0468: 'ha',
    0x040D: 'he',
    0x0439: 'hi',
    0x040E: 'hu',
    0x040F: 'is',
    0x0470: 'ig',
    0x0421: 'id',
    0x045D: 'iu',
    0x085D: 'iu-Latn',
    0x083C: 'ga',
    0x0434: 'xh',
    0x0435: 'zu',
    0x0410: 'it',
    0x0810: 'it-CH',
    0x0411: 'ja',
    0x044B: 'kn',
    0x043F: 'kk',
    0x0453: 'km',
    0x0486: 'quc',
    0x0487: 'rw',
    0x0441: 'sw',
    0x0457: 'kok',
    0x0412: 'ko',
    0x0440: 'ky',
    0x0454: 'lo',
    0x0426: 'lv',
    0x0427: 'lt',
    0x082E: 'dsb',
    0x046E: 'lb',
    0x042F: 'mk',
    0x083E: 'ms-BN',
    0x043E: 'ms',
    0x044C: 'ml',
    0x043A: 'mt',
    0x0481: 'mi',
    0x047A: 'arn',
    0x044E: 'mr',
    0x047C: 'moh',
    0x0450: 'mn',
    0x0850: 'mn-CN',
    0x0461: 'ne',
    0x0414: 'nb',
    0x0814: 'nn',
    0x0482: 'oc',
    0x0448: 'or',
    0x0463: 'ps',
    0x0415: 'pl',
    0x0416: 'pt',
    0x0816: 'pt-PT',
    0x0446: 'pa',
    0x046B: 'qu-BO',
    0x086B: 'qu-EC',
    0x0C6B: 'qu',
    0x0418: 'ro',
    0x0417: 'rm',
    0x0419: 'ru',
    0x243B: 'smn',
    0x103B: 'smj-NO',
    0x143B: 'smj',
    0x0C3B: 'se-FI',
    0x043B: 'se',
    0x083B: 'se-SE',
    0x203B: 'sms',
    0x183B: 'sma-NO',
    0x1C3B: 'sms',
    0x044F: 'sa',
    0x1C1A: 'sr-Cyrl-BA',
    0x0C1A: 'sr',
    0x181A: 'sr-Latn-BA',
    0x081A: 'sr-Latn',
    0x046C: 'nso',
    0x0432: 'tn',
    0x045B: 'si',
    0x041B: 'sk',
    0x0424: 'sl',
    0x2C0A: 'es-AR',
    0x400A: 'es-BO',
    0x340A: 'es-CL',
    0x240A: 'es-CO',
    0x140A: 'es-CR',
    0x1C0A: 'es-DO',
    0x300A: 'es-EC',
    0x440A: 'es-SV',
    0x100A: 'es-GT',
    0x480A: 'es-HN',
    0x080A: 'es-MX',
    0x4C0A: 'es-NI',
    0x180A: 'es-PA',
    0x3C0A: 'es-PY',
    0x280A: 'es-PE',
    0x500A: 'es-PR',

    // Microsoft has defined two different language codes for
    // “Spanish with modern sorting” and “Spanish with traditional
    // sorting”. This makes sense for collation APIs, and it would be
    // possible to express this in BCP 47 language tags via Unicode
    // extensions (eg., es-u-co-trad is Spanish with traditional
    // sorting). However, for storing names in fonts, the distinction
    // does not make sense, so we give “es” in both cases.
    0x0C0A: 'es',
    0x040A: 'es',

    0x540A: 'es-US',
    0x380A: 'es-UY',
    0x200A: 'es-VE',
    0x081D: 'sv-FI',
    0x041D: 'sv',
    0x045A: 'syr',
    0x0428: 'tg',
    0x085F: 'tzm',
    0x0449: 'ta',
    0x0444: 'tt',
    0x044A: 'te',
    0x041E: 'th',
    0x0451: 'bo',
    0x041F: 'tr',
    0x0442: 'tk',
    0x0480: 'ug',
    0x0422: 'uk',
    0x042E: 'hsb',
    0x0420: 'ur',
    0x0843: 'uz-Cyrl',
    0x0443: 'uz',
    0x042A: 'vi',
    0x0452: 'cy',
    0x0488: 'wo',
    0x0485: 'sah',
    0x0478: 'ii',
    0x046A: 'yo'
};

// Returns a IETF BCP 47 language code, for example 'zh-Hant'
// for 'Chinese in the traditional script'.
function getLanguageCode(platformID, languageID, ltag) {
    switch (platformID) {
        case 0:  // Unicode
            if (languageID === 0xFFFF) {
                return 'und';
            } else if (ltag) {
                return ltag[languageID];
            }

            break;

        case 1:  // Macintosh
            return macLanguages[languageID];

        case 3:  // Windows
            return windowsLanguages[languageID];
    }

    return undefined;
}

var utf16 = 'utf-16';

// MacOS script ID → encoding. This table stores the default case,
// which can be overridden by macLanguageEncodings.
var macScriptEncodings = {
    0: 'macintosh',           // smRoman
    1: 'x-mac-japanese',      // smJapanese
    2: 'x-mac-chinesetrad',   // smTradChinese
    3: 'x-mac-korean',        // smKorean
    6: 'x-mac-greek',         // smGreek
    7: 'x-mac-cyrillic',      // smCyrillic
    9: 'x-mac-devanagai',     // smDevanagari
    10: 'x-mac-gurmukhi',     // smGurmukhi
    11: 'x-mac-gujarati',     // smGujarati
    12: 'x-mac-oriya',        // smOriya
    13: 'x-mac-bengali',      // smBengali
    14: 'x-mac-tamil',        // smTamil
    15: 'x-mac-telugu',       // smTelugu
    16: 'x-mac-kannada',      // smKannada
    17: 'x-mac-malayalam',    // smMalayalam
    18: 'x-mac-sinhalese',    // smSinhalese
    19: 'x-mac-burmese',      // smBurmese
    20: 'x-mac-khmer',        // smKhmer
    21: 'x-mac-thai',         // smThai
    22: 'x-mac-lao',          // smLao
    23: 'x-mac-georgian',     // smGeorgian
    24: 'x-mac-armenian',     // smArmenian
    25: 'x-mac-chinesesimp',  // smSimpChinese
    26: 'x-mac-tibetan',      // smTibetan
    27: 'x-mac-mongolian',    // smMongolian
    28: 'x-mac-ethiopic',     // smEthiopic
    29: 'x-mac-ce',           // smCentralEuroRoman
    30: 'x-mac-vietnamese',   // smVietnamese
    31: 'x-mac-extarabic'     // smExtArabic
};

// MacOS language ID → encoding. This table stores the exceptional
// cases, which override macScriptEncodings. For writing MacOS naming
// tables, we need to emit a MacOS script ID. Therefore, we cannot
// merge macScriptEncodings into macLanguageEncodings.
//
// http://unicode.org/Public/MAPPINGS/VENDORS/APPLE/Readme.txt
var macLanguageEncodings = {
    15: 'x-mac-icelandic',    // langIcelandic
    17: 'x-mac-turkish',      // langTurkish
    18: 'x-mac-croatian',     // langCroatian
    24: 'x-mac-ce',           // langLithuanian
    25: 'x-mac-ce',           // langPolish
    26: 'x-mac-ce',           // langHungarian
    27: 'x-mac-ce',           // langEstonian
    28: 'x-mac-ce',           // langLatvian
    30: 'x-mac-icelandic',    // langFaroese
    37: 'x-mac-romanian',     // langRomanian
    38: 'x-mac-ce',           // langCzech
    39: 'x-mac-ce',           // langSlovak
    40: 'x-mac-ce',           // langSlovenian
    143: 'x-mac-inuit',       // langInuktitut
    146: 'x-mac-gaelic'       // langIrishGaelicScript
};

function getEncoding(platformID, encodingID, languageID) {
    switch (platformID) {
        case 0:  // Unicode
            return utf16;

        case 1:  // Apple Macintosh
            return macLanguageEncodings[languageID] || macScriptEncodings[encodingID];

        case 3:  // Microsoft Windows
            if (encodingID === 1 || encodingID === 10) {
                return utf16;
            }

            break;
    }

    return undefined;
}

// Parse the naming `name` table.
// FIXME: Format 1 additional fields are not supported yet.
// ltag is the content of the `ltag' table, such as ['en', 'zh-Hans', 'de-CH-1904'].
function parseNameTable(data, start, ltag) {
    var name = {};
    var p = new parse.Parser(data, start);
    var format = p.parseUShort();
    var count = p.parseUShort();
    var stringOffset = p.offset + p.parseUShort();
    for (var i = 0; i < count; i++) {
        var platformID = p.parseUShort();
        var encodingID = p.parseUShort();
        var languageID = p.parseUShort();
        var nameID = p.parseUShort();
        var property = nameTableNames[nameID] || nameID;
        var byteLength = p.parseUShort();
        var offset = p.parseUShort();
        var language = getLanguageCode(platformID, languageID, ltag);
        var encoding = getEncoding(platformID, encodingID, languageID);
        if (encoding !== undefined && language !== undefined) {
            var text = (void 0);
            if (encoding === utf16) {
                text = decode.UTF16(data, stringOffset + offset, byteLength);
            } else {
                text = decode.MACSTRING(data, stringOffset + offset, byteLength, encoding);
            }

            if (text) {
                var translations = name[property];
                if (translations === undefined) {
                    translations = name[property] = {};
                }

                translations[language] = text;
            }
        }
    }

    var langTagCount = 0;
    if (format === 1) {
        // FIXME: Also handle Microsoft's 'name' table 1.
        langTagCount = p.parseUShort();
    }

    return name;
}

// {23: 'foo'} → {'foo': 23}
// ['bar', 'baz'] → {'bar': 0, 'baz': 1}
function reverseDict(dict) {
    var result = {};
    for (var key in dict) {
        result[dict[key]] = parseInt(key);
    }

    return result;
}

function makeNameRecord(platformID, encodingID, languageID, nameID, length, offset) {
    return new table.Record('NameRecord', [
        {name: 'platformID', type: 'USHORT', value: platformID},
        {name: 'encodingID', type: 'USHORT', value: encodingID},
        {name: 'languageID', type: 'USHORT', value: languageID},
        {name: 'nameID', type: 'USHORT', value: nameID},
        {name: 'length', type: 'USHORT', value: length},
        {name: 'offset', type: 'USHORT', value: offset}
    ]);
}

// Finds the position of needle in haystack, or -1 if not there.
// Like String.indexOf(), but for arrays.
function findSubArray(needle, haystack) {
    var needleLength = needle.length;
    var limit = haystack.length - needleLength + 1;

    loop:
    for (var pos = 0; pos < limit; pos++) {
        for (; pos < limit; pos++) {
            for (var k = 0; k < needleLength; k++) {
                if (haystack[pos + k] !== needle[k]) {
                    continue loop;
                }
            }

            return pos;
        }
    }

    return -1;
}

function addStringToPool(s, pool) {
    var offset = findSubArray(s, pool);
    if (offset < 0) {
        offset = pool.length;
        var i = 0;
        var len = s.length;
        for (; i < len; ++i) {
            pool.push(s[i]);
        }

    }

    return offset;
}

function makeNameTable(names, ltag) {
    var nameID;
    var nameIDs = [];

    var namesWithNumericKeys = {};
    var nameTableIds = reverseDict(nameTableNames);
    for (var key in names) {
        var id = nameTableIds[key];
        if (id === undefined) {
            id = key;
        }

        nameID = parseInt(id);

        if (isNaN(nameID)) {
            throw new Error('Name table entry "' + key + '" does not exist, see nameTableNames for complete list.');
        }

        namesWithNumericKeys[nameID] = names[key];
        nameIDs.push(nameID);
    }

    var macLanguageIds = reverseDict(macLanguages);
    var windowsLanguageIds = reverseDict(windowsLanguages);

    var nameRecords = [];
    var stringPool = [];

    for (var i = 0; i < nameIDs.length; i++) {
        nameID = nameIDs[i];
        var translations = namesWithNumericKeys[nameID];
        for (var lang in translations) {
            var text = translations[lang];

            // For MacOS, we try to emit the name in the form that was introduced
            // in the initial version of the TrueType spec (in the late 1980s).
            // However, this can fail for various reasons: the requested BCP 47
            // language code might not have an old-style Mac equivalent;
            // we might not have a codec for the needed character encoding;
            // or the name might contain characters that cannot be expressed
            // in the old-style Macintosh encoding. In case of failure, we emit
            // the name in a more modern fashion (Unicode encoding with BCP 47
            // language tags) that is recognized by MacOS 10.5, released in 2009.
            // If fonts were only read by operating systems, we could simply
            // emit all names in the modern form; this would be much easier.
            // However, there are many applications and libraries that read
            // 'name' tables directly, and these will usually only recognize
            // the ancient form (silently skipping the unrecognized names).
            var macPlatform = 1;  // Macintosh
            var macLanguage = macLanguageIds[lang];
            var macScript = macLanguageToScript[macLanguage];
            var macEncoding = getEncoding(macPlatform, macScript, macLanguage);
            var macName = encode.MACSTRING(text, macEncoding);
            if (macName === undefined) {
                macPlatform = 0;  // Unicode
                macLanguage = ltag.indexOf(lang);
                if (macLanguage < 0) {
                    macLanguage = ltag.length;
                    ltag.push(lang);
                }

                macScript = 4;  // Unicode 2.0 and later
                macName = encode.UTF16(text);
            }

            var macNameOffset = addStringToPool(macName, stringPool);
            nameRecords.push(makeNameRecord(macPlatform, macScript, macLanguage,
                                            nameID, macName.length, macNameOffset));

            var winLanguage = windowsLanguageIds[lang];
            if (winLanguage !== undefined) {
                var winName = encode.UTF16(text);
                var winNameOffset = addStringToPool(winName, stringPool);
                nameRecords.push(makeNameRecord(3, 1, winLanguage,
                                                nameID, winName.length, winNameOffset));
            }
        }
    }

    nameRecords.sort(function(a, b) {
        return ((a.platformID - b.platformID) ||
                (a.encodingID - b.encodingID) ||
                (a.languageID - b.languageID) ||
                (a.nameID - b.nameID));
    });

    var t = new table.Table('name', [
        {name: 'format', type: 'USHORT', value: 0},
        {name: 'count', type: 'USHORT', value: nameRecords.length},
        {name: 'stringOffset', type: 'USHORT', value: 6 + nameRecords.length * 12}
    ]);

    for (var r = 0; r < nameRecords.length; r++) {
        t.fields.push({name: 'record_' + r, type: 'RECORD', value: nameRecords[r]});
    }

    t.fields.push({name: 'strings', type: 'LITERAL', value: stringPool});
    return t;
}

var _name = { parse: parseNameTable, make: makeNameTable };

// The `OS/2` table contains metrics required in OpenType fonts.
// https://www.microsoft.com/typography/OTSPEC/os2.htm

var unicodeRanges = [
    {begin: 0x0000, end: 0x007F}, // Basic Latin
    {begin: 0x0080, end: 0x00FF}, // Latin-1 Supplement
    {begin: 0x0100, end: 0x017F}, // Latin Extended-A
    {begin: 0x0180, end: 0x024F}, // Latin Extended-B
    {begin: 0x0250, end: 0x02AF}, // IPA Extensions
    {begin: 0x02B0, end: 0x02FF}, // Spacing Modifier Letters
    {begin: 0x0300, end: 0x036F}, // Combining Diacritical Marks
    {begin: 0x0370, end: 0x03FF}, // Greek and Coptic
    {begin: 0x2C80, end: 0x2CFF}, // Coptic
    {begin: 0x0400, end: 0x04FF}, // Cyrillic
    {begin: 0x0530, end: 0x058F}, // Armenian
    {begin: 0x0590, end: 0x05FF}, // Hebrew
    {begin: 0xA500, end: 0xA63F}, // Vai
    {begin: 0x0600, end: 0x06FF}, // Arabic
    {begin: 0x07C0, end: 0x07FF}, // NKo
    {begin: 0x0900, end: 0x097F}, // Devanagari
    {begin: 0x0980, end: 0x09FF}, // Bengali
    {begin: 0x0A00, end: 0x0A7F}, // Gurmukhi
    {begin: 0x0A80, end: 0x0AFF}, // Gujarati
    {begin: 0x0B00, end: 0x0B7F}, // Oriya
    {begin: 0x0B80, end: 0x0BFF}, // Tamil
    {begin: 0x0C00, end: 0x0C7F}, // Telugu
    {begin: 0x0C80, end: 0x0CFF}, // Kannada
    {begin: 0x0D00, end: 0x0D7F}, // Malayalam
    {begin: 0x0E00, end: 0x0E7F}, // Thai
    {begin: 0x0E80, end: 0x0EFF}, // Lao
    {begin: 0x10A0, end: 0x10FF}, // Georgian
    {begin: 0x1B00, end: 0x1B7F}, // Balinese
    {begin: 0x1100, end: 0x11FF}, // Hangul Jamo
    {begin: 0x1E00, end: 0x1EFF}, // Latin Extended Additional
    {begin: 0x1F00, end: 0x1FFF}, // Greek Extended
    {begin: 0x2000, end: 0x206F}, // General Punctuation
    {begin: 0x2070, end: 0x209F}, // Superscripts And Subscripts
    {begin: 0x20A0, end: 0x20CF}, // Currency Symbol
    {begin: 0x20D0, end: 0x20FF}, // Combining Diacritical Marks For Symbols
    {begin: 0x2100, end: 0x214F}, // Letterlike Symbols
    {begin: 0x2150, end: 0x218F}, // Number Forms
    {begin: 0x2190, end: 0x21FF}, // Arrows
    {begin: 0x2200, end: 0x22FF}, // Mathematical Operators
    {begin: 0x2300, end: 0x23FF}, // Miscellaneous Technical
    {begin: 0x2400, end: 0x243F}, // Control Pictures
    {begin: 0x2440, end: 0x245F}, // Optical Character Recognition
    {begin: 0x2460, end: 0x24FF}, // Enclosed Alphanumerics
    {begin: 0x2500, end: 0x257F}, // Box Drawing
    {begin: 0x2580, end: 0x259F}, // Block Elements
    {begin: 0x25A0, end: 0x25FF}, // Geometric Shapes
    {begin: 0x2600, end: 0x26FF}, // Miscellaneous Symbols
    {begin: 0x2700, end: 0x27BF}, // Dingbats
    {begin: 0x3000, end: 0x303F}, // CJK Symbols And Punctuation
    {begin: 0x3040, end: 0x309F}, // Hiragana
    {begin: 0x30A0, end: 0x30FF}, // Katakana
    {begin: 0x3100, end: 0x312F}, // Bopomofo
    {begin: 0x3130, end: 0x318F}, // Hangul Compatibility Jamo
    {begin: 0xA840, end: 0xA87F}, // Phags-pa
    {begin: 0x3200, end: 0x32FF}, // Enclosed CJK Letters And Months
    {begin: 0x3300, end: 0x33FF}, // CJK Compatibility
    {begin: 0xAC00, end: 0xD7AF}, // Hangul Syllables
    {begin: 0xD800, end: 0xDFFF}, // Non-Plane 0 *
    {begin: 0x10900, end: 0x1091F}, // Phoenicia
    {begin: 0x4E00, end: 0x9FFF}, // CJK Unified Ideographs
    {begin: 0xE000, end: 0xF8FF}, // Private Use Area (plane 0)
    {begin: 0x31C0, end: 0x31EF}, // CJK Strokes
    {begin: 0xFB00, end: 0xFB4F}, // Alphabetic Presentation Forms
    {begin: 0xFB50, end: 0xFDFF}, // Arabic Presentation Forms-A
    {begin: 0xFE20, end: 0xFE2F}, // Combining Half Marks
    {begin: 0xFE10, end: 0xFE1F}, // Vertical Forms
    {begin: 0xFE50, end: 0xFE6F}, // Small Form Variants
    {begin: 0xFE70, end: 0xFEFF}, // Arabic Presentation Forms-B
    {begin: 0xFF00, end: 0xFFEF}, // Halfwidth And Fullwidth Forms
    {begin: 0xFFF0, end: 0xFFFF}, // Specials
    {begin: 0x0F00, end: 0x0FFF}, // Tibetan
    {begin: 0x0700, end: 0x074F}, // Syriac
    {begin: 0x0780, end: 0x07BF}, // Thaana
    {begin: 0x0D80, end: 0x0DFF}, // Sinhala
    {begin: 0x1000, end: 0x109F}, // Myanmar
    {begin: 0x1200, end: 0x137F}, // Ethiopic
    {begin: 0x13A0, end: 0x13FF}, // Cherokee
    {begin: 0x1400, end: 0x167F}, // Unified Canadian Aboriginal Syllabics
    {begin: 0x1680, end: 0x169F}, // Ogham
    {begin: 0x16A0, end: 0x16FF}, // Runic
    {begin: 0x1780, end: 0x17FF}, // Khmer
    {begin: 0x1800, end: 0x18AF}, // Mongolian
    {begin: 0x2800, end: 0x28FF}, // Braille Patterns
    {begin: 0xA000, end: 0xA48F}, // Yi Syllables
    {begin: 0x1700, end: 0x171F}, // Tagalog
    {begin: 0x10300, end: 0x1032F}, // Old Italic
    {begin: 0x10330, end: 0x1034F}, // Gothic
    {begin: 0x10400, end: 0x1044F}, // Deseret
    {begin: 0x1D000, end: 0x1D0FF}, // Byzantine Musical Symbols
    {begin: 0x1D400, end: 0x1D7FF}, // Mathematical Alphanumeric Symbols
    {begin: 0xFF000, end: 0xFFFFD}, // Private Use (plane 15)
    {begin: 0xFE00, end: 0xFE0F}, // Variation Selectors
    {begin: 0xE0000, end: 0xE007F}, // Tags
    {begin: 0x1900, end: 0x194F}, // Limbu
    {begin: 0x1950, end: 0x197F}, // Tai Le
    {begin: 0x1980, end: 0x19DF}, // New Tai Lue
    {begin: 0x1A00, end: 0x1A1F}, // Buginese
    {begin: 0x2C00, end: 0x2C5F}, // Glagolitic
    {begin: 0x2D30, end: 0x2D7F}, // Tifinagh
    {begin: 0x4DC0, end: 0x4DFF}, // Yijing Hexagram Symbols
    {begin: 0xA800, end: 0xA82F}, // Syloti Nagri
    {begin: 0x10000, end: 0x1007F}, // Linear B Syllabary
    {begin: 0x10140, end: 0x1018F}, // Ancient Greek Numbers
    {begin: 0x10380, end: 0x1039F}, // Ugaritic
    {begin: 0x103A0, end: 0x103DF}, // Old Persian
    {begin: 0x10450, end: 0x1047F}, // Shavian
    {begin: 0x10480, end: 0x104AF}, // Osmanya
    {begin: 0x10800, end: 0x1083F}, // Cypriot Syllabary
    {begin: 0x10A00, end: 0x10A5F}, // Kharoshthi
    {begin: 0x1D300, end: 0x1D35F}, // Tai Xuan Jing Symbols
    {begin: 0x12000, end: 0x123FF}, // Cuneiform
    {begin: 0x1D360, end: 0x1D37F}, // Counting Rod Numerals
    {begin: 0x1B80, end: 0x1BBF}, // Sundanese
    {begin: 0x1C00, end: 0x1C4F}, // Lepcha
    {begin: 0x1C50, end: 0x1C7F}, // Ol Chiki
    {begin: 0xA880, end: 0xA8DF}, // Saurashtra
    {begin: 0xA900, end: 0xA92F}, // Kayah Li
    {begin: 0xA930, end: 0xA95F}, // Rejang
    {begin: 0xAA00, end: 0xAA5F}, // Cham
    {begin: 0x10190, end: 0x101CF}, // Ancient Symbols
    {begin: 0x101D0, end: 0x101FF}, // Phaistos Disc
    {begin: 0x102A0, end: 0x102DF}, // Carian
    {begin: 0x1F030, end: 0x1F09F}  // Domino Tiles
];

function getUnicodeRange(unicode) {
    for (var i = 0; i < unicodeRanges.length; i += 1) {
        var range = unicodeRanges[i];
        if (unicode >= range.begin && unicode < range.end) {
            return i;
        }
    }

    return -1;
}

// Parse the OS/2 and Windows metrics `OS/2` table
function parseOS2Table(data, start) {
    var os2 = {};
    var p = new parse.Parser(data, start);
    os2.version = p.parseUShort();
    os2.xAvgCharWidth = p.parseShort();
    os2.usWeightClass = p.parseUShort();
    os2.usWidthClass = p.parseUShort();
    os2.fsType = p.parseUShort();
    os2.ySubscriptXSize = p.parseShort();
    os2.ySubscriptYSize = p.parseShort();
    os2.ySubscriptXOffset = p.parseShort();
    os2.ySubscriptYOffset = p.parseShort();
    os2.ySuperscriptXSize = p.parseShort();
    os2.ySuperscriptYSize = p.parseShort();
    os2.ySuperscriptXOffset = p.parseShort();
    os2.ySuperscriptYOffset = p.parseShort();
    os2.yStrikeoutSize = p.parseShort();
    os2.yStrikeoutPosition = p.parseShort();
    os2.sFamilyClass = p.parseShort();
    os2.panose = [];
    for (var i = 0; i < 10; i++) {
        os2.panose[i] = p.parseByte();
    }

    os2.ulUnicodeRange1 = p.parseULong();
    os2.ulUnicodeRange2 = p.parseULong();
    os2.ulUnicodeRange3 = p.parseULong();
    os2.ulUnicodeRange4 = p.parseULong();
    os2.achVendID = String.fromCharCode(p.parseByte(), p.parseByte(), p.parseByte(), p.parseByte());
    os2.fsSelection = p.parseUShort();
    os2.usFirstCharIndex = p.parseUShort();
    os2.usLastCharIndex = p.parseUShort();
    os2.sTypoAscender = p.parseShort();
    os2.sTypoDescender = p.parseShort();
    os2.sTypoLineGap = p.parseShort();
    os2.usWinAscent = p.parseUShort();
    os2.usWinDescent = p.parseUShort();
    if (os2.version >= 1) {
        os2.ulCodePageRange1 = p.parseULong();
        os2.ulCodePageRange2 = p.parseULong();
    }

    if (os2.version >= 2) {
        os2.sxHeight = p.parseShort();
        os2.sCapHeight = p.parseShort();
        os2.usDefaultChar = p.parseUShort();
        os2.usBreakChar = p.parseUShort();
        os2.usMaxContent = p.parseUShort();
    }

    return os2;
}

function makeOS2Table(options) {
    return new table.Table('OS/2', [
        {name: 'version', type: 'USHORT', value: 0x0003},
        {name: 'xAvgCharWidth', type: 'SHORT', value: 0},
        {name: 'usWeightClass', type: 'USHORT', value: 0},
        {name: 'usWidthClass', type: 'USHORT', value: 0},
        {name: 'fsType', type: 'USHORT', value: 0},
        {name: 'ySubscriptXSize', type: 'SHORT', value: 650},
        {name: 'ySubscriptYSize', type: 'SHORT', value: 699},
        {name: 'ySubscriptXOffset', type: 'SHORT', value: 0},
        {name: 'ySubscriptYOffset', type: 'SHORT', value: 140},
        {name: 'ySuperscriptXSize', type: 'SHORT', value: 650},
        {name: 'ySuperscriptYSize', type: 'SHORT', value: 699},
        {name: 'ySuperscriptXOffset', type: 'SHORT', value: 0},
        {name: 'ySuperscriptYOffset', type: 'SHORT', value: 479},
        {name: 'yStrikeoutSize', type: 'SHORT', value: 49},
        {name: 'yStrikeoutPosition', type: 'SHORT', value: 258},
        {name: 'sFamilyClass', type: 'SHORT', value: 0},
        {name: 'bFamilyType', type: 'BYTE', value: 0},
        {name: 'bSerifStyle', type: 'BYTE', value: 0},
        {name: 'bWeight', type: 'BYTE', value: 0},
        {name: 'bProportion', type: 'BYTE', value: 0},
        {name: 'bContrast', type: 'BYTE', value: 0},
        {name: 'bStrokeVariation', type: 'BYTE', value: 0},
        {name: 'bArmStyle', type: 'BYTE', value: 0},
        {name: 'bLetterform', type: 'BYTE', value: 0},
        {name: 'bMidline', type: 'BYTE', value: 0},
        {name: 'bXHeight', type: 'BYTE', value: 0},
        {name: 'ulUnicodeRange1', type: 'ULONG', value: 0},
        {name: 'ulUnicodeRange2', type: 'ULONG', value: 0},
        {name: 'ulUnicodeRange3', type: 'ULONG', value: 0},
        {name: 'ulUnicodeRange4', type: 'ULONG', value: 0},
        {name: 'achVendID', type: 'CHARARRAY', value: 'XXXX'},
        {name: 'fsSelection', type: 'USHORT', value: 0},
        {name: 'usFirstCharIndex', type: 'USHORT', value: 0},
        {name: 'usLastCharIndex', type: 'USHORT', value: 0},
        {name: 'sTypoAscender', type: 'SHORT', value: 0},
        {name: 'sTypoDescender', type: 'SHORT', value: 0},
        {name: 'sTypoLineGap', type: 'SHORT', value: 0},
        {name: 'usWinAscent', type: 'USHORT', value: 0},
        {name: 'usWinDescent', type: 'USHORT', value: 0},
        {name: 'ulCodePageRange1', type: 'ULONG', value: 0},
        {name: 'ulCodePageRange2', type: 'ULONG', value: 0},
        {name: 'sxHeight', type: 'SHORT', value: 0},
        {name: 'sCapHeight', type: 'SHORT', value: 0},
        {name: 'usDefaultChar', type: 'USHORT', value: 0},
        {name: 'usBreakChar', type: 'USHORT', value: 0},
        {name: 'usMaxContext', type: 'USHORT', value: 0}
    ], options);
}

var os2 = { parse: parseOS2Table, make: makeOS2Table, unicodeRanges: unicodeRanges, getUnicodeRange: getUnicodeRange };

// The `post` table stores additional PostScript information, such as glyph names.
// https://www.microsoft.com/typography/OTSPEC/post.htm

// Parse the PostScript `post` table
function parsePostTable(data, start) {
    var post = {};
    var p = new parse.Parser(data, start);
    post.version = p.parseVersion();
    post.italicAngle = p.parseFixed();
    post.underlinePosition = p.parseShort();
    post.underlineThickness = p.parseShort();
    post.isFixedPitch = p.parseULong();
    post.minMemType42 = p.parseULong();
    post.maxMemType42 = p.parseULong();
    post.minMemType1 = p.parseULong();
    post.maxMemType1 = p.parseULong();
    switch (post.version) {
        case 1:
            post.names = standardNames.slice();
            break;
        case 2:
            post.numberOfGlyphs = p.parseUShort();
            post.glyphNameIndex = new Array(post.numberOfGlyphs);
            for (var i = 0; i < post.numberOfGlyphs; i++) {
                post.glyphNameIndex[i] = p.parseUShort();
            }

            post.names = [];
            for (var i$1 = 0; i$1 < post.numberOfGlyphs; i$1++) {
                if (post.glyphNameIndex[i$1] >= standardNames.length) {
                    var nameLength = p.parseChar();
                    post.names.push(p.parseString(nameLength));
                }
            }

            break;
        case 2.5:
            post.numberOfGlyphs = p.parseUShort();
            post.offset = new Array(post.numberOfGlyphs);
            for (var i$2 = 0; i$2 < post.numberOfGlyphs; i$2++) {
                post.offset[i$2] = p.parseChar();
            }

            break;
    }
    return post;
}

function makePostTable() {
    return new table.Table('post', [
        {name: 'version', type: 'FIXED', value: 0x00030000},
        {name: 'italicAngle', type: 'FIXED', value: 0},
        {name: 'underlinePosition', type: 'FWORD', value: 0},
        {name: 'underlineThickness', type: 'FWORD', value: 0},
        {name: 'isFixedPitch', type: 'ULONG', value: 0},
        {name: 'minMemType42', type: 'ULONG', value: 0},
        {name: 'maxMemType42', type: 'ULONG', value: 0},
        {name: 'minMemType1', type: 'ULONG', value: 0},
        {name: 'maxMemType1', type: 'ULONG', value: 0}
    ]);
}

var post = { parse: parsePostTable, make: makePostTable };

// The `GSUB` table contains ligatures, among other things.
// https://www.microsoft.com/typography/OTSPEC/gsub.htm

var subtableParsers = new Array(9);         // subtableParsers[0] is unused

// https://www.microsoft.com/typography/OTSPEC/GSUB.htm#SS
subtableParsers[1] = function parseLookup1() {
    var start = this.offset + this.relativeOffset;
    var substFormat = this.parseUShort();
    if (substFormat === 1) {
        return {
            substFormat: 1,
            coverage: this.parsePointer(Parser.coverage),
            deltaGlyphId: this.parseUShort()
        };
    } else if (substFormat === 2) {
        return {
            substFormat: 2,
            coverage: this.parsePointer(Parser.coverage),
            substitute: this.parseOffset16List()
        };
    }
    check.assert(false, '0x' + start.toString(16) + ': lookup type 1 format must be 1 or 2.');
};

// https://www.microsoft.com/typography/OTSPEC/GSUB.htm#MS
subtableParsers[2] = function parseLookup2() {
    var substFormat = this.parseUShort();
    check.argument(substFormat === 1, 'GSUB Multiple Substitution Subtable identifier-format must be 1');
    return {
        substFormat: substFormat,
        coverage: this.parsePointer(Parser.coverage),
        sequences: this.parseListOfLists()
    };
};

// https://www.microsoft.com/typography/OTSPEC/GSUB.htm#AS
subtableParsers[3] = function parseLookup3() {
    var substFormat = this.parseUShort();
    check.argument(substFormat === 1, 'GSUB Alternate Substitution Subtable identifier-format must be 1');
    return {
        substFormat: substFormat,
        coverage: this.parsePointer(Parser.coverage),
        alternateSets: this.parseListOfLists()
    };
};

// https://www.microsoft.com/typography/OTSPEC/GSUB.htm#LS
subtableParsers[4] = function parseLookup4() {
    var substFormat = this.parseUShort();
    check.argument(substFormat === 1, 'GSUB ligature table identifier-format must be 1');
    return {
        substFormat: substFormat,
        coverage: this.parsePointer(Parser.coverage),
        ligatureSets: this.parseListOfLists(function() {
            return {
                ligGlyph: this.parseUShort(),
                components: this.parseUShortList(this.parseUShort() - 1)
            };
        })
    };
};

var lookupRecordDesc = {
    sequenceIndex: Parser.uShort,
    lookupListIndex: Parser.uShort
};

// https://www.microsoft.com/typography/OTSPEC/GSUB.htm#CSF
subtableParsers[5] = function parseLookup5() {
    var start = this.offset + this.relativeOffset;
    var substFormat = this.parseUShort();

    if (substFormat === 1) {
        return {
            substFormat: substFormat,
            coverage: this.parsePointer(Parser.coverage),
            ruleSets: this.parseListOfLists(function() {
                var glyphCount = this.parseUShort();
                var substCount = this.parseUShort();
                return {
                    input: this.parseUShortList(glyphCount - 1),
                    lookupRecords: this.parseRecordList(substCount, lookupRecordDesc)
                };
            })
        };
    } else if (substFormat === 2) {
        return {
            substFormat: substFormat,
            coverage: this.parsePointer(Parser.coverage),
            classDef: this.parsePointer(Parser.classDef),
            classSets: this.parseListOfLists(function() {
                var glyphCount = this.parseUShort();
                var substCount = this.parseUShort();
                return {
                    classes: this.parseUShortList(glyphCount - 1),
                    lookupRecords: this.parseRecordList(substCount, lookupRecordDesc)
                };
            })
        };
    } else if (substFormat === 3) {
        var glyphCount = this.parseUShort();
        var substCount = this.parseUShort();
        return {
            substFormat: substFormat,
            coverages: this.parseList(glyphCount, Parser.pointer(Parser.coverage)),
            lookupRecords: this.parseRecordList(substCount, lookupRecordDesc)
        };
    }
    check.assert(false, '0x' + start.toString(16) + ': lookup type 5 format must be 1, 2 or 3.');
};

// https://www.microsoft.com/typography/OTSPEC/GSUB.htm#CC
subtableParsers[6] = function parseLookup6() {
    var start = this.offset + this.relativeOffset;
    var substFormat = this.parseUShort();
    if (substFormat === 1) {
        return {
            substFormat: 1,
            coverage: this.parsePointer(Parser.coverage),
            chainRuleSets: this.parseListOfLists(function() {
                return {
                    backtrack: this.parseUShortList(),
                    input: this.parseUShortList(this.parseShort() - 1),
                    lookahead: this.parseUShortList(),
                    lookupRecords: this.parseRecordList(lookupRecordDesc)
                };
            })
        };
    } else if (substFormat === 2) {
        return {
            substFormat: 2,
            coverage: this.parsePointer(Parser.coverage),
            backtrackClassDef: this.parsePointer(Parser.classDef),
            inputClassDef: this.parsePointer(Parser.classDef),
            lookaheadClassDef: this.parsePointer(Parser.classDef),
            chainClassSet: this.parseListOfLists(function() {
                return {
                    backtrack: this.parseUShortList(),
                    input: this.parseUShortList(this.parseShort() - 1),
                    lookahead: this.parseUShortList(),
                    lookupRecords: this.parseRecordList(lookupRecordDesc)
                };
            })
        };
    } else if (substFormat === 3) {
        return {
            substFormat: 3,
            backtrackCoverage: this.parseList(Parser.pointer(Parser.coverage)),
            inputCoverage: this.parseList(Parser.pointer(Parser.coverage)),
            lookaheadCoverage: this.parseList(Parser.pointer(Parser.coverage)),
            lookupRecords: this.parseRecordList(lookupRecordDesc)
        };
    }
    check.assert(false, '0x' + start.toString(16) + ': lookup type 6 format must be 1, 2 or 3.');
};

// https://www.microsoft.com/typography/OTSPEC/GSUB.htm#ES
subtableParsers[7] = function parseLookup7() {
    // Extension Substitution subtable
    var substFormat = this.parseUShort();
    check.argument(substFormat === 1, 'GSUB Extension Substitution subtable identifier-format must be 1');
    var extensionLookupType = this.parseUShort();
    var extensionParser = new Parser(this.data, this.offset + this.parseULong());
    return {
        substFormat: 1,
        lookupType: extensionLookupType,
        extension: subtableParsers[extensionLookupType].call(extensionParser)
    };
};

// https://www.microsoft.com/typography/OTSPEC/GSUB.htm#RCCS
subtableParsers[8] = function parseLookup8() {
    var substFormat = this.parseUShort();
    check.argument(substFormat === 1, 'GSUB Reverse Chaining Contextual Single Substitution Subtable identifier-format must be 1');
    return {
        substFormat: substFormat,
        coverage: this.parsePointer(Parser.coverage),
        backtrackCoverage: this.parseList(Parser.pointer(Parser.coverage)),
        lookaheadCoverage: this.parseList(Parser.pointer(Parser.coverage)),
        substitutes: this.parseUShortList()
    };
};

// https://www.microsoft.com/typography/OTSPEC/gsub.htm
function parseGsubTable(data, start) {
    start = start || 0;
    var p = new Parser(data, start);
    var tableVersion = p.parseVersion();
    check.argument(tableVersion === 1, 'Unsupported GSUB table version.');
    return {
        version: tableVersion,
        scripts: p.parseScriptList(),
        features: p.parseFeatureList(),
        lookups: p.parseLookupList(subtableParsers)
    };
}

// GSUB Writing //////////////////////////////////////////////
var subtableMakers = new Array(9);

subtableMakers[1] = function makeLookup1(subtable) {
    if (subtable.substFormat === 1) {
        return new table.Table('substitutionTable', [
            {name: 'substFormat', type: 'USHORT', value: 1},
            {name: 'coverage', type: 'TABLE', value: new table.Coverage(subtable.coverage)},
            {name: 'deltaGlyphID', type: 'USHORT', value: subtable.deltaGlyphId}
        ]);
    } else {
        return new table.Table('substitutionTable', [
            {name: 'substFormat', type: 'USHORT', value: 2},
            {name: 'coverage', type: 'TABLE', value: new table.Coverage(subtable.coverage)}
        ].concat(table.ushortList('substitute', subtable.substitute)));
    }
    check.fail('Lookup type 1 substFormat must be 1 or 2.');
};

subtableMakers[3] = function makeLookup3(subtable) {
    check.assert(subtable.substFormat === 1, 'Lookup type 3 substFormat must be 1.');
    return new table.Table('substitutionTable', [
        {name: 'substFormat', type: 'USHORT', value: 1},
        {name: 'coverage', type: 'TABLE', value: new table.Coverage(subtable.coverage)}
    ].concat(table.tableList('altSet', subtable.alternateSets, function(alternateSet) {
        return new table.Table('alternateSetTable', table.ushortList('alternate', alternateSet));
    })));
};

subtableMakers[4] = function makeLookup4(subtable) {
    check.assert(subtable.substFormat === 1, 'Lookup type 4 substFormat must be 1.');
    return new table.Table('substitutionTable', [
        {name: 'substFormat', type: 'USHORT', value: 1},
        {name: 'coverage', type: 'TABLE', value: new table.Coverage(subtable.coverage)}
    ].concat(table.tableList('ligSet', subtable.ligatureSets, function(ligatureSet) {
        return new table.Table('ligatureSetTable', table.tableList('ligature', ligatureSet, function(ligature) {
            return new table.Table('ligatureTable',
                [{name: 'ligGlyph', type: 'USHORT', value: ligature.ligGlyph}]
                .concat(table.ushortList('component', ligature.components, ligature.components.length + 1))
            );
        }));
    })));
};

function makeGsubTable(gsub) {
    return new table.Table('GSUB', [
        {name: 'version', type: 'ULONG', value: 0x10000},
        {name: 'scripts', type: 'TABLE', value: new table.ScriptList(gsub.scripts)},
        {name: 'features', type: 'TABLE', value: new table.FeatureList(gsub.features)},
        {name: 'lookups', type: 'TABLE', value: new table.LookupList(gsub.lookups, subtableMakers)}
    ]);
}

var gsub = { parse: parseGsubTable, make: makeGsubTable };

// The `GPOS` table contains kerning pairs, among other things.
// https://www.microsoft.com/typography/OTSPEC/gpos.htm

// Parse the metadata `meta` table.
// https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6meta.html
function parseMetaTable(data, start) {
    var p = new parse.Parser(data, start);
    var tableVersion = p.parseULong();
    check.argument(tableVersion === 1, 'Unsupported META table version.');
    p.parseULong(); // flags - currently unused and set to 0
    p.parseULong(); // tableOffset
    var numDataMaps = p.parseULong();

    var tags = {};
    for (var i = 0; i < numDataMaps; i++) {
        var tag = p.parseTag();
        var dataOffset = p.parseULong();
        var dataLength = p.parseULong();
        var text = decode.UTF8(data, start + dataOffset, dataLength);

        tags[tag] = text;
    }
    return tags;
}

function makeMetaTable(tags) {
    var numTags = Object.keys(tags).length;
    var stringPool = '';
    var stringPoolOffset = 16 + numTags * 12;

    var result = new table.Table('meta', [
        {name: 'version', type: 'ULONG', value: 1},
        {name: 'flags', type: 'ULONG', value: 0},
        {name: 'offset', type: 'ULONG', value: stringPoolOffset},
        {name: 'numTags', type: 'ULONG', value: numTags}
    ]);

    for (var tag in tags) {
        var pos = stringPool.length;
        stringPool += tags[tag];

        result.fields.push({name: 'tag ' + tag, type: 'TAG', value: tag});
        result.fields.push({name: 'offset ' + tag, type: 'ULONG', value: stringPoolOffset + pos});
        result.fields.push({name: 'length ' + tag, type: 'ULONG', value: tags[tag].length});
    }

    result.fields.push({name: 'stringPool', type: 'CHARARRAY', value: stringPool});

    return result;
}

var meta = { parse: parseMetaTable, make: makeMetaTable };

// The `sfnt` wrapper provides organization for the tables in the font.
// It is the top-level data structure in a font.
// https://www.microsoft.com/typography/OTSPEC/otff.htm
// Recommendations for creating OpenType Fonts:
// http://www.microsoft.com/typography/otspec140/recom.htm

function log2(v) {
    return Math.log(v) / Math.log(2) | 0;
}

function computeCheckSum(bytes) {
    while (bytes.length % 4 !== 0) {
        bytes.push(0);
    }

    var sum = 0;
    for (var i = 0; i < bytes.length; i += 4) {
        sum += (bytes[i] << 24) +
            (bytes[i + 1] << 16) +
            (bytes[i + 2] << 8) +
            (bytes[i + 3]);
    }

    sum %= Math.pow(2, 32);
    return sum;
}

function makeTableRecord(tag, checkSum, offset, length) {
    return new table.Record('Table Record', [
        {name: 'tag', type: 'TAG', value: tag !== undefined ? tag : ''},
        {name: 'checkSum', type: 'ULONG', value: checkSum !== undefined ? checkSum : 0},
        {name: 'offset', type: 'ULONG', value: offset !== undefined ? offset : 0},
        {name: 'length', type: 'ULONG', value: length !== undefined ? length : 0}
    ]);
}

function makeSfntTable(tables) {
    var sfnt = new table.Table('sfnt', [
        {name: 'version', type: 'TAG', value: 'OTTO'},
        {name: 'numTables', type: 'USHORT', value: 0},
        {name: 'searchRange', type: 'USHORT', value: 0},
        {name: 'entrySelector', type: 'USHORT', value: 0},
        {name: 'rangeShift', type: 'USHORT', value: 0}
    ]);
    sfnt.tables = tables;
    sfnt.numTables = tables.length;
    var highestPowerOf2 = Math.pow(2, log2(sfnt.numTables));
    sfnt.searchRange = 16 * highestPowerOf2;
    sfnt.entrySelector = log2(highestPowerOf2);
    sfnt.rangeShift = sfnt.numTables * 16 - sfnt.searchRange;

    var recordFields = [];
    var tableFields = [];

    var offset = sfnt.sizeOf() + (makeTableRecord().sizeOf() * sfnt.numTables);
    while (offset % 4 !== 0) {
        offset += 1;
        tableFields.push({name: 'padding', type: 'BYTE', value: 0});
    }

    for (var i = 0; i < tables.length; i += 1) {
        var t = tables[i];
        check.argument(t.tableName.length === 4, 'Table name' + t.tableName + ' is invalid.');
        var tableLength = t.sizeOf();
        var tableRecord = makeTableRecord(t.tableName, computeCheckSum(t.encode()), offset, tableLength);
        recordFields.push({name: tableRecord.tag + ' Table Record', type: 'RECORD', value: tableRecord});
        tableFields.push({name: t.tableName + ' table', type: 'RECORD', value: t});
        offset += tableLength;
        check.argument(!isNaN(offset), 'Something went wrong calculating the offset.');
        while (offset % 4 !== 0) {
            offset += 1;
            tableFields.push({name: 'padding', type: 'BYTE', value: 0});
        }
    }

    // Table records need to be sorted alphabetically.
    recordFields.sort(function(r1, r2) {
        if (r1.value.tag > r2.value.tag) {
            return 1;
        } else {
            return -1;
        }
    });

    sfnt.fields = sfnt.fields.concat(recordFields);
    sfnt.fields = sfnt.fields.concat(tableFields);
    return sfnt;
}

// Get the metrics for a character. If the string has more than one character
// this function returns metrics for the first available character.
// You can provide optional fallback metrics if no characters are available.
function metricsForChar(font, chars, notFoundMetrics) {
    for (var i = 0; i < chars.length; i += 1) {
        var glyphIndex = font.charToGlyphIndex(chars[i]);
        if (glyphIndex > 0) {
            var glyph = font.glyphs.get(glyphIndex);
            return glyph.getMetrics();
        }
    }

    return notFoundMetrics;
}

function average(vs) {
    var sum = 0;
    for (var i = 0; i < vs.length; i += 1) {
        sum += vs[i];
    }

    return sum / vs.length;
}

// Convert the font object to a SFNT data structure.
// This structure contains all the necessary tables and metadata to create a binary OTF file.
function fontToSfntTable(font) {
    var xMins = [];
    var yMins = [];
    var xMaxs = [];
    var yMaxs = [];
    var advanceWidths = [];
    var leftSideBearings = [];
    var rightSideBearings = [];
    var firstCharIndex;
    var lastCharIndex = 0;
    var ulUnicodeRange1 = 0;
    var ulUnicodeRange2 = 0;
    var ulUnicodeRange3 = 0;
    var ulUnicodeRange4 = 0;

    for (var i = 0; i < font.glyphs.length; i += 1) {
        var glyph = font.glyphs.get(i);
        var unicode = glyph.unicode | 0;

        if (isNaN(glyph.advanceWidth)) {
            throw new Error('Glyph ' + glyph.name + ' (' + i + '): advanceWidth is not a number.');
        }

        if (firstCharIndex > unicode || firstCharIndex === undefined) {
            // ignore .notdef char
            if (unicode > 0) {
                firstCharIndex = unicode;
            }
        }

        if (lastCharIndex < unicode) {
            lastCharIndex = unicode;
        }

        var position = os2.getUnicodeRange(unicode);
        if (position < 32) {
            ulUnicodeRange1 |= 1 << position;
        } else if (position < 64) {
            ulUnicodeRange2 |= 1 << position - 32;
        } else if (position < 96) {
            ulUnicodeRange3 |= 1 << position - 64;
        } else if (position < 123) {
            ulUnicodeRange4 |= 1 << position - 96;
        } else {
            throw new Error('Unicode ranges bits > 123 are reserved for internal usage');
        }
        // Skip non-important characters.
        if (glyph.name === '.notdef') { continue; }
        var metrics = glyph.getMetrics();
        xMins.push(metrics.xMin);
        yMins.push(metrics.yMin);
        xMaxs.push(metrics.xMax);
        yMaxs.push(metrics.yMax);
        leftSideBearings.push(metrics.leftSideBearing);
        rightSideBearings.push(metrics.rightSideBearing);
        advanceWidths.push(glyph.advanceWidth);
    }

    var globals = {
        xMin: Math.min.apply(null, xMins),
        yMin: Math.min.apply(null, yMins),
        xMax: Math.max.apply(null, xMaxs),
        yMax: Math.max.apply(null, yMaxs),
        advanceWidthMax: Math.max.apply(null, advanceWidths),
        advanceWidthAvg: average(advanceWidths),
        minLeftSideBearing: Math.min.apply(null, leftSideBearings),
        maxLeftSideBearing: Math.max.apply(null, leftSideBearings),
        minRightSideBearing: Math.min.apply(null, rightSideBearings)
    };
    globals.ascender = font.ascender;
    globals.descender = font.descender;

    var headTable = head.make({
        flags: 3, // 00000011 (baseline for font at y=0; left sidebearing point at x=0)
        unitsPerEm: font.unitsPerEm,
        xMin: globals.xMin,
        yMin: globals.yMin,
        xMax: globals.xMax,
        yMax: globals.yMax,
        lowestRecPPEM: 3,
        createdTimestamp: font.createdTimestamp
    });

    var hheaTable = hhea.make({
        ascender: globals.ascender,
        descender: globals.descender,
        advanceWidthMax: globals.advanceWidthMax,
        minLeftSideBearing: globals.minLeftSideBearing,
        minRightSideBearing: globals.minRightSideBearing,
        xMaxExtent: globals.maxLeftSideBearing + (globals.xMax - globals.xMin),
        numberOfHMetrics: font.glyphs.length
    });

    var maxpTable = maxp.make(font.glyphs.length);

    var os2Table = os2.make({
        xAvgCharWidth: Math.round(globals.advanceWidthAvg),
        usWeightClass: font.tables.os2.usWeightClass,
        usWidthClass: font.tables.os2.usWidthClass,
        usFirstCharIndex: firstCharIndex,
        usLastCharIndex: lastCharIndex,
        ulUnicodeRange1: ulUnicodeRange1,
        ulUnicodeRange2: ulUnicodeRange2,
        ulUnicodeRange3: ulUnicodeRange3,
        ulUnicodeRange4: ulUnicodeRange4,
        fsSelection: font.tables.os2.fsSelection, // REGULAR
        // See http://typophile.com/node/13081 for more info on vertical metrics.
        // We get metrics for typical characters (such as "x" for xHeight).
        // We provide some fallback characters if characters are unavailable: their
        // ordering was chosen experimentally.
        sTypoAscender: globals.ascender,
        sTypoDescender: globals.descender,
        sTypoLineGap: 0,
        usWinAscent: globals.yMax,
        usWinDescent: Math.abs(globals.yMin),
        ulCodePageRange1: 1, // FIXME: hard-code Latin 1 support for now
        sxHeight: metricsForChar(font, 'xyvw', {yMax: Math.round(globals.ascender / 2)}).yMax,
        sCapHeight: metricsForChar(font, 'HIKLEFJMNTZBDPRAGOQSUVWXY', globals).yMax,
        usDefaultChar: font.hasChar(' ') ? 32 : 0, // Use space as the default character, if available.
        usBreakChar: font.hasChar(' ') ? 32 : 0 // Use space as the break character, if available.
    });

    var hmtxTable = hmtx.make(font.glyphs);
    var cmapTable = cmap.make(font.glyphs);

    var englishFamilyName = font.getEnglishName('fontFamily');
    var englishStyleName = font.getEnglishName('fontSubfamily');
    var englishFullName = englishFamilyName + ' ' + englishStyleName;
    var postScriptName = font.getEnglishName('postScriptName');
    if (!postScriptName) {
        postScriptName = englishFamilyName.replace(/\s/g, '') + '-' + englishStyleName;
    }

    var names = {};
    for (var n in font.names) {
        names[n] = font.names[n];
    }

    if (!names.uniqueID) {
        names.uniqueID = {en: font.getEnglishName('manufacturer') + ':' + englishFullName};
    }

    if (!names.postScriptName) {
        names.postScriptName = {en: postScriptName};
    }

    if (!names.preferredFamily) {
        names.preferredFamily = font.names.fontFamily;
    }

    if (!names.preferredSubfamily) {
        names.preferredSubfamily = font.names.fontSubfamily;
    }

    var languageTags = [];
    var nameTable = _name.make(names, languageTags);
    var ltagTable = (languageTags.length > 0 ? ltag.make(languageTags) : undefined);

    var postTable = post.make();
    var cffTable = cff.make(font.glyphs, {
        version: font.getEnglishName('version'),
        fullName: englishFullName,
        familyName: englishFamilyName,
        weightName: englishStyleName,
        postScriptName: postScriptName,
        unitsPerEm: font.unitsPerEm,
        fontBBox: [0, globals.yMin, globals.ascender, globals.advanceWidthMax]
    });

    var metaTable = (font.metas && Object.keys(font.metas).length > 0) ? meta.make(font.metas) : undefined;

    // The order does not matter because makeSfntTable() will sort them.
    var tables = [headTable, hheaTable, maxpTable, os2Table, nameTable, cmapTable, postTable, cffTable, hmtxTable];
    if (ltagTable) {
        tables.push(ltagTable);
    }
    // Optional tables
    if (font.tables.gsub) {
        tables.push(gsub.make(font.tables.gsub));
    }
    if (metaTable) {
        tables.push(metaTable);
    }

    var sfntTable = makeSfntTable(tables);

    // Compute the font's checkSum and store it in head.checkSumAdjustment.
    var bytes = sfntTable.encode();
    var checkSum = computeCheckSum(bytes);
    var tableFields = sfntTable.fields;
    var checkSumAdjusted = false;
    for (var i$1 = 0; i$1 < tableFields.length; i$1 += 1) {
        if (tableFields[i$1].name === 'head table') {
            tableFields[i$1].value.checkSumAdjustment = 0xB1B0AFBA - checkSum;
            checkSumAdjusted = true;
            break;
        }
    }

    if (!checkSumAdjusted) {
        throw new Error('Could not find head table with checkSum to adjust.');
    }

    return sfntTable;
}

var sfnt = { make: makeSfntTable, fontToTable: fontToSfntTable, computeCheckSum: computeCheckSum };

// The Layout object is the prototype of Substitution objects, and provides
// utility methods to manipulate common layout tables (GPOS, GSUB, GDEF...)

function searchTag(arr, tag) {
    /* jshint bitwise: false */
    var imin = 0;
    var imax = arr.length - 1;
    while (imin <= imax) {
        var imid = (imin + imax) >>> 1;
        var val = arr[imid].tag;
        if (val === tag) {
            return imid;
        } else if (val < tag) {
            imin = imid + 1;
        } else { imax = imid - 1; }
    }
    // Not found: return -1-insertion point
    return -imin - 1;
}

function binSearch(arr, value) {
    /* jshint bitwise: false */
    var imin = 0;
    var imax = arr.length - 1;
    while (imin <= imax) {
        var imid = (imin + imax) >>> 1;
        var val = arr[imid];
        if (val === value) {
            return imid;
        } else if (val < value) {
            imin = imid + 1;
        } else { imax = imid - 1; }
    }
    // Not found: return -1-insertion point
    return -imin - 1;
}

/**
 * @exports opentype.Layout
 * @class
 */
function Layout(font, tableName) {
    this.font = font;
    this.tableName = tableName;
}

Layout.prototype = {

    /**
     * Binary search an object by "tag" property
     * @instance
     * @function searchTag
     * @memberof opentype.Layout
     * @param  {Array} arr
     * @param  {string} tag
     * @return {number}
     */
    searchTag: searchTag,

    /**
     * Binary search in a list of numbers
     * @instance
     * @function binSearch
     * @memberof opentype.Layout
     * @param  {Array} arr
     * @param  {number} value
     * @return {number}
     */
    binSearch: binSearch,

    /**
     * Get or create the Layout table (GSUB, GPOS etc).
     * @param  {boolean} create - Whether to create a new one.
     * @return {Object} The GSUB or GPOS table.
     */
    getTable: function(create) {
        var layout = this.font.tables[this.tableName];
        if (!layout && create) {
            layout = this.font.tables[this.tableName] = this.createDefaultTable();
        }
        return layout;
    },

    /**
     * Returns all scripts in the substitution table.
     * @instance
     * @return {Array}
     */
    getScriptNames: function() {
        var layout = this.getTable();
        if (!layout) { return []; }
        return layout.scripts.map(function(script) {
            return script.tag;
        });
    },

    /**
     * Returns the best bet for a script name.
     * Returns 'DFLT' if it exists.
     * If not, returns 'latn' if it exists.
     * If neither exist, returns undefined.
     */
    getDefaultScriptName: function() {
        var layout = this.getTable();
        if (!layout) { return; }
        var hasLatn = false;
        for (var i = 0; i < layout.scripts.length; i++) {
            var name = layout.scripts[i].tag;
            if (name === 'DFLT') { return name; }
            if (name === 'latn') { hasLatn = true; }
        }
        if (hasLatn) { return 'latn'; }
    },

    /**
     * Returns all LangSysRecords in the given script.
     * @instance
     * @param {string} [script='DFLT']
     * @param {boolean} create - forces the creation of this script table if it doesn't exist.
     * @return {Object} An object with tag and script properties.
     */
    getScriptTable: function(script, create) {
        var layout = this.getTable(create);
        if (layout) {
            script = script || 'DFLT';
            var scripts = layout.scripts;
            var pos = searchTag(layout.scripts, script);
            if (pos >= 0) {
                return scripts[pos].script;
            } else if (create) {
                var scr = {
                    tag: script,
                    script: {
                        defaultLangSys: {reserved: 0, reqFeatureIndex: 0xffff, featureIndexes: []},
                        langSysRecords: []
                    }
                };
                scripts.splice(-1 - pos, 0, scr);
                return scr.script;
            }
        }
    },

    /**
     * Returns a language system table
     * @instance
     * @param {string} [script='DFLT']
     * @param {string} [language='dlft']
     * @param {boolean} create - forces the creation of this langSysTable if it doesn't exist.
     * @return {Object}
     */
    getLangSysTable: function(script, language, create) {
        var scriptTable = this.getScriptTable(script, create);
        if (scriptTable) {
            if (!language || language === 'dflt' || language === 'DFLT') {
                return scriptTable.defaultLangSys;
            }
            var pos = searchTag(scriptTable.langSysRecords, language);
            if (pos >= 0) {
                return scriptTable.langSysRecords[pos].langSys;
            } else if (create) {
                var langSysRecord = {
                    tag: language,
                    langSys: {reserved: 0, reqFeatureIndex: 0xffff, featureIndexes: []}
                };
                scriptTable.langSysRecords.splice(-1 - pos, 0, langSysRecord);
                return langSysRecord.langSys;
            }
        }
    },

    /**
     * Get a specific feature table.
     * @instance
     * @param {string} [script='DFLT']
     * @param {string} [language='dlft']
     * @param {string} feature - One of the codes listed at https://www.microsoft.com/typography/OTSPEC/featurelist.htm
     * @param {boolean} create - forces the creation of the feature table if it doesn't exist.
     * @return {Object}
     */
    getFeatureTable: function(script, language, feature, create) {
        var langSysTable = this.getLangSysTable(script, language, create);
        if (langSysTable) {
            var featureRecord;
            var featIndexes = langSysTable.featureIndexes;
            var allFeatures = this.font.tables[this.tableName].features;
            // The FeatureIndex array of indices is in arbitrary order,
            // even if allFeatures is sorted alphabetically by feature tag.
            for (var i = 0; i < featIndexes.length; i++) {
                featureRecord = allFeatures[featIndexes[i]];
                if (featureRecord.tag === feature) {
                    return featureRecord.feature;
                }
            }
            if (create) {
                var index = allFeatures.length;
                // Automatic ordering of features would require to shift feature indexes in the script list.
                check.assert(index === 0 || feature >= allFeatures[index - 1].tag, 'Features must be added in alphabetical order.');
                featureRecord = {
                    tag: feature,
                    feature: { params: 0, lookupListIndexes: [] }
                };
                allFeatures.push(featureRecord);
                featIndexes.push(index);
                return featureRecord.feature;
            }
        }
    },

    /**
     * Get the lookup tables of a given type for a script/language/feature.
     * @instance
     * @param {string} [script='DFLT']
     * @param {string} [language='dlft']
     * @param {string} feature - 4-letter feature code
     * @param {number} lookupType - 1 to 8
     * @param {boolean} create - forces the creation of the lookup table if it doesn't exist, with no subtables.
     * @return {Object[]}
     */
    getLookupTables: function(script, language, feature, lookupType, create) {
        var featureTable = this.getFeatureTable(script, language, feature, create);
        var tables = [];
        if (featureTable) {
            var lookupTable;
            var lookupListIndexes = featureTable.lookupListIndexes;
            var allLookups = this.font.tables[this.tableName].lookups;
            // lookupListIndexes are in no particular order, so use naive search.
            for (var i = 0; i < lookupListIndexes.length; i++) {
                lookupTable = allLookups[lookupListIndexes[i]];
                if (lookupTable.lookupType === lookupType) {
                    tables.push(lookupTable);
                }
            }
            if (tables.length === 0 && create) {
                lookupTable = {
                    lookupType: lookupType,
                    lookupFlag: 0,
                    subtables: [],
                    markFilteringSet: undefined
                };
                var index = allLookups.length;
                allLookups.push(lookupTable);
                lookupListIndexes.push(index);
                return [lookupTable];
            }
        }
        return tables;
    },

    /**
     * Returns the list of glyph indexes of a coverage table.
     * Format 1: the list is stored raw
     * Format 2: compact list as range records.
     * @instance
     * @param  {Object} coverageTable
     * @return {Array}
     */
    expandCoverage: function(coverageTable) {
        if (coverageTable.format === 1) {
            return coverageTable.glyphs;
        } else {
            var glyphs = [];
            var ranges = coverageTable.ranges;
            for (var i = 0; i < ranges.length; i++) {
                var range = ranges[i];
                var start = range.start;
                var end = range.end;
                for (var j = start; j <= end; j++) {
                    glyphs.push(j);
                }
            }
            return glyphs;
        }
    }

};

// The Substitution object provides utility methods to manipulate
// the GSUB substitution table.

/**
 * @exports opentype.Substitution
 * @class
 * @extends opentype.Layout
 * @param {opentype.Font}
 * @constructor
 */
function Substitution(font) {
    Layout.call(this, font, 'gsub');
}

// Check if 2 arrays of primitives are equal.
function arraysEqual(ar1, ar2) {
    var n = ar1.length;
    if (n !== ar2.length) { return false; }
    for (var i = 0; i < n; i++) {
        if (ar1[i] !== ar2[i]) { return false; }
    }
    return true;
}

// Find the first subtable of a lookup table in a particular format.
function getSubstFormat(lookupTable, format, defaultSubtable) {
    var subtables = lookupTable.subtables;
    for (var i = 0; i < subtables.length; i++) {
        var subtable = subtables[i];
        if (subtable.substFormat === format) {
            return subtable;
        }
    }
    if (defaultSubtable) {
        subtables.push(defaultSubtable);
        return defaultSubtable;
    }
    return undefined;
}

Substitution.prototype = Layout.prototype;

/**
 * Create a default GSUB table.
 * @return {Object} gsub - The GSUB table.
 */
Substitution.prototype.createDefaultTable = function() {
    // Generate a default empty GSUB table with just a DFLT script and dflt lang sys.
    return {
        version: 1,
        scripts: [{
            tag: 'DFLT',
            script: {
                defaultLangSys: { reserved: 0, reqFeatureIndex: 0xffff, featureIndexes: [] },
                langSysRecords: []
            }
        }],
        features: [],
        lookups: []
    };
};

/**
 * List all single substitutions (lookup type 1) for a given script, language, and feature.
 * @param {string} [script='DFLT']
 * @param {string} [language='dflt']
 * @param {string} feature - 4-character feature name ('aalt', 'salt', 'ss01'...)
 * @return {Array} substitutions - The list of substitutions.
 */
Substitution.prototype.getSingle = function(feature, script, language) {
    var this$1 = this;

    var substitutions = [];
    var lookupTables = this.getLookupTables(script, language, feature, 1);
    for (var idx = 0; idx < lookupTables.length; idx++) {
        var subtables = lookupTables[idx].subtables;
        for (var i = 0; i < subtables.length; i++) {
            var subtable = subtables[i];
            var glyphs = this$1.expandCoverage(subtable.coverage);
            var j = (void 0);
            if (subtable.substFormat === 1) {
                var delta = subtable.deltaGlyphId;
                for (j = 0; j < glyphs.length; j++) {
                    var glyph = glyphs[j];
                    substitutions.push({ sub: glyph, by: glyph + delta });
                }
            } else {
                var substitute = subtable.substitute;
                for (j = 0; j < glyphs.length; j++) {
                    substitutions.push({ sub: glyphs[j], by: substitute[j] });
                }
            }
        }
    }
    return substitutions;
};

/**
 * List all alternates (lookup type 3) for a given script, language, and feature.
 * @param {string} [script='DFLT']
 * @param {string} [language='dflt']
 * @param {string} feature - 4-character feature name ('aalt', 'salt'...)
 * @return {Array} alternates - The list of alternates
 */
Substitution.prototype.getAlternates = function(feature, script, language) {
    var this$1 = this;

    var alternates = [];
    var lookupTables = this.getLookupTables(script, language, feature, 3);
    for (var idx = 0; idx < lookupTables.length; idx++) {
        var subtables = lookupTables[idx].subtables;
        for (var i = 0; i < subtables.length; i++) {
            var subtable = subtables[i];
            var glyphs = this$1.expandCoverage(subtable.coverage);
            var alternateSets = subtable.alternateSets;
            for (var j = 0; j < glyphs.length; j++) {
                alternates.push({ sub: glyphs[j], by: alternateSets[j] });
            }
        }
    }
    return alternates;
};

/**
 * List all ligatures (lookup type 4) for a given script, language, and feature.
 * The result is an array of ligature objects like { sub: [ids], by: id }
 * @param {string} feature - 4-letter feature name ('liga', 'rlig', 'dlig'...)
 * @param {string} [script='DFLT']
 * @param {string} [language='dflt']
 * @return {Array} ligatures - The list of ligatures.
 */
Substitution.prototype.getLigatures = function(feature, script, language) {
    var this$1 = this;

    var ligatures = [];
    var lookupTables = this.getLookupTables(script, language, feature, 4);
    for (var idx = 0; idx < lookupTables.length; idx++) {
        var subtables = lookupTables[idx].subtables;
        for (var i = 0; i < subtables.length; i++) {
            var subtable = subtables[i];
            var glyphs = this$1.expandCoverage(subtable.coverage);
            var ligatureSets = subtable.ligatureSets;
            for (var j = 0; j < glyphs.length; j++) {
                var startGlyph = glyphs[j];
                var ligSet = ligatureSets[j];
                for (var k = 0; k < ligSet.length; k++) {
                    var lig = ligSet[k];
                    ligatures.push({
                        sub: [startGlyph].concat(lig.components),
                        by: lig.ligGlyph
                    });
                }
            }
        }
    }
    return ligatures;
};

/**
 * Add or modify a single substitution (lookup type 1)
 * Format 2, more flexible, is always used.
 * @param {string} feature - 4-letter feature name ('liga', 'rlig', 'dlig'...)
 * @param {Object} substitution - { sub: id, delta: number } for format 1 or { sub: id, by: id } for format 2.
 * @param {string} [script='DFLT']
 * @param {string} [language='dflt']
 */
Substitution.prototype.addSingle = function(feature, substitution, script, language) {
    var lookupTable = this.getLookupTables(script, language, feature, 1, true)[0];
    var subtable = getSubstFormat(lookupTable, 2, {                // lookup type 1 subtable, format 2, coverage format 1
        substFormat: 2,
        coverage: {format: 1, glyphs: []},
        substitute: []
    });
    check.assert(subtable.coverage.format === 1, 'Ligature: unable to modify coverage table format ' + subtable.coverage.format);
    var coverageGlyph = substitution.sub;
    var pos = this.binSearch(subtable.coverage.glyphs, coverageGlyph);
    if (pos < 0) {
        pos = -1 - pos;
        subtable.coverage.glyphs.splice(pos, 0, coverageGlyph);
        subtable.substitute.splice(pos, 0, 0);
    }
    subtable.substitute[pos] = substitution.by;
};

/**
 * Add or modify an alternate substitution (lookup type 1)
 * @param {string} feature - 4-letter feature name ('liga', 'rlig', 'dlig'...)
 * @param {Object} substitution - { sub: id, by: [ids] }
 * @param {string} [script='DFLT']
 * @param {string} [language='dflt']
 */
Substitution.prototype.addAlternate = function(feature, substitution, script, language) {
    var lookupTable = this.getLookupTables(script, language, feature, 3, true)[0];
    var subtable = getSubstFormat(lookupTable, 1, {                // lookup type 3 subtable, format 1, coverage format 1
        substFormat: 1,
        coverage: {format: 1, glyphs: []},
        alternateSets: []
    });
    check.assert(subtable.coverage.format === 1, 'Ligature: unable to modify coverage table format ' + subtable.coverage.format);
    var coverageGlyph = substitution.sub;
    var pos = this.binSearch(subtable.coverage.glyphs, coverageGlyph);
    if (pos < 0) {
        pos = -1 - pos;
        subtable.coverage.glyphs.splice(pos, 0, coverageGlyph);
        subtable.alternateSets.splice(pos, 0, 0);
    }
    subtable.alternateSets[pos] = substitution.by;
};

/**
 * Add a ligature (lookup type 4)
 * Ligatures with more components must be stored ahead of those with fewer components in order to be found
 * @param {string} feature - 4-letter feature name ('liga', 'rlig', 'dlig'...)
 * @param {Object} ligature - { sub: [ids], by: id }
 * @param {string} [script='DFLT']
 * @param {string} [language='dflt']
 */
Substitution.prototype.addLigature = function(feature, ligature, script, language) {
    var lookupTable = this.getLookupTables(script, language, feature, 4, true)[0];
    var subtable = lookupTable.subtables[0];
    if (!subtable) {
        subtable = {                // lookup type 4 subtable, format 1, coverage format 1
            substFormat: 1,
            coverage: { format: 1, glyphs: [] },
            ligatureSets: []
        };
        lookupTable.subtables[0] = subtable;
    }
    check.assert(subtable.coverage.format === 1, 'Ligature: unable to modify coverage table format ' + subtable.coverage.format);
    var coverageGlyph = ligature.sub[0];
    var ligComponents = ligature.sub.slice(1);
    var ligatureTable = {
        ligGlyph: ligature.by,
        components: ligComponents
    };
    var pos = this.binSearch(subtable.coverage.glyphs, coverageGlyph);
    if (pos >= 0) {
        // ligatureSet already exists
        var ligatureSet = subtable.ligatureSets[pos];
        for (var i = 0; i < ligatureSet.length; i++) {
            // If ligature already exists, return.
            if (arraysEqual(ligatureSet[i].components, ligComponents)) {
                return;
            }
        }
        // ligature does not exist: add it.
        ligatureSet.push(ligatureTable);
    } else {
        // Create a new ligatureSet and add coverage for the first glyph.
        pos = -1 - pos;
        subtable.coverage.glyphs.splice(pos, 0, coverageGlyph);
        subtable.ligatureSets.splice(pos, 0, [ligatureTable]);
    }
};

/**
 * List all feature data for a given script and language.
 * @param {string} feature - 4-letter feature name
 * @param {string} [script='DFLT']
 * @param {string} [language='dflt']
 * @return {Array} substitutions - The list of substitutions.
 */
Substitution.prototype.getFeature = function(feature, script, language) {
    if (/ss\d\d/.test(feature)) {               // ss01 - ss20
        return this.getSingle(feature, script, language);
    }
    switch (feature) {
        case 'aalt':
        case 'salt':
            return this.getSingle(feature, script, language)
                    .concat(this.getAlternates(feature, script, language));
        case 'dlig':
        case 'liga':
        case 'rlig': return this.getLigatures(feature, script, language);
    }
    return undefined;
};

/**
 * Add a substitution to a feature for a given script and language.
 * @param {string} feature - 4-letter feature name
 * @param {Object} sub - the substitution to add (an object like { sub: id or [ids], by: id or [ids] })
 * @param {string} [script='DFLT']
 * @param {string} [language='dflt']
 */
Substitution.prototype.add = function(feature, sub, script, language) {
    if (/ss\d\d/.test(feature)) {               // ss01 - ss20
        return this.addSingle(feature, sub, script, language);
    }
    switch (feature) {
        case 'aalt':
        case 'salt':
            if (typeof sub.by === 'number') {
                return this.addSingle(feature, sub, script, language);
            }
            return this.addAlternate(feature, sub, script, language);
        case 'dlig':
        case 'liga':
        case 'rlig':
            return this.addLigature(feature, sub, script, language);
    }
    return undefined;
};

function isBrowser() {
    return typeof window !== 'undefined';
}

function nodeBufferToArrayBuffer(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }

    return ab;
}

function arrayBufferToNodeBuffer(ab) {
    var buffer = new Buffer(ab.byteLength);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = view[i];
    }

    return buffer;
}

function checkArgument(expression, message) {
    if (!expression) {
        throw message;
    }
}

/* A TrueType font hinting interpreter.
*
* (c) 2017 Axel Kittenberger
*
* This interpreter has been implemented according to this documentation:
* https://developer.apple.com/fonts/TrueType-Reference-Manual/RM05/Chap5.html
*
* According to the documentation F24DOT6 values are used for pixels.
* That means calculation is 1/64 pixel accurate and uses integer operations.
* However, Javascript has floating point operations by default and only
* those are available. One could make a case to simulate the 1/64 accuracy
* exactly by truncating after every division operation
* (for example with << 0) to get pixel exactly results as other TrueType
* implementations. It may make sense since some fonts are pixel optimized
* by hand using DELTAP instructions. The current implementation doesn't
* and rather uses full floating point precision.
*
* xScale, yScale and rotation is currently ignored.
*
* A few non-trivial instructions are missing as I didn't encounter yet
* a font that used them to test a possible implementation.
*
* Some fonts seem to use undocumented features regarding the twilight zone.
* Only some of them are implemented as they were encountered.
*
* The exports.DEBUG statements are removed on the minified distribution file.
*/
var instructionTable;
var exec;
var execGlyph;
var execComponent;

/*
* Creates a hinting object.
*
* There ought to be exactly one
* for each truetype font that is used for hinting.
*/
function Hinting(font) {
    // the font this hinting object is for
    this.font = font;

    // cached states
    this._fpgmState  =
    this._prepState  =
        undefined;

    // errorState
    // 0 ... all okay
    // 1 ... had an error in a glyf,
    //       continue working but stop spamming
    //       the console
    // 2 ... error at prep, stop hinting at this ppem
    // 3 ... error at fpeg, stop hinting for this font at all
    this._errorState = 0;
}

/*
* Not rounding.
*/
function roundOff(v) {
    return v;
}

/*
* Rounding to grid.
*/
function roundToGrid(v) {
    //Rounding in TT is supposed to "symmetrical around zero"
    return Math.sign(v) * Math.round(Math.abs(v));
}

/*
* Rounding to double grid.
*/
function roundToDoubleGrid(v) {
    return Math.sign(v) * Math.round(Math.abs(v * 2)) / 2;
}

/*
* Rounding to half grid.
*/
function roundToHalfGrid(v) {
    return Math.sign(v) * (Math.round(Math.abs(v) + 0.5) - 0.5);
}

/*
* Rounding to up to grid.
*/
function roundUpToGrid(v) {
    return Math.sign(v) * Math.ceil(Math.abs(v));
}

/*
* Rounding to down to grid.
*/
function roundDownToGrid(v) {
    return Math.sign(v) * Math.floor(Math.abs(v));
}

/*
* Super rounding.
*/
var roundSuper = function (v) {
    var period = this.srPeriod;
    var phase = this.srPhase;
    var threshold = this.srThreshold;
    var sign = 1;

    if (v < 0) {
        v = -v;
        sign = -1;
    }

    v += threshold - phase;

    v = Math.trunc(v / period) * period;

    v += phase;

    // according to http://xgridfit.sourceforge.net/round.html
    if (sign > 0 && v < 0) { return phase; }
    if (sign < 0 && v > 0) { return -phase; }

    return v * sign;
};

/*
* Unit vector of x-axis.
*/
var xUnitVector = {
    x: 1,

    y: 0,

    axis: 'x',

    // Gets the projected distance between two points.
    // o1/o2 ... if true, respective original position is used.
    distance: function (p1, p2, o1, o2) {
        return (o1 ? p1.xo : p1.x) - (o2 ? p2.xo : p2.x);
    },

    // Moves point p so the moved position has the same relative
    // position to the moved positions of rp1 and rp2 than the
    // original positions had.
    //
    // See APPENDIX on INTERPOLATE at the bottom of this file.
    interpolate: function (p, rp1, rp2, pv) {
        var do1;
        var do2;
        var doa1;
        var doa2;
        var dm1;
        var dm2;
        var dt;

        if (!pv || pv === this) {
            do1 = p.xo - rp1.xo;
            do2 = p.xo - rp2.xo;
            dm1 = rp1.x - rp1.xo;
            dm2 = rp2.x - rp2.xo;
            doa1 = Math.abs(do1);
            doa2 = Math.abs(do2);
            dt = doa1 + doa2;

            if (dt === 0) {
                p.x = p.xo + (dm1 + dm2) / 2;
                return;
            }

            p.x = p.xo + (dm1 * doa2 + dm2 * doa1) / dt;
            return;
        }

        do1 = pv.distance(p, rp1, true, true);
        do2 = pv.distance(p, rp2, true, true);
        dm1 = pv.distance(rp1, rp1, false, true);
        dm2 = pv.distance(rp2, rp2, false, true);
        doa1 = Math.abs(do1);
        doa2 = Math.abs(do2);
        dt = doa1 + doa2;

        if (dt === 0) {
            xUnitVector.setRelative(p, p, (dm1 + dm2) / 2, pv, true);
            return;
        }

        xUnitVector.setRelative(p, p, (dm1 * doa2 + dm2 * doa1) / dt, pv, true);
    },

    // Slope of line normal to this
    normalSlope: Number.NEGATIVE_INFINITY,

    // Sets the point 'p' relative to point 'rp'
    // by the distance 'd'.
    //
    // See APPENDIX on SETRELATIVE at the bottom of this file.
    //
    // p   ... point to set
    // rp  ... reference point
    // d   ... distance on projection vector
    // pv  ... projection vector (undefined = this)
    // org ... if true, uses the original position of rp as reference.
    setRelative: function (p, rp, d, pv, org) {
        if (!pv || pv === this) {
            p.x = (org ? rp.xo : rp.x) + d;
            return;
        }

        var rpx = org ? rp.xo : rp.x;
        var rpy = org ? rp.yo : rp.y;
        var rpdx = rpx + d * pv.x;
        var rpdy = rpy + d * pv.y;

        p.x = rpdx + (p.y - rpdy) / pv.normalSlope;
    },

    // Slope of vector line.
    slope: 0,

    // Touches the point p.
    touch: function (p) {
        p.xTouched = true;
    },

    // Tests if a point p is touched.
    touched: function (p) {
        return p.xTouched;
    },

    // Untouches the point p.
    untouch: function (p) {
        p.xTouched = false;
    }
};

/*
* Unit vector of y-axis.
*/
var yUnitVector = {
    x: 0,

    y: 1,

    axis: 'y',

    // Gets the projected distance between two points.
    // o1/o2 ... if true, respective original position is used.
    distance: function (p1, p2, o1, o2) {
        return (o1 ? p1.yo : p1.y) - (o2 ? p2.yo : p2.y);
    },

    // Moves point p so the moved position has the same relative
    // position to the moved positions of rp1 and rp2 than the
    // original positions had.
    //
    // See APPENDIX on INTERPOLATE at the bottom of this file.
    interpolate: function (p, rp1, rp2, pv) {
        var do1;
        var do2;
        var doa1;
        var doa2;
        var dm1;
        var dm2;
        var dt;

        if (!pv || pv === this) {
            do1 = p.yo - rp1.yo;
            do2 = p.yo - rp2.yo;
            dm1 = rp1.y - rp1.yo;
            dm2 = rp2.y - rp2.yo;
            doa1 = Math.abs(do1);
            doa2 = Math.abs(do2);
            dt = doa1 + doa2;

            if (dt === 0) {
                p.y = p.yo + (dm1 + dm2) / 2;
                return;
            }

            p.y = p.yo + (dm1 * doa2 + dm2 * doa1) / dt;
            return;
        }

        do1 = pv.distance(p, rp1, true, true);
        do2 = pv.distance(p, rp2, true, true);
        dm1 = pv.distance(rp1, rp1, false, true);
        dm2 = pv.distance(rp2, rp2, false, true);
        doa1 = Math.abs(do1);
        doa2 = Math.abs(do2);
        dt = doa1 + doa2;

        if (dt === 0) {
            yUnitVector.setRelative(p, p, (dm1 + dm2) / 2, pv, true);
            return;
        }

        yUnitVector.setRelative(p, p, (dm1 * doa2 + dm2 * doa1) / dt, pv, true);
    },

    // Slope of line normal to this.
    normalSlope: 0,

    // Sets the point 'p' relative to point 'rp'
    // by the distance 'd'
    //
    // See APPENDIX on SETRELATIVE at the bottom of this file.
    //
    // p   ... point to set
    // rp  ... reference point
    // d   ... distance on projection vector
    // pv  ... projection vector (undefined = this)
    // org ... if true, uses the original position of rp as reference.
    setRelative: function (p, rp, d, pv, org) {
        if (!pv || pv === this) {
            p.y = (org ? rp.yo : rp.y) + d;
            return;
        }

        var rpx = org ? rp.xo : rp.x;
        var rpy = org ? rp.yo : rp.y;
        var rpdx = rpx + d * pv.x;
        var rpdy = rpy + d * pv.y;

        p.y = rpdy + pv.normalSlope * (p.x - rpdx);
    },

    // Slope of vector line.
    slope: Number.POSITIVE_INFINITY,

    // Touches the point p.
    touch: function (p) {
        p.yTouched = true;
    },

    // Tests if a point p is touched.
    touched: function (p) {
        return p.yTouched;
    },

    // Untouches the point p.
    untouch: function (p) {
        p.yTouched = false;
    }
};

Object.freeze(xUnitVector);
Object.freeze(yUnitVector);

/*
* Creates a unit vector that is not x- or y-axis.
*/
function UnitVector(x, y) {
    this.x = x;
    this.y = y;
    this.axis = undefined;
    this.slope = y / x;
    this.normalSlope = -x / y;
    Object.freeze(this);
}

/*
* Gets the projected distance between two points.
* o1/o2 ... if true, respective original position is used.
*/
UnitVector.prototype.distance = function(p1, p2, o1, o2) {
    return (
        this.x * xUnitVector.distance(p1, p2, o1, o2) +
        this.y * yUnitVector.distance(p1, p2, o1, o2)
    );
};

/*
* Moves point p so the moved position has the same relative
* position to the moved positions of rp1 and rp2 than the
* original positions had.
*
* See APPENDIX on INTERPOLATE at the bottom of this file.
*/
UnitVector.prototype.interpolate = function(p, rp1, rp2, pv) {
    var dm1;
    var dm2;
    var do1;
    var do2;
    var doa1;
    var doa2;
    var dt;

    do1 = pv.distance(p, rp1, true, true);
    do2 = pv.distance(p, rp2, true, true);
    dm1 = pv.distance(rp1, rp1, false, true);
    dm2 = pv.distance(rp2, rp2, false, true);
    doa1 = Math.abs(do1);
    doa2 = Math.abs(do2);
    dt = doa1 + doa2;

    if (dt === 0) {
        this.setRelative(p, p, (dm1 + dm2) / 2, pv, true);
        return;
    }

    this.setRelative(p, p, (dm1 * doa2 + dm2 * doa1) / dt, pv, true);
};

/*
* Sets the point 'p' relative to point 'rp'
* by the distance 'd'
*
* See APPENDIX on SETRELATIVE at the bottom of this file.
*
* p   ...  point to set
* rp  ... reference point
* d   ... distance on projection vector
* pv  ... projection vector (undefined = this)
* org ... if true, uses the original position of rp as reference.
*/
UnitVector.prototype.setRelative = function(p, rp, d, pv, org) {
    pv = pv || this;

    var rpx = org ? rp.xo : rp.x;
    var rpy = org ? rp.yo : rp.y;
    var rpdx = rpx + d * pv.x;
    var rpdy = rpy + d * pv.y;

    var pvns = pv.normalSlope;
    var fvs = this.slope;

    var px = p.x;
    var py = p.y;

    p.x = (fvs * px - pvns * rpdx + rpdy - py) / (fvs - pvns);
    p.y = fvs * (p.x - px) + py;
};

/*
* Touches the point p.
*/
UnitVector.prototype.touch = function(p) {
    p.xTouched = true;
    p.yTouched = true;
};

/*
* Returns a unit vector with x/y coordinates.
*/
function getUnitVector(x, y) {
    var d = Math.sqrt(x * x + y * y);

    x /= d;
    y /= d;

    if (x === 1 && y === 0) { return xUnitVector; }
    else if (x === 0 && y === 1) { return yUnitVector; }
    else { return new UnitVector(x, y); }
}

/*
* Creates a point in the hinting engine.
*/
function HPoint(
    x,
    y,
    lastPointOfContour,
    onCurve
) {
    this.x = this.xo = Math.round(x * 64) / 64; // hinted x value and original x-value
    this.y = this.yo = Math.round(y * 64) / 64; // hinted y value and original y-value

    this.lastPointOfContour = lastPointOfContour;
    this.onCurve = onCurve;
    this.prevPointOnContour = undefined;
    this.nextPointOnContour = undefined;
    this.xTouched = false;
    this.yTouched = false;

    Object.preventExtensions(this);
}

/*
* Returns the next touched point on the contour.
*
* v  ... unit vector to test touch axis.
*/
HPoint.prototype.nextTouched = function(v) {
    var p = this.nextPointOnContour;

    while (!v.touched(p) && p !== this) { p = p.nextPointOnContour; }

    return p;
};

/*
* Returns the previous touched point on the contour
*
* v  ... unit vector to test touch axis.
*/
HPoint.prototype.prevTouched = function(v) {
    var p = this.prevPointOnContour;

    while (!v.touched(p) && p !== this) { p = p.prevPointOnContour; }

    return p;
};

/*
* The zero point.
*/
var HPZero = Object.freeze(new HPoint(0, 0));

/*
* The default state of the interpreter.
*
* Note: Freezing the defaultState and then deriving from it
* makes the V8 Javascript engine going awkward,
* so this is avoided, albeit the defaultState shouldn't
* ever change.
*/
var defaultState = {
    cvCutIn: 17 / 16,    // control value cut in
    deltaBase: 9,
    deltaShift: 0.125,
    loop: 1,             // loops some instructions
    minDis: 1,           // minimum distance
    autoFlip: true
};

/*
* The current state of the interpreter.
*
* env  ... 'fpgm' or 'prep' or 'glyf'
* prog ... the program
*/
function State(env, prog) {
    this.env = env;
    this.stack = [];
    this.prog = prog;

    switch (env) {
        case 'glyf' :
            this.zp0 = this.zp1 = this.zp2 = 1;
            this.rp0 = this.rp1 = this.rp2 = 0;
            /* fall through */
        case 'prep' :
            this.fv = this.pv = this.dpv = xUnitVector;
            this.round = roundToGrid;
    }
}

/*
* Executes a glyph program.
*
* This does the hinting for each glyph.
*
* Returns an array of moved points.
*
* glyph: the glyph to hint
* ppem: the size the glyph is rendered for
*/
Hinting.prototype.exec = function(glyph, ppem) {
    if (typeof ppem !== 'number') {
        throw new Error('Point size is not a number!');
    }

    // Received a fatal error, don't do any hinting anymore.
    if (this._errorState > 2) { return; }

    var font = this.font;
    var prepState = this._prepState;

    if (!prepState || prepState.ppem !== ppem) {
        var fpgmState = this._fpgmState;

        if (!fpgmState) {
            // Executes the fpgm state.
            // This is used by fonts to define functions.
            State.prototype = defaultState;

            fpgmState =
            this._fpgmState =
                new State('fpgm', font.tables.fpgm);

            fpgmState.funcs = [ ];
            fpgmState.font = font;

            if (exports.DEBUG) {
                console.log('---EXEC FPGM---');
                fpgmState.step = -1;
            }

            try {
                exec(fpgmState);
            } catch (e) {
                console.log('Hinting error in FPGM:' + e);
                this._errorState = 3;
                return;
            }
        }

        // Executes the prep program for this ppem setting.
        // This is used by fonts to set cvt values
        // depending on to be rendered font size.

        State.prototype = fpgmState;
        prepState =
        this._prepState =
            new State('prep', font.tables.prep);

        prepState.ppem = ppem;

        // Creates a copy of the cvt table
        // and scales it to the current ppem setting.
        var oCvt = font.tables.cvt;
        if (oCvt) {
            var cvt = prepState.cvt = new Array(oCvt.length);
            var scale = ppem / font.unitsPerEm;
            for (var c = 0; c < oCvt.length; c++) {
                cvt[c] = oCvt[c] * scale;
            }
        } else {
            prepState.cvt = [];
        }

        if (exports.DEBUG) {
            console.log('---EXEC PREP---');
            prepState.step = -1;
        }

        try {
            exec(prepState);
        } catch (e) {
            if (this._errorState < 2) {
                console.log('Hinting error in PREP:' + e);
            }
            this._errorState = 2;
        }
    }

    if (this._errorState > 1) { return; }

    try {
        return execGlyph(glyph, prepState);
    } catch (e) {
        if (this._errorState < 1) {
            console.log('Hinting error:' + e);
            console.log('Note: further hinting errors are silenced');
        }
        this._errorState = 1;
        return undefined;
    }
};

/*
* Executes the hinting program for a glyph.
*/
execGlyph = function(glyph, prepState) {
    // original point positions
    var xScale = prepState.ppem / prepState.font.unitsPerEm;
    var yScale = xScale;
    var components = glyph.components;
    var contours;
    var gZone;
    var state;

    State.prototype = prepState;
    if (!components) {
        state = new State('glyf', glyph.instructions);
        if (exports.DEBUG) {
            console.log('---EXEC GLYPH---');
            state.step = -1;
        }
        execComponent(glyph, state, xScale, yScale);
        gZone = state.gZone;
    } else {
        var font = prepState.font;
        gZone = [];
        contours = [];
        for (var i = 0; i < components.length; i++) {
            var c = components[i];
            var cg = font.glyphs.get(c.glyphIndex);

            state = new State('glyf', cg.instructions);

            if (exports.DEBUG) {
                console.log('---EXEC COMP ' + i + '---');
                state.step = -1;
            }

            execComponent(cg, state, xScale, yScale);
            // appends the computed points to the result array
            // post processes the component points
            var dx = Math.round(c.dx * xScale);
            var dy = Math.round(c.dy * yScale);
            var gz = state.gZone;
            var cc = state.contours;
            for (var pi = 0; pi < gz.length; pi++) {
                var p = gz[pi];
                p.xTouched = p.yTouched = false;
                p.xo = p.x = p.x + dx;
                p.yo = p.y = p.y + dy;
            }

            var gLen = gZone.length;
            gZone.push.apply(gZone, gz);
            for (var j = 0; j < cc.length; j++) {
                contours.push(cc[j] + gLen);
            }
        }

        if (glyph.instructions && !state.inhibitGridFit) {
            // the composite has instructions on its own
            state = new State('glyf', glyph.instructions);

            state.gZone = state.z0 = state.z1 = state.z2 = gZone;

            state.contours = contours;

            // note: HPZero cannot be used here, since
            //       the point might be modified
            gZone.push(
                new HPoint(0, 0),
                new HPoint(Math.round(glyph.advanceWidth * xScale), 0)
            );

            if (exports.DEBUG) {
                console.log('---EXEC COMPOSITE---');
                state.step = -1;
            }

            exec(state);

            gZone.length -= 2;
        }
    }

    return gZone;
};

/*
* Executes the hinting program for a component of a multi-component glyph
* or of the glyph itself by a non-component glyph.
*/
execComponent = function(glyph, state, xScale, yScale)
{
    var points = glyph.points || [];
    var pLen = points.length;
    var gZone = state.gZone = state.z0 = state.z1 = state.z2 = [];
    var contours = state.contours = [];

    // Scales the original points and
    // makes copies for the hinted points.
    var cp; // current point
    for (var i = 0; i < pLen; i++) {
        cp = points[i];

        gZone[i] = new HPoint(
            cp.x * xScale,
            cp.y * yScale,
            cp.lastPointOfContour,
            cp.onCurve
        );
    }

    // Chain links the contours.
    var sp; // start point
    var np; // next point

    for (var i$1 = 0; i$1 < pLen; i$1++) {
        cp = gZone[i$1];

        if (!sp) {
            sp = cp;
            contours.push(i$1);
        }

        if (cp.lastPointOfContour) {
            cp.nextPointOnContour = sp;
            sp.prevPointOnContour = cp;
            sp = undefined;
        } else {
            np = gZone[i$1 + 1];
            cp.nextPointOnContour = np;
            np.prevPointOnContour = cp;
        }
    }

    if (state.inhibitGridFit) { return; }

    gZone.push(
        new HPoint(0, 0),
        new HPoint(Math.round(glyph.advanceWidth * xScale), 0)
    );

    exec(state);

    // Removes the extra points.
    gZone.length -= 2;

    if (exports.DEBUG) {
        console.log('FINISHED GLYPH', state.stack);
        for (var i$2 = 0; i$2 < pLen; i$2++) {
            console.log(i$2, gZone[i$2].x, gZone[i$2].y);
        }
    }
};

/*
* Executes the program loaded in state.
*/
exec = function(state) {
    var prog = state.prog;

    if (!prog) { return; }

    var pLen = prog.length;
    var ins;

    for (state.ip = 0; state.ip < pLen; state.ip++) {
        if (exports.DEBUG) { state.step++; }
        ins = instructionTable[prog[state.ip]];

        if (!ins) {
            throw new Error(
                'unknown instruction: 0x' +
                Number(prog[state.ip]).toString(16)
            );
        }

        ins(state);

        // very extensive debugging for each step
        /*
        if (exports.DEBUG) {
            var da;
            if (state.gZone) {
                da = [];
                for (let i = 0; i < state.gZone.length; i++)
                {
                    da.push(i + ' ' +
                        state.gZone[i].x * 64 + ' ' +
                        state.gZone[i].y * 64 + ' ' +
                        (state.gZone[i].xTouched ? 'x' : '') +
                        (state.gZone[i].yTouched ? 'y' : '')
                    );
                }
                console.log('GZ', da);
            }

            if (state.tZone) {
                da = [];
                for (let i = 0; i < state.tZone.length; i++) {
                    da.push(i + ' ' +
                        state.tZone[i].x * 64 + ' ' +
                        state.tZone[i].y * 64 + ' ' +
                        (state.tZone[i].xTouched ? 'x' : '') +
                        (state.tZone[i].yTouched ? 'y' : '')
                    );
                }
                console.log('TZ', da);
            }

            if (state.stack.length > 10) {
                console.log(
                    state.stack.length,
                    '...', state.stack.slice(state.stack.length - 10)
                );
            } else {
                console.log(state.stack.length, state.stack);
            }
        }
        */
    }
};

/*
* Initializes the twilight zone.
*
* This is only done if a SZPx instruction
* refers to the twilight zone.
*/
function initTZone(state)
{
    var tZone = state.tZone = new Array(state.gZone.length);

    // no idea if this is actually correct...
    for (var i = 0; i < tZone.length; i++)
    {
        tZone[i] = new HPoint(0, 0);
    }
}

/*
* Skips the instruction pointer ahead over an IF/ELSE block.
* handleElse .. if true breaks on matching ELSE
*/
function skip(state, handleElse)
{
    var prog = state.prog;
    var ip = state.ip;
    var nesting = 1;
    var ins;

    do {
        ins = prog[++ip];
        if (ins === 0x58) // IF
            { nesting++; }
        else if (ins === 0x59) // EIF
            { nesting--; }
        else if (ins === 0x40) // NPUSHB
            { ip += prog[ip + 1] + 1; }
        else if (ins === 0x41) // NPUSHW
            { ip += 2 * prog[ip + 1] + 1; }
        else if (ins >= 0xB0 && ins <= 0xB7) // PUSHB
            { ip += ins - 0xB0 + 1; }
        else if (ins >= 0xB8 && ins <= 0xBF) // PUSHW
            { ip += (ins - 0xB8 + 1) * 2; }
        else if (handleElse && nesting === 1 && ins === 0x1B) // ELSE
            { break; }
    } while (nesting > 0);

    state.ip = ip;
}

/*----------------------------------------------------------*
*          And then a lot of instructions...                *
*----------------------------------------------------------*/

// SVTCA[a] Set freedom and projection Vectors To Coordinate Axis
// 0x00-0x01
function SVTCA(v, state) {
    if (exports.DEBUG) { console.log(state.step, 'SVTCA[' + v.axis + ']'); }

    state.fv = state.pv = state.dpv = v;
}

// SPVTCA[a] Set Projection Vector to Coordinate Axis
// 0x02-0x03
function SPVTCA(v, state) {
    if (exports.DEBUG) { console.log(state.step, 'SPVTCA[' + v.axis + ']'); }

    state.pv = state.dpv = v;
}

// SFVTCA[a] Set Freedom Vector to Coordinate Axis
// 0x04-0x05
function SFVTCA(v, state) {
    if (exports.DEBUG) { console.log(state.step, 'SFVTCA[' + v.axis + ']'); }

    state.fv = v;
}

// SPVTL[a] Set Projection Vector To Line
// 0x06-0x07
function SPVTL(a, state) {
    var stack = state.stack;
    var p2i = stack.pop();
    var p1i = stack.pop();
    var p2 = state.z2[p2i];
    var p1 = state.z1[p1i];

    if (exports.DEBUG) { console.log('SPVTL[' + a + ']', p2i, p1i); }

    var dx;
    var dy;

    if (!a) {
        dx = p1.x - p2.x;
        dy = p1.y - p2.y;
    } else {
        dx = p2.y - p1.y;
        dy = p1.x - p2.x;
    }

    state.pv = state.dpv = getUnitVector(dx, dy);
}

// SFVTL[a] Set Freedom Vector To Line
// 0x08-0x09
function SFVTL(a, state) {
    var stack = state.stack;
    var p2i = stack.pop();
    var p1i = stack.pop();
    var p2 = state.z2[p2i];
    var p1 = state.z1[p1i];

    if (exports.DEBUG) { console.log('SFVTL[' + a + ']', p2i, p1i); }

    var dx;
    var dy;

    if (!a) {
        dx = p1.x - p2.x;
        dy = p1.y - p2.y;
    } else {
        dx = p2.y - p1.y;
        dy = p1.x - p2.x;
    }

    state.fv = getUnitVector(dx, dy);
}

// SPVFS[] Set Projection Vector From Stack
// 0x0A
function SPVFS(state) {
    var stack = state.stack;
    var y = stack.pop();
    var x = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'SPVFS[]', y, x); }

    state.pv = state.dpv = getUnitVector(x, y);
}

// SFVFS[] Set Freedom Vector From Stack
// 0x0B
function SFVFS(state) {
    var stack = state.stack;
    var y = stack.pop();
    var x = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'SPVFS[]', y, x); }

    state.fv = getUnitVector(x, y);
}

// GPV[] Get Projection Vector
// 0x0C
function GPV(state) {
    var stack = state.stack;
    var pv = state.pv;

    if (exports.DEBUG) { console.log(state.step, 'GPV[]'); }

    stack.push(pv.x * 0x4000);
    stack.push(pv.y * 0x4000);
}

// GFV[] Get Freedom Vector
// 0x0C
function GFV(state) {
    var stack = state.stack;
    var fv = state.fv;

    if (exports.DEBUG) { console.log(state.step, 'GFV[]'); }

    stack.push(fv.x * 0x4000);
    stack.push(fv.y * 0x4000);
}

// SFVTPV[] Set Freedom Vector To Projection Vector
// 0x0E
function SFVTPV(state) {
    state.fv = state.pv;

    if (exports.DEBUG) { console.log(state.step, 'SFVTPV[]'); }
}

// ISECT[] moves point p to the InterSECTion of two lines
// 0x0F
function ISECT(state)
{
    var stack = state.stack;
    var pa0i = stack.pop();
    var pa1i = stack.pop();
    var pb0i = stack.pop();
    var pb1i = stack.pop();
    var pi = stack.pop();
    var z0 = state.z0;
    var z1 = state.z1;
    var pa0 = z0[pa0i];
    var pa1 = z0[pa1i];
    var pb0 = z1[pb0i];
    var pb1 = z1[pb1i];
    var p = state.z2[pi];

    if (exports.DEBUG) { console.log('ISECT[], ', pa0i, pa1i, pb0i, pb1i, pi); }

    // math from
    // en.wikipedia.org/wiki/Line%E2%80%93line_intersection#Given_two_points_on_each_line

    var x1 = pa0.x;
    var y1 = pa0.y;
    var x2 = pa1.x;
    var y2 = pa1.y;
    var x3 = pb0.x;
    var y3 = pb0.y;
    var x4 = pb1.x;
    var y4 = pb1.y;

    var div = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    var f1 = x1 * y2 - y1 * x2;
    var f2 = x3 * y4 - y3 * x4;

    p.x = (f1 * (x3 - x4) - f2 * (x1 - x2)) / div;
    p.y = (f1 * (y3 - y4) - f2 * (y1 - y2)) / div;
}

// SRP0[] Set Reference Point 0
// 0x10
function SRP0(state) {
    state.rp0 = state.stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'SRP0[]', state.rp0); }
}

// SRP1[] Set Reference Point 1
// 0x11
function SRP1(state) {
    state.rp1 = state.stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'SRP1[]', state.rp1); }
}

// SRP1[] Set Reference Point 2
// 0x12
function SRP2(state) {
    state.rp2 = state.stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'SRP2[]', state.rp2); }
}

// SZP0[] Set Zone Pointer 0
// 0x13
function SZP0(state) {
    var n = state.stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'SZP0[]', n); }

    state.zp0 = n;

    switch (n) {
        case 0:
            if (!state.tZone) { initTZone(state); }
            state.z0 = state.tZone;
            break;
        case 1 :
            state.z0 = state.gZone;
            break;
        default :
            throw new Error('Invalid zone pointer');
    }
}

// SZP1[] Set Zone Pointer 1
// 0x14
function SZP1(state) {
    var n = state.stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'SZP1[]', n); }

    state.zp1 = n;

    switch (n) {
        case 0:
            if (!state.tZone) { initTZone(state); }
            state.z1 = state.tZone;
            break;
        case 1 :
            state.z1 = state.gZone;
            break;
        default :
            throw new Error('Invalid zone pointer');
    }
}

// SZP2[] Set Zone Pointer 2
// 0x15
function SZP2(state) {
    var n = state.stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'SZP2[]', n); }

    state.zp2 = n;

    switch (n) {
        case 0:
            if (!state.tZone) { initTZone(state); }
            state.z2 = state.tZone;
            break;
        case 1 :
            state.z2 = state.gZone;
            break;
        default :
            throw new Error('Invalid zone pointer');
    }
}

// SZPS[] Set Zone PointerS
// 0x16
function SZPS(state) {
    var n = state.stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'SZPS[]', n); }

    state.zp0 = state.zp1 = state.zp2 = n;

    switch (n) {
        case 0:
            if (!state.tZone) { initTZone(state); }
            state.z0 = state.z1 = state.z2 = state.tZone;
            break;
        case 1 :
            state.z0 = state.z1 = state.z2 = state.gZone;
            break;
        default :
            throw new Error('Invalid zone pointer');
    }
}

// SLOOP[] Set LOOP variable
// 0x17
function SLOOP(state) {
    state.loop = state.stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'SLOOP[]', state.loop); }
}

// RTG[] Round To Grid
// 0x18
function RTG(state) {
    if (exports.DEBUG) { console.log(state.step, 'RTG[]'); }

    state.round = roundToGrid;
}

// RTHG[] Round To Half Grid
// 0x19
function RTHG(state) {
    if (exports.DEBUG) { console.log(state.step, 'RTHG[]'); }

    state.round = roundToHalfGrid;
}

// SMD[] Set Minimum Distance
// 0x1A
function SMD(state) {
    var d = state.stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'SMD[]', d); }

    state.minDis = d / 0x40;
}

// ELSE[] ELSE clause
// 0x1B
function ELSE(state) {
    // This instruction has been reached by executing a then branch
    // so it just skips ahead until matching EIF.
    //
    // In case the IF was negative the IF[] instruction already
    // skipped forward over the ELSE[]

    if (exports.DEBUG) { console.log(state.step, 'ELSE[]'); }

    skip(state, false);
}

// JMPR[] JuMP Relative
// 0x1C
function JMPR(state) {
    var o = state.stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'JMPR[]', o); }

    // A jump by 1 would do nothing.
    state.ip += o - 1;
}

// SCVTCI[] Set Control Value Table Cut-In
// 0x1D
function SCVTCI(state) {
    var n = state.stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'SCVTCI[]', n); }

    state.cvCutIn = n / 0x40;
}

// DUP[] DUPlicate top stack element
// 0x20
function DUP(state) {
    var stack = state.stack;

    if (exports.DEBUG) { console.log(state.step, 'DUP[]'); }

    stack.push(stack[stack.length - 1]);
}

// POP[] POP top stack element
// 0x21
function POP(state) {
    if (exports.DEBUG) { console.log(state.step, 'POP[]'); }

    state.stack.pop();
}

// CLEAR[] CLEAR the stack
// 0x22
function CLEAR(state) {
    if (exports.DEBUG) { console.log(state.step, 'CLEAR[]'); }

    state.stack.length = 0;
}

// SWAP[] SWAP the top two elements on the stack
// 0x23
function SWAP(state) {
    var stack = state.stack;

    var a = stack.pop();
    var b = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'SWAP[]'); }

    stack.push(a);
    stack.push(b);
}

// DEPTH[] DEPTH of the stack
// 0x24
function DEPTH(state) {
    var stack = state.stack;

    if (exports.DEBUG) { console.log(state.step, 'DEPTH[]'); }

    stack.push(stack.length);
}

// LOOPCALL[] LOOPCALL function
// 0x2A
function LOOPCALL(state) {
    var stack = state.stack;
    var fn = stack.pop();
    var c = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'LOOPCALL[]', fn, c); }

    // saves callers program
    var cip = state.ip;
    var cprog = state.prog;

    state.prog = state.funcs[fn];

    // executes the function
    for (var i = 0; i < c; i++) {
        exec(state);

        if (exports.DEBUG) { console.log(
            ++state.step,
            i + 1 < c ? 'next loopcall' : 'done loopcall',
            i
        ); }
    }

    // restores the callers program
    state.ip = cip;
    state.prog = cprog;
}

// CALL[] CALL function
// 0x2B
function CALL(state) {
    var fn = state.stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'CALL[]', fn); }

    // saves callers program
    var cip = state.ip;
    var cprog = state.prog;

    state.prog = state.funcs[fn];

    // executes the function
    exec(state);

    // restores the callers program
    state.ip = cip;
    state.prog = cprog;

    if (exports.DEBUG) { console.log(++state.step, 'returning from', fn); }
}

// CINDEX[] Copy the INDEXed element to the top of the stack
// 0x25
function CINDEX(state) {
    var stack = state.stack;
    var k = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'CINDEX[]', k); }

    // In case of k == 1, it copies the last element after popping
    // thus stack.length - k.
    stack.push(stack[stack.length - k]);
}

// MINDEX[] Move the INDEXed element to the top of the stack
// 0x26
function MINDEX(state) {
    var stack = state.stack;
    var k = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'MINDEX[]', k); }

    stack.push(stack.splice(stack.length - k, 1)[0]);
}

// FDEF[] Function DEFinition
// 0x2C
function FDEF(state) {
    if (state.env !== 'fpgm') { throw new Error('FDEF not allowed here'); }
    var stack = state.stack;
    var prog = state.prog;
    var ip = state.ip;

    var fn = stack.pop();
    var ipBegin = ip;

    if (exports.DEBUG) { console.log(state.step, 'FDEF[]', fn); }

    while (prog[++ip] !== 0x2D){  }

    state.ip = ip;
    state.funcs[fn] = prog.slice(ipBegin + 1, ip);
}

// MDAP[a] Move Direct Absolute Point
// 0x2E-0x2F
function MDAP(round, state) {
    var pi = state.stack.pop();
    var p = state.z0[pi];
    var fv = state.fv;
    var pv = state.pv;

    if (exports.DEBUG) { console.log(state.step, 'MDAP[' + round + ']', pi); }

    var d = pv.distance(p, HPZero);

    if (round) { d = state.round(d); }

    fv.setRelative(p, HPZero, d, pv);
    fv.touch(p);

    state.rp0 = state.rp1 = pi;
}

// IUP[a] Interpolate Untouched Points through the outline
// 0x30
function IUP(v, state) {
    var z2 = state.z2;
    var pLen = z2.length - 2;
    var cp;
    var pp;
    var np;

    if (exports.DEBUG) { console.log(state.step, 'IUP[' + v.axis + ']'); }

    for (var i = 0; i < pLen; i++) {
        cp = z2[i]; // current point

        // if this point has been touched go on
        if (v.touched(cp)) { continue; }

        pp = cp.prevTouched(v);

        // no point on the contour has been touched?
        if (pp === cp) { continue; }

        np = cp.nextTouched(v);

        if (pp === np) {
            // only one point on the contour has been touched
            // so simply moves the point like that

            v.setRelative(cp, cp, v.distance(pp, pp, false, true), v, true);
        }

        v.interpolate(cp, pp, np, v);
    }
}

// SHP[] SHift Point using reference point
// 0x32-0x33
function SHP(a, state) {
    var stack = state.stack;
    var rpi = a ? state.rp1 : state.rp2;
    var rp = (a ? state.z0 : state.z1)[rpi];
    var fv = state.fv;
    var pv = state.pv;
    var loop = state.loop;
    var z2 = state.z2;

    while (loop--)
    {
        var pi = stack.pop();
        var p = z2[pi];

        var d = pv.distance(rp, rp, false, true);
        fv.setRelative(p, p, d, pv);
        fv.touch(p);

        if (exports.DEBUG) {
            console.log(
                state.step,
                (state.loop > 1 ?
                   'loop ' + (state.loop - loop) + ': ' :
                   ''
                ) +
                'SHP[' + (a ? 'rp1' : 'rp2') + ']', pi
            );
        }
    }

    state.loop = 1;
}

// SHC[] SHift Contour using reference point
// 0x36-0x37
function SHC(a, state) {
    var stack = state.stack;
    var rpi = a ? state.rp1 : state.rp2;
    var rp = (a ? state.z0 : state.z1)[rpi];
    var fv = state.fv;
    var pv = state.pv;
    var ci = stack.pop();
    var sp = state.z2[state.contours[ci]];
    var p = sp;

    if (exports.DEBUG) { console.log(state.step, 'SHC[' + a + ']', ci); }

    var d = pv.distance(rp, rp, false, true);

    do {
        if (p !== rp) { fv.setRelative(p, p, d, pv); }
        p = p.nextPointOnContour;
    } while (p !== sp);
}

// SHZ[] SHift Zone using reference point
// 0x36-0x37
function SHZ(a, state) {
    var stack = state.stack;
    var rpi = a ? state.rp1 : state.rp2;
    var rp = (a ? state.z0 : state.z1)[rpi];
    var fv = state.fv;
    var pv = state.pv;

    var e = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'SHZ[' + a + ']', e); }

    var z;
    switch (e) {
        case 0 : z = state.tZone; break;
        case 1 : z = state.gZone; break;
        default : throw new Error('Invalid zone');
    }

    var p;
    var d = pv.distance(rp, rp, false, true);
    var pLen = z.length - 2;
    for (var i = 0; i < pLen; i++)
    {
        p = z[i];
        if (p !== rp) { fv.setRelative(p, p, d, pv); }
    }
}

// SHPIX[] SHift point by a PIXel amount
// 0x38
function SHPIX(state) {
    var stack = state.stack;
    var loop = state.loop;
    var fv = state.fv;
    var d = stack.pop() / 0x40;
    var z2 = state.z2;

    while (loop--) {
        var pi = stack.pop();
        var p = z2[pi];

        if (exports.DEBUG) {
            console.log(
                state.step,
                (state.loop > 1 ? 'loop ' + (state.loop - loop) + ': ' : '') +
                'SHPIX[]', pi, d
            );
        }

        fv.setRelative(p, p, d);
        fv.touch(p);
    }

    state.loop = 1;
}

// IP[] Interpolate Point
// 0x39
function IP(state) {
    var stack = state.stack;
    var rp1i = state.rp1;
    var rp2i = state.rp2;
    var loop = state.loop;
    var rp1 = state.z0[rp1i];
    var rp2 = state.z1[rp2i];
    var fv = state.fv;
    var pv = state.dpv;
    var z2 = state.z2;

    while (loop--) {
        var pi = stack.pop();
        var p = z2[pi];

        if (exports.DEBUG) {
            console.log(
                state.step,
                (state.loop > 1 ? 'loop ' + (state.loop - loop) + ': ' : '') +
                'IP[]', pi, rp1i, '<->', rp2i
            );
        }

        fv.interpolate(p, rp1, rp2, pv);

        fv.touch(p);
    }

    state.loop = 1;
}

// MSIRP[a] Move Stack Indirect Relative Point
// 0x3A-0x3B
function MSIRP(a, state) {
    var stack = state.stack;
    var d = stack.pop() / 64;
    var pi = stack.pop();
    var p = state.z1[pi];
    var rp0 = state.z0[state.rp0];
    var fv = state.fv;
    var pv = state.pv;

    fv.setRelative(p, rp0, d, pv);
    fv.touch(p);

    if (exports.DEBUG) { console.log(state.step, 'MSIRP[' + a + ']', d, pi); }

    state.rp1 = state.rp0;
    state.rp2 = pi;
    if (a) { state.rp0 = pi; }
}

// ALIGNRP[] Align to reference point.
// 0x3C
function ALIGNRP(state) {
    var stack = state.stack;
    var rp0i = state.rp0;
    var rp0 = state.z0[rp0i];
    var loop = state.loop;
    var fv = state.fv;
    var pv = state.pv;
    var z1 = state.z1;

    while (loop--) {
        var pi = stack.pop();
        var p = z1[pi];

        if (exports.DEBUG) {
            console.log(
                state.step,
                (state.loop > 1 ? 'loop ' + (state.loop - loop) + ': ' : '') +
                'ALIGNRP[]', pi
            );
        }

        fv.setRelative(p, rp0, 0, pv);
        fv.touch(p);
    }

    state.loop = 1;
}

// RTG[] Round To Double Grid
// 0x3D
function RTDG(state) {
    if (exports.DEBUG) { console.log(state.step, 'RTDG[]'); }

    state.round = roundToDoubleGrid;
}

// MIAP[a] Move Indirect Absolute Point
// 0x3E-0x3F
function MIAP(round, state) {
    var stack = state.stack;
    var n = stack.pop();
    var pi = stack.pop();
    var p = state.z0[pi];
    var fv = state.fv;
    var pv = state.pv;
    var cv = state.cvt[n];

    // TODO cvtcutin should be considered here
    if (round) { cv = state.round(cv); }

    if (exports.DEBUG) {
        console.log(
            state.step,
            'MIAP[' + round + ']',
            n, '(', cv, ')', pi
        );
    }

    fv.setRelative(p, HPZero, cv, pv);

    if (state.zp0 === 0) {
        p.xo = p.x;
        p.yo = p.y;
    }

    fv.touch(p);

    state.rp0 = state.rp1 = pi;
}

// NPUSB[] PUSH N Bytes
// 0x40
function NPUSHB(state) {
    var prog = state.prog;
    var ip = state.ip;
    var stack = state.stack;

    var n = prog[++ip];

    if (exports.DEBUG) { console.log(state.step, 'NPUSHB[]', n); }

    for (var i = 0; i < n; i++) { stack.push(prog[++ip]); }

    state.ip = ip;
}

// NPUSHW[] PUSH N Words
// 0x41
function NPUSHW(state) {
    var ip = state.ip;
    var prog = state.prog;
    var stack = state.stack;
    var n = prog[++ip];

    if (exports.DEBUG) { console.log(state.step, 'NPUSHW[]', n); }

    for (var i = 0; i < n; i++) {
        var w = (prog[++ip] << 8) | prog[++ip];
        if (w & 0x8000) { w = -((w ^ 0xffff) + 1); }
        stack.push(w);
    }

    state.ip = ip;
}

// WS[] Write Store
// 0x42
function WS(state) {
    var stack = state.stack;
    var store = state.store;

    if (!store) { store = state.store = []; }

    var v = stack.pop();
    var l = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'WS', v, l); }

    store[l] = v;
}

// RS[] Read Store
// 0x43
function RS(state) {
    var stack = state.stack;
    var store = state.store;

    var l = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'RS', l); }

    var v = (store && store[l]) || 0;

    stack.push(v);
}

// WCVTP[] Write Control Value Table in Pixel units
// 0x44
function WCVTP(state) {
    var stack = state.stack;

    var v = stack.pop();
    var l = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'WCVTP', v, l); }

    state.cvt[l] = v / 0x40;
}

// RCVT[] Read Control Value Table entry
// 0x45
function RCVT(state) {
    var stack = state.stack;
    var cvte = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'RCVT', cvte); }

    stack.push(state.cvt[cvte] * 0x40);
}

// GC[] Get Coordinate projected onto the projection vector
// 0x46-0x47
function GC(a, state) {
    var stack = state.stack;
    var pi = stack.pop();
    var p = state.z2[pi];

    if (exports.DEBUG) { console.log(state.step, 'GC[' + a + ']', pi); }

    stack.push(state.dpv.distance(p, HPZero, a, false) * 0x40);
}

// MD[a] Measure Distance
// 0x49-0x4A
function MD(a, state) {
    var stack = state.stack;
    var pi2 = stack.pop();
    var pi1 = stack.pop();
    var p2 = state.z1[pi2];
    var p1 = state.z0[pi1];
    var d = state.dpv.distance(p1, p2, a, a);

    if (exports.DEBUG) { console.log(state.step, 'MD[' + a + ']', pi2, pi1, '->', d); }

    state.stack.push(Math.round(d * 64));
}

// MPPEM[] Measure Pixels Per EM
// 0x4B
function MPPEM(state) {
    if (exports.DEBUG) { console.log(state.step, 'MPPEM[]'); }
    state.stack.push(state.ppem);
}

// FLIPON[] set the auto FLIP Boolean to ON
// 0x4D
function FLIPON(state) {
    if (exports.DEBUG) { console.log(state.step, 'FLIPON[]'); }
    state.autoFlip = true;
}

// LT[] Less Than
// 0x50
function LT(state) {
    var stack = state.stack;
    var e2 = stack.pop();
    var e1 = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'LT[]', e2, e1); }

    stack.push(e1 < e2 ? 1 : 0);
}

// LTEQ[] Less Than or EQual
// 0x53
function LTEQ(state) {
    var stack = state.stack;
    var e2 = stack.pop();
    var e1 = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'LTEQ[]', e2, e1); }

    stack.push(e1 <= e2 ? 1 : 0);
}

// GTEQ[] Greater Than
// 0x52
function GT(state) {
    var stack = state.stack;
    var e2 = stack.pop();
    var e1 = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'GT[]', e2, e1); }

    stack.push(e1 > e2 ? 1 : 0);
}

// GTEQ[] Greater Than or EQual
// 0x53
function GTEQ(state) {
    var stack = state.stack;
    var e2 = stack.pop();
    var e1 = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'GTEQ[]', e2, e1); }

    stack.push(e1 >= e2 ? 1 : 0);
}

// EQ[] EQual
// 0x54
function EQ(state) {
    var stack = state.stack;
    var e2 = stack.pop();
    var e1 = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'EQ[]', e2, e1); }

    stack.push(e2 === e1 ? 1 : 0);
}

// NEQ[] Not EQual
// 0x55
function NEQ(state) {
    var stack = state.stack;
    var e2 = stack.pop();
    var e1 = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'NEQ[]', e2, e1); }

    stack.push(e2 !== e1 ? 1 : 0);
}

// ODD[] ODD
// 0x56
function ODD(state) {
    var stack = state.stack;
    var n = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'ODD[]', n); }

    stack.push(Math.trunc(n) % 2 ? 1 : 0);
}

// EVEN[] EVEN
// 0x57
function EVEN(state) {
    var stack = state.stack;
    var n = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'EVEN[]', n); }

    stack.push(Math.trunc(n) % 2 ? 0 : 1);
}

// IF[] IF test
// 0x58
function IF(state) {
    var test = state.stack.pop();
    var ins;

    if (exports.DEBUG) { console.log(state.step, 'IF[]', test); }

    // if test is true it just continues
    // if not the ip is skipped until matching ELSE or EIF
    if (!test) {
        skip(state, true);

        if (exports.DEBUG) { console.log(state.step, ins === 0x1B ? 'ELSE[]' : 'EIF[]'); }
    }
}

// EIF[] End IF
// 0x59
function EIF(state) {
    // this can be reached normally when
    // executing an else branch.
    // -> just ignore it

    if (exports.DEBUG) { console.log(state.step, 'EIF[]'); }
}

// AND[] logical AND
// 0x5A
function AND(state) {
    var stack = state.stack;
    var e2 = stack.pop();
    var e1 = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'AND[]', e2, e1); }

    stack.push(e2 && e1 ? 1 : 0);
}

// OR[] logical OR
// 0x5B
function OR(state) {
    var stack = state.stack;
    var e2 = stack.pop();
    var e1 = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'OR[]', e2, e1); }

    stack.push(e2 || e1 ? 1 : 0);
}

// NOT[] logical NOT
// 0x5C
function NOT(state) {
    var stack = state.stack;
    var e = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'NOT[]', e); }

    stack.push(e ? 0 : 1);
}

// DELTAP1[] DELTA exception P1
// DELTAP2[] DELTA exception P2
// DELTAP3[] DELTA exception P3
// 0x5D, 0x71, 0x72
function DELTAP123(b, state) {
    var stack = state.stack;
    var n = stack.pop();
    var fv = state.fv;
    var pv = state.pv;
    var ppem = state.ppem;
    var base = state.deltaBase + (b - 1) * 16;
    var ds = state.deltaShift;
    var z0 = state.z0;

    if (exports.DEBUG) { console.log(state.step, 'DELTAP[' + b + ']', n, stack); }

    for (var i = 0; i < n; i++)
    {
        var pi = stack.pop();
        var arg = stack.pop();
        var appem = base + ((arg & 0xF0) >> 4);
        if (appem !== ppem) { continue; }

        var mag = (arg & 0x0F) - 8;
        if (mag >= 0) { mag++; }
        if (exports.DEBUG) { console.log(state.step, 'DELTAPFIX', pi, 'by', mag * ds); }

        var p = z0[pi];
        fv.setRelative(p, p, mag * ds, pv);
    }
}

// SDB[] Set Delta Base in the graphics state
// 0x5E
function SDB(state) {
    var stack = state.stack;
    var n = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'SDB[]', n); }

    state.deltaBase = n;
}

// SDS[] Set Delta Shift in the graphics state
// 0x5F
function SDS(state) {
    var stack = state.stack;
    var n = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'SDS[]', n); }

    state.deltaShift = Math.pow(0.5, n);
}

// ADD[] ADD
// 0x60
function ADD(state) {
    var stack = state.stack;
    var n2 = stack.pop();
    var n1 = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'ADD[]', n2, n1); }

    stack.push(n1 + n2);
}

// SUB[] SUB
// 0x61
function SUB(state) {
    var stack = state.stack;
    var n2 = stack.pop();
    var n1 = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'SUB[]', n2, n1); }

    stack.push(n1 - n2);
}

// DIV[] DIV
// 0x62
function DIV(state) {
    var stack = state.stack;
    var n2 = stack.pop();
    var n1 = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'DIV[]', n2, n1); }

    stack.push(n1 * 64 / n2);
}

// MUL[] MUL
// 0x63
function MUL(state) {
    var stack = state.stack;
    var n2 = stack.pop();
    var n1 = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'MUL[]', n2, n1); }

    stack.push(n1 * n2 / 64);
}

// ABS[] ABSolute value
// 0x64
function ABS(state) {
    var stack = state.stack;
    var n = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'ABS[]', n); }

    stack.push(Math.abs(n));
}

// NEG[] NEGate
// 0x65
function NEG(state) {
    var stack = state.stack;
    var n = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'NEG[]', n); }

    stack.push(-n);
}

// FLOOR[] FLOOR
// 0x66
function FLOOR(state) {
    var stack = state.stack;
    var n = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'FLOOR[]', n); }

    stack.push(Math.floor(n / 0x40) * 0x40);
}

// CEILING[] CEILING
// 0x67
function CEILING(state) {
    var stack = state.stack;
    var n = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'CEILING[]', n); }

    stack.push(Math.ceil(n / 0x40) * 0x40);
}

// ROUND[ab] ROUND value
// 0x68-0x6B
function ROUND(dt, state) {
    var stack = state.stack;
    var n = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'ROUND[]'); }

    stack.push(state.round(n / 0x40) * 0x40);
}

// WCVTF[] Write Control Value Table in Funits
// 0x70
function WCVTF(state) {
    var stack = state.stack;
    var v = stack.pop();
    var l = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'WCVTF[]', v, l); }

    state.cvt[l] = v * state.ppem / state.font.unitsPerEm;
}

// DELTAC1[] DELTA exception C1
// DELTAC2[] DELTA exception C2
// DELTAC3[] DELTA exception C3
// 0x73, 0x74, 0x75
function DELTAC123(b, state) {
    var stack = state.stack;
    var n = stack.pop();
    var ppem = state.ppem;
    var base = state.deltaBase + (b - 1) * 16;
    var ds = state.deltaShift;

    if (exports.DEBUG) { console.log(state.step, 'DELTAC[' + b + ']', n, stack); }

    for (var i = 0; i < n; i++) {
        var c = stack.pop();
        var arg = stack.pop();
        var appem = base + ((arg & 0xF0) >> 4);
        if (appem !== ppem) { continue; }

        var mag = (arg & 0x0F) - 8;
        if (mag >= 0) { mag++; }

        var delta = mag * ds;

        if (exports.DEBUG) { console.log(state.step, 'DELTACFIX', c, 'by', delta); }

        state.cvt[c] += delta;
    }
}

// SROUND[] Super ROUND
// 0x76
function SROUND(state) {
    var n = state.stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'SROUND[]', n); }

    state.round = roundSuper;

    var period;

    switch (n & 0xC0) {
        case 0x00:
            period = 0.5;
            break;
        case 0x40:
            period = 1;
            break;
        case 0x80:
            period = 2;
            break;
        default:
            throw new Error('invalid SROUND value');
    }

    state.srPeriod = period;

    switch (n & 0x30) {
        case 0x00:
            state.srPhase = 0;
            break;
        case 0x10:
            state.srPhase = 0.25 * period;
            break;
        case 0x20:
            state.srPhase = 0.5  * period;
            break;
        case 0x30:
            state.srPhase = 0.75 * period;
            break;
        default: throw new Error('invalid SROUND value');
    }

    n &= 0x0F;

    if (n === 0) { state.srThreshold = 0; }
    else { state.srThreshold = (n / 8 - 0.5) * period; }
}

// S45ROUND[] Super ROUND 45 degrees
// 0x77
function S45ROUND(state) {
    var n = state.stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'S45ROUND[]', n); }

    state.round = roundSuper;

    var period;

    switch (n & 0xC0) {
        case 0x00:
            period = Math.sqrt(2) / 2;
            break;
        case 0x40:
            period = Math.sqrt(2);
            break;
        case 0x80:
            period = 2 * Math.sqrt(2);
            break;
        default:
            throw new Error('invalid S45ROUND value');
    }

    state.srPeriod = period;

    switch (n & 0x30) {
        case 0x00:
            state.srPhase = 0;
            break;
        case 0x10:
            state.srPhase = 0.25 * period;
            break;
        case 0x20:
            state.srPhase = 0.5  * period;
            break;
        case 0x30:
            state.srPhase = 0.75 * period;
            break;
        default:
            throw new Error('invalid S45ROUND value');
    }

    n &= 0x0F;

    if (n === 0) { state.srThreshold = 0; }
    else { state.srThreshold = (n / 8 - 0.5) * period; }
}

// ROFF[] Round Off
// 0x7A
function ROFF(state) {
    if (exports.DEBUG) { console.log(state.step, 'ROFF[]'); }

    state.round = roundOff;
}

// RUTG[] Round Up To Grid
// 0x7C
function RUTG(state) {
    if (exports.DEBUG) { console.log(state.step, 'RUTG[]'); }

    state.round = roundUpToGrid;
}

// RDTG[] Round Down To Grid
// 0x7D
function RDTG(state) {
    if (exports.DEBUG) { console.log(state.step, 'RDTG[]'); }

    state.round = roundDownToGrid;
}

// SCANCTRL[] SCAN conversion ConTRoL
// 0x85
function SCANCTRL(state) {
    var n = state.stack.pop();

    // ignored by opentype.js

    if (exports.DEBUG) { console.log(state.step, 'SCANCTRL[]', n); }
}

// SDPVTL[a] Set Dual Projection Vector To Line
// 0x86-0x87
function SDPVTL(a, state) {
    var stack = state.stack;
    var p2i = stack.pop();
    var p1i = stack.pop();
    var p2 = state.z2[p2i];
    var p1 = state.z1[p1i];

    if (exports.DEBUG) { console.log('SDPVTL[' + a + ']', p2i, p1i); }

    var dx;
    var dy;

    if (!a) {
        dx = p1.x - p2.x;
        dy = p1.y - p2.y;
    } else {
        dx = p2.y - p1.y;
        dy = p1.x - p2.x;
    }

    state.dpv = getUnitVector(dx, dy);
}

// GETINFO[] GET INFOrmation
// 0x88
function GETINFO(state) {
    var stack = state.stack;
    var sel = stack.pop();
    var r = 0;

    if (exports.DEBUG) { console.log(state.step, 'GETINFO[]', sel); }

    // v35 as in no subpixel hinting
    if (sel & 0x01) { r = 35; }

    // TODO rotation and stretch currently not supported
    // and thus those GETINFO are always 0.

    // opentype.js is always gray scaling
    if (sel & 0x20) { r |= 0x1000; }

    stack.push(r);
}

// ROLL[] ROLL the top three stack elements
// 0x8A
function ROLL(state) {
    var stack = state.stack;
    var a = stack.pop();
    var b = stack.pop();
    var c = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'ROLL[]'); }

    stack.push(b);
    stack.push(a);
    stack.push(c);
}

// MAX[] MAXimum of top two stack elements
// 0x8B
function MAX(state) {
    var stack = state.stack;
    var e2 = stack.pop();
    var e1 = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'MAX[]', e2, e1); }

    stack.push(Math.max(e1, e2));
}

// MIN[] MINimum of top two stack elements
// 0x8C
function MIN(state) {
    var stack = state.stack;
    var e2 = stack.pop();
    var e1 = stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'MIN[]', e2, e1); }

    stack.push(Math.min(e1, e2));
}

// SCANTYPE[] SCANTYPE
// 0x8D
function SCANTYPE(state) {
    var n = state.stack.pop();
    // ignored by opentype.js
    if (exports.DEBUG) { console.log(state.step, 'SCANTYPE[]', n); }
}

// INSTCTRL[] INSTCTRL
// 0x8D
function INSTCTRL(state) {
    var s = state.stack.pop();
    var v = state.stack.pop();

    if (exports.DEBUG) { console.log(state.step, 'INSTCTRL[]', s, v); }

    switch (s) {
        case 1 : state.inhibitGridFit = !!v; return;
        case 2 : state.ignoreCvt = !!v; return;
        default: throw new Error('invalid INSTCTRL[] selector');
    }
}

// PUSHB[abc] PUSH Bytes
// 0xB0-0xB7
function PUSHB(n, state) {
    var stack = state.stack;
    var prog = state.prog;
    var ip = state.ip;

    if (exports.DEBUG) { console.log(state.step, 'PUSHB[' + n + ']'); }

    for (var i = 0; i < n; i++) { stack.push(prog[++ip]); }

    state.ip = ip;
}

// PUSHW[abc] PUSH Words
// 0xB8-0xBF
function PUSHW(n, state) {
    var ip = state.ip;
    var prog = state.prog;
    var stack = state.stack;

    if (exports.DEBUG) { console.log(state.ip, 'PUSHW[' + n + ']'); }

    for (var i = 0; i < n; i++) {
        var w = (prog[++ip] << 8) | prog[++ip];
        if (w & 0x8000) { w = -((w ^ 0xffff) + 1); }
        stack.push(w);
    }

    state.ip = ip;
}

// MDRP[abcde] Move Direct Relative Point
// 0xD0-0xEF
// (if indirect is 0)
//
// and
//
// MIRP[abcde] Move Indirect Relative Point
// 0xE0-0xFF
// (if indirect is 1)

function MDRP_MIRP(indirect, setRp0, keepD, ro, dt, state) {
    var stack = state.stack;
    var cvte = indirect && stack.pop();
    var pi = stack.pop();
    var rp0i = state.rp0;
    var rp = state.z0[rp0i];
    var p = state.z1[pi];

    var md = state.minDis;
    var fv = state.fv;
    var pv = state.dpv;
    var od; // original distance
    var d; // moving distance
    var sign; // sign of distance
    var cv;

    d = od = pv.distance(p, rp, true, true);
    sign = d >= 0 ? 1 : -1; // Math.sign would be 0 in case of 0

    // TODO consider autoFlip
    d = Math.abs(d);

    if (indirect) {
        cv = state.cvt[cvte];

        if (ro && Math.abs(d - cv) < state.cvCutIn) { d = cv; }
    }

    if (keepD && d < md) { d = md; }

    if (ro) { d = state.round(d); }

    fv.setRelative(p, rp, sign * d, pv);
    fv.touch(p);

    if (exports.DEBUG) {
        console.log(
            state.step,
            (indirect ? 'MIRP[' : 'MDRP[') +
            (setRp0 ? 'M' : 'm') +
            (keepD ? '>' : '_') +
            (ro ? 'R' : '_') +
            (dt === 0 ? 'Gr' : (dt === 1 ? 'Bl' : (dt === 2 ? 'Wh' : ''))) +
            ']',
            indirect ?
                cvte + '(' + state.cvt[cvte] + ',' +  cv + ')' :
                '',
            pi,
            '(d =', od, '->', sign * d, ')'
        );
    }

    state.rp1 = state.rp0;
    state.rp2 = pi;
    if (setRp0) { state.rp0 = pi; }
}

/*
* The instruction table.
*/
instructionTable = [
    /* 0x00 */ SVTCA.bind(undefined, yUnitVector),
    /* 0x01 */ SVTCA.bind(undefined, xUnitVector),
    /* 0x02 */ SPVTCA.bind(undefined, yUnitVector),
    /* 0x03 */ SPVTCA.bind(undefined, xUnitVector),
    /* 0x04 */ SFVTCA.bind(undefined, yUnitVector),
    /* 0x05 */ SFVTCA.bind(undefined, xUnitVector),
    /* 0x06 */ SPVTL.bind(undefined, 0),
    /* 0x07 */ SPVTL.bind(undefined, 1),
    /* 0x08 */ SFVTL.bind(undefined, 0),
    /* 0x09 */ SFVTL.bind(undefined, 1),
    /* 0x0A */ SPVFS,
    /* 0x0B */ SFVFS,
    /* 0x0C */ GPV,
    /* 0x0D */ GFV,
    /* 0x0E */ SFVTPV,
    /* 0x0F */ ISECT,
    /* 0x10 */ SRP0,
    /* 0x11 */ SRP1,
    /* 0x12 */ SRP2,
    /* 0x13 */ SZP0,
    /* 0x14 */ SZP1,
    /* 0x15 */ SZP2,
    /* 0x16 */ SZPS,
    /* 0x17 */ SLOOP,
    /* 0x18 */ RTG,
    /* 0x19 */ RTHG,
    /* 0x1A */ SMD,
    /* 0x1B */ ELSE,
    /* 0x1C */ JMPR,
    /* 0x1D */ SCVTCI,
    /* 0x1E */ undefined,   // TODO SSWCI
    /* 0x1F */ undefined,   // TODO SSW
    /* 0x20 */ DUP,
    /* 0x21 */ POP,
    /* 0x22 */ CLEAR,
    /* 0x23 */ SWAP,
    /* 0x24 */ DEPTH,
    /* 0x25 */ CINDEX,
    /* 0x26 */ MINDEX,
    /* 0x27 */ undefined,   // TODO ALIGNPTS
    /* 0x28 */ undefined,
    /* 0x29 */ undefined,   // TODO UTP
    /* 0x2A */ LOOPCALL,
    /* 0x2B */ CALL,
    /* 0x2C */ FDEF,
    /* 0x2D */ undefined,   // ENDF (eaten by FDEF)
    /* 0x2E */ MDAP.bind(undefined, 0),
    /* 0x2F */ MDAP.bind(undefined, 1),
    /* 0x30 */ IUP.bind(undefined, yUnitVector),
    /* 0x31 */ IUP.bind(undefined, xUnitVector),
    /* 0x32 */ SHP.bind(undefined, 0),
    /* 0x33 */ SHP.bind(undefined, 1),
    /* 0x34 */ SHC.bind(undefined, 0),
    /* 0x35 */ SHC.bind(undefined, 1),
    /* 0x36 */ SHZ.bind(undefined, 0),
    /* 0x37 */ SHZ.bind(undefined, 1),
    /* 0x38 */ SHPIX,
    /* 0x39 */ IP,
    /* 0x3A */ MSIRP.bind(undefined, 0),
    /* 0x3B */ MSIRP.bind(undefined, 1),
    /* 0x3C */ ALIGNRP,
    /* 0x3D */ RTDG,
    /* 0x3E */ MIAP.bind(undefined, 0),
    /* 0x3F */ MIAP.bind(undefined, 1),
    /* 0x40 */ NPUSHB,
    /* 0x41 */ NPUSHW,
    /* 0x42 */ WS,
    /* 0x43 */ RS,
    /* 0x44 */ WCVTP,
    /* 0x45 */ RCVT,
    /* 0x46 */ GC.bind(undefined, 0),
    /* 0x47 */ GC.bind(undefined, 1),
    /* 0x48 */ undefined,   // TODO SCFS
    /* 0x49 */ MD.bind(undefined, 0),
    /* 0x4A */ MD.bind(undefined, 1),
    /* 0x4B */ MPPEM,
    /* 0x4C */ undefined,   // TODO MPS
    /* 0x4D */ FLIPON,
    /* 0x4E */ undefined,   // TODO FLIPOFF
    /* 0x4F */ undefined,   // TODO DEBUG
    /* 0x50 */ LT,
    /* 0x51 */ LTEQ,
    /* 0x52 */ GT,
    /* 0x53 */ GTEQ,
    /* 0x54 */ EQ,
    /* 0x55 */ NEQ,
    /* 0x56 */ ODD,
    /* 0x57 */ EVEN,
    /* 0x58 */ IF,
    /* 0x59 */ EIF,
    /* 0x5A */ AND,
    /* 0x5B */ OR,
    /* 0x5C */ NOT,
    /* 0x5D */ DELTAP123.bind(undefined, 1),
    /* 0x5E */ SDB,
    /* 0x5F */ SDS,
    /* 0x60 */ ADD,
    /* 0x61 */ SUB,
    /* 0x62 */ DIV,
    /* 0x63 */ MUL,
    /* 0x64 */ ABS,
    /* 0x65 */ NEG,
    /* 0x66 */ FLOOR,
    /* 0x67 */ CEILING,
    /* 0x68 */ ROUND.bind(undefined, 0),
    /* 0x69 */ ROUND.bind(undefined, 1),
    /* 0x6A */ ROUND.bind(undefined, 2),
    /* 0x6B */ ROUND.bind(undefined, 3),
    /* 0x6C */ undefined,   // TODO NROUND[ab]
    /* 0x6D */ undefined,   // TODO NROUND[ab]
    /* 0x6E */ undefined,   // TODO NROUND[ab]
    /* 0x6F */ undefined,   // TODO NROUND[ab]
    /* 0x70 */ WCVTF,
    /* 0x71 */ DELTAP123.bind(undefined, 2),
    /* 0x72 */ DELTAP123.bind(undefined, 3),
    /* 0x73 */ DELTAC123.bind(undefined, 1),
    /* 0x74 */ DELTAC123.bind(undefined, 2),
    /* 0x75 */ DELTAC123.bind(undefined, 3),
    /* 0x76 */ SROUND,
    /* 0x77 */ S45ROUND,
    /* 0x78 */ undefined,   // TODO JROT[]
    /* 0x79 */ undefined,   // TODO JROF[]
    /* 0x7A */ ROFF,
    /* 0x7B */ undefined,
    /* 0x7C */ RUTG,
    /* 0x7D */ RDTG,
    /* 0x7E */ POP, // actually SANGW, supposed to do only a pop though
    /* 0x7F */ POP, // actually AA, supposed to do only a pop though
    /* 0x80 */ undefined,   // TODO FLIPPT
    /* 0x81 */ undefined,   // TODO FLIPRGON
    /* 0x82 */ undefined,   // TODO FLIPRGOFF
    /* 0x83 */ undefined,
    /* 0x84 */ undefined,
    /* 0x85 */ SCANCTRL,
    /* 0x86 */ SDPVTL.bind(undefined, 0),
    /* 0x87 */ SDPVTL.bind(undefined, 1),
    /* 0x88 */ GETINFO,
    /* 0x89 */ undefined,   // TODO IDEF
    /* 0x8A */ ROLL,
    /* 0x8B */ MAX,
    /* 0x8C */ MIN,
    /* 0x8D */ SCANTYPE,
    /* 0x8E */ INSTCTRL,
    /* 0x8F */ undefined,
    /* 0x90 */ undefined,
    /* 0x91 */ undefined,
    /* 0x92 */ undefined,
    /* 0x93 */ undefined,
    /* 0x94 */ undefined,
    /* 0x95 */ undefined,
    /* 0x96 */ undefined,
    /* 0x97 */ undefined,
    /* 0x98 */ undefined,
    /* 0x99 */ undefined,
    /* 0x9A */ undefined,
    /* 0x9B */ undefined,
    /* 0x9C */ undefined,
    /* 0x9D */ undefined,
    /* 0x9E */ undefined,
    /* 0x9F */ undefined,
    /* 0xA0 */ undefined,
    /* 0xA1 */ undefined,
    /* 0xA2 */ undefined,
    /* 0xA3 */ undefined,
    /* 0xA4 */ undefined,
    /* 0xA5 */ undefined,
    /* 0xA6 */ undefined,
    /* 0xA7 */ undefined,
    /* 0xA8 */ undefined,
    /* 0xA9 */ undefined,
    /* 0xAA */ undefined,
    /* 0xAB */ undefined,
    /* 0xAC */ undefined,
    /* 0xAD */ undefined,
    /* 0xAE */ undefined,
    /* 0xAF */ undefined,
    /* 0xB0 */ PUSHB.bind(undefined, 1),
    /* 0xB1 */ PUSHB.bind(undefined, 2),
    /* 0xB2 */ PUSHB.bind(undefined, 3),
    /* 0xB3 */ PUSHB.bind(undefined, 4),
    /* 0xB4 */ PUSHB.bind(undefined, 5),
    /* 0xB5 */ PUSHB.bind(undefined, 6),
    /* 0xB6 */ PUSHB.bind(undefined, 7),
    /* 0xB7 */ PUSHB.bind(undefined, 8),
    /* 0xB8 */ PUSHW.bind(undefined, 1),
    /* 0xB9 */ PUSHW.bind(undefined, 2),
    /* 0xBA */ PUSHW.bind(undefined, 3),
    /* 0xBB */ PUSHW.bind(undefined, 4),
    /* 0xBC */ PUSHW.bind(undefined, 5),
    /* 0xBD */ PUSHW.bind(undefined, 6),
    /* 0xBE */ PUSHW.bind(undefined, 7),
    /* 0xBF */ PUSHW.bind(undefined, 8),
    /* 0xC0 */ MDRP_MIRP.bind(undefined, 0, 0, 0, 0, 0),
    /* 0xC1 */ MDRP_MIRP.bind(undefined, 0, 0, 0, 0, 1),
    /* 0xC2 */ MDRP_MIRP.bind(undefined, 0, 0, 0, 0, 2),
    /* 0xC3 */ MDRP_MIRP.bind(undefined, 0, 0, 0, 0, 3),
    /* 0xC4 */ MDRP_MIRP.bind(undefined, 0, 0, 0, 1, 0),
    /* 0xC5 */ MDRP_MIRP.bind(undefined, 0, 0, 0, 1, 1),
    /* 0xC6 */ MDRP_MIRP.bind(undefined, 0, 0, 0, 1, 2),
    /* 0xC7 */ MDRP_MIRP.bind(undefined, 0, 0, 0, 1, 3),
    /* 0xC8 */ MDRP_MIRP.bind(undefined, 0, 0, 1, 0, 0),
    /* 0xC9 */ MDRP_MIRP.bind(undefined, 0, 0, 1, 0, 1),
    /* 0xCA */ MDRP_MIRP.bind(undefined, 0, 0, 1, 0, 2),
    /* 0xCB */ MDRP_MIRP.bind(undefined, 0, 0, 1, 0, 3),
    /* 0xCC */ MDRP_MIRP.bind(undefined, 0, 0, 1, 1, 0),
    /* 0xCD */ MDRP_MIRP.bind(undefined, 0, 0, 1, 1, 1),
    /* 0xCE */ MDRP_MIRP.bind(undefined, 0, 0, 1, 1, 2),
    /* 0xCF */ MDRP_MIRP.bind(undefined, 0, 0, 1, 1, 3),
    /* 0xD0 */ MDRP_MIRP.bind(undefined, 0, 1, 0, 0, 0),
    /* 0xD1 */ MDRP_MIRP.bind(undefined, 0, 1, 0, 0, 1),
    /* 0xD2 */ MDRP_MIRP.bind(undefined, 0, 1, 0, 0, 2),
    /* 0xD3 */ MDRP_MIRP.bind(undefined, 0, 1, 0, 0, 3),
    /* 0xD4 */ MDRP_MIRP.bind(undefined, 0, 1, 0, 1, 0),
    /* 0xD5 */ MDRP_MIRP.bind(undefined, 0, 1, 0, 1, 1),
    /* 0xD6 */ MDRP_MIRP.bind(undefined, 0, 1, 0, 1, 2),
    /* 0xD7 */ MDRP_MIRP.bind(undefined, 0, 1, 0, 1, 3),
    /* 0xD8 */ MDRP_MIRP.bind(undefined, 0, 1, 1, 0, 0),
    /* 0xD9 */ MDRP_MIRP.bind(undefined, 0, 1, 1, 0, 1),
    /* 0xDA */ MDRP_MIRP.bind(undefined, 0, 1, 1, 0, 2),
    /* 0xDB */ MDRP_MIRP.bind(undefined, 0, 1, 1, 0, 3),
    /* 0xDC */ MDRP_MIRP.bind(undefined, 0, 1, 1, 1, 0),
    /* 0xDD */ MDRP_MIRP.bind(undefined, 0, 1, 1, 1, 1),
    /* 0xDE */ MDRP_MIRP.bind(undefined, 0, 1, 1, 1, 2),
    /* 0xDF */ MDRP_MIRP.bind(undefined, 0, 1, 1, 1, 3),
    /* 0xE0 */ MDRP_MIRP.bind(undefined, 1, 0, 0, 0, 0),
    /* 0xE1 */ MDRP_MIRP.bind(undefined, 1, 0, 0, 0, 1),
    /* 0xE2 */ MDRP_MIRP.bind(undefined, 1, 0, 0, 0, 2),
    /* 0xE3 */ MDRP_MIRP.bind(undefined, 1, 0, 0, 0, 3),
    /* 0xE4 */ MDRP_MIRP.bind(undefined, 1, 0, 0, 1, 0),
    /* 0xE5 */ MDRP_MIRP.bind(undefined, 1, 0, 0, 1, 1),
    /* 0xE6 */ MDRP_MIRP.bind(undefined, 1, 0, 0, 1, 2),
    /* 0xE7 */ MDRP_MIRP.bind(undefined, 1, 0, 0, 1, 3),
    /* 0xE8 */ MDRP_MIRP.bind(undefined, 1, 0, 1, 0, 0),
    /* 0xE9 */ MDRP_MIRP.bind(undefined, 1, 0, 1, 0, 1),
    /* 0xEA */ MDRP_MIRP.bind(undefined, 1, 0, 1, 0, 2),
    /* 0xEB */ MDRP_MIRP.bind(undefined, 1, 0, 1, 0, 3),
    /* 0xEC */ MDRP_MIRP.bind(undefined, 1, 0, 1, 1, 0),
    /* 0xED */ MDRP_MIRP.bind(undefined, 1, 0, 1, 1, 1),
    /* 0xEE */ MDRP_MIRP.bind(undefined, 1, 0, 1, 1, 2),
    /* 0xEF */ MDRP_MIRP.bind(undefined, 1, 0, 1, 1, 3),
    /* 0xF0 */ MDRP_MIRP.bind(undefined, 1, 1, 0, 0, 0),
    /* 0xF1 */ MDRP_MIRP.bind(undefined, 1, 1, 0, 0, 1),
    /* 0xF2 */ MDRP_MIRP.bind(undefined, 1, 1, 0, 0, 2),
    /* 0xF3 */ MDRP_MIRP.bind(undefined, 1, 1, 0, 0, 3),
    /* 0xF4 */ MDRP_MIRP.bind(undefined, 1, 1, 0, 1, 0),
    /* 0xF5 */ MDRP_MIRP.bind(undefined, 1, 1, 0, 1, 1),
    /* 0xF6 */ MDRP_MIRP.bind(undefined, 1, 1, 0, 1, 2),
    /* 0xF7 */ MDRP_MIRP.bind(undefined, 1, 1, 0, 1, 3),
    /* 0xF8 */ MDRP_MIRP.bind(undefined, 1, 1, 1, 0, 0),
    /* 0xF9 */ MDRP_MIRP.bind(undefined, 1, 1, 1, 0, 1),
    /* 0xFA */ MDRP_MIRP.bind(undefined, 1, 1, 1, 0, 2),
    /* 0xFB */ MDRP_MIRP.bind(undefined, 1, 1, 1, 0, 3),
    /* 0xFC */ MDRP_MIRP.bind(undefined, 1, 1, 1, 1, 0),
    /* 0xFD */ MDRP_MIRP.bind(undefined, 1, 1, 1, 1, 1),
    /* 0xFE */ MDRP_MIRP.bind(undefined, 1, 1, 1, 1, 2),
    /* 0xFF */ MDRP_MIRP.bind(undefined, 1, 1, 1, 1, 3)
];



/*****************************
  Mathematical Considerations
******************************

fv ... refers to freedom vector
pv ... refers to projection vector
rp ... refers to reference point
p  ... refers to to point being operated on
d  ... refers to distance

SETRELATIVE:
============

case freedom vector == x-axis:
------------------------------

                        (pv)
                     .-'
              rpd .-'
               .-*
          d .-'90°'
         .-'       '
      .-'           '
   *-'               ' b
  rp                  '
                       '
                        '
            p *----------*-------------- (fv)
                          pm

  rpdx = rpx + d * pv.x
  rpdy = rpy + d * pv.y

  equation of line b

   y - rpdy = pvns * (x- rpdx)

   y = p.y

   x = rpdx + ( p.y - rpdy ) / pvns


case freedom vector == y-axis:
------------------------------

    * pm
    |\
    | \
    |  \
    |   \
    |    \
    |     \
    |      \
    |       \
    |        \
    |         \ b
    |          \
    |           \
    |            \    .-' (pv)
    |         90° \.-'
    |           .-'* rpd
    |        .-'
    *     *-'  d
    p     rp

  rpdx = rpx + d * pv.x
  rpdy = rpy + d * pv.y

  equation of line b:
           pvns ... normal slope to pv

   y - rpdy = pvns * (x - rpdx)

   x = p.x

   y = rpdy +  pvns * (p.x - rpdx)



generic case:
-------------


                              .'(fv)
                            .'
                          .* pm
                        .' !
                      .'    .
                    .'      !
                  .'         . b
                .'           !
               *              .
              p               !
                         90°   .    ... (pv)
                           ...-*-'''
                  ...---'''    rpd
         ...---'''   d
   *--'''
  rp

    rpdx = rpx + d * pv.x
    rpdy = rpy + d * pv.y

 equation of line b:
    pvns... normal slope to pv

    y - rpdy = pvns * (x - rpdx)

 equation of freedom vector line:
    fvs ... slope of freedom vector (=fy/fx)

    y - py = fvs * (x - px)


  on pm both equations are true for same x/y

    y - rpdy = pvns * (x - rpdx)

    y - py = fvs * (x - px)

  form to y and set equal:

    pvns * (x - rpdx) + rpdy = fvs * (x - px) + py

  expand:

    pvns * x - pvns * rpdx + rpdy = fvs * x - fvs * px + py

  switch:

    fvs * x - fvs * px + py = pvns * x - pvns * rpdx + rpdy

  solve for x:

    fvs * x - pvns * x = fvs * px - pvns * rpdx - py + rpdy



          fvs * px - pvns * rpdx + rpdy - py
    x =  -----------------------------------
                 fvs - pvns

  and:

    y = fvs * (x - px) + py



INTERPOLATE:
============

Examples of point interpolation.

The weight of the movement of the reference point gets bigger
the further the other reference point is away, thus the safest
option (that is avoiding 0/0 divisions) is to weight the
original distance of the other point by the sum of both distances.

If the sum of both distances is 0, then move the point by the
arithmetic average of the movement of both reference points.




           (+6)
    rp1o *---->*rp1
         .     .                          (+12)
         .     .                  rp2o *---------->* rp2
         .     .                       .           .
         .     .                       .           .
         .    10          20           .           .
         |.........|...................|           .
               .   .                               .
               .   . (+8)                          .
                po *------>*p                      .
               .           .                       .
               .    12     .          24           .
               |...........|.......................|
                                  36


-------



           (+10)
    rp1o *-------->*rp1
         .         .                      (-10)
         .         .              rp2 *<---------* rpo2
         .         .                   .         .
         .         .                   .         .
         .    10   .          30       .         .
         |.........|.............................|
                   .                   .
                   . (+5)              .
                po *--->* p            .
                   .    .              .
                   .    .   20         .
                   |....|..............|
                     5        15


-------


           (+10)
    rp1o *-------->*rp1
         .         .
         .         .
    rp2o *-------->*rp2


                               (+10)
                          po *-------->* p

-------


           (+10)
    rp1o *-------->*rp1
         .         .
         .         .(+30)
    rp2o *---------------------------->*rp2


                                        (+25)
                          po *----------------------->* p



vim: set ts=4 sw=4 expandtab:
*****/

// The Font object

/**
 * @typedef FontOptions
 * @type Object
 * @property {Boolean} empty - whether to create a new empty font
 * @property {string} familyName
 * @property {string} styleName
 * @property {string=} fullName
 * @property {string=} postScriptName
 * @property {string=} designer
 * @property {string=} designerURL
 * @property {string=} manufacturer
 * @property {string=} manufacturerURL
 * @property {string=} license
 * @property {string=} licenseURL
 * @property {string=} version
 * @property {string=} description
 * @property {string=} copyright
 * @property {string=} trademark
 * @property {Number} unitsPerEm
 * @property {Number} ascender
 * @property {Number} descender
 * @property {Number} createdTimestamp
 * @property {string=} weightClass
 * @property {string=} widthClass
 * @property {string=} fsSelection
 */

/**
 * A Font represents a loaded OpenType font file.
 * It contains a set of glyphs and methods to draw text on a drawing context,
 * or to get a path representing the text.
 * @exports opentype.Font
 * @class
 * @param {FontOptions}
 * @constructor
 */
function Font(options) {
    options = options || {};

    if (!options.empty) {
        // Check that we've provided the minimum set of names.
        checkArgument(options.familyName, 'When creating a new Font object, familyName is required.');
        checkArgument(options.styleName, 'When creating a new Font object, styleName is required.');
        checkArgument(options.unitsPerEm, 'When creating a new Font object, unitsPerEm is required.');
        checkArgument(options.ascender, 'When creating a new Font object, ascender is required.');
        checkArgument(options.descender, 'When creating a new Font object, descender is required.');
        checkArgument(options.descender < 0, 'Descender should be negative (e.g. -512).');

        // OS X will complain if the names are empty, so we put a single space everywhere by default.
        this.names = {
            fontFamily: {en: options.familyName || ' '},
            fontSubfamily: {en: options.styleName || ' '},
            fullName: {en: options.fullName || options.familyName + ' ' + options.styleName},
            postScriptName: {en: options.postScriptName || options.familyName + options.styleName},
            designer: {en: options.designer || ' '},
            designerURL: {en: options.designerURL || ' '},
            manufacturer: {en: options.manufacturer || ' '},
            manufacturerURL: {en: options.manufacturerURL || ' '},
            license: {en: options.license || ' '},
            licenseURL: {en: options.licenseURL || ' '},
            version: {en: options.version || 'Version 0.1'},
            description: {en: options.description || ' '},
            copyright: {en: options.copyright || ' '},
            trademark: {en: options.trademark || ' '}
        };
        this.unitsPerEm = options.unitsPerEm || 1000;
        this.ascender = options.ascender;
        this.descender = options.descender;
        this.createdTimestamp = options.createdTimestamp;
        this.tables = { os2: {
            usWeightClass: options.weightClass || this.usWeightClasses.MEDIUM,
            usWidthClass: options.widthClass || this.usWidthClasses.MEDIUM,
            fsSelection: options.fsSelection || this.fsSelectionValues.REGULAR
        } };
    }

    this.supported = true; // Deprecated: parseBuffer will throw an error if font is not supported.
    this.glyphs = new glyphset.GlyphSet(this, options.glyphs || []);
    this.encoding = new DefaultEncoding(this);
    this.substitution = new Substitution(this);
    this.tables = this.tables || {};

    Object.defineProperty(this, 'hinting', {
        get: function() {
            if (this._hinting) { return this._hinting; }
            if (this.outlinesFormat === 'truetype') {
                return (this._hinting = new Hinting(this));
            }
        }
    });
}

/**
 * Check if the font has a glyph for the given character.
 * @param  {string}
 * @return {Boolean}
 */
Font.prototype.hasChar = function(c) {
    return this.encoding.charToGlyphIndex(c) !== null;
};

/**
 * Convert the given character to a single glyph index.
 * Note that this function assumes that there is a one-to-one mapping between
 * the given character and a glyph; for complex scripts this might not be the case.
 * @param  {string}
 * @return {Number}
 */
Font.prototype.charToGlyphIndex = function(s) {
    return this.encoding.charToGlyphIndex(s);
};

/**
 * Convert the given character to a single Glyph object.
 * Note that this function assumes that there is a one-to-one mapping between
 * the given character and a glyph; for complex scripts this might not be the case.
 * @param  {string}
 * @return {opentype.Glyph}
 */
Font.prototype.charToGlyph = function(c) {
    var glyphIndex = this.charToGlyphIndex(c);
    var glyph = this.glyphs.get(glyphIndex);
    if (!glyph) {
        // .notdef
        glyph = this.glyphs.get(0);
    }

    return glyph;
};

/**
 * Convert the given text to a list of Glyph objects.
 * Note that there is no strict one-to-one mapping between characters and
 * glyphs, so the list of returned glyphs can be larger or smaller than the
 * length of the given string.
 * @param  {string}
 * @param  {GlyphRenderOptions} [options]
 * @return {opentype.Glyph[]}
 */
Font.prototype.stringToGlyphs = function(s, options) {
    var this$1 = this;

    options = options || this.defaultRenderOptions;
    // Get glyph indexes
    var indexes = [];
    for (var i = 0; i < s.length; i += 1) {
        var c = s[i];
        indexes.push(this$1.charToGlyphIndex(c));
    }
    var length = indexes.length;

    // Apply substitutions on glyph indexes
    if (options.features) {
        var script = options.script || this.substitution.getDefaultScriptName();
        var manyToOne = [];
        if (options.features.liga) { manyToOne = manyToOne.concat(this.substitution.getFeature('liga', script, options.language)); }
        if (options.features.rlig) { manyToOne = manyToOne.concat(this.substitution.getFeature('rlig', script, options.language)); }
        for (var i$1 = 0; i$1 < length; i$1 += 1) {
            for (var j = 0; j < manyToOne.length; j++) {
                var ligature = manyToOne[j];
                var components = ligature.sub;
                var compCount = components.length;
                var k = 0;
                while (k < compCount && components[k] === indexes[i$1 + k]) { k++; }
                if (k === compCount) {
                    indexes.splice(i$1, compCount, ligature.by);
                    length = length - compCount + 1;
                }
            }
        }
    }

    // convert glyph indexes to glyph objects
    var glyphs = new Array(length);
    var notdef = this.glyphs.get(0);
    for (var i$2 = 0; i$2 < length; i$2 += 1) {
        glyphs[i$2] = this$1.glyphs.get(indexes[i$2]) || notdef;
    }
    return glyphs;
};

/**
 * @param  {string}
 * @return {Number}
 */
Font.prototype.nameToGlyphIndex = function(name) {
    return this.glyphNames.nameToGlyphIndex(name);
};

/**
 * @param  {string}
 * @return {opentype.Glyph}
 */
Font.prototype.nameToGlyph = function(name) {
    var glyphIndex = this.nameToGlyphIndex(name);
    var glyph = this.glyphs.get(glyphIndex);
    if (!glyph) {
        // .notdef
        glyph = this.glyphs.get(0);
    }

    return glyph;
};

/**
 * @param  {Number}
 * @return {String}
 */
Font.prototype.glyphIndexToName = function(gid) {
    if (!this.glyphNames.glyphIndexToName) {
        return '';
    }

    return this.glyphNames.glyphIndexToName(gid);
};

/**
 * Retrieve the value of the kerning pair between the left glyph (or its index)
 * and the right glyph (or its index). If no kerning pair is found, return 0.
 * The kerning value gets added to the advance width when calculating the spacing
 * between glyphs.
 * @param  {opentype.Glyph} leftGlyph
 * @param  {opentype.Glyph} rightGlyph
 * @return {Number}
 */
Font.prototype.getKerningValue = function(leftGlyph, rightGlyph) {
    leftGlyph = leftGlyph.index || leftGlyph;
    rightGlyph = rightGlyph.index || rightGlyph;
    var gposKerning = this.getGposKerningValue;
    return gposKerning ? gposKerning(leftGlyph, rightGlyph) :
        (this.kerningPairs[leftGlyph + ',' + rightGlyph] || 0);
};

/**
 * @typedef GlyphRenderOptions
 * @type Object
 * @property {string} [script] - script used to determine which features to apply. By default, 'DFLT' or 'latn' is used.
 *                               See https://www.microsoft.com/typography/otspec/scripttags.htm
 * @property {string} [language='dflt'] - language system used to determine which features to apply.
 *                                        See https://www.microsoft.com/typography/developers/opentype/languagetags.aspx
 * @property {boolean} [kerning=true] - whether to include kerning values
 * @property {object} [features] - OpenType Layout feature tags. Used to enable or disable the features of the given script/language system.
 *                                 See https://www.microsoft.com/typography/otspec/featuretags.htm
 */
Font.prototype.defaultRenderOptions = {
    kerning: true,
    features: {
        liga: true,
        rlig: true
    }
};

/**
 * Helper function that invokes the given callback for each glyph in the given text.
 * The callback gets `(glyph, x, y, fontSize, options)`.* @param  {string} text
 * @param {string} text - The text to apply.
 * @param  {number} [x=0] - Horizontal position of the beginning of the text.
 * @param  {number} [y=0] - Vertical position of the *baseline* of the text.
 * @param  {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 * @param  {GlyphRenderOptions=} options
 * @param  {Function} callback
 */
Font.prototype.forEachGlyph = function(text, x, y, fontSize, options, callback) {
    var this$1 = this;

    x = x !== undefined ? x : 0;
    y = y !== undefined ? y : 0;
    fontSize = fontSize !== undefined ? fontSize : 72;
    options = options || this.defaultRenderOptions;
    var fontScale = 1 / this.unitsPerEm * fontSize;
    var glyphs = this.stringToGlyphs(text, options);
    for (var i = 0; i < glyphs.length; i += 1) {
        var glyph = glyphs[i];
        callback.call(this$1, glyph, x, y, fontSize, options);
        if (glyph.advanceWidth) {
            x += glyph.advanceWidth * fontScale;
        }

        if (options.kerning && i < glyphs.length - 1) {
            var kerningValue = this$1.getKerningValue(glyph, glyphs[i + 1]);
            x += kerningValue * fontScale;
        }

        if (options.letterSpacing) {
            x += options.letterSpacing * fontSize;
        } else if (options.tracking) {
            x += (options.tracking / 1000) * fontSize;
        }
    }
    return x;
};

/**
 * Create a Path object that represents the given text.
 * @param  {string} text - The text to create.
 * @param  {number} [x=0] - Horizontal position of the beginning of the text.
 * @param  {number} [y=0] - Vertical position of the *baseline* of the text.
 * @param  {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 * @param  {GlyphRenderOptions=} options
 * @return {opentype.Path}
 */
Font.prototype.getPath = function(text, x, y, fontSize, options) {
    var fullPath = new Path();
    this.forEachGlyph(text, x, y, fontSize, options, function(glyph, gX, gY, gFontSize) {
        var glyphPath = glyph.getPath(gX, gY, gFontSize, options, this);
        fullPath.extend(glyphPath);
    });
    return fullPath;
};

/**
 * Create an array of Path objects that represent the glyphs of a given text.
 * @param  {string} text - The text to create.
 * @param  {number} [x=0] - Horizontal position of the beginning of the text.
 * @param  {number} [y=0] - Vertical position of the *baseline* of the text.
 * @param  {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 * @param  {GlyphRenderOptions=} options
 * @return {opentype.Path[]}
 */
Font.prototype.getPaths = function(text, x, y, fontSize, options) {
    var glyphPaths = [];
    this.forEachGlyph(text, x, y, fontSize, options, function(glyph, gX, gY, gFontSize) {
        var glyphPath = glyph.getPath(gX, gY, gFontSize);
        glyphPaths.push(glyphPath);
    });

    return glyphPaths;
};

/**
 * Returns the advance width of a text.
 *
 * This is something different than Path.getBoundingBox() as for example a
 * suffixed whitespace increases the advanceWidth but not the bounding box
 * or an overhanging letter like a calligraphic 'f' might have a quite larger
 * bounding box than its advance width.
 *
 * This corresponds to canvas2dContext.measureText(text).width
 *
 * @param  {string} text - The text to create.
 * @param  {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 * @param  {GlyphRenderOptions=} options
 * @return advance width
 */
Font.prototype.getAdvanceWidth = function(text, fontSize, options) {
    return this.forEachGlyph(text, 0, 0, fontSize, options, function() {});
};

/**
 * Draw the text on the given drawing context.
 * @param  {CanvasRenderingContext2D} ctx - A 2D drawing context, like Canvas.
 * @param  {string} text - The text to create.
 * @param  {number} [x=0] - Horizontal position of the beginning of the text.
 * @param  {number} [y=0] - Vertical position of the *baseline* of the text.
 * @param  {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 * @param  {GlyphRenderOptions=} options
 */
Font.prototype.draw = function(ctx, text, x, y, fontSize, options) {
    this.getPath(text, x, y, fontSize, options).draw(ctx);
};

/**
 * Draw the points of all glyphs in the text.
 * On-curve points will be drawn in blue, off-curve points will be drawn in red.
 * @param {CanvasRenderingContext2D} ctx - A 2D drawing context, like Canvas.
 * @param {string} text - The text to create.
 * @param {number} [x=0] - Horizontal position of the beginning of the text.
 * @param {number} [y=0] - Vertical position of the *baseline* of the text.
 * @param {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 * @param {GlyphRenderOptions=} options
 */
Font.prototype.drawPoints = function(ctx, text, x, y, fontSize, options) {
    this.forEachGlyph(text, x, y, fontSize, options, function(glyph, gX, gY, gFontSize) {
        glyph.drawPoints(ctx, gX, gY, gFontSize);
    });
};

/**
 * Draw lines indicating important font measurements for all glyphs in the text.
 * Black lines indicate the origin of the coordinate system (point 0,0).
 * Blue lines indicate the glyph bounding box.
 * Green line indicates the advance width of the glyph.
 * @param {CanvasRenderingContext2D} ctx - A 2D drawing context, like Canvas.
 * @param {string} text - The text to create.
 * @param {number} [x=0] - Horizontal position of the beginning of the text.
 * @param {number} [y=0] - Vertical position of the *baseline* of the text.
 * @param {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 * @param {GlyphRenderOptions=} options
 */
Font.prototype.drawMetrics = function(ctx, text, x, y, fontSize, options) {
    this.forEachGlyph(text, x, y, fontSize, options, function(glyph, gX, gY, gFontSize) {
        glyph.drawMetrics(ctx, gX, gY, gFontSize);
    });
};

/**
 * @param  {string}
 * @return {string}
 */
Font.prototype.getEnglishName = function(name) {
    var translations = this.names[name];
    if (translations) {
        return translations.en;
    }
};

/**
 * Validate
 */
Font.prototype.validate = function() {
    var warnings = [];
    var _this = this;

    function assert(predicate, message) {
        if (!predicate) {
            warnings.push(message);
        }
    }

    function assertNamePresent(name) {
        var englishName = _this.getEnglishName(name);
        assert(englishName && englishName.trim().length > 0,
               'No English ' + name + ' specified.');
    }

    // Identification information
    assertNamePresent('fontFamily');
    assertNamePresent('weightName');
    assertNamePresent('manufacturer');
    assertNamePresent('copyright');
    assertNamePresent('version');

    // Dimension information
    assert(this.unitsPerEm > 0, 'No unitsPerEm specified.');
};

/**
 * Convert the font object to a SFNT data structure.
 * This structure contains all the necessary tables and metadata to create a binary OTF file.
 * @return {opentype.Table}
 */
Font.prototype.toTables = function() {
    return sfnt.fontToTable(this);
};
/**
 * @deprecated Font.toBuffer is deprecated. Use Font.toArrayBuffer instead.
 */
Font.prototype.toBuffer = function() {
    console.warn('Font.toBuffer is deprecated. Use Font.toArrayBuffer instead.');
    return this.toArrayBuffer();
};
/**
 * Converts a `opentype.Font` into an `ArrayBuffer`
 * @return {ArrayBuffer}
 */
Font.prototype.toArrayBuffer = function() {
    var sfntTable = this.toTables();
    var bytes = sfntTable.encode();
    var buffer = new ArrayBuffer(bytes.length);
    var intArray = new Uint8Array(buffer);
    for (var i = 0; i < bytes.length; i++) {
        intArray[i] = bytes[i];
    }

    return buffer;
};

/**
 * Initiate a download of the OpenType font.
 */
Font.prototype.download = function(fileName) {
    var familyName = this.getEnglishName('fontFamily');
    var styleName = this.getEnglishName('fontSubfamily');
    fileName = fileName || familyName.replace(/\s/g, '') + '-' + styleName + '.otf';
    var arrayBuffer = this.toArrayBuffer();

    if (isBrowser()) {
        window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
        window.requestFileSystem(window.TEMPORARY, arrayBuffer.byteLength, function(fs) {
            fs.root.getFile(fileName, {create: true}, function(fileEntry) {
                fileEntry.createWriter(function(writer) {
                    var dataView = new DataView(arrayBuffer);
                    var blob = new Blob([dataView], {type: 'font/opentype'});
                    writer.write(blob);

                    writer.addEventListener('writeend', function() {
                        // Navigating to the file will download it.
                        location.href = fileEntry.toURL();
                    }, false);
                });
            });
        },
        function(err) {
            throw new Error(err.name + ': ' + err.message);
        });
    } else {
        var fs = require('fs');
        var buffer = arrayBufferToNodeBuffer(arrayBuffer);
        fs.writeFileSync(fileName, buffer);
    }
};
/**
 * @private
 */
Font.prototype.fsSelectionValues = {
    ITALIC:              0x001, //1
    UNDERSCORE:          0x002, //2
    NEGATIVE:            0x004, //4
    OUTLINED:            0x008, //8
    STRIKEOUT:           0x010, //16
    BOLD:                0x020, //32
    REGULAR:             0x040, //64
    USER_TYPO_METRICS:   0x080, //128
    WWS:                 0x100, //256
    OBLIQUE:             0x200  //512
};

/**
 * @private
 */
Font.prototype.usWidthClasses = {
    ULTRA_CONDENSED: 1,
    EXTRA_CONDENSED: 2,
    CONDENSED: 3,
    SEMI_CONDENSED: 4,
    MEDIUM: 5,
    SEMI_EXPANDED: 6,
    EXPANDED: 7,
    EXTRA_EXPANDED: 8,
    ULTRA_EXPANDED: 9
};

/**
 * @private
 */
Font.prototype.usWeightClasses = {
    THIN: 100,
    EXTRA_LIGHT: 200,
    LIGHT: 300,
    NORMAL: 400,
    MEDIUM: 500,
    SEMI_BOLD: 600,
    BOLD: 700,
    EXTRA_BOLD: 800,
    BLACK:    900
};

// The `fvar` table stores font variation axes and instances.
// https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6fvar.html

function addName(name, names) {
    var nameString = JSON.stringify(name);
    var nameID = 256;
    for (var nameKey in names) {
        var n = parseInt(nameKey);
        if (!n || n < 256) {
            continue;
        }

        if (JSON.stringify(names[nameKey]) === nameString) {
            return n;
        }

        if (nameID <= n) {
            nameID = n + 1;
        }
    }

    names[nameID] = name;
    return nameID;
}

function makeFvarAxis(n, axis, names) {
    var nameID = addName(axis.name, names);
    return [
        {name: 'tag_' + n, type: 'TAG', value: axis.tag},
        {name: 'minValue_' + n, type: 'FIXED', value: axis.minValue << 16},
        {name: 'defaultValue_' + n, type: 'FIXED', value: axis.defaultValue << 16},
        {name: 'maxValue_' + n, type: 'FIXED', value: axis.maxValue << 16},
        {name: 'flags_' + n, type: 'USHORT', value: 0},
        {name: 'nameID_' + n, type: 'USHORT', value: nameID}
    ];
}

function parseFvarAxis(data, start, names) {
    var axis = {};
    var p = new parse.Parser(data, start);
    axis.tag = p.parseTag();
    axis.minValue = p.parseFixed();
    axis.defaultValue = p.parseFixed();
    axis.maxValue = p.parseFixed();
    p.skip('uShort', 1);  // reserved for flags; no values defined
    axis.name = names[p.parseUShort()] || {};
    return axis;
}

function makeFvarInstance(n, inst, axes, names) {
    var nameID = addName(inst.name, names);
    var fields = [
        {name: 'nameID_' + n, type: 'USHORT', value: nameID},
        {name: 'flags_' + n, type: 'USHORT', value: 0}
    ];

    for (var i = 0; i < axes.length; ++i) {
        var axisTag = axes[i].tag;
        fields.push({
            name: 'axis_' + n + ' ' + axisTag,
            type: 'FIXED',
            value: inst.coordinates[axisTag] << 16
        });
    }

    return fields;
}

function parseFvarInstance(data, start, axes, names) {
    var inst = {};
    var p = new parse.Parser(data, start);
    inst.name = names[p.parseUShort()] || {};
    p.skip('uShort', 1);  // reserved for flags; no values defined

    inst.coordinates = {};
    for (var i = 0; i < axes.length; ++i) {
        inst.coordinates[axes[i].tag] = p.parseFixed();
    }

    return inst;
}

function makeFvarTable(fvar, names) {
    var result = new table.Table('fvar', [
        {name: 'version', type: 'ULONG', value: 0x10000},
        {name: 'offsetToData', type: 'USHORT', value: 0},
        {name: 'countSizePairs', type: 'USHORT', value: 2},
        {name: 'axisCount', type: 'USHORT', value: fvar.axes.length},
        {name: 'axisSize', type: 'USHORT', value: 20},
        {name: 'instanceCount', type: 'USHORT', value: fvar.instances.length},
        {name: 'instanceSize', type: 'USHORT', value: 4 + fvar.axes.length * 4}
    ]);
    result.offsetToData = result.sizeOf();

    for (var i = 0; i < fvar.axes.length; i++) {
        result.fields = result.fields.concat(makeFvarAxis(i, fvar.axes[i], names));
    }

    for (var j = 0; j < fvar.instances.length; j++) {
        result.fields = result.fields.concat(makeFvarInstance(j, fvar.instances[j], fvar.axes, names));
    }

    return result;
}

function parseFvarTable(data, start, names) {
    var p = new parse.Parser(data, start);
    var tableVersion = p.parseULong();
    check.argument(tableVersion === 0x00010000, 'Unsupported fvar table version.');
    var offsetToData = p.parseOffset16();
    // Skip countSizePairs.
    p.skip('uShort', 1);
    var axisCount = p.parseUShort();
    var axisSize = p.parseUShort();
    var instanceCount = p.parseUShort();
    var instanceSize = p.parseUShort();

    var axes = [];
    for (var i = 0; i < axisCount; i++) {
        axes.push(parseFvarAxis(data, start + offsetToData + i * axisSize, names));
    }

    var instances = [];
    var instanceStart = start + offsetToData + axisCount * axisSize;
    for (var j = 0; j < instanceCount; j++) {
        instances.push(parseFvarInstance(data, instanceStart + j * instanceSize, axes, names));
    }

    return {axes: axes, instances: instances};
}

var fvar = { make: makeFvarTable, parse: parseFvarTable };

// The `GPOS` table contains kerning pairs, among other things.
// https://www.microsoft.com/typography/OTSPEC/gpos.htm

// Parse ScriptList and FeatureList tables of GPOS, GSUB, GDEF, BASE, JSTF tables.
// These lists are unused by now, this function is just the basis for a real parsing.
function parseTaggedListTable(data, start) {
    var p = new parse.Parser(data, start);
    var n = p.parseUShort();
    var list = [];
    for (var i = 0; i < n; i++) {
        list[p.parseTag()] = { offset: p.parseUShort() };
    }

    return list;
}

// Parse a coverage table in a GSUB, GPOS or GDEF table.
// Format 1 is a simple list of glyph ids,
// Format 2 is a list of ranges. It is expanded in a list of glyphs, maybe not the best idea.
function parseCoverageTable(data, start) {
    var p = new parse.Parser(data, start);
    var format = p.parseUShort();
    var count = p.parseUShort();
    if (format === 1) {
        return p.parseUShortList(count);
    } else if (format === 2) {
        var coverage = [];
        for (; count--;) {
            var begin = p.parseUShort();
            var end = p.parseUShort();
            var index = p.parseUShort();
            for (var i = begin; i <= end; i++) {
                coverage[index++] = i;
            }
        }

        return coverage;
    }
}

// Parse a Class Definition Table in a GSUB, GPOS or GDEF table.
// Returns a function that gets a class value from a glyph ID.
function parseClassDefTable(data, start) {
    var p = new parse.Parser(data, start);
    var format = p.parseUShort();
    if (format === 1) {
        // Format 1 specifies a range of consecutive glyph indices, one class per glyph ID.
        var startGlyph = p.parseUShort();
        var glyphCount = p.parseUShort();
        var classes = p.parseUShortList(glyphCount);
        return function(glyphID) {
            return classes[glyphID - startGlyph] || 0;
        };
    } else if (format === 2) {
        // Format 2 defines multiple groups of glyph indices that belong to the same class.
        var rangeCount = p.parseUShort();
        var startGlyphs = [];
        var endGlyphs = [];
        var classValues = [];
        for (var i = 0; i < rangeCount; i++) {
            startGlyphs[i] = p.parseUShort();
            endGlyphs[i] = p.parseUShort();
            classValues[i] = p.parseUShort();
        }

        return function(glyphID) {
            var l = 0;
            var r = startGlyphs.length - 1;
            while (l < r) {
                var c = (l + r + 1) >> 1;
                if (glyphID < startGlyphs[c]) {
                    r = c - 1;
                } else {
                    l = c;
                }
            }

            if (startGlyphs[l] <= glyphID && glyphID <= endGlyphs[l]) {
                return classValues[l] || 0;
            }

            return 0;
        };
    }
}

// Parse a pair adjustment positioning subtable, format 1 or format 2
// The subtable is returned in the form of a lookup function.
function parsePairPosSubTable(data, start) {
    var p = new parse.Parser(data, start);
    // This part is common to format 1 and format 2 subtables
    var format = p.parseUShort();
    var coverageOffset = p.parseUShort();
    var coverage = parseCoverageTable(data, start + coverageOffset);
    // valueFormat 4: XAdvance only, 1: XPlacement only, 0: no ValueRecord for second glyph
    // Only valueFormat1=4 and valueFormat2=0 is supported.
    var valueFormat1 = p.parseUShort();
    var valueFormat2 = p.parseUShort();
    var value1;
    var value2;
    if (valueFormat1 !== 4 || valueFormat2 !== 0) { return; }
    var sharedPairSets = {};
    if (format === 1) {
        // Pair Positioning Adjustment: Format 1
        var pairSetCount = p.parseUShort();
        var pairSet = [];
        // Array of offsets to PairSet tables-from beginning of PairPos subtable-ordered by Coverage Index
        var pairSetOffsets = p.parseOffset16List(pairSetCount);
        for (var firstGlyph = 0; firstGlyph < pairSetCount; firstGlyph++) {
            var pairSetOffset = pairSetOffsets[firstGlyph];
            var sharedPairSet = sharedPairSets[pairSetOffset];
            if (!sharedPairSet) {
                // Parse a pairset table in a pair adjustment subtable format 1
                sharedPairSet = {};
                p.relativeOffset = pairSetOffset;
                var pairValueCount = p.parseUShort();
                for (; pairValueCount--;) {
                    var secondGlyph = p.parseUShort();
                    if (valueFormat1) { value1 = p.parseShort(); }
                    if (valueFormat2) { value2 = p.parseShort(); }
                    // We only support valueFormat1 = 4 and valueFormat2 = 0,
                    // so value1 is the XAdvance and value2 is empty.
                    sharedPairSet[secondGlyph] = value1;
                }
            }

            pairSet[coverage[firstGlyph]] = sharedPairSet;
        }

        return function(leftGlyph, rightGlyph) {
            var pairs = pairSet[leftGlyph];
            if (pairs) { return pairs[rightGlyph]; }
        };
    } else if (format === 2) {
        // Pair Positioning Adjustment: Format 2
        var classDef1Offset = p.parseUShort();
        var classDef2Offset = p.parseUShort();
        var class1Count = p.parseUShort();
        var class2Count = p.parseUShort();
        var getClass1 = parseClassDefTable(data, start + classDef1Offset);
        var getClass2 = parseClassDefTable(data, start + classDef2Offset);

        // Parse kerning values by class pair.
        var kerningMatrix = [];
        for (var i = 0; i < class1Count; i++) {
            var kerningRow = kerningMatrix[i] = [];
            for (var j = 0; j < class2Count; j++) {
                if (valueFormat1) { value1 = p.parseShort(); }
                if (valueFormat2) { value2 = p.parseShort(); }
                // We only support valueFormat1 = 4 and valueFormat2 = 0,
                // so value1 is the XAdvance and value2 is empty.
                kerningRow[j] = value1;
            }
        }

        // Convert coverage list to a hash
        var covered = {};
        for (var i$1 = 0; i$1 < coverage.length; i$1++) {
            covered[coverage[i$1]] = 1;
        }

        // Get the kerning value for a specific glyph pair.
        return function(leftGlyph, rightGlyph) {
            if (!covered[leftGlyph]) { return; }
            var class1 = getClass1(leftGlyph);
            var class2 = getClass2(rightGlyph);
            var kerningRow = kerningMatrix[class1];

            if (kerningRow) {
                return kerningRow[class2];
            }
        };
    }
}

// Parse a LookupTable (present in of GPOS, GSUB, GDEF, BASE, JSTF tables).
function parseLookupTable(data, start) {
    var p = new parse.Parser(data, start);
    var lookupType = p.parseUShort();
    var lookupFlag = p.parseUShort();
    var useMarkFilteringSet = lookupFlag & 0x10;
    var subTableCount = p.parseUShort();
    var subTableOffsets = p.parseOffset16List(subTableCount);
    var table = {
        lookupType: lookupType,
        lookupFlag: lookupFlag,
        markFilteringSet: useMarkFilteringSet ? p.parseUShort() : -1
    };
    // LookupType 2, Pair adjustment
    if (lookupType === 2) {
        var subtables = [];
        for (var i = 0; i < subTableCount; i++) {
            var pairPosSubTable = parsePairPosSubTable(data, start + subTableOffsets[i]);
            if (pairPosSubTable) { subtables.push(pairPosSubTable); }
        }
        // Return a function which finds the kerning values in the subtables.
        table.getKerningValue = function(leftGlyph, rightGlyph) {
            for (var i = subtables.length; i--;) {
                var value = subtables[i](leftGlyph, rightGlyph);
                if (value !== undefined) { return value; }
            }

            return 0;
        };
    }

    return table;
}

// Parse the `GPOS` table which contains, among other things, kerning pairs.
// https://www.microsoft.com/typography/OTSPEC/gpos.htm
function parseGposTable(data, start, font) {
    var p = new parse.Parser(data, start);
    var tableVersion = p.parseFixed();
    check.argument(tableVersion === 1, 'Unsupported GPOS table version.');

    // ScriptList and FeatureList - ignored for now
    parseTaggedListTable(data, start + p.parseUShort());
    // 'kern' is the feature we are looking for.
    parseTaggedListTable(data, start + p.parseUShort());

    // LookupList
    var lookupListOffset = p.parseUShort();
    p.relativeOffset = lookupListOffset;
    var lookupCount = p.parseUShort();
    var lookupTableOffsets = p.parseOffset16List(lookupCount);
    var lookupListAbsoluteOffset = start + lookupListOffset;
    for (var i = 0; i < lookupCount; i++) {
        var table = parseLookupTable(data, lookupListAbsoluteOffset + lookupTableOffsets[i]);
        if (table.lookupType === 2 && !font.getGposKerningValue) { font.getGposKerningValue = table.getKerningValue; }
    }
}

var gpos = { parse: parseGposTable };

// The `kern` table contains kerning pairs.
// Note that some fonts use the GPOS OpenType layout table to specify kerning.
// https://www.microsoft.com/typography/OTSPEC/kern.htm

function parseWindowsKernTable(p) {
    var pairs = {};
    // Skip nTables.
    p.skip('uShort');
    var subtableVersion = p.parseUShort();
    check.argument(subtableVersion === 0, 'Unsupported kern sub-table version.');
    // Skip subtableLength, subtableCoverage
    p.skip('uShort', 2);
    var nPairs = p.parseUShort();
    // Skip searchRange, entrySelector, rangeShift.
    p.skip('uShort', 3);
    for (var i = 0; i < nPairs; i += 1) {
        var leftIndex = p.parseUShort();
        var rightIndex = p.parseUShort();
        var value = p.parseShort();
        pairs[leftIndex + ',' + rightIndex] = value;
    }
    return pairs;
}

function parseMacKernTable(p) {
    var pairs = {};
    // The Mac kern table stores the version as a fixed (32 bits) but we only loaded the first 16 bits.
    // Skip the rest.
    p.skip('uShort');
    var nTables = p.parseULong();
    //check.argument(nTables === 1, 'Only 1 subtable is supported (got ' + nTables + ').');
    if (nTables > 1) {
        console.warn('Only the first kern subtable is supported.');
    }
    p.skip('uLong');
    var coverage = p.parseUShort();
    var subtableVersion = coverage & 0xFF;
    p.skip('uShort');
    if (subtableVersion === 0) {
        var nPairs = p.parseUShort();
        // Skip searchRange, entrySelector, rangeShift.
        p.skip('uShort', 3);
        for (var i = 0; i < nPairs; i += 1) {
            var leftIndex = p.parseUShort();
            var rightIndex = p.parseUShort();
            var value = p.parseShort();
            pairs[leftIndex + ',' + rightIndex] = value;
        }
    }
    return pairs;
}

// Parse the `kern` table which contains kerning pairs.
function parseKernTable(data, start) {
    var p = new parse.Parser(data, start);
    var tableVersion = p.parseUShort();
    if (tableVersion === 0) {
        return parseWindowsKernTable(p);
    } else if (tableVersion === 1) {
        return parseMacKernTable(p);
    } else {
        throw new Error('Unsupported kern table version (' + tableVersion + ').');
    }
}

var kern = { parse: parseKernTable };

// The `loca` table stores the offsets to the locations of the glyphs in the font.
// https://www.microsoft.com/typography/OTSPEC/loca.htm

// Parse the `loca` table. This table stores the offsets to the locations of the glyphs in the font,
// relative to the beginning of the glyphData table.
// The number of glyphs stored in the `loca` table is specified in the `maxp` table (under numGlyphs)
// The loca table has two versions: a short version where offsets are stored as uShorts, and a long
// version where offsets are stored as uLongs. The `head` table specifies which version to use
// (under indexToLocFormat).
function parseLocaTable(data, start, numGlyphs, shortVersion) {
    var p = new parse.Parser(data, start);
    var parseFn = shortVersion ? p.parseUShort : p.parseULong;
    // There is an extra entry after the last index element to compute the length of the last glyph.
    // That's why we use numGlyphs + 1.
    var glyphOffsets = [];
    for (var i = 0; i < numGlyphs + 1; i += 1) {
        var glyphOffset = parseFn.call(p);
        if (shortVersion) {
            // The short table version stores the actual offset divided by 2.
            glyphOffset *= 2;
        }

        glyphOffsets.push(glyphOffset);
    }

    return glyphOffsets;
}

var loca = { parse: parseLocaTable };

// opentype.js
// https://github.com/nodebox/opentype.js
// (c) 2015 Frederik De Bleser
// opentype.js may be freely distributed under the MIT license.

/* global DataView, Uint8Array, XMLHttpRequest  */

/**
 * The opentype library.
 * @namespace opentype
 */

// File loaders /////////////////////////////////////////////////////////
/**
 * Loads a font from a file. The callback throws an error message as the first parameter if it fails
 * and the font as an ArrayBuffer in the second parameter if it succeeds.
 * @param  {string} path - The path of the file
 * @param  {Function} callback - The function to call when the font load completes
 */
function loadFromFile(path, callback) {
    var fs = require('fs');
    fs.readFile(path, function(err, buffer) {
        if (err) {
            return callback(err.message);
        }

        callback(null, nodeBufferToArrayBuffer(buffer));
    });
}
/**
 * Loads a font from a URL. The callback throws an error message as the first parameter if it fails
 * and the font as an ArrayBuffer in the second parameter if it succeeds.
 * @param  {string} url - The URL of the font file.
 * @param  {Function} callback - The function to call when the font load completes
 */
function loadFromUrl(url, callback) {
    var request = new XMLHttpRequest();
    request.open('get', url, true);
    request.responseType = 'arraybuffer';
    request.onload = function() {
        if (request.status !== 200) {
            return callback('Font could not be loaded: ' + request.statusText);
        }

        return callback(null, request.response);
    };

    request.onerror = function () {
        callback('Font could not be loaded');
    };

    request.send();
}

// Table Directory Entries //////////////////////////////////////////////
/**
 * Parses OpenType table entries.
 * @param  {DataView}
 * @param  {Number}
 * @return {Object[]}
 */
function parseOpenTypeTableEntries(data, numTables) {
    var tableEntries = [];
    var p = 12;
    for (var i = 0; i < numTables; i += 1) {
        var tag = parse.getTag(data, p);
        var checksum = parse.getULong(data, p + 4);
        var offset = parse.getULong(data, p + 8);
        var length = parse.getULong(data, p + 12);
        tableEntries.push({tag: tag, checksum: checksum, offset: offset, length: length, compression: false});
        p += 16;
    }

    return tableEntries;
}

/**
 * Parses WOFF table entries.
 * @param  {DataView}
 * @param  {Number}
 * @return {Object[]}
 */
function parseWOFFTableEntries(data, numTables) {
    var tableEntries = [];
    var p = 44; // offset to the first table directory entry.
    for (var i = 0; i < numTables; i += 1) {
        var tag = parse.getTag(data, p);
        var offset = parse.getULong(data, p + 4);
        var compLength = parse.getULong(data, p + 8);
        var origLength = parse.getULong(data, p + 12);
        var compression = (void 0);
        if (compLength < origLength) {
            compression = 'WOFF';
        } else {
            compression = false;
        }

        tableEntries.push({tag: tag, offset: offset, compression: compression,
            compressedLength: compLength, length: origLength});
        p += 20;
    }

    return tableEntries;
}

/**
 * @typedef TableData
 * @type Object
 * @property {DataView} data - The DataView
 * @property {number} offset - The data offset.
 */

/**
 * @param  {DataView}
 * @param  {Object}
 * @return {TableData}
 */
function uncompressTable(data, tableEntry) {
    if (tableEntry.compression === 'WOFF') {
        var inBuffer = new Uint8Array(data.buffer, tableEntry.offset + 2, tableEntry.compressedLength - 2);
        var outBuffer = new Uint8Array(tableEntry.length);
        index(inBuffer, outBuffer);
        if (outBuffer.byteLength !== tableEntry.length) {
            throw new Error('Decompression error: ' + tableEntry.tag + ' decompressed length doesn\'t match recorded length');
        }

        var view = new DataView(outBuffer.buffer, 0);
        return {data: view, offset: 0};
    } else {
        return {data: data, offset: tableEntry.offset};
    }
}

// Public API ///////////////////////////////////////////////////////////

/**
 * Parse the OpenType file data (as an ArrayBuffer) and return a Font object.
 * Throws an error if the font could not be parsed.
 * @param  {ArrayBuffer}
 * @return {opentype.Font}
 */
function parseBuffer(buffer) {
    var indexToLocFormat;
    var ltagTable;

    // Since the constructor can also be called to create new fonts from scratch, we indicate this
    // should be an empty font that we'll fill with our own data.
    var font = new Font({empty: true});

    // OpenType fonts use big endian byte ordering.
    // We can't rely on typed array view types, because they operate with the endianness of the host computer.
    // Instead we use DataViews where we can specify endianness.
    var data = new DataView(buffer, 0);
    var numTables;
    var tableEntries = [];
    var signature = parse.getTag(data, 0);
    if (signature === String.fromCharCode(0, 1, 0, 0) || signature === 'true' || signature === 'typ1') {
        font.outlinesFormat = 'truetype';
        numTables = parse.getUShort(data, 4);
        tableEntries = parseOpenTypeTableEntries(data, numTables);
    } else if (signature === 'OTTO') {
        font.outlinesFormat = 'cff';
        numTables = parse.getUShort(data, 4);
        tableEntries = parseOpenTypeTableEntries(data, numTables);
    } else if (signature === 'wOFF') {
        var flavor = parse.getTag(data, 4);
        if (flavor === String.fromCharCode(0, 1, 0, 0)) {
            font.outlinesFormat = 'truetype';
        } else if (flavor === 'OTTO') {
            font.outlinesFormat = 'cff';
        } else {
            throw new Error('Unsupported OpenType flavor ' + signature);
        }

        numTables = parse.getUShort(data, 12);
        tableEntries = parseWOFFTableEntries(data, numTables);
    } else {
        throw new Error('Unsupported OpenType signature ' + signature);
    }

    var cffTableEntry;
    var fvarTableEntry;
    var glyfTableEntry;
    var gposTableEntry;
    var gsubTableEntry;
    var hmtxTableEntry;
    var kernTableEntry;
    var locaTableEntry;
    var nameTableEntry;
    var metaTableEntry;
    var p;

    for (var i = 0; i < numTables; i += 1) {
        var tableEntry = tableEntries[i];
        var table = (void 0);
        switch (tableEntry.tag) {
            case 'cmap':
                table = uncompressTable(data, tableEntry);
                font.tables.cmap = cmap.parse(table.data, table.offset);
                font.encoding = new CmapEncoding(font.tables.cmap);
                break;
            case 'cvt ' :
                table = uncompressTable(data, tableEntry);
                p = new parse.Parser(table.data, table.offset);
                font.tables.cvt = p.parseShortList(tableEntry.length / 2);
                break;
            case 'fvar':
                fvarTableEntry = tableEntry;
                break;
            case 'fpgm' :
                table = uncompressTable(data, tableEntry);
                p = new parse.Parser(table.data, table.offset);
                font.tables.fpgm = p.parseByteList(tableEntry.length);
                break;
            case 'head':
                table = uncompressTable(data, tableEntry);
                font.tables.head = head.parse(table.data, table.offset);
                font.unitsPerEm = font.tables.head.unitsPerEm;
                indexToLocFormat = font.tables.head.indexToLocFormat;
                break;
            case 'hhea':
                table = uncompressTable(data, tableEntry);
                font.tables.hhea = hhea.parse(table.data, table.offset);
                font.ascender = font.tables.hhea.ascender;
                font.descender = font.tables.hhea.descender;
                font.numberOfHMetrics = font.tables.hhea.numberOfHMetrics;
                break;
            case 'hmtx':
                hmtxTableEntry = tableEntry;
                break;
            case 'ltag':
                table = uncompressTable(data, tableEntry);
                ltagTable = ltag.parse(table.data, table.offset);
                break;
            case 'maxp':
                table = uncompressTable(data, tableEntry);
                font.tables.maxp = maxp.parse(table.data, table.offset);
                font.numGlyphs = font.tables.maxp.numGlyphs;
                break;
            case 'name':
                nameTableEntry = tableEntry;
                break;
            case 'OS/2':
                table = uncompressTable(data, tableEntry);
                font.tables.os2 = os2.parse(table.data, table.offset);
                break;
            case 'post':
                table = uncompressTable(data, tableEntry);
                font.tables.post = post.parse(table.data, table.offset);
                font.glyphNames = new GlyphNames(font.tables.post);
                break;
            case 'prep' :
                table = uncompressTable(data, tableEntry);
                p = new parse.Parser(table.data, table.offset);
                font.tables.prep = p.parseByteList(tableEntry.length);
                break;
            case 'glyf':
                glyfTableEntry = tableEntry;
                break;
            case 'loca':
                locaTableEntry = tableEntry;
                break;
            case 'CFF ':
                cffTableEntry = tableEntry;
                break;
            case 'kern':
                kernTableEntry = tableEntry;
                break;
            case 'GPOS':
                gposTableEntry = tableEntry;
                break;
            case 'GSUB':
                gsubTableEntry = tableEntry;
                break;
            case 'meta':
                metaTableEntry = tableEntry;
                break;
        }
    }

    var nameTable = uncompressTable(data, nameTableEntry);
    font.tables.name = _name.parse(nameTable.data, nameTable.offset, ltagTable);
    font.names = font.tables.name;

    if (glyfTableEntry && locaTableEntry) {
        var shortVersion = indexToLocFormat === 0;
        var locaTable = uncompressTable(data, locaTableEntry);
        var locaOffsets = loca.parse(locaTable.data, locaTable.offset, font.numGlyphs, shortVersion);
        var glyfTable = uncompressTable(data, glyfTableEntry);
        font.glyphs = glyf.parse(glyfTable.data, glyfTable.offset, locaOffsets, font);
    } else if (cffTableEntry) {
        var cffTable = uncompressTable(data, cffTableEntry);
        cff.parse(cffTable.data, cffTable.offset, font);
    } else {
        throw new Error('Font doesn\'t contain TrueType or CFF outlines.');
    }

    var hmtxTable = uncompressTable(data, hmtxTableEntry);
    hmtx.parse(hmtxTable.data, hmtxTable.offset, font.numberOfHMetrics, font.numGlyphs, font.glyphs);
    addGlyphNames(font);

    if (kernTableEntry) {
        var kernTable = uncompressTable(data, kernTableEntry);
        font.kerningPairs = kern.parse(kernTable.data, kernTable.offset);
    } else {
        font.kerningPairs = {};
    }

    if (gposTableEntry) {
        var gposTable = uncompressTable(data, gposTableEntry);
        gpos.parse(gposTable.data, gposTable.offset, font);
    }

    if (gsubTableEntry) {
        var gsubTable = uncompressTable(data, gsubTableEntry);
        font.tables.gsub = gsub.parse(gsubTable.data, gsubTable.offset);
    }

    if (fvarTableEntry) {
        var fvarTable = uncompressTable(data, fvarTableEntry);
        font.tables.fvar = fvar.parse(fvarTable.data, fvarTable.offset, font.names);
    }

    if (metaTableEntry) {
        var metaTable = uncompressTable(data, metaTableEntry);
        font.tables.meta = meta.parse(metaTable.data, metaTable.offset);
        font.metas = font.tables.meta;
    }

    return font;
}

/**
 * Asynchronously load the font from a URL or a filesystem. When done, call the callback
 * with two arguments `(err, font)`. The `err` will be null on success,
 * the `font` is a Font object.
 * We use the node.js callback convention so that
 * opentype.js can integrate with frameworks like async.js.
 * @alias opentype.load
 * @param  {string} url - The URL of the font to load.
 * @param  {Function} callback - The callback.
 */
function load(url, callback) {
    var isNode$$1 = typeof window === 'undefined';
    var loadFn = isNode$$1 ? loadFromFile : loadFromUrl;
    loadFn(url, function(err, arrayBuffer) {
        if (err) {
            return callback(err);
        }
        var font;
        try {
            font = parseBuffer(arrayBuffer);
        } catch (e) {
            return callback(e, null);
        }
        return callback(null, font);
    });
}

/**
 * Synchronously load the font from a URL or file.
 * When done, returns the font object or throws an error.
 * @alias opentype.loadSync
 * @param  {string} url - The URL of the font to load.
 * @return {opentype.Font}
 */
function loadSync(url) {
    var fs = require('fs');
    var buffer = fs.readFileSync(url);
    return parseBuffer(nodeBufferToArrayBuffer(buffer));
}

exports.Font = Font;
exports.Glyph = Glyph;
exports.Path = Path;
exports.BoundingBox = BoundingBox;
exports._parse = parse;
exports.parse = parseBuffer;
exports.load = load;
exports.loadSync = loadSync;

Object.defineProperty(exports, '__esModule', { value: true });

})));


}).call(this,require("buffer").Buffer)
},{"buffer":4,"fs":3}],24:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalPitch = require('tonal-pitch');
var tonalTranspose = require('tonal-transpose');
var tonalDistance = require('tonal-distance');

/**
 * This module implements utility functions related to array manipulation, like:
 * `map`, `filter`, `shuffle`, `sort`, `rotate`, `select`
 *
 * All the functions are _functional friendly_ with target object as last
 * parameter and currified. The sorting functions understand about pitch
 * heights and interval sizes.
 *
 * One key feature of tonal is that you can represent lists with arrays or
 * with space separated string of elements. This module implements that
 * functionallity.
 *
 * @module array
 */
function split (sep) {
  return function (o) {
    return o === undefined ? []
      : Array.isArray(o) ? o
      : typeof o === 'string' ? o.trim().split(sep) 
      : [o]
  }
}

// utility
var isArr = Array.isArray;
function hasVal (e) {
  return e || e === 0
}

/**
 * Convert anything to array. Speifically, split string separated by spaces,
 * commas or bars. If you give it an actual array, it returns it without
 * modification.
 *
 * This function __always__ returns an array (null or undefined values are converted
 * to empty arrays)
 *
 * Thanks to this function, the rest of the functions of this module accepts
 * strings as an array parameter.
 *
 * @function
 * @param {*} source - the thing to get an array from
 * @return {Array} the object as an array
 *
 * @example
 * import { asArr } from 'tonal-arrays'
 * asArr('C D E F G') // => ['C', 'D', 'E', 'F', 'G']
 * asArr('A, B, c') // => ['A', 'B', 'c']
 * asArr('1 | 2 | x') // => ['1', '2', 'x']
 */
var asArr = split(/\s*\|\s*|\s*,\s*|\s+/);

/**
 * Return a new array with the elements mapped by a function.
 * Basically the same as the JavaScript standard `array.map` but with
 * two enhacements:
 *
 * - Arrays can be expressed as strings (see [asArr])
 * - This function can be partially applied. This is useful to create _mapped_
 * versions of single element functions. For an excellent introduction of
 * the adventages [read this](https://drboolean.gitbooks.io/mostly-adequate-guide/content/ch4.html)
 *
 * @param {Function} fn - the function
 * @param {Array|String} arr - the array to be mapped
 * @return {Array}
 * @example
 * var arr = require('tonal-arr')
 * var toUp = arr.map(function(e) { return e.toUpperCase() })
 * toUp('a b c') // => ['A', 'B', 'C']
 *
 * @example
 * var tonal = require('tonal')
 * tonal.map(tonal.transpose('M3'), 'C D E') // => ['E', 'F#', 'G#']
 */
function map (fn, list) {
  return arguments.length > 1
    ? map(fn)(list)
    : function (l) {
      return asArr(l).map(fn)
    }
}

/**
 * Return a copy of the array with the null values removed
 * @param {String|Array} list
 * @return {Array}
 * @example
 * tonal.compact(['a', 'b', null, 'c']) // => ['a', 'b', 'c']
 */
function compact (arr) {
  return asArr(arr).filter(hasVal)
}

/**
 * Filter an array with a function. Again, almost the same as JavaScript standard
 * filter function but:
 *
 * - It accepts strings as arrays
 * - Can be partially applied
 *
 * @param {Function} fn
 * @param {String|Array} arr
 * @return {Array}
 * @example
 * t.filter(t.noteName, 'a b c x bb') // => [ 'a', 'b', 'c', 'bb' ]
 */
function filter (fn, list) {
  return arguments.length > 1
    ? filter(fn)(list)
    : function (l) {
      return asArr(l).filter(fn)
    }
}

// a custom height function that
// - returns -Infinity for non-pitch objects
// - assumes pitch classes has octave -100 (so are sorted before that notes)
function objHeight (p) {
  if (!p) return -Infinity
  var f = tonalPitch.fifths(p) * 7;
  var o = tonalPitch.focts(p) || -Math.floor(f / 12) - 100;
  return f + o * 12
}

// ascending comparator
function ascComp (a, b) {
  return objHeight(a) - objHeight(b)
}
// descending comparator
function descComp (a, b) {
  return -ascComp(a, b)
}

/**
 * Sort a list of notes or intervals in ascending or descending pitch order.
 * It removes from the list any thing is not a pitch (a note or interval)
 *
 * Note this function returns a __copy__ of the array, it does NOT modify
 * the original.
 *
 * @param {Array|String} list - the list of notes or intervals
 * @param {Boolean|Function} comp - (Optional) comparator.
 * Ascending pitch by default. Pass a `false` to order descending
 * or a custom comparator function (that receives pitches in array notation).
 * Note that any other value is ignored.
 * @example
 * array.sort('D E C') // => ['C', 'D', 'E']
 * array.sort('D E C', false) // => ['E', 'D', 'C']
 * // if is not a note, it wil be removed
 * array.sort('g h f i c') // => ['C', 'F', 'G']
 */
function sort (list, comp) {
  var fn = arguments.length === 1 || comp === true
    ? ascComp
    : comp === false ? descComp : typeof comp === 'function' ? comp : ascComp;
  // if the list is an array, make a copy
  list = Array.isArray(list) ? list.slice() : asArr(list);
  return listFn(function (arr) {
    return arr.sort(fn).filter(hasVal)
  }, list)
}

/**
 * Randomizes the order of the specified array using the Fisher–Yates shuffle.
 *
 * @function
 * @param {Array|String} arr - the array
 * @return {Array} the shuffled array
 *
 * @example
 * import { shuffle } from 'tonal-arrays'
 * @example
 * var tonal = require('tonal')
 * tonal.shuffle('C D E F')
 */
var shuffle = listFn(function (arr) {
  var i, t;
  var m = arr.length;
  while (m) {
    i = (Math.random() * m--) | 0;
    t = arr[m];
    arr[m] = arr[i];
    arr[i] = t;
  }
  return arr
});

function trOct (n) {
  return tonalTranspose.transpose(tonalPitch.pitch(0, n, 1))
}

/**
 * Rotates a list a number of times. It's completly agnostic about the
 * contents of the list.
 * @param {Integer} times - the number of rotations
 * @param {Array|String} list - the list to be rotated
 * @return {Array} the rotated array
 */
function rotate (times, list) {
  var arr = asArr(list);
  var len = arr.length;
  var n = (times % len + len) % len;
  return arr.slice(n, len).concat(arr.slice(0, n))
}

/**
 * Rotates an ascending list of pitches n times keeping the ascending property.
 * This functions assumes the list is an ascending list of pitches, and
 * transposes the them to ensure they are ascending after rotation.
 * It can be used, for example, to invert chords.
 *
 * @param {Integer} times - the number of rotations
 * @param {Array|String} list - the list to be rotated
 * @return {Array} the rotated array
 */
function rotateAsc (times, list) {
  return listFn(function (arr) {
    var len = arr.length;
    var n = (times % len + len) % len;
    var head = arr.slice(n, len);
    var tail = arr.slice(0, n);
    // See if the first note of tail is lower than the last of head
    var s = tonalDistance.semitones(head[len - n - 1], tail[0]);
    if (s < 0) {
      var octs = Math.floor(s / 12);
      if (times < 0) head = head.map(trOct(octs));
      else tail = tail.map(trOct(-octs));
    }
    return head.concat(tail)
  }, list)
}

/**
 * Select elements from a list.
 *
 * @param {String|Array} numbers - a __1-based__ index of the elements
 * @param {String|Array} list - the list of pitches
 * @return {Array} the selected elements (with nulls if not valid index)
 *
 * @example
 * import { select } from 'tonal-array'
 * select('1 3 5', 'C D E F G A B') // => ['C', 'E', 'G']
 * select('-1 0 1 2 3', 'C D') // => [ null, null, 'C', 'D', null ]
 */
function select (nums, list) {
  if (arguments.length === 1) {
    return function (l) {
      return select(nums, l)
    }
  }
  var arr = asArr(list);
  return asArr(nums).map(function (n) {
    return arr[n - 1] || null
  })
}

// http://stackoverflow.com/questions/9960908/permutations-in-javascript
/**
 * Get all permutations of a list
 * @param {Array|Strng} list - the list
 * @return {Array<Array>} an array with all the permutations
 */
function permutations (list) {
  list = asArr(list);
  if (list.length === 0) return [[]]
  return permutations(list.slice(1)).reduce(function (acc, perm) {
    return acc.concat(
      list.map(function (e, pos) {
        var newPerm = perm.slice();
        newPerm.splice(pos, 0, list[0]);
        return newPerm
      })
    )
  }, [])
}

// #### Transform lists in array notation
function asPitchStr (p) {
  return tonalPitch.strPitch(p) || p
}
function listToStr (v) {
  return tonalPitch.isPitch(v) ? tonalPitch.strPitch(v) : isArr(v) ? v.map(asPitchStr) : v
}

/**
 * Decorates a function to so it's first parameter is an array of pitches in
 * array notation. Also, if the return value is a pitch or an array of pitches
 * in array notation, it convert backs to strings.
 *
 * @private
 * @param {Function} fn - the function to decorate
 * @return {Function} the decorated function
 * @example
 * import { listFn } from 'tonal-arrays'
 * var octUp = listFn((p) => { p[2] = p[2] + 1; return p[2] })
 * octUp('C2 D2 E2') // => ['C3', 'D3', 'E3']
 */
function listFn (fn, list) {
  if (arguments.length === 1) {
    return function (l) {
      return listFn(fn, l)
    }
  }
  var arr = asArr(list).map(tonalPitch.asPitch);
  var res = fn(arr);
  return listToStr(res)
}

exports.asArr = asArr;
exports.map = map;
exports.compact = compact;
exports.filter = filter;
exports.sort = sort;
exports.shuffle = shuffle;
exports.rotate = rotate;
exports.rotateAsc = rotateAsc;
exports.select = select;
exports.permutations = permutations;

},{"tonal-distance":27,"tonal-pitch":37,"tonal-transpose":43}],25:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalDictionary = require('tonal-dictionary');
var tonalArray = require('tonal-array');
var tonalNote = require('tonal-note');
var noteParser = require('note-parser');
var tonalHarmonizer = require('tonal-harmonizer');

var M = ["1P 3M 5P",["Major",""]];
var M13 = ["1P 3M 5P 7M 9M 13M",["maj13","Maj13"]];
var M6 = ["1P 3M 5P 13M",["6"]];
var M69 = ["1P 3M 5P 6M 9M",["69"]];
var M7add13 = ["1P 3M 5P 6M 7M 9M"];
var M7b5 = ["1P 3M 5d 7M"];
var M7b6 = ["1P 3M 6m 7M"];
var M7b9 = ["1P 3M 5P 7M 9m"];
var M7sus4 = ["1P 4P 5P 7M"];
var M9 = ["1P 3M 5P 7M 9M",["maj9","Maj9"]];
var M9b5 = ["1P 3M 5d 7M 9M"];
var M9sus4 = ["1P 4P 5P 7M 9M"];
var Madd9 = ["1P 3M 5P 9M",["2","add9","add2"]];
var Maj7 = ["1P 3M 5P 7M",["maj7","M7"]];
var Mb5 = ["1P 3M 5d"];
var Mb6 = ["1P 3M 13m"];
var Msus2 = ["1P 2M 5P",["add9no3","sus2"]];
var Msus4 = ["1P 4P 5P",["sus","sus4"]];
var addb9 = ["1P 3M 5P 9m"];
var m = ["1P 3m 5P",["minor"]];
var m11 = ["1P 3m 5P 7m 9M 11P",["_11"]];
var m11b5 = ["1P 3m 7m 12d 2M 4P",["h11","_11b5"]];
var m13 = ["1P 3m 5P 7m 9M 11P 13M",["_13"]];
var m6 = ["1P 3m 4P 5P 13M",["_6"]];
var m69 = ["1P 3m 5P 6M 9M",["_69"]];
var m7 = ["1P 3m 5P 7m",["minor7","_","_7"]];
var m7add11 = ["1P 3m 5P 7m 11P",["m7add4"]];
var m7b5 = ["1P 3m 5d 7m",["half-diminished","h7","_7b5"]];
var m9 = ["1P 3m 5P 7m 9M",["_9"]];
var m9b5 = ["1P 3m 7m 12d 2M",["h9","-9b5"]];
var mMaj7 = ["1P 3m 5P 7M",["mM7","_M7"]];
var mMaj7b6 = ["1P 3m 5P 6m 7M",["mM7b6"]];
var mM9 = ["1P 3m 5P 7M 9M",["mMaj9","-M9"]];
var mM9b6 = ["1P 3m 5P 6m 7M 9M",["mMaj9b6"]];
var mb6M7 = ["1P 3m 6m 7M"];
var mb6b9 = ["1P 3m 6m 9m"];
var o = ["1P 3m 5d",["mb5","dim"]];
var o7 = ["1P 3m 5d 13M",["diminished","m6b5","dim7"]];
var o7M7 = ["1P 3m 5d 6M 7M"];
var oM7 = ["1P 3m 5d 7M"];
var sus24 = ["1P 2M 4P 5P",["sus4add9"]];
var madd4 = ["1P 3m 4P 5P"];
var madd9 = ["1P 3m 5P 9M"];
var DATA = {
	M: M,
	M13: M13,
	M6: M6,
	M69: M69,
	M7add13: M7add13,
	M7b5: M7b5,
	M7b6: M7b6,
	M7b9: M7b9,
	M7sus4: M7sus4,
	M9: M9,
	M9b5: M9b5,
	M9sus4: M9sus4,
	Madd9: Madd9,
	Maj7: Maj7,
	Mb5: Mb5,
	Mb6: Mb6,
	Msus2: Msus2,
	Msus4: Msus4,
	addb9: addb9,
	m: m,
	m11: m11,
	m11b5: m11b5,
	m13: m13,
	m6: m6,
	m69: m69,
	m7: m7,
	m7add11: m7add11,
	m7b5: m7b5,
	m9: m9,
	m9b5: m9b5,
	mMaj7: mMaj7,
	mMaj7b6: mMaj7b6,
	mM9: mM9,
	mM9b6: mM9b6,
	mb6M7: mb6M7,
	mb6b9: mb6b9,
	o: o,
	o7: o7,
	o7M7: o7M7,
	oM7: oM7,
	sus24: sus24,
	madd4: madd4,
	madd9: madd9,
	"4": ["1P 4P 7m 10m",["quartal"]],
	"5": ["1P 5P"],
	"7": ["1P 3M 5P 7m",["Dominant","Dom"]],
	"9": ["1P 3M 5P 7m 9M",["79"]],
	"11": ["1P 5P 7m 9M 11P"],
	"13": ["1P 3M 5P 7m 9M 13M",["13_"]],
	"64": ["5P 8P 10M"],
	"M#5": ["1P 3M 5A",["augmented","maj#5","Maj#5","+","aug"]],
	"M#5add9": ["1P 3M 5A 9M",["+add9"]],
	"M13#11": ["1P 3M 5P 7M 9M 11A 13M",["maj13#11","Maj13#11","M13+4","M13#4"]],
	"M6#11": ["1P 3M 5P 6M 11A",["M6b5","6#11","6b5"]],
	"M69#11": ["1P 3M 5P 6M 9M 11A"],
	"M7#11": ["1P 3M 5P 7M 11A",["maj7#11","Maj7#11","M7+4","M7#4"]],
	"M7#5": ["1P 3M 5A 7M",["maj7#5","Maj7#5","maj9#5","M7+"]],
	"M7#5sus4": ["1P 4P 5A 7M"],
	"M7#9#11": ["1P 3M 5P 7M 9A 11A"],
	"M9#11": ["1P 3M 5P 7M 9M 11A",["maj9#11","Maj9#11","M9+4","M9#4"]],
	"M9#5": ["1P 3M 5A 7M 9M",["Maj9#5"]],
	"M9#5sus4": ["1P 4P 5A 7M 9M"],
	"11b9": ["1P 5P 7m 9m 11P"],
	"13#11": ["1P 3M 5P 7m 9M 11A 13M",["13+4","13#4"]],
	"13#9": ["1P 3M 5P 7m 9A 13M",["13#9_"]],
	"13#9#11": ["1P 3M 5P 7m 9A 11A 13M"],
	"13b5": ["1P 3M 5d 6M 7m 9M"],
	"13b9": ["1P 3M 5P 7m 9m 13M"],
	"13b9#11": ["1P 3M 5P 7m 9m 11A 13M"],
	"13no5": ["1P 3M 7m 9M 13M"],
	"13sus4": ["1P 4P 5P 7m 9M 13M",["13sus"]],
	"69#11": ["1P 3M 5P 6M 9M 11A"],
	"7#11": ["1P 3M 5P 7m 11A",["7+4","7#4","7#11_","7#4_"]],
	"7#11b13": ["1P 3M 5P 7m 11A 13m",["7b5b13"]],
	"7#5": ["1P 3M 5A 7m",["+7","7aug","aug7"]],
	"7#5#9": ["1P 3M 5A 7m 9A",["7alt","7#5#9_","7#9b13_"]],
	"7#5b9": ["1P 3M 5A 7m 9m"],
	"7#5b9#11": ["1P 3M 5A 7m 9m 11A"],
	"7#5sus4": ["1P 4P 5A 7m"],
	"7#9": ["1P 3M 5P 7m 9A",["7#9_"]],
	"7#9#11": ["1P 3M 5P 7m 9A 11A",["7b5#9"]],
	"7#9#11b13": ["1P 3M 5P 7m 9A 11A 13m"],
	"7#9b13": ["1P 3M 5P 7m 9A 13m"],
	"7add6": ["1P 3M 5P 7m 13M",["67","7add13"]],
	"7b13": ["1P 3M 7m 13m"],
	"7b5": ["1P 3M 5d 7m"],
	"7b6": ["1P 3M 5P 6m 7m"],
	"7b9": ["1P 3M 5P 7m 9m"],
	"7b9#11": ["1P 3M 5P 7m 9m 11A",["7b5b9"]],
	"7b9#9": ["1P 3M 5P 7m 9m 9A"],
	"7b9b13": ["1P 3M 5P 7m 9m 13m"],
	"7b9b13#11": ["1P 3M 5P 7m 9m 11A 13m",["7b9#11b13","7b5b9b13"]],
	"7no5": ["1P 3M 7m"],
	"7sus4": ["1P 4P 5P 7m",["7sus"]],
	"7sus4b9": ["1P 4P 5P 7m 9m",["susb9","7susb9","7b9sus","7b9sus4","phryg"]],
	"7sus4b9b13": ["1P 4P 5P 7m 9m 13m",["7b9b13sus4"]],
	"9#11": ["1P 3M 5P 7m 9M 11A",["9+4","9#4","9#11_","9#4_"]],
	"9#11b13": ["1P 3M 5P 7m 9M 11A 13m",["9b5b13"]],
	"9#5": ["1P 3M 5A 7m 9M",["9+"]],
	"9#5#11": ["1P 3M 5A 7m 9M 11A"],
	"9b13": ["1P 3M 7m 9M 13m"],
	"9b5": ["1P 3M 5d 7m 9M"],
	"9no5": ["1P 3M 7m 9M"],
	"9sus4": ["1P 4P 5P 7m 9M",["9sus"]],
	"m#5": ["1P 3m 5A",["m+","mb6"]],
	"m11A 5": ["1P 3m 6m 7m 9M 11P"],
	"m7#5": ["1P 3m 6m 7m"],
	"m9#5": ["1P 3m 6m 7m 9M"],
	"+add#9": ["1P 3M 5A 9A"]
};

/**
 * A chord is a harmonic unit with at least three different tones sounding simultaneously.
 *
 * This module have functions to create and manipulate chords. It includes a
 * chord dictionary and a simple chord detection algorithm.
 *
 * @example
 * var chord = require('tonal-chord')
 * chord.detect('c b g e') // => 'CMaj7'
 * chord.get('CMaj7') // => ['C', 'E', 'G', 'B']
 *
 * @module chord
 */
var dict = tonalDictionary.dictionary(DATA, function (str) { return str.split(' ') });

/**
 * Return the available chord names
 *
 * @function
 * @param {boolean} aliases - true to include aliases
 * @return {Array} the chord names
 *
 * @example
 * var chord = require('tonal-chord')
 * chord.names() // => ['maj7', ...]
 */
var names = dict.keys;

/**
 * Get chord notes or intervals from chord type
 *
 * This function is currified
 *
 * @param {String} type - the chord type
 * @param {Strng|Pitch} tonic - the tonic or false to get the intervals
 * @return {Array<String>} the chord notes or intervals, or null if not valid type
 *
 * @example
 * chords.get('dom7', 'C') // => ['C', 'E', 'G', 'Bb']
 * maj7 = chords.get('Maj7')
 * maj7('C') // => ['C', 'E', 'G', 'B']
 */
function get (type, tonic) {
  if (arguments.length === 1) return function (t) { return get(type, t) }
  var ivls = dict.get(type);
  return ivls ? tonalHarmonizer.harmonize(ivls, tonic) : null
}

/**
 * Get the chord notes of a chord. This function accepts either a chord name
 * (for example: 'Cmaj7') or a list of notes.
 *
 * It always returns an array, even if the chord is not found.
 *
 * @param {String|Array} chord - the chord to get the notes from
 * @return {Array<String>} a list of notes or empty list if not chord found
 *
 * @example
 * chord.notes('Cmaj7') // => ['C', 'E', 'G', 'B']
 */
function notes (chord) {
  var p = parse(chord);
  var ivls = dict.get(p.type);
  return ivls ? tonalHarmonizer.harmonize(ivls, p.tonic) : tonalArray.compact(tonalArray.map(tonalNote.name, chord))
}

/**
 * Get chord intervals. It always returns an array
 *
 * @param {String} name - the chord name (optionally a tonic and type)
 * @return {Array<String>} a list of intervals or null if the type is not known
 */
function intervals (name$$1) {
  var p = parse(name$$1);
  return dict.get(p.type) || []
}

/**
 * Check if a given name correspond to a chord in the dictionary
 * @param {String} name
 * @return {Boolean}
 * @example
 * chord.isKnownChord('CMaj7') // => true
 * chord.isKnownChord('Maj7') // => true
 * chord.isKnownChord('Ablah') // => false
 */
function isKnownChord (name$$1) {
  return intervals(name$$1).length > 0
}

/**
 * Detect a chord. Given a list of notes, return the chord name(s) if any.
 * It only detects chords with exactly same notes.
 *
 * @function
 * @param {Array|String} notes - the list of notes
 * @return {Array<String>} an array with the possible chords
 * @example
 * chord.detect('b g f# d') // => [ 'GMaj7' ]
 * chord.detect('e c a g') // => [ 'CM6', 'Am7' ]
 */
var detect = tonalDictionary.detector(dict, '');

/**
 * Get the position (inversion number) of a chord (0 is root position, 1 is first
 * inversion...). It assumes the chord is formed by superposed thirds.
 *
 * @param {Array|String} chord - the chord notes
 * @return {Integer} the inversion number (0 for root inversion, 1 for first
 * inversion...) or null if not a valid chord
 *
 * @example
 * chord.position('e g c') // => 1
 * chord.position('g3 e2 c5') // => 1 (e is the lowest note)
 */
function position (chord) {
  var pcs = tonalArray.map(tonalNote.pc, chord);
  var sorted = sortTriads(pcs);
  return sorted ? sorted.indexOf(pcs[0]) : null
}

/**
 * Given a chord in any inverstion, set to the given inversion. It accepts
 * chord names
 *
 * @param {Integer} num - the inversion number (0 root position, 1 first
 * inversion, ...)
 * @param {String|Array} chord - the chord name or notes
 * @return {Array} the chord pitch classes in the desired inversion or
 * an empty array if no inversion found (not triadic)
 *
 * @example
 * chord.inversion(1, 'Cmaj7') // => [ 'E', 'G', 'B', 'C' ]
 * chord.inversion(0, 'e g c') // => [ 'C', 'E', 'G' ]
 */
function inversion (num, chord) {
  if (arguments.length === 1) return function (c) { return inversion(num, c) }
  var sorted = sortTriads(chord);
  return sorted ? tonalArray.rotate(num, sorted) : []
}

function sortTriads (chord) {
  var all = tonalArray.permutations(notes(chord).map(tonalNote.pc));
  for (var i = 0; i < all.length; i++) {
    var ivls = tonalHarmonizer.intervallic(all[i]);
    if (areTriads(ivls)) return all[i]
  }
  return null
}

function areTriads (list) {
  for (var i = 0; i < list.length; i++) {
    if (list[i][0] !== '3') return false
  }
  return true
}

/**
 * Try to parse a chord name. It returns an array with the chord type and
 * the tonic. If not tonic is found, all the name is considered the chord
 * name.
 *
 * This function does NOT check if the chord type exists or not. It only tries
 * to split the tonic and chord type.
 *
 * @param {String} name - the chord name
 * @return {Array} an array with [type, tonic]
 * @example
 * chord.parse('Cmaj7') // => { tonic: 'C', type: 'maj7' }
 * chord.parse('C7') // => { tonic: 'C', type: '7' }
 * chord.parse('mMaj7') // => { tonic: false, type: 'mMaj7' }
 * chord.parse('Cnonsense') // => { tonic: 'C', type: 'nonsense' }
 */
function parse (name$$1) {
  var p = noteParser.regex().exec(name$$1);
  if (!p) return { type: name$$1, tonic: false }

  // If chord name is empty, the octave is the chord name
  return !p[4] ? { type: p[3], tonic: p[1] + p[2] }
    // If the octave is 6 or 7 is asumed to be part of the chord name
    : (p[3] === '7' || p[3] === '6') ? { type: p[3] + p[4], tonic: p[1] + p[2] }
    : { type: p[4], tonic: p[1] + p[2] + p[3] }
}

exports.names = names;
exports.get = get;
exports.notes = notes;
exports.intervals = intervals;
exports.isKnownChord = isKnownChord;
exports.detect = detect;
exports.position = position;
exports.inversion = inversion;
exports.parse = parse;

},{"note-parser":22,"tonal-array":24,"tonal-dictionary":26,"tonal-harmonizer":30,"tonal-note":35}],26:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalArray = require('tonal-array');
var tonalNote = require('tonal-note');
var tonalPcset = require('tonal-pcset');

/**
 * This module contains functions to query tonal dictionaries.
 *
 * A tonal dictionary is basically a map from keys to list of intervals. It
 * also supports name aliases. See `tonal-chords` or `tonal-scales` to examples
 * of dictionaries.
 *
 * This functions are quite low level, and probably you wont need it, because
 * they are friendly served via `tonal-chords` and `tonal-scales`.
 *
 * __Those functions are NOT visible via `tonal` package__.
 *
 * @module dictionary
 */
function id (x) { return x }

/**
 * Create a tonal dictionary. A dictionary is an object with two functions: get and
 * keys.
 *
 * The data given to this constructor it's a HashMap in the form:
 * `{ key: [intervals, [aliases]] }`
 *
 * @param {HashMap} data - the dictionary data
 * @return {Object} the dictionary object
 *
 * @example
 * var dictionary = require('tonal-dictionary').dictionary
 * var DATA = {
 * 'maj7': ['1 3 5 7', ['Maj7']],
 *   'm7': ['1 b3 5 7']
 * }
 * var chords = dictionary(DATA, function (str) { return str.split(' ') })
 * chords.get('maj7') // => [ '1', '3', '5', '7' ]
 * chords.get('Maj7') // => [ '1', '3', '5', '7' ]
 * chords.get('m7') // => ['1', 'b3', '5', '7']
 * chords.get('m7b5') // => null
 * chords.keys() // => ['maj7', 'm7']
 * chords.keys(true) // => ['maj7', 'm7', 'Maj7']
 */
function dictionary (raw, parse) {
  parse = parse || id;
  var byKey = {};
  var names = Object.keys(raw);
  var aliases = [];
  names.forEach(function (k) {
    var value = parse(raw[k][0]);
    byKey[k] = value;
    if (raw[k][1]) {
      raw[k][1].forEach(function (alias) {
        byKey[alias] = value;
        aliases.push(alias);
      });
    }
  });
  return {
    /**
     * Get a value by key
     * @name get
     * @function
     * @param {String} key
     * @return {Object} the value (normally an array of intervals or notes)
     * @memberof dictionary
     */
    get: function (n) { return byKey[n] },
    /**
     * Get the valid keys of dictionary
     * @name keys
     * @function
     * @param {Boolean} aliases - (Optional) include aliases names (false by default)
     * @param {Function} filter - a function to filter the names. It receives the
     * name and the value as parameters
     * @return {Array<String>} the keys
     * @memberof dictionary
     */
    keys: function (all, filter) {
      var keys = all ? names.concat(aliases) : names.slice();
      return typeof filter !== 'function' ? keys
        : keys.filter(function (k) { return filter(k, byKey[k]) })
    }
  }
}

/**
 * Create a pitch set detector. Given a dictionary data, it returns a
 * function that tries to detect a given pitch set inside the dictionary
 *
 * @param {Dictionary} dictionary - the dictionary object
 * @param {Function|String} builder - (Optional) a function that given a name and a tonic,
 * returns the object or a string to join both
 * @return {Function} the detector function
 * @see chord.detect
 * @see scale.detect
 * @example
 * var detect = detector(dictionary(DATA), '')
 * detect('c d e b') // => 'Cmaj/'
 */
function detector (dict, build) {
  var isSep = typeof build === 'string';
  var isFn = typeof build === 'function';
  var nameByChroma = dict.keys(false).reduce(function (map$$1, key) {
    map$$1[tonalPcset.chroma(dict.get(key))] = key;
    return map$$1
  }, {});

  return function (notes) {
    notes = tonalArray.sort(tonalArray.map(tonalNote.pc, notes));
    var sets = tonalPcset.chromaModes(notes);
    return tonalArray.compact(sets.map(function (set, i) {
      var type = nameByChroma[set];
      if (!type) return null
      var tonic = notes[i];
      return isSep ? tonic + build + type
        : isFn ? build(type, tonic)
        : [type, tonic]
    }))
  }
}

exports.dictionary = dictionary;
exports.detector = detector;

},{"tonal-array":24,"tonal-note":35,"tonal-pcset":36}],27:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalPitch = require('tonal-pitch');

/**
 * Functions to calculate distances between notes
 *
 * @example
 * // using node's require
 * var distance = require('tonal-distance')
 * distance.interval('C4', 'G4') // => '5P'
 *
 * @example
 * // using ES6 import
 * import { interval, semitones } from 'tonal-distance'
 * semitones('C' ,'D') // => 2
 *
 * @module distance
 */
// substract two pitches
function substr (a, b) {
  if (!a || !b || a[1].length !== b[1].length) return null
  var f = tonalPitch.fifths(b) - tonalPitch.fifths(a);
  if (tonalPitch.isPC(a)) return tonalPitch.pitch(f, -Math.floor(f * 7 / 12), 1)
  var o = tonalPitch.focts(b) - tonalPitch.focts(a);
  var d = tonalPitch.height(b) - tonalPitch.height(a) < 0 ? -1 : 1;
  return tonalPitch.pitch(d * f, d * o, d)
}

/**
 * Find the interval between two pitches. Both pitches MUST be of the same type:
 *
 * - notes: it returns the interval between the first and the second
 * - pitch classes: it returns the __ascending__ interval between both
 * - intervals: substract one from the other
 *
 * @param {Pitch|String} from - distance from
 * @param {Pitch|String} to - distance to
 * @return {Interval} the distance between pitches
 *
 * @example
 * var distance = require('tonal-distance')
 * distance.interval('C2', 'C3') // => 'P8'
 * distance.interval('G', 'B') // => 'M3'
 * // or use tonal
 * var tonal = require('tonal')
 * tonal.distance.interval('M2', 'P5') // => 'P4'
 */
function interval (a, b) {
  if (arguments.length === 1) return function (b) { return interval(a, b) }
  var pa = tonalPitch.asPitch(a);
  var pb = tonalPitch.asPitch(b);
  var i = substr(pa, pb);
  // if a and b are in array notation, no conversion back
  return a === pa && b === pb ? i : tonalPitch.strIvl(i)
}

/**
 * Get the distance between two notes in semitones
 * @param {String|Pitch} from - first note
 * @param {String|Pitch} to - last note
 * @return {Integer} the distance in semitones or null if not valid notes
 * @example
 * import { semitones } from 'tonal-distance'
 * semitones('C3', 'A2') // => -3
 * // or use tonal
 * tonal.distance.semitones('C3', 'G3') // => 7
 */
function semitones (a, b) {
  var i = substr(tonalPitch.asPitch(a), tonalPitch.asPitch(b));
  return i ? tonalPitch.height(i) : null
}

exports.interval = interval;
exports.semitones = semitones;

},{"tonal-pitch":37}],28:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * Functions to encoding and decoding pitches into fifths/octaves notation.
 *
 * This functions are very low level and it's probably you wont need them.
 * @private
 * @module encoding
 */

function isNum (n) { return typeof n === 'number' }

// Map from letter step to number of fifths starting from 'C':
// { C: 0, D: 2, E: 4, F: -1, G: 1, A: 3, B: 5 }
var FIFTHS = [0, 2, 4, -1, 1, 3, 5];
// Given a number of fifths, return the octaves they span
function fOcts (f) { return Math.floor(f * 7 / 12) }
// Get the number of octaves it span each step
var FIFTH_OCTS = FIFTHS.map(fOcts);

/**
 * Given a note's step, alteration and octave returns the fiths/octave
 * note encoding.
 * @param {number} step - the step number (0 = C, 1 = D, ...)
 * @param {number} alteration - the note alteration (..., -1 = 'b', 0 = '', 1 = '#', ...)
 * @param {number} octave - the note octave
 * @return {Array} the [fifths, octave] representation of that note
 */
function encode (step, alt, oct) {
  var f = FIFTHS[step] + 7 * alt;
  if (!isNum(oct)) return [f]
  var o = oct - FIFTH_OCTS[step] - 4 * alt;
  return [f, o]
}

// Return the number of fifths as if it were unaltered
function unaltered (f) {
  var i = (f + 1) % 7;
  return i < 0 ? 7 + i : i
}

// We need to get the steps from fifths
// Fifths for CDEFGAB are [ 0, 2, 4, -1, 1, 3, 5 ]
// We add 1 to fifths to avoid negative numbers, so:
// for ['F', 'C', 'G', 'D', 'A', 'E', 'B'] we have:
var STEPS = [3, 0, 4, 1, 5, 2, 6];

/**
 * Decode a encoded pitch
 * @param {Number} fifths - the number of fifths
 * @param {Number} octs - the number of octaves to compensate the fifhts
 * @return {Array} in the form [step, alt, oct]
 */
function decode (f, o) {
  var step = STEPS[unaltered(f)];
  var alt = Math.floor((f + 1) / 7);
  if (!isNum(o)) return [step, alt]
  var oct = o + 4 * alt + FIFTH_OCTS[step];
  return [step, alt, oct]
}

exports.encode = encode;
exports.decode = decode;

},{}],29:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalMidi = require('tonal-midi');

/**
 * [![npm version](https://img.shields.io/npm/v/tonal-freq.svg)](https://www.npmjs.com/package/tonal-freq)
 * [![tonal](https://img.shields.io/badge/tonal-freq-yellow.svg)](https://www.npmjs.com/browse/keyword/tonal)
 *
 * `tonal-freq` is a collection of functions to perform calculations related to frequencies.
 *
 * This is part of [tonal](https://www.npmjs.com/package/tonal) music theory library.
 *
 * ## Usage
 *
 * ```js
 * var freq = require('tonal-freq')
 * freq.toFreq('A4') // => 440
 * freq.note(440) // => 'A4'
 * freq.noteAndDetune(320) // => ['C4', 200]
 * ```
 *
 * ## Install
 *
 * [![npm install tonal-freq](https://nodei.co/npm/tonal-freq.png?mini=true)](https://npmjs.org/package/tonal-freq/)
 *
 * ## API Documentation
 *
 * @module freq
 */
// decorate a function to round the numeric result to a max
function round (m, fn) {
  m = m || m === 0 ? Math.pow(10, m) : false;
  return function (v) {
    v = fn(v);
    return v === null ? null : m ? Math.round(v * m) / m : v
  }
}

/**
 * Return the equal tempered frequency of a note.
 *
 * This function can be partially applied if note parameter is not present.
 * @function
 * @param {Float} ref - the tuning reference
 * @param {Integer} maxDecimals - (Optional) the maximum number of decimals (all by default)
 * @param {String|Pitch} note - the note to get the frequency from
 * @return {Number} the frequency
 * @example
 * eqTempFreq(444, 4, 'C3')
 * const toFreq = eqTempFreq(444, 2)
 * toFreq('A3') // => 222
 */
function eqTempFreq (ref, max, note$$1) {
  if (arguments.length > 2) return eqTempFreq(ref, max)(note$$1)
  return round(max, function (p) {
    var m = tonalMidi.toMidi(p);
    return m ? Math.pow(2, (m - 69) / 12) * ref : null
  })
}

/**
 * Get the frequency of note with 2 decimals precission using A4 440Hz tuning
 *
 * This is an alias for: `eqTempFreq(440, 2, <note>)`
 *
 * @function
 * @param {Number|String} note - the note name or midi number
 * @return {Float} the frequency in herzs
 * @example
 * freq.toFreq('A4') // => 440
 * freq.toFreq('C4') // => 261.63
 */
var toFreq = eqTempFreq(440, 2);

/**
 * Get the midi note from a frequency in equal temperament scale. You can
 * specify the number of decimals of the midi number.
 *
 * @param {Float} tuning - (Optional) the reference A4 tuning (440Hz by default)
 * @param {Number} freq - the frequency
 * @return {Number} the midi number
 */
function eqTempFreqToMidi (ref, max, freq) {
  if (arguments.length > 2) return eqTempFreqToMidi(ref, max)(freq)
  return round(max, function (freq) {
    return 12 * (Math.log(freq) - Math.log(ref)) / Math.log(2) + 69
  })
}

/**
 * Get midi number from frequency with two decimals of precission.
 *
 * This is an alisas for: `eqTempFreqToMidi(440, 2, <freq>)`
 *
 * @function
 * @param {Float} freq
 * @return {Number} midi number
 * @example
 * freq.toMidi(361) // => 59.96
 */
var toMidi$1 = eqTempFreqToMidi(440, 2);

/**
 * Get note name from frequency using an equal temperament scale with 440Hz
 * as reference
 *
 * @param {Float} freq
 * @param {Boolean} useSharps - (Optional) set to true to use sharps instead of flats
 * @return {String} note name
 * @example
 * freq.note(440) // => 'A4'
 */
function note$1 (freq, useSharps) {
  return tonalMidi.note(toMidi$1(freq), useSharps)
}

/**
 * Get difference in cents between two frequencies. The frequencies can be
 * expressed with hertzs or midi numbers or note names
 * @param {Float|Integer|String} base
 * @param {Float|Integer|String} freq
 * @return {Integer} The difference in cents
 * @example
 * import { cents } from 'tonal-freq'
 * cents('C4', 261) // => -4
 */
function cents (base, freq) {
  var b = toFreq(base) || base;
  var f = toFreq(freq) || freq;
  return Math.round(1200 * (Math.log(f / b) / Math.log(2)))
}

exports.eqTempFreq = eqTempFreq;
exports.toFreq = toFreq;
exports.eqTempFreqToMidi = eqTempFreqToMidi;
exports.toMidi = toMidi$1;
exports.note = note$1;
exports.cents = cents;

},{"tonal-midi":33}],30:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalTranspose = require('tonal-transpose');
var tonalDistance = require('tonal-distance');
var tonalArray = require('tonal-array');

/**
 * Functions to transpose o calculate distances from a collection of notes.
 *
 * A useful concept is _harmonizer_: a function that _harmonizes_ notes. It can
 * be created by partially applying the `harmonize` function (see examples)
 *
 * @example
 * var harmonizer = require('tonal-harmonizer')
 * harmonizer.harmonize('1P 3M 5P', 'C') // => ['C', 'E', 'G']
 * var maj7 = harmonizer.harmonize('1P 3M 5P 7M')
 * maj7('D4') // =>  ['D4', 'F#4', 'A4', 'C#5']
 * harmonizer.harmonics('C E G') // => ['1P', '3M', '5P']
 *
 * @example
 * // in tonal this functions are NOT namespaced
 * var tonal = require('tonal')
 * tonal.harmonize('1P 3M 5P', 'G')
 *
 * @example
 * // using ES6 import syntax
 * import { harmonize } from 'tonal-harmonizer'
 * harmonize(...)
 *
 * @module harmonizer
 */
/**
 * Given a list of notes, return the distance from the first note to the rest.
 * @param {Array|String} notes - the list of notes
 * @return {Array} the intervals relative to the first note
 * @example
 * harmonizer.harmonics('C E G') // => ['1P', '3M', '5P']
 *
 * @example
 * // in tonal this functions are NOT namespaced
 * tonal.harmonics(tonal.scale('C major')) // => ['1P', ...]
 */
function harmonics (list) {
  var a = tonalArray.asArr(list);
  return a.length ? tonalArray.compact(a.map(tonalDistance.interval(a[0]))) : a
}

/**
 * Given a list of notes, return the intervallic structure: the distance from
 * one to the next.
 *
 * Notice that the number of intervals is one less that the number of notes.
 *
 * @param {Array|String} notes - the list of notes
 * @return {Array} the intervals relative to the previous
 * @example
 * harmonizer.intervallic('c e g') // => ['3M', '3m']
 * harmonizer.intervallic('e g c') // => ['3m', '4P']
 * harmonizer.intervallic('c') // => []
 */
function intervallic (notes) {
  var dist = [];
  notes = tonalArray.asArr(notes);
  for (var i = 1; i < notes.length; i++) {
    dist.push(tonalDistance.interval(notes[i - 1], notes[i]));
  }
  return dist
}

/**
 * Given a list of intervals and a tonic, return that tonic transposed
 * to that intervals.
 *
 * It's currified and, calling with only one parameter, returns an harmonizer,
 * a function that harmonizes any note (see example)
 *
 * @function
 * @param {String|Array} list - the list of intervals
 * @param {String|Pitch} note - the note to be harmonized
 * @return {Array} the resulting notes
 * @example
 * harmonizer.harmonize('P1 M3 P5 M7', 'C') // => ['C', 'E', 'G', 'B']
 * @example
 * // harmonizer with partial application
 * var maj7 = harmonize.harmonizer('P1 M3 P5 M7')
 * maj7('C') // => ['C', 'E', 'G', 'B']
 * @example
 * // in tonal this function is NOT namespaced
 * var C = tonal.harmonizer('C D E')
 * C('M3') // => ['E', 'G#', 'B']
 */
function harmonize (list, pitch) {
  if (arguments.length > 1) return harmonize(list)(pitch)
  return function (tonic) {
    return tonalArray.compact(tonalArray.map(tonalTranspose.transpose(tonic || 'P1'), list))
  }
}

exports.harmonics = harmonics;
exports.intervallic = intervallic;
exports.harmonize = harmonize;

},{"tonal-array":24,"tonal-distance":27,"tonal-transpose":43}],31:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var intervalNotation = require('interval-notation');
var tonalPitch = require('tonal-pitch');

/**
 * [![npm version](https://img.shields.io/npm/v/tonal-interval.svg)](https://www.npmjs.com/package/tonal-interval)
 * [![tonal](https://img.shields.io/badge/tonal-interval-yellow.svg)](https://www.npmjs.com/browse/keyword/tonal)
 *
 * `tonal-interval` is a collection of functions to create and manipulate music intervals.
 *
 * The intervals are strings in shorthand notation. Two variations are supported:
 *
 * - standard shorthand notation: type and number, for example: 'M3', 'd-4'
 * - inverse shorthand notation: number and then type, for example: '3M', '-4d'
 *
 * The problem with the standard shorthand notation is that some strings can be
 * parsed as notes or intervals, for example: 'A4' can be note A in 4th octave
 * or an augmented four. To remove ambiguity, the prefered notation in tonal is the
 * inverse shortand notation.
 *
 * This is part of [tonal](https://www.npmjs.com/package/tonal) music theory library.
 *
 * ## Usage
 *
 * ```js
 * import * as interval from 'tonal-interval'
 * // or var interval = require('tonal-interval')
 * interval.semitones('4P') // => 5
 * interval.invert('3m') // => '6M'
 * interval.simplify('9m') // => '2m'
 * ```
 *
 * ## Install
 *
 * [![npm install tonal-interval](https://nodei.co/npm/tonal-interval.png?mini=true)](https://npmjs.org/package/tonal-interval/)
 *
 * ## API Documentation
 *
 * @module interval
 */
/**
 * Get interval name. Can be used to test if it's an interval. It accepts intervals
 * as pitch or string in shorthand notation or tonal notation. It returns always
 * intervals in tonal notation.
 *
 * @param {String|Pitch} interval - the interval string or array
 * @return {String} the interval name or null if not valid interval
 * @example
 * interval.toInterval('m-3') // => '-3m'
 * interval.toInterval('3') // => null
 */
function toInterval (ivl) {
  var i = tonalPitch.asIvlPitch(ivl);
  return i ? tonalPitch.strIvl(i) : null
}

/**
 * Get the number of the interval (same as value, but always positive)
 *
 * @param {String|Pitch} interval - the interval
 * @return {Integer} the positive interval number (P1 is 1, m2 is 2, ...)
 * @example
 * interval.num('m2') // => 2
 * interval.num('P9') // => 9
 * interval.num('P-4') // => 4
 */
function num (ivl) {
  var p = props(ivl);
  return p ? p.num : null
}

/**
 * Get the interval value (the interval number, but positive or negative
 * depending the interval direction)
 *
 * @param {String|Pitch} interval - the interval
 * @return {Integer} the positive interval number (P1 is 1, m-2 is -2, ...)
 * @example
 * interval.num('m2') // => 2
 * interval.num('m9') // => 9
 * interval.num('P-4') // => -4
 * interval.num('m-9') // => -9
 */
function value (ivl) {
  var p = props(ivl);
  return p ? p.num * p.dir : null
}

/**
 * Get interval properties. It returns an object with:
 *
 * - num: the interval number (always positive)
 * - alt: the interval alteration (0 for perfect in perfectables, or 0 for major in _majorables_)
 * - dir: the interval direction (1 ascending, -1 descending)
 *
 * @param {String|Pitch} interval - the interval
 * @return {Array} the interval in the form [number, alt]
 * @example
 * interval.parse('m2') // => { num: 2, alt: -1, dir: 1 }
 * interval.parse('m9') // => { num: 9, alt: -1, dir: 1 }
 * interval.parse('P-4') // => { num: 4, alt: 0, dir: -1}
 * interval.parse('m-9') // => { num: 9, alt: -1, dir: -1 }
 */
function props (ivl) {
  var i = tonalPitch.asIvlPitch(ivl);
  if (!i) return null
  var d = tonalPitch.decode(i);
  return { num: d[0] + 1 + d[2] * 7, alt: d[1], dir: i[2] }
}

/**
 * Given a interval property object, get the interval name
 *
 * @param {Object} props - the interval property object
 *
 * - num: the interval number
 * - alt: the interval alteration
 * - dir: the direction
 * @return {String} the interval name
 */
function fromProps (props) {
  if (!props || props.num < 1) return null
  var octs = Math.floor((props.num) / 8);
  var simple = props.num - 7 * octs;
  return intervalNotation.build(simple, props.alt || 0, octs, props.dir)
}

/**
 * Get size in semitones of an interval
 * @param {String|Pitch} ivl
 * @return {Integer} the number of semitones or null if not an interval
 * @example
 * import { semitones } from 'tonal-interval'
 * semitones('P4') // => 5
 * // or using tonal
 * tonal.semitones('P5') // => 7
 */
function semitones (ivl) {
  var i = tonalPitch.asIvlPitch(ivl);
  return i ? tonalPitch.height(i) : null
}

// interval numbers
var IN = [1, 2, 2, 3, 3, 4, 5, 5, 6, 6, 7, 7];
// interval qualities
var IQ = 'P m M m M P d P m M m M'.split(' ');

/**
 * Get interval name from semitones number. Since there are several interval
 * names for the same number, the name it's arbitraty, but deterministic.
 * @param {Integer} num - the number of semitones (can be negative)
 * @return {String} the interval name
 * @example
 * import { fromSemitones } from 'tonal-interval'
 * fromSemitones(7) // => '5P'
 * // or using tonal
 * tonal.fromSemitones(-7) // => '-5P'
 */
function fromSemitones (num) {
  var d = num < 0 ? -1 : 1;
  var n = Math.abs(num);
  var c = n % 12;
  var o = Math.floor(n / 12);
  return d * (IN[c] + 7 * o) + IQ[c]
}

var CLASSES = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
/**
 * Get the [interval class](https://en.wikipedia.org/wiki/Interval_class)
 * number of a given interval.
 *
 * In musical set theory, an interval class is the shortest distance in
 * pitch class space between two unordered pitch classes
 *
 * As paramter you can pass an interval in shorthand notation, an interval in
 * array notation or the number of semitones of the interval
 *
 * @param {String|Integer} interval - the interval or the number of semitones
 * @return {Integer} A value between 0 and 6
 *
 * @example
 * interval.ic('P8') // => 0
 * interval.ic('m6') // => 4
 * ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'M7'].map(ic) // => [0, 2, 4, 5, 5, 3, 1]
 */
function ic (ivl) {
  var i = tonalPitch.asIvlPitch(ivl);
  var s = i ? tonalPitch.chr(i) : Math.round(ivl);
  return isNaN(s) ? null : CLASSES[Math.abs(s) % 12]
}

var TYPES = 'PMMPPMM';
/**
 * Get interval type. Can be perfectable (1, 4, 5) or majorable (2, 3, 6, 7)
 * It does NOT return the actual quality.
 *
 * @param {String|Pitch} interval
 * @return {String} 'P' for perfectables, 'M' for majorables or null if not
 * valid interval
 * @example
 * interval.type('5A') // => 'P'
 */
function type (ivl) {
  var i = tonalPitch.asIvlPitch(ivl);
  return i ? TYPES[tonalPitch.decode(i)[0]] : null
}

/**
 * Get the inversion (https://en.wikipedia.org/wiki/Inversion_(music)#Intervals)
 * of an interval.
 *
 * @function
 * @param {String|Pitch} interval - the interval to invert in interval shorthand
 * notation or interval array notation
 * @return {String|Pitch} the inverted interval
 *
 * @example
 * interval.invert('3m') // => '6M'
 * interval.invert('2M') // => '7m'
 */
var invert = tonalPitch.ivlFn(function (i) {
  var d = tonalPitch.decode(i);
  // d = [step, alt, oct]
  var step = (7 - d[0]) % 7;
  var alt = TYPES[d[0]] === 'P' ? -d[1] : -(d[1] + 1);
  return tonalPitch.encode(step, alt, d[2], tonalPitch.dir(i))
});

/**
 * Get the simplified version of an interval.
 *
 * @function
 * @param {String|Array} interval - the interval to simplify
 * @return {String|Array} the simplified interval
 *
 * @example
 * interval.simplify('9M') // => '2M'
 * ['8P', '9M', '10M', '11P', '12P', '13M', '14M', '15P'].map(interval.simplify)
 * // => [ '8P', '2M', '3M', '4P', '5P', '6M', '7M', '8P' ]
 * interval.simplify('2M') // => '2M'
 * interval.simplify('-2M') // => '7m'
 */
var simplify = tonalPitch.ivlFn(function (i) {
  // decode to [step, alt, octave]
  var dec = tonalPitch.decode(i);
  // if it's not 8 reduce the octaves to 0
  if (dec[0] !== 0 || dec[2] !== 1) dec[2] = 0;
  // encode back
  return tonalPitch.encode(dec[0], dec[1], dec[2], tonalPitch.dir(i))
});

exports.toInterval = toInterval;
exports.num = num;
exports.value = value;
exports.props = props;
exports.fromProps = fromProps;
exports.semitones = semitones;
exports.fromSemitones = fromSemitones;
exports.ic = ic;
exports.type = type;
exports.invert = invert;
exports.simplify = simplify;

},{"interval-notation":20,"tonal-pitch":37}],32:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalNotation = require('tonal-notation');
var tonalTranspose = require('tonal-transpose');
var tonalNote = require('tonal-note');
var tonalRange = require('tonal-range');
var tonalArray = require('tonal-array');
var tonalHarmonizer = require('tonal-harmonizer');

/**
 * _Key_ refers to the tonal system based on the major and minor scales. This is
 * is the most common tonal system, but tonality can be present in music
 * based in other scales or concepts.
 *
 * This is a collection of functions related to keys.
 *
 * @example
 * var key = require('tonal-key')
 * key.scale('E mixolydian') // => [ 'E', 'F#', 'G#', 'A', 'B', 'C#', 'D' ]
 * key.relative('minor', 'C major') // => 'A minor'
 *
 * @module key
 */

// Order matters: use an array
var MODES = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian',
  'aeolian', 'locrian', 'major', 'minor'];
// { C: 0, D: 2, E: 4, F: -1, G: 1, A: 3, B: 5 }
var FIFTHS = [0, 2, 4, -1, 1, 3, 5, 0, 3];
var SCALES = [0, 1, 2, 3, 4, 5, 6, 0, 5].map(function (n) {
  return tonalHarmonizer.harmonics(tonalArray.rotate(n, ['C', 'D', 'E', 'F', 'G', 'A', 'B']))
});

// PRIVATE
// Given a tonic, mode pair, return the key string
function toKey (t, m) { return !t ? m : t + ' ' + m }
// Given the alterations, return the major key
function majorKey (n) { return toKey(tonalTranspose.trFifths('C', n), 'major') }
// given the mode name, return the alterations
function modeNum (mode) { return FIFTHS[MODES.indexOf(mode)] }
// given a string, return the valid mode it represents or null
function validMode (m) {
  m = m.trim().toLowerCase();
  return MODES.indexOf(m) === -1 ? null : m
}

/**
 * Return the key properties, an object with { tonic, mode }
 *
 * @param {String} name - the key name
 * @return {Key} the key properties object or null if not a valid key
 * @example
 * var key = require('tonal-key')
 * key.props('C3 dorian') // => { tonic: 'C', mode: 'dorian' }
 * key.props('dorian') // => { tonic: false, mode: 'dorian' }
 * key.props('Ab bebop') // => null
 * key.props('blah') // => null
 */
function props (str) {
  if (typeof str !== 'string') return null
  var ndx = str.indexOf(' ');
  var key;
  if (ndx === -1) {
    var p = tonalNote.pc(str);
    key = p ? { tonic: p, mode: 'major' }
      : { tonic: false, mode: validMode(str) };
  } else {
    key = { tonic: tonalNote.pc(str.slice(0, ndx)), mode: validMode(str.slice(ndx + 1)) };
  }
  return key.mode ? key : null
}

/**
 * Test if a given name is a valid key name
 *
 * @param {String} name
 * @param {Boolean}
 * @example
 * key.isKeyName('C major') // => true
 * key.isKeyName('major') // => true
 * key.isKeyName('Bb bebop') // => false
 */
function isKeyName (name) {
  return props(name) !== null
}

/**
 * Get the tonic of a key
 *
 * @param {String} key - the key
 * @return {String} the tonic or false is no tonic, or null if its not a valid key
 * @example
 * key.tonic('c3 major') // => 'C'
 * key.tonic('minor') // => false
 * key.tonic('bebop') // null
 */
function tonic (key) {
  return (props(key) || key || {}).tonic || null
}

/**
 * Get the mode of a key. It can be used to test if its a valid key mode.
 *
 * @param {String}
 * @return {Boolean}
 * @example
 * key.mode('A dorian') // => 'dorian'
 * key.mode('DORIAN') // => 'dorian'
 * key.mode('mixophrygian') // => null
 */
function mode (key) {
  return (props(key) || key || {}).mode || null
}

/**
 * Get relative of a key. Two keys are relative when the have the same
 * key signature (for example C major and A minor)
 *
 * It can be partially applied.
 *
 * @param {String} mode - the relative destination
 * @param {String} key - the key source
 * @example
 * key.relative('dorian', 'B major') // => 'C# dorian'
 * // partial application
 * var minor = key.relative('minor')
 * minor('C major') // => 'A minor'
 * minor('E major') // => 'C# minor'
 */
function relative (rel, key) {
  if (arguments.length === 1) return function (k) { return relative(rel, k) }
  rel = props(rel);
  if (!rel || rel.tonic) return null
  key = props(key);
  if (!key || !key.tonic) return null
  var tonic = tonalTranspose.trFifths(key.tonic, modeNum(rel.mode) - modeNum(key.mode));
  return toKey(tonic, rel.mode)
}

/**
 * Get a list of the altered notes of a given key. The notes will be in
 * the same order than in the key signature.
 * @param {String|Nunber} key
 * @return {Array}
 * @example
 * var key = require('tonal-keys')
 * key.alteredNotes('Eb major') // => [ 'Bb', 'Eb', 'Ab' ]
 */
function alteredNotes (key) {
  var alt = alteration(key);
  return alt === null ? null
    : alt < 0 ? tonalRange.numeric([-1, alt]).map(tonalTranspose.trFifths('F'))
    : tonalRange.numeric([1, alt]).map(tonalTranspose.trFifths('B'))
}

/**
 * Get a list of valid mode names. The list of modes will be always in
 * increasing order (ionian to locrian)
 *
 * @param {Boolean} alias - true to get aliases names
 * @return {Array} an array of strings
 * @example
 * key.modes() // => [ 'ionian', 'dorian', 'phrygian', 'lydian',
 * // 'mixolydian', 'aeolian', 'locrian' ]
 * key.modes(true) // => [ 'ionian', 'dorian', 'phrygian', 'lydian',
 * // 'mixolydian', 'aeolian', 'locrian', 'major', 'minor' ]
 */
function modes (alias) {
  return alias ? MODES.slice() : MODES.slice(0, -2)
}

/**
 * Create a major key from alterations
 * @function
 * @param {Integer} alt - the alteration number (positive sharps, negative flats)
 * @return {Key} the key object
 * @example
 * var key = require('tonal-key')
 * key.fromAlter(2) // => 'D major'
 */
function fromAlter (n) {
  return typeof n === 'number' ? majorKey(n) : null
}

/**
 * Get key name from accidentals
 *
 * @param {String} acc - the accidentals string
 * @return {Key} the key object
 * @example
 * var key = require('tonal-key')
 * key.fromAcc('b') // => 'F major'
 * key.fromAcc('##') // => 'D major'
 */
function fromAcc (s) {
  return tonalNotation.areSharps(s) ? majorKey(s.length)
    : tonalNotation.areFlats(s) ? majorKey(-s.length)
    : null
}

/**
 * Get scale of a key
 *
 * @param {String|Object} key
 * @return {Array} the key scale
 * @example
 * key.scale('A major') // => [ 'A', 'B', 'C#', 'D', 'E', 'F#', 'G#' ]
 * key.scale('Bb minor') // => [ 'Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'Ab' ]
 * key.scale('C dorian') // => [ 'C', 'D', 'Eb', 'F', 'G', 'A', 'Bb' ]
 * key.scale('E mixolydian') // => [ 'E', 'F#', 'G#', 'A', 'B', 'C#', 'D' ]
 */
function scale (key) {
  var p = props(key);
  if (!p || !p.tonic) return null
  return tonalHarmonizer.harmonize(SCALES[MODES.indexOf(p.mode)], p.tonic)
}

/**
 * Get key alteration. The alteration is a number indicating the number of
 * sharpen notes (positive) or flaten notes (negative)
 * @param {String|Integer} key
 * @return {Integer}
 * @example
 * var key = require('tonal-keys')
 * key.alteration('A major') // => 3
 */
function alteration (key) {
  var k = props(key);
  if (!k || !k.tonic) return null
  var toMajor = modeNum(k.mode);
  var toC = tonalNote.pcFifths(k.tonic);
  return toC - toMajor
}

/**
 * Get the signature of a key. The signature is a string with sharps or flats.
 * @example
 * var key = require('tonal-keys')
 * key.signature('A major') // => '###'
 */
function signature (key) {
  return tonalNotation.toAcc(alteration(key))
}

/**
 * An alias for `signature()`
 * @function
 */
var accidentals = signature;

exports.props = props;
exports.isKeyName = isKeyName;
exports.tonic = tonic;
exports.mode = mode;
exports.relative = relative;
exports.alteredNotes = alteredNotes;
exports.modes = modes;
exports.fromAlter = fromAlter;
exports.fromAcc = fromAcc;
exports.scale = scale;
exports.alteration = alteration;
exports.signature = signature;
exports.accidentals = accidentals;

},{"tonal-array":24,"tonal-harmonizer":30,"tonal-notation":34,"tonal-note":35,"tonal-range":40,"tonal-transpose":43}],33:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var noteParser = require('note-parser');

/**
 * A midi note number is a number representation of a note pitch. It can be
 * integers so it's equal tempered tuned, or float to indicate it's not
 * tuned into equal temepered scale.
 *
 * This module contains functions to convert to and from midi notes.
 *
 * @example
 * var midi = require('tonal-midi')
 * midi.toMidi('A4') // => 69
 * midi.note(69) // => 'A4'
 * midi.note(61) // => 'Db4'
 * midi.note(61, true) // => 'C#4'
 *
 * @module midi
 */

/**
 * Convert the given note to a midi note number. If you pass a midi number it
 * will returned as is.
 *
 * @param {Array|String|Number} note - the note to get the midi number from
 * @return {Integer} the midi number or null if not valid pitch
 * @example
 * midi.toMidi('C4') // => 60
 * midi.toMidi(60) // => 60
 * midi.toMidi('60') // => 60
 */
function toMidi (val) {
  if (Array.isArray(val) && val.length === 2) return val[0] * 7 + val[1] * 12 + 12
  return noteParser.midi(val)
}

var FLATS = 'C Db D Eb E F Gb G Ab A Bb B'.split(' ');
var SHARPS = 'C C# D D# E F F# G G# A A# B'.split(' ');

/**
 * Given a midi number, returns a note name. The altered notes will have
 * flats unless explicitly set with the optional `useSharps` parameter.
 *
 * @function
 * @param {Integer} midi - the midi note number
 * @param {Boolean} useSharps - (Optional) set to true to use sharps instead of flats
 * @return {String} the note name
 * @example
 * var midi = require('tonal-midi')
 * midi.note(61) // => 'Db4'
 * midi.note(61, true) // => 'C#4'
 * // it rounds to nearest note
 * midi.note(61.7) // => 'D4'
 */
function note (num, sharps) {
  if (num === true || num === false) return function (m) { return note(m, num) }
  num = Math.round(num);
  var pcs = sharps === true ? SHARPS : FLATS;
  var pc = pcs[num % 12];
  var o = Math.floor(num / 12) - 1;
  return pc + o
}

exports.toMidi = toMidi;
exports.note = note;

},{"note-parser":22}],34:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * Functions related to music notation in strings. Things like parse accidentals,
 * or convert from step to note letter.
 *
 * Glossary:
 *
 * - step: the number from 0 to 6 representing the letters from C to B
 * - letter: a valid note letter (from A to G)
 * - alteration: a number indicating the sharps (positive) or flats (negative)
 * - accidentals: a string with sharps (#) or flats (b)
 *
 * @example
 * var notation = require('tonal-notation')
 * notation.toAcc('3') // => '###'
 * notation.toAcc('-3') // => 'bbb'
 * notation.toAlt('###') // => 3
 * @module notation
 */

/**
 * Given a letter, return step
 * @param {String} letter - the letter
 * @return {Integer} the step number (from 0 to 6)
 */
function toStep (l) {
  var s = 'CDEFGAB'.indexOf(l.toUpperCase());
  return s < 0 ? null : s
}

/**
 * Test if a number is a valid step number (a number from 0 to 6)
 * @param {Integer} step - the step number
 * @return {Boolean} true if it's a valid step number, false otherwise
 */
function isStep (d) { return !(d < 0 || d > 6) }

/**
 * Given a step, return a letter
 * @param {Integer} step - the step number
 * @return {String} the note letter or null if not valid step number
 */
function toLetter (s) {
  return isStep(s) ? 'CDEFGAB'.charAt(s) : null
}

// ACCIDENTALS
// ===========

/**
 * Test if a string are all flats (`b`) chars
 * @param {String} str - the string to test
 * @return {Boolean} true if all charaters are `b`, false otherwise
 */
function areFlats (s) { return /^b+$/.test(s) }
/**
 * Test if a string are all sharps (`#`) chars
 * @param {String} str - the string to test
 * @return {Boolean} true if all charaters are `#`, false otherwise
 */
function areSharps (s) { return /^#+$/.test(s) }

/**
 * Given an accidentals string return its alteration, the number
 * of semitones (positive for sharps, negative for flats, 0 for none)
 * @param {String} accidentals - the string to parse
 * @return {Integer} the alteration number of null if not a valid accidental strings
 * @example
 * toAlt('###') // => 3
 * toAlt('bbb') // => -3
 */
function toAlt (s) {
  return s === '' ? 0
    : areFlats(s) ? -s.length
    : areSharps(s) ? s.length
    : null
}

function fillStr (s, num) { return Array(num + 1).join(s) }

/**
 * Given an alteration number, returns the accidentals string
 * @param {Integer} alteration - the number of semitones (positive and negative
 * values are accepted for sharps and flats)
 * @return {String} the accidental string
 * @example
 * toAcc(3) // => '###'
 * toAcc(-3) // => 'bbb'
 */
function toAcc (n) {
  return !n ? '' : n < 0 ? fillStr('b', -n) : fillStr('#', n)
}

exports.toStep = toStep;
exports.isStep = isStep;
exports.toLetter = toLetter;
exports.areFlats = areFlats;
exports.areSharps = areSharps;
exports.toAlt = toAlt;
exports.toAcc = toAcc;

},{}],35:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var noteParser = require('note-parser');
var tonalPitch = require('tonal-pitch');
var tonalTranspose = require('tonal-transpose');
var tonalMidi = require('tonal-midi');
var tonalFreq = require('tonal-freq');

/**
 * [![npm version](https://img.shields.io/npm/v/tonal-note.svg)](https://www.npmjs.com/package/tonal-note)
 * [![tonal](https://img.shields.io/badge/tonal-note-yellow.svg)](https://www.npmjs.com/browse/keyword/tonal)
 *
 * `tonal-note` is a collection of functions to manipulate musical notes in scientific notation
 *
 * This is part of [tonal](https://www.npmjs.com/package/tonal) music theory library.
 *
 * ## Usage
 *
 * ```js
 * import * as note from 'tonal-note'
 * // or var note = require('tonal-note')
 * note.name('bb2') // => 'Bb2'
 * note.chroma('bb2') // => 10
 * note.enharmonics('C#6') // => [ 'B##5', 'C#6', 'Db6' ]
 * note.simplify('B#3') // => 'C4'
 *
 * // using ES6 import syntax
 * import { name } from 'tonal-note'
 * ['c', 'db3', '2', 'g+', 'gx4'].map(name)
 * // => ['C', 'Db3', null, null, 'G##4']
 * ```
 *
 * ## Install
 *
 * [![npm install tonal-note](https://nodei.co/npm/tonal-note.png?mini=true)](https://npmjs.org/package/tonal-note/)
 *
 * ## API Documentation
 *
 * @module note
 */
var cache = {};
function parseNote (name) {
  if (typeof name !== 'string') return null
  return cache[name] || (cache[name] = noteParser.parse(name))
}

/**
 * Get the note midi number
 * (an alias of tonal-midi `toMidi` function)
 *
 * @function
 * @param {Array|String|Number} note - the note to get the midi number from
 * @return {Integer} the midi number or null if not valid pitch
 * @example
 * note.midi('C4') // => 60
 * @see midi.toMidi
 */
var midi = tonalMidi.toMidi;

/**
 * Get the note name of a given midi note number
 * (an alias of tonal-midi `note` function)
 *
 * @function
 * @param {Integer} midi - the midi note number
 * @param {Boolean} useSharps - (Optional) set to true to use sharps instead of flats
 * @return {String} the note name
 * @example
 * note.fromMidi(60) // => 'C4'
 * @see midi.note
 */
var fromMidi = tonalMidi.note;

/**
 * Get the frequency of a note
 * (an alias of the tonal-note package `toFreq` function)
 *
 * @function
 * @param {Array|String|Number} note - the note to get the frequency
 * @return {Number} the frequency
 * @example
 * note.freq('A4') // => 440
 * @see freq.toFreq
 */
var freq = tonalFreq.toFreq;

/**
 * Return the chroma of a note. The chroma is the numeric equivalent to the
 * pitch class, where 0 is C, 1 is C# or Db, 2 is D... 11 is B
 *
 * @param {String|Pitch} note
 * @return {Integer} the chroma
 * @example
 * var note = require('tonal-note')
 * note.chroma('Cb') // => 11
 * ['C', 'D', 'E', 'F'].map(note.chroma) // => [0, 2, 4, 5]
 */
function chroma (n) {
  var p = parseNote(n);
  return p ? p.chroma : null
}

/**
 * Given a note (as string or as array notation) returns a string
 * with the note name in scientific notation or null
 * if not valid note
 *
 * Can be used to test if a string is a valid note name.
 *
 * @function
 * @param {Pitch|String}
 * @return {String}
 *
 * @example
 * var note = require('tonal-note')
 * note.name('cb2') // => 'Cb2'
 * ['c', 'db3', '2', 'g+', 'gx4'].map(note.name) // => ['C', 'Db3', null, null, 'G##4']
 */
function name (n) {
  var p = tonalPitch.asNotePitch(n);
  return p ? tonalPitch.strNote(p) : null
}

/**
 * @deprecated
 * An alias for note. Get the name of a note in scientific notation
 * @function
 */
function note$1 (n) {
  console.warn('note.note() is deprecated. Use note.name()');
  return name(n)
}

/**
 * @deprecated
 * Get note properties. It returns an object with the following properties:
 *
 * - step: 0 for C, 6 for B. Do not confuse with chroma
 * - alt: 0 for not accidentals, positive sharps, negative flats
 * - oct: the octave number or undefined if a pitch class
 *
 * @param {String|Pitch} note - the note
 * @return {Object} the object with note properties or null if not valid note
 * @example
 * note.props('Db3') // => { step: 1, alt: -1, oct: 3 }
 * note.props('C#') // => { step: 0, alt: 1, oct: undefined }
 */
function props (n) {
  console.warn('note.props() is deprecated. Use: note.step(), note.alt() or note.oct()');
  var p = tonalPitch.asNotePitch(n);
  if (!p) return null
  var d = tonalPitch.decode(p);
  return { step: d[0], alt: d[1], oct: d[2] }
}

/**
 * @deprecated
 * Given a note properties object, return the string representation if
 * scientific notation
 *
 * @param {Object} noteProps - an object with the following attributes:
 * @return {String} the note name
 *
 * - step: a number from 0 to 6 meaning note step letter from 'C' to 'B'
 * - alt: the accidentals as number (0 no accidentals, 1 is '#', 2 is '##', -2 is 'bb')
 * - oct: (Optional) the octave. If not present (or undefined) it returns a pitch class
 *
 * @example
 * note.fromProps({ step: 1, alt: -1, oct: 5 }) // => 'Db5'
 * note.fromProps({ step: 0, alt: 1 }) // => 'C#'
 */
function fromProps (props) {
  console.warn('note.fromProps() is deprecated. See npm package note-parser.');
  return props ? noteParser.build(props.step, props.alt, props.oct) : null
}

function getProp (name) {
  return function (n) { var p = props(n); return p ? p[name] : null }
}

/**
 * Get the octave of the given pitch
 *
 * @function
 * @param {String|Pitch} note - the note
 * @return {Integer} the octave, undefined if its a pitch class or null if
 * not a valid note
 * @example
 * note.oct('C#4') // => 4
 * note.oct('C') // => undefined
 * note.oct('blah') // => undefined
 */
var oct = getProp('oct');

/**
 * Get the note step: a number equivalent of the note letter. 0 means C and
 * 6 means B. This is different from `chroma` (see example)
 *
 * @function
 * @param {String|Pitch} note - the note
 * @return {Integer} a number between 0 and 6 or null if not a note
 * @example
 * note.step('C') // => 0
 * note.step('Cb') // => 0
 * // usually what you need is chroma
 * note.chroma('Cb') // => 6
 */
var step = getProp('step');

/**
 * @deprecated
 * Get the note step in fifths from 'C'. One property of the perfect fifth
 * interval is that you can obtain any pitch class by transposing 'C' a
 * number of times. This function return that number.
 * @param {String|Pitch} note - the note (can be a pitch class)
 * @return {Integer} the number of fifths to reach that pitch class from 'C'
 */
function pcFifths (note$$1) {
  console.warn('note.pcFifths() is deprecated. Use distance.inFifths()');
  var p = tonalPitch.asNotePitch(note$$1);
  return p ? tonalPitch.fifths(p) : null
}

/**
 * Get the note alteration: a number equivalent to the accidentals. 0 means
 * no accidentals, negative numbers are for flats, positive for sharps
 *
 * @function
 * @param {String|Pitch} note - the note
 * @return {Integer} the alteration
 * @example
 * note.alt('C') // => 0
 * note.alt('C#') // => 1
 * note.alt('Cb') // => -1
 */
var alt = getProp('alt');

/**
 * Get pitch class of a note. The note can be a string or a pitch array.
 *
 * @function
 * @param {String|Pitch}
 * @return {String} the pitch class
 * @example
 * tonal.pc('Db3') // => 'Db'
 * tonal.map(tonal.pc, 'db3 bb6 fx2') // => [ 'Db', 'Bb', 'F##']
 */
function pc (n) {
  var p = tonalPitch.asNotePitch(n);
  return p ? tonalPitch.strNote([ p[0], [ tonalPitch.fifths(p) ] ]) : null
}

var ASC = tonalPitch.parseIvl('2d');
var DESC = tonalPitch.parseIvl('-2d');

/**
 * Get the enharmonics of a note. It returns an array of three elements: the
 * below enharmonic, the note, and the upper enharmonic
 *
 * @param {String} note - the note to get the enharmonics from
 * @return {Array} an array of pitches ordered by distance to the given one
 *
 * @example
 * var note = require('tonal-note')
 * note.enharmonics('C') // => ['B#', 'C', 'Dbb']
 * note.enharmonics('A') // => ['G##', 'A', 'Bbb']
 * note.enharmonics('C#4') // => ['B##3', 'C#4' 'Db4']
 * note.enharmonics('Db') // => ['C#', 'Db', 'Ebbb'])
 */
function enharmonics (pitch) {
  var notes = [];
  notes.push(tonalTranspose.transpose(DESC, pitch));
  if (notes[0] === null) return null
  notes.push(pitch);
  notes.push(tonalTranspose.transpose(ASC, pitch));
  return notes
}

/**
 * Get a simpler enharmonic note name from a note if exists
 *
 * @param {String} note - the note to simplify
 * @return {String} the simplfiied note (if not found, return same note)
 *
 * @example
 * var note = require('tonal-note')
 * note.simplify('B#3') // => 'C4'
 */
function simplify (pitch) {
  return enharmonics(pitch).reduce(function (simple, next) {
    if (!simple) return next
    return simple.length > next.length ? next : simple
  }, null)
}

exports.midi = midi;
exports.fromMidi = fromMidi;
exports.freq = freq;
exports.chroma = chroma;
exports.name = name;
exports.note = note$1;
exports.props = props;
exports.fromProps = fromProps;
exports.oct = oct;
exports.step = step;
exports.pcFifths = pcFifths;
exports.alt = alt;
exports.pc = pc;
exports.enharmonics = enharmonics;
exports.simplify = simplify;

},{"note-parser":22,"tonal-freq":29,"tonal-midi":33,"tonal-pitch":37,"tonal-transpose":43}],36:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalPitch = require('tonal-pitch');
var tonalNote = require('tonal-note');
var tonalArray = require('tonal-array');
var tonalTranspose = require('tonal-transpose');

/**
 * [![npm version](https://img.shields.io/npm/v/tonal-pcset.svg?style=flat-square)](https://www.npmjs.com/package/tonal-pcset)
 * [![tonal](https://img.shields.io/badge/tonal-pcset-yellow.svg?style=flat-square)](https://www.npmjs.com/browse/keyword/tonal)
 *
 * `tonal-pcset` is a collection of functions to work with pitch class sets, oriented
 * to make comparations (isEqual, isSubset, isSuperset)
 *
 * This is part of [tonal](https://www.npmjs.com/package/tonal) music theory library.
 *
 * You can install via npm: `npm i --save tonal-pcset`
 *
 * ```js
 * var pcset = require('tonal-pcset')
 * pcset.isEqual('c2 d5 e6', 'c6 e3 d1') // => true
 * ```
 *
 * ## API documentation
 *
 * @module pcset
 */
function chrToInt (set) { return parseInt(chroma(set), 2) }
function pitchChr (p) { p = tonalPitch.asPitch(p); return p ? tonalPitch.chr(p) : null }

/**
 * Get chroma of a pitch class set. A chroma identifies each set uniquely.
 * It's a 12-digit binary each presenting one semitone of the octave.
 *
 * Note that this function accepts a chroma as parameter and return it
 * without modification.
 *
 * @param {Array|String} set - the pitch class set
 * @return {String} a binary representation of the pitch class set
 * @example
 * pcset.chroma('C D E') // => '1010100000000'
 */
function chroma (set) {
  if (isChroma(set)) return set
  var b = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  tonalArray.map(pitchChr, set).forEach(function (i) {
    b[i] = 1;
  });
  return b.join('')
}

/**
 * @deprecated
 * @see collection.pcset
 * Given a list of notes, return the pitch class names of the set
 * starting with the first note of the list
 * @param {String|Array} notes - the pitch class set notes
 * @return {Array} an array of pitch class sets
 */
function notes (notes) {
  // FIXME: move to collection
  console.warn('pcset.notes deprecated. Use collection.pcset');
  var pcs = tonalArray.map(tonalNote.pc, notes);
  if (!pcs.length) return pcs
  var tonic = pcs[0];
  // since the first note of the chroma is always C, we have to rotate it
  var rotated = tonalArray.rotate(pitchChr(tonic), chroma(pcs).split('')).join('');
  return fromChroma(rotated, tonic)
}

/**
 * Given a a list of notes or a pcset chroma, produce the rotations
 * of the chroma discarding the ones that starts with '0'
 *
 * This is used, for example, to get all the modes of a scale.
 *
 * @param {Array|String} set - the list of notes or pitchChr of the set
 * @param {Boolean} normalize - (Optional, true by default) remove all
 * the rotations that starts with '0'
 * @return {Array<String>} an array with all the modes of the chroma
 *
 * @example
 * pcset.modes('C E G')
 */
function modes (set, normalize) {
  normalize = normalize !== false;
  var binary = chroma(set).split('');
  return tonalArray.compact(binary.map(function (_, i) {
    var r = tonalArray.rotate(i, binary);
    return normalize && r[0] === '0' ? null : r.join('')
  }))
}
/**
 * @deprecated
 * @see modes
 */
function chromaModes (set, norm) {
  console.warn('pcset.chromaModes deprecated. Renamed to pcset.modes');
  return modes(set, norm)
}

var REGEX = /^[01]{12}$/;

/**
 * Test if the given string is a pitch class set chroma.
 * @param {String} chroma - the pitch class set chroma
 * @return {Boolean} true if its a valid pcset chroma
 * @example
 * pcset.isChroma('101010101010') // => true
 * pcset.isChroma('101001') // => false
 */
function isChroma (set) {
  return REGEX.test(set)
}

var IVLS = '1P 2m 2M 3m 3M 4P 5d 5P 6m 6M 7m 7M'.split(' ');
/**
 * Given a pcset (notes or chroma) return it's intervals
 * @param {String|Array} pcset - the pitch class set (notes or chroma)
 * @return {Array} intervals or empty array if not valid pcset
 * @example
 * pcset.intervals('1010100000000') => ['C', 'D', 'E']
 */
function intervals (set) {
  return tonalArray.compact(chroma(set).split('').map(function (d, i) {
    return d === '1' ? IVLS[i] : null
  }))
}

/**
 * @deprecated
 * @see intervals
 * Given a pitch class set in binary notation it returns the intervals or notes
 * (depending on the tonic)
 * @param {String} binary - the pitch class set in binary representation
 * @param {String|Pitch} tonic - the pitch class set tonic
 * @return {Array} a list of notes or intervals
 * @example
 * pcset.fromChroma('101010101010', 'C') // => ['C', 'D', 'E', 'Gb', 'Ab', 'Bb']
 */
function fromChroma (binary, tonic) {
  console.warn('pcset.fromChroma is deprecated. Use pcset.intervals().map(...)');
  if (arguments.length === 1) return function (t) { return fromChroma(binary, t) }
  if (!tonic) tonic = 'P1';
  return intervals(binary).map(tonalTranspose.transpose(tonic))
}

/**
 * Test if two pitch class sets are identical
 *
 * @param {Array|String} set1 - one of the pitch class sets
 * @param {Array|String} set2 - the other pitch class set
 * @return {Boolean} true if they are equal
 * @example
 * pcset.isEqual('c2 d3', 'c5 d2') // => true
 */
function isEqual (s1, s2) {
  if (arguments.length === 1) return function (s) { return isEqual(s1, s) }
  return chroma(s1) === chroma(s2)
}
function equal (a, b) {
  console.warn('pcset.equal is deprecated. Use pcset.isEqual');
  return isEqual(a, b)
}

/**
 * Test if a pitch class set is a subset of another
 *
 * @param {Array|String} set - the base set to test against
 * @param {Array|String} test - the set to test
 * @return {Boolean} true if the test set is a subset of the set
 * @example
 * pcset.subset('c d e', 'C2 D4 D5 C6') // => true
 */
function isSubset (set, test) {
  if (arguments.length === 1) return function (t) { return isSubset(set, t) }
  test = chrToInt(test);
  return (test & chrToInt(set)) === test
}
function subset (a, b) {
  console.warn('pcset.subset is deprecated. Use pcset.isSubset');
  return isSubset(a, b)
}

/**
 * Test if a pitch class set is a superset
 *
 * @param {Array|String} set - the base set to test against
 * @param {Array|String} test - the set to test
 * @return {Boolean} true if the test set is a superset of the set
 * @example
 * pcset.isSuperset('c d e', 'C2 D4 F4 D5 E5 C6') // => true
 */
function isSuperset (set, test) {
  if (arguments.length === 1) return function (t) { return isSuperset(set, t) }
  test = chrToInt(test);
  return (test | chrToInt(set)) === test
}
function superset (a, b) {
  console.warn('pcset.superset is deprecated. Use pcset.isSuperset');
  return isSuperset(a, b)
}

/**
 * Test if a given pitch class set includes a note
 * @param {Array|String} set - the base set to test against
 * @param {String|Pitch} note - the note to test
 * @return {Boolean} true if the note is included in the pcset
 * @example
 * pcset.includes('c d e', 'C4') // =A true
 * pcset.includes('c d e', 'C#4') // =A false
 */
function includes (set, note) {
  if (arguments.length > 1) return includes(set)(note)
  set = chroma(set);
  return function (note) { return set[pitchChr(note)] === '1' }
}

/**
 * Filter a list with a pitch class set
 *
 * @param {Array|String} set - the pitch class set notes
 * @param {Array|String} notes - the note list to be filtered
 * @return {Array} the filtered notes
 *
 * @example
 * pcset.filter('c d e', 'c2 c#2 d2 c3 c#3 d3') // => [ 'c2', 'd2', 'c3', 'd3' ])
 * pcset.filter('c2', 'c2 c#2 d2 c3 c#3 d3') // => [ 'c2', 'c3' ])
 */
function filter (set, notes) {
  if (arguments.length === 1) return function (n) { return filter(set, n) }
  return tonalArray.asArr(notes).filter(includes(set))
}

exports.chroma = chroma;
exports.notes = notes;
exports.modes = modes;
exports.chromaModes = chromaModes;
exports.isChroma = isChroma;
exports.intervals = intervals;
exports.fromChroma = fromChroma;
exports.isEqual = isEqual;
exports.equal = equal;
exports.isSubset = isSubset;
exports.subset = subset;
exports.isSuperset = isSuperset;
exports.superset = superset;
exports.includes = includes;
exports.filter = filter;

},{"tonal-array":24,"tonal-note":35,"tonal-pitch":37,"tonal-transpose":43}],37:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var noteParser = require('note-parser');
var intervalNotation = require('interval-notation');
var tonalEncoding = require('tonal-encoding');

/**
 * Functions to deal with pitches (either notes or intervals).
 *
 * This functions are very low level and more developer friendly of this functions
 * are exposed in the note and interval packages. It's unlikely you need them.
 * That's why __this module is NOT exported in the tonal package__.
 *
 * @private
 * @module pitch
 */
/**
 * Create a pitch
 * @param {Integer} fifths - the number of fifths from C or from P1
 * @param {Integer} focts - the number of encoded octaves
 * @param {Integer} dir - (Optional) Only required for intervals. Can be 1 or -1
 * @return {Pitch}
 */
function pitch (fifths, focts, dir) {
  return dir ? ['tnlp', [fifths, focts], dir] : ['tnlp', [fifths, focts]]
}
/**
 * Test if an object is a pitch
 * @param {Pitch}
 * @return {Boolean}
 */
function isPitch (p) { return Array.isArray(p) && p[0] === 'tnlp' }
/**
 * Encode a pitch
 * @param {Integer} step
 * @param {Integer} alt
 * @param {Integer} oct
 * @param {Integer} dir - (Optional)
 */
function encode$1 (s, a, o, dir) {
  return dir ? ['tnlp', tonalEncoding.encode(s, a, o), dir] : ['tnlp', tonalEncoding.encode(s, a, o)]
}

/**
 * Decode a pitch
 * @param {Pitch} the pitch
 * @return {Array} An array with [step, alt, oct]
 */
function decode$1 (p) {
  return tonalEncoding.decode.apply(null, p[1])
}

/**
 * Get pitch type
 * @param {Pitch}
 * @return {String} 'ivl' or 'note' or null if not a pitch
 */
function pType (p) {
  return !isPitch(p) ? null : p[2] ? 'ivl' : 'note'
}
/**
 * Test if is a pitch note (with or without octave)
 * @param {Pitch}
 * @return {Boolean}
 */
function isNotePitch (p) { return pType(p) === 'note' }
/**
 * Test if is an interval
 * @param {Pitch}
 * @return {Boolean}
 */
function isIvlPitch (p) { return pType(p) === 'ivl' }
/**
 * Test if is a pitch class (a pitch note without octave)
 * @param {Pitch}
 * @return {Boolean}
 */
function isPC (p) { return isPitch(p) && p[1].length === 1 }

/**
 * Get direction of a pitch (even for notes)
 * @param {Pitch}
 * @return {Integer} 1 or -1
 */
function dir (p) { return p[2] === -1 ? -1 : 1 }

/**
 * Get encoded fifths from pitch.
 * @param {Pitch}
 * @return {Integer}
 */
function fifths (p) { return p[2] === -1 ? -p[1][0] : p[1][0] }
/**
 * Get encoded octaves from pitch.
 * @param {Pitch}
 * @return {Integer}
 */
function focts (p) { return p[2] === -1 ? -p[1][1] : p[1][1] }
/**
 * Get height of a pitch.
 * @param {Pitch}
 * @return {Integer}
 */
function height (p) { return fifths(p) * 7 + focts(p) * 12 }

/**
 * Get chroma of a pitch. The chroma is a number between 0 and 11 to represent
 * the position of a pitch inside an octave. Is the numeric equivlent of a
 * pitch class.
 *
 * @param {Pitch}
 * @return {Integer}
 */
function chr (p) {
  var f = fifths(p);
  return 7 * f - 12 * Math.floor(f * 7 / 12)
}

// memoize parsers
function memoize (fn) {
  var cache = {};
  return function (str) {
    if (typeof str !== 'string') return null
    return cache[str] || (cache[str] = fn(str))
  }
}

/**
 * Parse a note
 * @function
 * @param {String} str
 * @return {Pitch} the pitch or null if not valid note string
 */
var parseNote = memoize(function (s) {
  var p = noteParser.parse(s);
  return p ? encode$1(p.step, p.alt, p.oct) : null
});

/**
 * Parse an interval
 * @function
 * @param {String} str
 * @return {Pitch} the pitch or null if not valid interval string
 */
var parseIvl = memoize(function (s) {
  var p = intervalNotation.parse(s);
  if (!p) return null
  return p ? encode$1(p.simple - 1, p.alt, p.oct, p.dir) : null
});

/**
 * Parse a note or an interval
 * @param {String} str
 * @return {Pitch} the pitch or null if not valid pitch string
 */
function parsePitch (s) { return parseNote(s) || parseIvl(s) }

/**
 * Ensure the given object is a note pitch. If is a string, it will be
 * parsed. If not a note pitch or valid note string, it returns null.
 * @param {Pitch|String}
 * @return {Pitch}
 */
function asNotePitch (p) { return isNotePitch(p) ? p : parseNote(p) }
/**
 * Ensure the given object is a interval pitch. If is a string, it will be
 * parsed. If not a interval pitch or valid interval string, it returns null.
 * @param {Pitch|String}
 * @return {Pitch}
 */
function asIvlPitch (p) { return isIvlPitch(p) ? p : parseIvl(p) }
/**
 * Ensure the given object is a pitch. If is a string, it will be
 * parsed. If not a pitch or valid pitch string, it returns null.
 * @param {Pitch|String}
 * @return {Pitch}
 */
function asPitch (p) { return isPitch(p) ? p : parsePitch(p) }

/**
 * Convert a note pitch to string representation
 * @param {Pitch}
 * @return {String}
 */
function strNote (p) {
  if (!isNotePitch(p)) return null
  return noteParser.build.apply(null, decode$1(p))
}

/**
 * Convert a interval pitch to string representation
 * @param {Pitch}
 * @return {String}
 */
function strIvl (p) {
  if (!isIvlPitch(p)) return null
  // decode to [step, alt, oct]
  var d = decode$1(p);
  // d = [step, alt, oct]
  var num = d[0] + 1 + 7 * d[2];
  return p[2] * num + intervalNotation.altToQ(num, d[1])
}

/**
 * Convert a pitch to string representation (either notes or intervals)
 * @param {Pitch}
 * @return {String}
 */
function strPitch (p) { return strNote(p) || strIvl(p) }

// A function that creates a decorator
// The returned function can _decorate_ other functions to parse and build
// string representations
function decorator (is, parse$$1, str) {
  return function (fn) {
    return function (v) {
      var i = is(v);
      // if the value is in pitch notation no conversion
      if (i) return fn(v)
      // else parse the pitch
      var p = parse$$1(v);
      // if parsed, apply function and back to string
      return p ? str(fn(p)) : null
    }
  }
}

/**
 * Decorate a function to work internally with note pitches, even if the
 * parameters are provided as strings. Also it converts back the result
 * to string if a note pitch is returned.
 * @function
 * @param {Function} fn
 * @return {Function} the decorated function
 */
var noteFn = decorator(isNotePitch, parseNote, strNote);
/**
 * Decorate a function to work internally with interval pitches, even if the
 * parameters are provided as strings. Also it converts back the result
 * to string if a interval pitch is returned.
 * @function
 * @param {Function} fn
 * @return {Function} the decorated function
 */
var ivlFn = decorator(isIvlPitch, parseIvl, strIvl);
/**
 * Decorate a function to work internally with pitches, even if the
 * parameters are provided as strings. Also it converts back the result
 * to string if a pitch is returned.
 * @function
 * @param {Function} fn
 * @return {Function} the decorated function
 */
var pitchFn = decorator(isPitch, parsePitch, strPitch);

exports.pitch = pitch;
exports.isPitch = isPitch;
exports.encode = encode$1;
exports.decode = decode$1;
exports.pType = pType;
exports.isNotePitch = isNotePitch;
exports.isIvlPitch = isIvlPitch;
exports.isPC = isPC;
exports.dir = dir;
exports.fifths = fifths;
exports.focts = focts;
exports.height = height;
exports.chr = chr;
exports.parseNote = parseNote;
exports.parseIvl = parseIvl;
exports.parsePitch = parsePitch;
exports.asNotePitch = asNotePitch;
exports.asIvlPitch = asIvlPitch;
exports.asPitch = asPitch;
exports.strNote = strNote;
exports.strIvl = strIvl;
exports.strPitch = strPitch;
exports.noteFn = noteFn;
exports.ivlFn = ivlFn;
exports.pitchFn = pitchFn;

},{"interval-notation":20,"note-parser":22,"tonal-encoding":28}],38:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalArray = require('tonal-array');

/**
 * Functions to create and manipulate pitch sets
 *
 * @example
 * var pitchset = require('tonal-pitchset')
 *
 * @module pitchset
 */
/**
 * Get the notes of a pitch set. The notes in the set are sorted in asceding
 * pitch order, and no repetitions are allowed.
 *
 * Note that it creates pitch sets and NOT picth class sets. This functionallity
 * resides inside `tonal-pcset` module.
 *
 * @param {String|Array} notes - the notes to create the pitch set from
 * @return {Array<String>} the ordered pitch set notes
 * @example
 * pitchset.notes('C4 c3 C5 c4') // => ['C3', 'C4', 'C5']
 */
function notes (notes) {
  return tonalArray.sort(notes).filter(function (n, i, arr) {
    return i === 0 || n !== arr[i - 1]
  })
}

exports.notes = notes;

},{"tonal-array":24}],39:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalNote = require('tonal-note');
var tonalInterval = require('tonal-interval');
var tonalArray = require('tonal-array');
var tonalTranspose = require('tonal-transpose');
var tonalDistance = require('tonal-distance');
var tonalChord = require('tonal-chord');
var tonalNotation = require('tonal-notation');

/**
 * # `tonal-progressions`
 * > Describe and manipulate chord progressions.
 *
 * @example
 * var progression = require('tonal-progression')
 * progression.abstract('Cmaj7 Dm7 G7', 'C')
 *
 * @module progression
 */
/**
 * Given a chord progression and a tonic, return the chord progression
 * with roman numeral chords.
 *
 * @param {Array|String} chords - the chord progression
 * @param {String} tonic - the tonic
 * @return {Array} the chord progression in roman numerals
 * @example
 * progression.abstract('Cmaj7 Dm7 G7', 'C') // => [ 'Imaj7', 'IIm7', 'V7' ]
 */
function abstract (chords, tonic) {
  tonic = tonalNote.pc(tonic);
  chords = tonalArray.map(tonalChord.parse, chords);
  var tonics = tonalArray.compact(chords.map(function (x) { return x.tonic }));
  // if some tonic missing, can't do the analysis
  if (tonics.length !== chords.length) return null

  return tonics.map(function (t, i) {
    var p = tonalInterval.props(tonalDistance.interval(tonic, t));
    return buildRoman(p.num - 1, p.alt, chords[i].type)
  })
}

var NUMS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
/**
 * Build an abstract chord name using roman numerals
 */
function buildRoman (num, alt, element) {
  return tonalNotation.toAcc(alt) + NUMS[num % 7] + (element || '')
}

/**
 * Get chord progression from a tonic and a list of chord in roman numerals
 *
 * @param {String} tonic - the tonic
 * @param {Array|String} progression - the progression in roman numerals
 * @return {Array} the chord progression
 *
 * @example
 * var progression = require('chord-progression')
 * progression.concrete('I IIm7 V7', 'C') // => ['C', 'Dm7', 'G7']
 */
function concrete (chords, tonic) {
  return tonalArray.map(function (e) {
    var r = parseRomanChord(e);
    return r ? tonalTranspose.transpose(r.root, tonic) + r.type : null
  }, chords)
}

var ROMAN = /^\s*(b|bb|#|##|)(IV|III|II|I|VII|VI|V|iv|iii|ii|i|vii|vi|v)\s*(.*)\s*$/;
/**
 * Returns a regex to match roman numbers literals with the from:
 * `[accidentals]roman[element]`.
 *
 * The executed regex contains:
 *
 * - input: the input string
 * - accidentals: (Optional) one or two flats (b) or shaprs (#)
 * - roman: (Required) a roman numeral from I to VII either in upper or lower case
 * - element: (Optional) a name of an element
 *
 * @return {RegExp} the regexp
 *
 * @example
 * var r = progression.romanRegex()
 * r.exec('bVImaj7') // => ['bVImaj7', 'b', 'VI', 'maj7'])
 * r.exec('III dom') // => ['III dom', '', 'III', 'dom'])
 */
function romanRegex () { return ROMAN }

var NUM = {i: 0, ii: 1, iii: 2, iv: 3, v: 4, vi: 5, vii: 6};

/**
 * Parse a chord expressed with roman numerals. It returns an interval representing
 * the root of the chord relative to the key tonic and the chord name.
 *
 * @param {String} str - the roman numeral string
 * @return {Object} the roman chord property object with:
 *
 * - type: the chord type
 * - root: the interval from the key to the root of this chord
 *
 * @example
 * var parse = require('music-notation/roman.parse')
 * parse('V7') // => { root: '5P', type: '7' }
 * parse('bIIalt') // => { root: '2m', type: 'alt' }
 */
function parseRomanChord (str) {
  var m = ROMAN.exec(str);
  if (!m) return null
  var num = NUM[m[2].toLowerCase()] + 1;
  var alt = m[1].length;
  if (m[1][0] === 'b') alt = -alt;
  return { root: tonalInterval.fromProps({ num: num, alt: alt, dir: 1 }), type: m[3] }
}

exports.abstract = abstract;
exports.buildRoman = buildRoman;
exports.concrete = concrete;
exports.romanRegex = romanRegex;
exports.parseRomanChord = parseRomanChord;

},{"tonal-array":24,"tonal-chord":25,"tonal-distance":27,"tonal-interval":31,"tonal-notation":34,"tonal-note":35,"tonal-transpose":43}],40:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalArray = require('tonal-array');
var tonalTranspose = require('tonal-transpose');
var tonalMidi = require('tonal-midi');
var tonalPcset = require('tonal-pcset');

/**
 * A collection of functions to create note ranges.
 *
 * @example
 * var range = require('tonal-range')
 * // ascending chromatic range
 * range.chromatic(['C4', 'E4']) // => ['C4', 'Db4', 'D4', 'Eb4', 'E4']
 * // descending chromatic range
 * range.chromatic(['E4', 'C4']) // => ['E4', 'Eb4', 'D4', 'Db4', 'C4']
 * // combining ascending and descending in complex ranges
 * range.chromatic(['C2', 'E2', 'D2']) // => ['C2', 'Db2', 'D2', 'Eb2', 'E2', 'Eb2', 'D2']
 * // numeric (midi note numbers) range
 * range.numeric('C4 E4 Bb3') // => [60, 61, 62, 63, 64]
 * // complex numeric range
 * range.numeric('C4 E4 Bb3') // => [60, 61, 62, 63, 64, 63, 62, 61, 60, 59, 58]
 * // create a scale range
 * range.pitchSet('c e g a', 'c2 c3 c2') // => [ 'C2', 'E2', 'G2', 'A2', 'C3', 'A2', 'G2', 'E2', 'C2' ] *
 g
 * @module range
 */
function isNum (n) { return typeof n === 'number' }
// convert notes to midi if needed
function asNum (n) { return isNum(n) ? n : tonalMidi.toMidi(n) }
// ascending range
function ascR (b, n) { for (var a = []; n--; a[n] = n + b); return a }
// descending range
function descR (b, n) { for (var a = []; n--; a[n] = b - n); return a }
// create a range between a and b
function ran (a, b) {
  return a === null || b === null ? []
    : a < b ? ascR(a, b - a + 1) : descR(a, a - b + 1)
}

/**
 * Create a numeric range. You supply a list of notes or numbers and it will
 * be conected to create complex ranges.
 *
 * @param {String|Array} list - the list of notes or numbers used
 * @return {Array} an array of numbers or empty array if not vald parameters
 *
 * @example
 * range.numeric(["C5", "C4']) // => [ 72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60 ]
 * // it works midi notes
 * range.numeric([10, 5]) // => [ 10, 9, 8, 7, 6, 5 ]
 * // complex range
 * range.numeric('C4 E4 Bb3') // => [60, 61, 62, 63, 64, 63, 62, 61, 60, 59, 58]
 * // can be expressed with a string or array
 * range.numeric('C2 C4 C2') === range.numeric(['C2', 'C4', 'C2'])
 */
function numeric (list) {
  return tonalArray.asArr(list).map(asNum).reduce(function (r, n, i) {
    if (i === 1) return ran(r, n)
    var last = r[r.length - 1];
    return r.concat(ran(last, n).slice(1))
  })
}

/**
 * Create a range of chromatic notes. The altered notes will use flats.
 *
 * @function
 * @param {String|Array} list - the list of notes or midi note numbers
 * @return {Array} an array of note names
 * @example
 * tonal.chromatic('C2 E2 D2') // => ['C2', 'Db2', 'D2', 'Eb2', 'E2', 'Eb2', 'D2']
 * // with sharps
 * tonal.chromatic('C2 C3', true) // => [ 'C2', 'C#2', 'D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2', 'C3' ]
 */
function chromatic (list, sharps) {
  return tonalArray.map(tonalMidi.note(sharps === true), numeric(list))
}

/**
 * Create a range with a cycle of fifths
 * @function
 * @param {String|Pitch} tonic - the tonic note or pitch class
 * @param {Array|String} range - the range array
 * @return {Array} a range of cycle of fifths starting with the tonic
 * @example
 * range.fifths('C', [0, 6]) // => [ 'C', 'G', 'D', 'A', 'E', 'B', 'F#' ])
 */
function fifths (tonic, range) {
  return numeric(range).map(tonalTranspose.trFifths(tonic))
}

/**
 * Create a pitch set (scale or chord) range. Given a pitch set (a collection
 * of pitch classes), and a range array, it returns a range in notes.
 *
 * @param {String|Array|Function} scale - the scale to use or a function to
 * convert from midi numbers to note names
 * @param {String|Array} range - a list of notes or midi numbers
 * @return {Array} the scale range, an empty array if not valid source or
 * null if not valid start or end
 * @example
 * range.pitchSet('C D E F G A B', ['C3', 'C2'])
 * // => [ 'C3', 'B2', 'A2', 'G2', 'F2', 'E2', 'D2', 'C2' ]
 */
function pitchSet (set, range) {
  if (arguments.length === 1) return function (l) { return pitchSet(set, l) }

  return tonalPcset.filter(set, chromatic(range))
}

exports.numeric = numeric;
exports.chromatic = chromatic;
exports.fifths = fifths;
exports.pitchSet = pitchSet;

},{"tonal-array":24,"tonal-midi":33,"tonal-pcset":36,"tonal-transpose":43}],41:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalDictionary = require('tonal-dictionary');
var tonalArray = require('tonal-array');
var tonalNote = require('tonal-note');
var tonalHarmonizer = require('tonal-harmonizer');

var chromatic = ["1P 2m 2M 3m 3M 4P 4A 5P 6m 6M 7m 7M"];
var lydian = ["1P 2M 3M 4A 5P 6M 7M"];
var major = ["1P 2M 3M 4P 5P 6M 7M",["ionian"]];
var mixolydian = ["1P 2M 3M 4P 5P 6M 7m",["dominant"]];
var dorian = ["1P 2M 3m 4P 5P 6M 7m"];
var aeolian = ["1P 2M 3m 4P 5P 6m 7m",["minor"]];
var phrygian = ["1P 2m 3m 4P 5P 6m 7m"];
var locrian = ["1P 2m 3m 4P 5d 6m 7m"];
var altered = ["1P 2m 3m 3M 5d 6m 7m",["super locrian","diminished whole tone","pomeroy"]];
var iwato = ["1P 2m 4P 5d 7m"];
var hirajoshi = ["1P 2M 3m 5P 6m"];
var kumoijoshi = ["1P 2m 4P 5P 6m"];
var pelog = ["1P 2m 3m 5P 6m"];
var prometheus = ["1P 2M 3M 4A 6M 7m"];
var ritusen = ["1P 2M 4P 5P 6M"];
var scriabin = ["1P 2m 3M 5P 6M"];
var piongio = ["1P 2M 4P 5P 6M 7m"];
var augmented = ["1P 2A 3M 5P 5A 7M"];
var neopolitan = ["1P 2m 3m 4P 5P 6m 7M"];
var diminished = ["1P 2M 3m 4P 5d 6m 6M 7M"];
var egyptian = ["1P 2M 4P 5P 7m"];
var oriental = ["1P 2m 3M 4P 5d 6M 7m"];
var spanish = ["1P 2m 3M 4P 5P 6m 7m",["phrygian major"]];
var flamenco = ["1P 2m 3m 3M 4A 5P 7m"];
var balinese = ["1P 2m 3m 4P 5P 6m 7M"];
var persian = ["1P 2m 3M 4P 5d 6m 7M"];
var bebop = ["1P 2M 3M 4P 5P 6M 7m 7M"];
var enigmatic = ["1P 2m 3M 5d 6m 7m 7M"];
var ichikosucho = ["1P 2M 3M 4P 5d 5P 6M 7M"];
var DATA = {
	chromatic: chromatic,
	lydian: lydian,
	major: major,
	mixolydian: mixolydian,
	dorian: dorian,
	aeolian: aeolian,
	phrygian: phrygian,
	locrian: locrian,
	altered: altered,
	iwato: iwato,
	hirajoshi: hirajoshi,
	kumoijoshi: kumoijoshi,
	pelog: pelog,
	prometheus: prometheus,
	ritusen: ritusen,
	scriabin: scriabin,
	piongio: piongio,
	augmented: augmented,
	neopolitan: neopolitan,
	diminished: diminished,
	egyptian: egyptian,
	oriental: oriental,
	spanish: spanish,
	flamenco: flamenco,
	balinese: balinese,
	persian: persian,
	bebop: bebop,
	enigmatic: enigmatic,
	ichikosucho: ichikosucho,
	"melodic minor": ["1P 2M 3m 4P 5P 6M 7M"],
	"melodic minor second mode": ["1P 2m 3m 4P 5P 6M 7m"],
	"lydian augmented": ["1P 2M 3M 4A 5A 6M 7M"],
	"lydian dominant": ["1P 2M 3M 4A 5P 6M 7m",["lydian b7"]],
	"melodic minor fifth mode": ["1P 2M 3M 4P 5P 6m 7m",["hindu","mixolydian b6M"]],
	"locrian #2": ["1P 2M 3m 4P 5d 6m 7m"],
	"locrian major": ["1P 2M 3M 4P 5d 6m 7m",["arabian"]],
	"major pentatonic": ["1P 2M 3M 5P 6M",["pentatonic"]],
	"lydian pentatonic": ["1P 3M 4A 5P 7M",["chinese"]],
	"mixolydian pentatonic": ["1P 3M 4P 5P 7m",["indian"]],
	"locrian pentatonic": ["1P 3m 4P 5d 7m",["minor seven flat five pentatonic"]],
	"minor pentatonic": ["1P 3m 4P 5P 7m"],
	"minor six pentatonic": ["1P 3m 4P 5P 6M"],
	"minor hexatonic": ["1P 2M 3m 4P 5P 7M"],
	"flat three pentatonic": ["1P 2M 3m 5P 6M",["kumoi"]],
	"flat six pentatonic": ["1P 2M 3M 5P 6m"],
	"major flat two pentatonic": ["1P 2m 3M 5P 6M"],
	"whole tone pentatonic": ["1P 3M 5d 6m 7m"],
	"ionian pentatonic": ["1P 3M 4P 5P 7M"],
	"lydian #5P pentatonic": ["1P 3M 4A 5A 7M"],
	"lydian dominant pentatonic": ["1P 3M 4A 5P 7m"],
	"minor #7M pentatonic": ["1P 3m 4P 5P 7M"],
	"super locrian pentatonic": ["1P 3m 4d 5d 7m"],
	"in-sen": ["1P 2m 4P 5P 7m"],
	"vietnamese 1": ["1P 3m 4P 5P 6m"],
	"vietnamese 2": ["1P 3m 4P 5P 7m"],
	"prometheus neopolitan": ["1P 2m 3M 4A 6M 7m"],
	"major blues": ["1P 2M 3m 3M 5P 6M"],
	"minor blues": ["1P 3m 4P 5d 5P 7m",["blues"]],
	"composite blues": ["1P 2M 3m 3M 4P 5d 5P 6M 7m"],
	"augmented heptatonic": ["1P 2A 3M 4P 5P 5A 7M"],
	"dorian #4": ["1P 2M 3m 4A 5P 6M 7m"],
	"lydian diminished": ["1P 2M 3m 4A 5P 6M 7M"],
	"whole tone": ["1P 2M 3M 4A 5A 7m"],
	"leading whole tone": ["1P 2M 3M 4A 5A 7m 7M"],
	"harmonic minor": ["1P 2M 3m 4P 5P 6m 7M"],
	"lydian minor": ["1P 2M 3M 4A 5P 6m 7m"],
	"neopolitan minor": ["1P 2m 3m 4P 5P 6m 7M"],
	"neopolitan major": ["1P 2m 3m 4P 5P 6M 7M",["dorian b2"]],
	"neopolitan major pentatonic": ["1P 3M 4P 5d 7m"],
	"romanian minor": ["1P 2M 3m 5d 5P 6M 7m"],
	"double harmonic lydian": ["1P 2m 3M 4A 5P 6m 7M"],
	"harmonic major": ["1P 2M 3M 4P 5P 6m 7M"],
	"double harmonic major": ["1P 2m 3M 4P 5P 6m 7M",["gypsy"]],
	"hungarian minor": ["1P 2M 3m 4A 5P 6m 7M"],
	"hungarian major": ["1P 2A 3M 4A 5P 6M 7m"],
	"spanish heptatonic": ["1P 2m 3m 3M 4P 5P 6m 7m"],
	"todi raga": ["1P 2m 3m 4A 5P 6m 7M"],
	"malkos raga": ["1P 3m 4P 6m 7m"],
	"kafi raga": ["1P 3m 3M 4P 5P 6M 7m 7M"],
	"purvi raga": ["1P 2m 3M 4P 4A 5P 6m 7M"],
	"bebop dominant": ["1P 2M 3M 4P 5P 6M 7m 7M"],
	"bebop minor": ["1P 2M 3m 3M 4P 5P 6M 7m"],
	"bebop major": ["1P 2M 3M 4P 5P 5A 6M 7M"],
	"bebop locrian": ["1P 2m 3m 4P 5d 5P 6m 7m"],
	"minor bebop": ["1P 2M 3m 4P 5P 6m 7m 7M"],
	"mystery #1": ["1P 2m 3M 5d 6m 7m"],
	"minor six diminished": ["1P 2M 3m 4P 5P 6m 6M 7M"],
	"ionian augmented": ["1P 2M 3M 4P 5A 6M 7M"],
	"lydian #9": ["1P 2m 3M 4A 5P 6M 7M"],
	"six tone symmetric": ["1P 2m 3M 4P 5A 6M"]
};

/**
 * A scale is a collection of pitches in ascending or descending order.
 *
 * This module provides functions to get and manipulate scales.
 *
 * @example
 * scale.notes('Ab bebop') // => [ 'Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'G' ]
 * scale.get('hungarian major', 'B3') // => [ 'B3', 'C##4', 'D#4', 'E#4', 'F#4', 'G#4', 'A4'
 * scale.get('C E F G', 'F') // => [ 'F', 'A', 'Bb', 'C' ]
 * scale.get('1P 2M 3M 5P 6M', 'D4') // => [ 'D4', 'E4', 'F#4', 'A4', 'B4' ]
 * scale.names() => ['major', 'minor', ...]
 * scale.detect('f5 d2 c5 b5 a2 e4 g') // => [ 'C major', 'D dorian', 'E phrygian', 'F lydian', 'G mixolydian', 'A aeolian', 'B locrian'])
 * @module scale
 */
var dict = tonalDictionary.dictionary(DATA, function (str) { return str.split(' ') });

/**
 * Transpose the given scale notes, intervals or name to a given tonic.
 * The returned scale is an array of notes (or intervals if you specify `false` as tonic)
 *
 * It returns null if the scale type is not in the scale dictionary
 *
 * This function is currified
 *
 * @param {String} source - the scale type, intervals or notes
 * @param {String} tonic - the scale tonic (or false to get intervals)
 * @return {Array} the scale notes
 *
 * @example
 * scale.get('bebop', 'Eb') // => [ 'Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'Db', 'D' ]
 * scale.get('major', false) // => [ '1P', '2M', '3M', '4P', '5P', '6M', '7M' ]
 * var major = scale.get('major')
 * major('Db3') // => [ 'Db3', 'Eb3', 'F3', 'Gb3', 'Ab3', 'Bb3', 'C4' ]
 */
function get (type, tonic) {
  if (arguments.length === 1) return function (t) { return get(type, t) }
  var ivls = dict.get(type);
  return ivls ? tonalHarmonizer.harmonize(ivls, tonic) : null
}

/**
 * Return the available scale names
 *
 * @function
 * @param {boolean} aliases - true to include aliases
 * @return {Array} the scale names
 *
 * @example
 * var scale = require('tonal-scale')
 * scale.names() // => ['maj7', ...]
 */
var names = dict.keys;

/**
 * Get the notes (pitch classes) of a scale. It accepts either a scale name
 * (tonic and type) or a collection of notes.
 *
 * Note that it always returns an array, and the values are only pitch classes.
 *
 * @param {String|Array} src - the scale name (it must include the scale type and
 * a tonic. The tonic can be a note or a pitch class) or the list of notes
 * @return {Array} the scale pitch classes
 *
 * @example
 * scale.notes('C major') // => [ 'C', 'D', 'E', 'F', 'G', 'A', 'B' ]
 * scale.notes('C4 major') // => [ 'C', 'D', 'E', 'F', 'G', 'A', 'B' ]
 * scale.notes('Ab bebop') // => [ 'Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'G' ]
 * scale.notes('C4 D6 E2 c7 a2 b5 g2 g4 f') // => ['C', 'D', 'E', 'F', 'G', 'A', 'B']
 */
function notes (name$$1) {
  var scale = parse(name$$1);
  var notes = scale.tonic ? get(scale.type, tonalNote.pc(scale.tonic)) : null;
  return notes || tonalArray.compact(tonalArray.map(tonalNote.pc, name$$1).map(function (n, i, arr) {
    // check for duplicates
    // TODO: sort but preserving the root
    return arr.indexOf(n) < i ? null : n
  }))
}

/**
 * Given a scale name, return its intervals. The name can be the type and
 * optionally the tonic (which is ignored)
 *
 * It retruns an empty array when no scale found
 *
 * @param {String} name - the scale name (tonic and type, tonic is optional)
 * @return {Array<String>} the scale intervals if is a known scale or an empty
 * array if no scale found
 * @example
 * scale.intervals('C major')
 */
function intervals (name$$1) {
  var scale = parse(name$$1);
  return get(scale.type, false) || []
}

/**
 * Check if the given name (and optional tonic and type) is a know scale
 * @param {String} name - the scale name
 * @return {Boolean}
 * @example
 * scale.intervals('C major') // => [ '1P', '2M', '3M', '4P', '5P', '6M', '7M' ])
 * scale.intervals('major') // => [ '1P', '2M', '3M', '4P', '5P', '6M', '7M' ])
 * scale.intervals('mixophrygian') // => null
 */
function isKnowScale (name$$1) {
  return intervals(name$$1).length > 0
}

/**
 * Given a string try to parse as scale name. It retuns an object with the
 * form { tonic, type } where tonic is the note or false if no tonic specified
 * and type is the rest of the string minus the tonic
 *
 * Note that this function doesn't check that the scale type is a valid scale
 * type or if is present in any scale dictionary.
 *
 * @param {String} name - the scale name
 * @return {Object} an object { tonic, type }
 * @example
 * scale.parse('C mixoblydean') // => { tonic: 'C', type: 'mixoblydean' }
 * scale.parse('anything is valid') // => { tonic: false, type: 'anything is valid'}
 */
function parse (str) {
  if (typeof str !== 'string') return null
  var i = str.indexOf(' ');
  var tonic = tonalNote.name(str.substring(0, i)) || false;
  var type = tonic ? str.substring(i + 1) : str;
  return { tonic: tonic, type: type }
}

/**
 * Detect a scale. Given a list of notes, return the scale name(s) if any.
 * It only detects chords with exactly same notes.
 *
 * @function
 * @param {Array|String} notes - the list of notes
 * @return {Array<String>} an array with the possible scales
 * @example
 * scale.detect('b g f# d') // => [ 'GMaj7' ]
 * scale.detect('e c a g') // => [ 'CM6', 'Am7' ]
 */
var detect = tonalDictionary.detector(dict, ' ');

exports.get = get;
exports.names = names;
exports.notes = notes;
exports.intervals = intervals;
exports.isKnowScale = isKnowScale;
exports.parse = parse;
exports.detect = detect;

},{"tonal-array":24,"tonal-dictionary":26,"tonal-harmonizer":30,"tonal-note":35}],42:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalInterval = require('tonal-interval');
var tonalPitch = require('tonal-pitch');
var tonalArray = require('tonal-array');

/**
 *
 * @module sonority
 */
/**
 * Get the intervals analysis of a collection of notes
 *
 * Returns an array with the format `[p, m, n, s, d, t]` where:
 *
 * - p: the number of perfect fourths or fifths
 * - m: the number of major thirds or minor sixths
 * - n: the number of major sixths or minor thirds
 * - s: the number of major seconds or minor sevenths
 * - d: the number of major sevents or minor seconds
 * - t: the number of tritones
 *
 * This is, mostly, an academic puzzle to show the expresiveness of tonal.
 * Implements the ideas found in "The Analysis of Intervals" chapter from
 * [Harmonic Materials of Modern Music]():
 *
 * > The letters _pmn_, therefore, represent intervals commonly considered
 * consonant, whereas the letters _sdt_ represent the intervals commonly
 * considered dissonant. (...) A sonority represented, for example, by the
 * symbol `sd^2`, indicating a triad composed of one major second and two minor
 * seconds, would be recognized as a highly dissonant sound, while the symbol
 * `pmn` would indicate a consonant sound.
 *
 * @param {Array|String} notes - the notes to analyze
 * @return {Array} the _pmnsdt_ array
 */
function density (list) {
  var a, b, i;
  var notes = tonalArray.compact(tonalArray.map(tonalPitch.asNotePitch, list));
  var len = notes.length;
  var result = [0, 0, 0, 0, 0, 0];
  for (a = 0; a < len; a++) {
    for (b = a; b < len; b++) {
      i = tonalInterval.ic(tonalPitch.chr(notes[b]) - tonalPitch.chr(notes[a]));
      if (i === 6) result[5] = result[5] + 1;
      else if (i > 0) result[5 - i] = result[5 - i] + 1;
    }
  }
  return result
}

exports.density = density;

},{"tonal-array":24,"tonal-interval":31,"tonal-pitch":37}],43:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalPitch = require('tonal-pitch');

/**
 * This module deals with note transposition. Just two functions: `transpose`
 * to transpose notes by any interval (or intervals by intervals) and `trFifths`
 * to transpose notes by fifths.
 *
 * @example
 * var tonal = require('tonal')
 * tonal.transpose('C3', 'P5') // => 'G3'
 * tonal.transpose('m2', 'P4') // => '5d'
 * tonal.trFifths('C', 2) // => 'D'
 *
 * @module transpose
 */
function trBy (i, p) {
  var t = tonalPitch.pType(p);
  if (!t) return null
  var f = tonalPitch.fifths(i) + tonalPitch.fifths(p);
  if (tonalPitch.isPC(p)) return ['tnlp', [f]]
  var o = tonalPitch.focts(i) + tonalPitch.focts(p);
  if (t === 'note') return ['tnlp', [f, o]]
  var d = tonalPitch.height(i) + tonalPitch.height(p) < 0 ? -1 : 1;
  return ['tnlp', [d * f, d * o], d]
}

/**
 * Transpose notes. Can be used to add intervals. At least one of the parameter
 * is expected to be an interval. If not, it returns null.
 *
 * @param {String|Pitch} a - a note or interval
 * @param {String|Pitch} b - a note or interavl
 * @return {String|Pitch} the transposed pitch or null if not valid parameters
 * @example
 * var _ = require('tonal')
 * // transpose a note by an interval
 * _.transpose('d3', '3M') // => 'F#3'
 * // transpose intervals
 * _.transpose('3m', '5P') // => '7m'
 * // it works with pitch classes
 * _.transpose('d', '3M') // => 'F#'
 * // order or parameters is irrelevant
 * _.transpose('3M', 'd3') // => 'F#3'
 * // can be partially applied
 * _.map(_.transpose('3M'), 'c d e f g') // => ['E', 'F#', 'G#', 'A', 'B']
 */
function transpose (a, b) {
  if (arguments.length === 1) return function (b) { return transpose(a, b) }
  var pa = tonalPitch.asPitch(a);
  var pb = tonalPitch.asPitch(b);
  var r = tonalPitch.isIvlPitch(pa) ? trBy(pa, pb)
    : tonalPitch.isIvlPitch(pb) ? trBy(pb, pa) : null;
  return a === pa && b === pb ? r : tonalPitch.strPitch(r)
}

/**
 * Transpose a tonic a number of perfect fifths. It can be partially applied.
 *
 * @function
 * @param {Pitch|String} tonic
 * @param {Integer} number - the number of times
 * @return {String|Pitch} the transposed note
 * @example
 * import { trFifths } from 'tonal-transpose'
 * [0, 1, 2, 3, 4].map(trFifths('C')) // => ['C', 'G', 'D', 'A', 'E']
 * // or using tonal
 * tonal.trFifths('G4', 1) // => 'D5'
 */
function trFifths (t, n) {
  if (arguments.length > 1) return trFifths(t)(n)
  return function (n) {
    return transpose(t, tonalPitch.pitch(n, 0, 1))
  }
}

exports.transpose = transpose;
exports.trFifths = trFifths;

},{"tonal-pitch":37}],44:[function(require,module,exports){
'use strict';

var array = require('tonal-array');
var transpose = require('tonal-transpose');
var harmonizer = require('tonal-harmonizer');
var distance = require('tonal-distance');
var note = require('tonal-note');
var interval = require('tonal-interval');
var midi = require('tonal-midi');
var freq = require('tonal-freq');
var range = require('tonal-range');
var key = require('tonal-key');
var scale = require('tonal-scale');
var chord = require('tonal-chord');
var pitch = require('tonal-pitch');
var notation = require('tonal-notation');
var progression = require('tonal-progression');
var sonority = require('tonal-sonority');
var pitchset = require('tonal-pitchset');
var pcset = require('tonal-pcset');

/**
 * The `tonal` module is a facade to all the rest of the modules. They are namespaced,
 * so for example to use `pc` function from `tonal-note` you have to write:
 * `tonal.note.pc`
 *
 * Some modules are NOT namespaced for developer comfort:
 *
 * - `tonal-array`: for example `tonal.map(tonal.note.pc, 'C#2')`
 * - `tonal-transpose`: for example `tonal.transpose('C', '3M')`
 * - `tonal-distance`: for example `tonal.interval('C3', 'G4')`
 *
 * It also adds a couple of function aliases:
 *
 * - `tonal.scale` is an alias for `tonal.scale.notes`
 * - `tonal.chord` is an alias for `tonal.chord.notes`
 *
 * @example
 * var tonal = require('tonal')
 * tonal.transpose(tonal.note.pc('C#2'), 'M3') // => 'E#'
 * tonal.chord('Dmaj7') // => ['D', 'F#', 'A', 'C#']
 *
 * @module tonal
 */
var assign = Object.assign;
var tonal = assign({}, array, transpose, harmonizer, distance);
tonal.pitch = pitch;
tonal.notation = notation;
tonal.note = note;
tonal.ivl = interval;
tonal.midi = midi;
tonal.freq = freq;
tonal.range = range;
tonal.key = key;
tonal.progression = progression;
tonal.sonority = sonority;
tonal.pitchset = pitchset;
tonal.pcset = pcset;

tonal.scale = function (name) { return tonal.scale.notes(name) };
assign(tonal.scale, scale);
tonal.chord = function (name) { return tonal.chord.notes(name) };
assign(tonal.chord, chord);

if (typeof window !== 'undefined') window.Tonal = tonal;

module.exports = tonal;

},{"tonal-array":24,"tonal-chord":25,"tonal-distance":27,"tonal-freq":29,"tonal-harmonizer":30,"tonal-interval":31,"tonal-key":32,"tonal-midi":33,"tonal-notation":34,"tonal-note":35,"tonal-pcset":36,"tonal-pitch":37,"tonal-pitchset":38,"tonal-progression":39,"tonal-range":40,"tonal-scale":41,"tonal-sonority":42,"tonal-transpose":43}],45:[function(require,module,exports){
/*
 * Code to generate an Oligophony file, which stores the chord data for a song.
 */
(function() {
  'use strict'; 
  /**
   * Represents a measure of music.
   * @class
   * @param {Oligophony} oligophony The parent composition.
   * @param {?Number} index Optional: index at which to insert measure.
   * @param {null|Array.<String>} chords Optional: Array of chords as Strings.
   */
  var Measure = function(oligophony, index, chords) {
    this.oligophony = oligophony;
    
    // If Measure-related events don't exist yet, register them.
    this.oligophony.createEvent('Measure.create', false);
    this.oligophony.createEvent('Measure.move', false);
    
    /**
     * Array containing timeSignature[0] ChordMagic chords or nulls.
     * @type {?Object[]}
     * @private
     */
    this._beats = [];
    if(!chords) chords = []; // If none given, pass undefined.
    for(let i = 0; i < this.oligophony.timeSignature[0]; i++) {
      if(chords[i]) {
        // correct for a bug in chordMagic.
        let corrected = chords[i].replace('-7', 'm7');
        let parsed = this.oligophony.chordMagic.parse(corrected);
        parsed.raw = chords[i];
        this._beats.push(parsed);
      } else {
        this._beats.push(null);
      }
    }
    
    this.getBeat = function(beat) {
      var transpose = this.oligophony.transpose;
      var oldChord = this._beats[beat];
      if(oldChord) {
        var out = this.oligophony.chordMagic.transpose(oldChord, transpose);
        out.raw = oldChord.raw;
        if(transpose) {
          out.rawRoot = out.root;
        } else if(oldChord.raw[1] == '#') {
          out.rawRoot = oldChord.raw[0].toUpperCase() + '#';
        } else {
          out.rawRoot = oldChord.root;
        }
        return out;
      } else {
        return null;
      }
    };
    
    /**
     * Set/change the location of the measure in the song.
     * @param {Number} _index New index.
     * @public
     */
    this.setIndex = function(_index) {
      var currentIndex = this.oligophony.measures.indexOf(this);
      if(currentIndex != -1) {
        this.oligophony.measures.splice(currentIndex, 1);
      }
      if(_index > currentIndex) {
        this.oligophony.measures.splice(_index - 1, 0, this);
      } else {
        this.oligophony.measures.splice(_index, 0, this);
      }
      this.oligophony.dispatchEvent('Measure.move', {measure: this});
    };
    
    if(index === null) {
      this.oligophony.measures.push(this);
    } else {
      this.setIndex(index);
    }
    
    /**
     * Get the measure's index in the piece
     * @returns {Number} the measure's index in the piece.
     * @public
     */
    this.getIndex = function() {
      return this.oligophony.measures.indexOf(this);
    };
    
    this.oligophony.dispatchEvent('Measure.create', {measure: this});
  };
  // @todo: options as @param options.blah
  /**
   * Stores the chord data for a song.
   * @class
   * @param {undefined|Object} options Optional configuration for the song.
   */
  var Oligophony = function(options) {
    // handle options
    /**
     * Time signature for the song as an Array of length 2.
     * @type {Number[]}
     * @const
     * @public
     */
    this.timeSignature = (options && options['timeSignature']) || [4,4];
    
    /**
     * Controls transposition (believe it or not!)
     * @type {Number}
     */
    this.transpose = (options && options['transpose']) || 0;
    // @todo: setTranspose
    
    /**
     * Oligophony's instance of ChordMagic, see that module's documentations for details.
     * @public
     */
    this.chordMagic = require('chord-magic');
    /**
     * Oligophony's instance of Tonal, see that module's documentations for details.
     * @public
     */
    this.tonal = require('tonal');
    
    /*
     * Event system to keep track of things
     * Events take the form 'Measure.create' or 'Viewer.ready' etc.
     */
     
    /**
     * Database of Oligophony events.
     * @type {Object.<Object>}
     * @private
     */
    this._eventsDB = {};
    /**
     * Register an Oligophony event, if it doesn't already exist.
     * @param {String} eventName Name of the event to register.
     * @param {Boolean} oneTime If true, future functions added to the event run immediately.
     * @returns {Object} Object that stores information about the event.
     * @public
     */
    this.createEvent = function(eventName, oneTime) {
      if(!this._eventsDB[eventName]) {
        this._eventsDB[eventName] = {
          funcs: [],
          dispatchCount: 0,
          oneTime: oneTime,
          args: {}
        };
      }
      return this._eventsDB[eventName];
    };
    /**
     * Add a function to run the next time the event is dispatched (or immediately)
     * @param {String} eventName Name of event to fire on.
     * @param {Function} func Function to run.
     * @public
     */
    this.onEvent = function(eventName, func) {
      var event = this._eventsDB[eventName];
      if(!event) event = this.createEvent(eventName, false);
      if(event.oneTime && event.dispatchCount !== 0) {
        // Pass it any arguments from the first run.
        func(event.args);
      } else {
        event.funcs.push(func);
      }
    };
    /**
     * Fire an event and run any functions linked to it.
     * @param {String} eventName Event to dispatch.
     * @param {Object} args Any arguments to pass to the functions.
     * @return {Boolean} Whether an event eventName exists.
     * @public
     */
    this.dispatchEvent = function(eventName, args) {
      var event = this._eventsDB[eventName];
      if(!event) return false;
      event.args = args;
      for(let func of event.funcs) {
        func(event.args);
      }
      return true;
    };
    
    
    /**
     * A list of measures and nulls, in order. Null represents a newline.
     * @type {?Measure[]}
     * @public
     */
    this.measures = [];
    
    /**
     * Append a measure to the piece
     * @param {String[]} chords Array of chords as Strings.
     * @param {?Number} index Optional: Index for the new measure.
     * @return {Measure} The generated measure.
     * @public
     */
    this.addMeasure = function(chords, index) {
      return new Measure(this, index, chords);
    };
    
    this.createEvent('Oligophony.addNewline', false);
    /**
     * Append a measure to the piece
     * @param {?Number} index Optional: Index for the newline in measures array.
     * @public
     */
    this.addNewline = function(index) {
      if(index === null) {
        this.measures.push(null);
      } else {
        this.measures.splice(index, 0, null);
      }
      this.dispatchEvent('Oligophony.addNewline', {});
    };
    
    /**
     * Parse a song from an Array containing nulls (newlines) or Arrays of beats.
     * @param {Array.<null, Array>} array The array to parse into a song.
     * @public
     */
    this.parseArray = function(array) {
      for(let measure of array) {
        if(measure) {
          this.addMeasure(measure, null);
        } else {
          this.addNewline(null);
        }
      }
    };
    
    this.createEvent('Oligophony.import', false);
    
    // @todo docs!!
    this.title = '';
    this.composer = '';
    /**
     * Parse a song from an Object.
     * @param {Object} song The song to load.
     * @param {String} song.title Title of the song.
     * @param {String} song.composer Composer of the song.
     * @param {Number[]} song.timeSignature Time Signature of the song.
     * @param {Array.<null, Array>} song.chords The chords array to parse.
     * @public
     */
    this.import = function(song) {
      this.title = song.title;
      this.composer = song.composer;
      this.timeSignature = song.timeSignature;
      this.parseArray(song.chords);
      this.dispatchEvent('Oligophony.import', {});
    };
  };

  module.exports = Oligophony;
})();

},{"chord-magic":11,"tonal":44}],46:[function(require,module,exports){
(function() {
  /**
   * Player constructor. A Player renders an Oligophony as audio.
   * @class
   * @param {Oligophony} oligophony The Oligophony to play.
   * @param {Object} [options] Optional: options for the Player.
   * @param {Number} [options.tempo=120] Tempo for the player.
   */
  var Player = function(oligophony, options) {
    this.oligophony = oligophony;
    
    /**
     * Tempo for playback, in BPM (beats-per-minute).
     * @type {Number}
     */
    this.tempo = (options && options['tempo']) || 120;
    /**
     * Length of a beat, in milliseconds.
     * @type {Number}
     */
    this.beatLength = (60 * 1000) / this.tempo;
    // @todo: options as @param options.blah
    /**
     * Player's instance of MIDI.js, see that module's documentations for details.
     * @public
     */
    this.MIDI = require('midi.js');
    
    this.oligophony.createEvent('Player.ready', true);
    this.oligophony.createEvent('Player.playBeat', false);
    
    var self = this;
    this.MIDI.loadPlugin({
      soundfontUrl: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/',
      onsuccess: function() {
        self.oligophony.dispatchEvent('Player.ready', {});
      }
    });
    
    /**
     * Turns a ChordMagic chord object into an array of MIDI note numbers.
     * @param {Object} chord ChordMagic chord object to analyze.
     * @returns {Number[]} Array of MIDI note numbers.
     * @public
     */
    this.chordToArray = function(chord) {
      var chordAsString = this.oligophony.chordMagic.prettyPrint(chord);
      var chordAsNoteNames = this.oligophony.tonal.chord(chordAsString);
      var chordAsMIDINums = chordAsNoteNames.map((note) => {
        return this.oligophony.tonal.note.midi(note + '4');
      });
      var bassNote = this.oligophony.tonal.note.midi(chordAsNoteNames[0] + '3');
      chordAsMIDINums.unshift(bassNote);
      return chordAsMIDINums;
    };
    
    this.playChord = function(chord) {
      var chordAsArray = this.chordToArray(chord);
      for(let note of chordAsArray) {
        this.MIDI.noteOn(0, note, 100, 0);
        this.MIDI.noteOff(0, note, 1);
      }
      // Shallow-copy playback so the correct data is dispatched with stopBeat event.
      var args = {
        measure: playback.measure,
        beat: playback.beat
      };
      this.oligophony.dispatchEvent('Player.playBeat', args);
      setTimeout(() => {
        this.oligophony.dispatchEvent('Player.stopBeat', args);
      }, this.beatLength);
    };
    
    var playback;
    
    this.incrementPlayback = function() {
      playback.beat++;
      if(playback.beat >= this.oligophony.timeSignature[0]) {
        playback.beat = 0;
        playback.measure++;
      }
      if(playback.measure < this.oligophony.measures.length) {
        this.playNextChord();
      }
    };
    
    this.playNextChord = function() {
      var measure = this.oligophony.measures[playback.measure];
      if(measure) {
        var chord = measure.getBeat(playback.beat);
        if(chord) {
          this.playChord(chord);
        }
        playback.timeout = setTimeout(() => this.incrementPlayback.call(this), this.beatLength);
      } else {
        // if there's no measure, it's a newline, so play next beat immediately.
        this.incrementPlayback();
      }
    };
    
    /**
     * Play the Oligophony from the beginning.
     * @public
     */
    this.play = function() {
      if(playback && playback.timeout) clearTimeout(playback.timeout);
      playback = {
        measure: 0,
        beat: 0,
        timeout: null
      };
      self.playNextChord.call(self);
    };
    this.oligophony.onEvent('Player.ready', () => self.play.call(self));
    
    /**
     * Stop playing the Oligophony.
     * @public
     */
    this.stop = function() {
      if(playback && playback.timeout) clearTimeout(playback.timeout);
    };
  };
  module.exports = Player;
})();

},{"midi.js":21}],47:[function(require,module,exports){
(function() {
  'use strict';  

  /**
   * Handles the visual representation of a beat within a MeasureView.
   * @class
   * @param {Object} chord A ChordMagic chord object to render.
   * @param {Viewer} viewer The Viewer to which the BeatView belongs.
   * @param {MeasureView} measureView The BeatView's parent measureView.
   * @param {Number} index Which beat this represents in the Measure.
   * @param {Number} xoffset The beat's horizontal offset in the MeasureView.
   */
  var BeatView = function(chord, viewer, measureView, index, xoffset) {
    this.viewer = viewer;
    this.oligophony = this.viewer.oligophony;
    this.measureView = measureView;
    this.index = index;
    if(!this.viewer.font) return null;
    
    // Padding between the root of the chord and the accidental/other bits.
    const PADDING_RIGHT = 7;
    
    var group = document.createElementNS(this.viewer.SVG_NS, 'g');
    group.setAttributeNS(null, 'transform', `translate(${xoffset}, 0)`);
    // Append right away so we can compute size.
    this.measureView._svgGroup.appendChild(group);
    
    var root = this.viewer.textToPath(chord.rawRoot[0]);
    group.appendChild(root);
    
    var rootbb = root.getBBox();
    
    /**
     * If the chord is anything besodes a major triad, it'll need extra symbols
     * to describe quality, suspensions, 7ths, etc. This grabs those.
     * @param {Object} chord ChordMagic object to parse.
     * @returns {String} Bottom text to render.
     * @private
     */
    this._getBottomText = function(chord) {
      var bottomText = '';
      if(chord.quality != 'Major' || chord.extended || chord.added) {
        const ADDED_MAP = {
          'Add9': 'Add9',
          'Add11': 'Add11',
          'Major6': 'Add6',
          'SixNine': '69',
          'PowerChord': 'Add5'
        };
        if(chord.extended) {
          const EXTENDED_MAP = {
            'Major7': this.viewer.PATHS.delta_char,
            'Minor7': '-7',
            'Dominant7': '7',
            'Diminished7': 'O7',
            'Major9': this.viewer.PATHS.delta_char + '9',
            'Major11': this.viewer.PATHS.delta_char + '11',
            'Major13': this.viewer.PATHS.delta_char + '13',
            'AugmentedDominant7': '+7',
            'AugmentedMajor7': '+' + this.viewer.PATHS.delta_char + '7',
            'Minor9': '-9'
          };
          bottomText += EXTENDED_MAP[chord.extended];
          if(chord.added) {
            bottomText += ADDED_MAP[chord.added];
          }
        } else { // quality != Major
          if(chord.quality == 'Minor') {
            bottomText += '-';
          } else if(chord.quality == 'Diminished') {
            bottomText += 'O';
          } else if(chord.quality == 'Augmented') {
            bottomText += '+';
          }
          
          if(chord.added == 'Major6') {
            bottomText += '6';
          } else if(chord.added) {
            bottomText += ADDED_MAP[chord.added];
          }
        }
        if(chord.suspended) bottomText += chord.suspended;
      }
      return bottomText;
    };
    
    /**
     * Render an accidental in the correct size and place.
     * @param {String} acc WIth accidental to render: either 'b' or '#'.
     * @private
     */
    this._renderAccidental = function(acc) {
      var path = document.createElementNS(this.viewer.SVG_NS, 'path');
      var goal_height = (this.viewer.H_HEIGHT * 0.6);
      var x = rootbb.width + PADDING_RIGHT;
      var y;
      var orig_height;
      if(acc == '#') {
        path.setAttributeNS(null, 'd',this.viewer.PATHS.sharp);
        orig_height = this.viewer.PATHS.sharp_height;
        y = -0.6 * this.viewer.H_HEIGHT;
      } else {
        path.setAttributeNS(null, 'd',this.viewer.PATHS.flat);
        orig_height = this.viewer.PATHS.flat_height;
        y = (-1 * goal_height) - (0.6 * this.viewer.H_HEIGHT);
      }
      let scale = goal_height / orig_height;
      path.setAttributeNS(null, 'transform',`translate(${x}, ${y}) scale(${scale})`);
      group.appendChild(path);
    };
    
    /**
     * If the chord is anything besodes a major triad, it'll need extra symbols
     * to describe quality, suspensions, 7ths, etc. This renders those.
     * @param {String} bottomText Bottom text to render.
     * @private
     */
    this._renderBottomText = function(bottomText) {
      var regex = new RegExp(`(${this.viewer.PATHS.delta_char})`, 'g');
      var split = bottomText.split(regex);
      var bottomGroup = document.createElementNS(this.viewer.SVG_NS, 'g');
      group.appendChild(bottomGroup);
      for(let str of split) {
        if(!str) continue;
        let x = rootbb.width + PADDING_RIGHT + bottomGroup.getBBox().width;
        if(str == this.viewer.PATHS.delta_char) {
          let path = document.createElementNS(this.viewer.SVG_NS, 'path');
          path.setAttributeNS(null, 'd',this.viewer.PATHS.delta_path);
          let orig_height = this.viewer.PATHS.delta_height;
          let goal_height = (this.viewer.H_HEIGHT * 0.5);
          let y = -0.5 * this.viewer.H_HEIGHT;
          let scale = goal_height / orig_height;
          path.setAttributeNS(null, 'transform',`translate(${x}, ${y}) scale(${scale})`);
          bottomGroup.appendChild(path);
        } else {
          let text = this.viewer.textToPath(str);
          let y = 0;
          let scale = 0.5;
          text.setAttributeNS(null, 'transform',`translate(${x}, ${y}) scale(${scale})`);
          bottomGroup.appendChild(text);
        }
      }
    };
    
    // ACCIDENTALS
    if(chord.rawRoot[1]) {
      this._renderAccidental(chord.rawRoot[1]);
    }
    // BOTTOM BITS
    // If the chord is anything besides a major triad, it needs more bits
    var bottomText = this._getBottomText(chord);
    if(bottomText) {
      this._renderBottomText(bottomText);
    }
  
    if(chord.overridingRoot) {
      // @todo scale down group and return a bigger group
    } else {
      this._svgGroup = group;
    }
    
    var self = this;
    var measureIndex = this.measureView.measure.getIndex();
    this.oligophony.onEvent('Player.playBeat', (args) => {
      if(args.measure == measureIndex && args.beat == self.index) {
        self._svgGroup.classList.add('OligophonyPlayedBeat');
      }
    });
    this.oligophony.onEvent('Player.stopBeat', (args) => {
      if(args.measure == measureIndex && args.beat == self.index) {
        self._svgGroup.classList.remove('OligophonyPlayedBeat');
      }
    });
  };
  module.exports = BeatView;
})();

},{}],48:[function(require,module,exports){
(function() {
  'use strict';  

  /**
   * Handles the visual representation of a Measure object.
   * @class
   * @param {Viewer} viewer The Viewer to which the MeasureView belongs.
   * @param {Measure} measure The Measure that the MeasureView represents.
   */
  var MeasureView = function(viewer, measure) {
    this.viewer = viewer;
    this.oligophony = this.viewer.oligophony;
    this.measure = measure;
    
    // link measure back to this
    this.measure.measureView = this;
    
    /**
     * A measure is represented in the nodetree by an SVG group full of things.
     * @type {SVGGElement}
     * @private Maybe this will change depending how much measures move around?
     */
    this._svgGroup = document.createElementNS(this.viewer.SVG_NS, 'g');
    
    /**
     * Set a MeasureView's position.
     * @param {Number} x X position.
     * @param {Number} y Y position.
     * @public
     */
    this.setPosition = function(x,y) {
      this._svgGroup.setAttributeNS(null, 'transform', `translate(${x}, ${y})`);
    };
    
    /**
     * Inserts _svgGroup in the right location.
     * @public
     */
    this.move = function() {
      var newIndex = this.measure.getIndex();
      if(this._svgGroup.parentNode) {
        this._svgGroup.parentNode.removeChild(this._svgGroup);
      }
      if(newIndex == this.oligophony.measures.length - 1) {
        this.viewer._svgElem.appendChild(this._svgGroup);
      } else {
        this.viewer._svgElem.insertBefore(this._svgGroup, newIndex);
      }
      this.viewer.reflow();
    };
    this.move();
    
    /**
     * Array containing timeSignature[0] Objects or null
     * @type {?Object[]}
     * @public
     */
    this.beatViews = [];
    
    /**
     * Render the measure
     * @public
     * @return {null|undefined} Null if no font has been loaded yet.
     */
    this.render = function() {
      if(!this.viewer.font) return null;
      for(let i = 0; i < this.oligophony.timeSignature[0]; i++) {
        let chord = this.measure.getBeat(i);
        if(chord) {
          let offset = i * this.viewer.beatOffset;
          let node = new this.viewer.BeatView(chord, this.viewer, this, i, offset);
          this.beatViews.push({
            node: node,
            chord: chord,
            index: i
          });
        } else {
          this.beatViews.push({
            node: null,
            chord: null,
            index: i
          });
        }
      }
      
      /**
       * Left bar of the measure. Only happens if not the first meassure on the line.
       * @type {SVGPathElement}
       * @private
       */
      if(this.oligophony.measures[this.measure.getIndex() - 1]) {
        this._leftBar = document.createElementNS(this.viewer.SVG_NS, 'path');
        this._leftBar.setAttributeNS(null, 'd', this.viewer.PATHS.bar);
        let x = -0.25 * this.viewer.beatOffset;
        let y = 0.5 * (this.viewer.rowHeight - this.viewer.H_HEIGHT);
        let scale = this.viewer.rowHeight / this.viewer.PATHS.bar_height;
        this._leftBar.setAttributeNS(null, 'transform', `translate(${x}, ${y}) scale(${scale})`);
        this._leftBar.setAttributeNS(null, 'style', 'stroke-width: 1px; stroke: black;');
        this._svgGroup.appendChild(this._leftBar);
      }
    };
    this.render();
    var self = this;
    this.oligophony.onEvent('Viewer.ready', () => this.render.call(self));
  };

  module.exports = MeasureView;
})();

},{}],49:[function(require,module,exports){
/*
 * Code to generate a Viewer object. This will be extended to an editor in
 * a separate file so that that functionality is only loaded as needed.
 */
(function() {
  'use strict';
  /**
   * Viewer constructor. A Viewer displays an Oligophony.
   * @class
   * @param {Oligophony} oligophony The Oligophony to display.
   * @param {Object} [options] Optional: options for the Viewer.
   * @param {Number} [options.width=1400] SVG width.
   * @param {Number} [options.topMargin=60] Distance above first row of measures.
   * @param {Number} [options.rowHeight=60] SVG height of each row of measures.
   * @param {Number} [options.rowYMargin=10] Distance between each row of measures.
   * @param {Number} [options.fontSize=50] Font size for big text (smaller text will be relatively scaled).
   */
  var Viewer = function(oligophony, options) {
    this.oligophony = oligophony;
    this.width = (options && options['width']) || 1400;
    this.topMargin = (options && options['topMargin']) || 60;
    this.rowHeight = (options && options['rowHeight']) || 60;
    this.rowYMargin = (options && options['rowYMargin']) || 10;
    this.fontSize = (options && options['fontSize']) || 50;
    
    // SVG width for each measure.
    // @todo: shorten to 2 if the width/fontsize ratio is ridiculous?
    this.colWidth = this.width / 4;
    // SVG distance between beats in a measure.
    this.beatOffset = this.colWidth / 4;
    
    this.oligophony.createEvent('Viewer.ready', true);
    //this.oligophony.onEvent('Viewer.ready', this.renderAllMeasures);
    
    /*
     * I keep changing my mind about the prettiest font to use.
     * It's not easy to request fonts from Google as WOFF.
     */
    const FONT_URLS = {
      openSans: 'https://fonts.gstatic.com/s/opensans/v14/cJZKeOuBrn4kERxqtaUH3T8E0i7KZn-EPnyo3HZu7kw.woff',
      slabo27px: 'https://fonts.gstatic.com/s/slabo27px/v3/PuwvqkdbcqU-fCZ9Ed-b7RsxEYwM7FgeyaSgU71cLG0.woff'
    };
    
    var self = this;
    require('opentype.js').load(FONT_URLS.slabo27px, function(err, font) {
      if (err) {
        alert('Could not load font: ' + err);
      } else {
        // opentype.js Font object for whatever our chosen font is.
        self.font = font;
        self.H_HEIGHT = self.textToPath('H').getBBox().height;
        self.oligophony.dispatchEvent('Viewer.ready', {});
      }
    });
    
    this.setTitleAndComposer = function() {
      var titleText = this.textToPath(this.oligophony.title);
      this._svgElem.appendChild(titleText);
      var titleBB = titleText.getBBox();
      var ttscale = 0.7;
      var ttx = (this.width - (titleBB.width * ttscale)) / 2;
      var tty = titleBB.height * ttscale;
      titleText.setAttributeNS(null, 'transform',`translate(${ttx}, ${tty}) scale(${ttscale})`);
      
      var composerText = this.textToPath(this.oligophony.composer);
      this._svgElem.appendChild(composerText);
      var composerBB = composerText.getBBox();
      var ctscale = 0.5;
      var ctx = (this.width - (composerBB.width * ctscale)) / 2;
      var cty = tty + this.rowYMargin + (composerBB.height * ctscale);
      composerText.setAttributeNS(null, 'transform',`translate(${ctx}, ${cty}) scale(${ctscale})`);
    };
    this.oligophony.onEvent('Oligophony.import', () => {
      // @todo viewer.ready?? eventDispatched??
      if(this.font) {
        this.setTitleAndComposer.call(self);
      } else {
        this.oligophony.onEvent('Viewer.ready', () => this.setTitleAndComposer.call(self));
      }
    });
    
    /**
     * Take a string and turn it into an SVGPathElement.
     * @param {String} text The string to path-ify.
     * @returns {SVGPathElement} The string as a path.
     */
    this.textToPath = function(text) {
      var path = document.createElementNS(this.SVG_NS, 'path');
      var pathdata = this.font.getPath(text, 0, 0, this.fontSize).toPathData();
      path.setAttributeNS(null, 'd',pathdata);
      return path;
    };
    
    /**
     * Path data for various shapes.
     * @type {String[]}
     * @const
     */
    this.PATHS = require('./svg_constants');
    
    /**
     * When generating SVG-related elements in JS, they must be namespaced.
     * @type {String}
     * @const
     */
    this.SVG_NS = 'http://www.w3.org/2000/svg';
    
    this.height = 700;
    /**
     * The SVG element with which the user will interact.
     * @type {SVGDocument}
     * @private
     */
    this._svgElem = document.createElementNS(this.SVG_NS, 'svg');
    this._svgElem.setAttributeNS(null, 'width', this.width);
    this._svgElem.setAttributeNS(null, 'height', this.height);
    
    var styledata = require('./viewer.css.js');
    var style = document.createElementNS(this.SVG_NS, 'style');
    style.setAttributeNS(null, 'type', 'text/css');
    style.appendChild(document.createTextNode(styledata));
    this._svgElem.appendChild(style);
    
    /**
     * Append editor element to a parent element.
     * @param {HTMLElement} parent The element to append the editor element.
     * @public
     */
    this.appendTo = function(parent) {
      parent.appendChild(this._svgElem);
    };
    
    // for extensibility.
    this.MeasureView = require('./MeasureView');
    this.BeatView = require('./BeatView');
    
    /**
     * Called by Oligophony to create a MeasureView for a Measure and link them.
     * @param {Measure} measure The corresponding Measure.
     * @public
     */
    this.createMeasureView = function(measure) {
      new this.MeasureView(this, measure);
    };
    // account for measures that already exist
    for(let measure of this.oligophony.measures) {
      this.createMeasureView(measure);
    }
    this.oligophony.onEvent('Measure.create', (args) => {
      this.createMeasureView(args.measure);
    });
    
    /**
     * Layout measures and newlines.
     * @public
     */
    this.reflow = function() {
      var row = 1;
      var col = 0;
      var y;
      for(let measure of this.oligophony.measures) {
        let x = this.colWidth * col++;
        if(x + this.colWidth > this.width || measure === null) {
          x = 0;
          col = 0;
          row++;
          if(measure === null) continue;
        }
        y = this.topMargin + ((this.rowHeight + this.rowYMargin) * row);
        measure.measureView.setPosition(x,y);
      }
      this.height = y + this.rowYMargin;
      this._svgElem.setAttributeNS(null, 'height', this.height);
    };
    this.oligophony.onEvent('Measure.create', () => this.reflow.call(self));
    this.oligophony.onEvent('Oligophony.addNewline', () => this.reflow.call(self));
  };

  module.exports = Viewer;
})();

},{"./BeatView":47,"./MeasureView":48,"./svg_constants":50,"./viewer.css.js":51,"opentype.js":23}],50:[function(require,module,exports){
module.exports = {
  // https://commons.wikimedia.org/wiki/File:B%C3%A9mol.svg
  'flat': 'm 1.380956,10.84306 -0.02557,1.68783 0,0.28131 c 0,0.56261 0.02557,1.12522 0.102293,1.68783 1.150797,-0.97178 2.378313,-2.04586 2.378313,-3.55468 0,-0.84392 -0.358026,-1.7134103 -1.09965,-1.7134103 -0.792771,0 -1.329809,0.7672 -1.355382,1.6111203 z M 0.306879,15.42067 0,0.20457992 C 0.204586,0.07671992 0.460319,-7.6580061e-8 0.690478,-7.6580061e-8 0.920637,-7.6580061e-8 1.17637,0.07669992 1.380956,0.20457992 L 1.201943,9.0273597 c 0.639331,-0.53704 1.483249,-0.8695 2.327166,-0.8695 1.329809,0 2.27602,1.22752 2.27602,2.6084803 0,2.04586 -2.1993,2.99207 -3.759269,4.32188 C 1.662261,15.42067 1.432102,16.06 0.895064,16.06 0.562612,16.06 0.306879,15.77869 0.306879,15.42067 Z',
  'flat_height': 16.059999465942383,
  // https://commons.wikimedia.org/wiki/File:Di%C3%A8se.svg
  'sharp': 'm 4.6252809,-11.71096 c 0,-0.21414 -0.1713067,-0.40686 -0.38544,-0.40686 -0.2141334,0 -0.4068535,0.19272 -0.4068535,0.40686 l 0,3.1049303 -1.777307,-0.66381 0,-3.3833103 c 0,-0.21413 -0.19272,-0.40685 -0.4068534,-0.40685 -0.2141334,0 -0.3854401,0.19272 -0.3854401,0.40685 l 0,3.1049303 -0.68522678,-0.25696 c -0.0428267,-0.0214 -0.10706669,-0.0214 -0.14989337,-0.0214 C 0.19272004,-9.8265897 0,-9.6338697 0,-9.3983197 l 0,1.2847998 c 0,0.1713 0.10706669,0.34261 0.27837339,0.40685 l 0.98501351,0.34261 0,3.42614 -0.68522678,-0.23555 c -0.0428267,-0.0214 -0.10706669,-0.0214 -0.14989337,-0.0214 C 0.19272004,-4.1948799 0,-4.0021599 0,-3.7666099 l 0,1.2848 c 0,0.1713 0.10706669,0.3212 0.27837339,0.38544 l 0.98501351,0.36402 0,3.38331 c 0,0.21413 0.1713067,0.40685 0.3854401,0.40685 0.2141334,0 0.4068534,-0.19272 0.4068534,-0.40685 l 0,-3.10493 1.777307,0.66380998 0,3.38331002 c 0,0.21413 0.1927201,0.40685 0.4068535,0.40685 0.2141333,0 0.38544,-0.19272 0.38544,-0.40685 l 0,-3.10494002 0.6852268,0.25696 c 0.042827,0.0214 0.1070667,0.0214 0.1498934,0.0214 0.2355467,0 0.4282668,-0.19272 0.4282668,-0.42827 l 0,-1.28479998 c 0,-0.17131 -0.1070667,-0.34261 -0.2783734,-0.40685 l -0.9850136,-0.34262 0,-3.42613 0.6852268,0.23554 c 0.042827,0.0214 0.1070667,0.0214 0.1498934,0.0214 0.2355467,0 0.4282668,-0.19272 0.4282668,-0.42827 l 0,-1.2848 c 0,-0.17131 -0.1070667,-0.3212 -0.2783734,-0.38544 l -0.9850136,-0.36403 0,-3.3833001 z m -2.5696005,8.0728301 0,-3.42614 1.777307,0.6424 0,3.42614 z',
  'sharp_height': 16.059999465942383,
  'bar': 'M 0,0 0,-100',
  'bar_height': 100,
  'delta_char': '\u0394',
  'delta_path': 'M 19.424709,0 9.7665062,21.9805 c -5.31,12.09 -9.70171875,22.1 -9.76171875,22.25 -0.09,0.25 0.90023458,0.2695 19.49023455,0.2695 10.77,0 19.549765,-0.059 19.509765,-0.1191 -0.03,-0.06 -4.209297,-10.07 -9.279297,-22.25 L 20.516506,0 19.965725,0 19.424709,0 Z m -1.308594,10.0117 c 0.06,0 12.718594,30.5984 13.058594,31.5684 0.03,0.09 -5.09,0.1504 -13.5,0.1504 l -13.5585934,0 0.4199218,-0.9688 c 2.2600001,-5.28 13.5200776,-30.75 13.5800776,-30.75 z',
  'delta_height': 44.5
};

},{}],51:[function(require,module,exports){
module.exports = `/*<![CDATA[*/
  .OligophonyPlayedBeat path,
  .OligophonyPlayedBeat text {
    fill: lightblue;
  }
/*]]>*/`;

},{}]},{},[1]);
