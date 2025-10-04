// Login Page JavaScript
let firebaseReady = false;

// DOM Elements
const elements = {
    loading: document.getElementById('loading'),
    loginForm: document.getElementById('loginForm'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    loginBtn: document.querySelector('.login-btn'),
    btnText: document.querySelector('.btn-text'),
    btnLoading: document.querySelector('.btn-loading'),
    alertContainer: document.getElementById('alertContainer')
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeFirebase();
    setupEventListeners();
    
    // Hide loading after 3 seconds if Firebase doesn't initialize
    setTimeout(() => {
        if (!firebaseReady) {
            hideLoading();
            showAlert('ไม่สามารถเชื่อมต่อ Firebase ได้ กรุณาตรวจสอบการตั้งค่า', 'error');
        }
    }, 3000);
});

// Initialize Firebase
function initializeFirebase() {
    try {
        if (typeof firebase === 'undefined' || !window.firebaseServices) {
            throw new Error('Firebase not initialized');
        }
        
        const { auth } = window.firebaseServices;
        
        auth.onAuthStateChanged(async (user) => {
            firebaseReady = true;
            
            if (user) {
                // User is already logged in, redirect to main page
                // showAlert('เข้าสู่ระบบแล้ว กำลังเปลี่ยนหน้า...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                hideLoading();
            }
        });
        
    } catch (error) {
        console.error('Firebase initialization error:', error);
        hideLoading();
        showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อ Firebase: ' + error.message, 'error');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }
    
    // Add enter key support for better UX
    [elements.emailInput, elements.passwordInput].forEach(input => {
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleLogin(e);
                }
            });
        }
    });
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    
    if (!firebaseReady || !window.firebaseServices) {
        showAlert('Firebase ยังไม่พร้อมใช้งาน กรุณารอสักครู่', 'error');
        return;
    }
    
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;
    
    if (!email || !password) {
        showAlert('กรุณากรอกอีเมลและรหัสผ่าน', 'error');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    try {
        const { auth } = window.firebaseServices;
        await auth.signInWithEmailAndPassword(email, password);
        
        showAlert('เข้าสู่ระบบสำเร็จ!', 'success');
        
        // Redirect after successful login
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Login error:', error);
        setLoadingState(false);
        
        let errorMessage = 'เข้าสู่ระบบไม่สำเร็จ: ';
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                errorMessage += 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
                break;
            case 'auth/invalid-email':
                errorMessage += 'รูปแบบอีเมลไม่ถูกต้อง';
                break;
            case 'auth/user-disabled':
                errorMessage += 'บัญชีนี้ถูกปิดใช้งาน';
                break;
            case 'auth/too-many-requests':
                errorMessage += 'มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่';
                break;
            default:
                errorMessage += 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
        }
        
        showAlert(errorMessage, 'error');
    }
}

// Set Loading State
function setLoadingState(isLoading) {
    if (!elements.loginBtn || !elements.btnText || !elements.btnLoading) return;
    
    if (isLoading) {
        elements.loginBtn.disabled = true;
        elements.btnText.classList.add('hidden');
        elements.btnLoading.classList.remove('hidden');
    } else {
        elements.loginBtn.disabled = false;
        elements.btnText.classList.remove('hidden');
        elements.btnLoading.classList.add('hidden');
    }
}

// Hide Loading Overlay
function hideLoading() {
    if (elements.loading) {
        elements.loading.style.display = 'none';
    }
}

// Show Alert
function showAlert(message, type = 'info') {
    if (!elements.alertContainer) {
        console.error('Alert container not found');
        return;
    }
    
    const alert = document.createElement('div');
    
    let icon = '';
    switch (type) {
        case 'success':
            icon = '✅ ';
            break;
        case 'error':
            icon = '❌ ';
            break;
        case 'info':
            icon = '💡 ';
            break;
    }
    
    alert.className = `alert ${type}`;
    alert.textContent = icon + message;
    
    elements.alertContainer.appendChild(alert);
    
    // Trigger animation
    setTimeout(() => {
        alert.classList.add('show');
    }, 10);
    
    // Auto remove after 5 seconds
    const timer = setTimeout(() => {
        removeAlert(alert);
    }, 5000);
    
    // Click to dismiss
    alert.addEventListener('click', () => {
        clearTimeout(timer);
        removeAlert(alert);
    });
}

// Remove Alert
function removeAlert(alert) {
    if (alert && alert.parentNode) {
        alert.classList.remove('show');
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 400);
    }
}

// Handle global errors
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    showAlert('เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง', 'error');
});

// Prevent form submission on Enter in file inputs (if any)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.type === 'file') {
        e.preventDefault();
    }
});