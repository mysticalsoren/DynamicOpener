function modifier() {
    /* 
    Preferably should be on top of everything else.
    
    text = DynamicOpener.remakeOpening()
    */
    // Subsequent libraries go here
    DynamicOpener.cleanup()
    return { text: text, stop: false }
}
modifier();