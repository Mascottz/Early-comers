"""Make Elm dependencies available, including in GitHub-only build environments."""

from pathlib import Path
import json
import struct
import subprocess

HOME = Path.home() / ".elm" / "0.19.1" / "packages"
ROOT = Path(__file__).resolve().parent.parent


def dependencies():
    outline = json.loads((ROOT / "elm.json").read_text())
    direct = outline["dependencies"]["direct"]
    indirect = outline["dependencies"]["indirect"]
    return {**direct, **indirect}


def main():
    packages = dependencies()
    for name, version in packages.items():
        target = HOME / name / version
        if (target / "elm.json").exists():
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run([
            "git", "clone", "--quiet", "--depth", "1", "--branch", version,
            f"https://github.com/{name}.git", str(target),
        ], check=True)
        subprocess.run(["rm", "-rf", str(target / ".git")], check=True)

    registry = HOME / "registry.dat"
    if registry.exists():
        return

    # Elm 0.19.1 uses Data.Binary: big endian Int lengths and ascending maps.
    data = bytearray(struct.pack(">qq", len(packages), len(packages)))
    for name in sorted(packages):
        author, project = name.split("/")
        data.extend(struct.pack(">B", len(author.encode())) + author.encode())
        data.extend(struct.pack(">B", len(project.encode())) + project.encode())
        data.extend(bytes(map(int, packages[name].split("."))))
        data.extend(struct.pack(">q", 0))
    registry.write_bytes(data)


if __name__ == "__main__":
    main()
