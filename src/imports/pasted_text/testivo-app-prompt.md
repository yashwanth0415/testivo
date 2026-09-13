MASTER PROMPT — BUILD THE COMPLETE TESTIVO APPLICATION

You are building a complete, production-ready web application called:

TESTIVO

Brand name: testivo
Use the exact lowercase spelling “testivo” throughout the branding, logo, browser title, landing page and application wherever appropriate.

IMPORTANT:
This is NOT a UI-only prototype.
Build the complete functional application architecture using:

- React
- TypeScript
- Modern responsive CSS
- Supabase as the backend
- Supabase Authentication
- Supabase PostgreSQL database
- Supabase Storage
- Supabase Row Level Security (RLS)
- Secure server-side/Edge Function architecture for AI API calls
- Modular AI provider architecture
- Proper loading, error, empty and success states
- Production-quality component structure
- No fake/demo functionality where real functionality is expected

The application must be designed so that it can actually be connected to Supabase and an external AI API and used as a real product.

==================================================
1. PRODUCT PURPOSE
==================================================

Testivo is an AI-powered PDF-to-exam platform.

The primary purpose is:

A user uploads an examination PDF containing questions, MCQ options, answers/answer keys, sections, diagrams, tables, mathematical questions, or image-based questions.

Testivo processes the PDF using the administrator-selected AI provider/model.

The AI extracts the examination structure accurately and converts it into a structured digital exam.

The user can then configure and take the exam through a professional computer-based-test interface.

After completing the exam, Testivo immediately calculates and displays the result.

The platform must support:

- Any number of users
- Any number of PDFs
- Any number of exams
- Multiple sections
- Sectional timing
- Overall timing
- Different marks per question
- Negative marking
- Single-answer MCQs
- Multiple-answer MCQs
- Image-based questions
- Diagrams
- Tables
- Mathematical/aptitude questions
- Question images
- Answer-key extraction
- Exam review
- Results
- Detailed performance analysis
- Admin management
- Configurable AI provider
- Configurable AI model
- Secure API key management

==================================================
2. BRAND / VISUAL DIRECTION
==================================================

Brand:
testivo

The UI must NOT look like a generic AI-generated website.

Do NOT use:
- Generic ChatGPT-style layouts
- Excessive gradients
- Generic AI glowing effects
- Robot illustrations
- Generic “AI magic” animations
- Overused glassmorphism
- Template-looking SaaS designs
- Excessive rounded cards everywhere
- Generic purple/blue AI startup appearance

The website should feel like a professionally designed education/testing product created by an experienced product-design team.

Design characteristics:

- Premium
- Modern
- Highly usable
- Trustworthy
- Academic but not boring
- Visually distinctive
- Fast
- Clean
- Interactive
- Professional
- Excellent typography
- Excellent spacing
- Strong visual hierarchy
- Subtle animations
- Meaningful micro-interactions

The design should make users feel:

“I want to take an exam on this platform.”

The product should feel suitable for:
- Competitive exam preparation
- SSC
- Banking
- UPSC
- Railway
- State government exams
- Aptitude tests
- University exams
- Mock tests
- Practice papers
- General MCQ examinations

Make the interface responsive for:
- Desktop
- Laptop
- Tablet
- Mobile

However, the actual exam-taking interface should be optimised primarily for desktop/laptop because it represents a computer-based examination environment.

==================================================
3. LANDING PAGE
==================================================

Create a highly polished landing page for testivo.

The landing page must immediately communicate:

“Upload your question paper. Turn it into a real exam. Test yourself.”

Suggested hero concept:

A visually interesting interactive representation of a paper transforming into a digital examination interface.

Do not make it look like an AI demo.

Hero should contain:

- testivo logo
- Navigation
- Sign In
- Get Started
- Main headline
- Supporting description
- Primary CTA
- Secondary CTA
- Interactive exam preview

Possible headline:

“Turn Any Question Paper Into Your Next Exam.”

Supporting text:

“Upload a PDF, configure your exam, and experience it like a real computer-based test.”

Primary CTA:
“Get Started”

Secondary CTA:
“See How It Works”

Create an interactive product preview showing:
PDF → Processing → Structured Questions → Exam → Results

Use tasteful animations.

Landing page sections:

1. Hero
2. How Testivo Works
3. PDF-to-Exam transformation
4. Feature showcase
5. Exam experience preview
6. Sectional timing showcase
7. Image/diagram question support
8. Performance analytics
9. Security/privacy section
10. Call to action
11. Footer

Use real-looking interface examples, not placeholder rectangles.

==================================================
4. AUTHENTICATION
==================================================

Implement Supabase Authentication.

Users must be able to:

SIGN UP:
- Full name
- Username
- Email
- Password
- Confirm password

