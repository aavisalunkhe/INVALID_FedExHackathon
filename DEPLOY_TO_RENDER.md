# Deployment Guide: Render

This guide explains how to deploy your **Zero** application to [Render](https://render.com/). You will deploy the backend as a **Web Service** and the frontend as a **Static Site**.

## Prerequisites
1.  Push your code to a GitHub repository.

## Part 1: Backend Deployment

1.  **Create a New Web Service** on Render.
2.  Connect your GitHub repository.
3.  **Settings:**
    *   **Root Directory:** `backend`
    *   **Runtime:** Python 3
    *   **Build Command:** `pip install -r requirements.txt`
    *   **Start Command:** `gunicorn fedex:app`
4.  **Environment Variables:**
    *   Add `TOMTOM_API_KEY` and set it to your key (from `.env`).
    *   Add `PYTHON_VERSION` (optional, e.g., `3.9.0`).
5.  **Deploy:** Click "Create Web Service".
6.  **Copy URL:** Once deployed, copy the service URL (e.g., `https://zero-backend.onrender.com`).

## Part 2: Frontend Deployment

1.  **Create a New Static Site** on Render.
2.  Connect your GitHub repository.
3.  **Settings:**
    *   **Root Directory:** `frontend`
    *   **Build Command:** `npm install && npm run build`
    *   **Publish Directory:** `dist`
4.  **Environment Variables:**
    *   Add `VITE_API_URL` and set it to your Backend URL from Part 1 (NOT including `/getformdata`, just the base URL like `https://zero-backend.onrender.com`).
5.  **Deploy:** Click "Create Static Site".

## Part 3: Verification

1.  Visit your Frontend URL.
2.  Try to calculate a route. proper functionality confirms the setup.
