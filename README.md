# Interactive Chat Authentication Login

A cinematic, interactive login experience built around a simple authentication story:

> **Dark screen → Turn on the light → Enter name → Identify user → Enter password → Authenticate → Login success**

The interface intentionally behaves more like a conversational authentication assistant than a traditional login form.

---

## ✨ Concept

When the page first opens, the entire screen is almost completely black.

The user is not immediately presented with username/password fields. Instead, the interface guides the user through an interactive authentication flow.

A blinking **TURN ON** switch is placed in the top-left corner to attract attention.

Once the user clicks the switch:

1. A warm sodium-like light expands from the **top-right corner**.
2. The dark screen becomes illuminated.
3. A conversational message appears:

   **"Hey, what is your name?"**
4. A chatbot-style input field appears.
5. The user enters their name and presses **Enter**.
6. The application checks whether the user exists in the database.
7. If the user exists, the system responds:

   **"Welcome back Jilani."**

8. The system then asks:

   **"Please enter your password."**
9. The input automatically changes to password mode, so entered characters are displayed as:

   `******`

10. The user presses **Enter**.
11. The password is verified.
12. If authentication succeeds, the login-success screen appears.

---

# 🔐 Authentication Algorithm

```text
                    ┌───────────────────────┐
                    │      PAGE LOAD        │
                    │       BLACK           │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   BLINKING SWITCH     │
                    │       "TURN ON"       │
                    └───────────┬───────────┘
                                │
                         User clicks
                                │
                                ▼
                    ┌───────────────────────┐
                    │      LIGHT ON         │
                    │  Top-right light      │
                    │  illuminates screen   │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ "Hey, what is your    │
                    │       name?"          │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │     ENTER NAME        │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ DATABASE USER CHECK   │
                    └───────────┬───────────┘
                         ┌──────┴──────┐
                         │             │
                       FOUND        NOT FOUND
                         │             │
                         ▼             ▼
              ┌─────────────────┐  ┌──────────────────┐
              │ Welcome back    │  │ Sorry, I don't   │
              │ Jilani          │  │ know you.        │
              └────────┬────────┘  └────────┬─────────┘
                       │                    │
                       ▼                    │
              ┌─────────────────┐            │
              │ ASK PASSWORD    │            │
              └────────┬────────┘            │
                       │                    │
                       ▼                    │
              ┌─────────────────┐            │
              │ PASSWORD INPUT  │            │
              │ ********        │            │
              └────────┬────────┘            │
                       │                    │
                       ▼                    │
              ┌─────────────────┐            │
              │ VERIFY PASSWORD │            │
              └────────┬────────┘            │
                       │                    │
                 ┌─────┴─────┐              │
                 │           │              │
               VALID       INVALID          │
                 │           │              │
                 ▼           ▼              │
          ┌────────────┐ ┌─────────────┐    │
          │ LOGIN      │ │ TRY AGAIN   │    │
          │ SUCCESS    │ └──────┬──────┘    │
          └────────────┘        │           │
                                └───────────┘
```

---

# ⏱️ 30-Second Session Timeout

After the light is turned on, the authentication session has a **30-second timeout**.

The timer starts when the name input becomes available.

If the user does not complete the authentication process within the timeout:

```text
30 seconds expired
        ↓
Session reset
        ↓
Light OFF
        ↓
Chat cleared
        ↓
Switch starts blinking again
        ↓
User must click the switch
        ↓
Authentication starts again
```

This prevents the interactive authentication state from remaining open indefinitely.

---

# 👤 User Identification Flow

The first input is treated as a username/name lookup.

Example:

```text
User:
Jilani

System:
Welcome back Jilani.

System:
Please enter your password.
```

If the name is not found:

```text
User:
Rahim

System:
Sorry, I don't know you.
```

The user can then enter another name.

---

# 🔑 Password Flow

Once a valid user is identified, the input changes from normal text mode to password mode.

### Normal name input

```text
Jilani
```

### Password input

```text
******
```

The browser handles visual masking using:

```html
<input type="password">
```

The password is never displayed as plain text in the UI.

---

# 🗄️ Current Demo Database

The current standalone HTML contains a temporary JavaScript object to demonstrate the complete flow:

```javascript
const DEMO_USERS = {
    "jilani": {
        displayName: "Jilani",
        password: "123456"
    },
    "admin": {
        displayName: "System Administrator",
        password: "123456"
    }
};
```

This is **demo data only**.

It should NOT be used as the production authentication database.

---

# 🚀 Production Architecture

For the real GTRS implementation, the JavaScript demo lookup should be replaced with a backend API.

Recommended architecture:

```text
Browser
   │
   │ HTTPS
   ▼
Frontend
HTML / CSS / JavaScript
   │
   │ POST /api/auth/...
   ▼
FastAPI Backend
   │
   ├── Validate request
   │
   ├── Find user
   │
   ├── Verify password hash
   │
   └── Create authentication session/token
   │
   ▼
Database
SQL Server / PostgreSQL / SQLite
```

