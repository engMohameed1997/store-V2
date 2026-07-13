# دليل النشر الإنتاجي (Production Deployment)

## المتطلبات على السيرفر

```bash
# تثبيت Docker + Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# أعد تسجيل الدخول بعد إضافة المستخدم لمجموعة docker
```

## خطوات النشر

### 1. رفع الملفات للسيرفر

```bash
# من جهازك المحلي — انقل المشروع للسيرفر
scp -r /home/mohameed/مشاريعي/store root@173.249.11.51:/opt/store

# أو استخدم git clone إذا كان المشروع على GitHub
```

### 2. فتح المنافذ على السيرفر

```bash
# على السيرفر
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 3. تشغيل المشروع

```bash
cd /opt/store

# التأكد من أن ملف .env يحتوي على IP الصحيح
# ALLOWED_ORIGINS="http://173.249.11.51"
# NEXT_PUBLIC_API_URL="http://173.249.11.51/api/v1"

# بناء وتشغيل جميع الخدمات
docker compose up -d --build

# متابعة الـ logs للتأكد من نجاح التشغيل
docker compose logs -f app
```

### 4. إنشاء حساب admin

```bash
# بعد أن يصبح التطبيق جاهزاً
docker compose exec db psql -U store_user -d store_db -c "
INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, email_verified, phone_verified, auth_provider, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@mystore.com',
  '\$2b\$10\$/qd4q.WlxCAGZldwwQTqLOUu4Rp9407Jc6zPaZXIAw/D0sl5iUqxy',
  'Admin',
  'User',
  'SUPER_ADMIN',
  'ACTIVE',
  true,
  false,
  'CREDENTIALS',
  NOW(),
  NOW()
)
RETURNING id, email, role;
"
```

### 5. مزامنة قاعدة البيانات (إذا لزم)

```bash
docker compose exec app npx prisma db push
```

## الوصول للتطبيق

| الخدمة | الرابط |
|--------|--------|
| المتجر | `http://173.249.11.51` |
| لوحة الإدارة | `http://173.249.11.51/mx-panel` |
| MinIO Console | `http://173.249.11.51/minio-console/` |
| API Health | `http://173.249.11.51/api/v1/health` |
| Swagger Docs | `http://173.249.11.51/docs` |

## أوامر مفيدة

```bash
# إعادة بناء بعد تعديل الكود
docker compose up -d --build

# إعادة تشغيل خدمة معينة
docker compose restart app

# عرض الـ logs
docker compose logs -f app
docker compose logs -f nginx

# إيقاف جميع الخدمات
docker compose down

# إيقاف + حذف البيانات (تحذير!)
docker compose down -v
```

## ملاحظات الأمان

- **غيّر كلمات المرور** في `.env` قبل النشر النهائي (DB_PASSWORD, JWT secrets, MINIO_ROOT_PASSWORD)
- **فعّل ADMIN_IP_ALLOWLIST** بقصر الوصول للوحة الإدارة على IPs موثوقة
- استخدم **HTTPS** مستقبلاً بربط دومين + تشغيل `./scripts/init-ssl.sh domain.com email@example.com`
