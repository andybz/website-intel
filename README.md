# website-intel
# AI Website Intelligence Platform
## Initial Development Brief & Build Instructions

### Working Status
**Product name:** TBD  
**Initial deployment:** `monitor.andybz.com`  
**Initial user:** Andy / private internal use  
**Initial supported platform:** WordPress  
**Primary frontend stack:** Svelte  
**Development philosophy:** Start simple, establish a strong architecture, then progressively add intelligence and monitoring capabilities.

---

### Implementation Progress (living log — keep updated as work completes)

**Milestone 1 — Connected Sites: ✅ Complete**
- SvelteKit + TypeScript + Tailwind CSS + PostgreSQL/Drizzle ORM foundation
- Private single-user authentication (argon2, sessions), protected dashboard
- Site CRUD, site detail pages (Overview/Issues/Activity/Traffic/WordPress tabs)
- Secure pairing protocol (`/api/connect`) and heartbeat endpoint
- WordPress connector plugin: pairing, heartbeat, WP/PHP/theme/plugin metadata
- Verified end-to-end against a real production WordPress site (andybz.com) via a Cloudflare tunnel

**Phase 1B — Error Monitoring: ✅ Complete**
- Event ingestion endpoint, message normalization/fingerprinting, deduped grouping into Issues
- Deterministic MVP severity scoring (README section 21 rules)
- Issues list + issue detail UI with progressive disclosure ("View Technical Details")
- Plugin captures real PHP errors/warnings/notices (`set_error_handler` + shutdown handler for fatals), with in-request dedup + cross-request throttling so it can't flood the site or the ingestion endpoint

**Phase 1C — Useful Monitoring: 🟡 Mostly complete**
- WordPress change tracking (plugin/theme/core updates, activations/deactivations) → new Activity tab, separate from the grouped Issues pipeline (these are discrete one-off facts, not recurring problems)
- Failed login monitoring (security event; deliberately never captures the attempted username, since it may actually be a mistyped password)
- Basic HTTP 404 tracking (grouped per-URL)
- ⚠️ **NOT built yet — do not forget:** basic bot vs. human traffic classification and the "Real Visitors / Bots %" dashboard stats described in sections 15 and 26. This needs a new pageview-aggregation data model (hourly/daily rollups per section 54), which is a meaningfully separate feature from the error/change event pipeline built so far. Revisit this before considering Phase 1C fully done.