SIGN IN:
- Username/email
- Password

Also provide:

- Continue with Google
- Continue with Apple

Where supported by Supabase OAuth configuration.

Provide:
- Forgot password
- Reset password
- Email verification
- Logout
- Session persistence
- Protected routes

Do not store passwords manually in the database.

Use Supabase Auth securely.

==================================================
5. USER PROFILE
==================================================

Every registered user should have a profile.

Profile fields:

- User ID
- Full name
- Username
- Email
- Profile image/avatar
- Created date
- Last login

Allow users to update:
- Name
- Username
- Profile picture
- Password

Email changes must use appropriate authentication verification mechanisms.

==================================================
6. USER DASHBOARD
==================================================

After successful authentication, take the user to:

/dashboard

Dashboard should be polished and useful.

Show:

- Welcome message
- Total exams created
- Total exams attempted
- Completed exams
- Average score
- Best score
- Recent exams
- Recent attempts
- Quick Create Exam button

Main navigation:

Dashboard
My Exams
Create Exam
Results
Profile
Settings
Logout

Create an attractive dashboard without excessive cards.

==================================================
7. CREATE EXAM WORKFLOW
==================================================

Route:

/create-exam

The workflow should be extremely simple.

STEP 1:
Upload PDF

Provide a large professional upload area.

Support:
- Drag & drop
- Browse files
- Multiple PDFs
- PDF validation
- File size validation
- Upload progress

Display:
- File name
- File size
- Page count if available
- Upload progress
- Remove file
- Replace file

The user should be able to upload any number of PDFs over time.

==================================================
8. PDF PROCESSING
==================================================

After upload, process the PDF through the configured AI provider/model.

IMPORTANT:

Never expose an API key in React/browser code.

The browser should call a secure backend endpoint / Supabase Edge Function.

The Edge Function/server-side layer should:

1. Receive the uploaded PDF reference.
2. Retrieve the PDF securely.
3. Send the appropriate content to the configured AI provider.
4. Process/extract the examination structure.
5. Validate the returned structure.
6. Store structured data in Supabase.
7. Return processing status to the frontend.

The AI provider must be configurable.

Do NOT hard-code NVIDIA.

Do NOT hard-code OpenRouter.

Build an abstraction such as:

AI Provider
    ↓
Provider Adapter
    ↓
Selected Model
    ↓
PDF Processing Pipeline

==================================================
9. UNIVERSAL AI PROVIDER SYSTEM
==================================================

The administrator must be able to configure AI providers from:

/admin

The system should support providers such as:

- NVIDIA
- OpenRouter
- OpenAI-compatible APIs
- Other compatible providers

Do not assume every provider has exactly the same API format.

Create a provider adapter architecture.

Each provider configuration should contain:

- Provider name
- API base URL
- API key
- Selected model
- Enabled/disabled status

For compatible providers, support model discovery.

When the administrator enters:

Provider
API Base URL
API Key

the backend should securely test the credentials.

If the provider supports model listing:

Fetch available models.

Display:

Available Models

For each model show:
- Model name
- Model ID
- Provider
- Context information if available
- Status
- Select button

Administrator can select a model.

Button:

“Use This Model”

Then:

“Save & Activate”

Before activation, test the selected model with a lightweight request.

Only activate if the test succeeds.

==================================================
10. API KEY SECURITY
==================================================

CRITICAL SECURITY REQUIREMENT:

API keys must NEVER be:

- Hard-coded in React
- Stored in frontend source code
- Exposed in browser JavaScript
- Returned to the frontend
- Logged to console
- Included in error messages
- Stored in localStorage
- Stored in sessionStorage

Store sensitive provider credentials securely on the backend.

Use appropriate Supabase server-side mechanisms/secrets where possible.

The admin UI should display masked API keys.

Example:

sk-••••••••••••••••1234

Provide:

- Add API key
- Replace API key
- Remove API key
- Test API key
- Test selected model
- Activate model
- Deactivate provider

When the API key is changed:

1. Validate it
2. Discover models if supported
3. Allow administrator to select model
4. Test selected model
5. Save configuration
6. Activate selected configuration

Show a clear success message.

==================================================
11. ACTIVE AI CONFIGURATION
==================================================

Only one AI configuration should be active for PDF extraction at a time unless the architecture explicitly supports multiple purposes.

Admin should see:

ACTIVE AI PROVIDER

Provider:
OpenRouter

Model:
example-model

Status:
Active

Last tested:
date/time

Last successful request:
date/time

Allow:

Change Provider
Change API Key
Change Model
Test Connection
Deactivate

Every NEW PDF processing request must use the currently active configuration.

