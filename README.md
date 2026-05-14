
# Parwik

[Parwik: Simple Wiki Parser in JavaScript](https://github.com/jcubic/parwik)

[![npm](https://img.shields.io/badge/npm-0.1.0-blue.svg)](https://www.npmjs.com/package/parwik)
[![LICENSE MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/jcubic/parwik/blob/master/LICENSE)
[![CI](https://github.com/jcubic/parwik/actions/workflows/test.yaml/badge.svg)](https://github.com/jcubic/parwik/actions/workflows/test.yaml)
[![Coverage Status](https://coveralls.io/repos/github/jcubic/parwik/badge.svg?branch=master)](https://coveralls.io/github/jcubic/parwik?branch=master)

## Installation

```
npm install parwik
```

## Usage

```
import { parse } from 'parwik';

console.log(parse(`== This is Header ==

This is some [[Source Code]], which demostrates parwik library<ref>[https://github.com/jcubic/parwik parwik on GitHub]</ref>
`));
```

## Testing

```bash
npm test
npm run coverage
```

## Support

🚀 Need [professional help with Wikipedia integration or staff training](https://jcubic.pl/wikipedia/)?
Check out my Wikipedia Services.

## License

Copyright (c) 2026 [Jakub T. Jankiewicz](https://jakub.jankiewicz.org/)

Released under the MIT License. See [LICENSE](https://github.com/jcubic/parwik/blob/master/LICENSE) for details.
