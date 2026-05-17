# Firestore Go-Live Steps

Muc tieu hien tai: dua website sang database that bang Firestore truoc. Cac tich hop Stripe, GHN, Cloudinary, Resend, Algolia, Pinecone co the lam sau khi database da chay.

## 1. Tao Firebase project

1. Vao Firebase Console.
2. Tao project moi cho `TRONG DINH STORE`.
3. Bat Firestore Database.
4. Chon production mode neu deploy that, test mode neu chi thu local.

## 2. Lay Firebase web config

Trong Firebase Console:

1. Project settings.
2. General.
3. Your apps.
4. Add web app neu chua co.
5. Copy cac gia tri vao `.env.local`:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## 3. Lay service account JSON

Trong Firebase Console:

1. Project settings.
2. Service accounts.
3. Generate new private key.
4. Doi ten file vua tai thanh `firebase-admin.json`.
5. Dat file `firebase-admin.json` trong thu muc goc project.
6. Dien vao `.env.local`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_FILE=firebase-admin.json
```

Khong commit `.env.local`.
Khong commit `firebase-admin.json`.

## 4. Kiem tra va seed database

Chay:

```powershell
npm run check:env
npm run seed:firestore
```

Neu seed thanh cong, Firestore se co:

- `products`
- `coupons`
- `reviews`

## 5. Chay app local

Terminal 1:

```powershell
npm run start
```

Terminal 2:

```powershell
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:3001`

## 6. Thu endpoint database

```powershell
Invoke-RestMethod http://localhost:3001/api/products
```

Neu tra ve danh sach san pham, database that da noi thanh cong.

## 7. Tich hop sau database

Thu tu nen lam tiep:

1. Cloudinary upload anh san pham.
2. Resend email don hang.
3. GHN tinh phi va tao van don.
4. Stripe thanh toan.
5. Algolia search.
6. Pinecone cho chatbot RAG.
