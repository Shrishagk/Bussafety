#!/usr/bin/env bash
# SafeRide AI — CI Test Runner
# Runs backend pytest + reports exit code.
# Frontend Jest tests run separately via: cd frontend && npm test -- --ci
set -euo pipefail

echo "══════════════════════════════════════════════"
echo "  SafeRide AI — CI Test Suite"
echo "══════════════════════════════════════════════"

# ── Backend tests ──────────────────────────────────────────────────────────
echo ""
echo "▶ Installing Python dependencies…"
pip install -r requirements.txt -q

echo ""
echo "▶ Running backend pytest…"
cd "$(dirname "$0")"
PYTHONPATH=. pytest backend/tests/ -v --tb=short

PYTEST_EXIT=$?
echo ""
if [ $PYTEST_EXIT -eq 0 ]; then
  echo "✅ Backend tests PASSED"
else
  echo "❌ Backend tests FAILED (exit $PYTEST_EXIT)"
  exit $PYTEST_EXIT
fi

# ── Frontend tests (optional, skip if node_modules not installed) ──────────
echo ""
if [ -d "frontend/node_modules" ]; then
  echo "▶ Running frontend Jest tests…"
  cd frontend
  npm test -- --ci --passWithNoTests
  JEST_EXIT=$?
  cd ..
  if [ $JEST_EXIT -eq 0 ]; then
    echo "✅ Frontend tests PASSED"
  else
    echo "❌ Frontend tests FAILED (exit $JEST_EXIT)"
    exit $JEST_EXIT
  fi
else
  echo "ℹ  Skipping frontend tests (node_modules not found — run npm install in frontend/)"
fi

echo ""
echo "══════════════════════════════════════════════"
echo "  ✅ All tests passed!"
echo "══════════════════════════════════════════════"