The browser should **never** contain the real user database or plaintext passwords.

---

# 🔌 Suggested API Flow

## 1. Check User

The frontend can send:

```http
POST /api/auth/check-user
Content-Type: application/json
```

Example request:

```json
{
    "username": "Jilani"
}
```

Example response:

```json
{
    "success": true,
    "user_id": 123,
    "username": "Jilani",
    "message": "USER_FOUND"
}
```

If the user does not exist:

```json
{
    "success": false,
    "message": "USER_NOT_FOUND"
}
```

---

## 2. Login

After the user has been identified:

```http
POST /api/auth/login
Content-Type: application/json
```

Example request:

```json
{
    "username": "Jilani",
    "password": "********"
}
```

The backend should:

```text
Receive credentials
      ↓
Find user
      ↓
Check account status
      ↓
Verify password hash
      ↓
Create authenticated session/token
      ↓
Return authentication result
```

Example successful response:

```json
{
    "success": true,
    "message": "AUTHENTICATION_SUCCESSFUL",
    "user": {
        "id": 123,
        "username": "Jilani"
    },
    "token": "..."
}
```

---

# 🛡️ Security Notes

The current HTML file is a **UI/interaction prototype**, not a production authentication system.

For production:

- Do not store plaintext passwords.
- Do not store real passwords inside JavaScript.
- Do not keep the real user list in frontend code.
- Use a strong password hashing algorithm such as **Argon2id** or **bcrypt**.
- Use HTTPS.
- Validate and sanitize API input.
- Add rate limiting to login endpoints.
- Avoid returning detailed information that enables user enumeration in a real public system.
- Use secure, short-lived authentication tokens or server-side sessions.
- Store tokens securely; for browser applications, an `HttpOnly`, `Secure`, appropriately configured cookie is generally preferable to exposing long-lived tokens to JavaScript.
- Add account lockout or progressive delay where appropriate.
- Log authentication events on the server.
- Never expose database credentials to the frontend.

---

# 🎨 UI Behavior

### Initial state

```text
BLACK SCREEN
        +
BLINKING TURN ON SWITCH
```

No login fields are visible.

### After switch click

```text
TOP-RIGHT LIGHT
       ↓
WARM LIGHT EXPANDS
       ↓
SCREEN ILLUMINATES
       ↓
CHAT MESSAGE APPEARS
```

### Name stage

```text
Hey, what is your name?

[ Type your name...                         ] [↑]
```

### Existing user

```text
Welcome back Jilani.

Please enter your password.

[ ********                                  ] [↑]
```

### Successful authentication

```text
✓

You're in.

Welcome, Jilani.
```

---

# 📁 Project Structure

For the current prototype:

```text
project/
│
├── interactive_chat_auth_login.html
└── README.md
```

For the future production version:

```text
project/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── backend/
│   ├── main.py
│   ├── auth.py
│   ├── database.py
│   └── models.py
│
├── database/
│   └── schema.sql
│
└── README.md
```

---

# 🧪 Demo Credentials

The current prototype contains:

```text
Username: Jilani
Password: 123456
```

or:

```text
Username: admin
Password: 123456
```

**These credentials exist only for demonstrating the frontend flow and must be removed before production deployment.**

---

# 🔄 Complete State Machine

The frontend can be understood as the following states:

```text
OFF
 │
 │ Switch Click
 ▼
NAME
 │
 ├── Unknown User ──► HOLD
 │                     │
 │                     └── Enter another name
 │
 └── Known User
          │
          ▼
      PASSWORD
          │
          ├── Wrong Password ──► PASSWORD
          │
          └── Correct Password
                    │
                    ▼
                 SUCCESS
```

Timeout can occur from the active authentication states:

```text
NAME
PASSWORD
HOLD
   │
   │ 30 seconds
   ▼
OFF
```

---

# 🧩 Future Improvements

The prototype can later be extended with:

- FastAPI authentication backend
- SQL Server/PostgreSQL integration
- Real-time username lookup
- Secure password hashing
- JWT or session-based authentication
- Refresh-token mechanism
- User account status checking
- Login attempt tracking
- Rate limiting
- Remember-me option
- MFA / OTP
- Email verification
- Role-based access control
- Authentication audit logs
- API error animations
- Loading animations during database verification
- Token visualization after successful authentication
- Protected dashboard after login

---

# ⚠️ Important

This project separates **authentication experience** from **authentication security**.

The animation and conversational interface are frontend behavior.

The actual security boundary must remain on the backend:

```text
Frontend = User Experience
Backend  = Authentication Authority
Database = User Data
```

The frontend should never be trusted to decide whether a user is authenticated.

---

## License

Internal / proprietary project. Add the appropriate license before public distribution.