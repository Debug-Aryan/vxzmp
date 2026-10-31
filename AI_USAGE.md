# AI Tool Usage Disclosure

This project was developed for the **REint / GridBricks** internship assessment in accordance with the project transparency guidelines.

## 1. Tools Employed
- **ChatGPT (OpenAI)**: Consulted during Phase 0 for high-level market context research, initial architecture planning, and day-ahead wholesale electricity market cutoff evaluation.
- **Antigravity IDE (Google DeepMind)**: Utilized as the primary agentic pair-programming environment for code scaffolding, modular refactoring, test suite development, Tailwind CSS integration, and build verification.

## 2. Areas of AI Assistance
- **Architecture Planning**: Assisting with the breakdown of multi-stage development phases, dependency isolation, and Conventional Commit strategy.
- **Elexon BMRS Stream Integration**: Formulating the defensive HTTP client structure and parameter handling for `FUELHH` and `WINDFOR` streams.
- **Vectorized Data Analysis**: Leveraging Pandas to implement interval deduplication by `documentRevisionNumber`, anti-leakage cutoff filtering (`publishTime <= cutoff`), and numerical metric computation (MAE, RMSE, WAPE, Forecast Bias).
- **Frontend Refactoring**: Converting starter designs from TypeScript into a pure JavaScript React architecture, integrating Tailwind CSS via `@tailwindcss/vite`, and implementing custom interactive controls (`CustomSelect`, `CustomMonthPicker`).

## 3. Human & Engineering Verification
All generated code, analytical rules, and configurations were subject to rigorous manual review and testing:
- **Zero TypeScript Policy**: Verified that no `.ts`, `.tsx`, or `tsconfig.json` files exist in the active frontend.
- **Mathematical Integrity**: Validated the precision of MAE, RMSE, WAPE, and Bias against known test vectors in Pytest.
- **Live Ingestion Validation**: Validated against live Elexon BMRS data across development phases, distinguishing an initial single-day sanity probe (960 raw actual records across 20 fuel types, 48 wind records, and 4,672 forecast versions) from the comprehensive full-month January 2026 backtest (29,760 raw actual records yielding exactly 1,488 wind settlement outturns, and 22,192 forecast records across 744 hourly horizons).
- **Automated Testing**: 17 automated tests passing with 100% success rate across API validation, stream normalization, and edge case handling.