Existing exams/questions must NOT suddenly change when the administrator changes the model.

Store the provider/model used for each processing job for auditability.

==================================================
12. AI EXTRACTION REQUIREMENTS
==================================================

The AI extraction system is one of the most important parts of Testivo.

The extraction pipeline must attempt to identify:

- Questions
- Question numbers
- Options
- Correct answers
- Answer key
- Sections
- Marks
- Negative marks if present
- Question type
- Images
- Diagrams
- Tables
- Mathematical expressions
- Subquestions
- Question ordering

The AI output MUST be structured JSON.

Use strict schema validation.

Do not blindly insert AI output into the database.

Validate:

- Required question number
- Question text or image
- Options when applicable
- Correct answer when available
- Question type
- Section
- Ordering

If extraction is incomplete or invalid, mark the processing job appropriately instead of silently creating corrupted questions.

==================================================
13. IMAGE-BASED QUESTIONS
==================================================

THIS IS CRITICAL.

Many examination PDFs contain:

- Graphs
- Diagrams
- Geometry figures
- Tables
- Charts
- Maps
- Mathematical figures
- Image-based questions
- Images embedded inside questions
- Scanned questions

The system MUST preserve these.

Do NOT force the AI to convert every image into text.

If a question contains an image:

Store the image separately in Supabase Storage.

Associate it with the question.

The exam interface must display the image exactly/faithfully enough for the user to answer.

If text extraction fails but the original PDF page contains the question:

Use the original page/region as a fallback visual representation.

The system should support storing:

question_text
question_image_url
question_image_alt
option_text
option_image_url

where necessary.

==================================================
14. PDF PAGE/IMAGE FALLBACK
==================================================

Create a robust fallback.

If the AI cannot reliably extract a question:

Do NOT show a broken question.

Instead:

- Preserve the relevant original PDF page/region
- Store a reference to it
- Display the visual question in the exam

The goal is:

“User should be able to see the original question even when OCR/text extraction fails.”

For scanned PDFs, support OCR/vision-capable processing where the selected AI provider/model supports it.

If a model cannot process images, gracefully use the original PDF rendering as fallback rather than losing the question.

==================================================
15. EXTRACTION RESULTS SCREEN
==================================================

After processing finishes, show a professional processing result.

Example:

PDF processed successfully

Questions extracted: 100
Answer keys found: 100
Sections detected: 4
Images detected: 17

Also show:

- Processing duration
- Pages processed
- Warnings if any
- Questions requiring review

Do NOT claim 100% accuracy unless verified.

If potential extraction issues are detected, clearly display them.

Allow the user to review extracted content before publishing the exam.

==================================================
16. EXAM REVIEW / EDITOR
==================================================

Create:

/exam/:id/edit

The user can review:

- Question
- Options
- Correct answer
- Section
- Question number
- Marks
- Negative marks
- Images

Allow editing.

Actions:

Edit question
Edit options
Change correct answer
Move question
Change section
Delete question
Add question
Replace image

The original PDF remains preserved.

==================================================
17. SECTION DETECTION
==================================================

If the PDF contains section headings such as:

Section 1
Section 2
Section 3
Section 4

automatically detect them.

Example:

Section 1:
Questions 1–25

Section 2:
Questions 26–50

Section 3:
Questions 51–75

Section 4:
Questions 76–100

Question ordering must remain sequential.

If sections cannot be reliably detected:

Allow the user to manually create sections.

User should be able to specify:

Section name
Starting question
Ending question

Example:

Quantitative Aptitude
1–25

Reasoning
26–50

English
51–75

General Awareness
76–100

==================================================
18. EXAM CONFIGURATION
==================================================

After extraction, show:

EXAM CONFIGURATION

Fields:

Exam name
Description
Total questions
Total marks
Duration
Marks per question
Negative marking
Question navigation mode
Sections
Sectional timing

Allow:

Single correct answer

OR

Multiple correct answers

Question-level configuration should support both.

==================================================
19. TIMING SYSTEM
==================================================

Support:

OVERALL EXAM TIMER

Example:

60 minutes

AND

SECTIONAL TIMING.

Example:

Section 1 — 20 minutes
Section 2 — 15 minutes
Section 3 — 15 minutes
Section 4 — 10 minutes

Sectional timing must behave like a real CBT exam.

When the sectional timer reaches zero:

Automatically lock the section.

Move the user to the next section according to configuration.

Prevent the user from returning to a locked section.

If the user intentionally submits the section early, handle it according to configured rules.

Display:

Time Remaining

Section Time Remaining

The timing must be calculated server-side where appropriate to prevent simple client-side manipulation.

==================================================
20. EXAM CREATION
==================================================

After configuration:

Show a final review page.

Display:

