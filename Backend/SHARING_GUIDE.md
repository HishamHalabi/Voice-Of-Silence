# How to Share Your API

Since your API is currently running locally, here are the three best ways to share it with someone else (a client, a teammate, or another device).

## 1. Local Network Sharing (Same WiFi)
If you just want to test on another device in your house or office:
1. Find your local IP address (Run `ipconfig` in CMD, look for `IPv4 Address`, e.g., `192.168.1.5`).
2. Share the URL: `http://192.168.1.5:3000/api-docs`
3. **Note**: Make sure your computer's firewall allows incoming connections on port 3000.

## 2. Temporary Public URL (ngrok) - **Easiest for testing**
This creates a secure "tunnel" to your computer that anyone in the world can access.
1. Download [ngrok](https://ngrok.com/).
2. Run this command in your terminal:
   ```bash
   ngrok http 3000
   ```
3. Copy the "Forwarding" URL (e.g., `https://a1b2-c3d4.ngrok-free.app`).
4. Share that URL. Your API docs will be at: `https://[your-id].ngrok-free.app/api-docs`

## 3. Permanent Deployment (Production)
If you want the API to stay online even when your computer is off:
- **Render / Railway**: These are great for Node.js/TypeScript APIs. Connect your GitHub repo, and they will give you a permanent `https` URL.
- **Vercel**: Primarily for the frontend, but can host Express APIs via Serverless Functions.

## 4. Exporting to Postman
If you want to share the API "Logic" without giving them a live connection:
1. Open `http://localhost:3000/api-docs-json` in your browser.
2. Save that JSON file.
3. Your teammate can Import this JSON into **Postman** or **Insomnia** to see all requests and formats immediately.
