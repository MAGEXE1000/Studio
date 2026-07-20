import os
import re

sync_path = 'packages/studio-core/src/lib/sync/sync.ts'
if os.path.exists(sync_path):
    with open(sync_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace bad imports
    content = re.sub(r"import \{ getAllTakes, saveTake, deleteTake as dbDeleteTake, type TakeRecord \} from '\.\./\.\./vocalex/takesDb';", "import { vocalexRepository } from '../../repositories/VocalexRepository';\nimport type { TakeRecord } from '../../store/useVocalexStore';", content)
    content = re.sub(r"import \{ getAllLabSessions, saveLabSession, deleteLabSession as dbDeleteSession, type LabLayer, type LabSession \} from '\.\./\.\./vocalex/labSessionDb';", "import type { LabLayer, LabSession } from '../../store/useVocalexStore';", content)
    
    # Also in case I already fixed the types import:
    content = re.sub(r"import type \{ TakeRecord \} from '\.\./\.\./vocalex/takesDb';", "", content)
    content = re.sub(r"import type \{ LabLayer, LabSession \} from '\.\./\.\./vocalex/labSessionDb';", "", content)

    # Replace method calls
    content = content.replace("getAllTakes()", "vocalexRepository.getAllTakes()")
    content = content.replace("saveTake(", "vocalexRepository.saveTake(")
    content = content.replace("dbDeleteTake(", "vocalexRepository.deleteTake(")
    
    content = content.replace("getAllLabSessions()", "vocalexRepository.getAllSessions()")
    content = content.replace("saveLabSession(", "vocalexRepository.saveSession(")
    content = content.replace("dbDeleteSession(", "vocalexRepository.deleteSession(")

    with open(sync_path, 'w', encoding='utf-8') as f:
        f.write(content)
