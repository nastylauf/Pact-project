package service

import (
	"testing"
	"time"

	"github.com/nastylauf/Pact-project/internal/domain"
)

func TestCalculateDailyStreak(t *testing.T) {
	checkins := []domain.Checkin{
		{Date: testDate(2026, time.October, 12)},
		{Date: testDate(2026, time.October, 13)},
		{Date: testDate(2026, time.October, 14)},
		{Date: testDate(2026, time.October, 17)},
	}

	current, longest := calculateStreak(domain.FrequencyDaily, checkins)
	if current != 1 || longest != 3 {
		t.Fatalf("calculateStreak() = (%d, %d), want (1, 3)", current, longest)
	}
}

func TestCalculateWeeklyStreakDeduplicatesWeeks(t *testing.T) {
	checkins := []domain.Checkin{
		{Date: testDate(2026, time.October, 5)},
		{Date: testDate(2026, time.October, 12)},
		{Date: testDate(2026, time.October, 14)},
		{Date: testDate(2026, time.October, 19)},
	}

	current, longest := calculateStreak(domain.FrequencyWeekly, checkins)
	if current != 3 || longest != 3 {
		t.Fatalf("calculateStreak() = (%d, %d), want (3, 3)", current, longest)
	}
}

func TestWeeklyCheckinsShareMondayBasedPeriod(t *testing.T) {
	monday := testDate(2026, time.October, 12)
	sunday := testDate(2026, time.October, 18)
	nextMonday := testDate(2026, time.October, 19)

	if !samePeriod(domain.FrequencyWeekly, monday, sunday) {
		t.Fatal("dates in the same Monday-based week should share a period")
	}
	if samePeriod(domain.FrequencyWeekly, monday, nextMonday) {
		t.Fatal("dates in consecutive weeks should not share a period")
	}
}

func testDate(year int, month time.Month, day int) time.Time {
	return time.Date(year, month, day, 0, 0, 0, 0, time.UTC)
}
