function modifier() {
    const data = DynamicOpener.initialize()
    /*
    if (data) {
        data[""] = ""
        data[""] = data[""].toLowerCase() === "" ? "true" : "false"
    }
    */
    DynamicOpener.apply()
    // subsequent libraries
    return { text: text, stop: false }
}
modifier();