import fs from 'fs';

const filePath = 'packages/ui-shared/src/components/hub/StudioHub.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Define page, isLight, and langQuery/setLangQuery at the root of StudioHub
// Let's check where searchOpen is defined:
// const [searchOpen, setSearchOpen] = useState(false);
const searchOpenTarget = '  const [searchOpen, setSearchOpen] = useState(false);';
const searchOpenReplacement = `  const [searchOpen, setSearchOpen] = useState(false);
  const activeRoute = useNavigationStore(s => s.history[s.history.length - 1]) || { app: 'hub', tab: 'home' };
  const page = activeRoute.app === 'hub' && activeRoute.tab === 'settings' ? (activeRoute.page ?? 'main') : 'main';
  const isLight = settings.theme === 'light' || (settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);
  const [langQuery, setLangQuery] = useState('');`;

if (content.includes(searchOpenTarget) && !content.includes('activeRoute = useNavigationStore')) {
  content = content.replace(searchOpenTarget, searchOpenReplacement);
  console.log('Injected page, isLight, and langQuery at root of StudioHub!');
}

// 2. Fix the style property uppercase: true
content = content.replace(
  "uppercase: true, letterSpacing: '0.2em'",
  "textTransform: 'uppercase', letterSpacing: '0.2em'"
);
content = content.replace(
  "uppercase: true, letterSpacing: '0.12em'",
  "textTransform: 'uppercase', letterSpacing: '0.12em'"
);
// Let's do it globally for any uppercase: true in style blocks
content = content.replaceAll('uppercase: true', "textTransform: 'uppercase'");

console.log('Fixed uppercase styles!');
fs.writeFileSync(filePath, content, 'utf8');
