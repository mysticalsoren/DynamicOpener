class DynamicOpener {
    /**
     * @typedef {Record<string, number | string | boolean>} DynamicOpenerData
     */
    static REGEX_REPLACEMENT = /\$(\w+)/g
    static MAX_TURN_ORDER = 2
    static get #DEBUGGER() {
        return MysticalSorenUtilities.Debugger(this.name)
    }
    static #MARKS = new Set(['"', "'", "`"])
    /**
     * Returns a substring without quotations or the string itself if met with unclosed or no marks
     * @param {string} str 
     * @returns {string}
     */
    static #parseQuotations(str) {
        if (this.#MARKS.has(str.charAt(0))) {
            if (str.charAt(str.length - 1) !== str.charAt(0)) {
                this.#DEBUGGER.log(`Couldn't parse quotations. Did you close it correctly? ${str}`)
                return str
            }
            return str.substring(1, str.length - 2)
        }
        return str
    }
    /**
     * An String.replace wrapper function that refers to the current data found on global state
     * @param {DynamicOpenerData} data The data to refer to 
     * @returns {(match: string, key: string) => (string)}
     */
    static #replacementCallback(
        data = MysticalSorenUtilities.AIDungeon.getState(this.name, {})
    ) {
        return (match, key) => {
            if (data[key] === undefined) {
                this.#DEBUGGER.log(`Couldn't replace ${match}. There isn't a key-pair to replace it with.`)
                return match
            }
            return data[key].toString()
        }
    }
    /**
     * Reads Plot Essentials on the start of a scenario, parsing it. Must be ran on Turn Order 0.
     * @returns {DynamicOpenerData}
     */
    static initialize() {
        /**
         * @type {DynamicOpenerData}
         */
        const data = MysticalSorenUtilities.AIDungeon.getState(this.name, {})
        if (MysticalSorenUtilities.AIDungeon.getTurnOrder() === 0) {
            const referenceCallback = this.#replacementCallback(data)
            const OPERATORS = "!=<>"

            const CONDITIONAL_REGEX = new RegExp(
                `\\s*([^${OPERATORS}]+)([${OPERATORS}]{1,2})\\s*([^?]+)\\?\\s*([^:]+):(.+)`
            )
            /**
             * 
             * @param {string} match The regex matching string
             * @param {string} compareA The left side of the operation
             * @param {string} compareOp The comparison operator to be used
             * @param {string} compareB The right side of the operation
             * @param {string} tValue The value to return when true
             * @param {string} fValue The value to return when false
             * @returns {string}
             */
            const conditionalParser = (match, compareA, compareOp, compareB, tValue, fValue) => {
                if (
                    typeof compareA !== "string" ||
                    typeof compareOp !== "string" ||
                    typeof compareB !== "string" ||
                    typeof tValue !== "string" ||
                    typeof fValue !== "string"
                ) {
                    this.#DEBUGGER.log("Couldn't parse conditional. Did the given Regex make five capture groups?")
                    return "InsufficientCaptureGroupError"
                }
                if (compareOp.length !== 2 || compareOp.match(/[^!=<>]/)) {
                    this.#DEBUGGER.log(`Couldn't parse conditional. The second capture group must capture one or two characters of "!=<>". Got "${compareOp}"`)
                    return "InvalidOperatorError"
                }
                compareA = compareA.trim()
                compareA = this.#parseQuotations(compareA)
                compareA = MysticalSorenUtilities.escapeCharacter(compareA)
                compareB = compareB.trim()
                compareB = this.#parseQuotations(compareB)
                compareB = MysticalSorenUtilities.escapeCharacter(compareB)
                const a = MysticalSorenUtilities.convertString(
                    compareA.replaceAll(this.REGEX_REPLACEMENT, referenceCallback)
                )
                const b = MysticalSorenUtilities.convertString(
                    compareB.replaceAll(this.REGEX_REPLACEMENT, referenceCallback)
                )
                const typeA = typeof a
                const typeB = typeof b
                if (compareOp.includes('<')) {
                    if (typeA !== "number" && typeB !== "number") {
                        this.#DEBUGGER.log(`Couldn't parse conditional. Cannot use '<' on A and B when types are "${typeA}" and "${typeB}", respectively.`)
                        return fValue
                    }
                    if (compareOp.includes('!')) {
                        return a >= b ? tValue : fValue
                    }
                    if (a < b) {
                        return tValue
                    }
                }
                if (compareOp.includes('>')) {
                    if (typeA !== "number" && typeB !== "number") {
                        this.#DEBUGGER.log(`Couldn't parse conditional. Cannot use '>' on A and B when types are "${typeA}" and "${typeB}", respectively.`)
                        return fValue
                    }
                    if (compareOp.includes('!')) {
                        return a <= b ? tValue : fValue
                    }
                    if (a > b) {
                        return tValue
                    }
                }
                if (
                    (compareOp === "!=" || compareOp === "=!") &&
                    a !== b
                ) {
                    return tValue
                }
                if (
                    (
                        compareOp.charAt(1) === '=' ||
                        compareOp === "=>" ||
                        compareOp === "=<"
                    ) &&
                    a === b) {
                    return tValue
                }
                return fValue
            }
            /**
             * Intended to be used with string.replace
             * @param {string} match The regex matching string
             * @param {string} name Variable name
             * @param {string} value Variable value
             * @returns {''} an empty string
             */
            const assignmentParser = (match, name, value) => {
                if (typeof name !== "string" || typeof value !== "string") {
                    this.#DEBUGGER.log("Couldn't parse assignment. Did the given Regex make two capture groups?")
                    return ''
                }
                name = this.#parseQuotations(name)
                name = MysticalSorenUtilities.escapeCharacter(name)
                let converted = MysticalSorenUtilities.convertString(value)
                if (typeof converted !== "string") {
                    data[name] = converted
                    return ''
                }
                value = this.#parseQuotations(value)
                value = MysticalSorenUtilities.escapeCharacter(value)
                value = value.replace(CONDITIONAL_REGEX, conditionalParser).trim()
                converted = MysticalSorenUtilities.convertString(value)
                if (typeof converted === "string") {
                    converted = converted.replaceAll(this.REGEX_REPLACEMENT, referenceCallback)
                }
                data[name] = converted
                return ''
            }
            state.memory.context = state.memory.context.replaceAll(/^\s*(\w+)\s*=\s*(.+)$/gm, assignmentParser).trim()
            MysticalSorenUtilities.AIDungeon.setState(this.name, data)
        }
        if (!MysticalSorenUtilities.hasKeys(data) && MysticalSorenUtilities.AIDungeon.getTurnOrder() <= this.MAX_TURN_ORDER) {
            this.#DEBUGGER.log("Empty config data!")
        }
        return data
    }
    /**
     * Sets a variable into the config state.
     * @param {string} varName Variable name
     * @param {string | boolean | number} varValue Variable value
     * @returns {DynamicOpenerData}
     * @deprecated use state["DynamicOpener"]["VariableName"]
     */
    static set(varName, varValue) {
        const data = MysticalSorenUtilities.AIDungeon.getState(this.name, {})
        data[varName] = varValue
        MysticalSorenUtilities.AIDungeon.setState(this.name, data)
        return data
    }
    /**
     * Updates Plot Essentials, Author's Note, and StoryCards. Must be ran on Turn Order 0.
     * @returns {void}
     */
    static apply() {
        if (MysticalSorenUtilities.AIDungeon.getTurnOrder() > 0) {
            // this.DEBUGGER.log("Can only be run on Turn Order 0.")
            return
        }
        const callback = this.#replacementCallback()
        /**
         * @param {string} str 
         * @returns {string}
         */
        const format = (str) => {
            return MysticalSorenUtilities.toSentenceCase(
                str.replaceAll(this.REGEX_REPLACEMENT, callback)
            )
        }
        state.memory.context = format(state.memory.context)
        state.memory.authorsNote = format(state.memory.authorsNote)
        storyCards.forEach((card) => {
            card.title = format(card.title)
            card.type = format(card.type)
            card.entry = format(card.entry)
            card.keys = format(card.keys)
            card.description = format(card.description)
        })
    }
    /**
     * Remakes opening with the data. Must be ran on Output with Turn Order 0 or a Retry context on Turn Order 2.
     * 
     * If it doesn't meet the criteria, it will return the global text object
     * @param {string} opening The opening. Defaults to the scenario's opening.
     * @returns {string}
     */
    static remakeOpening(
        opening = MysticalSorenUtilities.AIDungeon.getRecentAction("output").text
    ) {
        if (typeof opening !== "string") {
            return text
        }
        const turnOrder = MysticalSorenUtilities.AIDungeon.getTurnOrder()
        if (turnOrder > this.MAX_TURN_ORDER) {
            return text
        }
        if (turnOrder === this.MAX_TURN_ORDER && !MysticalSorenUtilities.AIDungeon.isRetryTurn()) {
            return text
        }
        return MysticalSorenUtilities.toSentenceCase(opening.replaceAll(this.REGEX_REPLACEMENT, this.#replacementCallback()))
    }
    /**
     * Sets state["DynamicOpener"] to be undefined after turn order 2. Recommended to put on Output.
     */
    static cleanup() {
        if (MysticalSorenUtilities.AIDungeon.getTurnOrder() > this.MAX_TURN_ORDER) {
            MysticalSorenUtilities.AIDungeon.removeState(this.name)
        }
    }
}