Exam Name
Questions
Sections
Total Marks
Duration
Negative Marking
Section Timing

Button:

“Create Exam”

After successful creation:

Show:

Exam Created Successfully

Actions:

Start Exam
View Exam
Edit Exam
Share/Practice Later

==================================================
21. MY EXAMS
==================================================

Route:

/exams

Show all exams created by the current user.

Each exam should show:

Name
Question count
Sections
Duration
Created date
Last attempted
Best score
Status

Actions:

Start
Continue
View
Edit
Duplicate
Delete

Do not allow users to see other users' private exams.

Use RLS.

==================================================
22. EXAM-TAKING INTERFACE
==================================================

This is the most important user-facing interface.

The exam should feel like a professional computer-based examination system used at an examination centre.

When the user starts the exam:

Enter a dedicated exam environment.

Use:

/exam/:id/start

Provide an immersive full-screen experience where supported by the browser.

Before starting:

Show an exam instruction page.

Include:

Exam name
Total questions
Total marks
Duration
Negative marking
Sections
Important instructions

Button:

“Start Exam”

After starting:

Attempt to enter browser fullscreen using the Fullscreen API.

Do not falsely claim OS-level full-screen security.

If browser fullscreen is unavailable, maintain a distraction-free exam layout.

==================================================
23. EXAM INTERFACE DESIGN
==================================================

Design a professional CBT interface.

Structure:

TOP BAR

Testivo
Exam name
Section name
Timer

MAIN AREA

Left/centre:

Question

Question image if present

Options

Right:

Question palette

Navigation

Status indicators

BOTTOM:

Previous
Save & Next
Mark for Review
Clear Response
Next

Question palette statuses:

Not Visited
Visited
Answered
Marked for Review
Answered + Marked for Review

Use clear visual distinction.

Do not make the interface visually noisy.

==================================================
24. QUESTION TYPES
==================================================

Support:

Single-choice MCQ

Only one option can be selected.

Multiple-choice MCQ

Multiple options can be selected.

Image option

Options can contain images.

Mixed text/image questions.

Mathematical notation.

Tables and diagrams.

==================================================
25. QUESTION NAVIGATION
==================================================

Allow navigation according to exam configuration.

Functions:

Next
Previous
Save & Next
Mark for Review
Clear Response
Jump to Question
Question Palette

Automatically save answers.

If the browser refreshes or temporarily disconnects:

Attempt to restore the current attempt state.

Do not lose answered questions unnecessarily.

==================================================
26. AUTO-SAVE
==================================================

Every response should be saved.

Use a reliable strategy combining:

- Local temporary state
- Database persistence
- Debounced saves

Do not excessively write to the database on every UI event.

The server must remain the source of truth for the completed attempt.

==================================================
27. SUBMIT EXAM
==================================================

When user clicks:

Submit Exam

Show confirmation:

“You have answered X of Y questions.”

“You have marked X questions for review.”

“Are you sure you want to submit?”

Buttons:

Cancel
Submit Exam

When submitted:

- Lock the attempt
- Calculate score
- Calculate correct answers
- Calculate incorrect answers
- Calculate unanswered
- Apply negative marking
- Calculate section scores
- Save result

Then immediately display the results.

==================================================
28. RESULT PAGE
==================================================

Create a highly polished result screen.

Show:

Score
Maximum marks
Percentage
Correct
Incorrect
Unanswered
Accuracy
Time taken
Rank/percentile only if enough data exists

Do NOT fabricate ranks or percentiles.

Section-wise results:

Section
Attempted
Correct
Incorrect
Unanswered
Marks
Accuracy

Create useful charts where appropriate.

==================================================
29. ANSWER REVIEW
==================================================

Allow the user to review the complete exam.

For every question show:

Question
Question image
Selected answer
Correct answer
Explanation if available
Status

Clearly distinguish:

Correct
Incorrect
Unanswered

For multiple-answer questions:

Show:
Selected answers
Correct answers

Do not mark partially matching answers as correct unless the configured scoring system explicitly supports partial marks.

==================================================
30. RESULTS HISTORY
==================================================

Route:

/results

Show previous attempts.

Each result:

Exam name
Date
Score
Percentage
Correct
Incorrect
Unanswered
Time

Allow:

View result
Review answers

==================================================
31. SEARCH / FILTER
==================================================

Add useful search and filtering in:

My Exams
Results

Filters:

Date
Score
Exam
Section

==================================================
32. DATABASE ARCHITECTURE
==================================================

Design a proper Supabase PostgreSQL schema.

Recommended tables:

profiles
exams
exam_sections
questions
question_options
question_images
exam_attempts
attempt_answers
results
section_results
processing_jobs
ai_providers
ai_models
ai_configurations
admin_profiles
audit_logs

