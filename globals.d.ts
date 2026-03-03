interface StoryCard {
    /**
     * An unique identifier consisting a string of numbers.
     */
    id: string,
    createdAt: string,
    updatedAt: string,
    /**
     * The card's triggers.
     */
    keys: string,
    /**
     * The context to give to the AI.
     */
    entry: string,
    /**
     * If you wish to use a type that AIDungeon uses, make sure it is all lowercase.
     * 
     * For example, Class is known internally as 'class'.
     */
    type: string,
    /**
     * The name of the StoryCard. Note that it is only used as a label, it won't activate the card unless it is included in the `StoryCard.keys` entry
     */
    title: string,
    /**
     * Intended for humans to read. AI will not include this in its context.
     */
    description: string,
    useForCharacterCreation: boolean
}
declare global {
    var text: string,
    const history: [{
        text: string,
        rawText: string,
        type: "start" | "continue" | "do" | "say" | "story" | "see"
    }],
    const storyCards: [StoryCard]
    const state: {
        memory: {
            /**
             * @description Also known as Plot Essentials
             */
            context: string,
            authorsNote?: string,
            frontMemory?: string
        },
        message: string
    }
    const info: {
        characterNames: [string],
        actionCount: number,
        maxChars?: number,
        memoryLimit?: number,
        contextTokens?: number
    }
    const log = console.log
    function addStoryCard(keys: string, entry: string, type: string): number
    function removeStoryCard(index: number): void
    function updateStoryCard(index: number, keys?: string, entry?: string, type?: string): void
}

export { }