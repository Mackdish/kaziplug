# Skill Connect Hub

you are a senior fullstack software engineer, build a modern, responsive, task-based freelance marketplace platform similar to Swastasks.com and Upwork, where clients post tasks, freelancers bid, work is completed, and payments are handled via escrow using Stripe and M-Pesa.

The platform must support two-sided users, task bidding, dashboards, escrow payments, wallets, and admin controls, and be designed as a scalable MVP.

USER ROLES
1. CLIENT (TASK POSTER)

Register / Login

Create, edit, and delete tasks

Set:

Task title

Description

Category

Budget

Deadline

View bids from freelancers

Accept one bid

Pay task amount (Stripe or M-Pesa)

Review submitted work

Approve or reject task completion

2. FREELANCER (TASK WORKER)

Register / Login

Create profile (skills, bio)

Browse available tasks

Filter tasks by:

Category

Budget

Keyword

Submit bids:

Bid amount

Proposal text

View active tasks

Submit completed work

View earnings and wallet balance

Request withdrawals (Stripe or M-Pesa)

3. ADMIN

View and manage all users

Suspend or approve accounts

Manage task categories

View all tasks and bids

Monitor payments, escrow, and withdrawals

Set platform service fee percentage

Resolve disputes and refunds

CORE FEATURES
AUTHENTICATION & ACCESS

Email + password authentication

Role-based access control (Client, Freelancer, Admin)

Secure session handling

TASK MARKETPLACE

Task listing page with task cards showing:

Title

Budget

Category

Deadline

Status (Open, In Progress, Completed)

Task detail page with:

Full description

Bid list

“Place Bid” form

BIDDING SYSTEM

Freelancers can place multiple bids on different tasks

Clients can:

View all bids

Accept one bid only

Accepted bid locks the task

Task status changes to In Progress

PAYMENTS & ESCROW SYSTEM (STRIPE + M-PESA)
PAYMENT METHODS

Stripe for card payments (Visa / Mastercard)

M-Pesa STK Push for mobile payments

CLIENT PAYMENT FLOW

Client accepts a freelancer’s bid

Client is prompted to pay task amount

Client selects:

Stripe (card payment)

M-Pesa (phone number → STK push)

Payment is confirmed

Funds are marked as Held in Escrow

Task status becomes In Progress

ESCROW LOGIC

Funds are held by the platform

Escrow states:

Pending

Held

Released

Refunded

Freelancer cannot withdraw funds until task approval

TASK COMPLETION & PAYMENT RELEASE

Freelancer submits completed work

Client reviews submission

Client clicks Approve Task

System:

Releases escrow

Deducts platform fee (e.g., 10%)

Credits freelancer wallet

Task status becomes Completed

PLATFORM FEES

Percentage-based service fee

Configurable by admin

Automatically deducted before payout

Logged as platform revenue

FREELANCER WALLET & WITHDRAWALS

Wallet shows:

Available balance

Pending balance

Withdrawal methods:

Stripe payout

M-Pesa payout

Withdrawal states:

Requested

Processing

Completed

PAYMENT SAFETY RULES

No task can start before payment

No double payouts

Payment callbacks validated

Failed or cancelled payments handled gracefully

ADMIN PAYMENT CONTROLS

View all transactions

View escrow balances

Approve or block withdrawals

Issue refunds to clients

Resolve disputes manually

PAGES TO BUILD

Home (Hero + How It Works + CTAs)

Register

Login

Task Marketplace

Task Details

Client Dashboard

Freelancer Dashboard

Admin Panel

About Us

Contact

Terms & Privacy Policy

UI / UX REQUIREMENTS

Clean, professional design

Upwork-style layout

Mobile-first responsiveness

Clear CTAs:

“Post a Task”

“Find Work”

Minimal color palette:

White / light gray base

Blue or green accent

Clear status badges:

Open

Paid

Escrow Held

Completed

DATA MODELS (HIGH-LEVEL)
User

id

name

email

role

profile

Task

id

title

description

category

budget

deadline

status

client_id

Bid

id

task_id

freelancer_id

amount

proposal

Transaction

id

task_id

payer_id

payee_id

amount

payment_method (Stripe | M-Pesa)

escrow_status

transaction_status

created_at

Wallet

user_id

balance

pending_balance

Withdrawal

id

user_id

amount

method

status

TECHNICAL & STRUCTURAL REQUIREMENTS

Modular, component-based architecture

Reusable task cards and dashboard widgets

Clean routing between pages

Prepared for future:

Messaging

Reviews & ratings

Notifications

Additional payment methods

FINAL OUTPUT EXPECTATION

Fully functional MVP freelance marketplace

Escrow-based payment logic implemented

Stripe + M-Pesa payment flow simulated or connected

Scalable foundation for future expansion

BUILD PRIORITY

Focus on clarity, usability, and trust, especially for:

Payments

Task lifecycle

Freelancer earnings

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://kaziplug.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6c913c04-5c47-45f4-a9db-14d0111e7cd6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
