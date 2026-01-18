import os
import shutil
import json
import subprocess

# region findSrc
# def findSrc(directory: os.DirEntry) -> None | os.DirEntry:
#     """
#     Retrieves any src folder regardless of depth.
#     ```python
#     - library-A/
#         - examples/
#             - src/ # (It will grab this instead)
#                 - ...
#         - src/ # (when it should be this.)
#             library.js
#     ```
    
#     For right now, I'll leave it alone.
#     """
#     if directory.is_file():
#         return None
#     for entry in os.scandir(directory.path):
#         if entry.is_file() or entry.name.startswith("."):
#             continue
#         if entry.name != "src":
#             result = findSrc(entry)
#             if result and result.name == "src":
#                 return result
#         else:
#             return entry
#     return None
# endregion

def file_has_contents(path: str) -> bool:
    if not os.path.isfile(path):
        return False
    try:
        with open(path, encoding="utf8") as f:
            return len(f.readline()) > 1
    except Exception as e:
        return False

def run_git(git_repository: str, git_args: str) -> subprocess.CompletedProcess:
    CWD = os.getcwd()
    os.chdir(git_repository)
    process = subprocess.run(f'git {git_args}',stdout=subprocess.PIPE,text=True,timeout=5)
    os.chdir(CWD)
    return process

class Bundler():
    """AI Dungeon Bundler
    """
    SRC_FOLDER = os.path.join("src") # relative to root or project directory.
    LIBRARY_FILENAME = "library.js"
    LICENSE_FILENAME = "LICENSE"
    CONTRIBUTORS_FILENAME = "CONTRIBUTORS"
    @classmethod
    def parse_library(cls, root_directory: str, library_path: str = None, library_title: str = None, license_path: str = None, contributors_path: str = None):
        """Generates a javascript library with headers
        
        1. License Header (if present)
        2. Contribution Header
        3. Source Code

        Args:
            root_directory (str): The project/root/base directory of the repository
            library_path (str, optional): the library.js file. Defaults to {root_directory}/{Bundler.SRC_FOLDER}/{Bundler.LIBRARY_FILENAME}
            library_title (str, optional): The name of the library. Defaults to the root directory name
            license_path (str, optional): License file. Defaults to {root_directory}/{Bundler.LICENSE_FILENAME}.
            contributors_path (str, optional): Contributor file. Defaults to {root_directory}/{Bundler.CONTRIBUTORS_FILENAME}.
            

        Raises:
            OSError: Something went wrong during parsing.

        Returns:
            str: the javascript library ready to be written
        """
        result = ""
        if library_path is None:
            library_path = os.path.join(root_directory,cls.SRC_FOLDER,cls.LIBRARY_FILENAME)
        if library_title is None:
            library_title = os.path.abspath(root_directory)
            library_title = library_title[library_title.rindex(os.sep)+1:]
        if license_path is None:
            license_path = os.path.join(root_directory,cls.LICENSE_FILENAME)
        if contributors_path is None:
            contributors_path = os.path.join(root_directory,cls.CONTRIBUTORS_FILENAME)
        if not os.path.isfile(library_path):
            return result

        try:
            # Verify that the given library has contents.
            if not file_has_contents(library_path):
                print("[BUILD] WARNING: Library has no contents. Skipping...")
                return result
            
            result += f"// #region {library_title}"

            if file_has_contents(license_path):
                result += f"\n/*\t{"="*8} LICENSE {"="*8}\n"
                with open(license_path,encoding="utf8") as f:
                    while (line := f.readline()) != "":
                        result += f"\t{line}"
                result += f"\n\t{"="*8} LICENSE {"="*8}\t*/\n"
            
            result += f"\n/*\t{"="*8} CONTRIBUTORS {"="*8}\n"
            # Retrieve code contributors from git
            contributors = run_git(root_directory, "shortlog -s").stdout.replace(" ","").split("\t")
            for contributor in contributors[1:]:
                if (newline := contributor.rfind('\n')) > -1:
                    contributor = contributor[:newline]
                result += f'\t{contributor} - code contributor\n'
            result = result[:len(result)-1]

            if file_has_contents(contributors_path):
                with open(contributors_path, encoding="utf8") as f:
                    while (line := f.readline()) != "":
                        result += f"\t{line}"
            result += f"\n\t{"="*8} CONTRIBUTORS {"="*8}\t*/\n\n"
            
            with open(library_path,encoding="utf8") as f:
                while (line := f.readline()) != "":
                    result += f"{line}"
            result += "\n" * 1
            result += "// #endregion"
        except Exception as e:
            raise OSError(f"[BUILD] Error: Unable to read {library_path}.\nPython: {e}")
        return result
    
if __name__ == "__main__":
    OUT_DIR = os.path.join("out")
    LIB_DIR = os.path.join("lib")
    
    OUT_JSCONFIG = {
        "compilerOptions": {
            "checkJs": False
        }
    }
    
    shutil.rmtree(OUT_DIR, True)
    os.mkdir(OUT_DIR)
    try: # To prevent vscode from complaining in the out directory.
        with open(os.path.join(OUT_DIR,"jsconfig.json"), "x", encoding="utf8") as f:
            f.write(json.dumps(OUT_JSCONFIG))
    except Exception as _:
        pass
    
    for entry in os.scandir(Bundler.SRC_FOLDER):
        if entry.is_dir():
            continue
        if entry.name == Bundler.LIBRARY_FILENAME:
            continue
        shutil.copy(entry.path, os.path.join(OUT_DIR,entry.name))

    bundled_library_content = Bundler.parse_library(os.curdir)
    if os.path.isdir(LIB_DIR):
        for entry in os.scandir(LIB_DIR):
            content = Bundler.parse_library(entry.path)
            if isinstance(content, str) and len(content) > 0 and len(bundled_library_content) > 0:
                bundled_library_content += "\n" * 2
            bundled_library_content += content
    with open(os.path.join(OUT_DIR,Bundler.LIBRARY_FILENAME),"x",encoding="utf8") as f:
        f.write(bundled_library_content)
    print(f"[BUILD] Log: Built at {os.path.abspath(os.path.join(OUT_DIR))}")