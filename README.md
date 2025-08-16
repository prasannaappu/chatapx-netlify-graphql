Chatapx – Chatbot with Netlify Auth, GraphQL & n8n Integration

A secure AI chatbot built with React + Vite frontend, Netlify Functions backend, Netlify Identity authentication, and n8n workflow automation for AI-powered responses.

Features

Authentication & Permissions – Email/password login using Netlify Identity, with optional JWT verification on backend.

GraphQL-only Communication – All frontend queries/mutations go through /.netlify/functions/graphql.

n8n Workflow Integration – Secure webhook with header-secret triggers OpenAI API for responses.

Customizable UI – Floating ℹ button for About modal, responsive chat interface.

Secure Deployment – API keys and secrets stored in Netlify environment variables.

Tech Stack

Frontend: React + Vite

Backend: Netlify Functions (Node 18)

Authentication: Netlify Identity

API: GraphQL

Automation: n8n + OpenAI GPT

Hosting: Netlify

Environment Variables

Create a .env file in the root:

OPENAI_API_KEY=your_openai_key_here
N8N_WEBHOOK_URL=https://your-n8n-instance/webhook-url
N8N_WEBHOOK_SECRET=your_secret_here
REQUIRE_LOGIN=true

Deployment

Push to GitHub.

Connect repo to Netlify.

Enable Netlify Identity for authentication.

Add environment variables in Netlify dashboard.

Deploy.

About

Click the floating ℹ button in the app to view About info.
This project was built for demonstrating:

Secure authentication

GraphQL-only architecture

n8n workflow integration

Contact

Name: Your Name
Contact: Your Phone Number
Deployed App: [Live Demo Link](https://chatapx.netlify.app/)
GitHub Repo: GitHub Link






