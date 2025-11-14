#!/bin/bash

echo "================================"
echo "Testing Evaluate Endpoint with Late Submission Penalty"
echo "================================"
echo ""

# Test data
SUBMISSION_ID="test-submission-late-123"
EVALUATOR_ID="test-evaluator-001"
BASE_POINTS="100"
MULTIPLIER="1.0"
COMMENTS="Testing late submission penalty deduction"

echo "📋 Test Configuration:"
echo "  - Submission ID: $SUBMISSION_ID"
echo "  - Evaluator ID: $EVALUATOR_ID"
echo "  - Base Points: $BASE_POINTS"
echo "  - Multiplier: $MULTIPLIER"
echo "  - Expected behavior: If is_late=true and late_penalty_applied > 0, deduct penalty"
echo ""

echo "⚠️  NOTE: This test requires a submission with:"
echo "  - is_late = TRUE"
echo "  - late_penalty_applied = 5, 10, or 15 (depending on late minutes)"
echo ""
echo "Run these SQL commands first to create test data:"
echo ""
cat << 'SQLTEST'
UPDATE submissions 
SET is_late = TRUE, late_penalty_applied = 5 
WHERE id = 'test-submission-late-123';
SQLTEST

echo ""
echo "Then call the endpoint:"
echo ""
echo "curl -X POST http://localhost:3000/api/evaluate \\"
echo "  -F \"submission_id=$SUBMISSION_ID\" \\"
echo "  -F \"evaluator_id=$EVALUATOR_ID\" \\"
echo "  -F \"base_points=$BASE_POINTS\" \\"
echo "  -F \"multiplier=$MULTIPLIER\" \\"
echo "  -F \"comments=$COMMENTS\""
echo ""
echo "✅ Expected Result:"
echo "  - Redirect to /evaluate"
echo "  - final_points should be: $BASE_POINTS - 5 = 95"
echo "  - Server logs should show: '⚠️ Late submission detected'"

