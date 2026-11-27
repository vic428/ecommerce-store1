# Roadmap

| Phase | Scope                                                                                                                 | Status |
| ----- | --------------------------------------------------------------------------------------------------------------------- | ------ |
| 0     | Repo, tooling, database schema, settings schemas, demo config/data, seed, docs                                        | Done   |
| 1     | Design system, theme from settings, layout (announcement, header, footer), homepage blocks                            | Next   |
| 2     | Shop listing, search, filters, sort, pagination, product page, cart, wishlist                                         | —      |
| 3     | Checkout, server-side pricing and stock, payment provider interface + mock, customer auth                             | —      |
| 4     | Admin: auth + roles, dashboard, products, categories, inventory, orders, customers, coupons, reviews, settings, users | —      |
| 5     | Full Playwright suites, accessibility, performance                                                                    | —      |
| 6     | CI pipeline, deployment guide                                                                                         | —      |
| 7     | First client store                                                                                                    | —      |

## Phase 0 notes

- Demo product images are referenced at `public/demo/products/<slug>.jpg` but not yet added;
  Phase 1 adds images (unbranded stock photos) and a placeholder fallback.
- Customer and admin sessions are designed as hashed-token rows in the database
  (`CustomerSession`, `AdminSession`); implemented in Phases 3 and 4.
