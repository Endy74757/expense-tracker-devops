# Expense Tracker DevOps

[![License](https://img.shields.io/github/license/Endy74757/expense-tracker-devops)](LICENSE)
[![Languages](https://img.shields.io/github/languages/top/Endy74757/expense-tracker-devops)](https://github.com/Endy74757/expense-tracker-devops)

## ภาพรวม

**Expense Tracker DevOps** เป็นโปรเจกต์สำหรับติดตามและบริหารจัดการค่าใช้จ่ายประจำวัน โดยเน้นการนำ DevOps มาประยุกต์ใช้ในกระบวนการพัฒนาและใช้งานแอปพลิเคชัน เหมาะสำหรับผู้ที่ต้องการทดลองใช้งานเทคโนโลยี DevOps กับแอปพลิเคชันที่เขียนด้วย JavaScript, Python, HTML และ CSS

## ฟีเจอร์หลัก

- เพิ่ม ลบ แก้ไข รายการค่าใช้จ่าย
- ดูสรุปค่าใช้จ่ายในแต่ละช่วงเวลา
- ระบบจัดการผู้ใช้
- รองรับการ deploy ด้วย pipeline แบบอัตโนมัติ

## เทคโนโลยีที่ใช้

- **JavaScript** (45.6%)
- **Python** (37.7%)
- **HTML** (10.8%)
- **CSS** (5.9%)
- ระบบ CI/CD (DevOps pipeline)
- Docker/Kubernetes (ตัวอย่างการ deploy)

## วิธีการติดตั้งและใช้งาน

1. **Clone repository**
   ```bash
   git clone https://github.com/Endy74757/expense-tracker-devops.git
   cd expense-tracker-devops
   ```

2. **ติดตั้ง Dependencies**
   - สำหรับ backend (Python)
     ```bash
     cd backend
     pip install -r requirements.txt
     ```
   - สำหรับ frontend (JavaScript)
     ```bash
     cd frontend
     npm install
     ```

3. **เริ่มต้นเซิร์ฟเวอร์**
   - Backend:
     ```bash
     python app.py
     ```
   - Frontend:
     ```bash
     npm start
     ```

4. **(ทางเลือก) Deploy ด้วย Docker**
   ```bash
   docker-compose up --build
   ```

## การใช้งาน DevOps Pipeline

- ตัวอย่าง workflow สำหรับ CI/CD สามารถดูได้ในไฟล์ `.github/workflows/`
- รองรับการ deploy อัตโนมัติไปยัง cloud หรือ Kubernetes cluster

## โครงสร้างโปรเจกต์

```
expense-tracker-devops/
│
├── backend/         # โค้ดฝั่งเซิร์ฟเวอร์ (Python)
├── frontend/        # โค้ดฝั่งไคลเอนต์ (JavaScript, HTML, CSS)
├── .github/         # Workflow สำหรับ CI/CD
├── docker-compose.yml
└── README.md
```

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

## ผู้พัฒนา

- [Endy74757](https://github.com/Endy74757)

---

> หากต้องการสอบถามหรือร่วมพัฒนา โปรดเปิด Issue หรือ Pull Request ได้เลย!