Potential structure:

profiles
- id
- auth_user_id
- username
- full_name
- avatar_url
- created_at
- updated_at

exams
- id
- owner_id
- title
- description
- source_file_path
- total_questions
- total_marks
- duration_seconds
- negative_marking
- status
- created_at
- updated_at

exam_sections
- id
- exam_id
- name
- section_order
- start_question
- end_question
- duration_seconds

questions
- id
- exam_id
- section_id
- question_number
- question_text
- question_type
- correct_answer
- marks
- negative_marks
- source_page
- source_reference
- created_at

question_options
- id
- question_id
- option_key
- option_text
- image_path
- option_order

question_images
- id
- question_id
- storage_path
- page_number
- metadata

exam_attempts
- id
- exam_id
- user_id
- status
- started_at
- submitted_at
- current_section
- current_question

attempt_answers
- id
- attempt_id
- question_id
- selected_answer
- is_marked_review
- saved_at

results
- id
- attempt_id
- total_score
- max_score
- percentage
- correct_count
- incorrect_count
- unanswered_count
- accuracy
- time_taken_seconds

section_results
- id
- result_id
- section_id
- score
- attempted
- correct
- incorrect
- unanswered
- accuracy

processing_jobs
- id
- user_id
- exam_id
- source_file_path
- status
- progress
- questions_found
- answers_found
- sections_found
- images_found
- provider_id
- model_id
- error_message
- started_at
- completed_at

ai_providers
- id
- name
- provider_type
- base_url
- encrypted_secret_reference
- enabled
- created_at
- updated_at

ai_models
- id
- provider_id
- model_id
- display_name
- metadata
- enabled

ai_configurations
- id
- provider_id
- model_id
- is_active
- last_tested_at
- created_at
- updated_at

audit_logs
- id
- admin_user_id
- action
- metadata
- created_at

Use foreign keys and indexes appropriately.

==================================================
33. ROW LEVEL SECURITY
==================================================

Implement strict Supabase RLS.

Users can:

- Read/update their own profile
- Create their own exams
- Read their own exams
- Update their own exams
- Delete their own exams
- Read their own questions
- Create attempts only for accessible exams
- Read their own attempts
- Read their own results

Users must NOT be able to access another user's private exams, attempts, API keys or provider configuration.

Admin access must be handled separately and securely.

Do not rely only on hiding UI buttons for security.

==================================================
34. ADMIN PORTAL
==================================================

Create a separate admin portal:

/admin

The admin portal must have a completely different professional management interface.

Initial super-admin credentials requested by the product owner:

Username:
YASHWANTH

Password:
YASHWANTH

IMPORTANT:
Do NOT hard-code this password in frontend source code.

Implement the initial admin account through secure server-side/database setup or an initialisation process.

Immediately after first login, force/change password capability.

Allow the administrator to change:

- Admin username
- Admin password

Admin authentication must be separate from normal user permissions.

Never expose admin credentials in client code.

==================================================
35. ADMIN DASHBOARD
==================================================

Admin dashboard should display:

Total registered users
Total exams
Total exam attempts
Total questions
Total processing jobs
Successful processing jobs
Failed processing jobs
Active AI provider
Active AI model

Also show charts:

User growth
Exam creation
Exam attempts
Processing activity

Use real Supabase data.

Do not use fake statistics after backend is connected.

==================================================
36. ADMIN USER MANAGEMENT
==================================================

Admin can view:

Users
Username
Name
Email
Created date
Last activity
Number of exams
Number of attempts

Provide:

Search
Filter
View user

Do not expose passwords.

Do not display sensitive authentication information.

==================================================
37. ADMIN EXAM MANAGEMENT
==================================================

Admin can see all exams created by users.

Columns:

Exam
Owner
Questions
Sections
Created
Attempts
Status

Actions:

View
Inspect
Disable if necessary
Delete according to permission policy

Be careful with destructive actions.

Use confirmation dialogs.

==================================================
38. ADMIN AI CONFIGURATION
==================================================

Create:

/admin/ai

This is one of the most important pages.

Display:

AI PROVIDER CONFIGURATION

Provider selector.

Examples:

NVIDIA
OpenRouter
OpenAI-compatible
Custom compatible provider

Fields:

Provider name
Base API URL
API key

Buttons:

Test Connection
Fetch Models

After entering a valid API key:

The backend should attempt to discover available models when the provider supports model listing.

Display model cards/table.

Each model:

Model name
Model ID
Provider
Availability
Use This Model

When administrator selects:

Use This Model

show confirmation/configuration panel.

Then:

Test Model

If successful:

Model Ready

Button:

Save & Activate

When saved:

Show:

