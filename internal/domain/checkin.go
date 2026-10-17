package domain

import "time"

type Checkin struct {
	ID        string
	PactID    string
	UserID    string
	Date      time.Time
	Note      string
	CreatedAt time.Time
}
