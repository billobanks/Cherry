# Cherry database schema — ER diagram

Scope: the 21 tables from the normalized schema refactor
(`20260822000000_normalized_schema_refactor.sql`). Pregnancy-mode tables
(`pregnancies`, `pregnancy_*`, `contraction_logs`, `delivery_records`),
`safety_rules`, `rate_limit_hits`, `account_deletion_log`, and
`stripe_webhook_events` predate this refactor and are unchanged — they're
omitted below to keep the diagram readable. Every table not explicitly
marked otherwise has `id uuid primary key default gen_random_uuid()`,
`created_at timestamptz default now()`, and RLS enabled with a
`user_id = auth.uid()` (or ownership-join) policy.

## Diagram

```mermaid
erDiagram
    auth_users ||--|| profiles : "id"
    profiles ||--o| user_preferences : "user_id"
    profiles ||--o{ user_goals : "user_id"
    profiles ||--o{ admin_users : "user_id (self or granted)"
    profiles ||--o{ menstrual_cycles : "user_id"
    profiles ||--o{ daily_logs : "user_id"
    profiles ||--o{ symptom_definitions : "(catalog, not user-owned)"
    profiles ||--o{ cycle_predictions : "user_id"
    profiles ||--o{ personalized_insights : "user_id"
    profiles ||--o{ user_pattern_insights : "user_id"
    profiles ||--o| ai_conversations : "user_id"
    profiles ||--o| subscriptions : "user_id"
    profiles ||--o{ subscription_events : "user_id"
    profiles ||--o{ notification_preferences : "user_id"

    menstrual_cycles ||--o{ period_logs : "cycle_id"

    daily_logs ||--o{ mood_logs : "daily_log_id"
    daily_logs ||--o| sleep_logs : "daily_log_id"
    daily_logs ||--o| energy_logs : "daily_log_id"
    daily_logs ||--o{ symptom_logs : "daily_log_id"
    symptom_definitions ||--o{ symptom_logs : "symptom_key"

    ai_conversations ||--o{ ai_messages : "conversation_id"

    content_categories ||--o{ content_articles : "category_id"

    admin_users }o--o{ content_articles : "moderates (no FK)"
    admin_users }o--o{ pregnancy_week_content : "moderates (no FK, pre-existing table)"

    profiles {
        uuid id PK "= auth.users.id"
        text display_name
        text primary_focus
        date last_period_start_date
        int avg_cycle_length_days
        int avg_period_length_days
        text cycle_regularity
        timestamptz onboarding_completed_at
        text stripe_customer_id
    }

    user_preferences {
        uuid user_id PK_FK
        text dietary_preference
        text[] food_allergies
        text[] foods_to_avoid
        text[] workout_preferences
        bool fertility_tracking_enabled
        bool personalization_enabled
    }

    user_goals {
        uuid id PK
        uuid user_id FK
        text goal_key
    }

    admin_users {
        uuid user_id PK_FK
        text role "admin | moderator | support"
        uuid granted_by FK "-> auth.users.id, nullable"
    }

    menstrual_cycles {
        uuid id PK
        uuid user_id FK
        date start_date
        date end_date
        int cycle_length_days
        int period_length_days
        text source
    }

    period_logs {
        uuid id PK
        uuid user_id FK
        uuid cycle_id FK
        date log_date
        text flow_intensity
    }

    daily_logs {
        uuid id PK
        uuid user_id FK
        date checkin_date
        text flow
        int pain_severity
        bool intercourse
        text notes
    }

    mood_logs {
        uuid id PK
        uuid daily_log_id FK
        uuid user_id FK
        text mood_key
    }

    sleep_logs {
        uuid id PK
        uuid daily_log_id UK_FK
        uuid user_id FK
        int sleep_quality
    }

    energy_logs {
        uuid id PK
        uuid daily_log_id UK_FK
        uuid user_id FK
        int energy_level
    }

    symptom_definitions {
        text symptom_key PK
        text label
        text category
    }

    symptom_logs {
        uuid id PK
        uuid daily_log_id FK
        uuid user_id FK
        text symptom_key FK
    }

    cycle_predictions {
        uuid id PK
        uuid user_id FK
        date predicted_period_start
        text confidence "high | moderate | low"
        text current_phase
        int current_cycle_day
        timestamptz computed_at
    }

    personalized_insights {
        uuid id PK
        uuid user_id FK
        date insight_date
        text cycle_phase
        text headline
        jsonb sections
    }

    user_pattern_insights {
        uuid id PK
        uuid user_id FK
        text pattern_type
        text subject_key
        text sentence
        int occurrences
        int eligible_cycles
        timestamptz computed_at
    }

    content_categories {
        uuid id PK
        text key UK
        text label
        int sort_order
    }

    content_articles {
        uuid id PK
        uuid category_id FK
        text slug UK
        text title
        text body
        text status "draft|in_review|published|archived"
        text medical_reviewer
        date date_reviewed
        timestamptz published_at
    }

    notification_preferences {
        uuid id PK
        uuid user_id FK
        text channel
        text category
        bool enabled
    }

    subscriptions {
        uuid id PK
        uuid user_id UK_FK
        text plan
        text status
        timestamptz current_period_end
        bool cancel_at_period_end
    }

    subscription_events {
        uuid id PK
        uuid user_id FK
        uuid subscription_id FK
        text event_type
        text stripe_event_id
        jsonb payload
    }

    ai_conversations {
        uuid id PK
        uuid user_id UK_FK
    }

    ai_messages {
        uuid id PK
        uuid conversation_id FK
        text role
        text content
    }
```

