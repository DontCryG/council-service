const fs = require('fs');
const files = [
  'src/features/services/EditOrg.jsx',
  'src/features/services/EditOrgPreview.jsx',
  'src/features/services/GeneralService.jsx',
  'src/features/services/RegisterOrg.jsx',
  'src/features/services/WelfareTrade.jsx',
  'src/features/services/WelfareTradePreview.jsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  const target = `const unsub = onSnapshot(collection(db, 'app_state'), (snapshot) => {
      let loaded = false;
      snapshot.forEach(doc => {
        if (doc.id === 'council_members') {
          setCouncilMembers(doc.data().members || []);
          loaded = true;
        }
      });
      if (!loaded) setCouncilMembers([]);
    });`;
    
  const replacement = `const unsub = onSnapshot(doc(db, 'app_state', 'council_members'), (docSnap) => {
      if (docSnap.exists()) {
        setCouncilMembers(docSnap.data().members || []);
      } else {
        setCouncilMembers([]);
      }
    });`;
    
  content = content.replace(target, replacement);
  
  if (content.includes("import { collection, onSnapshot } from 'firebase/firestore';")) {
    content = content.replace("import { collection, onSnapshot } from 'firebase/firestore';", "import { doc, collection, onSnapshot } from 'firebase/firestore';");
  }
  
  fs.writeFileSync(file, content);
}
console.log('Fixed inefficient queries in 6 files');
