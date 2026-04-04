# Badges

![License](https://img.shields.io/badge/license-MIT-blue.svg)

# Overview

CollectiQ is a comprehensive tool designed for managing collections effectively. This tool integrates JWT (JSON Web Token) authentication to ensure secure access and data handling. The integration of JWT enhances user authentication processes and allows for stateless session management, providing a robust framework for application security.

# Project Objective

The primary objective of CollectiQ is to furnish users with a seamless experience in managing their collections with advanced features, incorporating both security and efficiency. Utilizing JWT not only facilitates authentication but also simplifies API interactions.

# Architecture

The architecture of CollectiQ is modular and follows best practices for scalability and maintainability. It incorporates an API that handles various operations, with the following authentication routes:

- `/api/auth/login`: Handles user login and returns a JWT token.
- `/api/auth/refresh`: Provides a method to refresh the JWT token.

# Tech Stack

The application is built using a modern technology stack:

- **Frontend**: React
- **Backend**: Node.js, Express
- **Database**: MongoDB
  - The DBMS includes tables for storing user data and `auth_events` to log authentication activities, including login attempts and token refreshes.

# Core Features

- User registration and authentication via JWT.
- Secure endpoints that require a valid JWT for access.
- Audit logging of user actions, providing insights into access patterns and security events.

# DBMS Highlights

The database architecture not only supports efficient data retrieval but also implements `auth_events` to track and store important authentication-related actions, supporting better security audits and compliance.

# Local Development Setup

To set up the project locally, execute the following steps:

1. Clone the repository.
2. Navigate to the project directory.
3. Create a `.env` file with the following:
   - `JWT_SECRET=<your_secret_key>`  # This secret key is crucial for signing JWTs.
4. Install the dependencies using `npm install`.
5. Start the development server with `npm start`.

# Academic Relevance

The principles embodied in CollectiQ reflect significant advancements in computer science and software engineering, particularly in secure application design and data management practices.

# Design Philosophy

CollectiQ aims for an intuitive user experience, high accessibility, and the integration of security protocols that do not hinder usability. The aim is to strike a balance between user engagement and strict security measures.

# Author

Created by **Infinite-Leo**.

# License

This project is licensed under the MIT License.