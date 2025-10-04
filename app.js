// Main Application JavaScript
let currentUser = null;
let userRole = null;
let firebaseReady = false;
let allPrograms = [];
let allUsers = [];

// DOM Elements
const elements = {
    loading: document.getElementById('loading'),
    mainContent: document.getElementById('mainContent'),
    navbar: document.getElementById('navbar'),
    userEmail: document.getElementById('userEmail'),
    userRole: document.getElementById('userRole'),
    adminPanel: document.getElementById('adminPanel'),
    userPanel: document.getElementById('userPanel'),
    programsList: document.getElementById('programsList'),
    programSearchInput: document.getElementById('programSearchInput'),
    clearProgramSearch: document.getElementById('clearProgramSearch'),
    adminProgramsList: document.getElementById('adminProgramsList'),
    adminProgramSearchInput: document.getElementById('adminProgramSearchInput'),
    clearAdminSearch: document.getElementById('clearAdminSearch'),
    usersList: document.getElementById('usersList'),
    userSearchInput: document.getElementById('userSearchInput'),
    clearUserSearch: document.getElementById('clearUserSearch'),
    alertContainer: document.getElementById('alertContainer'),
    userChangePasswordBtn: document.getElementById('userChangePasswordBtn'),
    changePasswordModal: document.getElementById('changePasswordModal'),
    changePasswordForm: document.getElementById('changePasswordForm'),
    currentPasswordInput: document.getElementById('currentPassword'),
    customDialogModal: document.getElementById('customDialogModal'),
    dialogTitle: document.getElementById('dialogTitle'),
    dialogMessage: document.getElementById('dialogMessage'),
    dialogInputGroup: document.getElementById('dialogInputGroup'),
    dialogInputLabel: document.getElementById('dialogInputLabel'),
    dialogInput: document.getElementById('dialogInput'),
    dialogConfirmBtn: document.getElementById('dialogConfirmBtn'),
    customDialogForm: document.getElementById('customDialogForm'),
    quickNav: document.getElementById('quickNav'),
    backToTop: document.getElementById('backToTop'),
};

