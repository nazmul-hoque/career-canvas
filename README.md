# Career Canvas

Build a polished, production-quality SaaS web app inspired by the UX and learning model of Kodree, but with completely original branding, UI, copy, and visual design. Do not copy Kodree's proprietary assets or exact interface.

The product is a modern interactive learning platform for people who want to become job-ready in technology through hands-on practice rather than passive video courses.

Product concept

Create an education platform where users choose a career path or individual skill, follow a structured roadmap, complete interactive lessons and practical challenges, build real-world projects, receive AI-powered guidance, earn XP and achievements, maintain learning streaks, and track their progress toward becoming job-ready.

The experience should feel like a combination of:

Duolingo-style gamification

Codecademy-style interactive learning

A modern SaaS dashboard

An AI coding mentor

A professional career roadmap

Core career paths

Create these initial career paths:

Frontend Developer

Full-stack Developer

Python Developer

Data Analyst

UX/UI Designer

Product Manager

AI / GenAI Developer

Each career path should have:

Overview

Difficulty

Estimated completion time

Skills learned

Modules

Lessons

Practice tasks

Real-world projects

Progress percentage

Certificate eligibility

Main dashboard

After signing in, users should see a personalized dashboard containing:

Welcome message

Current learning streak

XP earned

Level

Overall course progress

"Continue learning" card

Today's recommended task

Current career path

Upcoming lessons

Recent achievements

Weekly learning activity chart

Leaderboard position

Recommended courses

Portfolio projects

Make the dashboard visually engaging without feeling cluttered.

Learning experience

Create an interactive lesson interface.

Desktop layout:

Left sidebar containing the course/module/lesson roadmap

Large central learning area

Right-side AI mentor panel

A lesson can contain:

Short explanations

Examples

Code snippets

Interactive questions

Multiple-choice questions

Fill-in-the-blank exercises

Coding challenges

Debugging exercises

Mini projects

For coding exercises, create a browser-based code editor with:

Syntax highlighting

Run button

Reset button

Output/console panel

Test results

Hint button

Submit button

The interface should make the user feel like they are learning by doing.

AI Mentor

Create an AI Mentor panel available throughout the learning experience.

The AI mentor should:

Explain concepts

Give hints

Review submitted answers

Analyze code

Identify bugs

Explain errors

Ask guiding questions instead of immediately giving answers

Recommend what to study next

Create a friendly conversational UI with message history, suggested prompts, loading states, and contextual awareness of the current lesson.

Example:
User: "Why isn't my JavaScript function working?"

AI Mentor:
"Let's debug it together. First, check whether the function is actually being called. What do you expect the value of result to be?"

Gamification

Build a complete gamification system.

Users earn:

XP

Levels

Badges

Achievements

Streaks

Include:

Daily streak counter

XP progress bar

Level-up animation

Achievement notifications

Daily goals

Weekly goals

Leaderboard

Completed-task celebration

Example achievements:

First Lesson

First Coding Challenge

7 Day Streak

1,000 XP

Debugging Master

Project Completed

10 Lessons Completed

Course catalog

Create a searchable course catalog with filters:

Skill

Career

Beginner / Intermediate / Advanced

Duration

Popularity

Recommended

Example courses:

HTML & CSS

JavaScript

React

TypeScript

Python

SQL

Git & GitHub

Node.js

Data Analytics

Excel

Figma

UX Design

Generative AI

Machine Learning

Product Management

Each course page should contain:

Hero section

Course description

Skills learned

Curriculum

Number of lessons

Number of practical tasks

Projects

Difficulty

Student rating

Instructor information

CTA to start course

Projects / Portfolio

Create a project-based learning section.

Users should be able to build portfolio projects such as:

Landing page

E-commerce website

Dashboard

Weather application

2048 game

Data analytics dashboard

Mobile app design

AI chatbot

Each project should include:

Brief

Requirements

Skills practiced

Milestones

Submission area

AI feedback

Completion status

Users should have a public portfolio page showing completed projects and certificates.

Community

Create a community section with:

Discussion feed

Course-specific discussions

Questions and answers

Comments

Likes

User profiles

Trending discussions

Include a leaderboard showing:

Username

Avatar

XP

Level

Streak

Rank

Profile

Create a beautiful learner profile containing:

Avatar

Name

Bio

Current career path

XP

Level

Streak

Completed courses

Certificates

Achievements

Skills

Portfolio projects

Learning statistics

Certificates

When a user completes a career path, allow them to receive a professional certificate.

Create a certificate page with:

User name

Career path

Completion date

Skills

Certificate ID

Download/share buttons

Subscription

Create a pricing page with three plans:

Free:

Limited courses

Limited practice tasks

Basic progress tracking

Pro:

All courses

Unlimited practice

AI Mentor

Projects

Certificates

Community

Lifetime:

One-time payment

All current and future courses

Unlimited AI Mentor usage

All projects and certificates

Include monthly/yearly toggle and a prominent recommended plan.

Do not implement real payments yet; create the UI and realistic mock checkout flow.

Authentication

Create:

Sign up

Login

Forgot password

Email verification

Social login buttons

Onboarding flow

After registration, ask:

"What do you want to achieve?"

Options:

Get my first tech job

Change careers

Improve my current skills

Build projects

Learn for fun

Then ask:

Current experience level

Desired career

Hours available per week

Use these answers to personalize the dashboard.

Navigation

Desktop navigation:

Logo
Dashboard
Learn
Career Paths
Projects
Community
Leaderboard

Right side:
Search
Notifications
Streak
Profile

Mobile navigation should use a bottom navigation bar with:
Home
Learn
Projects
Community
Profile

Visual design

Create a premium modern SaaS aesthetic.

Use:

Clean white/light-gray backgrounds

Dark text

One distinctive primary accent color

Rounded cards

Subtle shadows

Generous spacing

Modern typography

Clear visual hierarchy

Smooth micro-interactions

Progress bars

Circular progress indicators

Beautiful empty states

Avoid making it look like a generic LMS.

The interface should feel motivating, energetic, modern, and slightly playful while remaining professional.

Use responsive design throughout.

Important UX details

Add:

Skeleton loading states

Toast notifications

Confirmation dialogs

Empty states

Error states

Hover animations

Smooth page transitions

Responsive mobile layouts

Accessible color contrast

Keyboard-friendly interactions

Technical requirements

Use:

React

TypeScript

Tailwind CSS

shadcn/ui

Supabase for authentication and database

Reusable component architecture

Create realistic seed data so the application feels populated immediately.

Use Supabase tables for:

users

profiles

courses

modules

lessons

tasks

submissions

progress

achievements

user_achievements

streaks

projects

certificates

community_posts

comments

subscriptions

Implement real authentication and persistent user progress.

For the first version, coding execution and AI responses can use mock services, but structure the code so real execution APIs and an LLM API can be connected later.

Build priority

First make these flows fully functional:

Landing page

Sign up / login

Onboarding

Personalized dashboard

Course catalog

Course detail page

Interactive lesson

Coding challenge interface

AI Mentor UI

Progress tracking

Gamification

Projects

Profile

Community

Pricing

Populate the app with realistic example content for Frontend Developer and Python Developer paths.

The final result should feel like a real commercial EdTech SaaS product, not a prototype or generic dashboard.

Focus especially on the learning experience: users should immediately understand what to learn next, complete practical tasks, receive feedback, earn progress/XP, and feel motivated to return tomorrow.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/910363d0-1514-48b7-98c8-df57f1446c93).

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
