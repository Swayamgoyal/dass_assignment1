# Deployment Guide - Felicity Event Management System

## Prerequisites
- GitHub account
- MongoDB Atlas account (free tier)
- Render account (free tier) for backend
- Vercel account (free tier) for frontend

---

## Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a **free cluster**
3. Create a **database user** (username & password)
4. **Whitelist all IPs**: Go to Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
5. Get your **connection string**:
   - Click "Connect" → "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
   - Replace `<password>` with your database user password
   - Add database name: `mongodb+srv://username:password@cluster.mongodb.net/felicity?retryWrites=true&w=majority`

---

## Step 2: Deploy Backend to Render

1. Go to [Render](https://render.com)
2. Sign in with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your repository: `dass_assignment1`
5. Configure the service:
   - **Name**: `felicity-backend` (or any name)
   - **Region**: Choose closest region
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

6. **Add Environment Variables** (click "Advanced" → "Add Environment Variable"):
   ```
   MONGODB_URI=mongodb+srv://your_connection_string
   JWT_SECRET=generate_a_random_32_character_string
   FRONTEND_URL=https://your-frontend-url.vercel.app (add later)
   PORT=5000
   ADMIN_EMAIL=admin@felicity.com
   ADMIN_PASSWORD=Admin@123
   ```
   
   > **Generate JWT_SECRET**: Use a random string generator or run in terminal:
   > ```bash
   > node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   > ```

7. Click **"Create Web Service"**
8. Wait for deployment (5-10 minutes)
9. **Copy your backend URL**: `https://felicity-backend-xxxx.onrender.com`

---

## Step 3: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com)
2. Sign in with GitHub
3. Click **"Add New"** → **"Project"**
4. Import your repository: `dass_assignment1`
5. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. **Add Environment Variable**:
   - Click "Environment Variables"
   - Add: `VITE_API_URL` = `https://your-backend-url.onrender.com/api`
   - (Use the Render backend URL from Step 2)

7. Click **"Deploy"**
8. Wait for deployment (2-3 minutes)
9. **Copy your frontend URL**: `https://dass-assignment1-xxxx.vercel.app`

---

## Step 4: Update Backend with Frontend URL

1. Go back to **Render Dashboard** → Your backend service
2. Go to **"Environment"** tab
3. Update `FRONTEND_URL` with your Vercel URL (from Step 3)
4. Click **"Save Changes"** → Service will auto-redeploy

---

## Step 5: Verify Deployment

1. Open your **frontend URL** in browser
2. Try to **register/login** as participant
3. Check if API calls work (check browser console for errors)

### Test Admin Login:
- Email: `admin@felicity.com`
- Password: `Admin@123` (or whatever you set in ADMIN_PASSWORD)

---

## Step 6: Update deployment.txt

Update the [deployment.txt](deployment.txt) file in your repository with:

```
Frontend URL: https://your-frontend-url.vercel.app
Backend URL: https://your-backend-url.onrender.com
```

Then commit and push:
```bash
git add deployment.txt
git commit -m "Update deployment URLs"
git push origin main
```

---

## Troubleshooting

### Backend Issues:
- Check Render logs: Dashboard → Your Service → Logs
- Common issues:
  - MongoDB connection: Verify connection string and IP whitelist
  - Environment variables not set correctly
  - Port binding issues (Render sets PORT automatically)

### Frontend Issues:
- Check browser console for errors
- Verify VITE_API_URL is correct
- CORS errors: Update FRONTEND_URL in backend env variables

### Database Not Connecting:
- Ensure IP 0.0.0.0/0 is whitelisted in MongoDB Atlas
- Check connection string has correct password
- Verify network settings in MongoDB Atlas

---

## Important Notes

1. **Render Free Tier**: Service spins down after 15 minutes of inactivity; first request after sleep takes ~30 seconds
2. **MongoDB Free Tier**: 512MB storage limit
3. **Automatic Deployments**: Both Render and Vercel auto-deploy on git push to main branch
4. **Custom Domains**: Can be added in both Vercel and Render settings (optional)

---

## Production Checklist

- [ ] MongoDB Atlas cluster created and connection string obtained
- [ ] Backend deployed to Render with all environment variables
- [ ] Frontend deployed to Vercel with VITE_API_URL
- [ ] Backend FRONTEND_URL updated with Vercel URL
- [ ] Admin login working
- [ ] Participant registration working
- [ ] deployment.txt updated with URLs
- [ ] Changes committed and pushed to GitHub

---

## Support

If deployment fails:
1. Check service logs (Render/Vercel dashboard)
2. Verify all environment variables are set
3. Ensure MongoDB IP whitelist includes 0.0.0.0/0
4. Check that both services are using the correct repository and branch