“AI configuration updated successfully.”

==================================================
39. PROVIDER CONFIGURATION ARCHITECTURE
==================================================

Build the backend so changing provider/model does NOT require changing the application frontend.

Example architecture:

processPDF()
    ↓
getActiveAIConfiguration()
    ↓
providerAdapter
    ↓
selectedModel
    ↓
AI request
    ↓
structured extraction
    ↓
validation
    ↓
database

Implement provider adapters.

For example:

NVIDIAAdapter
OpenRouterAdapter
OpenAICompatibleAdapter

Do not assume that every API has identical endpoints.

Use provider-specific configuration.

==================================================
40. MODEL FAILURE HANDLING
==================================================

If active model fails:

Do not corrupt the exam.

Processing job should become:

FAILED

with a useful error.

Do not automatically switch models unless the administrator explicitly enables fallback.

Optionally support:

Primary model
Fallback model

But keep fallback disabled by default.

==================================================
41. PROCESSING PROGRESS
==================================================

When PDF processing begins, show an attractive processing screen.

Display:

Uploading PDF
Preparing document
Reading pages
Analysing questions
Detecting sections
Extracting options
Detecting answer key
Processing images
Validating questions
Saving exam

Show progress percentage.

Example:

67%

Questions detected: 72
Answer keys detected: 72
Images detected: 11

The progress must represent real backend progress where possible.

Do NOT create a fake countdown timer pretending to represent exact AI processing time.

If exact completion time cannot be known, say:

“Processing document…”

rather than inventing a duration.

==================================================
42. EXTRACTION VALIDATION
==================================================

After AI extraction, perform validation.

Check:

Question numbering
Missing questions
Duplicate questions
Missing options
Invalid answer keys
Invalid section ranges
Missing images
Malformed JSON

If issues are found:

Show:

“Review recommended”

with specific warnings.

Never silently discard content.

==================================================
43. QUESTION ORDER
==================================================

Questions must retain original ordering.

Example:

1
2
3
...
25
26
...
100

Do not reorder questions based on AI interpretation.

Section assignment must not change question numbering.

==================================================
44. ORIGINAL SOURCE PRESERVATION
==================================================

Every extracted question should retain source information where possible:

Original PDF
Page number
Source region/reference

This allows debugging and visual fallback.

Never destroy the original uploaded PDF after extraction.

==================================================
45. FILE STORAGE
==================================================

Use Supabase Storage.

Create appropriate storage buckets/folders for:

Original PDFs
Question images
Option images
User avatars

Use secure access policies.

Do not expose private files publicly unless intentionally configured.

Use signed URLs where appropriate.

==================================================
46. ERROR HANDLING
==================================================

Every major operation needs proper error states.

Examples:

Upload failed
PDF invalid
AI provider unavailable
API key invalid
Model unavailable
Extraction failed
Database failure
Network failure
Session expired

Provide useful human-readable messages.

Do not show raw API secrets, stack traces or sensitive backend errors to users.

==================================================
47. SECURITY
==================================================

Implement:

Authentication
Authorization
RLS
Secure API calls
Server-side AI keys
Input validation
File validation
Rate limiting strategy
Audit logs for admin operations
Secure session handling
Protected routes

Do not trust client-side values for:

Score
Correct answers
Exam duration
User role
Admin status
API credentials

Calculate important values server-side.

==================================================
48. PERFORMANCE
==================================================

The application must be fast.

Use:

Lazy loading
Pagination
Debounced search
Optimised database queries
Efficient image loading
Caching where appropriate
Compressed assets
Optimised React rendering

Do not load every question from every exam unnecessarily.

==================================================
49. ACCESSIBILITY
==================================================

Support:

Keyboard navigation
Readable contrast
Focus states
Screen-reader-friendly labels
Accessible buttons
Accessible forms

The exam interface should support keyboard-friendly navigation.

==================================================
50. RESPONSIVE DESIGN
==================================================

Desktop:
Primary experience.

Tablet:
Fully usable.

Mobile:
Dashboard, exam management and results should be responsive.

For actual exam-taking on mobile, provide a usable responsive layout but clearly optimise the CBT interface for desktop.

==================================================
51. ANIMATIONS
==================================================

Use subtle professional animations.

Examples:

Page transitions
Button interactions
Upload animation
Processing state
Question transitions
Result reveal
Chart animation
Success state

Do NOT over-animate.

No distracting animations during the actual examination.

==================================================
52. DESIGN SYSTEM
==================================================

Create a consistent design system.

Define:

Typography
Spacing
Buttons
Inputs
Cards
Tables
Badges
Modals
Tabs
Dropdowns
Toast notifications
Loading skeletons
Empty states

Maintain consistency across:

