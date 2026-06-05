// #region DynamicOpener
/*	======== LICENSE ========
	MIT License
	
	Copyright (c) 2026 mysticalsoren
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
	======== LICENSE ========	*/

/*	======== CONTRIBUTORS ========
	mysticalsoren - code contributor
	======== CONTRIBUTORS ========	*/

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
            if (str.length === 2) {
                return ""
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
        // @ts-ignore
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
    //  * @returns {DynamicOpenerData?} an Record<string, primitives> or null
     */
    static initialize() {
        const turnOrder = MysticalSorenUtilities.AIDungeon.getTurnOrder()
        if (turnOrder > this.MAX_TURN_ORDER) {
            return null
        }
        /**
         * @type {DynamicOpenerData}
         */
        const data = MysticalSorenUtilities.AIDungeon.getState(this.name, {})
        if (turnOrder === 0) {
            const OPERATORS = "!=<>*~"
            const OPS_VERIFY_REGEX = new RegExp(`[^${OPERATORS}]`)

            const CONDITIONAL_REGEX = new RegExp(
                `\\s*([^${OPERATORS}]*)([${OPERATORS}]{1,2})\\s*([^?]*)\\?\\s*([^:]*):\s*(.*)`
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
                if (compareOp.length < 1 || compareOp.length > 2 || compareOp.match(OPS_VERIFY_REGEX)) {
                    this.#DEBUGGER.log(`Couldn't parse conditional. The second capture group must capture one or two characters of ${OPERATORS}". Got "${compareOp}"`)
                    return "InvalidOperatorError"
                }
                compareA = compareA.trim()
                compareA = this.#parseQuotations(compareA)
                compareA = MysticalSorenUtilities.escapeCharacter(compareA)
                compareB = compareB.trim()
                compareB = this.#parseQuotations(compareB)
                compareB = MysticalSorenUtilities.escapeCharacter(compareB)
                const a = MysticalSorenUtilities.convertString(
                    compareA.replaceAll(this.REGEX_REPLACEMENT, this.#replacementCallback(data))
                )
                const b = MysticalSorenUtilities.convertString(
                    compareB.replaceAll(this.REGEX_REPLACEMENT, this.#replacementCallback(data))
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
                if (compareOp === "*=" || compareOp === "=*") {
                    if (typeA !== "string" && typeB !== "string") {
                        this.#DEBUGGER.log(`Couldn't do contains operation. A and B are types, "${typeA}" and "${typeB}", respectively. Must be string types.`)
                        return fValue
                    }
                    return a.includes(b) ? tValue : fValue
                }
                if (compareOp === "~=" || compareOp === "=~") {
                    if (typeA !== "string" && typeB !== "string") {
                        this.#DEBUGGER.log(`Couldn't do case-insensitive operation. A and B are types, "${typeA}" and "${typeB}", respectively. Must be string types.`)
                        return fValue
                    }
                    return a.toLowerCase() === b.toLowerCase() ? tValue : fValue
                }
                if (compareOp === "~*" || compareOp === "*~") {
                    if (typeA !== "string" && typeB !== "string") {
                        this.#DEBUGGER.log(`Couldn't do case-insensitive contains operation. A and B are types, "${typeA}" and "${typeB}", respectively. Must be string types.`)
                        return fValue
                    }
                    return a.toLowerCase().includes(b.toLowerCase()) ? tValue : fValue
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
                if (name.toLowerCase() === "opening") {
                    this.#DEBUGGER.log(`\
                        Cannot assign variable, "opening" or its alternative capitalization, \
                        as it is a reserved keyword that DynamicOpener uses.\
                    `)
                    return ''
                }
                value = this.#parseQuotations(value)
                value = MysticalSorenUtilities.escapeCharacter(value)
                value = value.replace(CONDITIONAL_REGEX, conditionalParser).trim()
                converted = MysticalSorenUtilities.convertString(value)
                if (typeof converted === "string") {
                    converted = converted.replaceAll(this.REGEX_REPLACEMENT, this.#replacementCallback(data))
                }
                data[name] = converted
                return ''
            }
            state.memory.context = state.memory.context.replaceAll(/#\s*opening\n+\s*([^\r\t\f\v]+?)\n+\s*#\s*opening/g, (match, opening) => {
                data["opening"] = data["opening"] || opening
                return ''
            })
            state.memory.context = state.memory.context.replaceAll(/^\s*(\w+)\s*=\s*(.+)$/gm, assignmentParser).trim()
            state.memory.context = state.memory.context.replaceAll(/\n{3}/g, "")
            MysticalSorenUtilities.AIDungeon.setState(this.name, data)
        }
        if (!MysticalSorenUtilities.hasKeys(data) && turnOrder <= this.MAX_TURN_ORDER) {
            this.#DEBUGGER.log("Empty config data!")
        }
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
        /**
         * @param {string} str 
         * @returns {string}
         */
        const format = (str) => {
            return MysticalSorenUtilities.toSentenceCase(
                str.replaceAll(this.REGEX_REPLACEMENT, this.#replacementCallback())
            )
        }
        state.memory.context = format(state.memory.context)
        if (state.memory.authorsNote) {
            state.memory.authorsNote = format(state.memory.authorsNote)
        }
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
     * 
     * Opening priority: **[Plot Essentials] #opening > remakeOpening("...") > defaultScenarioOpening**
     * @param {string | undefined} opening The opening. Defaults to the scenario's opening. If data["opening"] is a string value then it overrides everything.
     * @returns {string}
     */
    static remakeOpening(
        opening = MysticalSorenUtilities.AIDungeon.getRecentAction("output")?.text
    ) {
        if (typeof opening !== "string") {
            return text
        }
        const data = MysticalSorenUtilities.AIDungeon.getState(this.name, {})
        // @ts-ignore
        if (typeof data["opening"] === "string") {
            // @ts-ignore
            opening = data["opening"]
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
    /**
     * An utility class containing useful functions
     */
    static Extra = {
        /**
         * Mutates on `data` to provide a set of keys that is based on gender. Follows the format, "\<prefix\>\<genderWord\>".
         * 
         * By convention, `genderWord` will always be the masculine form of the word.
         * 
         * Also, it provides the capitalized form. Just capitalize the first letter.
         * 
         * **Requires a predefined key containing the word 'gender' to work.**
         * 
         * Example:
         * ```
         * data["plrGender"] = "male"
         * console.log(data["plrhe"]) // he
         * console.log(data["plrhimself"]) // himself
         *
         *  data["plrGender"] = "female"
         *  console.log(data["plrhe"]) // she
         *  console.log(data["plrhimself"]) // herself
         * ```
         */
        genderKeys() {
            const data = MysticalSorenUtilities.AIDungeon.getState(DynamicOpener.name, {})
            Object.keys(data).forEach((key) => {
                const idx = key.toLowerCase().indexOf("gender")
                if (idx < 0) {
                    return
                }
                const prefix = key.substring(0, idx)
                    // @ts-ignore
                data[key] = data[key].toString().toLowerCase()
                /**
                 * @param {string} suffix the suffix key
                 * @param {string} mV maleValue
                 * @param {string} fV femaleValue
                 */
                const AddItem = (suffix, mV, fV) => {
                    // @ts-ignore
                    data[`${prefix}${suffix}`] = data[key] === "male" ? mV : fV
                    // @ts-ignore
                    data[`${prefix}${MysticalSorenUtilities.toSentenceCase(suffix)}`] = data[key] === "male" ? MysticalSorenUtilities.toSentenceCase(mV) : MysticalSorenUtilities.toSentenceCase(fV)
                }
                // #endregion

                // #region (Pro)nouns
                AddItem("his", "his", "her")
                AddItem("himself", "himself", "herself")
                AddItem("him", "him", "her")
                AddItem("he", "he", "she")
                AddItem("bro", "brother", "sister")
                AddItem("uncle", "uncle", "aunt")
                AddItem("dad", "dad", "mom")
                AddItem("daddy", "daddy", "mommy")
                AddItem("father", "father", "mother")
                AddItem("papa", "papa", "mama")
                AddItem("pa", "pa", "ma")
                AddItem("mister", "mister", "miss")
                AddItem("mr", "Mr.", "Ms.")
                AddItem("boy", "boy", "girl")
                AddItem("man", "man", "woman")
                AddItem("men", "men", "women")
                AddItem("bf", "boyfriend", "girlfriend")
                AddItem("boyfriend", "boyfriend", "girlfriend")
                AddItem("husband", "husband", "wife")
                // #endregion

                // #region Fantasy
                AddItem("prince", "prince", "princess")
                AddItem("butler", "butler", "maid")
                AddItem("hero", "hero", "heroine")
                AddItem("villain", "villain", "villainess")
                AddItem("king", "king", "queen")
                AddItem("duke", "duke", "duchess")
                AddItem("lord", "lord", "lady")
                AddItem("demon", "demon", "demoness")
                // #endregion

                // #region Eastern
                AddItem("swordsman", "swordsman", "swordswoman")
                AddItem("shinobi", "shinobi", "kunoichi")
                // #endregion

                // #region Titles
                AddItem("minister", "minister", "ministress")
                // #endregion
            })
            MysticalSorenUtilities.AIDungeon.setState(DynamicOpener.name,data)
        }
    }
}
// #endregion

// #region MysticalSorenUtils
/*	======== LICENSE ========
	MIT License
	
	Copyright (c) 2026 mysticalsoren
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
	======== LICENSE ========	*/

/*	======== CONTRIBUTORS ========
	mysticalsoren - code contributor
	======== CONTRIBUTORS ========	*/

/*export */class MysticalSorenUtilities {
  static #Private = {
    Debugger: this.Debugger("MysticalSorenUtilities")
  }
  // #region Debugger
  /**
   * @typedef {Object} Debugger
   * @property {String} namespace
   * @property {String} separator
   * @property {boolean} enabled
   * @property {(values: any) => void} log
   */
  /**
   * A class for everything related to troubleshooting and logging.
   * @param {String} namespace  Default value: "UnnamedDebugger"
   * @param {String} separator Default value: " "
   * @returns {Debugger} Debugger. A class.
   */
  static Debugger(namespace = "", separator = " ") {
    return {
      namespace: typeof namespace === "string" ? namespace : "UnnamedDebugger",
      separator: separator,
      enabled: true,
      log(...values) {
        if (!this.enabled) {
          return
        }
        let message = namespace + ":"
        /**
         * Recursivly go through the number of values, stringifying the value.
         * @param {any} value Any datatype is accepted.
         * @returns the stringified value
         */
        const composeString = (value) => {
          let component = ""
          if (MysticalSorenUtilities.hasItems(value)) {
            component += "["

            /** @param {any} item */
            const vCallback = (item) => {
              component += `${composeString(item)},`
            }
            value.forEach(vCallback);

            component = component.substring(0, component.length - 1) + "]"
            return component
          }
          if (MysticalSorenUtilities.hasKeys(value)) {
            component += "{"
            for (const [k, v] of Object.entries(value)) {
              component += `${k}: ${composeString(v)},`
            }
            component = component.substring(0, component.length - 1) + "}"
            return component
          }
          return `${value}`
        }
        for (const value of values) {
          message += separator + composeString(value)
        }
        console.log(message)
      }
    }
  }
  //  #endregion
  // #region AIDungeon
  /**
   * @typedef {Object} HistoryEntry
   * @property {String} text
   * @property {String} rawText deprecated, use text.
   * @property {"start" | "continue" | "do" | "say" | "story" | "see"} type
   */
  /**
   * @typedef {Object} StoryCard
   * @property {String} id
   * @property {String} createdAt
   * @property {String} updatedAt
   * @property {String} keys also known as Triggers
   * @property {String} entry
   * @property {String} type
   * @property {String} title
   * @property {String} description also known as Notes
   * @property {boolean} useForCharacterCreation
   */
  /**
   * @typedef {Object} Placeholder
   * @property {string} question The prompt that asks the user.
   * @property {string} answer The given response to the corresponding question.
   */
  static AIDungeon = {
    /**
     * Gets the current turn order.
     * @returns {number} number. The current turn order
     */
    getTurnOrder() {
      return info.actionCount || 0
    },
    /**
     * Detects if it is running under retry context. Works on Context and Output.
     * @returns {boolean} Returns true if it is a retry action
     */
    isRetryTurn() {
      return this.getTurnOrder() === (history.length + 1)
    },
    /**
     * Returns the latest action taken by the player.
     * @param {"input" | "context" | "output"} context the current context it is running on
     * @returns {HistoryEntry?} HistoryEntry.
     */
    getRecentAction(context) {
      if (!MysticalSorenUtilities.hasItems(history)) {
        MysticalSorenUtilities.#Private.Debugger.log("Could not get recent action. There are no actions.")
        return null
      }
      if (typeof context != "string") {
        MysticalSorenUtilities.#Private.Debugger.log("Could not get recent action. context is not a string.")
        return null
      }
      if (context.toLowerCase() in ["context", "output"]) {
        MysticalSorenUtilities.#Private.Debugger.log("Could not get recent action. It isn't ran in the Context Hook!")
        if (context.toLowerCase() === "input") {
          MysticalSorenUtilities.#Private.Debugger.log('Use "text" instead to get the recent action!')
          return null
        }
        return null
      }
      return history[history.length - 1]
    },
    /**
     * Gets the storyCards index given an storycard.id
     * @param {number | string} id storycard.id
     * @returns {number} number. If not found, returns -1.
     */
    getStoryCardIndexById(id) {
      if (typeof id === "string" || typeof id === "number") {
        id = id.toString()
        for (const [index, storyCard] of storyCards.entries()) {
          if (storyCard.id === id) {
            return index
          }
        }
        MysticalSorenUtilities.#Private.Debugger.log(`Could not get story card by id with the search id of "${id}"`)
        return -1
      }
      MysticalSorenUtilities.#Private.Debugger.log("Could not get story card by id. id is not a number!")
      return -1


    },
    /**
     * Gets StoryCards given a list of storycard.id
     * @param {string[] | number[]} ids a list of storycard.id
     * @returns {StoryCard[]} A array of StoryCards
     */
    getStoryCardsByIds(ids) {
      /** @type {StoryCard[]} */
      const cards = []
      if (!MysticalSorenUtilities.hasItems(ids)) {
        MysticalSorenUtilities.#Private.Debugger.log("Could not get story cards. There are no ids to go through.")
        return cards
      }
      for (const id of ids) {
        const idx = this.getStoryCardIndexById(id)
        if (idx < 0) {
          continue
        }
        cards.push(storyCards[idx])
      }
      return cards
    },
    /**
     * Gets StoryCards matching the name(s) given.
     * @param {string[]} names A array of storycard.title
     * @returns {StoryCard[]}
     */
    getStoryCardsByNames(names) {
      /** @type {StoryCard[]} */
      const cards = []
      if (!MysticalSorenUtilities.hasItems(names)) {
        MysticalSorenUtilities.#Private.Debugger.log("Could not get story cards. There are no names to go through.")
        return cards
      }
      for (const name of names) {
        for (const storyCard of storyCards) {
          if (storyCard.title === name) {
            cards.push(storyCard)
          }
        }
      }
      return cards
    },
    /**
     * Gets a list of storycard ids matching the name given.
     * @param {string} name storycard.title
     * @returns {string[]} An array of storycard.id, if any.
     */
    getStoryCardIdsByName(name) {
      /** @type {string[]} */
      const cards = []
      for (const storyCard of this.getStoryCardsByNames([name])) {
        cards.push(storyCard.id)
      }
      return cards
    },
    /**
     * Converts a array of StoryCards into a Map with the storycard.id
     * being the key to the StoryCard
     * @param {StoryCard[]?} _storyCards An array of StoryCards. If left empty, it defaults to the global storyCards.
     * @returns {Map<string,StoryCard>} an map of storycard.id keys to StoryCard values
     */
    getStoryCardsAsMap(_storyCards = null) {
      if (!MysticalSorenUtilities.hasItems(_storyCards)) {
        MysticalSorenUtilities.#Private.Debugger.log(`\
          Given storyCards has no items. Defaulting to global storyCards\
        `)
        _storyCards = storyCards
      }
      const result = new Map()
      // @ts-ignore
      for (const storyCard of _storyCards) {
        result.set(storyCard.id, storyCard)
      }
      return result
    },
    /**
     * Adds a StoryCard.
     * @param {String} title the name of the story card
     * @param {String} entry the contents of the story card
     * @param {String} description the description of the story card
     * @param {String} type the category of the story card
     * @param {String} keys the triggers of the story card
     * @returns {StoryCard}
     */
    addStoryCard(title = "", entry = "", description = "", type = "class", keys = "") {
      const card = storyCards[addStoryCard(keys, entry, type) - 1]
      card.title = title
      card.description = description
      return card
    },
    /**
     * Sets the state to the global state.
     * @param {String} stateName the state name
     * @param {Object} stateObject the state object
     */
    setState(stateName, stateObject) {
      if (typeof stateName !== "string") {
        MysticalSorenUtilities.#Private.Debugger.log(`\
          Couldn't set state. The name isn't type of "string", found "${typeof stateName}"\
        `)
        return
      }
      if (!MysticalSorenUtilities.isPlainObject(stateObject)) {
        MysticalSorenUtilities.#Private.Debugger.log(`\
          Couldn't set state. The stateObject isn't a plain Object.\
        `)
        return
      }
      // @ts-ignore
      state[stateName] = stateObject
    },
    /**
     * Gets the state.
     * @param {String} stateName the state name
     * @param {Object} alternative Returns this object if it fails. If left out, it gives an empty Object.
     * @returns {Object}
     */
    getState(stateName, alternative = {}) {
      alternative = MysticalSorenUtilities.isPlainObject(alternative) ? alternative : {}
      if (typeof stateName !== "string") {
        MysticalSorenUtilities.#Private.Debugger.log(`\
          Couldn't get state. The name isn't type of "string", found "${typeof stateName}. Returning with alternative..."\
        `)
        return alternative
      }
      // @ts-ignore
      return state[stateName] || alternative
    },
    /**
     * Removes the state.
     * @param {String} stateName the state name
     */
    removeState(stateName) {
      if (typeof stateName !== "string") {
        MysticalSorenUtilities.#Private.Debugger.log(`\
          Couldn't remove state. The name isn't type of "string", found "${typeof stateName}"\
        `)
        return
      }
      // @ts-ignore
      state[stateName] = undefined
    }
  }
  // #endregion

  /**
   * Checks if the given parameter is a Array and isn't empty.
   * @param {any} arr The given Array object
   * @returns {boolean}
   */
  static hasItems(arr) {
    return Array.isArray(arr) && arr.length > 0
  }
  /**
   * Checks if the given Object is a basic Object.
   * @param {any} obj The given Object
   * @returns {boolean}
   */
  static isPlainObject(obj) {
    return obj && obj.constructor === Object
  }
  /**
   * Checks if the given Object is a basic Object and isn't empty.
   * @param {any} obj the given Object
   * @returns {boolean}
   */
  static hasKeys(obj) {
    return this.isPlainObject(obj) && Object.keys(obj).length > 0
  }
  /**
   * Picks a randomized value in the given Array.
   * @template T
   * @param {Array<T>} arr the loot table
   * @returns {T}
   */
  static randomItem(arr) {
    if (!this.hasItems(arr)) {
      this.#Private.Debugger.log("Could not get random item from array.")
    }
    return arr[Math.floor(Math.random() * arr.length)]
  }
  /**
   * Converts a string to its primitive.
   * @param {string} str 
   * @returns {string | number | boolean}
   */
  static convertString(str) {
    if (str.length === 0) {
      return str
    }
    const truthy = new Set(["true", "yes"])
    const falsy = new Set(["false", "no"])
    const numConversion = Number(str)
    const lower = str.toLowerCase()
    if (!Number.isNaN(numConversion)) {
      return numConversion
    }
    if (truthy.has(lower)) {
      return true
    }
    if (falsy.has(lower)) {
      return false
    }
    return str
  }
  /**
   * Capitalizes the first letter with a preceding ".?!"
   * @param {string} str the string to sentence-case
   * @returns The sentence-cased form
   */
  static toSentenceCase(str) {
    return str.replaceAll(/(?:^|[.!?])\s*[a-z]/g, (match) => {
      return match.toUpperCase()
    })
  }
  /**
   * Escapes a character with a preceding "\\"
   * @param {string} str the string to begin the escaping
   * @returns {string} The escaped form
   */
  static escapeCharacter(str) {
    return str.replaceAll(/\\(.)/g, "$1")
  }
}
// #endregion