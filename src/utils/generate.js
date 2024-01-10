const aCode = 97;

function base26divmod(i) {
    const mod = i % 26;
    const div = (i - mod) / 26;

    if (mod === 0) {
        return [div - 1, mod + 26];
    }

    return [div, mod];
}

/**
 * Converts numeric indexes into Excel-style alphabetic IDs.
 *
 * A "zero" digit doesn't exist in the alphabet, so the output of this function isn't true "base 26."
 * Think of the output more like column labels in Excel.
 *
 * @param {Number} i Zero-based index to convert
 * @returns Base-26 alphabetic ID
 */
export function indexToAlphabeticID(i) {
    ++i; // Start at index 1
    const chars = [];

    while (i > 0) {
        const [div, mod] = base26divmod(i);
        chars.unshift(String.fromCharCode(aCode - 1 + mod));
        i = div;
    }

    return chars.join('');
}

function alphaIncrement(str) {
    let carry = true;

    let result = str.split('').reduceRight((acc, c) => {
        let code = c.charCodeAt(0);
        code -= aCode;
        code = (code + (carry ? 1 : 0)) % 26;
        code += aCode;
        carry = carry && code === aCode;
        acc.unshift(String.fromCharCode(code));

        return acc;
    }, []);

    if (carry) {
        result.unshift('a');
    }

    return result.join('');
}

function* alphabetKeys() {
    let string = '';

    while (true) {
        string = alphaIncrement(string);

        yield string;
    }
}

/**
 * Create a dummy object with the given number of keys (lowercase excel column names)
 *
 * For reference, the default number of keys is 1 million, creating keys from 'a' to 'bdwgo'
 *
 * @param {Number} count Number of keys to generate
 * @param {Function} filler Function used to generate values
 */
export function alphabetMap(count = 1e4, filler = (i) => ({ i })) {
    const ret = {};
    const itr = alphabetKeys();

    for (let i = 0; i < count; i++) {
        ret[itr.next().value] = filler(i);
    }

    return ret;
}
