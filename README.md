# 🏠 Digital Housing Scheme Portal

A full-stack government housing assistance portal featuring scheme eligibility checks, citizen applications, digital verification officer sanction approvals, and 4-phase physical construction geo-tagged milestone tracking.

---

## 🌐 Live Website
The project is hosted and running live here:  
👉 **[https://housing-scheme-portal.onrender.com](https://housing-scheme-portal.onrender.com)**

---

## 🚀 How to Run Directly on GitHub (In Browser)

You can run and test this entire project inside GitHub without installing anything on your computer using **GitHub Codespaces**:

1. Open your repository on GitHub:  
   👉 **[https://github.com/Harivarsha35/housing-scheme-portal](https://github.com/Harivarsha35/housing-scheme-portal)**
2. Click the green **`<> Code`** button.
3. Switch to the **Codespaces** tab.
4. Click **"Create codespace on main"**.
5. Wait for the browser terminal to initialize, then run:
   ```bash
   npm install
   npm start
   ```
6. A popup will appear in the bottom-right: **"Your application running on port 3000 is available"**. Click **Open in Browser** to view the live app!

---

## 💻 How to Clone & Run Locally on Your Computer

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [Git](https://git-scm.com/)

### Step-by-Step Instructions

1. **Clone the repository from GitHub:**
   ```bash
   git clone https://github.com/Harivarsha35/housing-scheme-portal.git
   cd housing-scheme-portal
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional):**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   SESSION_SECRET=housingportal_secret_2025
   MONGO_URI=mongodb://localhost:27017/housingportal
   ```
   *(Note: If MongoDB is not running locally, the application automatically falls back to built-in in-memory demo mode).*

4. **Start the application:**
   ```bash
   npm start
   ```

5. **Open in your web browser:**
   - **Citizen Portal:** [http://localhost:3000](http://localhost:3000)
   - **Verification Officer Portal:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🔑 Default Officer Credentials
To access the Verification Officer Panel:
- **Email:** `officer@housing.gov.in` (or `rahul@gmail.com`)
- **Password:** `Officer@123`

---

## ✨ Features
- 📋 **Eligibility Calculator**: Interactive multi-step questionnaire checking income, area type, and social category.
- 🏛️ **Housing Schemes Catalogue**: Detailed subsidy guides for PMAY Urban, PMAY Gramin, SC/ST Grants, and Senior Citizen Housing.
- ✍️ **Citizen Application Workflow**: Upload identity and income documents with automatic user-account linking.
- 🛡️ **Verification Officer Dashboard**: Review documents, inspect applications, and approve grants.
- 🏗️ **Phased Construction Tracking**: Release funds across 4 physical milestones (Foundation 25%, Walls & Lintel 40%, Roof Slab 25%, Final Completion 10%) with geo-tagged site photo uploads.
