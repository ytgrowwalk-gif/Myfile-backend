// scripts/refresh.js
const admin = require('firebase-admin');
const axios = require('axios');

// 🔥 Firebase Admin SDK initialize
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://toki-portal-default-rtdb.firebaseio.com"
});

const db = admin.database();
const BOT_TOKEN = "8555666729:AAFLgcl5ZEOmsyUPoL9yqMMgi5fPMXxt1tw";

async function refreshAllLinks() {
    console.log('🔄 Starting link refresh...');
    
    try {
        // 1️⃣ Firebase se saare users ki fileMeta lao
        const snapshot = await db.ref('users').once('value');
        const users = snapshot.val();
        
        if (!users) {
            console.log('❌ No users found!');
            return;
        }

        let totalUpdated = 0;
        let totalFailed = 0;

        // 2️⃣ Har user ke liye
        for (const [userId, userData] of Object.entries(users)) {
            console.log(`👤 Processing user: ${userId}`);
            
            const fileMeta = userData.fileMeta || {};
            
            // 3️⃣ Har file ke liye
            for (const [key, file] of Object.entries(fileMeta)) {
                const fileId = file.fileIds?.[0];
                if (!fileId) continue;
                
                try {
                    // 4️⃣ Telegram se fresh link lao
                    const response = await axios.get(
                        `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
                    );
                    
                    if (response.data.ok) {
                        const freshLink = `https://api.telegram.org/file/bot${BOT_TOKEN}/${response.data.result.file_path}`;
                        
                        // 5️⃣ Firebase update karo
                        await db.ref(`users/${userId}/fileMeta/${key}/mainLink`).set(freshLink);
                        await db.ref(`users/${userId}/fileMeta/${key}/lastRefreshed`).set(Date.now());
                        
                        totalUpdated++;
                        console.log(`✅ Updated: ${file.name || key}`);
                    }
                } catch (error) {
                    totalFailed++;
                    console.log(`❌ Failed: ${file.name || key} - ${error.message}`);
                }
            }
        }
        
        console.log(`✅ Done! Updated: ${totalUpdated}, Failed: ${totalFailed}`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// 🚀 Run karo
refreshAllLinks();
