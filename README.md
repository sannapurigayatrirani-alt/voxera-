# VOXERA – Universal AI Task Orchestration Platform

**Turning natural conversations into organized, actionable workflows.**

VOXERA is an AI-powered task orchestration platform designed to help users interact with organizations, manage everyday tasks, and organize complex workflows through natural language and voice conversations.

Instead of simply answering questions, VOXERA aims to understand user intent, collect relevant information, prepare structured requests, and guide users through the next steps of completing real-world tasks.

## 🚀 Project Overview

People often need to navigate multiple websites, forms, and processes to complete simple tasks such as booking appointments, enquiring about school admissions, or preparing job applications.

VOXERA addresses this challenge through a unified conversational interface that transforms user requests into structured workflows.

The platform combines AI-powered conversation, speech interaction, contextual information processing, and task orchestration to create a more accessible way of interacting with digital services.

## ✨ Key Features

### 1. AI-Powered Conversational Assistant
- Understands natural-language user requests.
- Supports contextual conversations.
- Provides intelligent and relevant responses.
- Helps users organize tasks through conversational interaction.

### 2. Voice-Based Interaction
- Supports voice-oriented interaction using speech AI capabilities.
- Makes task management more accessible through conversational experiences.
- Designed to connect speech recognition and AI-generated responses.

### 3. Organization and Service Discovery
- Supports workflows involving schools, colleges, hospitals, and service providers.
- Helps identify the organization associated with a request.
- Provides a search path for discovering official websites and relevant portals when verified information is unavailable.

### 4. School and College Admission Assistance
- Understands admission-related requests.
- Collects relevant information such as institution, location, student details, and grade.
- Organizes admission enquiries into structured requests.
- Helps users find the appropriate official admission portal.

### 5. Appointment Management
- Organizes appointment-related requests.
- Collects provider, location, purpose, preferred date, and time.
- Prepares structured appointment requests for user review.

### 6. Resume-Aware Assistance
- Supports resume upload and information extraction.
- Uses verified resume information when generating career-related responses.
- Avoids inventing qualifications or professional experience.

### 7. Human-in-the-Loop Task Orchestration
- Presents structured request information before confirmation.
- Allows users to review and approve or cancel requests.
- Saves approved requests for further action.
- Clearly distinguishes between saving a request and completing an external submission.

## 🧠 How VOXERA Works

1. **User Input:** The user communicates through text or voice.
2. **Intent Understanding:** VOXERA identifies the user's goal.
3. **Information Collection:** Relevant details are collected through conversation.
4. **Workflow Planning:** The system prepares a structured task.
5. **Review and Confirmation:** The user reviews the request and decides whether to approve it.
6. **Task Organization:** The approved request is saved, and the user receives guidance for the next action.

## 🎬 Demo – Example Workflows

### Demo 1: School Admission Assistance

**User:**
"I want to apply for admission at ABC Public School in Hyderabad."

**VOXERA:**
- Recognizes the request as a school admission workflow.
- Identifies the institution and location when provided.
- Collects missing student and guardian information.
- Prepares an admission enquiry summary.
- Helps locate the official admission portal if the website is unknown.
- Requests user approval before saving the request.

**Outcome:** A structured admission enquiry is prepared for the user.

### Demo 2: Appointment Assistance

**User:**
"I need to book an appointment at a hospital."

**VOXERA:**
- Identifies the appointment intent.
- Collects the hospital name and location.
- Asks for the purpose and preferred appointment time.
- Prepares an appointment request.
- Presents the details for user confirmation.

**Outcome:** An organized appointment request ready for the next step.

### Demo 3: Resume-Based Assistance

**User:**
"Help me understand my qualifications from my resume."

**VOXERA:**
- Accepts a supported resume document.
- Extracts available resume information.
- Uses verified details as context for AI responses.
- Provides career-related assistance without inventing qualifications.

**Outcome:** More context-aware career assistance.

### Demo 4: General AI Task Assistance

**User:**
"What can you help me with?"

**VOXERA:**
- Understands the conversational request.
- Explains supported workflows.
- Helps users identify and organize their next task.

**Outcome:** A unified conversational starting point for multiple tasks.

## 🏗️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js |
| Backend | Node.js |
| API Framework | Express.js |
| AI Model | Ollama – Llama 3.2 3B |
| Speech AI | Gnani AI Speech Platform integration |
| Communication | REST APIs |
| Resume Processing | PDF and DOCX parsing |
| Data Storage | JSON-based request storage |

*Technology and integration descriptions should be updated to reflect the exact services enabled in the final implementation.*

## 📁 Project Structure

```text
VOXERA/
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── config/
│   │   ├── taskEngine.js
│   │   ├── organizationEngine.js
│   │   ├── llmService.js
│   │   └── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── .gitignore
└── README.md
```

*The structure above is illustrative; adjust it to match the actual repository.*

## ⚙️ Installation and Setup

### Prerequisites
- Node.js
- npm
- Ollama
- Git

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd VOXERA
```

### 2. Start Ollama

Install Ollama and pull the configured model:

```bash
ollama pull llama3.2:3b
```

Start Ollama if it is not already running.

### 3. Configure the Backend

```bash
cd backend
npm install
```

Configure the required environment variables in your local `.env` file.

Never commit API keys or private credentials to GitHub.

Start the backend using the script configured in `package.json`:

```bash
npm run dev
```

### 4. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm start
```

Open the local frontend URL displayed in your terminal.

## 🔐 Responsible AI and User Control

VOXERA is designed with user approval and information accuracy in mind.

- Does not invent personal qualifications or organization details.
- Distinguishes between prepared requests and completed external actions.
- Requires user confirmation before saving an approved workflow.
- Does not claim that an external application or appointment has been submitted without actual confirmation from an authorized integration.

## 🌟 Vision

VOXERA aims to evolve into a universal AI orchestration layer that connects people, organizations, and digital services through a single conversational interface.

The long-term vision is to move beyond conventional AI chatbots—from simply providing answers to understanding intent, planning actions, coordinating workflows, and helping users accomplish meaningful tasks.

**VOXERA – One conversation. Multiple possibilities. Smarter task orchestration.**

## 👩‍💻 Project Information

**Project:** VOXERA  
**Category:** AI / Voice AI / Agentic AI / Task Orchestration  
**Competition:** Great Indian AI Internship Challenge – Gnani AI

**Built using AI, speech technology, and intelligent workflow orchestration.**
