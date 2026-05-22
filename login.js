// login.js — จัดการหน้า index.html (EverCare)

document.addEventListener('DOMContentLoaded', function () {

    // ถ้าล็อกอินอยู่แล้ว ข้ามไปหน้า dashboard เลย
    if (localStorage.getItem('evercare_user')) {
        window.location.href = 'dashboard.html';
        return;
    }

    // ผูก form submit
    var form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var username = document.getElementById('username').value.trim();
            var password = document.getElementById('password').value.trim();

            if (!username || !password) {
                alert('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
                return;
            }

            // บันทึกข้อมูลลง localStorage
            localStorage.setItem('evercare_user', username);
            localStorage.setItem('evercare_wallet', '0x' + simpleHash(username).substring(0, 10));

            // เก็บ event ให้ blockchain จัดการตอน dashboard โหลด
            var pending = JSON.parse(localStorage.getItem('evercare_pending') || '[]');
            pending.push({ event: 'Login Validation Success', user: username });
            localStorage.setItem('evercare_pending', JSON.stringify(pending));

            window.location.href = 'dashboard.html';
        });
    }

    // ปุ่ม Google
    var btnGoogle = document.querySelector('.btn-google');
    if (btnGoogle) {
        btnGoogle.addEventListener('click', function () {
            if (typeof window.handleGoogleLogin === 'function') {
                window.handleGoogleLogin();
            } else {
                alert('กรุณาใส่ Firebase Config ใน script.js เพื่อใช้งาน Google Login');
            }
        });
    }
});

function simpleHash(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}
