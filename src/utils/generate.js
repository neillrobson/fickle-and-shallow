const aCode = 97;

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
