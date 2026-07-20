import fs from 'fs';

const filePath = 'packages/ui-shared/src/components/hub/StudioHub.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Remove double declarations at root of StudioHub
// Declaration 1 around line 159:
const oldDecl1 =
  "  const settings = useChordStore(state => state.settings);\n  const [langQuery, setLangQuery] = useState('');";
const newDecl1 = '  const settings = useChordStore(state => state.settings);';
if (content.includes(oldDecl1)) {
  content = content.replace(oldDecl1, newDecl1);
  console.log('Removed first langQuery declaration from root!');
}

// Declaration 2 around line 221:
const oldDecl2 =
  "  const searchInputRef = useRef<HTMLInputElement>(null);\n  const [langQuery, setLangQuery] = useState('');";
const newDecl2 = '  const searchInputRef = useRef<HTMLInputElement>(null);';
if (content.includes(oldDecl2)) {
  content = content.replace(oldDecl2, newDecl2);
  console.log('Removed second langQuery declaration from root!');
}

// In case there is any other left:
content = content.replace(
  "  const [langQuery, setLangQuery] = useState('');\n  const activeRoute =",
  '  const activeRoute ='
);

// 2. Define langQuery and setLangQuery inside HubSettings
// Let's find where HubSettings is declared
const hubSettingsTarget = '  const { preferences, setPreference } = useStudioPreferences();';
const hubSettingsReplacement = `  const { preferences, setPreference } = useStudioPreferences();
  const [langQuery, setLangQuery] = useState('');`;

if (
  content.includes(hubSettingsTarget) &&
  !content.includes("const [langQuery, setLangQuery] = useState('');\n  const t = useT();")
) {
  content = content.replace(hubSettingsTarget, hubSettingsReplacement);
  console.log('Injected langQuery state inside HubSettings!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Scope fix complete!');