// Navigation Functions
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function switchTabAndScroll(tabName) {
    // First switch to admin panel if not visible
    if (elements.adminPanel.classList.contains('hidden')) {
        scrollToSection('adminPanel');
        return;
    }
    
    // Switch tab
    switchTab(tabName);
    
    // Scroll to admin panel
    setTimeout(() => {
        scrollToSection('adminPanel');
    }, 100);
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Back to top button visibility
function handleScroll() {
    const backToTopBtn = elements.backToTop;
    if (window.pageYOffset > 300) {
        backToTopBtn.classList.add('visible');
    } else {
        backToTopBtn.classList.remove('visible');
    }
}

// Custom Dialog System
const customDialog = {
    resolve: null,
    reject: null,
    
    confirm(title, message) {
        return new Promise((resolve, reject) => {
            this.resolve = () => { resolve(true); closeModal('customDialogModal'); };
            this.reject = () => { resolve(false); closeModal('customDialogModal'); };
            
            elements.dialogTitle.textContent = title;
            elements.dialogMessage.textContent = message;
            elements.dialogInputGroup.classList.add('hidden');
            elements.dialogInput.removeAttribute('required');
            elements.dialogInput.value = '';
            elements.dialogConfirmBtn.textContent = 'ยืนยัน';
            elements.dialogConfirmBtn.className = 'btn btn-danger';
            
            elements.customDialogForm.onsubmit = (e) => {
                e.preventDefault();
                this.resolve();
            };

            openModal('customDialogModal');
        });
    },

    prompt(title, message, inputLabel = 'ค่า', inputType = 'password') {
        return new Promise((resolve, reject) => {
            this.resolve = (value) => { resolve(value); closeModal('customDialogModal'); };
            this.reject = () => { resolve(null); closeModal('customDialogModal'); };
            
            elements.dialogTitle.textContent = title;
            elements.dialogMessage.textContent = message;
            elements.dialogInputGroup.classList.remove('hidden');
            elements.dialogInputLabel.textContent = inputLabel;
            elements.dialogInput.type = inputType;
            elements.dialogInput.setAttribute('required', 'required');
            elements.dialogInput.value = '';
            elements.dialogConfirmBtn.textContent = 'ดำเนินการต่อ';
            elements.dialogConfirmBtn.className = 'btn btn-primary';

            elements.customDialogForm.onsubmit = (e) => {
                e.preventDefault();
                const value = elements.dialogInput.value;
                if (value) {
                    this.resolve(value);
                }
            };
            
            openModal('customDialogModal');
            setTimeout(() => elements.dialogInput.focus(), 350);
        });
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    setTimeout(() => {
        if (!firebaseReady) {
            elements.loading.classList.add('hidden');
            showAlert('ไม่สามารถเชื่อมต่อ Firebase ได้ กรุณาตรวจสอบการตั้งค่า', 'error');
            // Redirect to login page
            window.location.href = 'about.html';
        }
    }, 3000);
    
    initializeApp();
    setupEventListeners();
    setupSearchListeners();
    setupScrollListeners();
});

// Initialize Firebase Auth State Listener
function initializeApp() {
    try {
        if (typeof firebase === 'undefined' || !window.firebaseServices) {
            throw new Error('Firebase not initialized');
        }
        
        const { auth } = window.firebaseServices;
        
        auth.onAuthStateChanged(async (user) => {
            firebaseReady = true;
            elements.loading.classList.remove('hidden');
            
            if (user) {
                currentUser = user;
                await loadUserRole(user.uid);
                showMainContent();
                await loadPrograms();
                
                if (userRole === 'admin') {
                    await loadUsers();
                }
            } else {
                // User not logged in, redirect to login page
                window.location.href = 'about.html';
                return;
            }
            
            elements.loading.classList.add('hidden');
        });
        
    } catch (error) {
        console.error('Firebase initialization error:', error);
        elements.loading.classList.add('hidden');
        showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อ Firebase: ' + error.message, 'error');
        // Redirect to login page
        window.location.href = 'about.html';
    }
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });
    
    document.getElementById('addProgramBtn').addEventListener('click', () => openModal('addProgramModal'));
    document.getElementById('addProgramForm').addEventListener('submit', handleAddProgram);
    
    document.getElementById('addUserBtn').addEventListener('click', () => openModal('addUserModal'));
    document.getElementById('addUserForm').addEventListener('submit', handleAddUser);
    
    document.getElementById('editProgramForm').addEventListener('submit', handleEditProgram);
    
    if (elements.userChangePasswordBtn) {
        elements.userChangePasswordBtn.addEventListener('click', () => {
            if (currentUser && currentUser.uid) {
                promptChangePassword(currentUser.uid, currentUser.email);
            }
        });
    }
    
    if (elements.changePasswordForm) {
        elements.changePasswordForm.addEventListener('submit', handleChangePassword);
    }
    
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

// Setup Scroll Listeners
function setupScrollListeners() {
    window.addEventListener('scroll', handleScroll);
}

// Search Functionality
function setupSearchListeners() {
    // User Programs Search
    if (elements.programSearchInput) {
        elements.programSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            filterPrograms(query, 'user');
            toggleClearButton(elements.clearProgramSearch, query);
        });
        
        elements.programSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                clearSearch('program');
            }
        });
    }
    
    if (elements.clearProgramSearch) {
        elements.clearProgramSearch.addEventListener('click', () => {
            clearSearch('program');
        });
    }
    
    // Admin Programs Search
    if (elements.adminProgramSearchInput) {
        elements.adminProgramSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            filterPrograms(query, 'admin');
            toggleClearButton(elements.clearAdminSearch, query);
        });
        
        elements.adminProgramSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                clearSearch('adminProgram');
            }
        });
    }
    
    if (elements.clearAdminSearch) {
        elements.clearAdminSearch.addEventListener('click', () => {
            clearSearch('adminProgram');
        });
    }
    
    // Users Search
    if (elements.userSearchInput) {
        elements.userSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            filterUsers(query);
            toggleClearButton(elements.clearUserSearch, query);
        });
        
        elements.userSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                clearSearch('user');
            }
        });
    }
    
    if (elements.clearUserSearch) {
        elements.clearUserSearch.addEventListener('click', () => {
            clearSearch('user');
        });
    }
}