Landing page
Dashboard
Exam creation
Exam interface
Results
Admin panel

==================================================
53. LOGO / BRANDING
==================================================

Brand:

testivo

Create a distinctive professional wordmark/icon.

Do not use a generic robot or AI brain.

Logo should work on:

Landing page
Dashboard
Exam interface
Admin portal
Favicon

==================================================
54. EMPTY STATES
==================================================

Design meaningful empty states.

Examples:

No exams yet

“No exams yet. Upload your first question paper and turn it into a test.”

No results

“No attempts yet. Start an exam to see your performance.”

No PDFs

“Upload a PDF to get started.”

==================================================
55. LOADING STATES
==================================================

Every asynchronous operation must have a proper loading state.

Do not leave blank screens.

Use:

Skeletons
Progress indicators
Spinners where appropriate
Processing stages

==================================================
56. NOTIFICATIONS
==================================================

Use professional toast notifications for:

Exam created
Exam updated
Exam deleted
PDF uploaded
Processing completed
Processing failed
Profile updated
Password changed
AI configuration updated

==================================================
57. ROUTING
==================================================

Create appropriate routes:

/
 /signin
 /signup
 /forgot-password
 /reset-password
 /dashboard
 /create-exam
 /exams
 /exams/:id
 /exams/:id/edit
 /exam/:id/instructions
 /exam/:id/start
 /exam/:id/result
 /results
 /profile
 /settings

Admin:

/admin
/admin/login
/admin/users
/admin/exams
/admin/processing
/admin/ai
/admin/settings
/admin/audit-logs

Protect all private routes.

==================================================
58. ADMIN URL SECURITY
==================================================

The visible route can be:

/admin

but do not rely on the URL for security.

Even if a normal user manually enters:

/admin

they must NOT gain access.

Verify admin privileges server-side.

==================================================
59. ADMIN AUDIT LOG
==================================================

Record sensitive admin actions.

Examples:

API key changed
Provider added
Model activated
Model deactivated
Admin password changed
User disabled
Exam deleted

Never store actual API keys in audit logs.

==================================================
60. AI EXTRACTION PROMPTING
==================================================

Create a strong internal extraction prompt for the selected AI model.

The model must be instructed to:

- Preserve question order
- Extract exact question text
- Extract all options
- Identify correct answers from answer key
- Detect sections
- Detect question type
- Preserve image references
- Never invent missing answers
- Never invent missing options
- Flag uncertain extraction
- Return strict JSON
- Maintain original numbering
- Preserve mathematical notation where possible

If the source contains an answer key at the end, map answers correctly to the original question numbers.

Example:

Question 1 → correct option C

Question 2 → correct option A

Do not simply assume the answer key order if question numbering differs.

==================================================
61. MULTIPLE ANSWER SUPPORT
==================================================

If the source indicates multiple correct answers:

question_type = "multiple_choice"

correct_answer = array

Example:

["A","C","D"]

If only one answer:

question_type = "single_choice"

correct_answer = ["B"]

The scoring engine must understand both.

==================================================
62. SCORING ENGINE
==================================================

Implement configurable scoring.

Single-answer:

Correct:
+marks

Incorrect:
-negative_marks

Unanswered:
0

Multiple-answer:

By default:
All correct answers must match exactly to receive full marks.

Incorrect:
negative_marks

Unanswered:
0

Make scoring configurable at exam level.

Do not calculate results purely in the browser.

==================================================
63. EXAM INTEGRITY
==================================================

Implement reasonable protections:

- Fullscreen request
- Warning when leaving fullscreen where browser permits detection
- Prevent accidental navigation
- Auto-save
- Server-side timing
- Server-side submission
- Attempt locking

Do not claim that the website can completely prevent cheating.

==================================================
64. EXAM RESUME
==================================================

If an attempt is interrupted:

Allow the user to resume when the exam configuration permits it.

Restore:

Current question
Selected answers
Marked questions
Timer state
Current section

Expired attempts must automatically close.

==================================================
65. DATABASE CONSISTENCY
==================================================

Use transactions or safe multi-step operations where appropriate.

Creating an exam should not leave half-created records if a critical operation fails.

If extraction succeeds but database insertion fails:

Keep the processing job state and allow recovery/retry.

==================================================
66. RETRY SYSTEM
==================================================

For failed PDF processing:

Provide:

Retry Processing

Do not duplicate questions on retry.

Use processing job IDs and safe database handling.

==================================================
67. DUPLICATE EXAMS
==================================================

Allow a user to duplicate an existing exam.

Create a new exam record and associated questions.

Do not modify the original.

==================================================
68. DELETE CONFIRMATION
==================================================

For destructive actions:

Show confirmation modal.

Example:

