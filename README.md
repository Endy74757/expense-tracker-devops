# Income-Expense Tracker Microservices

ระบบรายรับ-รายจ่าย (Microservices) ด้วย FastAPI + MongoDB

## Services
- **User Service**: Register, Login, Profile (JWT)
- **Transaction Service**: CRUD รายรับรายจ่าย, filter
- **Category Service**: CRUD หมวดหมู่
- **Reporting Service**: สรุปรายเดือน, รายหมวด
- **Notification Service**: แจ้งเตือนงบเกิน, ส่งอีเมล/push (optional)

## Database Schema
- users_db: `{_id, name, email, password_hash}`
- transactions_db: `{_id, user_id, category_id, type, amount, date, note}`
- categories_db: `{_id, user_id, name, type}`
- notifications_db: `{_id, user_id, type, message, status, created_at}`

## การใช้งาน
1. ติดตั้ง Docker & Docker Compose
2. สั่ง `docker-compose up --build`
3. ทดสอบ API จากแต่ละ service

## API Gateway & Frontend
- สามารถเพิ่ม API Gateway (FastAPI/Nginx/Traefik)
- SPA frontend (React/Vue/Angular) ติดต่อผ่าน API Gateway

## ขยายต่อ
- เพิ่ม validation, logging, JWT auth middleware, CI/CD
- เพิ่มไฟล์ requirements.txt, Dockerfile สำหรับแต่ละ service
- ตัวอย่างโค้ดหลักอยู่ในแต่ละ `main.py` ของ service

---
**ติดต่อ/ปรึกษา:** Endy74757