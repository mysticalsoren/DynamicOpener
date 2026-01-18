import os
import json
import subprocess

from argparse import ArgumentParser
from typing import TypedDict

class DependencyDict(TypedDict):
    git: str
    hash: str

if __name__ == "__main__":
    cwd = os.getcwd()
    dependencies = os.path.join("dependencies.json")
    
    parser = ArgumentParser(
        usage="Clones and downloads git repositories with the spermic commit hash.",
        description=f"Uses a {dependencies} to generate dependencies",
    )
    parser.add_argument("--update", "-u",action="store_true",help="Force all dependencies to update.")
    
    ARGS = parser.parse_args()
    assert os.path.isfile(dependencies)
    if not os.path.isdir("lib"):
        os.mkdir("lib")
    with open(dependencies) as f:
        content: dict = json.loads(f.read())
    for key in content.keys():
        dependency: DependencyDict = content[key]
        d_git = dependency.get("git",None)
        d_hash = dependency.get("hash",None)
        
        if not isinstance(d_git, str) or len(d_git) < 1:
            continue
        if d_git.endswith("/"):
            d_git = d_git[:len(d_git)-1]
        elif d_git.endswith("\\\\"):
            d_git = d_git[:len(d_git)-2]
        dependency["git"] = d_git
        
        lib_path = os.path.join("lib",key)
        if not os.path.isdir(lib_path):
            subprocess.run(f"git clone {d_git} {os.path.join(os.curdir,lib_path)}")
        
        if not isinstance(d_hash, str) or len(d_hash) < 40 or ARGS.update:
            os.chdir(lib_path)
            subprocess.run("git pull")
            dependency["hash"] = subprocess.run("git rev-parse HEAD",capture_output=True,text=True).stdout.replace("\n","")
            os.chdir(cwd)
        
        os.chdir(lib_path)
        subprocess.run(f"git reset --hard {dependency['hash']}")
        os.chdir(cwd)
    
    os.remove(dependencies)
    with open(dependencies, "x", encoding="utf8") as f:
        f.write(json.dumps(content, indent=4))