“Delete this exam?”

“This will permanently remove the exam and its associated questions.”

Use appropriate cascading/deletion policies.

==================================================
69. FINAL QUALITY REQUIREMENT
==================================================

This must feel like a real product, not a coding demo.

Do not use:

Lorem ipsum
Fake statistics
Fake user reviews
Fake AI responses
Fake processing results
Broken buttons
Dead navigation
Placeholder functionality where real functionality is required

Every button must have a meaningful action or clearly be disabled until configured.

==================================================
70. ENVIRONMENT VARIABLES
==================================================

Create a proper environment variable structure.

Never hard-code:

Supabase URL
Supabase anon key
Service role key
AI API keys
Admin passwords
Provider secrets

Frontend may use only values that are safe for client-side use.

Server-only secrets must remain server-side.

Provide an example environment configuration file with placeholders only.

==================================================
71. SETUP / DEPLOYMENT
==================================================

Prepare the project so it can be deployed using a modern React hosting environment and Supabase.

Include:

- Database migrations/schema
- RLS policies
- Storage policies
- Edge/server functions
- Environment variable documentation
- Authentication configuration requirements
- Provider configuration documentation
- Admin initialisation process

Do not include real secrets.

==================================================
72. IMPORTANT FIGMA MAKE EXECUTION RULE
==================================================

Do NOT stop after creating the landing page.

Do NOT create only static screens.

Implement the entire application architecture described above.

Create reusable components.

Create all pages.

Create routing.

Create authentication architecture.

Create database integration architecture.

Create Supabase integration.

Create secure server-side AI provider architecture.

Create PDF processing workflow.

Create exam engine.

Create timer.

Create scoring.

Create results.

Create admin portal.

Create provider/model configuration.

Create error states.

Create loading states.

Create responsive states.

==================================================
73. NO SECOND PROMPT REQUIREMENT
==================================================

Treat this entire prompt as the complete product specification.

Do not wait for another prompt asking you to:

- Add the dashboard
- Add admin
- Add authentication
- Add PDF upload
- Add exam timer
- Add sectional timing
- Add results
- Add images
- Add AI configuration
- Add model selection
- Add API key management
- Add database tables
- Add security
- Add responsive design

Everything above must be implemented in the initial build.

If a technical decision is not explicitly specified, choose the most secure, maintainable and production-appropriate implementation.

==================================================
74. FINAL USER EXPERIENCE
==================================================

The intended flow must be:

LANDING PAGE
↓
GET STARTED
↓
SIGN UP / SIGN IN
↓
DASHBOARD
↓
CREATE EXAM
↓
UPLOAD PDF
↓
AI PROCESSING
↓
EXTRACTION RESULTS
↓
REVIEW QUESTIONS
↓
CONFIGURE EXAM
↓
CREATE EXAM
↓
EXAM INSTRUCTIONS
↓
START EXAM
↓
FULLSCREEN CBT EXPERIENCE
↓
ANSWER QUESTIONS
↓
SECTIONAL TIMING
↓
SUBMIT
↓
INSTANT RESULT
↓
DETAILED ANSWER REVIEW
↓
PERFORMANCE ANALYTICS

ADMIN FLOW:

/admin
↓
ADMIN LOGIN
↓
ADMIN DASHBOARD
↓
USERS / EXAMS / PROCESSING
↓
AI CONFIGURATION
↓
SELECT PROVIDER
↓
ENTER API KEY
↓
TEST CONNECTION
↓
FETCH AVAILABLE MODELS
↓
SELECT MODEL
↓
TEST MODEL
↓
SAVE & ACTIVATE
↓
ALL NEW PDF PROCESSING USES ACTIVE PROVIDER + MODEL

==================================================
75. MOST IMPORTANT PRINCIPLE
==================================================

ACCURACY AND PRESERVATION ARE MORE IMPORTANT THAN SPEED.

When processing a PDF:

Never silently lose:
- Questions
- Options
- Answers
- Sections
- Images
- Diagrams
- Tables
- Mathematical figures

If text extraction is uncertain, preserve the original visual source as a fallback.

The user must always be able to access the original question content.

Build the system so that AI assists the extraction process but does not become a single point of failure for displaying the original examination content.

==================================================
76. FINAL IMPLEMENTATION STANDARD
==================================================

Build Testivo as if it were going to be released publicly.

Prioritise:

1. Security
2. Data accuracy
3. PDF/question preservation
4. Exam correctness
5. Reliable timing
6. Database integrity
7. Excellent UX
8. Performance
9. Accessibility
10. Maintainability

The final result should look and behave like a polished professional examination platform.

Do not make it look like an AI-generated template.

The final brand experience should be:

testivo

“Upload. Prepare. Test.”