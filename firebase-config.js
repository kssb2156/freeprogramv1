// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBHRclEgBIbm7PEUVd39Kro6KMZdAELiS0", // กรุณาใช้ apiKey ของโปรเจกต์คุณ
    authDomain: "my-file-manager-d596b.firebaseapp.com",
    projectId: "my-file-manager-d596b",
    storageBucket: "my-file-manager-d596b.firebasestorage.app",
    messagingSenderId: "197969285203",
    appId: "1:197969285203:web:b6ac17761d2411661db6a6",
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    
    // Initialize Firebase services
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();
    
    // Make services available globally
    window.firebaseServices = {
        auth,
        db,
        storage,
        firebase
    };
    
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization failed:', error);
    
    // Create mock services for demo purposes
    window.firebaseServices = null;
}