function toggleClearButton(clearButton, query) {
    if (!clearButton) return;
    
    if (query.length > 0) {
        clearButton.classList.remove('hidden');
    } else {
        clearButton.classList.add('hidden');
    }
}

function clearSearch(type) {
    switch (type) {
        case 'program':
            if (elements.programSearchInput) {
                elements.programSearchInput.value = '';
                elements.clearProgramSearch.classList.add('hidden');
                filterPrograms('', 'user');
            }
            break;
        case 'adminProgram':
            if (elements.adminProgramSearchInput) {
                elements.adminProgramSearchInput.value = '';
                elements.clearAdminSearch.classList.add('hidden');
                filterPrograms('', 'admin');
            }
            break;
        case 'user':
            if (elements.userSearchInput) {
                elements.userSearchInput.value = '';
                elements.clearUserSearch.classList.add('hidden');
                filterUsers('');
            }
            break;
    }
}

function filterPrograms(query, type = 'user') {
    if (!query) {
        if (type === 'user') {
            displayUserPrograms(allPrograms);
        } else {
            displayAdminPrograms(allPrograms);
        }
        return;
    }
    
    const filteredPrograms = allPrograms.filter(doc => {
        const program = doc.data();
        const searchText = `${program.name} ${program.description} ${program.version}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
    });
    
    if (type === 'user') {
        displayUserPrograms(filteredPrograms);
    } else {
        displayAdminPrograms(filteredPrograms);
    }
}

function filterUsers(query) {
    if (!query) {
        displayUsers(allUsers);
        return;
    }
    
    const filteredUsers = allUsers.filter(doc => {
        const user = doc.data();
        const searchText = `${user.displayName || ''} ${user.email}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
    });
    
    displayUsers(filteredUsers);
}

// Authentication Functions
async function handleLogout() {
    if (!firebaseReady || !window.firebaseServices) {
        showAlert('Firebase ยังไม่พร้อมใช้งาน', 'error');
        return;
    }
    
    try {
        const { auth } = window.firebaseServices;
        await auth.signOut();
        
        showAlert('ออกจากระบบสำเร็จ', 'info');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = 'about.html';
        }, 1000);
        
    } catch (error) {
        showAlert(`ไม่สามารถออกจากระบบได้: ${error.message} โปรดลองอีกครั้ง`, 'error');
    }
}

