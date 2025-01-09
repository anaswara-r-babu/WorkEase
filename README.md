# WorkEase Project

## Description

WorkEase is a project built using Node.js, Express.js, and Prisma, designed to manage employees, users, and admin operations. This project is connected to a PostgreSQL database and includes various functionalities for managing employee ratings, bookings, and more.

## Requirements

- Node.js
- PostgreSQL

## Setup Instructions

### 1. Download the Project

- Download the project from [GitHub](https://github.com/anaswara-r-babu/WorkEase/) or by using GitHub Desktop.
- For better usage, use **VS Code** as your text editor.

### 2. Install Dependencies

- After unzipping the project, open it using **VS Code**.
- Open the **VS Code terminal** and run the following command to install the necessary dependencies:

  ```bash
  npm install


# Project Setup Guide

## 3. Set Up PostgreSQL Database

1. Install PostgreSQL on your machine (if not already installed).
2. Create a new database in PostgreSQL, for example, `jobportaldb`. You can also create your own database name.
3. After creating the database, proceed to the next step.

## 4. Create .env File

Create a `.env` file in the root directory of the project.

Add the following configurations inside the `.env` file:

```env
DATABASE_URL='database connection using prisma'
PORT=3001  # You can also use 3000 if 3001 doesn't work
SESSION_KEY='your secret key'
JWT_KEY='your secret key'
EMAIL='your email address used for sending confirmation keys to users/employees'
APP_PASSWORD='app password generated for the email used'
```
# App Setup Guide

## Important Steps for Generating App Password:

1. Log in to the email you used above.
2. Go to **Manage Accounts** → **Security** → **Enable Two-Factor Authentication** (important).
3. Search for **App Password** → Name the app (e.g., `mailApi`).

## 5. Run Prisma Migration

After setting up the `.env` file, open the terminal and run the following command to create tables in your PostgreSQL database:

```bash
npx prisma migrate dev --name init



