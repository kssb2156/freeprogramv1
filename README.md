# Firestore Database/Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // อนุญาตให้ผู้ที่ล็อกอินแล้วเท่านั้น
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}

-----------------------------
# Start a collection
username
"Superadmin"

uid
"6vuQUmkKkNa2FXoIoOdTcAoOYL13"
(string)

role
"admin"
(string)

name
"Kssb2156"
(string)

lastLogin
October 1, 2025 at 1:24:51 PM UTC+7
(timestamp)

email
"kssb2156@gmail.com"
(string)

createdAt
October 1, 2025 at 12:40:51 PM UTC+7
(timestamp)
---------------------
# Start a collection
createdAt
October 2, 2025 at 9:10:35 PM UTC+7
(timestamp)

description
"Code สร้างเว็บ มีระบบ Login จัดการ User เก็บ User ใน Firebase"
(string)

downloadUrl
"https://mega.nz/file/BNMnUZLJ#CnOuw6io6_namSR-PABftZg9cXD0FPbWrhK1EGvFq0s"
(string)

fileName
"No File Attached"
(string)

name
"Code สร้างเว็บ"
(string)

uploadedBy
"6vuQUmkKkNa2FXoIoOdTcAoOYL13"
(string)


version
"1.0.1"