**Phase 2 — Intelligence: 🚧 In progress**
- Issue auto-resolution (derived: an issue is shown as "Resolved" once ~30 minutes pass with no new occurrences, per section 29 — no new occurrence flips it back to "open" automatically)
- Email notifications for critical issues (severity ≥6), with alert-fatigue prevention (notifies once per "wave", resets on resolved→reoccur transition), sent via Resend
- Account management: Settings page (add user, change own password, reset another user's password, remove user), forgot-password/reset-password flow via email
- "What Happened" unified timeline on the Activity tab (merges Issues + Activity chronologically)
- AI issue summaries (OpenAI `gpt-4o-mini`): on-demand, cached "what happened / who's affected / likely cause / recommended action" explanation per issue, sends only sanitized fields (never raw metadata)
- Issue occurrence hourly charts (section 50): lightweight hourly rollup table (`issue_hourly_counts`) populated on every event ingestion, rendered as a dependency-free CSS bar chart on the issue detail page (last 48 hours, gap-filled with zero-count hours)
- Not yet built: refined Website Impact Score, event timelines beyond the unified Activity view, change correlation

**Not started:** Phase 3 (anomaly detection, Ask Your Website), Phase 4 (server-level monitoring), Phase 5 (SaaS/agency features).

**Deployment: ✅ Live** — self-hosted on the `abzdev` server (Ubuntu + Docker) at `https://monitor.andybz.com`, behind nginx + Let's Encrypt.
- `Dockerfile` (Node 24, `adapter-node`) + `docker-compose.prod.yml` (app + Postgres containers)
- Deploy flow: `git push abzdev main` → a post-receive hook on the server checks out the code, runs `docker compose up -d --build` (which also runs DB migrations on container start via `docker-entrypoint.sh`)
- Local dev is unaffected — still Docker Postgres + `npm run dev`, tested via a Cloudflare quick tunnel for real-WordPress-site testing

---

# 1. Product Vision

Build a standalone web application that monitors websites and explains their technical health in a clean, organized, non-intimidating interface.

The application should eventually combine:

- Website health monitoring
- WordPress monitoring
- PHP/application error logging
- HTTP error monitoring
- Security event monitoring
- Bot vs. human traffic analysis
- Website change tracking
- AI-powered issue explanations
- Issue severity and business-impact prioritization
- Smart notifications
- Historical event timelines
- Root-cause correlation
- Multi-site agency monitoring
- Conversational website analysis

The application should not feel like a traditional raw server-log viewer.

The primary goal is:

> **Turn complicated website/server information into actionable information a human can understand immediately.**

Possible positioning language:

> **Website Intelligence for Humans**

> **Know what's wrong before your customers do.**

> **Your website explained in plain English.**

These are positioning concepts only. Do not permanently brand the application with any of them yet.

---

# 2. Core Product Philosophy

The application should follow one major UX principle:

## Simple First. Technical When Needed.

The primary interface should prioritize:

- What happened?
- Is it important?
- Is the website currently healthy?
- Are visitors affected?
- Is there anything I need to do?
- What probably caused it?

Technical data should still exist, but should be progressively disclosed.

For example, the primary view may show:

**WooCommerce checkout errors**

Severity: **8.7 / 10**

Occurred 42 times in the last hour.

Visitors may currently be unable to complete checkout.

Then a developer can click:

**View Technical Details**

to access:

- stack trace
- file
- line
- error code
- request path
- occurrence timestamps
- PHP version
- WordPress version
- affected plugin
- related events

Avoid designing the primary interface like Datadog, New Relic, Sentry, phpMyAdmin, WHM, or a raw logfile browser.

---

# 3. Initial Scope

The first version is for **private use only**.

Do not initially build:

- public registration
- customer accounts
- subscription billing
- Stripe integration
- SaaS plans
- team management
- public onboarding
- organization support
- white labeling
- client reports
- enterprise permissions
- multi-tenant billing logic

Architect the application so these could be added later, but do not build them now.

Version 1 should essentially be:

> **Andy's private website monitoring command center.**

---

# 4. Deployment

The production application should ultimately run at:

`https://monitor.andybz.com`

Treat the app as a standalone web application completely separate from any monitored WordPress website.

The monitoring platform should have its own:

- application
- API
- database
- authentication
- frontend
- background processes

WordPress websites should connect to this central application.

---

# 5. Recommended Application Stack

Use a modern JavaScript/TypeScript stack.

## Frontend / Application

Preferred:

- **SvelteKit**
- **TypeScript**
- **Tailwind CSS**
- Node.js runtime

SvelteKit should ideally handle both:

- frontend UI
- internal application/API routes

unless architectural requirements later justify extracting the backend.

Avoid introducing unnecessary services during the MVP.

## UI

Use Tailwind CSS throughout the application.

Reusable UI components should be created for things such as:

- cards
- badges
- buttons
- modals
- dropdowns
- tables
- tabs
- health indicators
- status pills
- event cards
- charts
- empty states
- confirmation dialogs
- form fields

A component library such as shadcn-style Svelte components may be used if useful, but avoid allowing a component library to dictate the visual identity.

The interface should feel custom and intentional.

## Database

Use a proper persistent relational database.

Preferred:

**PostgreSQL**

Use an ORM such as:

**Drizzle ORM**

or another lightweight TypeScript-first ORM if there is a strong technical reason.

Prefer Drizzle over a very large abstraction layer.

## Authentication

Because this is initially a private single-user application, authentication can be simple but secure.

Implement:

- email/username
- password
- secure session cookie
- password hashing
- logout
- protected application routes

Do not build OAuth/social login initially.

---

# 6. Repository Architecture

Keep the project organized from the beginning.

Suggested conceptual structure:

```text
src/
  lib/
    components/
    server/
      auth/
      db/
      monitoring/
      sites/
      events/
      health/
    types/
    utils/

  routes/
    login/
    dashboard/
    sites/
      [siteId]/
    settings/
    api/

db/
  schema/
  migrations/

static/

scripts/
```

Do not create unnecessary architectural complexity.

Prefer clear modules over premature microservices.

---

# 7. WordPress Connection Architecture

This is one of the most important architectural decisions.

## Do NOT use stored WordPress administrator passwords as the primary integration method.

Although connecting with login credentials sounds convenient, storing administrator credentials creates unnecessary security risk.

Instead, build a small dedicated WordPress monitoring plugin.

Working internal name:

`AndyBZ Monitor Connector`

This name is temporary.

The plugin should securely connect a WordPress website to the monitoring platform.

---

# 8. Recommended Site Connection Flow

The dashboard should include:

**Add Website**

The user enters:

- Website name
- Website URL

Example:

```text
Name:
Pelican Wire

URL:
https://pelicanwire.com
```

After clicking:

**Create Connection**

the monitoring application should generate:

- unique site ID
- secure pairing token
- API credentials/secret

The UI should then display simple setup instructions.

Example:

```text
Connect Pelican Wire

1. Install the Monitor Connector plugin.
2. Open Settings → Monitor Connector.
3. Paste this connection key:

ABZ-XXXXXXXXXXXXXXXX

4. Click Connect.
```

The key should preferably be a temporary pairing credential rather than the permanent API secret.

---

# 9. Secure Pairing Process

Preferred architecture:

1. Monitoring app generates a short-lived pairing token.
2. WordPress plugin receives the token.
3. WordPress plugin sends an HTTPS registration request to:

```text
https://monitor.andybz.com/api/connect
```

4. Server validates the pairing token.
5. Server creates permanent credentials for the site.
6. Plugin stores the credential securely in WordPress options.
7. Pairing token is invalidated.
8. Site displays:

```text
Connected ✓
```

The permanent API secret should never be displayed unnecessarily after pairing.

The integration should use outbound requests from the WordPress website to the monitoring server wherever practical.

This avoids exposing unnecessary administrative endpoints.

---

# 10. Site Authentication

Each monitored site should have:

- internal database ID
- public site UUID
- authentication secret/token
- status
- connection timestamp
- last heartbeat timestamp

Every request from a WordPress connector should authenticate the site.

Eventually consider:

- signed requests
- timestamp validation
- nonce protection
- request signatures/HMAC

For the MVP, implement a secure bearer-style API credential if that substantially reduces complexity, but structure the authentication layer so HMAC signing can be added.

All communication must occur over HTTPS.

---

# 11. Initial Site Data

Once connected, the WordPress plugin should send basic site metadata.

Capture:

- WordPress URL
- WordPress version
- PHP version
- server software if detectable
- active theme
- theme version
- installed plugins
- plugin versions
- active/inactive status
- multisite status
- environment information that is safe and useful

Do NOT transmit:

- database passwords
- WordPress passwords
- secret keys
- authentication salts
- payment credentials
- API secrets belonging to other services

---

# 12. Heartbeat System

Connected websites should periodically report that they are alive.

For example:

```text
POST /api/sites/{siteId}/heartbeat
```

Heartbeat data could include:

- timestamp
- WordPress version
- PHP version
- plugin version
- basic health indicators

The dashboard should track:

**Last Seen**

Example:

```text
Connected
Last seen 2 minutes ago
```

If heartbeats stop beyond a defined threshold:

```text
Connection Lost
```

This is not initially a replacement for independent uptime monitoring because a broken WordPress cron process could prevent the heartbeat.

Independent uptime monitoring can be introduced later.

---

# 13. Initial Dashboard

The homepage should be extremely clean.

Suggested layout:

```text
Website Monitor

12 Websites

10 Healthy
1 Needs Attention
1 Critical
```

Then site cards or clean rows.

Example:

```text
Pelican Wire
pelicanwire.com

Health: 93
🟢 Healthy

Errors Today: 14
Critical: 0
Bots: 31%

Last Seen: 1 min ago
```

Another:

```text
Client Website

Health: 68
🔴 Critical

Checkout errors detected
47 occurrences

Last Seen: 30 sec ago
```

Clicking a website opens its detail dashboard.

---

# 14. Website Detail Dashboard

Suggested navigation:

```text
Overview
Issues
Activity
Traffic
WordPress
```

Do not implement every section completely in Phase 1.

The architecture and UI navigation can exist incrementally.

---

# 15. Website Overview

The overview should eventually contain:

## Website Health

Large score:

```text
96
Healthy
```

With a brief explanation:

```text
Your website is operating normally.
No critical issues detected.
```

## Today's Snapshot

Possible cards:

- Real Visitors
- Bots
- Issues
- Critical Issues

Example:

```text
Real Visitors
1,842

Bots
624

Issues
17

Critical
0
```

## Things Worth Knowing

Display event/issue cards sorted by importance.

Example:

```text
Plugin generating repeated PHP warnings

Impact: 3.2 / 10
438 occurrences today

Your website is still operating normally.

View Issue
```

---

# 16. Event System

Build the underlying data model around generic **events**.

An event is something detected on a monitored website.

Possible event categories:

```text
error
security
traffic
wordpress
change
performance
uptime
system
```

Possible event types:

```text
php_fatal
php_warning
http_404
http_500
failed_login
successful_login
plugin_updated
plugin_activated
plugin_deactivated
theme_updated
wordpress_updated
heartbeat_lost
bot_spike
```

This should be extensible.

Avoid creating a separate database architecture for every future event type.

---

# 17. Error Monitoring — MVP

The first meaningful monitoring feature should be WordPress/PHP error collection.

The connector should capture useful WordPress/PHP errors where safely possible.

Examples:

- PHP fatal errors
- PHP warnings
- uncaught exceptions
- WordPress errors where observable

Store fields such as:

```text
site_id
event_type
severity
message
file
line
stack_trace
request_url
first_seen
last_seen
occurrence_count
metadata
```

Be careful not to transmit sensitive request data.

Never store:

- passwords
- authorization headers
- payment card data
- session cookies
- WordPress auth cookies

Sanitize aggressively.

---

# 18. Error Grouping

A major product requirement is avoiding duplicate noise.

Do NOT store/display 10,000 identical errors as 10,000 independent issues.

Generate an issue fingerprint using data such as:

```text
event_type
error_class
normalized_message
file
line
```

Identical or sufficiently similar events should increment:

```text
occurrence_count
```

and update:

```text
last_seen
```

Example:

```text
PHP Warning

Undefined array key "settings"

Occurrences: 438
First Seen: 8:42 AM
Last Seen: 1:07 PM
```

This grouping system is foundational.

---

# 19. Issues vs. Events

Use two conceptual layers.

## Event

An individual occurrence.

## Issue

A grouped problem representing one or many events.

Example:

438 PHP warning events

become:

```text
1 Issue
438 Occurrences
```

The UI should primarily show Issues.

Detailed event history can exist within the Issue.

---

# 20. Severity / Website Impact Score

Long term, create a proprietary:

# Website Impact Score

Range:

```text
0.0 – 10.0
```

This is more meaningful than simply labeling technical errors as Warning/Critical.

Eventually calculate impact using signals such as:

- technical severity
- occurrence frequency
- number of affected visitors
- business function affected
- security risk
- persistence
- anomaly compared with historical baseline
- whether issue is increasing
- whether website functionality is impaired

Examples:

```text
10,000 favicon 404 requests
Impact: 1.4
```

```text
PHP warning occurring 3,000 times
Impact: 3.9
```

```text
Checkout fatal error occurring 12 times
Impact: 8.6
```

```text
Homepage returning HTTP 500
Impact: 10.0
```

---

# 21. MVP Severity Logic

Do NOT initially depend on AI to calculate severity.

Start with deterministic rules.

For example:

```text
PHP Notice:
Base score 1

PHP Warning:
Base score 3

PHP Fatal:
Base score 7

HTTP 404:
Base score 1

HTTP 500:
Base score 6

Failed Login:
Base score 2
```

Then increase score based on:

- occurrence count
- occurrence velocity
- repetition over time

Later this can evolve into the more sophisticated Website Impact Score.

---

# 22. AI Architecture

Do not send every raw event directly to an LLM.

That would be:

- expensive
- slow
- noisy
- unnecessary

The monitoring system itself should:

1. collect events
2. normalize them
3. group them
4. calculate statistics
5. determine deterministic severity
6. store structured data

Then AI should analyze important grouped issues.

AI responsibilities can eventually include:

- plain-English explanation
- probable cause
- recommended action
- business impact explanation
- root-cause correlation
- anomaly explanation

---

# 23. AI Issue Explanation

Eventually an issue could display:

```text
WooCommerce Checkout Error

Impact: 8.7 / 10

42 occurrences
First detected 1:42 PM
Last detected 2:06 PM
```

Then:

## What Happened

```text
WooCommerce is repeatedly encountering a PHP error
while processing checkout requests.
```

## Who Is Affected

```text
Customers may currently be unable to complete purchases.
```

## Likely Cause

```text
The error appears to originate from the Authorize.net
payment extension.
```

## Recommended Action

```text
Review recent plugin updates and test checkout.
```

AI should enhance the structured data, not replace it.

---

# 24. AI Timeline — Major Future Differentiator

One of the strongest long-term features should be:

# What Happened?

The application should track important website changes alongside errors.

Example:

```text
11:42 AM
WooCommerce updated
9.8.1 → 9.8.2

11:47 AM
New PHP error detected

11:49 AM
Checkout failures begin

11:53 AM
27 visitors affected
```

Then AI could determine:

```text
Likely Cause Identified

WooCommerce Update

Confidence: 91%

Checkout failures began five minutes after WooCommerce
was updated. This error had not appeared during the
previous 30 days.
```

This feature should NOT be built in the first development phase.

However, structure event storage so website changes can later coexist chronologically with errors.

---

# 25. WordPress Change Tracking

Eventually monitor:

- WordPress core updates
- plugin updates
- plugin activations
- plugin deactivations
- plugin installations
- plugin deletions
- theme updates
- theme activation
- PHP version changes

Later expand outside WordPress:

- Git deployments
- Git commits
- server configuration changes
- DNS changes
- SSL changes
- file changes
- hosting changes

---

# 26. Bot vs. Human Traffic

Another core product feature should eventually provide an easily understandable traffic breakdown.

Example:

```text
Traffic Today

68% Humans
19% Known Bots
8% Search Crawlers
5% Suspicious Automation
```

Possible classifications:

```text
human
search_crawler
known_bot
seo_bot
ai_crawler
monitoring_service
scraper
malicious_bot
unknown_automation
```

Do not attempt perfect bot classification in the initial version.

Start with basic identification using:

- user agent
- known crawler patterns
- request behavior where available

Later enhance classification.

---

# 27. Security Monitoring

Long-term security event types should include:

- failed logins
- unusual successful logins
- brute-force attempts
- XML-RPC attacks
- suspicious URL probing
- plugin vulnerability activity
- suspicious REST requests
- file modification alerts
- unusual admin activity

Initially start with something straightforward such as:

**WordPress failed login monitoring.**

Do not try to replace Wordfence in Version 1.

The platform should interpret security activity rather than initially becoming a full WAF/malware scanner.

---

# 28. Notifications

Long-term notifications should support:

- email
- browser/app notifications
- potentially Slack
- potentially SMS/push

Initial notification support can be email only.

Notifications should be triggered by meaningful issues rather than every event.

Example:

```text
🔴 Checkout Problem Detected

pelicanwire.com

41 checkout requests have failed during the past 12 minutes.

Impact: 9/10

Customers may currently be unable to complete purchases.

View Issue
```

---

# 29. Alert Fatigue Prevention

This is extremely important.

Do not send:

```text
Fatal error
Fatal error
Fatal error
Fatal error
Fatal error
```

Instead send:

```text
Fatal error detected

Occurred 742 times during the past 15 minutes.
Frequency is increasing.
```

Later support lifecycle notifications:

```text
Detected
Increasing
Decreasing
Resolved
```

Example:

```text
Resolved

No new occurrences have been detected for 30 minutes.
```

---

# 30. Anomaly Detection — Future

Eventually the application should learn what is normal for each website.

Examples:

```text
Normal daily visitors:
~1,800
```

```text
Normal bot requests:
~600/day
```

```text
Normal PHP warnings:
200–400/day
```

Then detect deviations.

Example:

```text
Bot traffic is currently 6.4× higher than normal.
```

Or:

```text
Checkout completions have fallen 87% while checkout
traffic remains normal.
```

This turns the application from a logger into a website behavior intelligence platform.

Do not implement this in Phase 1.

---

# 31. Ask Your Website — Future

A major future feature should be a conversational AI interface.

At the top of a website dashboard:

```text
Ask about this website...
```

Example questions:

```text
Why was the website slow yesterday?
```

```text
Did the plugin update cause any problems?
```

```text
Has this error happened before?
```

```text
Are customers having trouble checking out?
```

```text
Why did the website go down?
```

```text
What is hammering the server?
```

```text
Which plugin creates the most errors?
```

```text
Should I care about these login attempts?
```

```text
What changed this week?
```

The AI should query structured monitoring data before answering.

Never allow it to hallucinate website state.

---

# 32. User Modes — Future

Eventually support multiple interface modes.

## Owner Mode

Extremely simple.

Example:

```text
Everything looks good.

No action needed.
```

Focus on:

- business impact
- visitor impact
- simple recommendations

Avoid:

- stack traces
- PHP jargon
- server terminology

## Developer Mode

Expose:

- stack traces
- PHP errors
- request information
- plugin references
- HTTP status codes
- server metrics
- database information
- cron information
- API failures

## Agency Mode

Central command center.

Example:

```text
28 Websites

23 Healthy
4 Need Attention
1 Critical
```

The goal should feel like:

> **Get every website green.**

---

# 33. Agency Dashboard — Future

Example:

```text
MY WEBSITES

Paradise Wealth        🟢 98
Elite DNA Careers      🟢 94
Pelican Wire           🔴 71
District Sushi         🟢 97
Client XYZ             🟡 84
```

Sort critical sites to the top.

Potential filtering:

```text
All
Critical
Needs Attention
Healthy
Offline
```

This will eventually be a major selling point for agencies and freelancers.

---

# 34. Client Reports — Future

Potential monthly client report:

```text
Website Health Report
August 2026

99.97% uptime

173 suspicious requests detected
14 technical issues identified
3 critical issues resolved
42 WordPress updates monitored
```

Reports should demonstrate the value of maintenance services without overwhelming clients with technical details.

Do not implement client reporting initially.

---

# 35. Event Pipeline — Long-Term Architecture

Conceptually:

```text
                Website Connector
                       │
                       ▼
                Event Ingestion
                       │
                       ▼
              Event Normalization
                       │
                       ▼
                Event Grouping
                       │
                       ▼
               Severity Engine
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
         Database          AI Intelligence
             │                   │
             └─────────┬─────────┘
                       ▼
                    Issues
                       │
                       ▼
            Dashboard / Alerts
```

Future data sources could include:

```text
WordPress Connector
Server Agent
Apache Logs
NGINX Logs
PHP Logs
Cloudflare
GitHub
cPanel / WHM
Laravel
Node.js
```

All should eventually feed the same normalized event system.

---

# 36. Server-Level Monitoring — Important Limitation

The WordPress connector alone does **not** provide complete server-level observability.

Do not pretend that WordPress plugin monitoring is equivalent to monitoring:

```text
Apache
NGINX
PHP-FPM
system logs
CPU
RAM
disk
database
network
server processes
```

Long term, introduce a lightweight server agent.

Potential server installation:

```bash
curl ... | install
```

or a controlled Node/Go/Python service.

That server agent could monitor:

- access logs
- error logs
- CPU
- RAM
- disk
- PHP-FPM
- MySQL
- server load
- services
- server-level errors

This is a later phase.

---

# 37. WordPress MVP

The initial product should focus on getting this workflow working extremely well:

```text
Login
↓
Dashboard
↓
Add Website
↓
Generate Connection Key
↓
Install WordPress Connector
↓
Connect Website
↓
Receive Heartbeat
↓
Display WordPress Information
↓
Receive Basic Errors
↓
Group Errors Into Issues
↓
Assign Severity
↓
Display Clean Website Health Dashboard
```

If this works reliably, the platform foundation is successful.

---

# 38. MVP Feature Checklist

## Application

- [ ] SvelteKit project
- [ ] TypeScript
- [ ] Tailwind CSS
- [ ] PostgreSQL
- [ ] ORM/migrations
- [ ] environment configuration
- [ ] authentication
- [ ] protected dashboard
- [ ] responsive layout

## Site Management

- [ ] website list
- [ ] add website
- [ ] edit website
- [ ] remove/disconnect website
- [ ] site detail page
- [ ] connection status
- [ ] last heartbeat

## Connector

- [ ] standalone WordPress plugin
- [ ] pairing token UI
- [ ] secure registration
- [ ] site authentication
- [ ] heartbeat
- [ ] site metadata transmission
- [ ] plugin connection status

## Monitoring

- [ ] event ingestion endpoint
- [ ] error event support
- [ ] event sanitization
- [ ] event normalization
- [ ] event grouping
- [ ] issue occurrence count
- [ ] first seen
- [ ] last seen
- [ ] deterministic severity score

## UI

- [ ] dashboard summary
- [ ] site cards/list
- [ ] health indicator
- [ ] website overview
- [ ] recent issues
- [ ] issue detail page
- [ ] technical detail disclosure

---

# 39. Phase 1A — Build Foundation First

Do not immediately build monitoring intelligence.

First complete:

1. SvelteKit application
2. Tailwind UI foundation
3. PostgreSQL database
4. authentication
5. dashboard shell
6. site CRUD
7. site detail page
8. WordPress connector plugin
9. secure pairing
10. heartbeat

Acceptance test:

```text
Andy can log into monitor.andybz.com,
click Add Website,
connect a WordPress installation,
and see that website appear online
with current WordPress/PHP/plugin information.
```

Nothing more is necessary to consider Phase 1A successful.

---

# 40. Phase 1B — Error Monitoring

After the connection architecture is stable:

Build:

1. event ingestion
2. PHP/WordPress error collection
3. normalization
4. fingerprints
5. issue grouping
6. occurrence counting
7. first/last occurrence
8. severity rules
9. issue dashboard
10. issue detail view

Acceptance test:

```text
A test WordPress site generates the same PHP warning
100 times.

The dashboard displays:

1 issue
100 occurrences

rather than 100 separate errors.
```

---

# 41. Phase 1C — Useful Monitoring

Add:

- failed login events
- basic HTTP error events where practical
- plugin update events
- plugin activation/deactivation events
- WordPress update events
- basic bot classification
- simple dashboard statistics

At this point the application should begin feeling like a real monitoring product.

---

# 42. Phase 2 — Intelligence

Once data collection is reliable:

Add:

- AI issue summaries
- probable causes
- recommended actions
- refined Website Impact Score
- email notifications
- issue resolution detection
- issue activity charts
- event timelines
- change correlation

---

# 43. Phase 3 — Advanced Intelligence

Add:

- anomaly detection
- historical baselines
- AI Timeline correlation
- Ask Your Website
- traffic intelligence
- security behavior analysis
- advanced root-cause detection

---

# 44. Phase 4 — Server Monitoring

Introduce server-level agent capabilities.

Monitor:

- Apache/NGINX
- PHP-FPM
- MySQL
- CPU
- memory
- disk
- processes
- services
- operating system logs

Correlate server activity with WordPress/application activity.

Example:

```text
Checkout failures increased because PHP-FPM workers
were exhausted during a bot traffic spike.
```

---

# 45. Phase 5 — SaaS / Agency Product

Only after the internal product proves useful should development expand toward:

- organizations
- teams
- customers
- billing
- subscriptions
- agency accounts
- white labeling
- client portals
- client reports
- Slack integration
- external APIs

Possible future pricing structure:

```text
Solo
5 websites

Freelancer
25 websites

Agency
100 websites

Server
Unlimited sites on one server
```

Do not build billing architecture now.

---

# 46. AI Remediation — Future and High Risk

Eventually the application could provide:

```text
Generate Suggested Fix
```

Then potentially:

```text
Create Patch
```

Potentially much later:

```text
Apply Fix
```

Do NOT allow autonomous AI production modifications in the MVP.

AI should initially:

- observe
- explain
- prioritize
- recommend

It should not automatically edit production websites.

Any future automated remediation must include:

- backups
- rollback
- explicit permissions
- audit trail
- confidence threshold
- validation
- change preview

---

# 47. UI / Design Direction

Design quality is a major product priority.

The application should feel:

- modern
- premium
- extremely clean
- calm
- organized
- easy to scan
- spacious
- developer-friendly without looking developer-only

Avoid:

- giant dense tables
- excessive borders
- information overload
- unnecessary gradients
- clutter
- excessive dashboard widgets
- visual noise
- red everywhere
- tiny technical typography

---

# 48. Color Philosophy

Use color intentionally.

Conceptually:

```text
Green
Healthy / resolved / normal

Yellow
Something worth knowing

Orange
Needs attention

Red
Critical / immediate

Neutral gray
Informational / normal data
```

Red should be rare.

If everything is red, red becomes meaningless.

A critical issue should visually stand out immediately.

---

# 49. Progressive Disclosure

Primary card:

```text
Checkout Errors

Impact 8.7
42 occurrences

Customers may be unable to complete checkout.
```

Secondary:

```text
View Details
```

Then:

```text
Affected URL
Plugin
PHP error
File
Line
Stack trace
Request metadata
Occurrence history
```

Never make users consume technical information before understanding what the problem means.

---

# 50. Charts

Use charts only when they communicate useful information.

Good examples:

- issue frequency over time
- human vs bot traffic
- website health history
- error trends
- response-time trends

Avoid adding charts merely because it is a dashboard.

---

# 51. Mobile Responsiveness

The dashboard should work well on phones.

This is particularly important because one intended use case is checking websites during an emergency while away from a laptop.

Critical actions and information must be easily accessible from mobile.

Example:

```text
Pelican Wire
🔴 Critical

Checkout failing
Impact 9.2

View Issue
```

Avoid desktop-only layouts.

---

# 52. Security Requirements

This application itself will contain highly sensitive operational information.

Treat security as a core requirement.

Implement:

- HTTPS only
- secure sessions
- password hashing
- CSRF protection where applicable
- server-side authorization
- protected API endpoints
- API key hashing where practical
- request validation
- input sanitization
- rate limiting
- secure environment variables
- no secrets in Git
- safe log handling

Never trust incoming site data.

Validate all API payloads.

---

# 53. Sensitive Data Redaction

The monitoring platform should aggressively avoid collecting secrets.

Potential strings to redact:

```text
password
passwd
authorization
cookie
set-cookie
token
secret
api_key
apikey
credit_card
card_number
cvv
```

Request body capture should generally be disabled unless explicitly needed later.

Avoid storing complete query strings if they may contain sensitive information.

---

# 54. Data Retention

The database may eventually become extremely large.

Design with eventual retention policies in mind.

Possible future strategy:

```text
Raw events:
30 days

Grouped issues:
indefinite

Hourly aggregates:
1 year

Daily aggregates:
indefinite
```

Do not implement advanced retention infrastructure initially, but avoid architecture that requires every raw event forever.

---

# 55. Competitive Positioning

Do not attempt to directly replace:

- Sentry
- New Relic
- Better Stack
- Datadog
- Wordfence
- Patchstack
- WP Umbrella
- ManageWP

Instead, focus on the gap between them.

Traditional observability platforms answer:

> What telemetry exists?

Security products answer:

> What threats exist?

WordPress management products answer:

> What maintenance tasks exist?

This product should answer:

> **What is happening to my website, how much does it matter, what caused it, and what should I do?**

---

# 56. Primary Differentiators

The product's eventual differentiation should revolve around:

## 1. Website Intelligence for Humans

Translate technical information into understandable website health information.

## 2. Website Impact Score

Prioritize issues based on actual website/business impact rather than technical terminology alone.

## 3. What Happened Timeline

Correlate website changes with problems.

## 4. Ask Your Website

Conversational analysis grounded in real monitoring data.

## 5. Progressive Disclosure

Simple interface for owners with deep technical details available for developers.

## 6. Website Behavior Intelligence

Learn normal site behavior and detect meaningful anomalies.

## 7. Agency Command Center

Quickly understand which websites need attention without manually checking every client site.

---

# 57. Development North Star

Every feature should ultimately help answer one or more of these questions:

```text
Is my website working?

Is something wrong?

How serious is it?

Are visitors affected?

Is this normal?

What happened?

What changed?

What caused it?

Has this happened before?

Is it getting worse?

Is it resolved?

What should I do?
```

If a proposed feature does not help answer one of these questions or materially support the system that answers them, question whether it belongs in the product.

---

# 58. Important Development Rule

### Do not overbuild Version 1.

This project has the potential to become a large monitoring platform.

Resist that temptation initially.

The immediate goal is NOT:

> Build an AI replacement for Datadog + Wordfence + Sentry + ManageWP.

The immediate goal is:

> Build a beautiful private dashboard that can securely connect to several WordPress sites and begin collecting useful structured health information.

Get that foundation working exceptionally well.

Then build intelligence on top of real data.

---

# 59. First Development Milestone

Begin implementation with this exact milestone:

## Milestone 1 — Connected Sites

Build enough functionality that:

1. The application runs locally.
2. Authentication works.
3. The main dashboard exists.
4. A website can be added.
5. A secure pairing key is generated.
6. The WordPress connector plugin can be installed.
7. The plugin can connect using the pairing key.
8. The monitoring application recognizes the connection.
9. The WordPress site sends a heartbeat.
10. The application displays:
   - WordPress version
   - PHP version
   - active theme
   - installed plugins
   - plugin versions
   - connection status
   - last seen time
11. Multiple websites can be connected.
12. The dashboard looks polished on desktop and mobile.

Do not begin AI integration before this milestone works reliably.

---

# 60. Codex Implementation Workflow

Work incrementally.

For each milestone:

1. Inspect the existing repository before making architectural assumptions.
2. Create or update a concise implementation plan.
3. Implement one logical system at a time.
4. Keep database migrations explicit.
5. Maintain strong TypeScript types.
6. Validate API payloads.
7. Handle errors gracefully.
8. Avoid placeholder architecture that cannot survive production.
9. Test the primary user flow after meaningful changes.
10. Keep README/development documentation current.
11. Explain major architectural decisions.
12. Identify security implications before implementing sensitive functionality.

Do not silently introduce major dependencies or architectural changes without documenting why they are needed.

---

# 61. Immediate Task

Start with **Milestone 1 — Connected Sites**.

Before writing significant implementation code:

1. Inspect the repository/environment.
2. Determine whether a SvelteKit project already exists.
3. Establish the SvelteKit + TypeScript + Tailwind architecture.
4. Configure database access.
5. Define the initial database schema.
6. Establish authentication.
7. Build the dashboard shell.
8. Build site CRUD.
9. Define the secure WordPress pairing protocol.
10. Create the initial WordPress connector plugin.

Prioritize maintainability and clean architecture, but keep the implementation straightforward.

The first visible product experience should be:

```text
monitor.andybz.com

        Website Monitor

12 Websites

🟢 10 Healthy
🟡 1 Needs Attention
🔴 1 Critical

────────────────────────────

Pelican Wire
pelicanwire.com

🟢 Connected
Last seen 34 seconds ago

WordPress 6.x
PHP 8.x

View Website →
```

This is the foundation upon which all future monitoring, AI, security, traffic intelligence, anomaly detection and server observability will be built.
