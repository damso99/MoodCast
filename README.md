# MoodCast

## Frontend

- Path: `frontend/`
- React + Vite

## Backend

- Path: `backend/`
- Spring Boot + MySQL + Redis + AWS S3

## Local development with AWS S3 only

- Frontend and backend both run on `localhost`
- Uploaded files are stored in AWS S3
- Images are uploaded and displayed with direct public S3 URLs
- Local `/uploads/**` static file serving is disabled by default

### Frontend env

Set `frontend/.env`:

```dotenv
VITE_BACKSERVER=http://localhost:8080
VITE_PUBLIC_S3_BASE_URL=https://your-bucket.s3.ap-northeast-2.amazonaws.com
```

### Backend env

Set `backend/.env` values for local backend + AWS S3:

```dotenv
APP_PUBLIC_BASE_URL=http://localhost:8080
AWS_UPLOAD_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-northeast-2
```

Optional: if you need to temporarily serve old local files in `backend/uploads`, enable this:

```dotenv
APP_LOCAL_UPLOAD_RESOURCE_ENABLED=true
```

### Run

```bash
cd backend
mvn spring-boot:run
```

```bash
cd frontend
npm install
npm run dev
```

### Notes

- New uploads go to S3, not `backend/uploads`
- Existing legacy `/uploads/...` or `/upload/view?key=...` data should be rewritten to direct public S3 URLs
- If an image fails after upload, first verify the returned S3 key exists in the bucket
