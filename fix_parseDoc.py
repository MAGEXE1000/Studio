import os

path = os.path.join('packages', 'studio-core', 'src', 'repositories', 'UserRepository.ts')
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("private parseDoc(): AccountDoc | null {", "private parseDoc(data: any): AccountDoc | null {")
content = content.replace("return this.parseDoc());", "return this.parseDoc(snap.data());")
content = content.replace("cb(snap.exists() ? this.parseDoc()) : null),", "cb(snap.exists() ? this.parseDoc(snap.data()) : null),")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
