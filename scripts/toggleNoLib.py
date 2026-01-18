import os
import json

if __name__ == "__main__":
    jsconfig = os.path.join("jsconfig.json")
    with open(jsconfig) as f:
        content: dict = json.loads(f.read())
    compilerOptions: dict = content["compilerOptions"]
    compilerOptions["noLib"] = not compilerOptions["noLib"]
    os.remove(jsconfig)
    with open(jsconfig, "x", encoding="utf8") as f:
        f.write(json.dumps(content, indent=4))