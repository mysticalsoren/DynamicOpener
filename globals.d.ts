interface StoryCard {
    id: string,
    createdAt: string,
    updatedAt: string,
    keys: string, // triggers
    entry: string,
    type: string,
    title: string,
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