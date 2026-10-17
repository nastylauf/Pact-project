package domain

import "time"

type PactStatus string

const (
	PactStatusActive    PactStatus = "active"
	PactStatusCompleted PactStatus = "completed"
	PactStatusFailed    PactStatus = "failed"
	PactStatusArchived  PactStatus = "archived"
)

type Frequency string

const (
	FrequencyDaily  Frequency = "daily"
	FrequencyWeekly Frequency = "weekly"
)

type Pact struct {
	ID            string
	UserID        string
	Title         string
	Description   string
	Frequency     Frequency
	Status        PactStatus
	CurrentStreak int
	LongestStreak int
	StartDate     time.Time
	EndDate       *time.Time
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func (p *Pact) CanCheckIn() error {
	if p.Status != PactStatusActive {
		return ErrPactNotActive
	}
	return nil
}
