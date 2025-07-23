# ZCoder – Online Coding Platform

ZCoder is an online coding platform built using the **MERN stack** (MongoDB, Express.js, React, Node.js). It allows users to bookmark and practice coding problems, submit solutions and receive live verdicts on them, and track their problem-solving stats.

---

## 🚀 Features

- **User Authentication**
  - JWT-based login and signup
  - Password hashing with **bcrypt**

- **Problem Management**
  - Fetches problems from **Codeforces API**
  - Solve, bookmark, and submit solutions
  - Stores user submissions with correctness status

- **Judge0 API Integration**
  - Code execution for multiple languages
  - Instant feedback with runtime and correctness

- **Dashboard**
  - Displays the **latest 5 submissions**
  - Problem-solving statistics (solved, attempted, bookmarked)

---

## 🛠 Tech Stack

- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js, Express.js, JWT, bcrypt
- **Database:** MongoDB Atlas
- **APIs:** Codeforces API, Judge0 API

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/sray3000/zcoder.git
cd zcoder
```
### 2. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the **server** directory:
```env
PORT=5000
DB_URL=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
```
Run the backend server:
```bash
npm start
```
## 3. Frontend Setup

Open a new terminal window:

```bash
cd client
npm install
npm start
```
The app will now be running at http://localhost:3000.

## Contributors ✨

Thanks to these wonderful people:

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/sray3000"><img src="https://avatars.githubusercontent.com/sray3000" width="100px;" alt=""/><br /><sub><b>sray3000</b></sub></a></td>
    <td align="center"><a href="https://github.com/ShashwatShukla15"><img src="https://avatars.githubusercontent.com/ShashwatShukla15" width="100px;" alt=""/><br /><sub><b>ShashwatShukla15</b></sub></a></td>
  </tr>
</table>
<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

Deployed at: https://keen-snickerdoodle-bc83a7.netlify.app