// User Role Management
async function loadUserRole(uid) {
    if (!firebaseReady || !window.firebaseServices) {
        userRole = 'user';
        return;
    }
    
    try {
        const { db, firebase } = window.firebaseServices;
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            userRole = userData.role || 'user';
        } else {
            userRole = 'user';
            // Create default user document
            await db.collection('users').doc(uid).set({
                uid: uid,
                email: currentUser.email,
                displayName: currentUser.displayName || currentUser.email,
                role: 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error loading user role:', error);
        userRole = 'user';
    }
}

// UI Functions
function showMainContent() {
    elements.mainContent.classList.remove('hidden');
    elements.navbar.classList.remove('hidden');
    
    // Update navigation
    elements.userEmail.textContent = currentUser.email;
    elements.userRole.textContent = userRole === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิก';
    elements.userRole.className = `user-role ${userRole}`;
    
    // Show appropriate panels
    if (userRole === 'admin') {
        elements.adminPanel.classList.remove('hidden');
        elements.userPanel.classList.remove('hidden');
        elements.quickNav.classList.remove('hidden');
    } else {
        elements.adminPanel.classList.add('hidden');
        elements.userPanel.classList.remove('hidden');
        elements.quickNav.classList.add('hidden');
    }
    
    // Hide change password button for admin
    if (elements.userChangePasswordBtn) {
        if (userRole === 'admin') {
            elements.userChangePasswordBtn.classList.add('hidden');
        } else {
            elements.userChangePasswordBtn.classList.remove('hidden');
        }
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    const form = document.querySelector(`#${modalId} form`);
    if (form) form.reset();
}

// Program Management Functions
async function loadPrograms() {
    if (!firebaseReady || !window.firebaseServices) {
        showDemoPrograms();
        return;
    }
    
    try {
        const { db } = window.firebaseServices;
        const programsSnapshot = await db.collection('programs')
            .orderBy('createdAt', 'desc')
            .get();
        
        allPrograms = programsSnapshot.docs;
        
        displayUserPrograms(allPrograms);
        
        if (userRole === 'admin') {
            displayAdminPrograms(allPrograms);
        }
    } catch (error) {
        console.error('Error loading programs:', error);
        showAlert('เกิดข้อผิดพลาดในการโหลดข้อมูลโปรแกรม', 'error');
        showDemoPrograms();
    }
}

function showDemoPrograms() {
    const demoPrograms = [
        {
            id: 'demo1',
            data: () => ({
                name: 'โปรแกรม Adobe Photoshop CC 2024',
                description: 'โปรแกรมแต่งรูประดับมืออาชีพ พร้อมฟีเจอร์ AI ใหม่ล่าสุด',
                version: '25.0.0',
                createdAt: new Date()
            })
        },
        {
            id: 'demo2',
            data: () => ({
                name: 'Microsoft Office 365 Pro Plus',
                description: 'ชุดโปรแกรมสำนักงานครบครัน Word, Excel, PowerPoint และอื่นๆ',
                version: '2024',
                createdAt: new Date()
            })
        }
    ];
    
    allPrograms = demoPrograms;
    displayUserPrograms(demoPrograms);
    
    if (userRole === 'admin') {
        displayAdminPrograms(demoPrograms);
    }
}

function displayUserPrograms(programs) {
    const container = elements.programsList;
    
    if (programs.length === 0) {
        const query = elements.programSearchInput ? elements.programSearchInput.value.trim() : '';
        if (query) {
            container.innerHTML = `<div class="no-programs"><p>ไม่พบโปรแกรมที่ตรงกับ "${query}"</p></div>`;
        } else {
            container.innerHTML = '<div class="no-programs"><p>ยังไม่มีโปรแกรมที่แจก</p></div>';
        }
        return;
    }
    
    container.innerHTML = programs.map(doc => {
        const program = doc.data();
        const downloadAction = program.downloadUrl && program.downloadUrl !== 'โปรดติดต่อผู้ดูแลระบบเพื่อรับไฟล์' ? 
            `onclick="downloadProgram('${program.downloadUrl}', '${program.name}')"` :
            `onclick="showAlert('โปรดติดต่อผู้ดูแลระบบเพื่อรับลิงก์ดาวน์โหลด', 'info')"`;
        
        return `
            <div class="program-card">
                <h3>${program.name}</h3>
                <p>${program.description}</p>
                <div class="program-meta">
                    <span class="program-version">v${program.version}</span>
                    <span>${formatDate(program.createdAt)}</span>
                </div>
                <div class="program-actions">
                    <button class="btn btn-primary" ${downloadAction}>
                        📥 ดาวน์โหลด
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function displayAdminPrograms(programs) {
    const container = elements.adminProgramsList;
    
    if (programs.length === 0) {
        const query = elements.adminProgramSearchInput ? elements.adminProgramSearchInput.value.trim() : '';
        if (query) {
            container.innerHTML = `<div class="no-programs"><p>ไม่พบโปรแกรมที่ตรงกับ "${query}"</p></div>`;
        } else {
            container.innerHTML = '<div class="no-programs"><p>ยังไม่มีโปรแกรมในระบบ</p></div>';
        }
        return;
    }
    
    container.innerHTML = programs.map(doc => {
        const program = doc.data();
        return `
            <div class="admin-program-item">
                <div class="admin-program-info">
                    <h4>${program.name}</h4>
                    <p>${program.description}</p>
                    <p><strong>เวอร์ชัน:</strong> ${program.version} | <strong>อัปโหลดเมื่อ:</strong> ${formatDate(program.createdAt)}</p>
                </div>
                <div class="admin-program-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editProgram('${doc.id}', '${program.name}', '${program.description}', '${program.version}')">
                        ✏️ แก้ไข
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProgram('${doc.id}', '${program.name}')">
                        🗑️ ลบ
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function handleAddProgram(e) {
    e.preventDefault();
    
    if (!firebaseReady || !window.firebaseServices) {
        showAlert('Firebase ยังไม่พร้อมใช้งาน กรุณาตั้งค่า Firebase ก่อน', 'error');
        return;
    }
    
    const name = document.getElementById('programName').value;
    const description = document.getElementById('programDescription').value;
    const version = document.getElementById('programVersion').value;
    
    const downloadUrl = 'โปรดติดต่อผู้ดูแลระบบเพื่อรับไฟล์'; 
    const fileName = 'No File Attached';
    
    try {
        const { db, firebase } = window.firebaseServices;
        
        await db.collection('programs').add({
            name: name,
            description: description,
            version: version,
            downloadUrl: downloadUrl,
            fileName: fileName,
            uploadedBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showAlert('เพิ่มโปรแกรมสำเร็จ!', 'success');
        closeModal('addProgramModal');
        await loadPrograms();
    } catch (error) {
        console.error('Error adding program:', error);
        showAlert('เกิดข้อผิดพลาดในการเพิ่มโปรแกรม: ' + error.message, 'error');
    }
}

function editProgram(id, name, description, version) {
    if (!firebaseReady) {
        showAlert('Firebase ยังไม่พร้อมใช้งาน', 'error');
        return;
    }
    
    document.getElementById('editProgramId').value = id;
    document.getElementById('editProgramName').value = name;
    document.getElementById('editProgramDescription').value = description;
    document.getElementById('editProgramVersion').value = version;
    openModal('editProgramModal');
}

async function handleEditProgram(e) {
    e.preventDefault();
    
    if (!firebaseReady || !window.firebaseServices) {
        showAlert('Firebase ยังไม่พร้อมใช้งาน', 'error');
        return;
    }
    
    const id = document.getElementById('editProgramId').value;
    const name = document.getElementById('editProgramName').value;
    const description = document.getElementById('editProgramDescription').value;
    const version = document.getElementById('editProgramVersion').value;
    
    try {
        const { db, firebase } = window.firebaseServices;
        await db.collection('programs').doc(id).update({
            name: name,
            description: description,
            version: version,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showAlert('แก้ไขโปรแกรมสำเร็จ!', 'success');
        closeModal('editProgramModal');
        await loadPrograms();
    } catch (error) {
        console.error('Error updating program:', error);
        showAlert('เกิดข้อผิดพลาดในการแก้ไขโปรแกรม: ' + error.message, 'error');
    }
}

async function deleteProgram(id, name) {
    if (!firebaseReady || !window.firebaseServices) {
        showAlert('Firebase ยังไม่พร้อมใช้งาน', 'error');
        return;
    }
    
    const confirmed = await customDialog.confirm(
        'ยืนยันการลบโปรแกรม',
        `คุณต้องการลบโปรแกรม "${name}" อย่างถาวรหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`
    );
    
    if (!confirmed) {
        return;
    }
    
    try {
        const { db } = window.firebaseServices;
        await db.collection('programs').doc(id).delete();
        showAlert('ลบโปรแกรมสำเร็จ!', 'success');
        await loadPrograms();
    } catch (error) {
        console.error('Error deleting program:', error);
        showAlert('เกิดข้อผิดพลาดในการลบโปรแกรม: ' + error.message, 'error');
    }
}

function downloadProgram(url, name) {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// User Management Functions
async function loadUsers() {
    if (!firebaseReady || !window.firebaseServices) {
        return;
    }
    
    try {
        const { db } = window.firebaseServices;
        const usersSnapshot = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .get();
        
        allUsers = usersSnapshot.docs;
        displayUsers(allUsers);
    } catch (error) {
        console.error('Error loading users:', error);
        showAlert('เกิดข้อผิดพลาดในการโหลดข้อมูลสมาชิก', 'error');
    }
}

function displayUsers(users) {
    const container = elements.usersList;
    
    if (!container) return;
    
    if (users.length === 0) {
        const query = elements.userSearchInput ? elements.userSearchInput.value.trim() : '';
        if (query) {
            container.innerHTML = `<div class="no-users"><p>ไม่พบสมาชิกที่ตรงกับ "${query}"</p></div>`;
        } else {
            container.innerHTML = '<div class="no-users"><p>ยังไม่มีสมาชิกในระบบ</p></div>';
        }
        return;
    }
    
    container.innerHTML = users.map(doc => {
        const user = doc.data();
        const id = doc.id;
        
        const isCurrentUser = currentUser && currentUser.uid === id; 
        
        let changePasswordButton;
        let deleteButton;

        if (isCurrentUser) {
            changePasswordButton = `
                <button class="btn btn-secondary btn-sm" onclick="promptChangePassword('${id}', '${user.email}')">
                    🔑 เปลี่ยนรหัสผ่าน
                </button>
            `;
            deleteButton = `
                <button class="btn btn-danger btn-sm" disabled title="ไม่สามารถลบบัญชีตัวเองได้">
                    🗑️ ลบ
                </button>
            `;
        } else if (userRole === 'admin') {
            changePasswordButton = `
                <button class="btn btn-secondary btn-sm" onclick="promptChangePassword('${id}', '${user.email}')">
                    🔑 ต้องการเปลี่ยนผ่าน
                </button>
            `;
            deleteButton = `
                <button class="btn btn-danger btn-sm" onclick="deleteUser('${id}', '${user.displayName || user.email}')">
                    🗑️ ลบ
                </button>
            `;
        } else {
             changePasswordButton = '';
             deleteButton = '';
        }
        
        return `
            <div class="user-item">
                <h4>${user.displayName || user.email}</h4>
                <p><strong>อีเมล:</strong> ${user.email}</p>
                <p><strong>สมัครเมื่อ:</strong> ${formatDate(user.createdAt)}</p>
                <span class="user-role-badge ${user.role}">
                    ${user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิก'}
                </span>
                <div class="user-actions">
                    ${changePasswordButton}
                    ${deleteButton}
                </div>
            </div>
        `;
    }).join('');
}

async function handleAddUser(e) {
    e.preventDefault();
    
    if (!firebaseReady || !window.firebaseServices) {
        showAlert('Firebase ยังไม่พร้อมใช้งาน กรุณาตั้งค่า Firebase ก่อน', 'error');
        return;
    }
    
    const email = document.getElementById('newUserEmail').value;
    const password = document.getElementById('newUserPassword').value;
    const displayName = document.getElementById('newUserDisplayName').value;
    const role = document.getElementById('newUserRole').value;
    
    const adminUser = currentUser;
    const adminEmail = adminUser.email;
    
    const adminPassword = await customDialog.prompt(
        'ยืนยันตัวตนผู้ดูแลระบบ', 
        'กรุณากรอกรหัสผ่านของคุณเพื่อยืนยันสิทธิ์ในการสร้างผู้ใช้ใหม่:', 
        'รหัสผ่านผู้ดูแลระบบ', 
        'password'
    );
    
    if (!adminPassword) {
        showAlert('ต้องกรอกรหัสผ่านเพื่อดำเนินการต่อ', 'error');
        return;
    }
    
    try {
        const { auth, db, firebase } = window.firebaseServices;
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const newUser = userCredential.user;
        
        await newUser.updateProfile({
            displayName: displayName
        });
        
        await db.collection('users').doc(newUser.uid).set({
            uid: newUser.uid,
            email: email,
            displayName: displayName,
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await auth.signOut();
        await auth.signInWithEmailAndPassword(adminEmail, adminPassword);
        
        showAlert('เพิ่มสมาชิกสำเร็จ! ', 'success');
        closeModal('addUserModal');
        await loadUsers();
        
    } catch (error) {
        console.error('Error adding user:', error);
        
        try {
            const { auth } = window.firebaseServices;
            if (!auth.currentUser || auth.currentUser.uid !== adminUser.uid) {
                await auth.signInWithEmailAndPassword(adminEmail, adminPassword);
            }
        } catch (reAuthError) {
            console.error('Failed to re-authenticate admin:', reAuthError);
            showAlert('เกิดข้อผิดพลาดในการกลับเข้าสู่ระบบ Admin กรุณาเข้าสู่ระบบใหม่', 'error');
            await auth.signOut();
        }
        
        let errorMessage = 'เกิดข้อผิดพลาดในการเพิ่มสมาชิก: ';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage += 'อีเมลนี้ถูกใช้งานแล้ว';
        } else if (error.code === 'auth/weak-password') {
            errorMessage += 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage += 'รูปแบบอีเมลไม่ถูกต้อง';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage += 'รหัสผ่าน Admin ไม่ถูกต้อง';
        } else {
            errorMessage += error.message;
        }
        
        showAlert(errorMessage, 'error');
    }
}

// Password Management Functions
function promptChangePassword(uid, email) {
    if (!firebaseReady || !currentUser) {
        showAlert('ระบบยังไม่พร้อมใช้งาน หรือคุณยังไม่ได้เข้าสู่ระบบ', 'error');
        return;
    }
    
    const isSelf = uid === currentUser.uid;
    
    document.getElementById('changePasswordUid').value = uid;
    document.getElementById('changePasswordUserEmail').textContent = isSelf ? `บัญชีของคุณ (${email})` : `กำลังเปลี่ยนรหัสผ่านสำหรับ: ${email}`;
    
    const currentPasswordFieldGroup = elements.currentPasswordInput.closest('.form-group');
    
    if (isSelf) {
        currentPasswordFieldGroup.classList.remove('hidden');
        elements.currentPasswordInput.setAttribute('required', 'required');
    } else if (userRole === 'admin') {
        currentPasswordFieldGroup.classList.add('hidden');
        elements.currentPasswordInput.removeAttribute('required');
        elements.currentPasswordInput.value = '';
    } else {
        showAlert('คุณไม่มีสิทธิ์ในการดำเนินการนี้', 'error');
        return;
    }
    
    openModal('changePasswordModal');
}

async function handleChangePassword(e) {
    e.preventDefault();
    
    if (!firebaseReady || !window.firebaseServices) return;
    
    const { auth, firebase } = window.firebaseServices;
    const userToUpdate = auth.currentUser;
    
    const uid = document.getElementById('changePasswordUid').value;
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    if (newPassword !== confirmNewPassword) {
        showAlert('รหัสผ่านใหม่และยืนยันรหัสผ่านใหม่ไม่ตรงกัน', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showAlert('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร', 'error');
        return;
    }
    
    showAlert('กำลังดำเนินการเปลี่ยนรหัสผ่าน...', 'info');
    
    try {
        if (!userToUpdate) {
            showAlert('ไม่พบข้อมูลผู้ใช้ปัจจุบัน กรุณาออกจากระบบและเข้าสู่ระบบใหม่อีกครั้ง', 'error');
            await handleLogout(); 
            return;
        }
        
        const isSelf = uid === userToUpdate.uid;

        if (isSelf) {
            const credential = firebase.auth.EmailAuthProvider.credential(userToUpdate.email, currentPassword);
            
            await userToUpdate.reauthenticateWithCredential(credential);
            
            await userToUpdate.updatePassword(newPassword);
            showAlert('เปลี่ยนรหัสผ่านสำเร็จแล้ว! กรุณาเข้าสู่ระบบใหม่อีกครั้ง', 'success');
            closeModal('changePasswordModal');
            
            await handleLogout(); 

        } else if (userRole === 'admin') {
            showAlert(`[⚠️ ต้องใช้ รีเซตผ่าน Firebase เท่านั้น]:`, 'success');
            closeModal('changePasswordModal');

        } else {
            showAlert('คุณไม่มีสิทธิ์ในการเปลี่ยนรหัสผ่านนี้', 'error');
            return;
        }

    } catch (error) {
        console.error('Error changing password:', error);
        
        let errorMessage = 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน';
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = 'รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาตรวจสอบ';
        } else if (error.code === 'auth/requires-recent-login') {
             errorMessage = 'เพื่อความปลอดภัย กรุณาออกจากระบบและเข้าสู่ระบบอีกครั้งก่อนเปลี่ยนรหัสผ่าน';
        } else if (error.code === 'auth/user-not-found') {
             errorMessage = 'ไม่พบผู้ใช้ในระบบ Firebase Auth';
        } else {
            errorMessage += ': ' + error.message;
        }

        showAlert(errorMessage, 'error');
    }
}

async function deleteUser(uid, name) {
    if (!firebaseReady || !window.firebaseServices) {
        showAlert('Firebase ยังไม่พร้อมใช้งาน', 'error');
        return;
    }
    
    const confirmed = await customDialog.confirm(
        'ยืนยันการลบสมาชิก',
        `คุณต้องการลบสมาชิก "${name}" อย่างถาวรหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`
    );
    
    if (!confirmed) {
        return;
    }
    
    try {
        const { db } = window.firebaseServices;
        
        await db.collection('users').doc(uid).delete();
        
        showAlert('ลบสมาชิกใน Firestore สำเร็จ! (หมายเหตุ: ต้องลบใน Auth ผ่าน Cloud Function)', 'success');
        await loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('เกิดข้อผิดพลาดในการลบสมาชิก: ' + error.message, 'error');
    }
}

// Utility Functions
function formatDate(timestamp) {
    if (!timestamp) return 'ไม่ระบุ';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    
    let icon = '';
    if (type === 'success') icon = '✅ ';
    else if (type === 'error') icon = '❌ ';
    else if (type === 'info') icon = '💡 ';

    alert.className = `alert ${type}`;
    alert.textContent = icon + message;
    
    if (!elements.alertContainer) {
        console.error('Alert container not found. โปรดตรวจสอบว่ามี <div id="alertContainer"> อยู่ใน HTML');
        return;
    }
    
    elements.alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.classList.add('show');
    }, 10);

    const timer = setTimeout(() => {
        if (alert.parentNode) {
            alert.classList.remove('show');
            setTimeout(() => {
                 if (alert.parentNode) alert.parentNode.removeChild(alert);
            }, 400);
        }
    }, 5000);

    alert.addEventListener('click', () => {
        clearTimeout(timer);
        if (alert.parentNode) {
            alert.classList.remove('show');
            setTimeout(() => {
                 if (alert.parentNode) alert.parentNode.removeChild(alert);
            }, 400);
        }
    });
}

// Global error handling
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    showAlert('เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง', 'error');
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.type === 'file') {
        e.preventDefault();
    }
});