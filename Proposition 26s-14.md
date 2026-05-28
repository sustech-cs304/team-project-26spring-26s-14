[CS304] Requirement Analysis Report

Project Name: Campus Social Marketplace

Project Member: 徐刘卓然

1. Overview

1.1 Motivation and Background

Each university has a marketplace where lost items, second-hand textbooks, and unused skills can be stored.

Currently, these items are scattered in various WeChat groups or outdated forum posts. The information is

often buried and the trustworthiness is difficult to verify.

US-1: As a student seller, I want to list my used items with my verified student identity and reputation

score so that buyers can trust me and transact safely.

US-2: As a buyer or seller, I want to chat in real-time to negotiate prices and arrange meeting times so

that we can reach agreements efficiently.

US-3: As a student buyer, I want to receive automatic notifications when items on my wishlist are posted

so that I can quickly purchase without constantly checking.

US-4: As a student, I want to see lost item locations and trading spots on an interactive map so that I can

easily arrange convenient meetings.

US-5: As a student, I want to exchange my skills (e.g., Python tutoring) for other skills (e.g., guitar lessons)

so that we can learn without spending money.

1. Trust-based Trading System

A product/service listing system integrated with student identity verification and "reputation score" based

on previous successful transactions.

2. Smart Matching & Wishlist Notification

An automatic notification system that alerts users when items on their "wishlist" (e.g., a specific calculus

textbook) are posted.

3. Skill Exchange Platform

A feature allowing students to exchange "skills" (e.g., 1 hour of Python tutoring for 1 hour of guitar

lessons).

4. Campus Trading Map

An interactive map displaying locations of "found items" or optimal places for conducting transactions.

5. Real-time Chat Room

An interface for buyers and sellers to chat in real-time, including price negotiation and appointment

scheduling.

1.2 Target User or Clients Characteristics

Students on campus

1.3 Project Scope

Trust-based Trading System; Smart Matching & Wishlist Notification; Skill Exchange Platform; Campus

Trading Map; Real-time Chat Room

1.4 Overall Goal

We will created an app.

This platform can greatly facilitate the campus life of students.

Students can chat in the forum in their spare time and always know what the students of Sustech are paying

attention to.

Students can break the information gap and get the information they need quickly.

Students can also sell idle items if they have them, and buy them on the platform if they need them, which can

increase the utilization rate of idle items and reduce the burden on families.

Students can exchange abilities and skills;

2. Development Process

2.1 Process Models

Incremental Process:

Advantages:

1. It is easilier to change the function when needed.

2. Software can be delivered earlier, so as to facilitate later debugging and change and add functions.

2.2 Project Schedule

3. Requirements

3.1 Functional Requirements

We contain the Registration function, Login function, Search function, Historical record /Collection function,

Message notification function, Post/message function, Trading, Chat Room

function.

3.1.1 Functional Requirement 1

Input: User's Name and its password

Processing: verify whether the name has been registered and the password is valid.

Output: If so, save it in the database and return true, else doesn't save it to database and tell user that the where

failed.

Description:Registration function

3.1.2 Functional Requirement 2

Input: User's Name and its password

Processing: verify whether the name correspond to the password

Output: If so, return true, else return false

Description: Login function

3.1.3 Functional Requirement 3

Input: keywords

Processing: Search for posts containing keywords Output:

posts that contain the keywords Description:Search

function

3.1.4 Functional Requirement 4

Input: The query to get the Browsing history/Collection Processing:

return the Browsing history/Collection from database Output:

Browsing history/Collection

Description: Historical record /Collection function

3.1.5 Functional Requirement 5

Input: The massage that should inform the user.

Processing: send it to the client.

Output: The massage that should inform the user.

Description: Message notification function

3.1.6 Functional Requirement 6

Input: Message

Processing: store it in database and post it on the posts.

Output: Whether the message is post successfully.

Description: Post/message function

3.1.7 Functional Requirement 7

Input:The query to sell/buy goods

Processing: Call up the payment module after checking the security.

Output: whether it is successfully buy / sell the good.

Description: Trading function

3.2 Non-Functional Requirements

3.2.1 Quality requirements

Each query should be responded in 6s.

Some information should be Cached in users phone to reduce the access time, like the password to be stored

to login automatically.

3.2.2 Safety Requirements

Transaction security should be guarantee.

The stored information cannot be stolen.

3.2.3 Maintainability/Extensibility Requirements

Through modularity, the coupling between various functions of the product is reduced, so that it is

convenient to modify a single function or add functions without affecting the normal use of other functions.

4. Technical Requirements

4.1 User Interface

Vue 3 + Element Plus + MapJS API (API is called via Axios, and connection is made via Socket.IO)

4.2 Business Logic

Node.js + Express (Operations are performed via Prisma)

4.3 Data Persistence

PostgreSQL

4.4 Supporting Technologies

JWT (Authentication) + bcryptjs (Encryption) + Socket.IO (Real-time) + dotenv (Configuration)