## Design notes

- **`profiles` is the anchor.** Its primary key is also its foreign key
  into `auth.users` (Supabase's own auth schema, not shown) — a 1:1
  extension row, not a separate signup flow.
- **`user_preferences` and `subscriptions` are 1:1 with a user** (`user_id`
  is both the primary key and the only foreign key), everything else that
  hangs off a user is 1:many.
- **`daily_logs` is the check-in "header" row**; `mood_logs`/`symptom_logs`
  are 1:many off it (a day can have several moods or symptoms —
  `mood_logs` also carries `unique(daily_log_id, mood_key)` so the same
  mood can't be logged twice for one day), while `sleep_logs`/`energy_logs`
  are 1:1 (one reading per day) via a `unique` constraint on
  `daily_log_id`.
- **`symptom_definitions` is a catalog table**, not user-owned — it's the
  admin-managed list of valid `symptom_key` values that `symptom_logs`
  references, readable by any authenticated user but writable only by
  admins.
- **`admin_users` is deliberately not a boolean on `profiles`.** Role
  (`admin` / `moderator` / `support`) lives on its own row so grant/revoke
  is auditable (`granted_by`) and the RLS policy that manages the table can
  require `role = 'admin'` specifically, rather than "any admin can grant
  any access."
- **`cycle_predictions`, `personalized_insights`, and
  `user_pattern_insights` are snapshots, not sources of truth.** The live
  calculations (`src/lib/cycle-engine`, `src/lib/insights`,
  `src/lib/patterns`) always compute what a user actually sees; these
  tables just persist a queryable history of what was computed and when.
- **`content_articles` mirrors the pre-existing `pregnancy_week_content`
  governance pattern**: a `status` state machine
  (`draft → in_review → published → archived`) gates what non-admins can
  read via RLS, and `medical_reviewer` / `date_reviewed` exist so
  "published" is never a one-click action without a review trail.
- **`subscription_events` is a human-readable audit trail, not the
  idempotency ledger.** `stripe_webhook_events` (pre-existing, untouched)
  is the service-role-only dedupe table keyed by Stripe's event id;
  `subscription_events` is user-scoped, RLS-readable by its owner, and
  exists so a user (or support) can see "what happened to my subscription
  and when" without service-role access.
- **`ai_conversations` / `ai_messages` replaces a flat `assistant_messages`
  table.** Today the product only ever gives a user one conversation
  (`unique(user_id)` on `ai_conversations`), but splitting the thread out
  now means adding multiple conversations later is additive, not another
  migration.

## Privacy boundary (every table above)

Every table scoped to a user enforces `auth.uid() = user_id` (directly, or
via a join to a row that has it) in its RLS policy — a normal user's
`select`/`insert`/`update`/`delete` can never touch another user's rows,
enforced at the database layer regardless of what the application code
does. Catalog tables (`symptom_definitions`, `content_categories`,
`content_articles`) are readable by any authenticated user but writable
only by rows present in `admin_users`.
