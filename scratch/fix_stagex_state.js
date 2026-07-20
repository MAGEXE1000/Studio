import fs from 'fs';

const stageFilePath = 'packages/ui-android/src/components/StageCorePanel.tsx';
let stageContent = fs.readFileSync(stageFilePath, 'utf8');

const oldLine = '  const [isExiting, setIsExiting] = useState(false);';
const newLine =
  '  const [isExiting, setIsExiting] = useState(false);\n  const [landscapeNavHidden, setLandscapeNavHidden] = useState(false);';

// Let's replace regardless of line endings
if (stageContent.includes(oldLine)) {
  stageContent = stageContent.replace(oldLine, newLine);
  console.log('Replaced using standard string match successfully!');
} else {
  // Try CRLF version
  const oldLineCrlf = '  const [isExiting, setIsExiting] = useState(false);\r\n';
  const newLineCrlf =
    '  const [isExiting, setIsExiting] = useState(false);\r\n  const [landscapeNavHidden, setLandscapeNavHidden] = useState(false);\r\n';
  if (stageContent.includes(oldLineCrlf)) {
    stageContent = stageContent.replace(oldLineCrlf, newLineCrlf);
    console.log('Replaced using CRLF string match successfully!');
  } else {
    console.log('Could not match isExiting useState line!');
  }
}

fs.writeFileSync(stageFilePath, stageContent, 'utf8');
