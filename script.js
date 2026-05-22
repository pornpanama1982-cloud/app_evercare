import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

let auth, provider;
try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
} catch (error) {
    console.warn("ยังไม่ได้ใส่ Firebase Config หากต้องการใช้ Google Auth รบกวนนำโค้ดมาใส่ใน script.js ครับ");
}


function hash256(string) {
    let hash = 0;
    for (let i = 0; i < string.length; i++) hash = ((hash << 5) - hash) + string.charCodeAt(i) | 0;
    return "0x7a" + Math.abs(hash).toString(16).padStart(8, '0');
}

class Block {
    constructor(index, timestamp, data, previousHash = '') {
        this.index = index; this.timestamp = timestamp; this.data = data; this.previousHash = previousHash;
        this.hash = hash256(index + timestamp + JSON.stringify(data) + previousHash);
    }
}

class BlockchainLedger {
    constructor() {
        const saved = localStorage.getItem("evercare_chain");
        if (saved) { this.chain = JSON.parse(saved); } 
        else { this.chain = [new Block(0, "01/01/2026", { info: "EverCare Genesis Block" }, "0")]; this.save(); }
    }
    save() { localStorage.setItem("evercare_chain", JSON.stringify(this.chain)); }
    addBlock(newData) {
        const newBlock = new Block(this.chain.length, new Date().toLocaleTimeString('th-TH'), newData, this.chain[this.chain.length - 1].hash);
        this.chain.push(newBlock);
        this.save();
        const b = document.getElementById('notiBadge'); if(b) b.style.display = 'block';
        return newBlock;
    }
}
window.EverCareChain = new BlockchainLedger();

// --- 3. ฟังก์ชันหน้าต่าง UI ---
window.triggerToast = function(msg, isRed=false) {
    const t = document.getElementById('toastNotification');
    document.getElementById('toastMessage').textContent = msg;
    t.style.borderLeftColor = isRed ? "#ef4444" : "#14b8a6";
    t.style.display = "flex";
};
window.closeToast = () => document.getElementById('toastNotification').style.display = "none";
window.openModal = (id) => { window.closeAllModals(); document.getElementById(id).classList.add('active'); };
window.closeAllModals = () => document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));

// --- 4. ระบบการ Authentication ---
window.handleLogin = function(e) {
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    localStorage.setItem("evercare_user", user);
    localStorage.setItem("evercare_wallet", "0x" + hash256(user).substring(0,10));
    window.EverCareChain.addBlock({event: "Login Validation Success", user: user});
    window.location.href = "dashboard.html";
};

// โหลด pending blocks ที่ค้างมาจาก login.js
(function processPending() {
    const pending = JSON.parse(localStorage.getItem("evercare_pending") || "[]");
    if (pending.length > 0) {
        pending.forEach(data => window.EverCareChain.addBlock(data));
        localStorage.removeItem("evercare_pending");
    }
})();

window.handleRegister = function(e) {
    e.preventDefault();
    const user = document.getElementById('regUser').value.trim();
    window.EverCareChain.addBlock({event: "Register Account", username: user});
    alert("ลงทะเบียนสำเร็จ!");
    window.location.href = "index.html";
};

window.handleGoogleLogin = async function() {
    if(!auth) { alert("กรุณาใส่ API Key ของ Firebase ใน script.js เพื่อเชื่อมต่อบัญชี Google จริง"); return; }
    try {
        const res = await signInWithPopup(auth, provider);
        localStorage.setItem("evercare_user", res.user.displayName);
        localStorage.setItem("evercare_pic", res.user.photoURL);
        localStorage.setItem("evercare_wallet", "0x" + hash256(res.user.email).substring(2,42));
        window.EverCareChain.addBlock({event: "Google Auth Success", userEmail: res.user.email});
        window.location.href = "dashboard.html";
    } catch(err) { alert("Error: " + err.message); }
};

window.handleLogout = function() {
    window.EverCareChain.addBlock({event: "Logged Out System", user: localStorage.getItem("evercare_user")});
    localStorage.removeItem("evercare_user");
    localStorage.removeItem("evercare_pic");
    window.location.href = "index.html";
};

window.loadUserProfile = function() {
    const u = localStorage.getItem("evercare_user");
    const p = localStorage.getItem("evercare_pic");
    if(!u) window.location.href = "index.html"; // ดันกลับไปหน้าล็อกอินถ้ายังไม่ล็อกอิน
    document.getElementById('currentCaregiver').textContent = u;
    if(p) document.getElementById('userAvatar').style.backgroundImage = `url('${p}')`;
};

// --- 5. ระบบ Dashboard ---
window.openBlockchainExplorer = function() {
    const c = document.getElementById('blockchainLedgerContent'); c.innerHTML = "";
    const badge = document.getElementById('notiBadge'); if(badge) badge.style.display = 'none';
    for(let i = window.EverCareChain.chain.length - 1; i >= 0; i--) {
        const b = window.EverCareChain.chain[i];
        c.innerHTML += `<div class="block-card"><b><i class="fa-solid fa-cube"></i> บล็อก #${b.index}</b><br>🕒 เวลา: ${b.timestamp}<br><div class="block-data-field">${JSON.stringify(b.data)}</div>แฮช: <span class="hash-string">${b.hash}</span></div>`;
    }
    window.openModal('modalBlockchain');
};

window.syncGPSLocation = function() {
    document.getElementById('coordinatesText').textContent = "ละติจูด 13.75630, ลองจิจูด 100.50180";
    window.triggerToast("อัปเดตพิกัดส่งขึ้นบล็อกเชนแล้ว");
    window.EverCareChain.addBlock({event: "GPS Tracker Value Logged", source: "WiFi/GPS"});
};

window.simulateMedicationGrab = function() {
    document.getElementById('pillsStatusEvening').style.background = "#48bb78";
    document.getElementById('pillsStatusEvening').textContent = "หยิบแล้ว";
    window.triggerToast("บันทึกพฤติกรรมการหยิบยาลง Blockchain สำเร็จ");
    window.EverCareChain.addBlock({event: "HC-SR04 Medicine Dispense Detected"});
};

window.simulateHealthEmergency = function() {
    document.getElementById('healthBPM').textContent = "126 bpm (วิกฤต!)"; document.getElementById('healthBPM').style.color = "#ef4444";
    document.getElementById('healthSpO2').textContent = "88% (วิกฤต!)"; document.getElementById('healthSpO2').style.color = "#ef4444";
    document.getElementById('statusText').textContent = "เตือนด่วน: สุขภาพวิกฤต!"; document.getElementById('statusText').style.color = "#ef4444";
    window.triggerToast("🚨 วิกฤต! อุปกรณ์พาสัญญาณเตือนชีพจรวิกฤต สั่นแจ้งเตือน!", true);
    window.EverCareChain.addBlock({event: "CRITICAL WEARABLE TRIGGER", bpm: 126, spo2: 88, vibration: "สั่นแบบยาวต่อเนื่อง"});
};

window.triggerManualSOS = function() {
    window.triggerToast("🚨 ส่งสัญญาณติดต่อขอความช่วยเหลือเรียบร้อย!", true);
    window.EverCareChain.addBlock({event: "MANUAL SOS EMITTED VIA APP"});
};

window.saveConfigSettings = function() {
    window.triggerToast("บันทึกการตั้งค่าพารามิเตอร์เรียบร้อย");
    window.EverCareChain.addBlock({event: "Settings Config Updated", phoneSOS: document.getElementById('sosNumberInput').value});
    window.closeAllModals();
};