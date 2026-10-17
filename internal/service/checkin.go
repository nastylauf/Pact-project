package service

import (
	"context"
	"sort"
	"time"

	"github.com/nastylauf/Pact-project/internal/domain"
)

type checkinStore interface {
	Create(context.Context, *domain.Checkin) (*domain.Checkin, error)
	GetByPactID(context.Context, string) ([]domain.Checkin, error)
}

type checkinPactStore interface {
	GetByID(context.Context, string) (*domain.Pact, error)
	UpdateProgress(context.Context, string, int, int, domain.PactStatus) error
}

type CheckinService struct {
	checkins checkinStore
	pacts    checkinPactStore
	clock    func() time.Time
}

func NewCheckinService(checkins checkinStore, pacts checkinPactStore) *CheckinService {
	return &CheckinService{checkins: checkins, pacts: pacts, clock: time.Now}
}

func (s *CheckinService) Create(
	ctx context.Context,
	userID string,
	pactID string,
	date time.Time,
	note string,
) (*domain.Checkin, error) {
	if len(note) > 2000 {
		return nil, domain.ErrInvalidInput
	}
	pact, err := s.pacts.GetByID(ctx, pactID)
	if err != nil {
		return nil, err
	}
	if pact.UserID != userID {
		return nil, domain.ErrForbidden
	}
	if err := pact.CanCheckIn(); err != nil {
		return nil, err
	}
	if date.IsZero() {
		date = s.clock()
	}
	date = dateOnly(date)
	if date.After(dateOnly(s.clock())) {
		return nil, domain.ErrCheckInInFuture
	}

	existing, err := s.checkins.GetByPactID(ctx, pactID)
	if err != nil {
		return nil, err
	}
	for _, checkin := range existing {
		if samePeriod(pact.Frequency, checkin.Date, date) {
			return nil, domain.ErrAlreadyCheckedIn
		}
	}

	created, err := s.checkins.Create(ctx, &domain.Checkin{
		PactID: pactID,
		UserID: userID,
		Date:   date,
		Note:   note,
	})
	if err != nil {
		return nil, err
	}
	existing = append(existing, *created)
	currentStreak, longestStreak := calculateStreak(pact.Frequency, existing)
	if err := s.pacts.UpdateProgress(ctx, pactID, currentStreak, longestStreak, pact.Status); err != nil {
		return nil, err
	}
	return created, nil
}

func (s *CheckinService) GetByPactID(ctx context.Context, userID, pactID string) ([]domain.Checkin, error) {
	pact, err := s.pacts.GetByID(ctx, pactID)
	if err != nil {
		return nil, err
	}
	if pact.UserID != userID {
		return nil, domain.ErrForbidden
	}
	return s.checkins.GetByPactID(ctx, pactID)
}

func calculateStreak(frequency domain.Frequency, checkins []domain.Checkin) (int, int) {
	if len(checkins) == 0 {
		return 0, 0
	}

	periods := make([]time.Time, 0, len(checkins))
	for _, checkin := range checkins {
		periods = append(periods, periodStart(frequency, checkin.Date))
	}
	sort.Slice(periods, func(i, j int) bool { return periods[i].Before(periods[j]) })

	unique := periods[:0]
	for _, period := range periods {
		if len(unique) == 0 || !period.Equal(unique[len(unique)-1]) {
			unique = append(unique, period)
		}
	}

	step := 1
	if frequency == domain.FrequencyWeekly {
		step = 7
	}
	currentStreak := 1
	longestStreak := 1
	for index := 1; index < len(unique); index++ {
		if unique[index].Equal(unique[index-1].AddDate(0, 0, step)) {
			currentStreak++
		} else {
			currentStreak = 1
		}
		if currentStreak > longestStreak {
			longestStreak = currentStreak
		}
	}
	return currentStreak, longestStreak
}

func samePeriod(frequency domain.Frequency, first, second time.Time) bool {
	return periodStart(frequency, first).Equal(periodStart(frequency, second))
}

func periodStart(frequency domain.Frequency, date time.Time) time.Time {
	date = dateOnly(date)
	if frequency != domain.FrequencyWeekly {
		return date
	}
	daysSinceMonday := (int(date.Weekday()) + 6) % 7
	return date.AddDate(0, 0, -daysSinceMonday)
}

func dateOnly(date time.Time) time.Time {
	date = date.UTC()
	return time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
}
