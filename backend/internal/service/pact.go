package service

import (
	"context"
	"strings"
	"time"

	"github.com/nastylauf/Pact-project/internal/domain"
)

type pactStore interface {
	Create(context.Context, *domain.Pact) (*domain.Pact, error)
	GetByID(context.Context, string) (*domain.Pact, error)
	GetByUserID(context.Context, string) ([]domain.Pact, error)
	UpdateProgress(context.Context, string, int, int, domain.PactStatus) error
}

type NewPact struct {
	Title       string
	Description string
	Frequency   domain.Frequency
	StartDate   time.Time
	EndDate     *time.Time
}

type PactService struct {
	pacts pactStore
}

func NewPactService(pacts pactStore) *PactService {
	return &PactService{pacts: pacts}
}

func (s *PactService) Create(ctx context.Context, userID string, input NewPact) (*domain.Pact, error) {
	input.Title = strings.TrimSpace(input.Title)
	if userID == "" || input.Title == "" || len(input.Title) > 200 || len(input.Description) > 5000 {
		return nil, domain.ErrInvalidInput
	}
	if input.Frequency != domain.FrequencyDaily && input.Frequency != domain.FrequencyWeekly {
		return nil, domain.ErrInvalidInput
	}
	if input.StartDate.IsZero() {
		input.StartDate = time.Now().UTC()
	}
	if input.EndDate != nil && input.EndDate.Before(input.StartDate) {
		return nil, domain.ErrInvalidInput
	}

	return s.pacts.Create(ctx, &domain.Pact{
		UserID:      userID,
		Title:       input.Title,
		Description: strings.TrimSpace(input.Description),
		Frequency:   input.Frequency,
		Status:      domain.PactStatusActive,
		StartDate:   input.StartDate,
		EndDate:     input.EndDate,
	})
}

func (s *PactService) GetByID(ctx context.Context, userID, pactID string) (*domain.Pact, error) {
	pact, err := s.pacts.GetByID(ctx, pactID)
	if err != nil {
		return nil, err
	}
	if pact.UserID != userID {
		return nil, domain.ErrForbidden
	}
	return pact, nil
}

func (s *PactService) GetByUserID(ctx context.Context, userID string) ([]domain.Pact, error) {
	if userID == "" {
		return nil, domain.ErrInvalidInput
	}
	return s.pacts.GetByUserID(ctx, userID)
}

func (s *PactService) UpdateProgress(
	ctx context.Context,
	userID string,
	pactID string,
	currentStreak int,
	longestStreak int,
	status domain.PactStatus,
) error {
	pact, err := s.GetByID(ctx, userID, pactID)
	if err != nil {
		return err
	}
	if currentStreak < 0 || longestStreak < currentStreak || !validPactStatus(status) {
		return domain.ErrInvalidInput
	}
	if pact.Status != domain.PactStatusActive && status != pact.Status {
		return domain.ErrPactNotActive
	}
	return s.pacts.UpdateProgress(ctx, pactID, currentStreak, longestStreak, status)
}

func validPactStatus(status domain.PactStatus) bool {
	switch status {
	case domain.PactStatusActive, domain.PactStatusCompleted, domain.PactStatusFailed, domain.PactStatusArchived:
		return true
	default:
		return false
	}
}
