enum Seporators {
    Comma = ',',
    Dot = '.'
}
enum Symbols {
    Dollar = '$'
} 
interface Options {
    symbol: Symbols,
    separator: Seporators,
    decimal: Seporators,
    formatWithSymbol: boolean,
    errorOnInvalid: boolean,
    precision: number,
    pattern: string,
    negativePattern: string
    increment: number
    groups: RegExp
    useVedic?: boolean
}

interface ICurrency {
    intValue: number
    groups: RegExp
    value: string | number
}

const round = (v: number):number => Math.round(v)
const pow = (p: number):number => Math.pow(10, p)
const rounding = (value:number, increment:number):number => round(value / increment) * increment

const groupRegex = /(\d)(?=(\d{3})+\b)/g
const vedicRegex = /(\d)(?=(\d\d)+\d\b)/g

const defaults:Options = {
    symbol: Symbols.Dollar,
    separator: Seporators.Comma,
    decimal: Seporators.Dot,
    formatWithSymbol: false,
    errorOnInvalid: false,
    precision: 2,
    pattern: '!#',
    negativePattern: '-!#',
    increment: 0,
    groups: groupRegex
}

/**
 * Create a new instance of currency.js
 * @param {number|string|currency} value
 * @param {object} [opts]
 */

class Currency<V> {
    public intValue = 0
    public groups = groupRegex
    public value: string | number | V = 0
    private _settings = defaults
    private _precision = 0
    constructor (value: V, opts: Options) {
        let that = this
        this._settings = opts

        if (!(that instanceof Currency)) {
            return new Currency<V>(value, opts)
        }

        let settings = Object.assign({}, defaults, opts),
            precision = pow(settings.precision),
            v = parse<V>(value, settings)

        this.intValue = v
        this.value = v / precision

        // Set default incremental value
        settings.increment = settings.increment || 1 / precision

        // Support vedic numbering systems
        // see: https://en.wikipedia.org/wiki/Indian_numbering_system
        if (settings.useVedic) {
            settings.groups = vedicRegex
        } else {
            settings.groups = groupRegex
        }

        // Intended for internal usage only - subject to change
        this._settings = settings
        this._precision = precision
    }

    add(number:number): Currency<number> {
        var _a = this, intValue = _a.intValue, _settings = _a._settings, _precision = _a._precision;
        return new Currency((intValue += parse<number>(number, _settings)) / _precision, _settings);
    }

    /**
     * Subtracts value.
     * @param {number} number
     * @returns {currency}
     */
    subtract(number:number): Currency<number> {
        let { intValue, _settings, _precision } = this
        return new Currency(
            (intValue -= parse<number>(number, _settings)) / _precision,
            _settings
        )
    }

    /**
     * Multiplies values.
     * @param {number} number
     * @returns {currency}
     */
    multiply(number:number): Currency<number> {
        let { intValue, _settings } = this
        return new Currency((intValue *= number) / pow(_settings.precision), _settings)
    }

    /**
     * Divides value.
     * @param {number} number
     * @returns {currency}
     */
    divide(number:number): Currency<number> {
        let { intValue, _settings } = this
        return new Currency((intValue /= parse<number>(number, _settings, false)), _settings)
    }

    /**
     * Takes the currency amount and distributes the values evenly. Any extra pennies
     * left over from the distribution will be stacked onto the first set of entries.
     * @param {number} count
     * @returns {array}
     */
    distribute(count:number): Array<Currency> {
        let { intValue, _precision, _settings } = this,
            distribution = [],
            split = Math[intValue >= 0 ? 'floor' : 'ceil'](intValue / count),
            pennies = Math.abs(intValue - split * count)

        for (; count !== 0; count--) {
            let item = new Currency(split / _precision, _settings)

            // Add any left over pennies
            pennies-- > 0 &&
                (item =
                    intValue >= 0
                        ? item.add(1 / _precision)
                        : item.subtract(1 / _precision))

            distribution.push(item)
        }

        return distribution
    }

    /**
     * Returns the dollar value.
     * @returns {number}
     */
    dollars() {
        return ~~this.value
    }

    /**
     * Returns the cent value.
     * @returns {number}
     */
    cents() {
        let { intValue, _precision } = this
        return ~~(intValue % _precision)
    }

    /**
     * Formats the value as a string according to the formatting settings.
     * @param {boolean} useSymbol - format with currency symbol
     * @returns {string}
     */
    format(useSymbol: boolean): string {
        let {
            pattern,
            negativePattern,
            formatWithSymbol,
            symbol,
            separator,
            decimal,
            groups,
        } = this._settings,
            values = (this + '').replace(/^-/, '').split('.'),
            dollars = values[0],
            cents = values[1]

        // set symbol formatting
        typeof useSymbol === 'undefined' && (useSymbol = formatWithSymbol)

        return (this.value >= 0 ? pattern : negativePattern)
            .replace('!', useSymbol ? symbol : '')
            .replace(
                '#',
                `${dollars.replace(groups, '$1' + separator)}${
                cents ? decimal + cents : ''
                }`
            )
    }

    /**
     * Formats the value as a string according to the formatting settings.
     * @returns {string}
     */
    toString(): string {
        let { intValue, _precision, _settings } = this
        return rounding(intValue / _precision, _settings.increment).toFixed(
            _settings.precision
        )
    }

    /**
     * Value for JSON serialization.
     * @returns {float}
     */
    toJSON() {
        return this.value
    }
}
/**
 * 
 * @param value 
 * @param opts 
 * @param useRounding 
 */
function parse<V>(value:V, opts: Options, useRounding = true): number {
    let v = 0,
        { decimal, errorOnInvalid, precision: decimals } = opts,
        precision = pow(decimals),
        isNumber = typeof value === 'number'

    if (isNumber || value instanceof Currency) {
        v = (isNumber ? value : value.value) * precision
    } else if (typeof value === 'string') {
        let regex = new RegExp('[^-\\d' + decimal + ']', 'g'),
            decimalString = new RegExp('\\' + decimal, 'g')
        v =
            value
                .replace(/\((.*)\)/, '-$1') // allow negative e.g. (1.99)
                .replace(regex, '') // replace any non numeric values
                .replace(decimalString, '.') * precision // convert any decimal values // scale number to integer value
        v = v || 0
    } else {
        if (errorOnInvalid) {
            throw Error('Invalid Input')
        }
        v = 0
    }

    // Handle additional decimal for proper rounding.
    v = parseInt(v.toFixed(4), 10)

    return useRounding ? round(v) : v
}

export default Currency
