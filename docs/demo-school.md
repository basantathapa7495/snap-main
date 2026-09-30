# Sunrise Valley demo school

School: **Sunrise Valley Second Secondary School [DEMO]**. School ID:
`14474e95-6d11-44f5-a2ca-d8118af89388`. Slug: `demo-sunrise-valley`.
Marker: `nepsom-sunrise-demo-v1`. Supabase project: `opwsxpgrhyrjttomxetc`.
Initial history anchor: **2026-09-30**, academic year **2083 BS**.

This school has 180 fictional students, 20 fictional teachers, Classes 1–12,
sections A/B for Classes 9–12, 96 scheduled subject assignments, 45 calendar
days of attendance excluding Saturdays, six months of payments, two complete
published exams, one incomplete assessment and one upcoming exam. Admissions,
leave, notices, direct messages, events, activity and actual demo PDFs are seeded.

Principal logins use the existing `admin` role. All 20 teachers and five
representative students have approved Auth accounts. Two additional teacher
applicants exercise pending/rejected joining states. Those two have no profile
or teacher membership. The remaining students can receive portal logins through
the existing Principal controls. No real personal data or contact numbers are used.

## Login

Use `/auth/login`, select Principal, Teacher or Student, and use the matching
credentials from the separately delivered private login file. Approved emails:

- Principal: `principal@sunrise-demo.example.com`.
- Teachers: `teacher001` through `teacher020` at `sunrise-demo.example.com`.
- Students: `student001`, `student015`, `student061`, `student121`, `student180`
  at `sunrise-demo.example.com`.

Passwords are randomly generated through Auth Admin, never stored in application
tables and never committed. Do not publish the private login file. Demo email
addresses use the reserved example.com domain; email delivery/password reset
cannot be tested with these addresses. Joining codes exist through the existing
school trigger; joining remains off until enabled through the existing controls.

## Reproduce

From the repository root:

```sh
node scripts/demo/demo.mjs plan 2026-09-30
node scripts/demo/demo.mjs auth
node scripts/demo/demo.mjs seed
```

`auth` requires this project's `SUPABASE_URL` plus a server-only
`SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`. `seed` requires an
administrator PostgreSQL connection in `DEMO_DATABASE_URL` and `psql` installed.
Keep keys outside source control. The script refuses a different Auth project;
the SQL requires the exact marked Auth identities, so a mismatched database fails.

The first `plan` saves its anchor and manifest into ignored `.demo-runtime/`;
subsequent runs reuse it. If that directory is lost, pass the initial anchor
explicitly. Generated SQL uses only existing tables. UUIDs are deterministic;
reruns insert missing records without overwriting seeded or manually edited rows.
Seed transactions check ID ownership and fingerprint every other tenant in all
affected tables. Any difference aborts and rolls back the transaction.

For this initial setup only, the connected Supabase integration provisioned Auth
and storage through a fixed-project, fixed-account, expiring capability endpoint.
The endpoint was immediately replaced by a deny-all HTTP 410 function. The
reusable CLI uses the Admin API directly and needs no public seed endpoint.

## Reset generated data

```sh
NEPSOM_RESET_DEMO=nepsom-sunrise-demo-v1 node scripts/demo/demo.mjs reset
```

Reset has no school-ID parameter and only targets the fixed marked school.
It recreates generated module data, keeps the school and Auth accounts/passwords,
and reuses the five deterministic storage objects. It refuses unexpected members,
manual additions and foreign-key dependencies outside the generated manifest.
Do not broaden it to remove those guards. Review manual demo additions separately.

Published demo exams are cleared within the same administrator transaction using
the existing publication context; normal published-result protections remain intact.
No RLS policy, tenant rule or application permission is disabled by the seed/reset.

## Existing architecture considerations

- Principal fees use `fee_records` as received payments and calculate unpaid,
  partial and overdue balances from the fee types. `fee_payments` is not read by
  the current Principal/Reports pages, so duplicating payments there would be misleading.
- Principal results and student Grades use `exam_subjects`/`exam_marks`. The legacy
  `marks` table is unused by these flows and is deliberately left empty.
- Teacher attendance accepts present/absent/leave; student attendance additionally
  accepts late. Inactive teacher attendance stops on their departure date.
- Some Student pages, including Fees and Exams, still contain pre-existing static
  sample arrays. Seeding cannot connect those pages to live data; this task does
  not redesign or rewrite that portal. Student Grades uses the seeded records.
- Public website and teacher directory stay off. Events use school audience;
  published notices target teachers/students; documents are never public.

## Fixes required by populated-data verification

Three migrations preserve publication checks while returning `NEW` for valid
exam updates and branching safely on delete-trigger row types, and make two
unused legacy statistics/teacher RPCs obey existing RLS.
They were previously SECURITY DEFINER functions with no tenant check. No RLS
policy is weakened. Results and Students overview now paginate reads above
Supabase's 1,000-row response cap; the interface is unchanged.

## Verify

```sh
node --test tests/*.test.mjs
npx tsc --noEmit
npx eslint lib/load-all-rows.ts app/principal/results/page.tsx components/PrincipalStudentsOverview.tsx scripts/demo/*.mjs
node scripts/demo/verify.mjs
npm run build
```

Live verification requires `.env.local` with the project URL and publishable key,
and the private `.demo-runtime/credentials.json` from provisioning. It validates
all 28 sign-ins, profiles/approval gates, module counts and relationships,
attendance history, complete published results, payment states, private PDFs,
anonymous isolation and a student's own published marks. It writes a private
summary to `.demo-runtime/verification.json`. Credentials and sessions are excluded
from git. Cross-school RLS and reset are also tested in rollback-only SQL sessions.
